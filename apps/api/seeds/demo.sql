INSERT INTO platform_metadata (key, value)
VALUES ('deployment_mode', 'demo')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

INSERT INTO warehouses (id, code, name)
VALUES ('10000000-0000-4000-8000-000000000001', 'DEMO', 'Deterministic Demo Warehouse')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;

INSERT INTO locations (id, warehouse_id, code, kind, capabilities)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'RECEIVING-01', 'receiving', ARRAY['load.pickup']),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'STORAGE-A-01', 'storage', ARRAY['load.dropoff', 'inventory.store']),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'SHIPPING-01', 'shipping', ARRAY['load.dropoff', 'outbound.stage'])
ON CONFLICT (id) DO UPDATE
SET warehouse_id = EXCLUDED.warehouse_id,
  code = EXCLUDED.code,
  kind = EXCLUDED.kind,
  capabilities = EXCLUDED.capabilities,
  status = 'available';

UPDATE warehouse_topologies
SET status = 'retired'
WHERE warehouse_id = '10000000-0000-4000-8000-000000000001'
  AND status = 'active';

INSERT INTO warehouse_topologies (id, warehouse_id, revision, status, activated_at)
VALUES (
  '90000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  1,
  'active',
  now()
)
ON CONFLICT (id, revision) DO UPDATE
SET status = EXCLUDED.status, activated_at = EXCLUDED.activated_at;

INSERT INTO topology_nodes
  (topology_id, topology_revision, node_id, kind, capabilities, position)
VALUES
  ('90000000-0000-4000-8000-000000000001', 1, 'RECEIVING-01', 'transfer', ARRAY['load.pickup'], '{"coordinateSystem":"demo","x":0,"y":0}'::jsonb),
  ('90000000-0000-4000-8000-000000000001', 1, 'STORAGE-A-01', 'storage', ARRAY['load.dropoff', 'inventory.store'], '{"coordinateSystem":"demo","x":10,"y":0}'::jsonb),
  ('90000000-0000-4000-8000-000000000001', 1, 'SHIPPING-01', 'shipping', ARRAY['load.dropoff', 'outbound.stage'], '{"coordinateSystem":"demo","x":20,"y":0}'::jsonb)
ON CONFLICT (topology_id, topology_revision, node_id) DO UPDATE
SET kind = EXCLUDED.kind,
  capabilities = EXCLUDED.capabilities,
  position = EXCLUDED.position;

INSERT INTO topology_edges
  (topology_id, topology_revision, edge_id, from_node_id, to_node_id, cost, status)
VALUES
  ('90000000-0000-4000-8000-000000000001', 1, 'RECEIVING-TO-STORAGE', 'RECEIVING-01', 'STORAGE-A-01', 10, 'available'),
  ('90000000-0000-4000-8000-000000000001', 1, 'STORAGE-TO-RECEIVING', 'STORAGE-A-01', 'RECEIVING-01', 10, 'available'),
  ('90000000-0000-4000-8000-000000000001', 1, 'STORAGE-TO-SHIPPING', 'STORAGE-A-01', 'SHIPPING-01', 10, 'available'),
  ('90000000-0000-4000-8000-000000000001', 1, 'SHIPPING-TO-STORAGE', 'SHIPPING-01', 'STORAGE-A-01', 10, 'available')
ON CONFLICT (topology_id, topology_revision, edge_id) DO UPDATE
SET from_node_id = EXCLUDED.from_node_id,
  to_node_id = EXCLUDED.to_node_id,
  cost = EXCLUDED.cost,
  status = EXCLUDED.status;

INSERT INTO location_topology_bindings
  (location_id, warehouse_id, topology_id, topology_revision, node_id)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 1, 'RECEIVING-01'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 1, 'STORAGE-A-01'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 1, 'SHIPPING-01')
ON CONFLICT (location_id, topology_id, topology_revision) DO UPDATE
SET node_id = EXCLUDED.node_id;

INSERT INTO equipment_descriptors
  (equipment_id, warehouse_id, adapter_key, capabilities, supported_commands, constraints)
VALUES (
  'AMR-01',
  '10000000-0000-4000-8000-000000000001',
  'simulator.mobile-transport',
  ARRAY['transport.move', 'load.pickup', 'load.dropoff', 'navigation.graph'],
  ARRAY['bring_online', 'assign_task', 'start_pickup', 'arrive_at_pickup', 'complete_loading', 'arrive_at_destination', 'complete_unloading', 'inject_fault', 'recover', 'mark_offline', 'mark_unknown'],
  '{}'::jsonb
)
ON CONFLICT (equipment_id) DO UPDATE
SET warehouse_id = EXCLUDED.warehouse_id,
  adapter_key = EXCLUDED.adapter_key,
  capabilities = EXCLUDED.capabilities,
  supported_commands = EXCLUDED.supported_commands,
  constraints = EXCLUDED.constraints,
  active = true,
  updated_at = now();

INSERT INTO equipment_observations
  (equipment_id, topology_id, topology_revision, node_id, status,
   task_id, load_id, fault_code, connection_status, quality, sequence,
   observed_at, received_at, source)
VALUES (
  'AMR-01',
  '90000000-0000-4000-8000-000000000001',
  1,
  'RECEIVING-01',
  'idle',
  NULL,
  NULL,
  NULL,
  'connected',
  'good',
  0,
  now(),
  now(),
  'deterministic-demo-seed'
)
ON CONFLICT (equipment_id) DO UPDATE
SET topology_id = EXCLUDED.topology_id,
  topology_revision = EXCLUDED.topology_revision,
  node_id = EXCLUDED.node_id,
  status = EXCLUDED.status,
  task_id = EXCLUDED.task_id,
  load_id = EXCLUDED.load_id,
  fault_code = EXCLUDED.fault_code,
  connection_status = EXCLUDED.connection_status,
  quality = EXCLUDED.quality,
  sequence = EXCLUDED.sequence,
  observed_at = EXCLUDED.observed_at,
  received_at = EXCLUDED.received_at,
  source = EXCLUDED.source;
