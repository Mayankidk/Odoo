# AssetFlow — Security & Performance Strategy (BaaS Architecture)

This document outlines the security controls and performance optimizations designed into the AssetFlow architecture using Supabase and GitHub Pages.

---

## 1. Security Architecture (Supabase Auth & RLS)

### 1.1 Authentication (GoTrue)
- **Strategy**: Authentication is entirely managed by Supabase Auth (GoTrue). It generates secure JWTs stored automatically by the Supabase JS client.
- **Secure Storage**: The client SDK handles token storage and auto-refresh mechanisms.
- **Signup Logic**: The signup process is strictly limited. New users are assigned the `employee` role by default via a PostgreSQL Database Trigger acting on the `auth.users` table insertion. Self-escalation during signup is impossible.

### 1.2 Authorization (Row Level Security - RLS)
We do not use application-layer middleware for authorization. Instead, we use **PostgreSQL Row Level Security (RLS)**. This is vastly more secure as it applies to the database globally, preventing any unauthorized reads/writes regardless of how the database is accessed.

**Key RLS Policies:**
- **Assets Table**:
  - `SELECT`: `true` (Public read for authenticated users).
  - `INSERT/UPDATE/DELETE`: `auth.jwt() ->> 'role' IN ('admin', 'asset_manager')`.
- **Allocations Table**:
  - `SELECT`: Users can only select where `allocated_to_user_id = auth.uid()` OR their role is `admin`/`asset_manager`.
  - `INSERT`: Prevent double-allocation using complex policies or RPC checks.

### 1.3 Data Protection & Encryption
- **Data in Transit**: HTTPS/TLS 1.2+ is enforced automatically by Supabase API and GitHub Pages.
- **Data at Rest**: Supabase encrypts all data at rest using AES-256.
- **Secrets**: The only exposed variables are the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is safe to expose in the React frontend because RLS completely locks down what that key is allowed to access based on the logged-in user's JWT. **The Supabase Service Role Key is never exposed to the frontend.**

### 1.4 OWASP Top 10 Mitigations

| Vulnerability | Mitigation Strategy (Supabase) |
|---------------|--------------------------------|
| **Injection (SQL)** | PostgREST (Supabase API) inherently uses parameterized queries. SQL injection via the JS client is practically impossible. |
| **Broken Authentication** | Supabase Auth handles bcrypt hashing, brute-force protection, and secure JWT rotation automatically. |
| **Sensitive Data Exposure** | HTTPS only. Secrets managed by GitHub Actions. Supabase manages DB encryption. |
| **Broken Access Control** | RLS prevents IDOR (Insecure Direct Object Reference) inherently. A user modifying the payload to `userId=2` will be rejected by the database if their JWT says they are User 1. |
| **Cross-Site Scripting (XSS)** | React auto-escapes output. GitHub pages serves the static site. |

### 1.5 File Upload Security (Supabase Storage)
- **Bucket Policies**: Storage buckets are secured via RLS.
  - `INSERT`: Only authenticated users can upload.
  - `SELECT`: Public bucket (for viewing images), but restricted paths can be configured if documents are sensitive.
- **File Limits**: Supabase Storage enforces limits on MIME types (`image/*`, `application/pdf`) and file sizes (max 10MB) at the bucket level.

---

## 2. Performance & Scalability Strategy

### 2.1 Database Optimization (PostgreSQL)
- **Indexing**: B-Tree indexes on high-cardinality search fields (`email`, `asset_tag`, `serial_number`).
- **Range Types**: PostgreSQL `tstzrange` and GiST indexes handle booking overlaps natively in the DB layer, preventing race conditions.
- **Connection Pooling**: Supabase uses PgBouncer internally to handle high concurrency from the serverless API.

### 2.2 Caching Strategy (React Query)
Since we lack a middle-tier Redis server in a pure BaaS setup, we rely heavily on **Client-Side Caching**.
- **React Query (TanStack)**: 
  - Caches API responses in the browser's memory.
  - `staleTime` set to 5 minutes for reference data (Categories, Departments).
  - `staleTime` set to 30 seconds for dynamic data (Dashboard KPIs).
  - Optimistic updates applied for snappy UI feedback before the database confirms the transaction.

### 2.3 API Optimization (PostgREST)
- **Resource Embedding**: We avoid N+1 query problems by using Supabase's joined queries. E.g., `supabase.from('assets').select('*, categories(name)')` fetches the asset and its category name in a single efficient SQL query.

### 2.4 Frontend Optimization (Vite / GitHub Pages)
- **Global CDN**: GitHub Pages serves static assets via Fastly's edge network, ensuring sub-100ms load times for the application shell globally.
- **Code Splitting**: React Router `lazy()` loading is implemented so users don't download the Admin panels unless they navigate to them.
- **Image Optimization**: Images uploaded to Supabase Storage can be requested using Supabase's built-in image transformation API to serve smaller WebP thumbnails in list views.

---
*Cross-references: [04_System_Design.md](../architecture/04_System_Design.md) | [06_API_Design.md](../api/06_API_Design.md)*
