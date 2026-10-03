ALTER TABLE demo_session_reservations DROP CONSTRAINT demo_session_reservations_state_check;
ALTER TABLE demo_session_reservations ADD CONSTRAINT demo_session_reservations_state_check
  CHECK (state IN ('provisioning', 'expired', 'closed'));
CREATE INDEX demo_reservation_open_capacity ON demo_session_reservations (session_id)
  WHERE state <> 'closed';

CREATE TABLE demo_reference_cleanup_jobs (
  session_id uuid PRIMARY KEY REFERENCES demo_session_reservations(session_id),
  lease_token uuid NOT NULL UNIQUE,
  lease_expires_at timestamptz NOT NULL,
  attempt integer NOT NULL CHECK (attempt > 0),
  state text NOT NULL CHECK (state IN ('running', 'completed')),
  completed_at timestamptz,
  CHECK ((state = 'completed') = (completed_at IS NOT NULL))
);

-- Immutable ownership evidence survives removal of the live reference namespace.
-- Intentionally no foreign key to the resources that cleanup removes.
CREATE TABLE demo_reference_cleanup_archives (
  session_id uuid PRIMARY KEY REFERENCES demo_session_reservations(session_id),
  lease_token uuid NOT NULL,
  reference_snapshot jsonb,
  cleaned_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (reference_snapshot IS NULL OR jsonb_typeof(reference_snapshot) = 'object')
);
ALTER TABLE demo_reference_cleanup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_reference_cleanup_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_session_control_events DROP CONSTRAINT demo_session_control_events_action_check;
ALTER TABLE demo_session_control_events ADD CONSTRAINT demo_session_control_events_action_check
  CHECK (action IN ('demo_session.reserved', 'demo_session.expired',
    'demo_session.workspace_snapshotted', 'demo_session.references_cleaned'));
