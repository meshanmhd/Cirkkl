"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function processAttendanceScan(eventId: string, ticketCode: string, orgId: string) {
  try {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 1. Verify organizer owns the event to prevent abuse
    const { data: event } = await adminSupabase.from('events').select('org_id').eq('id', eventId).single();
    if (!event || event.org_id !== orgId) {
      return { error: "Unauthorized" };
    }

    // 2. Find registration
    const { data: reg, error: regError } = await adminSupabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('ticket_code', ticketCode)
      .single();

    if (regError || !reg) {
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
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await adminSupabase.from('registrations').update({
      attended: true,
      attended_at: new Date().toISOString()
    }).eq('id', regId);
    
    return { success: true };
  } catch (error) {
    return { error: "Failed to mark attendance" };
  }
}
