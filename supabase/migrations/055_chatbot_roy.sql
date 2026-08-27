-- Chatbot Roy (visitante): KB vectorial, conversaciones y mensajes.
-- No choca con conversations/messages (soporte humano Andrea).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chatbot_kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'es',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_kb_chunks_source ON chatbot_kb_chunks (source);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_chunks_locale ON chatbot_kb_chunks (locale);

CREATE INDEX IF NOT EXISTS idx_chatbot_kb_chunks_embedding_hnsw
  ON chatbot_kb_chunks
  USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_chatbot_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 8,
  filter_locale TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.source,
    c.title,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chatbot_kb_chunks c
  WHERE c.embedding IS NOT NULL
    AND (
      filter_locale IS NULL
      OR c.locale = filter_locale
      OR c.locale = 'all'
    )
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  response_quality TEXT CHECK (response_quality IN ('correcta', 'mejorable', 'incorrecta', 'sin_tipo')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session ON chatbot_conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_last_message ON chatbot_conversations (last_message_at DESC);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_type TEXT CHECK (media_type IS NULL OR media_type = 'image'),
  response_quality TEXT NOT NULL DEFAULT 'sin_tipo'
    CHECK (response_quality IN ('correcta', 'mejorable', 'incorrecta', 'sin_tipo')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON chatbot_messages (conversation_id, created_at);

ALTER TABLE chatbot_kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chatbot_kb_chunks_service_all ON chatbot_kb_chunks;
CREATE POLICY chatbot_kb_chunks_service_all ON chatbot_kb_chunks
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS chatbot_conversations_service_all ON chatbot_conversations;
CREATE POLICY chatbot_conversations_service_all ON chatbot_conversations
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS chatbot_messages_service_all ON chatbot_messages;
CREATE POLICY chatbot_messages_service_all ON chatbot_messages
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON FUNCTION match_chatbot_chunks(vector, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_chatbot_chunks(vector, int, text) TO service_role;
