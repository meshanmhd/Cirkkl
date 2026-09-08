'use server';

import { createClient } from '@/utils/supabase/server';

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

  const { data: reg, error: insertError } = await supabase
    .from('registrations')
    .insert({
      event_id: eventId,
      user_id: user.id,
      team_id: createdTeamId,
      custom_field_values: fieldValues,
      status: pendingStatus ? 'pending' : 'approved',
      ticket_code: finalTicketCode,
      transaction_id: transactionId || null,
      ticket_tier_id: ticketTierId || (ticketTypeCount === 1 ? firstTicketTypeId : null),
      payment_proof_url: paymentProofUrl,
    })
    .select('id')
    .single();

  if (insertError || !reg) {
    if (createdTeamId) {
      await supabase.from('teams').delete().eq('id', createdTeamId);
    }
    return {
      success: false,
      error: `Registration failed: ${insertError?.message ?? 'Unknown error'}`,
    };
  }

  if (!pendingStatus) {
    await supabase.from('notifications').insert({
      user_id: user.id,
      sender_id: user.id,
      event_id: eventId,
      type: 'registration_approved',
    });
  }

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
      await supabase.from('registrations').delete().eq('id', reg.id);
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

  return { success: true, registrationId: reg.id };
}
