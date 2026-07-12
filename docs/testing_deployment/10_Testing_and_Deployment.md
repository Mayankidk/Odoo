# AssetFlow — Testing & Deployment Strategy (BaaS Architecture)

## 1. Testing Approach

To ensure maximum reliability within a hackathon timeframe, testing will focus on frontend component integration and database-level constraint testing (via Supabase).

### 1.1 Database & API Testing (Supabase)
- **Focus**: Testing Row Level Security (RLS) policies and PostgreSQL RPC functions (e.g., booking overlap prevention).
- **Tooling**: `pgTAP` (Database testing framework supported by Supabase) or simply writing Jest/Vitest scripts that hit the Supabase local emulator using different test user JWTs.
- **Critical Paths to Cover**:
  - Double-allocation is rejected by the database.
  - Overlapping time slots are rejected by the database constraint.
  - A user with the `employee` role is denied INSERT access to the `assets` table.

### 1.2 Frontend Testing (Vitest + React Testing Library)
- **Unit Tests**:
  - Focus: Utility functions, date formatters, and Zustand store logic.
- **Component Tests**:
  - Focus: Forms validating correctly via React Hook Form + Zod before making Supabase calls.
- **Integration Tests**:
  - Mocking the `@supabase/supabase-js` client to test how the UI reacts to successful data fetches and specific Supabase error codes (e.g., `42501` RLS violation).

### 1.3 Manual / E2E Testing (Playwright / Manual)
- Manual E2E script:
  1. Admin logs in, creates a department, promotes an employee to Asset Manager (via a database function).
  2. Asset Manager registers a laptop.
  3. Asset Manager allocates laptop to Employee A.
  4. Asset Manager attempts to allocate same laptop to Employee B (must fail).
  5. Employee B books the projector for 10:00–11:00.
  6. Employee A attempts to book projector for 10:30–11:30 (must fail).

---

## 2. Environments

| Environment | Purpose | Infrastructure | Database |
|-------------|---------|----------------|----------|
| **Local (Dev)** | Active coding | localhost, Vite dev server | Supabase CLI (Local Emulator) or Cloud Dev Project |
| **Production** | Live Demo / Judges | GitHub Pages (Static Hosting) | Supabase Cloud (Managed PostgreSQL) |

---

## 3. CI/CD Pipeline (GitHub Actions)

A streamlined CI/CD pipeline automates the deployment of the React SPA to GitHub Pages.

### 3.1 Deployment Workflow
Create a file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy React App to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

---

## 4. Environment Variables & Secrets Management

Because this is a pure frontend application connecting to a BaaS, the frontend requires the Supabase URL and Anon Key. **These are public keys and are safe to be exposed to the browser**, provided RLS is configured correctly in Supabase.

**Local `.env` file:**
```env
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Production Secrets:**
Added via GitHub Repository Settings -> Secrets and Variables -> Actions. They are injected into the Vite build process by the GitHub Action.

---

## 5. Monitoring & Error Tracking

1. **Database Monitoring**: Use the built-in Supabase Dashboard to monitor API requests, database connections (PgBouncer), and storage usage.
2. **Error Tracking (Frontend)**: Sentry (Free Tier) integrated into React to capture unhandled component errors and failed API requests during the live hackathon demo.
