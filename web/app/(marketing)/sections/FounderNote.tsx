export function FounderNote() {
  return (
    <section className="bg-page py-20">
      <div className="mx-auto max-w-page px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-lg font-bold shrink-0">
            B
          </div>

          <div>
            <h2 className="text-lg font-bold text-text mb-1">Hey, I&apos;m Beck</h2>
            <p className="text-xs text-text-faint uppercase tracking-wide mb-4">Maker of FeaturePoll</p>
            <p className="text-sm text-text-muted leading-relaxed">
              I build mobile apps, and every feedback tool felt made for websites — a clunky web page stuffed inside my app, asking users to sign up just to vote. So I built the thing I wanted: a native board, anonymous voting, and one place to collect feedback from my app, my site, and my Telegram group.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
