const plans = [
  {
    name: "Free",
    price: "$0",
    description: "1 project · public board",
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$15/mo",
    description: "Native SDK · Telegram · push · no branding",
    cta: "Start Pro",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-surface border-y border-border py-20">
      <div className="mx-auto max-w-page px-6">
        <h2 className="text-2xl font-bold text-text text-center mb-3">
          Simple, honest pricing
        </h2>
        <p className="text-sm text-text-muted text-center mb-12">
          Start free, upgrade when you&apos;re ready.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-card border p-8 ${
                plan.highlighted
                  ? "border-accent border-2 relative"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-text mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold text-text mb-2">{plan.price}</p>
              <p className="text-sm text-text-muted mb-6">{plan.description}</p>
              <a
                href="#hero"
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
