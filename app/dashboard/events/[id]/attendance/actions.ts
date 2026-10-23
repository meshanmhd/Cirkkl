"use server";

import { requireOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function processAttendanceScan(eventId: string, ticketCode: string) {
  try {
    const { org } = await requireOrg();
    const adminSupabase = createAdminClient();

    // 1. Verify organizer owns the event
    const { data: event, error: eventError } = await adminSupabase
      .from('events')
      .select('id, org_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event || event.org_id !== org.id) {
      return { error: "Unauthorized" };
    }

    // 2. Find registration and verify it belongs to this event
    const { data: reg, error: regError } = await adminSupabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('ticket_code', ticketCode)
      .single();

    if (regError || !reg || reg.event_id !== eventId) {
      return { error: "Not Registered" };
    }

    if (reg.status !== "approved") {
      return { error: `Registration is ${reg.status}`, registration: reg };
    }

    // 3. Get user details securely (bypassing the strict user RLS)
    const { data: user } = await adminSupabase
      .from('users')
      .select('full_name, email')
      .eq('id', reg.user_id)
      .single();

    return {
      success: true,
      registration: reg,
      user: user || { full_name: "Unknown User", email: "" }
    };
  } catch (error: any) {
    console.error("Scan error:", error);
    return { error: "Failed to process scan" };
  }
}

export async function confirmAttendance(regId: string) {
  try {
    const { org } = await requireOrg();
    const adminSupabase = createAdminClient();

    // 1. Find registration
    const { data: reg, error: regError } = await adminSupabase
      .from('registrations')
      .select('id, event_id')
      .eq('id', regId)
      .single();

    if (regError || !reg) {
      return { error: "Registration not found" };
    }

    // 2. Verify event belongs to the authenticated org
    const { data: event, error: eventError } = await adminSupabase
      .from('events')
      .select('id, org_id')
      .eq('id', reg.event_id)
      .single();

    if (eventError || !event || event.org_id !== org.id) {
      return { error: "Unauthorized" };
    }

    await adminSupabase.from('registrations').update({
      attended: true,
      attended_at: new Date().toISOString()
    }).eq('id', regId);

    return { success: true };
  } catch (error) {
    return { error: "Failed to mark attendance" };
  }
}
