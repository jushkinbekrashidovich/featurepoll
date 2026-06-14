# Landing Page — Design & Build Spec (FeaturePoll)

*Drop this into `.kiro/specs/landing-page/` (e.g. as `design.md`). It tells Kiro exactly how to build the marketing landing page. Product name "FeaturePoll" is a placeholder — swap globally if it changes.*

---

## 1. Goal
A fast, clean, conversion-focused marketing page that sells FeaturePoll and captures interested developers via email. It is the selling page — every section either explains value or drives the primary action (start free / capture email).

Primary CTA (repeated): **"Add my app"** → sign-up / email capture.
Secondary CTA: **"Read the docs."**

## 2. Tech stack
- Next.js (App Router) + Tailwind CSS, in `/web`.
- Landing routes live under `/web/app/(marketing)`, statically rendered for speed + SEO.
- Deploy on Vercel. No client-side data fetching on the landing page except the email-capture POST.
- Icons: a lightweight set (e.g. lucide-react). No icon should be larger than 24px.

## 3. Design direction
The visual direction is **deliberately modeled on datafa.st** (the reference the founder chose): warm cream background, a single coral accent, bold tight headlines, generous whitespace, flat surfaces. This is an intentional brief-driven choice — do not substitute a different palette. Spend boldness on the headline + coral accent; keep everything else quiet and disciplined.

### 3.1 Color tokens (define in Tailwind config)
```
--bg-page:      #FBF7F2   /* warm cream, page background */
--bg-surface:   #FFFFFF   /* white cards / alternating sections */
--bg-muted:     #FAF6F0   /* subtle muted band (footer, table header) */
--border:       #EFE7DC   /* hairline borders */
--accent:       #E16540   /* coral — primary accent, buttons, links */
--accent-tint:  #FAECE7   /* coral tint — badges, step bubbles, icon chips */
--accent-text:  #993C1D   /* dark coral — text on coral tint */
--text:         #1A1A1A   /* primary text */
--text-muted:   #57534E   /* secondary text */
--text-faint:   #8A8279   /* captions, fine print */
--success:      #1D9E75   /* comparison check marks only */
```
Use the accent sparingly: buttons, links, the upvote arrow, eyebrows, and one icon color. Never fill large areas with coral except the final CTA band.

### 3.2 Typography
- One clean geometric/grotesque sans for everything (e.g. Inter, or General Sans / Satoshi if self-hosted). Load via `next/font` to avoid layout shift.
- Type scale: hero h1 34–40px / 700 / tracking -0.5px; section h2 24px / 700; card title 14–15px / 600; body 14–16px / 400, line-height 1.6–1.7; eyebrow 13px / 600 uppercase in coral; fine print 12px / faint.
- Sentence case everywhere. Headlines are short and punchy (datafa.st style), never more than ~6 words per line.

### 3.3 Layout & surfaces
- Max content width ~1080px, centered, comfortable side padding (24px mobile, more on desktop).
- Alternate section backgrounds: cream → white → cream to separate sections, divided by 1px `--border` lines. No heavy shadows; flat surfaces only.
- Radius: 11–12px on buttons and cards. Buttons are solid coral with white text, 600 weight; secondary buttons are white with a hairline border.
- A subtle device/phone + code mock visual in the hero proves the "3 lines" claim.

## 4. Page structure (build in this order, top to bottom)
Each section below lists purpose, layout, and the exact copy to ship.

### 4.1 Nav (sticky, transparent over cream)
- Left: coral logo mark + "FeaturePoll" (700).
- Right: Pricing · Features · FAQ · **Start free** (coral button).
- Collapses to a hamburger on mobile.

### 4.2 Hero (cream)
- Eyebrow badge: **"App · Web · Telegram — one board"** (coral tint pill).
- H1: **"Build what your users actually want"**
- Subhead: **"Collect feature requests and votes from inside your app, your website, and your community — all in one place. No sign-up for your users."**
- Primary CTA button: **"Add my app"**; under it, fine print **"Free plan · no card required"**.
- Social proof: overlapping avatar stack + **"Loved by 400+ makers"** (use a real/honest number; if pre-launch, replace with "Built in public — join early").
- Hero visual: dark code block (`FeaturePoll.init('key'); FeaturePoll.openBoard();`) beside a small phone showing a board with upvote counts.

### 4.3 How it works (white) — "Start collecting in 3 steps"
Eyebrow "HOW IT WORKS" + h2. Three columns, numbered 1–3 (numbering is justified here — it's a real sequence):
1. **Install or share** — "Add the SDK in 3 lines, or share one link to the web and Telegram."
2. **Users vote** — "They request and upvote features where they already are — no account needed."
3. **Ship & close loop** — "Build what's wanted, then notify every voter when it ships."

### 4.4 Features (cream) — "Everything you need to listen and ship the right thing"
Responsive card grid (2 cols desktop, 1 mobile). Each card: coral icon, title, one-line body.
- **Native mobile board** — "A real in-app board. No WebView — it inherits your app's theme and dark mode."
- **Public board & roadmap** — "A shareable web board, roadmap, and changelog — everything the web tools do."
- **Telegram voting** — "Collect votes from your community with one link. The interactive Google Form."
- **Source insights** — "See where each request comes from — app, web, or community — plus screen & version."
- **Close the loop** — "Notify voters when their feature ships — by push or Telegram, no email needed."

### 4.5 Testimonials (white)
Two quote cards (initials avatar + name + role). Placeholder copy until real ones exist — mark clearly as placeholder in code comments so they are not shipped as fake:
- "Dropped it into our Flutter app over lunch. Users started voting the same afternoon." — Aziz, indie dev.
- "Replaced our Google Form. Now the whole Telegram group just taps to vote." — Madina, studio founder.

### 4.6 Comparison (cream) — "How is it better than features.vote?"
A compact 3-column table (Feature | FeaturePoll | features.vote). Be honest — give the competitor a check where it genuinely qualifies:
| Feature | FeaturePoll | features.vote |
|---|---|---|
| Native mobile board | ✓ | ✗ |
| Telegram voting | ✓ | ✗ |
| Source insights | ✓ | ✗ |
| Public board & roadmap | ✓ | ✓ |
FeaturePoll column header in coral; checks in success green, crosses in faint gray.

### 4.7 Pricing (white) — "Simple, honest pricing"
Two cards, Pro highlighted with a 2px coral border + "Popular" badge:
- **Free — $0** · "1 project · public board".
- **Pro — $15/mo** · "Native SDK · Telegram · push · no branding".
Each card has a CTA button. (Wire real billing later; for now buttons route to sign-up.)

### 4.8 Founder note (cream)
Avatar (coral circle "B") + "Hey, I'm Beck" / "maker of FeaturePoll". Body:
"I build mobile apps, and every feedback tool felt made for websites — a clunky web page stuffed inside my app, asking users to sign up just to vote. So I built the thing I wanted: a native board, anonymous voting, and one place to collect feedback from my app, my site, and my Telegram group. I'm building it in public — come along."
This is the trust anchor for a pre-launch product; keep it personal and real.

### 4.9 Final CTA (coral band — the one bold color block)
- H2 (white): **"Find out what your users actually want"**
- Fine print (light coral): "Free plan · no card required"
- White button with coral text: **"Add my app"**

### 4.10 Footer (muted)
Logo + tagline **"One feedback tool for app, web & community"** + links (Pricing, Docs, Changelog, Blog) + copyright.

## 5. Email capture (validation tool)
- The hero and final CTA, pre-launch, should capture an email (single field + button) before routing to sign-up.
- POST to a `waitlist` table (Supabase) with email + timestamp + source section.
- Success state: inline confirmation in the interface's voice ("You're on the list — we'll email you at launch."). No fake delays, no apology copy on errors; on failure say what to do ("That didn't send — try again.").

## 6. Responsive & quality floor
- Fully responsive down to ~360px. Cards stack to one column; nav collapses to a menu.
- Visible keyboard focus rings; respect `prefers-reduced-motion`.
- Lighthouse: aim 95+ performance (static render, optimized fonts/images, no heavy JS).
- Dark mode is NOT required for the marketing page — it is intentionally a light cream brand surface. (The SDK board inherits dark mode; the marketing page does not.)

## 7. SEO
- `<title>`: "FeaturePoll — feature voting for app, web & Telegram".
- Meta description targeting the core promise + "Flutter", "in-app feedback", "feature voting".
- OG image (1200×630) + Twitter card.
- Semantic headings (one h1, section h2s). Target queries the incumbents don't own: "Flutter feature voting", "in-app feedback Flutter", "collect feature requests without sign-up", "feature voting Telegram".

## 8. File layout
```
/web/app/(marketing)/page.tsx        landing page composition
/web/app/(marketing)/sections/       Hero, HowItWorks, Features, Testimonials,
                                     Comparison, Pricing, FounderNote, FinalCTA
/web/components/                      Button, Badge, AvatarStack, SectionShell
/web/app/api/waitlist/route.ts       email capture endpoint
tailwind.config.ts                   color + type tokens from §3
```

## 9. Acceptance criteria (for Kiro tasks)
- GIVEN a visitor lands on `/`, WHEN the page loads, THEN the hero headline, subhead, primary CTA, and social proof are visible above the fold on desktop.
- GIVEN any section, WHEN viewed on a 360px screen, THEN content is single-column, readable, and no horizontal scroll occurs.
- GIVEN the email capture field, WHEN a valid email is submitted, THEN it is stored with its source and an inline success message appears; WHEN submission fails, THEN a clear retry message appears.
- GIVEN the comparison table, THEN FeaturePoll shows checks on the four listed rows and features.vote shows a check only on "Public board & roadmap".
- GIVEN Lighthouse runs on the deployed page, THEN performance and accessibility scores are ≥ 90.
- GIVEN the page source, THEN there is exactly one h1, valid OG/Twitter meta tags, and the target keywords appear in headings/meta.

## 10. Notes / honesty guardrails
- Do NOT ship fabricated metrics, testimonials, or logos. Use placeholders flagged in code, or swap to the build-in-public framing until real proof exists.
- Lead with the outcome headline; keep the multi-channel hook as the eyebrow + first feature, so pure-web buyers aren't scared off while mobile-native still differentiates.
- Plan for two hero-headline variants to A/B test post-launch (outcome-led vs. explicitly mobile-native).
