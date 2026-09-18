CREATE TABLE outbound_orders (
  id uuid PRIMARY KEY,
  external_reference text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  request_hash char(64) NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  destination_location_id uuid NOT NULL REFERENCES locations(id),
  status text NOT NULL CHECK (status IN ('requested', 'allocated', 'in_progress', 'completed', 'cancelled')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory_allocations (
  id uuid PRIMARY KEY,
  outbound_order_id uuid NOT NULL REFERENCES outbound_orders(id),
  inventory_unit_id uuid NOT NULL REFERENCES inventory_units(id),
  source_location_id uuid NOT NULL REFERENCES locations(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL CHECK (status IN ('reserved', 'released', 'consumed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inventory_allocations_inventory_active_idx
  ON inventory_allocations(inventory_unit_id)
  WHERE status = 'reserved';

ALTER TABLE transport_tasks
  ALTER COLUMN receipt_id DROP NOT NULL,
  ALTER COLUMN load_id DROP NOT NULL,
  ADD COLUMN outbound_order_id uuid REFERENCES outbound_orders(id),
  ADD COLUMN inventory_allocation_id uuid UNIQUE REFERENCES inventory_allocations(id),
  ADD CONSTRAINT transport_tasks_flow_owner_check CHECK (
    (
      receipt_id IS NOT NULL AND load_id IS NOT NULL
      AND outbound_order_id IS NULL AND inventory_allocation_id IS NULL
    ) OR (
      receipt_id IS NULL AND load_id IS NULL
      AND outbound_order_id IS NOT NULL AND inventory_allocation_id IS NOT NULL
    )
  );

CREATE INDEX transport_tasks_outbound_order_idx
  ON transport_tasks(outbound_order_id)
  WHERE outbound_order_id IS NOT NULL;
