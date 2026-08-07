# Architecture

## Overview and data flow

The React client authenticates directly with Supabase Auth. Protected routes wait for session resolution. The app writes relational metadata to PostgreSQL and uploads original bytes to a private Storage bucket. Asset rows reference immutable object paths; temporary signed URLs are generated only for display.

New Noticing flow: validate → insert draft-compatible Noticing → normalize/upsert tags → upload each original → insert asset metadata → navigate to detail. A partial upload leaves the entity as a draft rather than pretending the operation completed.

## Domain model

`noticings` is the aggregate root. `noticing_assets`, `noticing_notes`, `noticing_tags` and `publication_records` are owned children. Tags are normalized per user. `original_observation_text` is protected by a trigger after first save; subsequent edits affect only `observation_text`. Publication summary status is separate from historical records.

## Security model

All user tables have RLS and compare `auth.uid()` with `user_id`. Child policies additionally verify ownership of the parent Noticing, and triggers reject mismatched owners. The bucket is private; object policies require its first path segment to match the authenticated user. Client-side route protection is usability, while RLS and Storage policies are the actual authorization boundary.

## Storage

`{user_id}/noticings/{noticing_id}/originals/{asset_id}-{filename}` stores visual originals. Voice notes use `audio/`. Future non-original files belong under `derived/thumbnails` or `derived/social/{platform}`. Original object paths are never overwritten.

## Mobile and resilience

The form is single-column on small screens, uses native media selection, local previews, large controls, per-operation feedback and session draft protection. Database-backed draft entities provide recovery after upload failures. Future PWA/background sync can wrap the service layer without changing the domain model.

## Extension points

AI output should be added as versioned notes or a dedicated provenance table containing model, prompt and version; it must not update the original observation. Server-side media processing can create derived asset rows. Transcription can attach both audio and text. Platforms extend `publication_records` without altering Noticings.

## Choko Vision

AI runs only after a manual action on a Noticing detail page. A Vercel server function authenticates the Supabase bearer token, reads the user-owned Noticing through RLS, downloads the primary private image and calls a provider adapter. No AI secret is shipped in the Vite client. Precise coordinates are excluded from the input snapshot.

`ai_generations` stores immutable provider output and provenance. `editorial_revisions` stores append-only human decisions, wording and reasons. A generation group connects the Choko Noticing and caption produced by one analysis. Structured output is validated before persistence. See `docs/CHOKO_AI.md`.

## Product context

Nature and the real moment remain the subject. Choko is a genderless, nationality-free Nature Noticer governed by documented rules rather than model drift. Quality outranks reach; originals should not be over-edited. AI may suggest but never erase the photographer's thought, and generated work must remain traceable.
