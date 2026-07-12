# AssetFlow — Tech Stack Justification (BaaS Architecture)

This document details the technologies chosen for AssetFlow, leveraging a **Backend-as-a-Service (BaaS)** architecture to maximize speed and reliability during a hackathon timeline.

---

## 1. Frontend Stack

| Layer | Technology | Rationale | Rejected Alternatives |
|-------|------------|-----------|-----------------------|
| **Core Framework** | **React 18** | Massive ecosystem, fast development cycle, component reusability. Best suited for building complex, interactive dashboards and forms quickly. | **Angular**: Too steep learning curve for hackathons. |
| **Build Tool** | **Vite** | Instant server start, lightning-fast HMR (Hot Module Replacement), optimized production builds. | **Create React App (CRA)**: Deprecated, slow webpack builds. |
| **State Management** | **Zustand** | Minimal boilerplate, lightweight, highly performant UI state management. | **Redux**: Too much boilerplate for a hackathon. |
| **Data Fetching & Cache** | **React Query (TanStack)** | Wraps the Supabase client to handle caching, background updates, loading/error states automatically. Drastically reduces custom hook code. | **Raw useEffect**: Leads to race conditions and manual cache invalidation. |
| **Routing** | **React Router v6** | Industry standard, declarative routing, supports nested routes and protected route guards. | **Next.js App Router**: SSR is unnecessary for an authenticated dashboard. SPA is faster to host on GitHub Pages. |
| **Styling & Components** | **Tailwind CSS + shadcn/ui** | Rapid styling with utility classes; accessible, unstyled components (Radix) that can be easily customized without overriding vendor CSS. | **Material UI / Bootstrap**: Hard to customize, looks generic, high bundle size. |
| **Form Handling & Validation** | **React Hook Form + Zod** | Uncontrolled inputs for performance; Zod schemas ensure strict data shapes before sending to Supabase. | **Formik**: Slower, more re-renders. |
| **Icons & Charts** | **Lucide React + Recharts** | Lucide: Clean, consistent icons. Recharts: React-native D3 wrapper, easy to animate for KPI dashboards. | **Chart.js**: Canvas-based, harder to style reactively. |

---

## 2. Backend-as-a-Service (BaaS) Stack

We have chosen to eliminate the traditional custom backend (Node.js/Express) in favor of **Supabase**. This shifts backend development to database configuration, saving roughly 80% of backend engineering time.

| Layer | Technology | Rationale | Rejected Alternatives |
|-------|------------|-----------|-----------------------|
| **Platform** | **Supabase** | Open-source Firebase alternative based on PostgreSQL. Provides DB, API, Auth, and Storage out of the box with generous free tiers. | **Firebase**: Uses NoSQL (Firestore), which makes relational data (Assets → Allocations → Departments) very difficult to query effectively. |
| **Database** | **PostgreSQL 16** | Relational data integrity is critical for assets/allocations. Features like `tstzrange` native types solve booking overlaps natively. | **MongoDB**: No native range types for booking overlaps; lack of ACID transactions complicates conflict resolution. |
| **API Layer** | **PostgREST** | Built into Supabase. Instantly reflects the database schema as a RESTful API without writing a single line of backend code. | **Express.js / Node.js**: Requires hours of writing boilerplate, controllers, routing, and deployment setup. |
| **Security & Auth** | **Supabase Auth + RLS** | GoTrue auth provides instant JWT generation. Row Level Security (RLS) in PostgreSQL enforces RBAC directly at the data layer, impossible to bypass. | **Custom JWT + Middleware**: Prone to human error, requires maintaining a separate auth server. |
| **Complex Logic** | **Postgres Functions (RPC)** | For logic too complex for simple API calls (like overlapping booking prevention), we write stored procedures in SQL and call them as Remote Procedure Calls via Supabase. | **Supabase Edge Functions**: Adds latency and deployment complexity compared to pure SQL functions. |
| **File Storage** | **Supabase Storage** | S3-compatible, integrates perfectly with Supabase Auth so only authorized users can upload/view asset photos. | **AWS S3**: Complex IAM setup, separate billing. |

---

## 3. Infrastructure & Deployment Stack

| Layer | Technology | Rationale | Rejected Alternatives |
|-------|------------|-----------|-----------------------|
| **Frontend Hosting** | **GitHub Pages** | 100% free, zero-config deployment via GitHub Actions for static SPA. Perfect for hackathons. | **Vercel / Netlify**: Also good, but GitHub Pages keeps everything in one ecosystem. |
| **Database Hosting** | **Supabase Managed DB** | Managed PostgreSQL with connection pooling (PgBouncer) out of the box, daily backups, and a generous free tier. | **Local Docker DB**: Not accessible to judges/public for the demo. |
| **Version Control** | **Git + GitHub** | Industry standard. Enables branching strategies, PR reviews, and GitHub Actions for CI. | **GitLab**: GitHub is more ubiquitous for hackathon integrations. |

---

## 4. Why This Stack Wins Hackathons

1. **Zero Backend Deployment**: We don't have to debug Docker containers, set up PM2, or worry about Node.js crashing on a cheap server.
2. **Instant APIs**: As soon as the DBA creates the `assets` table, the frontend team can immediately call `supabase.from('assets').select('*')`. No waiting for the backend engineer to write the route.
3. **Rock-Solid Security**: By using RLS, if an Employee tries to delete an asset via the API, the database itself rejects it.
4. **Cost**: Hosted entirely for $0.
