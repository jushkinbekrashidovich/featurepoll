# Implementation Plan: FeaturePoll Web Dashboard

## Overview

Add an authenticated developer dashboard to the existing Next.js app at `/web/app/dashboard/`. The dashboard provides project management, feature request triaging (Board), status management (Roadmap), changelog view, and settings (theme, key management, billing placeholder). Uses `@supabase/ssr` for cookie-based auth, Server Actions for mutations, and Tailwind CSS with existing brand tokens.

## Tasks

- [x] 1. Install dependency and create Supabase client helpers
  - [x] 1.1 Install `@supabase/ssr` package and create Supabase client utilities
    - Run `npm install @supabase/ssr` in `/web`
    - Create `/web/lib/supabase/server.ts` — server client using `cookies()` API
    - Create `/web/lib/supabase/browser.ts` — singleton browser client for Client Components
    - Create `/web/lib/supabase/middleware.ts` — middleware client with session refresh and route protection logic
    - Create `/web/lib/types.ts` — shared TypeScript interfaces (`Project`, `Post`, `PostStatus`, `ThemeJson`)
    - _Requirements: 1.6, 2.3_

- [x] 2. Implement middleware and auth flow
  - [x] 2.1 Create route-protecting middleware at `/web/middleware.ts`
    - Import `updateSession` from `@/lib/supabase/middleware`
    - Configure matcher for `/dashboard/:path*`
    - Redirect unauthenticated users to `/dashboard/login`
    - Redirect authenticated users away from `/dashboard/login` to `/dashboard`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Create login page at `/web/app/dashboard/login/page.tsx`
    - Build login form with magic link email input and GitHub OAuth button
    - Handle Supabase `signInWithOtp` for magic link
    - Handle Supabase `signInWithOAuth` for GitHub
    - Display error messages from URL search params (redirected from callback)
    - Style with brand tokens (indigo accent, Inter font, neutral scale)
    - _Requirements: 1.1, 1.2, 1.3, 3.4_

  - [x] 2.3 Create auth callback route at `/web/app/dashboard/auth/callback/route.ts`
    - Handle GET request: exchange auth code for session
    - On success redirect to `/dashboard`
    - On error redirect to `/dashboard/login?error=<message>`
    - _Requirements: 1.4, 1.5_

- [x] 3. Checkpoint — Verify auth flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Dashboard layout and sidebar navigation
  - [x] 4.1 Create dashboard layout at `/web/app/dashboard/layout.tsx`
    - Server Component: fetch user and projects via Supabase server client
    - Redirect to login if no user
    - Render flex layout with Sidebar and main content area
    - _Requirements: 3.1, 3.4_

  - [x] 4.2 Create Sidebar component at `/web/components/dashboard/sidebar.tsx`
    - Client Component using `"use client"`
    - Navigation links: Board, Roadmap, Changelog, Settings
    - Active link highlighting using `usePathname`
    - Accept `projects` prop from layout
    - Embed ProjectSwitcher component
    - _Requirements: 3.2, 3.3_

  - [x] 4.3 Create dashboard root page at `/web/app/dashboard/page.tsx`
    - Redirect to `/dashboard/board` (default tab)
    - _Requirements: 3.1_

- [x] 5. Project switcher and create project flow
  - [x] 5.1 Create ProjectSwitcher component at `/web/components/dashboard/project-switcher.tsx`
    - Client Component with dropdown listing all developer projects
    - Display currently selected project name (from `?project=` search param)
    - On project select, navigate with updated `?project=<uuid>` param
    - Include "Create project" option at bottom of dropdown
    - Default to first project when no `?project` param present
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Create project Server Action at `/web/app/dashboard/actions/projects.ts`
    - Implement `createProject(name: string)` action
    - Generate `publishable_key` with `feature_poll_pk_` prefix
    - Insert project record with developer_id from auth
    - Call `revalidatePath("/dashboard")`
    - Return created project data
    - _Requirements: 5.2, 5.5_

  - [x] 5.3 Create CreateProjectModal component at `/web/components/dashboard/create-project-modal.tsx`
    - Client Component with modal overlay
    - Single name input + submit button
    - Call `createProject` Server Action on submit
    - On success: display publishable key + code snippet with copy buttons
    - On error: display error message, preserve input
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.4 Create CopyButton component at `/web/components/dashboard/copy-button.tsx`
    - Client Component using Clipboard API
    - Show copied confirmation state
    - _Requirements: 5.4_

- [x] 6. Board tab — post listing
  - [x] 6.1 Create Board page at `/web/app/dashboard/board/page.tsx`
    - Server Component reading `searchParams.project`
    - Fetch posts for active project sorted by `vote_count` descending
    - Render list of PostCard components
    - Show EmptyState when no posts
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 6.2 Create PostCard component at `/web/components/dashboard/post-card.tsx`
    - Display title, truncated description, vote count
    - Display context metadata: screen_context, os, app_version (when non-null)
    - _Requirements: 6.2_

  - [x] 6.3 Create EmptyState component at `/web/components/dashboard/empty-state.tsx`
    - Reusable component with icon, title, and description props
    - _Requirements: 6.3, 8.3_

- [x] 7. Roadmap tab — status management
  - [x] 7.1 Create Roadmap page at `/web/app/dashboard/roadmap/page.tsx`
    - Server Component fetching posts grouped by status
    - Render StatusColumn components for: Open, Planned, In Progress, Shipped, Declined
    - _Requirements: 7.1_

  - [x] 7.2 Create StatusColumn component at `/web/components/dashboard/status-column.tsx`
    - Display column header with status name and post count
    - Render post cards within the column
    - _Requirements: 7.1_

  - [x] 7.3 Create StatusDropdown component at `/web/components/dashboard/status-dropdown.tsx`
    - Client Component with dropdown for status transitions
    - Optimistic UI: update displayed status immediately
    - Call `updatePostStatus` Server Action
    - Revert on error with error toast
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 7.4 Create post Server Actions at `/web/app/dashboard/actions/posts.ts`
    - Implement `updatePostStatus(postId, status)` action
    - Validate status enum value
    - Update via Supabase client, revalidate `/dashboard/roadmap` and `/dashboard/changelog`
    - _Requirements: 7.2_

- [x] 8. Checkpoint — Verify board and roadmap
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Changelog tab
  - [x] 9.1 Create Changelog page at `/web/app/dashboard/changelog/page.tsx`
    - Server Component fetching posts with status `shipped` for active project
    - Display title, description, and created_at date for each
    - Show EmptyState when no shipped posts
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 10. Settings page — theme, key management, billing
  - [x] 10.1 Create Settings page at `/web/app/dashboard/settings/page.tsx`
    - Server Component fetching project settings for active project
    - Three sections: Theme, Key Management, Billing
    - _Requirements: 9.1, 10.1, 11.1_

  - [x] 10.2 Create ColorPicker component at `/web/components/dashboard/color-picker.tsx`
    - Client Component with color input
    - Pre-populate from current `theme_json.accent_color` or default
    - Call `updateThemeColor` Server Action on save
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.3 Create settings Server Actions at `/web/app/dashboard/actions/settings.ts`
    - Implement `updateThemeColor(projectId, color)` — update `theme_json`
    - Implement `rotateKey(projectId)` — call rotate-key Edge Function with Bearer JWT
    - Implement `toggleProjectActive(projectId, isActive)` — update `is_active` field
    - Revalidate `/dashboard/settings` after each mutation
    - _Requirements: 9.2, 10.2, 10.3, 10.4, 10.5_

  - [x] 10.4 Build Key Management section in Settings
    - Display current publishable key with CopyButton
    - "Rotate key" button calling `rotateKey` action, display new key on success
    - Active/inactive toggle calling `toggleProjectActive` action
    - Error handling: show error message, retain previous state on failure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 10.5 Build Billing placeholder section in Settings
    - "Coming soon" card with brief message
    - _Requirements: 11.1_

- [x] 11. Final checkpoint — Verify complete build
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All pages live under `/web/app/dashboard/`. Server Actions in `/web/app/dashboard/actions/`. Components in `/web/components/dashboard/`.
- The active project is tracked via `?project=<uuid>` URL search param — server-readable, bookmarkable, no client state overhead.
- `@supabase/supabase-js` is already installed. Only `@supabase/ssr` needs to be added.
- RLS policies (already deployed in backend migrations) handle data isolation — no additional auth checks needed beyond confirming the user is logged in.
- The design uses optimistic updates for status changes in the Roadmap tab — revert on failure with error toast.
- Brand tokens: indigo accent (`#6366f1`), Inter font, neutral color scale — same as landing page.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.4"] },
    { "id": 4, "tasks": ["5.3", "6.1", "6.2", "6.3"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 8, "tasks": ["10.4", "10.5"] }
  ]
}
```
