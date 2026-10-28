"use server";

import { api } from "@/lib/api";

export async function processAttendanceScan(eventId: string, ticketCode: string) {
  try {
    const res = await api.org.scanAttendance(eventId, ticketCode);
    return {
      success: true,
      registration: {
        id: res.registrationId,
        status: "approved",
        attended: res.attended,
        ticket_code: res.ticketCode,
      },
      user: {
        full_name: res.participant.name,
        email: res.participant.email,
      },
    };
  } catch (error: any) {
    return { error: error.message || "Failed to process scan" };
  }
}

export async function confirmAttendance(eventId: string, regId: string) {
  try {
    const res = await api.org.confirmAttendance(eventId, regId);
    return { success: res.success };
  } catch (error: any) {
    return { error: error.message || "Failed to mark attendance" };
  }
}
