-- Credit & Bank Surface: loan applications, documents, decisions, risk scores, audit log

CREATE TABLE loan_applications (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id    TEXT NOT NULL,
  step         INTEGER NOT NULL DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','submitted','under_review','approved','rejected','escalated')),
  step1        JSONB,
  step2        JSONB,
  step3        JSONB,
  risk_score   INTEGER,
  risk_band    TEXT CHECK (risk_band IN ('excellent','good','fair','poor','critical')),
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_applications_tenant ON loan_applications (tenant_id);
CREATE INDEX idx_loan_applications_status ON loan_applications (status);

CREATE TABLE loan_documents (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  filename       TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  storage_key    TEXT NOT NULL,
  size_bytes     INTEGER NOT NULL DEFAULT 0,
  uploaded_by    TEXT NOT NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_documents_application ON loan_documents (application_id);

CREATE TABLE credit_decisions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  decision       TEXT NOT NULL CHECK (decision IN ('approved','rejected','escalated')),
  decided_by     TEXT NOT NULL,
  reason         TEXT NOT NULL,
  decided_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_decisions_application ON credit_decisions (application_id);

CREATE TABLE risk_scores (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   TEXT NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  band        TEXT NOT NULL CHECK (band IN ('excellent','good','fair','poor','critical')),
  factors     JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_scores_tenant ON risk_scores (tenant_id);
CREATE INDEX idx_risk_scores_computed ON risk_scores (computed_at DESC);

CREATE TABLE audit_logs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_user_id TEXT NOT NULL,
  actor_role    TEXT NOT NULL,
  tenant_id     TEXT,
  category      TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_audit_logs_tenant   ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_category ON audit_logs (category);
CREATE INDEX idx_audit_logs_occurred ON audit_logs (occurred_at DESC);

-- Trigger to keep updated_at current on loan_applications
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
