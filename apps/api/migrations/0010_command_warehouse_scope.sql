DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM transport_tasks task
    JOIN locations source ON source.id = task.source_location_id
    JOIN locations destination ON destination.id = task.destination_location_id
    WHERE source.warehouse_id <> destination.warehouse_id
  ) THEN
    RAISE EXCEPTION 'Cannot add command warehouse scope: a transport task crosses warehouse boundaries.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM transport_tasks task
    JOIN locations source ON source.id = task.source_location_id
    JOIN equipment_descriptors equipment ON equipment.equipment_id = task.equipment_id
    WHERE task.equipment_id IS NOT NULL
      AND source.warehouse_id <> equipment.warehouse_id
  ) THEN
    RAISE EXCEPTION 'Cannot add command warehouse scope: assigned equipment belongs to another warehouse.';
  END IF;
END $$;

ALTER TABLE inbound_receipts
  ADD COLUMN warehouse_id uuid REFERENCES warehouses(id);

UPDATE inbound_receipts receipt
SET warehouse_id = location.warehouse_id
FROM loads load
JOIN locations location ON location.id = load.current_location_id
WHERE load.receipt_id = receipt.id;

ALTER TABLE inbound_receipts
  ALTER COLUMN warehouse_id SET NOT NULL,
  DROP CONSTRAINT inbound_receipts_idempotency_key_key;

CREATE UNIQUE INDEX inbound_receipts_warehouse_idempotency_idx
  ON inbound_receipts(warehouse_id, idempotency_key);

ALTER TABLE outbound_orders
  ADD COLUMN warehouse_id uuid REFERENCES warehouses(id);

UPDATE outbound_orders outbound
SET warehouse_id = location.warehouse_id
FROM locations location
WHERE location.id = outbound.destination_location_id;

ALTER TABLE outbound_orders
  ALTER COLUMN warehouse_id SET NOT NULL,
  DROP CONSTRAINT outbound_orders_idempotency_key_key;

CREATE UNIQUE INDEX outbound_orders_warehouse_idempotency_idx
  ON outbound_orders(warehouse_id, idempotency_key);

ALTER TABLE audit_events
  ADD COLUMN warehouse_id uuid REFERENCES warehouses(id);

UPDATE audit_events audit
SET warehouse_id = receipt.warehouse_id
FROM inbound_receipts receipt
WHERE audit.aggregate_type = 'InboundReceipt'
  AND audit.aggregate_id = receipt.id;

UPDATE audit_events audit
SET warehouse_id = outbound.warehouse_id
FROM outbound_orders outbound
WHERE audit.aggregate_type = 'OutboundOrder'
  AND audit.aggregate_id = outbound.id;

UPDATE audit_events audit
SET warehouse_id = source.warehouse_id
FROM transport_tasks task
JOIN locations source ON source.id = task.source_location_id
WHERE audit.aggregate_type = 'TransportTask'
  AND audit.aggregate_id = task.id;

UPDATE audit_events audit
SET warehouse_id = source.warehouse_id
FROM alarms alarm
JOIN transport_tasks task ON task.id = alarm.transport_task_id
JOIN locations source ON source.id = task.source_location_id
WHERE audit.aggregate_type = 'Alarm'
  AND audit.aggregate_id = alarm.id;

ALTER TABLE audit_events
  ALTER COLUMN warehouse_id SET NOT NULL;

CREATE INDEX audit_events_warehouse_timeline_idx
  ON audit_events(warehouse_id, occurred_at DESC, id DESC);
