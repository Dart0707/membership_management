# Gym Desk

Gym Desk is a small membership management app for front-desk operations. It
handles member registration, QR pass generation, check-in validation, and
member record management from a single browser interface.

## Features

- Register members on daily or 1-month plans
- Price daily and monthly passes by activity, with student discounts
- Generate a QR code for each member pass
- Check members in by scanning a QR code or entering a member ID
- Grant access only to active memberships and track check-ins
- Review daily attendance by date and activity
- Search and filter the member database by status
- View, extend, expire, and delete member records
- Use browser `localStorage` by default, with optional Supabase persistence

## Tech stack

- Next.js 16 (App Router)
- React 19 and TypeScript
- Tailwind CSS
- Supabase
- `html5-qrcode` for camera scanning
- `qrcode.react` for member passes

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project if shared persistence is required

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs without Supabase. In that mode, member records are stored in the
browser that is running the app.

## Supabase setup

Supabase is optional. Configure it when member records need to be shared
between browsers or devices.

1. Create a Supabase project.
2. In the project settings, copy the project URL and publishable key.
3. Create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL
   editor.
5. Restart the development server.

If the attendance table has not been added yet, the app continues using its
local attendance history. Run the updated schema to sync attendance between
browsers and devices.

The schema creates the `public.members` and `public.attendance` tables and enables the policies used by
the browser client. Review those policies before exposing the app beyond a
trusted internal environment.

When Supabase is configured and contains records, those records are loaded as
the displayed member list. The app also keeps a local copy for fallback and
offline continuity.

## Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Serve the production build
npm run lint      # Run ESLint
```

## Project structure

```text
app/              Next.js routes and global styles
components/       Registration, scanner, database, and QR-code UI
lib/              Member types, membership rules, and persistence helpers
supabase/         Database schema and access policies
```

## Deployment

Build the application and serve it with the production server:

```bash
npm run build
npm run start
```

For a hosted deployment, configure the same `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variables in the hosting provider. If
camera scanning is enabled, serve the app over HTTPS; browsers generally
require a secure context before granting camera access.
