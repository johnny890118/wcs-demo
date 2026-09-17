ALTER TABLE locations DROP CONSTRAINT locations_type_check;
ALTER TABLE locations RENAME COLUMN type TO kind;
ALTER TABLE locations
  ADD COLUMN capabilities text[] NOT NULL DEFAULT ARRAY[]::text[];

UPDATE locations
SET capabilities = CASE kind
  WHEN 'receiving' THEN ARRAY['load.pickup']::text[]
  WHEN 'storage' THEN ARRAY['load.dropoff', 'inventory.store']::text[]
  WHEN 'shipping' THEN ARRAY['load.dropoff']::text[]
  ELSE ARRAY[]::text[]
END;

CREATE TABLE warehouse_topologies (
  id uuid NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  revision integer NOT NULL CHECK (revision > 0),
  status text NOT NULL CHECK (status IN ('draft', 'active', 'retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  PRIMARY KEY (id, revision)
);

CREATE UNIQUE INDEX warehouse_topologies_one_active_idx
  ON warehouse_topologies(warehouse_id)
  WHERE status = 'active';

CREATE TABLE topology_nodes (
  topology_id uuid NOT NULL,
  topology_revision integer NOT NULL,
  node_id text NOT NULL,
  kind text NOT NULL,
  capabilities text[] NOT NULL DEFAULT ARRAY[]::text[],
  position jsonb,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (topology_id, topology_revision, node_id),
  FOREIGN KEY (topology_id, topology_revision)
    REFERENCES warehouse_topologies(id, revision) ON DELETE CASCADE
);

CREATE TABLE topology_edges (
  topology_id uuid NOT NULL,
  topology_revision integer NOT NULL,
  edge_id text NOT NULL,
  from_node_id text NOT NULL,
  to_node_id text NOT NULL,
  cost double precision NOT NULL CHECK (cost > 0 AND cost < 'Infinity'::double precision),
  status text NOT NULL CHECK (status IN ('available', 'blocked')),
  required_capabilities text[] NOT NULL DEFAULT ARRAY[]::text[],
  resource_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  geometry jsonb,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (topology_id, topology_revision, edge_id),
  FOREIGN KEY (topology_id, topology_revision, from_node_id)
    REFERENCES topology_nodes(topology_id, topology_revision, node_id),
  FOREIGN KEY (topology_id, topology_revision, to_node_id)
    REFERENCES topology_nodes(topology_id, topology_revision, node_id),
  CHECK (from_node_id <> to_node_id)
);

CREATE TABLE equipment_descriptors (
  equipment_id text PRIMARY KEY,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  adapter_key text NOT NULL,
  capabilities text[] NOT NULL DEFAULT ARRAY[]::text[],
  supported_commands text[] NOT NULL DEFAULT ARRAY[]::text[],
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX equipment_descriptors_warehouse_active_idx
  ON equipment_descriptors(warehouse_id, equipment_id)
  WHERE active;

CREATE TABLE route_plans (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL UNIQUE REFERENCES transport_tasks(id),
  topology_id uuid NOT NULL,
  topology_revision integer NOT NULL,
  total_cost double precision NOT NULL CHECK (total_cost >= 0 AND total_cost < 'Infinity'::double precision),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (topology_id, topology_revision)
    REFERENCES warehouse_topologies(id, revision)
);

CREATE TABLE route_plan_edges (
  route_plan_id uuid NOT NULL REFERENCES route_plans(id) ON DELETE CASCADE,
  sequence integer NOT NULL CHECK (sequence >= 0),
  edge_id text NOT NULL,
  PRIMARY KEY (route_plan_id, sequence)
);
