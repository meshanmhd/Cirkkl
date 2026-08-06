import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DotField } from "@/components/ui/DotField";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 px-6">
      <div
        className="absolute inset-0 -z-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,122,255,0.08) 0%, transparent 70%), #F7F7F8",
        }}
      />
      <div
        className="absolute top-32 right-0 w-full h-full -z-20 opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 -z-10 pointer-events-none" style={{
        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.8) 60%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.8) 60%, black 100%)'
      }}>
        <DotField color="#cfe467" dotSize={4.5} dotSpacing={32} />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        <div className="animate-fade-up">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.06] tracking-tight"
            style={{ color: "#111111" }}
          >
            Discover
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #cfe467 0%, #e4f399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Everything
            </span>
            <br />
            <span style={{ color: "#111111" }}>on Campus</span>
          </h1>

          <p
            className="mt-6 text-lg leading-relaxed max-w-lg"
            style={{ color: "#6E6E73" }}
          >
            Find workshops, hackathons, cultural festivals, sports events,
            seminars, and club activities — all in one beautifully simple place.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              href="/events"
              id="hero-explore-cta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-[#111111] transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "#cfe467",
                boxShadow: "0 4px 20px rgba(207,228,103,0.35)",
              }}
            >
              Explore Events
            </Link>
            <a
              href="#clubs"
              id="hero-clubs-cta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                color: "#111111",
                background: "white",
                border: "1px solid #E5E5EA",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              Browse Clubs
            </a>
          </div>


        </div>


      </div>

      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
    </section>
  );
}

