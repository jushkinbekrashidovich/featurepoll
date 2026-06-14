"use client";

interface SimpleTopNavProps {
  userEmail: string;
  userAvatar?: string;
}

export function SimpleTopNav({ userEmail, userAvatar }: SimpleTopNavProps) {
  const initial = userEmail?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-neutral-200 bg-white px-4">
      {/* Left: Logo */}
      <a href="/app" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent text-white">
          <svg
            className="h-4 w-4"
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
        <span className="text-[15px] font-bold text-text">Feature</span>
        <span className="-ml-1.5 text-[15px] font-bold text-accent">Poll</span>
      </a>

      {/* Right: Avatar */}
      <div className="ml-auto flex items-center">
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
