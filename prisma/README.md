# HireX — Database (Prisma + Supabase Postgres)

The schema in [`schema.prisma`](./schema.prisma) is the source of truth for the
HireX relational model. The database is **Supabase (managed PostgreSQL)** with the
[`pgvector`](https://github.com/pgvector/pgvector) extension for semantic job
matching. Prisma is the ORM; all schema changes go through **reviewed migrations**
(rulebook §12 — never hand-edit the production schema).

## Prerequisites

- `DATABASE_URL` set in your `.env` (see [`.env.example`](../.env.example)).
  This is the only DB config Prisma reads; nothing is hard-coded in the schema.
- The Prisma CLI. Run the commands below with `npx prisma …` (or via a workspace
  script) so the pinned version is used.

## Enable pgvector in Supabase (one-time)

The schema declares the `vector` extension, but the Postgres extension must exist
in the database before migrating. Enable it once, either way:

- **Dashboard:** Database → Extensions → search "vector" → enable.
- **SQL:** run in the Supabase SQL editor (or a migration):

  ```sql
  create extension if not exists vector;
  ```

## Common commands

```bash
# Create + apply a migration in development (prompts for a name):
npx prisma migrate dev --name init

# Regenerate the typed Prisma Client after schema changes:
npx prisma generate

# Apply committed migrations in CI / production (no prompts, no drift):
npx prisma migrate deploy

# Inspect data locally:
npx prisma studio
```

## Vector (ANN) indexes — manual step

Prisma models the embedding columns as `Unsupported("vector(1536)")` because it
has no native vector type, and it does **not** manage approximate-nearest-neighbor
indexes. After the first `migrate dev`, add the indexes by editing the generated
migration SQL (or adding a follow-up migration) before it is applied:

```sql
CREATE INDEX IF NOT EXISTS candidate_profile_embedding_idx
  ON "CandidateProfile" USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS job_embedding_idx
  ON "Job" USING hnsw (embedding vector_cosine_ops);
```

Use the distance operator class that matches how embeddings are compared
(`vector_cosine_ops` for cosine similarity — the default for most text embeddings).
The embedding dimension (1536) must match the model that produces the vectors.

## Notes

- **PII** columns (emails, resume content, names, recipient addresses) are flagged
  inline in the schema. Handle per [PLAN §5](../docs/PROJECT_PLAN.md) — encrypt at
  rest, support export & erasure. `User` deletes cascade to owned rows (GDPR).
- **Enums** mirror `@hirex/shared` so the DB and TypeScript contracts stay aligned.
- **Reads** are paginated (cursor-based) and indexed in the app layer; see the
  `@@index` declarations for the supported query paths.
