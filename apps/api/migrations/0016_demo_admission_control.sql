-- Control-plane records deliberately survive resettable operational audit.
CREATE TABLE demo_session_reservations (
  session_id uuid PRIMARY KEY,
  template_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  deployment_profile text NOT NULL CHECK (deployment_profile = 'public_demo'),
  ttl_seconds integer NOT NULL CHECK (ttl_seconds BETWEEN 300 AND 7200),
  state text NOT NULL CHECK (state IN ('provisioning', 'expired')),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CHECK (expires_at = created_at + ttl_seconds * interval '1 second')
);

CREATE INDEX demo_session_expiry_candidates
  ON demo_session_reservations (expires_at, session_id)
  WHERE state = 'provisioning';

CREATE TABLE demo_session_control_events (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES demo_session_reservations(session_id),
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  action text NOT NULL CHECK (action IN ('demo_session.reserved', 'demo_session.expired')),
  actor_type text NOT NULL CHECK (actor_type IN ('anonymous_demo', 'system')),
  actor_id text NOT NULL CHECK (length(actor_id) BETWEEN 1 AND 120),
  UNIQUE (session_id, action)
);

ALTER TABLE demo_session_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_session_control_events ENABLE ROW LEVEL SECURITY;
