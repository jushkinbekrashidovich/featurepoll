import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CHECK = "✓";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  variant: "primary" | "secondary";
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["1 project", "1 board", "FeaturePoll branding shown"],
    cta: "Start free",
    variant: "secondary",
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mo",
    features: [
      "Unlimited projects",
      "Push notifications — close the loop",
      "Remove branding",
      "Custom theming",
    ],
    cta: "Get Pro",
    variant: "primary",
    popular: true,
  },
];

export function PricingSection() {
  return (
    <div className="py-section">
      <div className="mx-auto max-w-page px-6 lg:px-container">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Simple, fair pricing
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            Start free, upgrade when you need more.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 shadow-sm ${
                tier.popular
                  ? "border-accent ring-2 ring-accent dark:border-accent dark:ring-accent"
                  : "border-neutral-200 dark:border-neutral-800"
              } bg-white dark:bg-neutral-900`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="popular">Most popular</Badge>
                </div>
              )}

              {/* Tier name */}
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                  {tier.price}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {tier.period}
                </span>
              </div>

              {/* Feature list */}
              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <span className="text-accent font-bold flex-shrink-0">
                      {CHECK}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                <Button
                  variant={tier.variant}
                  size="lg"
                  href="#"
                  className="w-full"
                >
                  {tier.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
