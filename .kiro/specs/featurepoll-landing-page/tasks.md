# Implementation Plan: FeaturePoll Landing Page

## Overview

Build the FeaturePoll marketing landing page as a statically-rendered Next.js App Router application in `/web`. The page uses Tailwind CSS with centralized brand tokens, supports dark mode via system preference, captures waitlist emails via Supabase, and demonstrates the product through a pure-CSS phone mockup. All components are Server Components except the email capture form.

## Tasks

- [x] 1. Scaffold Next.js project with Tailwind CSS and TypeScript
  - [x] 1.1 Initialize Next.js App Router project in `/web` with TypeScript
    - Run `create-next-app` with App Router, TypeScript, Tailwind CSS, and ESLint enabled
    - Ensure `package.json`, `tsconfig.json`, `next.config.ts` are created
    - Create `.env.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` placeholders
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Configure `tailwind.config.ts` with brand tokens
    - Define accent color palette (indigo-based), neutral scale, font families (Inter + JetBrains Mono), spacing scale, and max-width
    - Set `darkMode: "class"` strategy
    - Set content paths for `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Set up `globals.css` with Tailwind directives and base styles
    - Add `@tailwind base`, `@tailwind components`, `@tailwind utilities`
    - Add base body styles for light/dark mode
    - _Requirements: 2.1_

- [x] 2. Create root layout and marketing layout with dark mode
  - [x] 2.1 Implement root layout (`/web/app/layout.tsx`)
    - Add `<html lang="en" suppressHydrationWarning>` with Inter and JetBrains Mono font loading
    - Add inline `<script>` to detect `prefers-color-scheme: dark` and set `.dark` class before paint
    - Set body classes for light/dark background and text colors
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 2.2 Create marketing layout (`/web/app/(marketing)/layout.tsx`)
    - Wrap children with `<header>` (NavBar) and `<footer>` (Footer) semantic elements
    - _Requirements: 13.6_

  - [x] 2.3 Implement `nav-bar.tsx` component
    - Display FeaturePoll logo on the left
    - Add section links: Features, Pricing, Docs, GitHub
    - Add primary "Get started" CTA button
    - Implement mobile hamburger menu (CSS-only checkbox hack or `:has()` toggle)
    - Use `<nav>` semantic element
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.4 Implement `footer.tsx` component
    - Display FeaturePoll brand name and dynamic copyright year
    - Add links to GitHub, documentation, social profiles
    - Style consistently with brand tokens and minimal aesthetic
    - Use `<footer>` semantic element
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.5 Create reusable UI components (`button.tsx`, `badge.tsx`)
    - `Button` with `variant` (primary, secondary, ghost), `size`, optional `href` for link buttons
    - `Badge` with `variant` (open, planned, shipped, popular)
    - _Requirements: 2.2, 2.3_

- [x] 3. Checkpoint — Verify scaffold builds and renders
  - Ensure `npm run build` passes with no errors, ask the user if questions arise.

- [x] 4. Implement Hero Section with code snippet and phone mockup
  - [x] 4.1 Implement `hero-section.tsx` component
    - Display headline communicating FeaturePoll's core value proposition
    - Display subheadline with supporting detail
    - Compose `<CodeSnippet />`, `<PhoneMockup />`, and `<EmailCaptureForm />`
    - Add "Start free" primary CTA button and secondary "Read docs" link
    - Use two-column layout on desktop, single column stacked on mobile
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_

  - [x] 4.2 Implement `code-snippet.tsx` component
    - Render the three-line Flutter integration example with syntax highlighting via Tailwind classes
    - Use monospace font (`font-mono`) from brand tokens
    - Style with dark background, border, and rounded corners
    - _Requirements: 5.3, 2.4_

  - [x] 4.3 Implement `phone-mockup.tsx` component
    - Render realistic phone device frame using pure HTML/CSS (rounded corners, thick border, notch, shadow)
    - Display simulated board UI with at least 3 sample feature-request posts
    - Each post shows a vote button with vote count and a status badge (open, planned, shipped)
    - Support dark mode rendering with `dark:` variants
    - Responsive scaling across breakpoints
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 5. Implement Social Proof Strip
  - [x] 5.1 Implement `social-proof-strip.tsx` component
    - Display key metrics: "2 min to integrate", "0 sign-ups required", "100% native", "works offline"
    - Position below hero section
    - Include placeholder slot for testimonial quote (hidden or placeholder text)
    - Horizontal layout on desktop, grid on mobile
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 6. Implement Features Section
  - [x] 6.1 Implement `features-section.tsx` component
    - Display three benefit cards: "Truly native", "In-context capture", "Close the loop" with descriptions
    - Display "Live in three steps" row: add package → drop in the key → open the board
    - Display FAQ subsection with at minimum: "Is it really anonymous?", "Does it slow my app?", "What data is stored?"
    - Use scannable card layout with visual distinction between blocks
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 7. Implement Pricing Section
  - [x] 7.1 Implement `pricing-section.tsx` component
    - Display two pricing tier cards: Free and Pro ($15/month)
    - List included features for each tier (Free: 1 project, 1 board, FeaturePoll branding; Pro: unlimited projects, push notifications, remove branding, theming)
    - Highlight Pro tier with "Most popular" badge using the `Badge` component
    - Add CTA button on each card
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 8. Checkpoint — Verify all static sections render correctly
  - Ensure `npm run build` passes and the page renders all sections, ask the user if questions arise.

- [x] 9. Wire Supabase client and email capture form
  - [x] 9.1 Create Supabase client (`/web/lib/supabase.ts`)
    - Initialize browser-side Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - Install `@supabase/supabase-js` dependency
    - _Requirements: 7.7_

  - [x] 9.2 Implement `email-capture-form.tsx` client component
    - Add `"use client"` directive
    - Single email input field with submit button
    - Client-side email validation via regex before any network call
    - On valid submission: insert into `waitlist` table via Supabase client
    - Display success message ("You're on the list!") on successful insert
    - Display validation error for invalid email without network call
    - Display generic error message on Supabase failure
    - Handle loading/disabled state during submission
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.3 Write property tests for email capture form
    - **Property 2: Valid email submission stores to Supabase**
    - **Property 3: Invalid email rejection without network call**
    - **Validates: Requirements 7.2, 7.4**

- [x] 10. Add SEO metadata and OG image
  - [x] 10.1 Export `metadata` object from `/web/app/(marketing)/page.tsx`
    - Set page title targeting "Flutter feature voting" and "in-app feedback"
    - Set meta description summarizing value proposition
    - Set Open Graph tags (og:title, og:description, og:image, og:url, og:type)
    - Set Twitter Card meta tag (`summary_large_image`)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 10.2 Create OG image asset
    - Add `/web/public/og-image.png` placeholder (1200×630) or implement `/web/app/(marketing)/opengraph-image.tsx` for dynamic generation
    - _Requirements: 13.5_

  - [x] 10.3 Assemble landing page (`/web/app/(marketing)/page.tsx`) with semantic HTML
    - Compose all sections inside `<main>` with `<section>` wrappers and `aria-label` attributes
    - Ensure section IDs match nav link anchors (hero, features, pricing)
    - _Requirements: 13.6, 5.1_

- [x] 11. Responsive polish and final pass
  - [x] 11.1 Verify and refine responsive behavior across breakpoints
    - Mobile (320px–767px): single-column layouts, hamburger nav, stacked cards, scaled phone mockup
    - Tablet (768px–1023px): two-column hero, medium phone mockup, side-by-side pricing
    - Desktop (1024px+): full layout with generous whitespace
    - Ensure mobile-first approach (base styles = mobile, `md:` and `lg:` for larger)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 11.2 Verify dark mode consistency across all components
    - Ensure all text, icons, and interactive elements maintain sufficient contrast in both modes
    - Verify phone mockup adapts board UI colors to current theme
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 11.3 Write property test for phone mockup rendering
    - **Property 1: Phone mockup posts render completely**
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 11.4 Write property test for semantic HTML wrapping
    - **Property 4: Semantic HTML wrapping for page sections**
    - **Validates: Requirements 13.6**

- [x] 12. Final checkpoint — Ensure build passes and all sections are complete
  - Ensure `npm run build` passes with no errors, all sections render, dark mode works, and responsive layouts are correct. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Only `email-capture-form.tsx` needs `"use client"` — all other components are Server Components
- The Supabase waitlist table schema is expected in `/backend/migrations` (may already exist or be created separately)
- Environment variables must be set in `.env.local` before the email form works end-to-end

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.5"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1"] },
    { "id": 6, "tasks": ["9.1", "10.1", "10.2"] },
    { "id": 7, "tasks": ["9.2", "10.3"] },
    { "id": 8, "tasks": ["9.3", "11.1", "11.2"] },
    { "id": 9, "tasks": ["11.3", "11.4"] }
  ]
}
```
