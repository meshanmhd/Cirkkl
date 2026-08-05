import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturedEvents from "@/components/landing/FeaturedEvents";
import CategoriesSection from "@/components/landing/CategoriesSection";
import StatisticsSection from "@/components/landing/StatisticsSection";
import UpcomingEvents from "@/components/landing/UpcomingEvents";
import WhyCampusEvents from "@/components/landing/WhyCampusEvents";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedEvents />
        <CategoriesSection />
        <StatisticsSection />
        <UpcomingEvents />
        <WhyCampusEvents />
      </main>
      <Footer />
    </>
  );
}
