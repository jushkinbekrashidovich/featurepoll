# Design Document

## Introduction

This document describes the technical architecture for the FeaturePoll landing page — a static, SEO-optimized marketing page built with Next.js App Router and Tailwind CSS. The page lives in `/web/app/(marketing)/` and is designed for static rendering, dark mode support, and developer appeal. It captures waitlist emails via Supabase and demonstrates the product through a pure-CSS phone mockup.

## Architecture Overview

The landing page is a statically-rendered Next.js App Router application using React Server Components by default. Only the email capture form requires client-side interactivity. All content sections are server-rendered for SEO and performance.

```
/web
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx          ← Marketing layout (nav + footer)
│   │   ├── page.tsx            ← Landing page (Hero, Social, Features, Pricing)
│   │   └── opengraph-image.tsx ← OG image (generated or static)
│   ├── layout.tsx              ← Root layout (html, body, fonts, dark mode class)
│   └── globals.css             ← Tailwind directives + base styles
├── components/
│   ├── nav-bar.tsx             ← Server Component
│   ├── footer.tsx              ← Server Component
│   ├── hero-section.tsx        ← Server Component
│   ├── code-snippet.tsx        ← Server Component
│   ├── phone-mockup.tsx        ← Server Component
│   ├── email-capture-form.tsx  ← Client Component ("use client")
│   ├── social-proof-strip.tsx  ← Server Component
│   ├── features-section.tsx    ← Server Component
│   ├── pricing-section.tsx     ← Server Component
│   └── ui/
│       ├── button.tsx          ← Reusable button
│       └── badge.tsx           ← Reusable badge (status, "Most popular")
├── lib/
│   └── supabase.ts             ← Supabase client (browser client for form)
├── tailwind.config.ts          ← Brand tokens + dark mode config
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.local                  ← (gitignored, uses .env.example values)
```

## Component Architecture

### Server vs. Client Component Boundary

| Component | Type | Reason |
|-----------|------|--------|
| `layout.tsx` (root) | Server | Static shell, font loading, `<html>` attributes |
| `layout.tsx` (marketing) | Server | Wraps nav + footer around page content |
| `page.tsx` | Server | Assembles all sections, exports metadata |
| `nav-bar.tsx` | Server | Static links, no interactivity needed for desktop; mobile menu toggle handled via CSS (`:has`, checkbox hack) or a minimal client island |
| `footer.tsx` | Server | Static content |
| `hero-section.tsx` | Server | Static headline, code, and mockup |
| `code-snippet.tsx` | Server | Static code block rendering |
| `phone-mockup.tsx` | Server | Pure HTML/CSS, no JS needed |
| `email-capture-form.tsx` | **Client** | `"use client"` — form state, validation, Supabase mutation |
| `social-proof-strip.tsx` | Server | Static stats |
| `features-section.tsx` | Server | Static cards and FAQ |
| `pricing-section.tsx` | Server | Static tier cards |

Only `email-capture-form.tsx` (and optionally a mobile nav toggle) require the `"use client"` directive.

### Data Flow

```
[page.tsx (Server Component)]
    │
    ├── <NavBar />
    ├── <HeroSection>
    │       ├── <CodeSnippet />
    │       ├── <PhoneMockup />
    │       └── <EmailCaptureForm />  ← Client island
    │   </HeroSection>
    ├── <SocialProofStrip />
    ├── <FeaturesSection />
    ├── <PricingSection />
    └── <Footer />
```

## Brand Tokens & Tailwind Configuration

All brand tokens are centralized in `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#6366f1", // Indigo-500 — single accent color
          hover: "#4f46e5",   // Indigo-600
          light: "#eef2ff",   // Indigo-50 (backgrounds)
          dark: "#312e81",    // Indigo-900 (dark mode accents)
        },
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      spacing: {
        section: "6rem",    // Consistent section vertical padding
        container: "4rem",  // Container horizontal padding
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Dark Mode Implementation

Dark mode uses Tailwind's `class` strategy with automatic detection of `prefers-color-scheme`:

```typescript
// app/layout.tsx (Root layout)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to set dark class before paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

Components use Tailwind's `dark:` variant throughout:
```tsx
<div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
  ...
</div>
```

## Supabase Client Setup

The landing page uses a browser-side Supabase client for the email capture form (since it's a Client Component):

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Environment variables use the `NEXT_PUBLIC_` prefix so they're available in Client Components. The `.env.local` file (gitignored) holds the actual values; `.env.example` documents the required keys.

### Waitlist Table Schema

```sql
-- Expected in /backend/migrations
CREATE TABLE waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: anon users can insert only
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);
```

## Phone Mockup Approach

The phone mockup is a pure HTML/CSS component — no images for the device frame. It renders a simulated board with sample posts.

### Data Model

```typescript
// Types used by the phone mockup (defined in the component file)
type PostStatus = "open" | "planned" | "shipped";

interface MockPost {
  id: number;
  title: string;
  votes: number;
  status: PostStatus;
}

const SAMPLE_POSTS: MockPost[] = [
  { id: 1, title: "Dark mode support", votes: 47, status: "shipped" },
  { id: 2, title: "Export to CSV", votes: 32, status: "planned" },
  { id: 3, title: "Slack integration", votes: 18, status: "open" },
  { id: 4, title: "Custom categories", votes: 12, status: "open" },
];
```

### Rendering Strategy

```tsx
// components/phone-mockup.tsx (Server Component)
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] md:w-[320px]">
      {/* Phone frame — pure CSS */}
      <div className="rounded-[3rem] border-[12px] border-neutral-800 dark:border-neutral-600 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="mx-auto mt-2 h-6 w-28 rounded-full bg-neutral-800 dark:bg-neutral-600" />

        {/* Screen content — board UI */}
        <div className="px-4 py-3 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Feature Requests
          </h3>

          {SAMPLE_POSTS.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 p-2"
            >
              {/* Vote button */}
              <button className="flex flex-col items-center rounded bg-accent-light dark:bg-accent-dark/20 px-2 py-1 text-xs font-bold text-accent">
                <span>▲</span>
                <span>{post.votes}</span>
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {post.title}
                </p>
                <StatusBadge status={post.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

The frame uses `rounded-[3rem]`, thick borders, and shadow to simulate a phone. The inner board UI uses the same design tokens (accent color, neutrals, dark mode variants) so it matches the page theme automatically.

## Email Capture Form

```typescript
// components/email-capture-form.tsx
"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type FormState = "idle" | "submitting" | "success" | "error";

export function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      setState("error");
      return;
    }

    setState("submitting");
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim() });

    if (error) {
      setErrorMessage("Something went wrong. Please try again.");
      setState("error");
    } else {
      setState("success");
    }
  }

  if (state === "success") {
    return <p className="text-sm text-accent font-medium">You're on the list!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
        placeholder="you@example.com"
        className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm"
        required
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {state === "submitting" ? "Joining..." : "Join waitlist"}
      </button>
      {state === "error" && (
        <p className="text-sm text-red-500 col-span-full">{errorMessage}</p>
      )}
    </form>
  );
}
```

### Validation Logic

Email validation uses a simple regex pattern (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) on the client side. The form also uses `type="email"` for browser-native validation as a first layer.

**Validation rules:**
- Empty or whitespace-only → shows validation error, no network call
- Missing `@` or domain → shows validation error, no network call
- Valid format → submits to Supabase

## SEO & Metadata

Next.js App Router's `metadata` API is used for all SEO concerns:

```typescript
// app/(marketing)/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FeaturePoll — Native Flutter Feature Voting & In-App Feedback",
  description:
    "Add a native feature-request board to your Flutter app in 3 lines of code. Anonymous voting, no WebView, works offline.",
  keywords: ["Flutter feature voting", "in-app feedback", "feature request board", "mobile feedback SDK"],
  openGraph: {
    title: "FeaturePoll — Native Flutter Feature Voting",
    description: "Add a native feature-request board to your Flutter app in 3 lines of code.",
    url: "https://featurepoll.dev",
    siteName: "FeaturePoll",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FeaturePoll" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeaturePoll — Native Flutter Feature Voting",
    description: "Add a native feature-request board to your Flutter app in 3 lines of code.",
    images: ["/og-image.png"],
  },
};
```

The page uses semantic HTML structure:

```tsx
// app/(marketing)/page.tsx
export default function LandingPage() {
  return (
    <main>
      <section id="hero" aria-label="Hero">
        <HeroSection />
      </section>
      <section id="social-proof" aria-label="Social proof">
        <SocialProofStrip />
      </section>
      <section id="features" aria-label="Features">
        <FeaturesSection />
      </section>
      <section id="pricing" aria-label="Pricing">
        <PricingSection />
      </section>
    </main>
  );
}
```

The marketing layout wraps everything in `<header>` (nav) and `<footer>` semantic elements.

## Responsive Design Strategy

The page uses Tailwind's mobile-first approach:
- **Base styles** = mobile (320px+)
- **`md:` prefix** = tablet (768px+)
- **`lg:` prefix** = desktop (1024px+)

Key responsive breakpoints:
| Breakpoint | Nav | Hero layout | Phone mockup | Pricing |
|---|---|---|---|---|
| Mobile (<768px) | Hamburger menu | Single column, stacked | Scaled down, full width | Stacked cards |
| Tablet (768–1023px) | Full links | Two column (text + mockup) | Medium size | Side-by-side cards |
| Desktop (1024px+) | Full links + CTA | Two column with padding | Full size | Side-by-side cards |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid email format | Client-side regex check shows inline error; no network request made |
| Supabase insert fails | Catch error, display "Something went wrong. Please try again." message |
| Network timeout | Same as above — the Supabase client rejects, error state shown |
| Duplicate email | Supabase handles silently (insert succeeds or a unique constraint can be added later) |

## Interfaces

### Component Props

```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// components/ui/badge.tsx
interface BadgeProps {
  variant: "open" | "planned" | "shipped" | "popular";
  children: React.ReactNode;
}

// components/phone-mockup.tsx (internal)
interface MockPost {
  id: number;
  title: string;
  votes: number;
  status: "open" | "planned" | "shipped";
}
```

### Supabase Types

```typescript
// lib/supabase.ts (or a types file)
interface WaitlistRow {
  id: string;
  email: string;
  created_at: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Phone mockup posts render completely

For any sample post provided to the phone mockup component (with a title, vote count, and status), the rendered output must include a vote button displaying the numeric vote count AND a status badge showing one of the valid statuses ("open", "planned", or "shipped").

**Validates: Requirements 6.3, 6.4**

### Property 2: Valid email submission stores to Supabase

For any string that matches a valid email format (contains exactly one `@`, has a non-empty local part, and a non-empty domain with at least one dot), submitting it through the email capture form shall invoke the Supabase client to insert a record containing that exact email address.

**Validates: Requirements 7.2**

### Property 3: Invalid email rejection without network call

For any string that does NOT match a valid email format (empty, whitespace-only, missing `@`, missing domain, or malformed), submitting it through the email capture form shall display a validation error message and shall NOT invoke any Supabase client method.

**Validates: Requirements 7.4**

### Property 4: Semantic HTML wrapping for page sections

For any top-level content block rendered on the landing page, it must be wrapped in a semantic HTML element (`<header>`, `<main>`, `<section>`, or `<footer>`) with an appropriate aria-label or role for accessibility and crawlability.

**Validates: Requirements 13.6**
