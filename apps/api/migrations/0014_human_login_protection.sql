CREATE TABLE human_login_throttles (
  identity_provider text NOT NULL
    CHECK (char_length(identity_provider) BETWEEN 1 AND 80),
  identifier_fingerprint char(64) NOT NULL
    CHECK (identifier_fingerprint ~ '^[0-9a-f]{64}$'),
  failure_count integer NOT NULL CHECK (failure_count > 0),
  window_started_at timestamptz NOT NULL,
  last_failed_at timestamptz NOT NULL,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (identity_provider, identifier_fingerprint),
  CHECK (last_failed_at >= window_started_at),
  CHECK (blocked_until IS NULL OR blocked_until >= last_failed_at)
);

CREATE TABLE authentication_security_events (
  id uuid PRIMARY KEY,
  identity_provider text NOT NULL
    CHECK (char_length(identity_provider) BETWEEN 1 AND 80),
  identifier_fingerprint char(64) NOT NULL
    CHECK (identifier_fingerprint ~ '^[0-9a-f]{64}$'),
  outcome text NOT NULL CHECK (outcome IN ('failed', 'throttled')),
  correlation_id text NOT NULL
    CHECK (char_length(correlation_id) BETWEEN 8 AND 200),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX authentication_security_events_occurred_idx
  ON authentication_security_events(occurred_at DESC, id DESC);
