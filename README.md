# Health Care .Pvt .Ltd

Single-hospital healthcare website and role-based hospital operations system built with Next.js App Router, MongoDB, Firebase Authentication, Tailwind CSS v4, Framer Motion and GSAP.

## Getting started

1. Copy `.env.example` to `.env.local` and supply MongoDB plus Firebase credentials.
2. In Firebase Authentication, enable Email/Password (and Google sign-in if desired).
3. Install dependencies and seed the first administrator:

```bash
npm install
npm run seed:admin   # ADMIN_EMAIL=you@example.com npm run seed:admin
npm run dev
```

`seed:admin` creates the Firebase credential and the matching MongoDB `users` record in one step. Pass `ADMIN_PASSWORD` inline to choose your own, or omit it to have a strong one generated and printed once. The script is idempotent — re-running it resets the password and re-links the records.

Valid roles: `admin`, `doctor`, `nurse`, `receptionist`, `hr`, `patient`, `lab_technician`, `pharmacist`.

## Architecture

```
src/
├── app/            App Router pages + /api route handlers
├── components/
│   ├── ui/         Shared design system (buttons, forms, table, overlays, feedback)
│   ├── dashboard/  DashboardShell — one responsive shell for every role workspace
│   ├── public/     Marketing site components
│   └── <role>/     Per-role dashboard screens
├── lib/            auth, permissions, MongoDB, billing, audit, rate limiting
└── models/         Mongoose schemas
```

### Design system

Semantic design tokens are defined in `src/app/globals.css` (`brand`, `ink`, `canvas`, `surface`, `accent`, plus status colours) and consumed as Tailwind utilities — `bg-brand`, `text-ink-muted`, and so on. Avoid raw palette values (`bg-teal-600`) so the theme stays changeable in one place.

Shared components live in `src/components/ui` and are imported from `@/components/ui`. This includes a generic `DataTable` with search, filters, sorting, pagination, bulk selection, row actions, skeleton loading and empty states — prefer it over hand-rolled tables.

## Security model

The browser never authorises a role. Sign-in exchanges a Firebase ID token for an HTTP-only session cookie. Protected pages and APIs verify that cookie, look up the account in MongoDB, require an active user, and check the required permission on every request.

- Permissions are declared per role in `src/lib/roles.ts` and enforced server-side via `requirePermission`.
- Record-scoped actions additionally verify ownership (e.g. only the authoring clinician may finalise their own clinical record).
- Sensitive actions — login, clinical records, prescriptions, lab reports, bed assignment, invoices, payments, CMS edits, account activation — are written to `AuditLog`.
- Sign-in, public appointment requests, patient creation and payments are rate limited. The in-memory limiter in `src/lib/security/rate-limit.ts` is development-safe only; use Redis or similar for multi-instance deployments.

Public appointment requests are intentionally unauthenticated. They are schema-validated with Zod and persisted to MongoDB.

## Status

Implemented: public website, authentication and RBAC, patient registration and portal, clinical (doctor/nurse) workspace, reception and billing, laboratory, pharmacy, HR and bed/ambulance operations, appointments, analytics, and audit logging.

Not yet implemented: dedicated API routes for employee records, attendance, leave, payroll, ward/room management and refunds (models exist); operation theatre, blood bank and CMS admin screens; automated tests.
