"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-page/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-page px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m17 11-5-5-5 5"/>
                <path d="m17 18-5-5-5 5"/>
              </svg>
            </span>
            <span className="text-[17px] font-bold text-text">Feature</span>
            <span className="text-[17px] font-bold text-accent -ml-1.5">Poll</span>
          </a>

          {/* Desktop links + login */}
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
            <a
              href="/login"
              className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-text hover:border-text-muted transition-colors"
            >
              Log in
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-text-muted"
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-page">
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
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-text text-center hover:border-text-muted transition-colors mt-2"
            >
              Log in
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
