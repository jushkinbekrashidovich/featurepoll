# Requirements Document

## Introduction

FeaturePoll Landing Page — a fast, minimal, SEO-optimized marketing page that explains the product, demonstrates the native board experience through a code-rendered phone mockup, and captures interested developer emails into a Supabase waitlist table. Built with Next.js App Router + Tailwind CSS in `/web/app/(marketing)/`, deployed on Vercel. The visual style is minimal and clean (Linear/Vercel aesthetic): generous whitespace, neutral tones, one accent color, and a developer-focused feel.

## Glossary

- **Landing_Page**: The static marketing page served at the root URL of the FeaturePoll web application, located in `/web/app/(marketing)/`.
- **Nav_Bar**: The top navigation component containing the logo, section links, and a primary call-to-action button.
- **Footer**: The bottom section of the page containing secondary links, copyright, and social references.
- **Hero_Section**: The prominent first-viewport area containing the headline, subheadline, code snippet, phone mockup, and email capture form.
- **Phone_Mockup**: A code-rendered (HTML/CSS) realistic phone frame displaying a simulated FeaturePoll board UI with posts, vote buttons, and status badges.
- **Email_Capture_Form**: An inline form that accepts an email address and stores it to the Supabase waitlist table.
- **Waitlist_Table**: A Supabase Postgres table that stores email addresses submitted through the Email_Capture_Form.
- **Supabase_Client**: The server-side or client-side Supabase JavaScript client configured to interact with the waitlist table.
- **Features_Section**: The page section describing product benefits, integration steps, and frequently asked questions.
- **Pricing_Section**: The page section displaying the Free and Pro tier pricing cards.
- **Social_Proof_Strip**: A horizontal section displaying key product stats and metrics.
- **Brand_Tokens**: The design system values (accent color, neutral palette, font choices, spacing scale) used consistently across the landing page.
- **OG_Metadata**: Open Graph meta tags and SEO metadata for search engine optimization and social sharing.

## Requirements

### Requirement 1: Project Scaffolding

**User Story:** As a developer building FeaturePoll, I want the landing page scaffolded with Next.js App Router and Tailwind CSS in the `/web` directory, so that I have a working development environment with the correct routing structure.

#### Acceptance Criteria

1. THE Landing_Page SHALL be built using Next.js App Router with TypeScript in the `/web` directory.
2. THE Landing_Page SHALL use Tailwind CSS for all styling.
3. THE Landing_Page SHALL serve the marketing page from the `/web/app/(marketing)/` route group.
4. THE Landing_Page SHALL be statically renderable for optimal load performance and SEO.

### Requirement 2: Brand Tokens & Visual Style

**User Story:** As a visitor, I want a clean, minimal visual style with a developer aesthetic, so that the page feels modern and trustworthy like Linear or Vercel.

#### Acceptance Criteria

1. THE Landing_Page SHALL use a minimal visual style with generous whitespace and neutral tones as the base palette.
2. THE Landing_Page SHALL use exactly one accent color for interactive elements, highlights, and primary call-to-action buttons.
3. THE Landing_Page SHALL define Brand_Tokens (accent color, neutral palette, font stack, spacing scale) in a centralized configuration usable across all components.
4. THE Landing_Page SHALL use a monospace or developer-oriented font for code-related elements.

### Requirement 3: Navigation Bar

**User Story:** As a visitor, I want a clear navigation bar with access to key sections and a primary action, so that I can explore the page and take action quickly.

#### Acceptance Criteria

1. THE Nav_Bar SHALL display the FeaturePoll logo on the left side.
2. THE Nav_Bar SHALL contain links to Features, Pricing, Docs, and GitHub sections.
3. THE Nav_Bar SHALL contain a primary "Get started" call-to-action button.
4. THE Nav_Bar SHALL remain visible and accessible across all viewport sizes.
5. WHEN the viewport is a mobile device width, THE Nav_Bar SHALL collapse navigation links into a mobile-friendly menu.

### Requirement 4: Footer

**User Story:** As a visitor, I want a footer with secondary links and brand information, so that I can find additional resources and trust the product.

#### Acceptance Criteria

1. THE Footer SHALL display the FeaturePoll brand name and copyright year.
2. THE Footer SHALL contain links to relevant resources (GitHub, documentation, social profiles).
3. THE Footer SHALL be visually consistent with the Brand_Tokens and minimal aesthetic.

### Requirement 5: Hero Section

**User Story:** As a visitor, I want to immediately understand what FeaturePoll does and see a visual demonstration, so that I can quickly evaluate whether it solves my problem.

#### Acceptance Criteria

1. THE Hero_Section SHALL display a clear headline communicating the core value proposition of FeaturePoll.
2. THE Hero_Section SHALL display a subheadline expanding on the headline with supporting detail.
3. THE Hero_Section SHALL display a code snippet block showing the three-line integration example.
4. THE Hero_Section SHALL display the Phone_Mockup alongside the code snippet block.
5. THE Hero_Section SHALL contain a primary call-to-action button labeled "Start free" or equivalent.
6. THE Hero_Section SHALL contain a secondary call-to-action linking to documentation.
7. THE Hero_Section SHALL contain the Email_Capture_Form for waitlist sign-up.

### Requirement 6: Code-Rendered Phone Mockup

**User Story:** As a visitor, I want to see a realistic phone frame showing the board UI, so that I can visualize how FeaturePoll looks inside a real app without relying on a static image.

#### Acceptance Criteria

1. THE Phone_Mockup SHALL render a realistic phone device frame using HTML and CSS only (no image placeholder).
2. THE Phone_Mockup SHALL display a simulated board UI inside the frame containing at least three sample feature-request posts.
3. THE Phone_Mockup SHALL display vote buttons with vote counts on each simulated post.
4. THE Phone_Mockup SHALL display status badges (open, planned, shipped) on simulated posts.
5. THE Phone_Mockup SHALL support both light and dark mode rendering consistent with the page theme.
6. THE Phone_Mockup SHALL be responsive, scaling appropriately across desktop, tablet, and mobile viewports.

### Requirement 7: Email Capture & Supabase Waitlist

**User Story:** As an interested developer, I want to submit my email to join the waitlist, so that I am notified when FeaturePoll launches.

#### Acceptance Criteria

1. THE Email_Capture_Form SHALL accept a single email address input field with a submit button.
2. WHEN a visitor submits a valid email address, THE Email_Capture_Form SHALL store the email in the Waitlist_Table via the Supabase_Client.
3. WHEN a visitor submits a valid email address successfully, THE Email_Capture_Form SHALL display a confirmation message indicating successful sign-up.
4. IF a visitor submits an invalid email format, THEN THE Email_Capture_Form SHALL display a validation error message without submitting to the database.
5. IF the Supabase_Client fails to store the email (network error or server error), THEN THE Email_Capture_Form SHALL display an error message informing the visitor to try again.
6. THE Waitlist_Table SHALL store the email address and a timestamp for each submission.
7. THE Supabase_Client SHALL be configured using environment variables for the Supabase URL and anon key, with secrets never committed to source control.

### Requirement 8: Social Proof & Stats Strip

**User Story:** As a visitor, I want to see key product stats at a glance, so that I can quickly understand the value proposition in concrete terms.

#### Acceptance Criteria

1. THE Social_Proof_Strip SHALL display key product metrics including: "2 min to integrate", "0 sign-ups required", "100% native", and "works offline".
2. THE Social_Proof_Strip SHALL be positioned below the Hero_Section for immediate visibility after the fold.
3. THE Social_Proof_Strip SHALL include a placeholder slot for a testimonial quote (initially hidden or with placeholder text until a real testimonial is available).

### Requirement 9: Features Section

**User Story:** As a visitor, I want to understand the key benefits and how integration works, so that I can evaluate whether FeaturePoll fits my needs.

#### Acceptance Criteria

1. THE Features_Section SHALL display three benefit cards: "Truly native" (no WebView), "In-context capture" (auto-tagged requests), and "Close the loop" (anonymous push notifications).
2. THE Features_Section SHALL display a "Live in three steps" row showing the integration process: add package, drop in the key, open the board.
3. THE Features_Section SHALL display a FAQ subsection answering at minimum: "Is it really anonymous?", "Does it slow my app?", and "What data is stored?".
4. THE Features_Section SHALL present content in a scannable layout using cards or distinct visual blocks.

### Requirement 10: Pricing Section

**User Story:** As a visitor, I want to see clear pricing tiers, so that I can understand the cost and decide which plan fits my use case.

#### Acceptance Criteria

1. THE Pricing_Section SHALL display two pricing tier cards: Free and Pro ($15/month).
2. THE Pricing_Section SHALL list included features for each tier (Free: 1 project, 1 board, FeaturePoll branding; Pro: unlimited projects, push notifications, remove branding, theming).
3. THE Pricing_Section SHALL visually highlight the Pro tier as the recommended option with a "Most popular" badge or equivalent indicator.
4. THE Pricing_Section SHALL include a call-to-action button on each pricing card.

### Requirement 11: Responsive Design

**User Story:** As a visitor on any device, I want the page to display correctly and be usable, so that I have a good experience regardless of screen size.

#### Acceptance Criteria

1. THE Landing_Page SHALL render correctly on mobile viewports (320px–767px width).
2. THE Landing_Page SHALL render correctly on tablet viewports (768px–1023px width).
3. THE Landing_Page SHALL render correctly on desktop viewports (1024px and above).
4. THE Landing_Page SHALL use a mobile-first responsive approach where layout adapts progressively for larger screens.

### Requirement 12: Dark Mode Support

**User Story:** As a visitor who prefers dark mode, I want the landing page to respect my system preference, so that the page is comfortable to view in low-light environments.

#### Acceptance Criteria

1. WHEN the visitor's system preference is set to dark mode, THE Landing_Page SHALL render in a dark color scheme.
2. WHEN the visitor's system preference is set to light mode, THE Landing_Page SHALL render in a light color scheme.
3. THE Landing_Page SHALL ensure all text, icons, and interactive elements maintain sufficient contrast in both light and dark modes.
4. THE Phone_Mockup SHALL adapt its simulated board UI colors to match the current page theme (light or dark).

### Requirement 13: SEO & Metadata

**User Story:** As the FeaturePoll team, I want the landing page to be optimized for search engines and social sharing, so that developers searching for "Flutter feature voting" or "in-app feedback Flutter" can discover the product.

#### Acceptance Criteria

1. THE Landing_Page SHALL include a descriptive page title targeting keywords "Flutter feature voting" and "in-app feedback."
2. THE Landing_Page SHALL include meta description tags summarizing the product value proposition.
3. THE Landing_Page SHALL include Open Graph meta tags (og:title, og:description, og:image, og:url) for rich social media previews.
4. THE Landing_Page SHALL include a Twitter Card meta tag for optimized Twitter sharing.
5. THE Landing_Page SHALL define an OG image asset suitable for social sharing.
6. THE Landing_Page SHALL use semantic HTML elements (header, main, section, footer) for accessibility and crawlability.
