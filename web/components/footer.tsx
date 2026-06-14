const footerLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
  { label: "Blog", href: "/blog" },
];

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="mx-auto max-w-page px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center text-white">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m17 11-5-5-5 5"/>
                  <path d="m17 18-5-5-5 5"/>
                </svg>
              </span>
              <span className="text-sm font-bold text-text">Feature</span>
              <span className="text-sm font-bold text-accent -ml-1">Poll</span>
            </div>
            <p className="text-xs text-text-faint">One feedback tool for app, web &amp; community</p>
          </div>

          {/* Links */}
          <nav aria-label="Footer links">
            <ul className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-faint">
            &copy; {new Date().getFullYear()} FeaturePoll. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
