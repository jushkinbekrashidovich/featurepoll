"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rocket, Share2, Settings, ArrowUpCircle } from "lucide-react";

interface AppSidebarProps {
  projectSlug: string;
}

export function AppSidebar({ projectSlug }: AppSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: `/app/${projectSlug}/home`, label: "Home", icon: Home },
    { href: `/app/${projectSlug}/releases`, label: "Releases", icon: Rocket },
    { href: `/app/${projectSlug}/share`, label: "Integrate", icon: Share2 },
    { href: `/app/${projectSlug}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-neutral-200 bg-white">
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-tint text-accent-text"
                      : "text-text-muted hover:bg-neutral-50 hover:text-text"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade link at bottom */}
      <div className="border-t border-neutral-100 px-3 py-4">
        <a
          href="/app/upgrade"
          className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent-tint transition-colors"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Upgrade
        </a>
      </div>
    </aside>
  );
}
