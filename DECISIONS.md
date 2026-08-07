# Architecture decisions

## ADR-001 — Supabase Auth from v0.1
Accepted. Auth and ownership are foundational; the manually created owner avoids public registration.

## ADR-002 — Originals are immutable
Accepted. Originals receive unique paths and uploads never use upsert. Derived media gets separate paths and records.

## ADR-003 — Noticing is the aggregate root
Accepted. Assets, tags, notes and publications are contextual children, not free-standing library objects.

## ADR-004 — Publication history is separate
Accepted. A summary status supports filtering while records preserve repeated, cross-platform history.

## ADR-005 — AI is outside v0.1
Accepted. The schema leaves versioned note/provenance extension points without premature agent logic.

## ADR-006 — Normalized tag entities
Accepted. Separate tags prevent spelling/case duplicates and support future discovery without a heavy taxonomy.

## ADR-007 — Preserve unsupported originals
Accepted. HEIC/MOV may be stored with a preview warning. Server-side derived previews are preferable to memory-heavy browser conversion.

## ADR-008 — Voice recording without transcription
Accepted. MediaRecorder output is capability-selected and saved as audio. Future transcription must keep secrets server-side.

## ADR-009 — Recoverable deletion
Accepted. `deleted_at` removes a Noticing from normal queries while retaining records and originals for later recovery/purge.

## ADR-010 — AI output is separate from human observation
Accepted. AI proposals live in `ai_generations`; they cannot overwrite human-authored observation fields.

## ADR-011 — Human revisions are immutable learning evidence
Accepted. Each editorial decision creates a new revision containing the AI original, human final text and optional reason/categories. No update policy is granted.

## ADR-012 — Choko identity is model-independent
Accepted. Prompts and provider interfaces define Choko separately from the configured AI model. The model is a replaceable worker.

## ADR-013 — AI generation is manually triggered
Accepted. Photographs are sent only after the authenticated editor chooses “Let Choko notice this”.

## ADR-014 — Prompt changes are versioned
Accepted. Every generation records its prompt version, provider and model. New prompt behavior requires a new version.

## ADR-015 — No autonomous prompt self-modification
Accepted. Feedback is retained for reviewed retrieval and future deliberate prompt improvements; it never rewrites Choko's governing prompt automatically.
