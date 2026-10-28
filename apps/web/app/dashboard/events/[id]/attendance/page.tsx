import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import AttendanceScanner from "./AttendanceScanner";

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const event = await api.events.getForOrg(id);
    return <AttendanceScanner eventId={id} eventTitle={event.title} />;
  } catch {
    notFound();
  }
}
