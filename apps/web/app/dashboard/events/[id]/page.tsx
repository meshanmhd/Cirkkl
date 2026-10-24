import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { EventManagePage } from "@/components/dashboard/EventManagePage";

export const dynamic = "force-dynamic";

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [event, regData, roleData, membersData] = await Promise.all([
      api.events.getForOrg(id),
      api.org.getEventRegistrations(id),
      api.org.getEventRoles(id),
      api.org.listMembers(),
    ]);

    const registrations = regData.items.map(r => ({
      id: r.id,
      user_id: r.userId,
      status: r.status,
      attended: r.attended,
      ticket_code: r.ticketCode,
      team_id: r.teamId,
      created_at: r.createdAt,
      payment_proof_url: r.paymentProofUrl,
      custom_field_values: r.fieldValues,
    }));

    const profiles = [
      ...regData.items.map(r => ({
        id: r.userId,
        full_name: r.userName,
        email: r.userEmail,
        phone: r.userPhone,
        ckl_id: r.cklId,
      })),
      ...regData.items.flatMap(r => r.teamMembers.map(tm => ({
        id: tm.userId,
        full_name: tm.name,
        email: tm.email,
        ckl_id: tm.cklId,
      }))),
    ];

    const teams = regData.items.filter(r => r.isTeam && r.teamId).map(r => ({
      id: r.teamId!,
      name: r.teamName || "Team",
      leader_id: r.teamLeaderId,
    }));

    const teamMembers = regData.items.flatMap(r => r.teamMembers.map(tm => ({
      id: tm.id,
      team_id: r.teamId,
      user_id: tm.userId,
      status: tm.status,
    })));

    const eventRoles = roleData.roles.map(r => ({
      id: r.id,
      user_id: r.userId,
      role: r.role,
      event_id: r.eventId,
    }));

    const orgMembers = membersData.items.map(m => ({
      id: m.userId,
      name: m.name,
      full_name: m.name,
      email: m.email,
      role: m.role,
      avatar_url: m.avatarUrl,
    }));

    return (
      <EventManagePage
        event={event}
        registrations={registrations}
        profiles={profiles}
        orgMembers={orgMembers}
        eventRoles={eventRoles}
        eventId={id}
        teams={teams}
        teamMembers={teamMembers}
      />
    );
  } catch {
    notFound();
  }
}