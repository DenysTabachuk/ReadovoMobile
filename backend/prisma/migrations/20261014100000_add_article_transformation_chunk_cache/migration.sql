CREATE TABLE "article_transformation_chunks" (
  "cache_key" text PRIMARY KEY,
  "adapted_blocks" jsonb NOT NULL,
  "expires_at" timestamptz(6) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now()
);

CREATE INDEX "article_transformation_chunks_expires_at_idx"
  ON "article_transformation_chunks" ("expires_at");
