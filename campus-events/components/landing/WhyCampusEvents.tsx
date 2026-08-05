import { Compass, CheckCircle, BellRing } from "lucide-react";

const FEATURES = [
  {
    Icon: Compass,
    color: "#cfe467",
    bg: "#EBF5FF",
    title: "Discover",
    description:
      "Browse hundreds of events across every category. Our smart filters help you find exactly what you're looking for in seconds.",
  },
  {
    Icon: CheckCircle,
    color: "#34C759",
    bg: "#F0FFF4",
    title: "Register",
    description:
      "One-click registration with your campus credentials. No extra signups, no forms — just instant confirmation.",
  },
  {
    Icon: BellRing,
    color: "#FF9500",
    bg: "#FFF8EE",
    title: "Stay Updated",
    description:
      "Get real-time notifications for event changes, reminders, and updates. Never miss another campus event again.",
  },
];

export default function WhyCampusEvents() {
  return (
    <section className="py-24 px-6" style={{ background: "#F7F7F8" }} id="about">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#cfe467" }}>
            Why Us
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#111111" }}>
            Your campus life, elevated.
          </h2>
          <p className="mt-4 text-[#6E6E73] max-w-lg mx-auto">
            Campus Events is designed to make discovering and participating in college activities effortless and enjoyable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, color, bg, title, description }, i) => (
            <div
              key={title}
              className="card-hover p-8 rounded-2xl bg-white"
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: bg }}
              >
                <Icon size={26} style={{ color }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#111111" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
