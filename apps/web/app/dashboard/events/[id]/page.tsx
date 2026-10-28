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

    const orgMembers = membersData.items.flatMap(m => [
      {
        id: m.userId,
        name: m.name,
        full_name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl,
      },
      {
        id: m.id,
        name: m.name,
        full_name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl,
      }
    ]);

    const mappedEvent = {
      ...event,
      end_date: event.endDate ?? (event as any).end_date,
      end_time: event.endTime ?? (event as any).end_time,
      location_type: event.locationType ?? (event as any).location_type,
      location_link: event.locationLink ?? (event as any).location_link,
      meeting_link: event.meetingLink ?? (event as any).meeting_link,
      poster_image: event.posterImage ?? (event as any).poster_image,
      image: event.image ?? (event as any).bannerUrl,
      price_amount: event.priceAmount ?? (event as any).price_amount,
      registration_deadline: event.registrationDeadline ?? (event as any).registration_deadline,
      registration_end_time: event.registrationEndTime ?? (event as any).registration_end_time,
      cancellation_policy: event.cancellationPolicy ?? (event as any).cancellation_policy,
      refund_policy: event.refundPolicy ?? (event as any).refund_policy,
      photography_policy: event.photographyPolicy ?? (event as any).photography_policy,
      approval_required: event.approvalRequired ?? (event as any).approval_required,
      is_team_event: event.isTeamEvent ?? (event as any).is_team_event,
      team_min_size: event.teamMinSize ?? (event as any).team_min_size,
      team_max_size: event.teamMaxSize ?? (event as any).team_max_size,
      custom_fields: event.customFields ?? (event as any).custom_fields,
      ticket_types: event.ticketTypes ?? (event as any).ticket_types,
    };

    return (
      <EventManagePage
        event={mappedEvent}
        registrations={registrations}
        profiles={profiles}
        orgMembers={orgMembers}
        eventRoles={eventRoles}
        eventId={id}
        teams={teams}
        teamMembers={teamMembers}
      />
    );
  } catch (error) {
    console.error("Failed to load event details:", error);
    notFound();
  }
}