const STATS = [
  { emphasis: "2 min", description: "to integrate" },
  { emphasis: "0", description: "sign-ups required" },
  { emphasis: "100%", description: "native" },
  { emphasis: "Works", description: "offline" },
];

export function SocialProofStrip() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-page px-6 lg:px-container py-12 lg:py-16">
        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {STATS.map((stat) => (
            <div key={stat.emphasis} className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stat.emphasis}
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Placeholder testimonial quote */}
        <p className="mt-8 text-center text-sm italic text-neutral-400 dark:text-neutral-500 hidden">
          — Coming soon from design partners
        </p>
      </div>
    </div>
  );
}
