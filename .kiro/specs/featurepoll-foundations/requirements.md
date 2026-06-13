# Requirements Document

## Introduction

This specification covers the foundational setup for the FeaturePoll project: creating the monorepo folder structure, establishing steering files for Kiro, configuring secrets management, setting up version control, and ensuring the workspace is ready for feature development. No application code is generated — only directory scaffolding, configuration files, and documentation placeholders.

## Glossary

- **Workspace**: The root directory of the FeaturePoll project located at `/Users/jushkinbek/Desktop/Startups/featurepoll/`.
- **Monorepo**: A single repository containing all project components (`/sdk`, `/backend`, `/web`, `/docs`).
- **Steering_Files**: Kiro project-wide context files (`product.md`, `tech.md`, `structure.md`) stored in `.kiro/steering/` that provide persistent guidance to the AI assistant.
- **Setup_System**: The collection of scripts, configurations, and file structures that constitute the foundational project scaffolding.
- **Placeholder_README**: A minimal `README.md` file placed in each top-level directory to document purpose and establish the folder in version control.
- **Env_Example_File**: A `.env.example` file listing required environment variable names with placeholder values, serving as documentation for secrets configuration.
- **Gitignore_File**: A `.gitignore` file specifying patterns for files and directories that must be excluded from version control.

## Requirements

### Requirement 1: Monorepo Folder Structure

**User Story:** As a developer, I want a standardized monorepo directory structure with placeholder READMEs, so that all team members and tooling know where each component belongs before any code is written.

#### Acceptance Criteria

1. THE Setup_System SHALL create the following top-level directories in the Workspace: `/sdk`, `/backend`, `/web`, `/docs`.
2. WHEN a top-level directory is created, THE Setup_System SHALL place a `README.md` file inside the directory that states the directory's purpose and intended contents.
3. THE Setup_System SHALL create the `/sdk/README.md` describing the directory as the home of the Flutter/Dart `feature_poll` package (open source, MIT).
4. THE Setup_System SHALL create the `/backend/README.md` describing the directory as the home of Supabase migrations and Edge Functions.
5. THE Setup_System SHALL create the `/web/README.md` describing the directory as the home of the Next.js landing page and developer dashboard.
6. THE Setup_System SHALL create the `/docs/README.md` describing the directory as the home of project documentation, specs, and reference materials.

### Requirement 2: Steering Files Setup

**User Story:** As a developer using Kiro, I want the existing product, tech, and structure documentation moved into `.kiro/steering/` with all legacy naming cleaned up, so that Kiro loads correct project context on every session.

#### Acceptance Criteria

1. THE Setup_System SHALL create the `.kiro/steering/` directory in the Workspace.
2. THE Setup_System SHALL move the content of `product.md` from the Workspace root into `.kiro/steering/product.md`.
3. THE Setup_System SHALL move the content of `tech.md` from the Workspace root into `.kiro/steering/tech.md`.
4. THE Setup_System SHALL move the content of `structure.md` from the Workspace root into `.kiro/steering/structure.md`.
5. WHEN steering files are written, THE Setup_System SHALL replace all occurrences of "Tally" (case-insensitive variations: "Tally", "tally") with "FeaturePoll" or "feature_poll" as contextually appropriate in all three steering files.
6. THE Setup_System SHALL ensure no references to the legacy name "Tally" remain in any steering file after the move.
7. THE Setup_System SHALL remove the original `product.md`, `tech.md`, and `structure.md` files from the Workspace root after moving their content to `.kiro/steering/`.

### Requirement 3: Reference Documentation Placement

**User Story:** As a developer, I want the original project plan preserved as a reference document in `/docs`, so that historical context and build-group details remain accessible.

#### Acceptance Criteria

1. THE Setup_System SHALL move `tally_project_plan.md` from the Workspace root into `/docs/tally_project_plan.md`.
2. THE Setup_System SHALL preserve the original content of `tally_project_plan.md` without modification (the legacy naming is acceptable in this reference document).
3. THE Setup_System SHALL remove the original `tally_project_plan.md` from the Workspace root after moving the content.

### Requirement 4: Secrets Management Configuration

**User Story:** As a developer, I want a `.env.example` file documenting all required environment variables with placeholder values, so that new contributors can configure secrets without guessing variable names.

#### Acceptance Criteria

1. THE Setup_System SHALL create a `.env.example` file in the Workspace root.
2. THE Setup_System SHALL include the following placeholder variable names in the Env_Example_File: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. THE Setup_System SHALL include Firebase configuration placeholder variable names in the Env_Example_File: `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_MESSAGING_SENDER_ID`.
4. THE Setup_System SHALL set each variable value in the Env_Example_File to an empty string or a descriptive placeholder (e.g., `your-supabase-url-here`).
5. THE Setup_System SHALL include comments in the Env_Example_File explaining the purpose of each variable group.

### Requirement 5: Git Ignore Configuration

**User Story:** As a developer, I want a comprehensive `.gitignore` file covering all relevant artifact types, so that secrets, build outputs, and dependency caches are never committed.

#### Acceptance Criteria

1. THE Setup_System SHALL create a `.gitignore` file in the Workspace root.
2. THE Gitignore_File SHALL include patterns to exclude environment files: `.env`, `.env.local`, `.env.*.local`.
3. THE Gitignore_File SHALL include patterns to exclude Node.js artifacts: `node_modules/`.
4. THE Gitignore_File SHALL include patterns to exclude Dart/Flutter artifacts: `.dart_tool/`, `.packages`, `build/`, `.flutter-plugins`, `.flutter-plugins-dependencies`, `pubspec.lock` (for the package, not the app).
5. THE Gitignore_File SHALL include patterns to exclude build and output artifacts: `.next/`, `out/`, `.vercel`.
6. THE Gitignore_File SHALL include patterns to exclude IDE and OS files: `.idea/`, `.vscode/`, `.DS_Store`, `Thumbs.db`.
7. THE Gitignore_File SHALL include patterns to exclude Supabase local artifacts: `.supabase/`.

### Requirement 6: Git Repository Initialization

**User Story:** As a developer, I want the workspace initialized as a git repository with an initial commit containing the folder structure and configuration files, so that version history begins from a clean, organized state.

#### Acceptance Criteria

1. THE Setup_System SHALL initialize a git repository in the Workspace root.
2. THE Setup_System SHALL stage all created files (directory READMEs, steering files, `.env.example`, `.gitignore`, and the reference document) for the initial commit.
3. THE Setup_System SHALL create an initial commit with a descriptive message following conventional commit format (e.g., `chore: scaffold monorepo structure and steering files`).
4. IF git is already initialized in the Workspace, THEN THE Setup_System SHALL skip the `git init` step and proceed with staging and committing.

### Requirement 7: Workspace Readiness Verification

**User Story:** As a developer, I want to confirm that Kiro can load the steering files and the folder structure is complete, so that I have confidence the foundation is ready for feature work.

#### Acceptance Criteria

1. WHEN the setup is complete, THE Workspace SHALL contain the following structure: `.kiro/steering/product.md`, `.kiro/steering/tech.md`, `.kiro/steering/structure.md`, `/sdk/README.md`, `/backend/README.md`, `/web/README.md`, `/docs/README.md`, `/docs/tally_project_plan.md`, `.env.example`, `.gitignore`.
2. WHEN the setup is complete, THE Workspace root SHALL contain no loose documentation files (`product.md`, `tech.md`, `structure.md`, `tally_project_plan.md` must be removed from root).
3. THE Setup_System SHALL ensure the `.kiro/steering/` directory contains exactly three files: `product.md`, `tech.md`, `structure.md`.
