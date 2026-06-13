# Requirements Document

## Introduction

The FeaturePoll Web Dashboard is the developer-facing application where authenticated developers create projects, obtain publishable keys, manage incoming feature requests, update post statuses, and configure project settings. It lives at `/web/app/dashboard/` in the Next.js App Router codebase, uses Supabase Auth (magic link + GitHub OAuth) for authentication, and shares brand tokens (indigo accent, Inter font, neutral scale) with the landing page. The dashboard provides an app-like layout with sidebar navigation, a project switcher, and three core management areas: Board, Roadmap, and Settings.

## Glossary

- **Dashboard**: The authenticated web application at `/dashboard` where developers manage their FeaturePoll projects.
- **Developer**: An authenticated user who owns projects and manages feature requests via the Dashboard.
- **Project**: A named entity representing one app. Owns a publishable key, posts, and theme configuration.
- **Publishable_Key**: A prefixed string (`feature_poll_pk_…`) scoped to one project, used by the SDK to identify which project board to interact with.
- **Post**: A feature request submitted by an end user via the SDK, containing title, description, status, vote count, and device context.
- **Status**: The lifecycle state of a post: `open`, `planned`, `in_progress`, `shipped`, or `declined`.
- **Sidebar**: The persistent navigation panel on the left side of the Dashboard layout containing the project switcher and navigation links.
- **Auth_Callback**: The route that handles the redirect after a successful Supabase Auth login (magic link or OAuth).
- **Supabase_Client**: The server-side Supabase client (`@supabase/ssr`) that uses the developer's JWT and relies on RLS for data scoping.
- **Theme_JSON**: A JSON column on the `projects` table storing board accent color configuration.
- **Rotate_Key_Function**: The Supabase Edge Function at `/functions/v1/rotate-key` that generates a new publishable key for a project.

## Requirements

### Requirement 1: Developer Authentication

**User Story:** As a developer, I want to log in to the Dashboard using magic link or GitHub OAuth, so that I can securely access my projects.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a login page at the `/dashboard/login` route with options for magic link email entry and GitHub OAuth sign-in.
2. WHEN a developer submits a valid email address on the login page, THE Dashboard SHALL trigger a Supabase Auth magic link email to that address.
3. WHEN a developer clicks the GitHub OAuth button, THE Dashboard SHALL initiate the Supabase Auth GitHub OAuth flow redirecting to GitHub for authorization.
4. WHEN Supabase Auth completes authentication successfully, THE Auth_Callback handler SHALL exchange the auth code for a session and redirect the developer to `/dashboard`.
5. IF the authentication flow fails or returns an error, THEN THE Auth_Callback handler SHALL redirect the developer to `/dashboard/login` with an error message displayed.
6. THE Dashboard SHALL store the authenticated session using `@supabase/ssr` server-side cookies so that subsequent requests include the developer's JWT.

### Requirement 2: Route Protection

**User Story:** As a developer, I want unauthenticated users to be redirected to the login page, so that my project data remains secure.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route under `/dashboard` (excluding `/dashboard/login`), THE Dashboard SHALL redirect the user to `/dashboard/login`.
2. WHEN an authenticated developer navigates to `/dashboard/login`, THE Dashboard SHALL redirect the developer to `/dashboard`.
3. THE Dashboard SHALL validate the session on the server side using the Supabase_Client before rendering any protected page.

### Requirement 3: Dashboard Layout and Sidebar Navigation

**User Story:** As a developer, I want an app-like layout with persistent sidebar navigation, so that I can efficiently navigate between dashboard sections.

#### Acceptance Criteria

1. THE Dashboard SHALL render a layout with a persistent Sidebar on the left and a main content area on the right.
2. THE Sidebar SHALL contain navigation links for: Board, Roadmap, Changelog, and Settings.
3. WHEN a developer clicks a navigation link in the Sidebar, THE Dashboard SHALL navigate to the corresponding section and visually indicate the active link.
4. THE Dashboard layout SHALL use the same brand tokens as the landing page: indigo accent color (`#6366f1`), Inter font, and the neutral color scale.

### Requirement 4: Project Switcher

**User Story:** As a developer, I want to switch between my projects from the sidebar, so that I can manage multiple apps from one dashboard.

#### Acceptance Criteria

1. THE Sidebar SHALL display a project switcher showing the currently selected project name.
2. WHEN a developer clicks the project switcher, THE Dashboard SHALL display a dropdown listing all projects owned by the developer.
3. WHEN a developer selects a different project from the dropdown, THE Dashboard SHALL update all displayed data (posts, settings) to reflect the newly selected project.
4. THE project switcher dropdown SHALL include a "Create project" option at the bottom of the list.

### Requirement 5: Project Creation

**User Story:** As a developer, I want to create a new project by entering a name, so that I can immediately get a publishable key and integration snippet.

#### Acceptance Criteria

1. WHEN a developer selects "Create project" from the project switcher, THE Dashboard SHALL display a modal or form with a single name input field and a submit button.
2. WHEN a developer submits a valid project name, THE Dashboard SHALL create a new project record on the server with a generated publishable key and set it as the active project.
3. WHEN project creation succeeds, THE Dashboard SHALL display the generated publishable key and a copy-paste code snippet for SDK integration.
4. THE Dashboard SHALL provide a copy-to-clipboard button next to the publishable key and the code snippet.
5. IF project creation fails due to a server error, THEN THE Dashboard SHALL display an error message to the developer without losing the entered project name.

### Requirement 6: Board Tab — Post Listing

**User Story:** As a developer, I want to see incoming feature requests sorted by votes, so that I can understand what my users want most.

#### Acceptance Criteria

1. THE Board tab SHALL display a list of posts for the currently selected project, sorted by vote count in descending order.
2. THE Board tab SHALL display for each post: the title, description (truncated if long), vote count, and context metadata (screen context, OS, app version).
3. WHEN the currently selected project has no posts, THE Board tab SHALL display an empty state message indicating no feature requests have been submitted yet.
4. THE Board tab SHALL fetch post data using the Supabase_Client with the developer's JWT, relying on RLS to scope data to the developer's projects.

### Requirement 7: Roadmap Tab — Status Management

**User Story:** As a developer, I want to change the status of feature requests, so that I can communicate progress to my users through the SDK board.

#### Acceptance Criteria

1. THE Roadmap tab SHALL display posts grouped by status columns: Open, Planned, In Progress, Shipped, and Declined.
2. WHEN a developer changes a post's status using a dropdown control, THE Dashboard SHALL update the post's status in the database via the Supabase_Client.
3. WHEN a status update succeeds, THE Roadmap tab SHALL reflect the new status immediately in the UI without requiring a full page reload.
4. IF a status update fails, THEN THE Dashboard SHALL revert the displayed status to its previous value and show an error message.

### Requirement 8: Changelog Tab

**User Story:** As a developer, I want to see a list of shipped features, so that I can review what has been completed.

#### Acceptance Criteria

1. THE Changelog tab SHALL display a read-only list of posts with status equal to `shipped` for the currently selected project.
2. THE Changelog tab SHALL display each shipped post with its title, description, and the date the post was created.
3. WHEN no posts have status `shipped`, THE Changelog tab SHALL display an empty state message.

### Requirement 9: Theme Settings

**User Story:** As a developer, I want to configure the board accent color for my project, so that the in-app board matches my app's branding.

#### Acceptance Criteria

1. THE Settings page SHALL include a theme configuration section with a color picker for the board accent color.
2. WHEN a developer selects a color and saves, THE Dashboard SHALL update the project's `theme_json` column in the database with the selected accent color value.
3. WHEN the Settings page loads, THE Dashboard SHALL pre-populate the color picker with the current accent color from the project's `theme_json`, or a default color if none is set.

### Requirement 10: Key Management

**User Story:** As a developer, I want to view, rotate, and disable my publishable key, so that I can control SDK access to my project.

#### Acceptance Criteria

1. THE Settings page SHALL display the current publishable key for the selected project with a copy-to-clipboard button.
2. WHEN a developer clicks "Rotate key," THE Dashboard SHALL call the Rotate_Key_Function Edge Function with the developer's Bearer JWT and the project ID.
3. WHEN key rotation succeeds, THE Dashboard SHALL display the new publishable key and update the displayed value.
4. WHEN a developer toggles the project active/inactive switch, THE Dashboard SHALL update the project's `is_active` field in the database.
5. IF key rotation or status toggle fails, THEN THE Dashboard SHALL display an error message and retain the previous displayed state.

### Requirement 11: Billing Placeholder

**User Story:** As a developer, I want to see where billing will be managed, so that I know the feature is planned.

#### Acceptance Criteria

1. THE Settings page SHALL include a billing section displaying a "Coming soon" card with a brief message indicating that billing management is not yet available.

