const BENEFITS = [
  {
    icon: "📱",
    title: "Truly native",
    description:
      "No WebView. Inherits your app's theme, fonts, and dark mode automatically.",
  },
  {
    icon: "📍",
    title: "In-context capture",
    description:
      "Every request auto-tagged with the screen it came from, OS, and app version.",
  },
  {
    icon: "🔔",
    title: "Close the loop",
    description:
      "Notify voters when their feature ships — no email needed, just push.",
  },
];

const STEPS = [
  {
    number: 1,
    label: "Add the package",
    code: "flutter pub add feature_poll",
  },
  {
    number: 2,
    label: "Drop in the key",
    code: "FeaturePoll.init('pk_...')",
  },
  {
    number: 3,
    label: "Open the board",
    code: "FeaturePoll.openBoard(context)",
  },
];

const FAQ = [
  {
    question: "Is it really anonymous?",
    answer:
      "Yes, only a random device UUID. No email, no account.",
  },
  {
    question: "Does it slow my app?",
    answer:
      "No. Local-first rendering, background sync. Under 1ms to show the board from cache.",
  },
  {
    question: "What data is stored?",
    answer:
      "Only feature titles, vote counts, and device UUIDs. No personal data.",
  },
];

export function FeaturesSection() {
  return (
    <div className="py-section">
      <div className="mx-auto max-w-page px-6 lg:px-container">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Why FeaturePoll
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Built for mobile developers who care about user experience
          </p>
        </div>

        {/* Benefit cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6 lg:p-8"
            >
              <div className="text-3xl mb-4">{benefit.icon}</div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {benefit.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Live in three steps */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-10">
            Live in three steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                    {step.number}
                  </span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {step.label}
                  </span>
                </div>
                <code className="block rounded-lg bg-neutral-900 dark:bg-neutral-950 px-4 py-3 text-sm font-mono text-neutral-100 overflow-x-auto">
                  {step.code}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-10">
            Frequently asked questions
          </h3>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="ml-2 text-neutral-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
