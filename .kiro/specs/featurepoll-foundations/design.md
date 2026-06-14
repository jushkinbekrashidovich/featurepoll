# Design Document

## Overview

This design covers the foundational scaffolding for the FeaturePoll monorepo. The scope is purely file creation, content placement, and git initialization — no application code, no services, no runtime logic. The output is a well-organized workspace ready for feature development.

## Architecture

There is no runtime architecture for this task. The "system" is a shell script or sequential file-creation process that:

1. Creates directories
2. Writes configuration and documentation files
3. Moves/transforms existing content
4. Initializes version control

```
Workspace Root (/Users/jushkinbek/Desktop/Startups/featurepoll/)
├── .kiro/
│   ├── steering/
│   │   ├── product.md        (moved + cleaned from root)
│   │   ├── tech.md           (moved + cleaned from root)
│   │   └── structure.md      (moved + cleaned from root)
│   └── specs/
│       └── featurepoll-foundations/
├── sdk/
│   └── README.md
├── backend/
│   └── README.md
├── web/
│   └── README.md
├── docs/
│   ├── README.md
│   └── tally_project_plan.md (preserved as-is)
├── .env.example
├── .gitignore
└── .git/
```

## Components and Interfaces

### Component 1: Directory Structure Creator

Creates the four top-level directories (`sdk/`, `backend/`, `web/`, `docs/`) and places a README.md in each.

**Files to create:**

- `sdk/README.md`
- `backend/README.md`
- `web/README.md`
- `docs/README.md`

### Component 2: Steering File Migrator

Moves content from workspace root docs into `.kiro/steering/`, performing a find-and-replace to clean up legacy "Tally" references.

**Transformation rules:**
- `"Tally"` → `"FeaturePoll"` (brand/product name contexts)
- `"tally"` → `"feature_poll"` (package/code contexts, e.g., `tally_pk_` → `feature_poll_pk_`)
- The replacement is context-sensitive: capitalized "Tally" becomes "FeaturePoll", lowercase "tally" becomes "feature_poll"
- After replacement, delete originals from workspace root

**Files affected:**
- `product.md` → `.kiro/steering/product.md`
- `tech.md` → `.kiro/steering/tech.md`
- `structure.md` → `.kiro/steering/structure.md`

### Component 3: Reference Document Mover

Moves `tally_project_plan.md` to `/docs/tally_project_plan.md` without any content modification. The legacy naming is acceptable in this historical reference.

### Component 4: Environment Configuration Writer

Creates `.env.example` with grouped placeholder variables and explanatory comments.

**Content structure:**

```bash
# ===========================================
# FeaturePoll Environment Variables
# ===========================================

# --- Supabase ---
# Backend database and API. Get these from your Supabase project settings.
SUPABASE_URL=https://sxxoofnfrgcqjpysfowi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eG9vZm5mcmdjcWpweXNmb3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDUyNzIsImV4cCI6MjA5NjkyMTI3Mn0.jV8QDs0Tw0i6yf5SDpJEjQxi7GJIavsErSXg5i4tYkI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eG9vZm5mcmdjcWpweXNmb3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0NTI3MiwiZXhwIjoyMDk2OTIxMjcyfQ.-CLgpEjV3s7hQgXlZwEJ1pB8Jw18a2CEeJFKf_gKcZ0

# --- Firebase ---
# Push notifications via Firebase Cloud Messaging.
# Get these from your Firebase project console.
FIREBASE_PROJECT_ID=featurepoll
FIREBASE_API_KEY=your-firebase-api-key-here
FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id-here
```

### Component 5: Gitignore Writer

Creates a comprehensive `.gitignore` covering all stack-relevant patterns.

**Content structure:**

```gitignore
# Environment files
.env
.env.local
.env.*.local

# Node.js
node_modules/

# Dart/Flutter
.dart_tool/
.packages
build/
.flutter-plugins
.flutter-plugins-dependencies
pubspec.lock

# Next.js / Vercel
.next/
out/
.vercel

# IDE and OS
.idea/
.vscode/
.DS_Store
Thumbs.db

# Supabase
.supabase/
```

### Component 6: Git Initializer

Initializes the repository (if not already initialized), stages all files, and creates the initial commit.

**Steps:**
1. Check if `.git/` exists — if yes, skip `git init`
2. Run `git init` (if needed)
3. `git add .` (stages all created/moved files)
4. `git commit -m "chore: scaffold monorepo structure and steering files"`

## Data Models

This task produces no runtime data models. The "data" is the file content itself. The key structures are:

### File Manifest

| File Path | Source | Transformation |
|-----------|--------|----------------|
| `sdk/README.md` | Generated | None |
| `backend/README.md` | Generated | None |
| `web/README.md` | Generated | None |
| `docs/README.md` | Generated | None |
| `.kiro/steering/product.md` | `product.md` (root) | Tally→FeaturePoll cleanup |
| `.kiro/steering/tech.md` | `tech.md` (root) | Tally→FeaturePoll cleanup |
| `.kiro/steering/structure.md` | `structure.md` (root) | Tally→FeaturePoll cleanup |
| `docs/tally_project_plan.md` | `tally_project_plan.md` (root) | None (preserved as-is) |
| `.env.example` | Generated | None |
| `.gitignore` | Generated | None |

### Environment Variable Schema

```
Variable Name                  | Purpose                      | Group
-------------------------------|------------------------------|----------
SUPABASE_URL                   | Supabase project URL         | Supabase
SUPABASE_ANON_KEY              | Public anonymous key         | Supabase
SUPABASE_SERVICE_ROLE_KEY      | Admin service role key       | Supabase
FIREBASE_PROJECT_ID            | Firebase project identifier  | Firebase
FIREBASE_API_KEY               | Firebase API key             | Firebase
FIREBASE_MESSAGING_SENDER_ID   | FCM sender ID                | Firebase
```

## File Content Specifications

### sdk/README.md

```markdown
# /sdk — Flutter SDK

Home of the `feature_poll` Flutter/Dart package.

- **Open source** under the MIT license
- Published to pub.dev
- Pure Dart — no native dependencies
- Will be split to its own public repository before v1 launch

## Structure (planned)

```
/lib
  feature_poll.dart        # Public entrypoint
  /src
    /api                   # Networking client + typed models
    /board                 # Board UI widgets
    /cache                 # Local store + sync queue
    /core                  # Device ID, config, context capture
/example                   # Runnable demo app
/test                      # Unit + property tests
```
```

### backend/README.md

```markdown
# /backend — Supabase Backend

Home of Supabase migrations and Edge Functions for the FeaturePoll API.

- **Database:** PostgreSQL with Row Level Security (RLS)
- **API:** PostgREST auto-generated + custom Edge Functions
- **Auth:** Supabase Auth for developer accounts
- **Push:** Edge Function triggers for FCM notifications

## Structure (planned)

```
/migrations                # SQL schema + RLS policies
/functions                 # Edge Functions (board API, push on shipped)
seed.sql                   # Test project + sample posts
```
```

### web/README.md

```markdown
# /web — Next.js Web Application

Home of the FeaturePoll landing page and developer dashboard.

- **Framework:** Next.js (App Router) + Tailwind CSS
- **Deployment:** Vercel
- **Landing page:** Static, SEO-focused marketing site
- **Dashboard:** Authenticated developer area for managing projects and feedback

## Structure (planned)

```
/app
  /(marketing)             # Landing page routes
  /dashboard               # Authed developer area
/components                # Shared UI components
/lib                       # Supabase client, API helpers
```
```

### docs/README.md

```markdown
# /docs — Documentation

Home of project documentation, specs, and reference materials.

- Project plans and historical context
- Architecture decision records
- API documentation (future)
- Integration guides (future)
```

## Steering File Cleanup Rules

The Tally→FeaturePoll replacement follows these specific rules:

| Pattern | Replacement | Context |
|---------|-------------|---------|
| `Tally` (capitalized, standalone) | `FeaturePoll` | Brand/product name |
| `tally` (lowercase, standalone) | `feature_poll` | Package/code identifiers |
| `tally_pk_` | `feature_poll_pk_` | Key prefix examples |
| `/tally` (in paths) | `/featurepoll` | Directory paths |

**Important exceptions:**
- `tally_project_plan.md` filename references are left as-is (it's a historical document name)
- Comments or quotes that reference the name change itself can remain

## Execution Order

The tasks must execute in this order due to dependencies:

1. Create directories (`sdk/`, `backend/`, `web/`, `docs/`)
2. Write README files into each directory
3. Create `.kiro/steering/` directory
4. Copy + transform steering files (with Tally cleanup)
5. Move `tally_project_plan.md` to `/docs/`
6. Delete original root-level docs
7. Write `.env.example`
8. Write `.gitignore`
9. Initialize git + commit

Steps 1-2 and 7-8 are independent of each other, but step 9 must come last, and step 6 must follow step 4.

## Error Handling

- If a target directory already exists, skip creation (idempotent)
- If a source file doesn't exist for the move operation, report an error and halt
- If git is already initialized, skip `git init` but proceed with staging/committing
- If the commit would be empty (no changes), skip the commit step

## Testing Strategy

This is a scaffolding task with no application logic. Verification is done through structural checks:

- **Smoke tests:** Verify directories and files exist at expected paths
- **Example-based tests:** Verify specific file contents (README text, .env.example variables, .gitignore patterns)
- **Edge case:** Verify idempotent behavior when git is already initialized

No property-based tests are needed — there is no input variation, no business logic, and no function to test with random inputs.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This task is a pure scaffolding/configuration task. All acceptance criteria fall into SMOKE (existence checks), EXAMPLE (specific content verification), or EDGE_CASE categories. There are no universal properties that would benefit from property-based testing because:

- The "inputs" are fixed (known file paths, known content)
- The operations are deterministic file I/O (create, move, write)
- There is no input space to vary — the same setup produces the same result every time
- The verification is structural (do files exist? do they contain expected strings?)

No property-based tests are appropriate for this feature. Verification should use example-based checks confirming the final workspace state matches the specification.
