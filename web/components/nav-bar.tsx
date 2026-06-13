import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "https://docs.featurepoll.dev", external: true },
  { label: "GitHub", href: "https://github.com/featurepoll", external: true },
];

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-page px-6 md:px-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="text-lg font-bold text-accent">
            FeaturePoll
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button variant="primary" size="sm" href="#hero">
              Get started
            </Button>
          </div>

          {/* Mobile menu toggle (CSS-only checkbox hack) */}
          <label
            htmlFor="nav-toggle"
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span className="block w-5 h-0.5 bg-neutral-700 dark:bg-neutral-300 mb-1" />
            <span className="block w-5 h-0.5 bg-neutral-700 dark:bg-neutral-300 mb-1" />
            <span className="block w-5 h-0.5 bg-neutral-700 dark:bg-neutral-300" />
          </label>
        </div>
      </div>

      {/* Hidden checkbox for CSS-only toggle */}
      <input type="checkbox" id="nav-toggle" className="peer hidden" aria-hidden="true" />

      {/* Mobile menu */}
      <div className="hidden peer-checked:block md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md">
        <div className="px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Button variant="primary" size="sm" href="#hero" className="w-full mt-2">
            Get started
          </Button>
        </div>
      </div>
    </nav>
  );
}
