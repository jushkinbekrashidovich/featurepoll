"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

interface MobileNavToggleProps {
  user: { name: string; avatarUrl?: string } | null;
}

export function MobileNavToggle({ user }: MobileNavToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 text-text-muted"
        aria-label="Toggle navigation menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 md:hidden border-t border-border bg-page">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                {link.label}
              </a>
            ))}
            {user ? (
              <a
                href="/app"
                onClick={() => setOpen(false)}
                className="block rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-accent/90 transition-colors mt-2"
              >
                Go to App
              </a>
            ) : (
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-accent/90 transition-colors mt-2"
              >
                Try it free
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
