# Choko Studio Library

A private, mobile-first editorial library for **Grand Little Views — with Choko Von Snack**. A Noticing keeps an original nature image or video together with the human observation that made the photographer stop.

## Stack

React 19, strict TypeScript, Vite, Supabase Auth/PostgreSQL/Storage, React Router, React Hook Form, Zod, Vitest and Vercel.

## Local setup

1. Create a Supabase project.
2. Install the Supabase CLI and run `supabase link`, then `supabase db push`.
3. Copy `.env.example` to `.env.local` and enter the project URL and anon/publishable key.
4. In Supabase Authentication settings, disable new-user signup. Create the owner manually under Authentication → Users.
5. Run `npm install` and `npm run dev`.

The migrations create the private `noticing-assets` bucket, tables, indexes, triggers, RLS and Storage policies. `seed.sql` deliberately contains no user data.

## Commands

- `npm run dev` — local app
- `npm test` — unit/component tests
- `npm run build` — strict typecheck and production build
- `npm run lint` — static analysis

## Vercel deployment

Import the repository in Vercel, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and deploy. Add the Vercel production and preview origins to Supabase's Auth URL allow-list. `vercel.json` supplies SPA routing and baseline security headers.

## Auth and security

There is no registration UI. Every database row carries the Auth user ID, and every RLS policy checks it. Storage is private and paths begin with the owner UUID. The service-role key must never be added to Vite or Vercel client variables.

## Known limitations

- HEIC and MOV originals are accepted, but preview/playback depends on the browser and embedded codec. No fragile browser conversion is attempted.
- Voice notes are recorded and stored; transcription is deliberately deferred.
- Deletion is a recoverable soft delete. A scheduled purge/restore interface is not yet included.
- Upload validation checks declared MIME, extension selection and size; byte-signature inspection needs a later server-side ingestion function.
- Draft observation text is protected in session storage, but selected local files cannot survive a closed browser tab.
- Deployment requires the owner's Supabase and Vercel projects; no credentials are included.
- npm currently reports GHSA-qwww-vcr4-c8h2 in React Router's RSC action handling. This app is a client-only Vite SPA and does not use RSC or server actions, so the affected path is not exposed; update React Router when a patched release is available.
