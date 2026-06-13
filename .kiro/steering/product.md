# Product — FeaturePoll

## What this is
FeaturePoll is a feature-voting SDK for mobile apps. Developers add a native feature-request board to their app in three lines of code. Their end users submit and upvote feature requests **without signing up**. The board renders as **native UI** (never a WebView), and voters are **notified when their requested feature ships** — all anonymously.

The Flutter package is named `feature_poll`. The product/brand is **FeaturePoll**.

## The problem we solve
Existing feedback tools (features.vote, Canny, Frill) are web-first. On mobile they embed a WebView — a slow, off-theme, sign-in-walled web page inside the app. It breaks on poor connections, ignores the app's theme and dark mode, and forces account creation that kills participation. There is no good mobile-native feedback layer. FeaturePoll is that layer.

## Who it's for
- **Primary:** indie Flutter developers and small mobile studios shipping consumer apps.
- **Secondary (later):** React Native developers, then native iOS/Android.
- The **buyer is the builder**. They find tools on pub.dev, GitHub, Reddit (r/FlutterDev), and Product Hunt — not via sales. Distribution is developer-led.

## Two distinct user types (never confuse these)
- **Developer** — installs the SDK, logs into the web dashboard, has a real account, manages projects and statuses.
- **End user** — the app's user who votes. **Anonymous. No account. Ever.** Identified only by a device-generated UUID.

## Differentiators (the moat — every decision must protect these)
1. **Truly native SDK** — no WebView. Inherits the host app's theme, fonts, and dark mode automatically.
2. **In-context capture** — every request auto-tagged with the screen it came from, OS, and app version.
3. **Anonymous push close-the-loop** — notify voters "the feature you voted for shipped" with no email, using the device push token.
4. **2-minute, 3-line integration** — simplicity is a core feature, defended ruthlessly.
5. **Open-source SDK, paid backend** — the client SDK is open (trust + GitHub stars); the hosted dashboard/API is the paid product.

## Core concepts
- **Project** — one app. Owns a board, a theme, and a publishable key.
- **Publishable key** — public API key shipped inside the app (safe to ship). Scoped so it can only read/write its own project's board, never admin actions.
- **Post** — a feature request (title, description, status, vote count).
- **Vote** — one device's upvote on a post. Unique per (post, device).
- **Device** — anonymous identity: a UUID generated on first launch, stored locally. May hold a push token.
- **Status** — `open` → `planned` → `in_progress` → `shipped` (or `declined`). Drives the roadmap and changelog.

## Monetization
- **Free:** 1 project, 1 board, FeaturePoll branding shown.
- **Pro (~$15/mo):** unlimited projects, push close-the-loop, remove branding, theming.
- Flat-rate SaaS, billed in USD. Near-zero marginal cost.

## Scope discipline (critical)
**MVP (v1) =** Flutter SDK + native board UI + backend + publishable keys + a minimal web dashboard (create project, get key, read posts, change status) + landing page. That is the entire first release.

**Explicitly OUT of v1 — do NOT build these now, even if tempting:** React Native SDK, native iOS/Android SDKs, comments, analytics, changelog editor, Jira/Slack sync, AI summaries, team seats, custom domains. These are v2+.

When a feature is ambiguous, prefer the simpler option and the one that protects the 3-line integration promise.

## Success metrics
- v1: SDK live on pub.dev; 2–3 real apps integrated as design partners.
- 3 months: 100+ installs; first 5 paying developers.
- 12 months: $500–1,000 MRR; React Native SDK shipped.
