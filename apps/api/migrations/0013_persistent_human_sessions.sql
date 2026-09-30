CREATE TABLE human_access_sessions (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL,
  current_warehouse_id uuid NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revocation_reason text CHECK (
    revocation_reason IS NULL OR revocation_reason IN ('sign_out', 'administrative')
  ),
  CHECK (expires_at > issued_at),
  CHECK (
    (revoked_at IS NULL AND revocation_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revocation_reason IS NOT NULL AND revoked_at >= issued_at)
  ),
  FOREIGN KEY (principal_id, current_warehouse_id)
    REFERENCES warehouse_access_assignments(principal_id, warehouse_id)
);

CREATE INDEX human_access_sessions_principal_active_idx
  ON human_access_sessions(principal_id, expires_at)
  WHERE revoked_at IS NULL;
