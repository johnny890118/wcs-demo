ALTER TABLE demo_session_reservations ADD CONSTRAINT demo_reservation_template_identity
  UNIQUE (session_id, template_warehouse_id);

CREATE TABLE demo_reference_workspaces (
  session_id uuid PRIMARY KEY REFERENCES demo_session_reservations(session_id),
  workspace_warehouse_id uuid NOT NULL UNIQUE REFERENCES warehouses(id),
  workspace_topology_id uuid NOT NULL,
  workspace_topology_revision integer NOT NULL CHECK (workspace_topology_revision = 1),
  template_warehouse_id uuid NOT NULL,
  template_topology_id uuid NOT NULL,
  template_topology_revision integer NOT NULL,
  reference_map jsonb NOT NULL CHECK (jsonb_typeof(reference_map) = 'object'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (workspace_warehouse_id <> template_warehouse_id),
  CHECK (workspace_topology_id <> template_topology_id),
  FOREIGN KEY (session_id, template_warehouse_id)
    REFERENCES demo_session_reservations(session_id, template_warehouse_id),
  FOREIGN KEY (workspace_topology_id, workspace_topology_revision, workspace_warehouse_id)
    REFERENCES warehouse_topologies(id, revision, warehouse_id),
  FOREIGN KEY (template_topology_id, template_topology_revision, template_warehouse_id)
    REFERENCES warehouse_topologies(id, revision, warehouse_id)
);
ALTER TABLE demo_reference_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_session_control_events DROP CONSTRAINT demo_session_control_events_action_check;
ALTER TABLE demo_session_control_events ADD CONSTRAINT demo_session_control_events_action_check
  CHECK (action IN ('demo_session.reserved', 'demo_session.expired', 'demo_session.workspace_snapshotted'));
