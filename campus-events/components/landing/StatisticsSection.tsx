import { STATS } from "@/data/events";

export default function StatisticsSection() {
  return (
    <section
      className="py-24 px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #cfe467 0%, #b0c53e 50%, #b0c53e 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111111]">
            Trusted by thousands of students
          </h2>
          <p className="mt-3 text-blue-100 max-w-md mx-auto">
            Join the largest college event community in the country.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center p-8 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                className="stat-number text-5xl sm:text-6xl font-extrabold text-white mb-2"
                aria-label={stat.value}
              >
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-sm text-blue-200">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
