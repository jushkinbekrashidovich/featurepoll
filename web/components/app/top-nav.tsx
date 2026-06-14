"use client";

import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { Suspense } from "react";

interface AppTopNavProps {
  projects: { id: string; name: string }[];
  currentProjectId: string;
  userEmail: string;
  userAvatar?: string;
}

function TopNavContent({ projects, currentProjectId, userEmail, userAvatar }: AppTopNavProps) {
  const router = useRouter();

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "__create__") {
      router.push("/app");
      return;
    }
    router.push(`/app/${value}/home`);
  }

  const initial = userEmail?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-neutral-200 bg-white px-4">
      {/* Left: Logo + Project dropdown */}
      <div className="flex items-center gap-3">
        <a href="/app" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m17 11-5-5-5 5"/>
              <path d="m17 18-5-5-5 5"/>
            </svg>
          </span>
          <span className="text-[15px] font-bold text-text">Feature</span>
          <span className="text-[15px] font-bold text-accent -ml-1.5">Poll</span>
        </a>

        {projects.length > 0 && (
          <>
            <span className="text-neutral-300">/</span>
            <select
              value={currentProjectId}
              onChange={handleProjectChange}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-sm font-medium text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="__create__">+ New project</option>
            </select>
          </>
        )}
      </div>

      {/* Right: Settings + Avatar */}
      <div className="ml-auto flex items-center gap-3">
        <a
          href={`/app/${currentProjectId}/settings`}
          className="rounded-md p-1.5 text-text-muted hover:bg-neutral-100 hover:text-text transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </a>

        {userAvatar ? (
          <img
            src={userAvatar}
            alt="User avatar"
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {initial}
          </div>
        )}
      </div>
    </header>
  );
}

export function AppTopNav(props: AppTopNavProps) {
  return (
    <Suspense fallback={<TopNavSkeleton />}>
      <TopNavContent {...props} />
    </Suspense>
  );
}

function TopNavSkeleton() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-neutral-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="h-7 w-7 animate-pulse rounded-full bg-neutral-200" />
      </div>
    </header>
  );
}
