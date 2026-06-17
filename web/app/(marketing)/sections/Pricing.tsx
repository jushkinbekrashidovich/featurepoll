const plans = [
  {
    name: "Free",
    description: "1 project · public board · community support",
    cta: "Try it for free",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "Native SDK · push notifications · remove branding · custom theming",
    cta: "Try it for free",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-surface border-y border-border py-20">
      <div className="mx-auto max-w-page px-6">
        <h2 className="text-2xl md:text-[32px] font-bold text-text text-center mb-3 leading-tight">
          Turn user feedback into product growth
        </h2>
        <p className="text-sm text-text-muted text-center mb-12">
          Start free, upgrade when you&apos;re ready.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto items-center">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-card border p-8 transition-all duration-200 hover:shadow-lg ${
                plan.highlighted
                  ? "border-accent border-2 relative scale-105 shadow-md bg-gradient-to-b from-white to-accent-tint/30"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-text mb-3">{plan.name}</h3>
              <p className="text-sm text-text-muted mb-6">{plan.description}</p>
              <a
                href="/login"
                className={`block text-center rounded-btn py-2.5 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "border border-border text-text hover:bg-muted"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
