import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturedEvents from "@/components/landing/FeaturedEvents";
import CategoriesSection from "@/components/landing/CategoriesSection";
import PartnersSection from "@/components/landing/PartnersSection";
import UpcomingEvents from "@/components/landing/UpcomingEvents";

export default function HomePage() {
  return (
    <>
      <Navbar />
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
