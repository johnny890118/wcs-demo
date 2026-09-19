ALTER TABLE locations
  ADD CONSTRAINT locations_id_warehouse_unique UNIQUE (id, warehouse_id);

ALTER TABLE warehouse_topologies
  ADD CONSTRAINT warehouse_topologies_identity_warehouse_unique
  UNIQUE (id, revision, warehouse_id);

CREATE TABLE location_topology_bindings (
  location_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  topology_id uuid NOT NULL,
  topology_revision integer NOT NULL,
  node_id text NOT NULL,
  PRIMARY KEY (location_id, topology_id, topology_revision),
  FOREIGN KEY (location_id, warehouse_id)
    REFERENCES locations(id, warehouse_id) ON DELETE CASCADE,
  FOREIGN KEY (topology_id, topology_revision, warehouse_id)
    REFERENCES warehouse_topologies(id, revision, warehouse_id)
    ON DELETE CASCADE,
  FOREIGN KEY (topology_id, topology_revision, node_id)
    REFERENCES topology_nodes(topology_id, topology_revision, node_id)
    ON DELETE CASCADE
);

CREATE INDEX location_topology_bindings_node_idx
  ON location_topology_bindings(topology_id, topology_revision, node_id);
