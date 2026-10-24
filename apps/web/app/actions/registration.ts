'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

function generateTicketId(userId: string, eventId: string): string {
  const raw = userId + eventId;
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  const part1 = h.toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
  let h2 = h ^ 0xdeadbeef;
  h2 = (h2 * 0x45d9f3b) >>> 0;
  const part2 = h2.toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
  return `CKL-${part1}${part2}`;
}

export async function acceptTeamInvite(teamId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to accept an invite.' };
  }

  const { data: existingRegs } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const existingReg = existingRegs && existingRegs.length > 0 ? existingRegs[0] : null;

  if (existingReg) {
    if (existingReg.status === 'rejected') {
      return { success: false, error: 'Your previous registration was rejected.' };
    }
    if (existingReg.status !== 'cancelled') {
      return { success: false, error: 'You are already registered for this event.' };
    }
  }

  // Get the team details to find the leader using admin client to bypass RLS for pending members
  const adminSupabase = createAdminClient();
  const { data: team, error: teamError } = await adminSupabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    return { success: false, error: 'Team not found.' };
  }

  // Get the leader's registration status for this event
  const { data: leaderReg, error: leaderError } = await adminSupabase
    .from('registrations')
    .select('status, ticket_tier_id')
    .eq('event_id', eventId)
    .eq('user_id', team.leader_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leaderError || !leaderReg) {
    return { success: false, error: 'Team leader is not registered for this event.' };
  }

  const finalTicketCode = generateTicketId(user.id, eventId);

  // Update team_members status
  const { error: tmError } = await supabase
    .from('team_members')
    .update({ status: 'approved' })
    .eq('team_id', teamId)
    .eq('user_id', user.id);

  if (tmError) {
    return { success: false, error: `Failed to update invite status: ${tmError.message}` };
  }

  return { success: true };
}

export type RegisterPayload = {
  eventId: string;
  fieldValues: Record<string, string>;
  transactionId: string;
  ticketTierId: string;
  paymentProofUrl: string | null;
  pendingStatus: boolean;
  isTeamEvent: boolean;
  teamName: string;
  teamMates: { id: string; name: string; ckl_id: string }[];
  ticketTypeCount: number;
  firstTicketTypeId: string | null;
};

export type RegisterResult =
  | { success: true; registrationId: string }
  | { success: false; error: string };

export async function registerForEvent(payload: RegisterPayload): Promise<RegisterResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to register.' };
  }

  const {
    eventId,
    fieldValues,
    transactionId,
    ticketTierId,
    paymentProofUrl,
    pendingStatus,
    isTeamEvent,
    teamName,
    teamMates,
    ticketTypeCount,
    firstTicketTypeId,
  } = payload;

  const finalTicketCode = generateTicketId(user.id, eventId);

  let createdTeamId: string | null = null;

  if (isTeamEvent && teamName) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        event_id: eventId,
        leader_id: user.id,
        name: teamName,
      })
      .select('id')
      .single();

    if (teamError || !team) {
      return {
        success: false,
        error: `Team creation failed: ${teamError?.message ?? 'Unknown error'}`,
      };
    }

    createdTeamId = team.id;
  }

  // Check if there is an existing cancelled registration for this user
  const { data: existingRegs } = await supabase
    .from('registrations')
    .select('id, status, ticket_code')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const existingReg = existingRegs && existingRegs.length > 0 ? existingRegs[0] : null;

  const newStatus = pendingStatus ? 'pending' : 'approved';

  let insertedReg;
  let insertError;

  if (existingReg) {
    if (existingReg.status === 'rejected') {
      if (createdTeamId) await supabase.from('teams').delete().eq('id', createdTeamId);
      return { success: false, error: 'Your previous registration was rejected.' };
    }

    // Update existing registration
    const { error } = await supabase
      .from('registrations')
      .update({
        team_id: createdTeamId,
        custom_field_values: fieldValues,
        status: newStatus,
        transaction_id: transactionId || null,
        ticket_tier_id: ticketTierId || (ticketTypeCount === 1 ? firstTicketTypeId : null),
        payment_proof_url: paymentProofUrl,
      })
      .eq('id', existingReg.id);

    insertedReg = { id: existingReg.id };
    insertError = error;
  } else {
    // Insert new registration
    const { data: reg, error } = await supabase
      .from('registrations')
      .insert({
        event_id: eventId,
        user_id: user.id,
        team_id: createdTeamId,
        custom_field_values: fieldValues,
        status: newStatus,
        ticket_code: finalTicketCode,
        transaction_id: transactionId || null,
        ticket_tier_id: ticketTierId || (ticketTypeCount === 1 ? firstTicketTypeId : null),
        payment_proof_url: paymentProofUrl,
      })
      .select('id')
      .single();

    insertedReg = reg;
    insertError = error;
  }

  if (insertError || !insertedReg) {
    if (createdTeamId) {
      await supabase.from('teams').delete().eq('id', createdTeamId);
    }
    return {
      success: false,
      error: `Registration failed: ${insertError?.message ?? 'Unknown error'}`,
    };
  }

  if (!pendingStatus) {
    const shouldSend = !existingReg || existingReg.status !== 'approved';
    if (shouldSend) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        sender_id: user.id,
        event_id: eventId,
        type: 'registration_approved',
      });
    }
  }

  // Delete all previous team_invite notifications sent by this user for this event.
  // This cleans up pending invites for users who might have been removed from the team 
  // in this updated registration, and prevents duplicates for users who are still in the team.
  await supabase
    .from('notifications')
    .delete()
    .eq('event_id', eventId)
    .eq('sender_id', user.id)
    .eq('type', 'team_invite');

  if (createdTeamId && teamMates.length > 0) {
    const memberInserts = teamMates.map((m) => ({
      team_id: createdTeamId,
      user_id: m.id,
      status: 'pending',
    }));

    const { error: memberError } = await supabase
      .from('team_members')
      .insert(memberInserts);

    if (memberError) {
      await supabase.from('teams').delete().eq('id', createdTeamId);
      await supabase.from('registrations').delete().eq('id', insertedReg?.id);
      return {
        success: false,
        error: `Failed to add team members: ${memberError.message}`,
      };
    }

    const notificationInserts = teamMates.map((m) => ({
      user_id: m.id,
      sender_id: user.id,
      event_id: eventId,
      team_id: createdTeamId,
      type: 'team_invite',
    }));

    await supabase.from('notifications').insert(notificationInserts);
  }

  return { success: true, registrationId: insertedReg?.id || '' };
}

export async function getUserTickets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const adminSupabase = createAdminClient();
  
  // 1. Fetch direct registrations
  const { data: directRegs } = await adminSupabase
    .from("registrations")
    .select("ticket_code, event_id, status, events(title)")
    .eq("user_id", user.id)
    .eq("status", "approved");

  // 2. Fetch team registrations where user is an approved team member
  const { data: teamRegs } = await adminSupabase
    .from("registrations")
    .select("ticket_code, event_id, status, events(title), team:teams!inner(id, team_members!inner(user_id, status))")
    .eq("team.team_members.user_id", user.id)
    .eq("team.team_members.status", "approved")
    .eq("status", "approved");

  const allEvents = new Map();

  if (directRegs) {
    directRegs.forEach((r: any) => {
      allEvents.set(r.event_id, {
        ticket_code: r.ticket_code,
        event_id: r.event_id,
        event_title: r.events?.title ?? "Untitled Event",
        status: r.status,
      });
    });
  }

  if (teamRegs) {
    teamRegs.forEach((r: any) => {
      allEvents.set(r.event_id, {
        ticket_code: r.ticket_code,
        event_id: r.event_id,
        event_title: r.events?.title ?? "Untitled Event",
        status: r.status,
      });
    });
  }

  return Array.from(allEvents.values());
}
