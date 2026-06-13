# Implementation Plan: FeaturePoll Foundations

## Overview

Scaffold the FeaturePoll monorepo with directory structure, steering files, configuration, and git initialization. All tasks are file creation/move operations with no application code.

## Tasks

- [x] 1. Create monorepo directories and README files
  - [x] 1.1 Create top-level directories and write README files
    - Create `sdk/`, `backend/`, `web/`, `docs/` directories
    - Write `sdk/README.md` describing the Flutter/Dart `feature_poll` package (open source, MIT)
    - Write `backend/README.md` describing Supabase migrations and Edge Functions
    - Write `web/README.md` describing the Next.js landing page and developer dashboard
    - Write `docs/README.md` describing project documentation, specs, and reference materials
    - Use exact content from the design document's File Content Specifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Set up Kiro steering files with Tally→FeaturePoll cleanup
  - [x] 2.1 Create `.kiro/steering/` directory and migrate steering files
    - Create `.kiro/steering/` directory
    - Read `product.md` from workspace root, apply Tally→FeaturePoll replacements, write to `.kiro/steering/product.md`
    - Read `tech.md` from workspace root, apply Tally→FeaturePoll replacements, write to `.kiro/steering/tech.md`
    - Read `structure.md` from workspace root, apply Tally→FeaturePoll replacements, write to `.kiro/steering/structure.md`
    - Replacement rules: "Tally" → "FeaturePoll" (brand contexts), "tally" → "feature_poll" (code contexts), "/tally" → "/featurepoll" (paths), "tally_pk_" → "feature_poll_pk_" (key prefixes)
    - Exception: leave `tally_project_plan.md` filename references unchanged
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Move reference document and delete root-level originals
    - Move `tally_project_plan.md` from workspace root to `/docs/tally_project_plan.md` without modification
    - Delete original `product.md`, `tech.md`, `structure.md`, and `tally_project_plan.md` from workspace root
    - _Requirements: 2.7, 3.1, 3.2, 3.3_

- [x] 3. Checkpoint - Verify directory structure
  - Ensure all directories and steering files exist at expected paths, ask the user if questions arise.

- [x] 4. Create environment and git configuration files
  - [x] 4.1 Write `.env.example` with placeholder variables
    - Create `.env.example` in workspace root
    - Include Supabase variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - Include Firebase variables: `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_MESSAGING_SENDER_ID`
    - Use descriptive placeholder values (e.g., `your-supabase-url-here`)
    - Include group comments explaining each variable section
    - Use exact content from the design document's Component 4 specification
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Write `.gitignore` with comprehensive exclusion patterns
    - Create `.gitignore` in workspace root
    - Include environment file patterns: `.env`, `.env.local`, `.env.*.local`
    - Include Node.js: `node_modules/`
    - Include Dart/Flutter: `.dart_tool/`, `.packages`, `build/`, `.flutter-plugins`, `.flutter-plugins-dependencies`, `pubspec.lock`
    - Include Next.js/Vercel: `.next/`, `out/`, `.vercel`
    - Include IDE/OS: `.idea/`, `.vscode/`, `.DS_Store`, `Thumbs.db`
    - Include Supabase: `.supabase/`
    - Use exact content from the design document's Component 5 specification
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 5. Initialize git repository and create initial commit
  - [x] 5.1 Initialize git and commit all scaffolding
    - Check if `.git/` already exists — skip `git init` if so
    - Run `git init` if needed
    - Stage all files with `git add .`
    - Create initial commit: `git commit -m "chore: scaffold monorepo structure and steering files"`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Final checkpoint - Verify workspace readiness
  - Verify final structure matches Requirement 7: all steering files, READMEs, config files in place
  - Verify no loose docs remain at workspace root (`product.md`, `tech.md`, `structure.md`, `tally_project_plan.md` removed)
  - Verify `.kiro/steering/` contains exactly three files
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 7.1, 7.2, 7.3_

## Notes

- This is a pure scaffolding task with no application code — all tasks are file I/O and git operations
- No property-based tests are needed (no input variation, deterministic file creation)
- The Tally→FeaturePoll replacement is context-sensitive: capitalized "Tally" → "FeaturePoll", lowercase "tally" → "feature_poll"
- The `tally_project_plan.md` filename is intentionally preserved as historical reference
- Tasks follow the execution order from the design document to respect dependencies

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "4.1", "4.2"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["5.1"] }
  ]
}
```
