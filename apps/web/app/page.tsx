import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import ServerNavbar from "@/components/layout/ServerNavbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturedEvents from "@/components/landing/FeaturedEvents";
import CategoriesSection from "@/components/landing/CategoriesSection";
import PartnersSection from "@/components/landing/PartnersSection";
import UpcomingEvents from "@/components/landing/UpcomingEvents";

export default async function HomePage() {
  const auth = await getAuthContext();
  if (auth.role === "organisation" || auth.org) {
    redirect("/dashboard/events");
  }

  return (
    <>
      <ServerNavbar />
      <main>
        <HeroSection />
        <FeaturedEvents />
        <UpcomingEvents />
        <CategoriesSection />
        <PartnersSection />
      </main>
      <Footer />
    </>
  );
}
