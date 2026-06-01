CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'support', 'viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE record_status AS ENUM ('active', 'inactive', 'draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE source_type AS ENUM ('knowledge_article', 'document'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  status record_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'Geral',
  tags text[] NOT NULL DEFAULT '{}',
  status record_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  content text NOT NULL,
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type source_type NOT NULL,
  article_id uuid REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_chunks_source_check CHECK (article_id IS NOT NULL OR document_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS document_chunks_system_idx ON document_chunks(system_id);
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unanswered_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  chat_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status record_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  temperature integer NOT NULL DEFAULT 30,
  max_tokens integer NOT NULL DEFAULT 1200,
  base_prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_system_id uuid DEFAULT NULL,
  match_count integer DEFAULT 8,
  min_similarity double precision DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  source_type source_type,
  article_id uuid,
  document_id uuid,
  system_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.source_type,
    dc.article_id,
    dc.document_id,
    dc.system_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE (match_system_id IS NULL OR dc.system_id = match_system_id)
    AND 1 - (dc.embedding <=> query_embedding) >= min_similarity
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
