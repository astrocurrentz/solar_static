# Solar Static Studio Website

Static bilingual About site for Solar Static Studio.

## Stack

- Astro
- TypeScript
- Tailwind CSS v4 through `@tailwindcss/vite`
- Prerendered Astro pages and on-demand endpoints on Vercel

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run verify
```

## Deployment

Use these Vercel settings:

- Root Directory: repository root (the root build command runs from `website`)
- Build Command: use the command in the root `vercel.json`
- Output Directory: Vercel default (the root build puts the Astro adapter output in `.vercel/output`)

## Content

Editable site copy, contact information, metadata, and localized paths live in `src/data/site.ts`.

The project inquiry field labels, options, validation copy, and email section
labels live in `src/data/project-inquiry-copy.ts`.

## Project Inquiry Service

`/start-a-project/` submits to the Vercel Function at
`/api/project-inquiry`. Copy `.env.example` into the deployment environment and
set all five variables. The Supabase schema and 12-month retention job are in
`supabase/migrations/`.

Create and verify schema changes with the Supabase CLI from this directory:

```bash
npx supabase migration list --local
npx supabase db advisors
```

## FREEWILL Album Tracker

The public Work page links to `/work/freewill/`. Tracker records, edits, and exports
are served only through the authenticated `/api/freewill/` endpoints.

Use Node.js 24. Configure the two `FREEWILL_*` variables from `.env.example`
for the tracker deployment. For local development, export the variables in your
shell before running `npm run dev`. Use a test project and account for preview
verification. These variables are independent of the inquiry service settings.

1. Apply the FREEWILL schema migration to the tracker database.
2. In a private SQL session, call `select public.seed_freewill_tracker($snapshot$…$snapshot$::jsonb);`
   with the approved JSON snapshot. Supply ten objects in track order. Each
   object has a `title` and an `instruments` object with `drums`, `bass`, `keys`,
   and `guitars` keys. Each instrument contains boolean `rdy` and `rec` fields.
   The function fills missing records and preserves subsequent changes. Keep the
   snapshot in private storage.
3. Invite the administrator through Supabase Authentication. Insert the user's UUID
   into `core.freewill_admins` in the SQL editor. Set the Auth Site URL to the
   deployed tracker page so the invite opens password setup.
4. Expose the `core` schema in the Supabase Data API and set the project URL
   and publishable key in Vercel. Database policies check
   administrator membership for each authenticated read and update.
