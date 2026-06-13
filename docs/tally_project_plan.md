# Tally — Project Bible & Build Plan

*A native, anonymous feature-voting SDK for mobile apps. Flutter-first.*
*("Tally" is a working name — swap freely.)*

---

# PART 1 — PROJECT DESCRIPTION

## 1.1 One-liner
Tally lets mobile app developers add a feature-voting board to their app in three lines of code. Their users submit and upvote feature requests **without signing up**, the board renders as **native UI** (no WebView), and voters get **notified when their feature ships** — all anonymously.

## 1.2 The problem
Mobile developers want to know what to build next, but existing tools (features.vote, Canny, Frill) are **web-first**. On mobile they embed a WebView: a slow, off-theme, sign-in-walled web page stuffed inside the app. It breaks on bad connections, ignores dark mode, and forces account creation that kills participation. There is no good *mobile-native* feedback layer.

## 1.3 The solution
A real SDK — not a wrapped web page. The board is built from the host app's own native widgets, so it inherits theme, fonts, and dark mode automatically. Voting is anonymous (one device = one vote, no account). The SDK runs local-first (instant load, works offline, syncs later). Because it lives inside the app, it can capture context (which screen, OS, app version) and close the loop via push notifications.

## 1.4 Target users
- **Primary:** Indie Flutter developers and small mobile studios shipping consumer apps.
- **Secondary:** React Native developers (phase 2).
- **Buyer = builder.** They discover tools on pub.dev, GitHub, Reddit, and Product Hunt — not through sales calls. Distribution is developer-led, not B2B sales-led.

## 1.5 Differentiators (the moat — protect these)
1. **Truly native SDK** (no WebView). Inherits host theme/fonts/dark mode.
2. **In-context capture** — every request auto-tagged with screen, OS, app version.
3. **Anonymous push close-the-loop** — "the feature you voted for shipped" without ever collecting an email.
4. **2-minute, 3-line integration** — simplicity is a feature, defended ruthlessly.
5. **Open-source SDK, paid backend** — the client SDK is open (trust + GitHub stars); the hosted dashboard/API is the paid product.

## 1.6 Core concepts / glossary
- **Developer** — the person who installs the SDK; logs into the web dashboard. Has an account.
- **End user** — the app's user who votes. **Anonymous, no account.**
- **Project** — one app. Owns a board, a theme, and a publishable key.
- **Publishable key** — public API key shipped inside the app. Scoped: can only read/write its own project's board, never admin actions.
- **Post** — a feature request (title, description, status, vote count).
- **Vote** — one device's upvote on a post. Unique per (post, device).
- **Device** — anonymous identity (a UUID generated on first launch, stored locally). Optionally holds a push token.
- **Status** — `open` → `planned` → `in_progress` → `shipped` (or `declined`). Drives the roadmap view.

## 1.7 System architecture (4 components)
```
[ Flutter SDK ]  --publishable key-->  [ Backend API ]  <-->  [ Postgres DB ]
 (in user's app)                              ^
                                              |  developer login (real auth)
[ Web Dashboard ] ----------------------------+
 (Next.js)                                     |
                                               |
[ Landing Page ] (Next.js, mostly static) -----+ (marketing only)
```
- **Flutter SDK** — renders board, captures votes, caches locally, syncs. Talks to backend with the publishable key only.
- **Backend API** — validates publishable keys, serves board data, records votes, enforces per-project isolation, sends push.
- **Web Dashboard** — where developers create projects, get keys, read requests, change statuses, mark "shipped."
- **Landing Page** — marketing + docs + email capture. Static, fast, SEO-focused.

## 1.8 Data model (MVP)
- **developers** — `id`, `email`, `created_at` (handled by auth).
- **projects** — `id`, `developer_id`, `name`, `platform`, `publishable_key`, `theme_json`, `created_at`.
- **posts** — `id`, `project_id`, `title`, `description`, `status`, `vote_count` (denormalized), `device_id` (author), `screen_context`, `app_version`, `os`, `created_at`.
- **votes** — `id`, `post_id`, `device_id`, `created_at`. **Unique (post_id, device_id).**
- **devices** — `device_id` (uuid), `project_id`, `push_token` (nullable), `first_seen`.
- *(v2)* **comments**, **changelog_entries**, **tags**.

## 1.9 Tech stack (recommended)
- **Backend + DB:** Supabase — Postgres, auto REST API (PostgREST), Edge Functions for custom logic, Row Level Security (RLS) for per-project isolation. Free tier covers early growth.
- **Web (landing + dashboard):** Next.js + Tailwind. One codebase, great SEO for the landing page, deploy free on Vercel.
- **SDK:** pure Dart/Flutter package. `http` or `dio` for networking, `hive` or `sqflite` for local cache, `uuid` for device IDs.
- **Push:** Firebase Cloud Messaging (free), triggered from a Supabase Edge Function when status → `shipped`.
- **Two languages total:** Dart (SDK) + TypeScript (web). Clean separation.

## 1.10 Monetization
- **Free:** 1 project, 1 board, Tally branding shown.
- **Pro (~$15/mo):** unlimited projects, push close-the-loop, remove branding, theming.
- Flat-rate SaaS. Bill in USD. Near-zero marginal cost → ~85–90% margins.

## 1.11 Scope discipline
**MVP (v1) =** SDK (Flutter) + board UI + backend + publishable keys + a minimal dashboard (create project, get key, read posts, change status) + landing page. **That is the whole first release.**
**Explicitly v2+ (write down, do NOT build now):** React Native SDK, comments, changelog UI, analytics, Jira/Slack sync, AI summaries, team seats, custom domains.

## 1.12 Success metrics
- v1 ship: SDK live on pub.dev, 2–3 local apps integrated as design partners.
- 3 months post-launch: 100+ installs, first 5 paying developers.
- 12 months: $500–1,000 MRR, React Native shipped.

---

# PART 2 — HOW THIS MAPS TO KIRO

Kiro works from **steering files** (project-wide context, always loaded) and **specs** (one per feature: `requirements.md` → `design.md` → `tasks.md`). Use this document as the source for both.

## 2.1 Create your steering files first — `.kiro/steering/`
- **product.md** ← paste Part 1, sections 1.1–1.6 and 1.10–1.11. This is the "why/what."
- **tech.md** ← paste section 1.9 (stack) + 1.7 (architecture) + 1.8 (data model). This is the "how."
- **structure.md** ← your repo layout (suggested below). This keeps Kiro generating files in the right place.

Suggested repo structure for `structure.md`:
```
/tally
  /sdk          (Flutter package — open source, its own repo later)
  /backend      (Supabase: migrations, edge functions)
  /web          (Next.js: landing page + dashboard)
  /docs         (this plan, specs, notes)
```

## 2.2 Then create one spec per build group below — `.kiro/specs/`
Each **Group** in Part 3 = one Kiro spec. Feed Kiro the group's goal + task list; let it generate `requirements.md` (user stories with GIVEN/WHEN/THEN), review and refine, then let it generate `design.md` and `tasks.md`, and execute tasks one at a time.

## 2.3 Recommended build order
Your instinct to build the **landing page first is correct** — it's independent, validates demand, and collects emails while you build. So:
**Group 1 (landing, in parallel) → Group 2 (backend) → Group 3 (keys/projects) → Group 4 (SDK) → Group 5 (board UI) → Group 6 (dashboard) → Group 7 (push) → Group 8 (launch).**
Groups 2–5 are the critical path. Group 1 can run alongside everything.

---

# PART 3 — BUILD PLAN (grouped task lists)

> Each `[ ]` is a Kiro-task-sized chunk. Each group ends with a **Definition of Done**.

## GROUP 0 — Foundations & setup
**Goal:** repo, accounts, and steering files in place before any feature work.
- [ ] Create the monorepo with `/sdk`, `/backend`, `/web`, `/docs` folders.
- [ ] Initialize git + GitHub repo (SDK folder will be split to a public repo later).
- [ ] Create Supabase project; save URL + keys to a secrets manager (never commit them).
- [ ] Create Vercel project linked to `/web`.
- [ ] Set up Firebase project for FCM (push) — can defer config until Group 7.
- [ ] Write the three Kiro steering files (product.md, tech.md, structure.md).
- [ ] Decide the real product name + buy the domain.

**Definition of done:** `kiro` opens the repo, steering files load, empty apps run locally.

---

## GROUP 1 — Landing page
**Goal:** a fast, clean marketing page that explains the product and captures interested developers. Build this early for validation.

### 1A. Setup & shell
- [ ] Scaffold Next.js + Tailwind in `/web`, route `/` = landing.
- [ ] Define brand tokens: one accent color, fonts, spacing scale.
- [ ] Build the nav bar (logo, Features, Pricing, Docs, GitHub, "Get started").
- [ ] Build the footer.

### 1B. Hero section
- [ ] Headline + subhead ("Feature voting that lives inside your app").
- [ ] Side-by-side: code snippet block + phone mockup showing the board.
- [ ] Primary CTA ("Start free") + secondary ("Read the docs").
- [ ] **Email capture field** (stores to a waitlist table) — your validation tool.

### 1C. Social proof & stats strip
- [ ] Stats row: "2 min to integrate · 0 sign-ups · 100% native · offline."
- [ ] Testimonial slot (placeholder until you have a real one).
- [ ] "Used by" logo row (hidden until you have design partners).

### 1D. Features section ("how it works" + "why")
- [ ] Three benefit cards: Truly native / In-context capture / Close the loop.
- [ ] "Live in three steps" row (add package → drop key → open board).
- [ ] Short FAQ (Is it really anonymous? Does it slow my app? What data is stored?).

### 1E. Pricing section
- [ ] Two-tier pricing cards (Free / Pro $15), "Most popular" badge on Pro.

### 1F. Polish & ship
- [ ] Responsive pass (mobile, tablet, desktop).
- [ ] Dark mode.
- [ ] SEO: meta tags, OG image, titles targeting "Flutter feature voting," "in-app feedback Flutter."
- [ ] Deploy to Vercel on the real domain.

**Definition of done:** page is live, loads fast, looks clean on mobile, and email capture writes to the database.

---

## GROUP 2 — Backend & database
**Goal:** the source of truth — schema, isolation, and the API the SDK will call.

### 2A. Schema
- [ ] Create tables: `projects`, `posts`, `votes`, `devices` (per section 1.8).
- [ ] Add the unique constraint on `votes(post_id, device_id)`.
- [ ] Add `vote_count` to `posts` + a trigger to keep it in sync on insert/delete of votes.
- [ ] Seed a test project + sample posts for local development.

### 2B. Security & isolation (critical)
- [ ] Enable Row Level Security on all tables.
- [ ] Write RLS policies: a publishable key can only read/write rows where `project_id` matches that key's project.
- [ ] Ensure the publishable key can **never** perform admin actions (no status changes, no project edits).
- [ ] Rate-limit vote/post endpoints per device to stop abuse.

### 2C. SDK-facing API (Edge Functions or PostgREST)
- [ ] `GET /board` — return posts for a project (paginated, sorted by votes).
- [ ] `POST /posts` — submit a feature request (with screen/OS/version context).
- [ ] `POST /votes` — cast a vote (idempotent per device).
- [ ] `DELETE /votes` — remove a vote (toggle off).
- [ ] `POST /devices` — register/refresh a device + push token.
- [ ] Validate the publishable key on every request; reject unknown/disabled keys.

**Definition of done:** you can curl the API with a test key and read/post/vote, and one project cannot see another's data.

---

## GROUP 3 — API keys & project management (backend side)
**Goal:** developers can create projects and get a publishable key.

### 3A. Key system
- [ ] Generate a publishable key on project creation (prefixed, e.g. `tally_pk_…`).
- [ ] Store keys; support disabling/rotating a key.
- [ ] Map each key → exactly one project for the RLS policies in Group 2.

### 3B. Developer auth (dashboard only)
- [ ] Enable Supabase Auth (email magic link or OAuth) for developers.
- [ ] Create `developers` linkage; a developer owns many projects.
- [ ] Admin RLS: a developer can only manage their own projects/posts.

**Definition of done:** a logged-in developer can create a project and receive a working publishable key that the SDK can use.

---

## GROUP 4 — Flutter SDK package
**Goal:** the actual product developers install. Open source.

### 4A. Package skeleton
- [ ] Create the Dart package in `/sdk` with proper `pubspec.yaml`, README, license (MIT).
- [ ] Public API surface: `Tally.init(publishableKey)`, `Tally.openBoard(context)`.
- [ ] Config object: theme overrides, screen-context capture on/off.

### 4B. Networking layer
- [ ] HTTP client that attaches the publishable key to every request.
- [ ] Typed models for Post, Vote, Device.
- [ ] Error handling + retry on transient failures.

### 4C. Local-first cache & sync
- [ ] Generate + persist a device UUID on first launch (`uuid` + `hive`).
- [ ] Cache the board locally; render from cache instantly (stale-while-revalidate).
- [ ] Optimistic vote: update UI immediately, queue the request.
- [ ] Sync queue: flush pending votes/posts when connectivity returns.

### 4D. Context capture
- [ ] Auto-collect OS, app version (via `package_info_plus`), and current screen name.
- [ ] Attach context to new posts.
- [ ] Respect the "capture off" config flag (privacy).

**Definition of done:** in a test app, three lines of code open a working board backed by the real API, and votes survive offline → online.

---

## GROUP 5 — The voting board UI (inside the SDK)
**Goal:** the native screen end users see. This is the face of the product.

### 5A. Board screen
- [ ] List of posts sorted by votes, each with upvote button + count.
- [ ] Upvote/un-upvote interaction (optimistic, animated).
- [ ] Empty state ("No requests yet — be the first").
- [ ] Loading-from-cache state (no spinner if cache exists).

### 5B. Submit flow
- [ ] "Suggest a feature" button → simple sheet (title + optional description).
- [ ] Client-side validation, submit, show in list immediately.
- [ ] Duplicate-ish guard (optional: nudge if a similar title exists).

### 5C. Roadmap & status
- [ ] Status tabs/filter: Open / Planned / In progress / Shipped.
- [ ] Shipped items styled distinctly (the "we listened" moment).

### 5D. Theming
- [ ] Inherit host app `ThemeData` (colors, fonts, dark mode) by default.
- [ ] Allow overrides via the config object.
- [ ] Verify against light + dark + a couple of sample themes.

**Definition of done:** the board looks like it belongs in the host app, works in light/dark, and feels instant.

---

## GROUP 6 — Web dashboard (for developers)
**Goal:** where developers read feedback and act on it. Keep it to three things.

### 6A. Shell & auth
- [ ] Login/logout, protected routes under `/dashboard`.
- [ ] Project switcher; "Create project" flow that surfaces the publishable key + copy-paste install snippet.

### 6B. Board management (the core three tabs)
- [ ] **Board:** list incoming posts, sort by votes, see context (screen/OS/version).
- [ ] **Roadmap:** drag/set status (open → planned → in progress → shipped).
- [ ] **Changelog:** auto-list shipped items (read-only for MVP).

### 6C. Settings
- [ ] Theme settings for the board (passed to SDK via API).
- [ ] Key management (view, rotate, disable).
- [ ] Billing placeholder (wire real billing at/after launch).

**Definition of done:** a developer can read requests, mark one "shipped," and the change reflects in the SDK board.

---

## GROUP 7 — Close-the-loop / push notifications
**Goal:** the signature feature — notify anonymous voters when their feature ships.
- [ ] SDK: integrate FCM, capture push token, send via `POST /devices`.
- [ ] Backend: store device push tokens against votes.
- [ ] Edge Function: when a post status → `shipped`, find devices that voted for it.
- [ ] Send push: "The feature you voted for just shipped 🎉".
- [ ] Respect notification permission + provide an opt-out.

**Definition of done:** voting for a post on a device, then marking it shipped in the dashboard, delivers a push to that device — with no email ever collected.

---

## GROUP 8 — Launch & distribution
**Goal:** distribution is the real battle. Treat it as seriously as code.
- [ ] Polish the SDK README with GIFs + a copy-paste quickstart.
- [ ] Publish the package to pub.dev; verify the example app works from a clean install.
- [ ] Make the GitHub repo public; add issues templates, contributing guide.
- [ ] Get 2–3 local (Uzbek) apps integrated as design partners → logos + a real testimonial.
- [ ] Write 2–3 SEO posts: "in-app feedback in Flutter," "feature voting Flutter package," "collecting feature requests without sign-up."
- [ ] Product Hunt launch (assets, first comment, hunter lined up).
- [ ] Post in r/FlutterDev and Flutter communities (show, don't spam).
- [ ] Wire real billing (Stripe / Paddle) and turn on the Pro tier.

**Definition of done:** anyone can `flutter pub add tally`, follow the README, and have a live board in their app in under five minutes.

---

# QUICK-START CHECKLIST (this week)
- [ ] Lock the name + buy the domain.
- [ ] Write the three Kiro steering files from Part 1.
- [ ] Build + deploy the landing page (Group 1) with email capture.
- [ ] Stand up the Supabase schema (Group 2A) + a test project.
- [ ] Prove the loop: a throwaway Flutter app that reads the board from the real API.

*Everything after that follows the groups in order. Win Flutter deeply before touching React Native.*
