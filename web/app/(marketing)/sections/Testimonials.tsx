/* TODO: Replace placeholder testimonials with real ones before launch */
const testimonials = [
  {
    initials: "A",
    name: "Aziz",
    role: "Indie dev",
    quote: "Dropped it into our Flutter app over lunch. Users started voting the same afternoon.",
  },
  {
    initials: "M",
    name: "Madina",
    role: "Studio founder",
    quote: "Replaced our Google Form. Now the whole Telegram group just taps to vote.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-surface border-y border-border py-20">
      <div className="mx-auto max-w-page px-6">
        <h2 className="text-2xl font-bold text-text text-center mb-12">
          What makers are saying
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-card border border-border bg-white p-6">
              <p className="text-sm text-text leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-tint flex items-center justify-center text-sm font-semibold text-accent-text">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{t.name}</p>
                  <p className="text-xs text-text-faint">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
