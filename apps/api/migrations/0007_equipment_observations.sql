CREATE TABLE equipment_observations (
  equipment_id text PRIMARY KEY REFERENCES equipment_descriptors(equipment_id) ON DELETE CASCADE,
  topology_id uuid,
  topology_revision integer,
  node_id text,
  status text NOT NULL CHECK (status IN (
    'offline', 'idle', 'assigned', 'moving_to_pickup', 'loading',
    'moving_to_destination', 'unloading', 'faulted', 'unknown'
  )),
  task_id text,
  load_id text,
  fault_code text,
  connection_status text NOT NULL CHECK (connection_status IN ('connected', 'disconnected')),
  quality text NOT NULL CHECK (quality IN ('good', 'uncertain', 'bad', 'unknown')),
  sequence bigint NOT NULL CHECK (sequence BETWEEN 0 AND 9007199254740991),
  observed_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (btrim(source) <> ''),
  FOREIGN KEY (topology_id, topology_revision)
    REFERENCES warehouse_topologies(id, revision),
  FOREIGN KEY (topology_id, topology_revision, node_id)
    REFERENCES topology_nodes(topology_id, topology_revision, node_id),
  CHECK (
    (topology_id IS NULL AND topology_revision IS NULL AND node_id IS NULL)
    OR
    (topology_id IS NOT NULL AND topology_revision IS NOT NULL)
  )
);

CREATE INDEX equipment_observations_freshness_idx
  ON equipment_observations(received_at DESC, equipment_id);
