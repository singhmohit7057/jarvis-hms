# Jarvis Healthcare Management System

A full-stack clinic management system built with React, TypeScript, and Supabase. Covers pharmacy billing, doctor consultations and prescriptions, lab bookings and reports, patient records, and admin tooling — all in one application.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| PDF generation | jsPDF |
| Excel export | SheetJS (xlsx) |
| Routing | React Router v7 |
| Toasts | Sonner |

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A free [Supabase](https://supabase.com) account

---

## Setup Instructions

### 1. Get the project

```bash
git clone <repo-url> jarvis-hms
cd jarvis-hms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. Note your **Project URL** and **anon public key** from Project Settings → API.

### 4. Run database migrations

Open the **Supabase SQL Editor** and run each migration file in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_clinic_settings.sql`
3. `supabase/migrations/003_activity_logs.sql`
4. `supabase/migrations/004_rls_policies.sql`

Paste each file's content into the SQL editor and click **Run**.

### 5. Create the first Super Admin user

1. In your Supabase Dashboard, go to **Authentication → Users → Invite user**.
2. Enter the admin's email address and click **Send Invite**.
3. The user will receive a magic link to set their password.
4. After they sign in once, find their UUID in **Authentication → Users**.
5. Open the **SQL Editor** and insert their profile row:

```sql
INSERT INTO profiles (id, email, name, phone, role, is_active)
VALUES (
  '<paste-uuid-here>',
  'admin@yourclinic.com',
  'Admin Name',
  '9876543210',
  'SUPER_ADMIN',
  true
);
```

### 6. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7. Start the development server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## User Roles and Access

| Role | Accessible Modules |
|---|---|
| **Super Admin** | Everything — all modules, settings, user management, activity log |
| **Doctor** | Dashboard, Patients, Appointments, Consultations, Prescriptions, Doctor Collection Report |
| **Pharmacist** | Dashboard, Pharmacy (Inventory, Billing, Sales), Sales/Stock/Expiry Reports |
| **Lab Staff** | Dashboard, Patients (view), Lab Bookings, Test Management, Report Entry, Lab Revenue Report |
| **Receptionist** | Dashboard, Patients, Appointments, Lab Bookings (create) |

Access is enforced at the route level — unauthorized routes redirect to the dashboard.

---

## Adding More Users

Only the Super Admin can manage users. To add a new staff member:

1. Log in as Super Admin and go to **Settings → User Management**.
2. The page will prompt you to first invite the user via **Supabase Dashboard → Authentication → Users → Invite User**.
3. Once they have an auth account, return to User Management and click **Add User** to create their profile.

There are no default passwords — Supabase handles all authentication via email invitations or magic links.

---

## Deployment to Vercel

1. Push the project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Vercel will auto-detect Vite. Accept the default build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables in **Vercel Dashboard → Project → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

For production, also configure your Supabase project's **Authentication → URL Configuration**:
- **Site URL:** your Vercel deployment URL
- **Redirect URLs:** `https://your-app.vercel.app/**`

---

## Project Structure

```
src/
  features/          # Feature modules (patients, pharmacy, doctor, lab, reports, settings)
  components/        # Shared UI, form, data, and layout components
  config/            # App constants, route definitions
  hooks/             # Shared React hooks
  lib/               # Supabase client, formatters, PDF generators, utilities
  router/            # Route config with auth and role guards
  store/             # Zustand stores (auth, theme, sidebar)
  types/             # TypeScript type definitions
  styles/            # Global CSS
supabase/
  migrations/        # SQL migration files (run in order)
public/
  logo.svg           # Clinic logo used on invoices and prescriptions
```
