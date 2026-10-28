'use server';

import { api, getErrorMessage } from "@/lib/api";

export async function acceptTeamInvite(
  teamId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.registrations.acceptTeamInvite(teamId, eventId);
    return { success: res.success };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to accept invite.") };
  }
}

export async function declineTeamInvite(
  teamId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.registrations.declineTeamInvite(teamId, eventId);
    return { success: res.success };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to decline invite.") };
  }
}

export type RegisterPayload = {
  eventId: string;
  fieldValues?: Record<string, string>;
  transactionId?: string | null;
  ticketTierId?: string | null;
  paymentProofUrl?: string | null;
  paymentProofKey?: string | null;
  pendingStatus?: boolean;
  isTeamEvent?: boolean;
  teamName?: string;
  teamMates?: { id: string; name: string; ckl_id?: string; cklId?: string }[];
  ticketTypeCount?: number;
  firstTicketTypeId?: string | null;
};

export type RegisterResult =
  | { success: true; registrationId: string }
  | { success: false; error: string };

export async function registerForEvent(payload: RegisterPayload): Promise<RegisterResult> {
  try {
    const tierId = payload.ticketTierId || (payload.ticketTypeCount === 1 ? payload.firstTicketTypeId : null) || null;
    const proofKey = payload.paymentProofKey || payload.paymentProofUrl || null;
    const teamMates = (payload.teamMates || []).map((m) => ({
      id: m.id,
      name: m.name,
      cklId: m.ckl_id || m.cklId,
    }));

    const res = await api.registrations.register({
      eventId: payload.eventId,
      fieldValues: payload.fieldValues || {},
      transactionId: payload.transactionId || null,
      ticketTierId: tierId,
      paymentProofKey: proofKey,
      isTeamEvent: Boolean(payload.isTeamEvent),
      teamName: payload.teamName,
      teamMates,
    });

    return { success: true, registrationId: res.registrationId };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Registration failed.") };
  }
}

export async function getUserTickets() {
  try {
    const res = await api.registrations.myTickets();
    return (res.tickets || []).map((t) => ({
      ticket_code: t.ticketCode,
      event_id: t.eventId,
      event_title: t.eventTitle,
      status: t.status,
    }));
  } catch {
    return [];
  }
}
