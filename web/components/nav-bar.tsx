import { createClient } from "@/lib/supabase/server";
import { MobileNavToggle } from "./mobile-nav-toggle";

const navLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export async function NavBar() {
  let user: { name: string; avatarUrl?: string } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      user = {
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "User",
        avatarUrl: authUser.user_metadata?.avatar_url,
      };
    }
  } catch {
    // Auth check failed — treat as not signed in
  }

  return (
    <nav className="sticky top-0 z-50 bg-page/80 backdrop-blur-md border-b border-border relative">
      <div className="mx-auto max-w-page px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center text-white">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m17 11-5-5-5 5" />
                <path d="m17 18-5-5-5 5" />
              </svg>
            </span>
            <span className="text-[17px] font-bold text-text">Feature</span>
            <span className="text-[17px] font-bold text-accent -ml-1.5">
              Poll
            </span>
          </a>

          {/* Desktop links + CTA / User info */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                {link.label}
              </a>
            ))}

            {user ? (
              <a
                href="/app"
                className="flex items-center gap-2 rounded-btn px-4 py-2 hover:bg-neutral-100 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium text-text">
                  {user.name}
                </span>
              </a>
            ) : (
              <a
                href="/login"
                className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                Try it free
              </a>
            )}
          </div>

          {/* Mobile toggle (client component) */}
          <MobileNavToggle user={user} />
        </div>
      </div>
    </nav>
  );
}
