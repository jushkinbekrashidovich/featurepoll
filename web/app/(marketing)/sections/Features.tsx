import { Smartphone, Globe, MessageCircle, BarChart3, Bell } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Native mobile board",
    body: "A real in-app board. No WebView — it inherits your app's theme and dark mode automatically.",
  },
  {
    icon: Globe,
    title: "Public board & roadmap",
    body: "A shareable web board, roadmap, and changelog — everything the web tools do, but yours.",
  },
  {
    icon: MessageCircle,
    title: "Telegram voting",
    body: "Collect votes from your community with one link. The interactive Google Form for feature requests.",
  },
  {
    icon: BarChart3,
    title: "Source insights",
    body: "See where each request comes from — app, web, or community — plus screen & version context.",
  },
  {
    icon: Bell,
    title: "Close the loop",
    body: "Notify voters when their feature ships — by push or Telegram, no email needed.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-page py-20 md:py-24">
      <div className="mx-auto max-w-page px-6">
        {/* Eyebrow + headline centered */}
        <p className="text-[13px] font-semibold uppercase tracking-wide text-accent mb-3 text-center">
          Features
        </p>
        <h2 className="text-2xl md:text-[32px] font-bold text-text text-center mb-14 leading-tight">
          Everything you need to listen and ship the right thing
        </h2>

        {/* 2-column card grid like datafa.st */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-border bg-surface p-6 pb-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Title + body at top */}
              <h3 className="text-[15px] font-semibold text-text mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed mb-5">
                {f.body}
              </p>

              {/* Visual preview area — mimics the screenshot/video areas in datafa.st */}
              <div className="rounded-lg bg-gradient-to-br from-accent-tint to-neutral-100 border border-border aspect-[16/9] flex items-center justify-center">
                <f.icon className="w-8 h-8 text-accent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
