ALTER TABLE demo_reference_workspaces ADD CONSTRAINT demo_workspace_session_owner
  UNIQUE (session_id, workspace_warehouse_id);
CREATE TABLE demo_simulator_runtime_owners (
  session_id uuid PRIMARY KEY,
  warehouse_id uuid NOT NULL UNIQUE,
  lease_token uuid NOT NULL UNIQUE,
  lease_expires_at timestamptz NOT NULL,
  generation integer NOT NULL CHECK (generation > 0),
  state text NOT NULL CHECK (state IN ('initializing', 'active', 'unknown')),
  first_claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  activated_at timestamptz,
  CHECK (state <> 'active' OR activated_at IS NOT NULL),
  FOREIGN KEY (session_id, warehouse_id)
    REFERENCES demo_reference_workspaces(session_id, workspace_warehouse_id)
);
ALTER TABLE demo_simulator_runtime_owners ENABLE ROW LEVEL SECURITY;
CREATE TABLE demo_simulator_owner_generations (
  session_id uuid NOT NULL REFERENCES demo_session_reservations(session_id),
  generation integer NOT NULL CHECK (generation > 0),
  lease_token uuid NOT NULL UNIQUE,
  initial_state text NOT NULL CHECK (initial_state IN ('initializing', 'unknown')),
  initial_lease_expires_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (session_id, generation)
);
ALTER TABLE demo_simulator_owner_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_session_control_events DROP CONSTRAINT demo_session_control_events_action_check;
ALTER TABLE demo_session_control_events ADD CONSTRAINT demo_session_control_events_action_check
  CHECK (action IN ('demo_session.reserved', 'demo_session.expired',
    'demo_session.workspace_snapshotted', 'demo_session.references_cleaned',
    'demo_session.runtime_claimed', 'demo_session.runtime_activated'));
