-- ============================================================================
-- RETIRU · Migración 006: Tabla center_claims (flujo "Reclama tu centro")
-- ============================================================================

CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE claim_method AS ENUM ('email_match', 'magic_link', 'manual_request');

CREATE TABLE center_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  status claim_status NOT NULL DEFAULT 'pending',
  method claim_method NOT NULL DEFAULT 'manual_request',
  notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(center_id, user_id)
);

CREATE INDEX idx_claims_pending ON center_claims(status) WHERE status = 'pending';
CREATE INDEX idx_claims_center ON center_claims(center_id);
CREATE INDEX idx_claims_user ON center_claims(user_id);

-- Tabla de tokens para link mágico del email de bienvenida
CREATE TABLE claim_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 months'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claim_tokens_token ON claim_tokens(token);

-- RLS
ALTER TABLE center_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_tokens ENABLE ROW LEVEL SECURITY;

-- Claims: usuario ve los suyos, admin ve todos
CREATE POLICY "clm_own" ON center_claims FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "clm_ins" ON center_claims FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "clm_adm" ON center_claims FOR ALL USING (is_admin(auth.uid()));

-- Tokens: solo admin puede gestionarlos (la API usa service_role)
CREATE POLICY "ctk_adm" ON claim_tokens FOR ALL USING (is_admin(auth.uid()));
