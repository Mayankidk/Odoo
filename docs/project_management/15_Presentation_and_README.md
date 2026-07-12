# AssetFlow — Presentation & GitHub README (BaaS Architecture)

## 1. Hackathon Pitch Presentation Outline (3 Minutes)

### Slide 1: Title Screen
- **Project**: AssetFlow — Enterprise Asset & Resource Management System
- **Team Name**: [Team Name]
- **One-Liner**: "Digitizing the lifecycle of physical assets and shared resources to eliminate conflicts and bring real-time visibility to organizations."

### Slide 2: The Problem
- Organizations still use spreadsheets and paper logs to track laptops, vehicles, and meeting rooms.
- **Pain Points**:
  - Assets get double-allocated.
  - Meeting rooms get double-booked.
  - Maintenance is ad-hoc with no history.
  - Audits are a nightmare, leading to "ghost assets" and financial write-offs.

### Slide 3: The Solution (AssetFlow)
- A centralized, role-based ERP module tailored specifically for physical asset management.
- **Key Features**:
  - Full lifecycle tracking (Available → Allocated → Maintenance → Retired).
  - System-enforced conflict prevention (No double allocations).
  - Overlap-free resource booking calendar.
  - Structured audit cycles with auto-generated discrepancy reports.

### Slide 4: Architecture & Tech Stack Highlights
- **Frontend**: React 18, Vite, Zustand, Tailwind CSS, shadcn/ui.
- **Backend-as-a-Service**: Supabase (PostgreSQL).
- **Security**: Supabase GoTrue Auth + Row Level Security (RLS). RBAC enforced directly at the database layer.
- **Why this stack?**: We eliminated the traditional backend server to move at lightning speed. Complex operations like booking overlap prevention are handled via native PostgreSQL `tstzrange` EXCLUDE constraints and RPC functions.

### Slide 5: The Demo (Live or Pre-recorded Video)
*Demo Flow (90 seconds max):*
1. **Admin View**: Show dashboard KPIs. Briefly show Employee Directory (promoting a role).
2. **Asset Manager View**: Allocate a laptop to an employee. Try to allocate the *same* laptop to someone else (Show the system blocking it via RPC and offering a Transfer Request).
3. **Employee View**: Open the Booking Calendar. Book a meeting room. Try to book an overlapping time (Show the database constraint rejecting it).
4. **Maintenance/Audit**: Show an asset moving to "Under Maintenance" upon approval.

### Slide 6: Business Impact & Future Scope
- **Impact**: Zero double-booking conflicts, reduced asset loss, clear audit trails for compliance.
- **Future Scope**: Multi-tenancy (SaaS model), SSO integration, Mobile Native App with Barcode/QR scanning, Predictive Maintenance via ML.

### Slide 7: Q&A
- "Thank you. We are ready for your questions."

---

## 2. Judging Criteria Mapping

| Judging Criteria | AssetFlow Feature / Strategy |
|------------------|------------------------------|
| **Innovation/Idea** | Bringing robust ERP-level conflict resolution to a sleek UI using serverless/BaaS. |
| **Technical Complexity** | Using PostgreSQL RPC functions and `tstzrange` indexes for native overlap prevention without a middleware server. Complex RLS policies. |
| **UX/UI Design** | Premium Tailwind/shadcn design, clear error handling, role-scoped dashboards, conflict resolution alerts. |
| **Completeness/Demo** | End-to-end working flows for Allocation, Booking, Maintenance, and Audits. Hosted live. |
| **Scalability** | Serverless architecture hosted on GitHub Pages and Supabase (PgBouncer). |

---

## 3. GitHub README.md Content

```markdown
# AssetFlow

AssetFlow is an Enterprise Asset & Resource Management System built to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Distinct permissions for Admin, Asset Manager, Department Head, and Employee enforced via Row Level Security.
- **Conflict-Free Allocation**: Database-level RPC constraints prevent the double-allocation of any asset.
- **Smart Resource Booking**: Calendar-based booking for shared resources with automatic overlap prevention via Postgres EXCLUDE constraints.
- **Maintenance Workflows**: Structured approval process tracking asset history.
- **Structured Audits**: Run department-wide audits, assign auditors, and auto-generate discrepancy reports.
- **Real-Time Dashboard**: Role-scoped KPI cards highlighting overdue returns and active maintenance.

## 🛠 Tech Stack

**Frontend:**
- React 18 (Vite)
- Tailwind CSS & shadcn/ui
- Zustand (State Management)
- React Query (Data Fetching & Caching)
- React Hook Form + Zod (Validation)

**Backend-as-a-Service (BaaS):**
- Supabase (PostgreSQL 16)
- Supabase Auth (JWT via GoTrue)
- Supabase Storage (S3-compatible file uploads)
- PostgREST (Auto-generated APIs)

## 🏗 Architecture

AssetFlow utilizes a pure **Serverless / BaaS architecture** to maximize deployment speed and reduce DevOps overhead. The React Single Page Application (hosted on GitHub Pages) communicates directly with Supabase. Security is strictly enforced using PostgreSQL **Row Level Security (RLS)** rather than application-tier middleware.

*See `/docs/architecture/04_System_Design.md` for full diagrams.*

## 💻 Local Development Setup

### Prerequisites
- Node.js v20+
- A free [Supabase](https://supabase.com) account.

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-org/assetflow.git
   cd assetflow
   \`\`\`

2. **Database Setup**
   - Create a new project in Supabase.
   - Go to the SQL Editor and run the schema file located at `supabase/migrations/00_initial_schema.sql` (if you have created one) or create the tables as defined in `/docs/database/05_Database_Design.md`.
   - Setup RLS policies as described in the documentation.

3. **Frontend Setup**
   \`\`\`bash
   cd client
   npm install
   cp .env.example .env
   \`\`\`
   - Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the `.env` file.

4. **Run the App**
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be running at `http://localhost:5173`.

## 📁 Project Structure (Docs)

Detailed planning documentation can be found in the `/docs` folder:
- `/business` - Project overview and SRS.
- `/architecture` - System design, Tech stack, and Serverless concepts.
- `/database` - ERD and schema design.
- `/api` - Supabase JS Client interaction guide.
- `/design` - UX personas and UI guidelines.

## 🔮 Future Scope
- Multi-tenancy support (SaaS architecture)
- Native mobile application for on-the-floor auditors
- QR/Barcode scanning integration

## 📄 License
This project is licensed under the MIT License.
```

---
*Cross-references: [01_Project_Overview.md](../business/01_Project_Overview.md) | [02_SRS_and_Features.md](../business/02_SRS_and_Features.md)*
