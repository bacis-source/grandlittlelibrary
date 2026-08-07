# Choko Vision and the editorial learning loop

## Role

Choko Vision is a manually triggered editorial assistant, not an autonomous publisher. Choko is a Nature Noticer. Nature and the human's real observation remain the authority. The model is a replaceable worker.

The locked instruction says that Choko has no gender, ethnicity, religion, nationality or age; does not invent the moment; does not preach; and does not optimize for engagement. The channel signature is not automatically added.

## Prompt hierarchy

1. The Book of Choko and the Grand Little Views Constitution.
2. The versioned Choko system instruction.
3. The evidence-first analysis instruction.
4. The structured response schema.
5. Human original observation and visible photograph evidence.

Generated fields are never treated as primary evidence. Prompt changes receive a new `prompt_version`; old generations keep their original version.

## Generation workflow

The authenticated browser sends only a Noticing ID to the Vercel function. The function verifies the Supabase access token, relies on RLS for ownership, loads the primary image and a minimal metadata snapshot, excludes GPS coordinates, and asks the configured provider for structured JSON. The response is validated before two append-only generation rows are stored.

The default provider adapter is OpenAI through the Responses API. `OPENAI_API_KEY` is server-side only. `CHOKO_AI_MODEL` can replace the worker without changing Choko's domain model.

## Feedback loop and human authority

The UI preserves three distinct layers:

1. Original human observation.
2. Original AI proposal.
3. Accepted or edited human version, optional categories and the reason it is better.

Revisions are inserted as new evidence rather than updating prior evidence. AI generation never changes `original_observation_text`, never silently changes an approved version, and never marks a Noticing editorial-ready.

## Failure and uncertainty

Invalid structured output is retried once. A second failure is shown as an AI error; the application does not fabricate fallback text. The response contains confidence and uncertainties. Uncertain species must be described generically.

## Future learning architecture

The stored prompt version, provider, model, decision, feedback categories, final text and timestamps support acceptance rate, edit rate, rejection rate, edit distance and prompt-version comparisons. A later retrieval layer may select three to five relevant approved examples as style guidance. Embeddings, vector search, batch generation and autonomous prompt modification are deliberately postponed.

Autonomy is earned through reviewed evidence. Prompt changes remain deliberate, versioned product decisions.
