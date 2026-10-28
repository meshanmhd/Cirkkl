import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import ServerNavbar from "@/components/layout/ServerNavbar";
import Footer from "@/components/layout/Footer";
import EventsClient from "@/components/events/EventsClient";

export default async function EventsPage() {
  const auth = await getAuthContext();
  if (auth.role === "organisation" || auth.org) {
    redirect("/dashboard/events");
  }

  return (
    <>
      <ServerNavbar />
      <EventsClient />
      <Footer />
    </>
  );
}
