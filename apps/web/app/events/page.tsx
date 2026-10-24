import ServerNavbar from "@/components/layout/ServerNavbar";
import Footer from "@/components/layout/Footer";
import EventsClient from "@/components/events/EventsClient";

export default function EventsPage() {
  return (
    <>
      <ServerNavbar />
      <EventsClient />
      <Footer />
    </>
  );
}
