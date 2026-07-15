# Solar Static Studio Website

Static bilingual About site for Solar Static Studio.

## Stack

- Astro
- TypeScript
- Tailwind CSS v4 through `@tailwindcss/vite`
- Static output for Vercel

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

- Root Directory: `website`
- Build Command: `npm run build`
- Output Directory: `dist`

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
