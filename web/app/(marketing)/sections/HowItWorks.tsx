import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: 1,
    title: "Install FeaturePoll",
    body: "Add the SDK to your Flutter app in under a minute. Three lines of code and you're live.",
  },
  {
    num: 2,
    title: "Users vote",
    body: "They request and upvote features where they already are — no account needed.",
  },
  {
    num: 3,
    title: "Ship & close loop",
    body: "Build what's wanted, then notify every voter when it ships via push.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface py-20 md:py-24">
      <div className="mx-auto max-w-page px-6">
        {/* Eyebrow + headline centered */}
        <p className="text-[13px] font-semibold uppercase tracking-wide text-accent mb-3 text-center">
          How it works?
        </p>
        <h2 className="text-2xl md:text-[32px] font-bold text-text text-center mb-14 leading-tight">
          Start collecting in 3 steps
        </h2>

        {/* 3-column cards with arrows between */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 items-start">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-start">
              {/* Card */}
              <div className="flex-1 transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-card p-3">
                {/* Image/visual placeholder area */}
                <div className="rounded-card bg-neutral-100 border border-border aspect-[4/3] mb-5 flex items-center justify-center overflow-hidden">
                  {step.num === 1 && (
                    <div className="bg-neutral-900 rounded-lg p-4 text-left font-mono text-xs text-neutral-100 leading-relaxed w-[85%]">
                      <div><span className="text-neutral-500">1</span> <span className="text-purple-400">import</span> <span className="text-green-300">&apos;feature_poll&apos;</span>;</div>
                      <div><span className="text-neutral-500">2</span> <span className="text-purple-400">await</span> FeaturePoll.<span className="text-green-300">init</span>(<span className="text-orange-300">&apos;key&apos;</span>);</div>
                      <div><span className="text-neutral-500">3</span> FeaturePoll.<span className="text-green-300">openBoard</span>();</div>
                    </div>
                  )}
                  {step.num === 2 && (
                    <div className="flex flex-wrap gap-3 justify-center items-center p-4">
                      <div className="w-12 h-12 rounded-xl bg-accent-tint flex items-center justify-center text-lg font-bold text-accent">▲</div>
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-lg">📱</div>
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-lg">🌐</div>
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-lg">✈️</div>
                    </div>
                  )}
                  {step.num === 3 && (
                    <div className="bg-white rounded-lg border border-border p-3 w-[85%] text-left">
                      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Roadmap</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text">Dark mode</span>
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Shipped</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text">Export CSV</span>
                          <span className="text-[10px] bg-accent-tint text-accent-text px-1.5 py-0.5 rounded font-medium">Planned</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text">Webhooks</span>
                          <span className="text-[10px] bg-neutral-100 text-text-muted px-1.5 py-0.5 rounded font-medium">Open</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title + body */}
                <h3 className="text-[15px] font-semibold text-text mb-1.5">
                  {step.num}. {step.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {step.body}
                </p>
              </div>

              {/* Arrow between cards (not after last) */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center px-4 pt-16">
                  <ArrowRight className="w-4 h-4 text-text-faint" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
