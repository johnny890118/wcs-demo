CREATE TABLE warehouses (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id uuid PRIMARY KEY,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('receiving', 'storage', 'shipping')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'disabled')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);

CREATE TABLE inbound_receipts (
  id uuid PRIMARY KEY,
  external_reference text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  request_hash char(64) NOT NULL,
  status text NOT NULL CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE loads (
  id uuid PRIMARY KEY,
  external_id text NOT NULL UNIQUE,
  receipt_id uuid NOT NULL REFERENCES inbound_receipts(id),
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL CHECK (status IN ('received', 'in_transit', 'stored')),
  current_location_id uuid NOT NULL REFERENCES locations(id),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory_units (
  id uuid PRIMARY KEY,
  load_id uuid NOT NULL UNIQUE REFERENCES loads(id),
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  location_id uuid NOT NULL REFERENCES locations(id),
  status text NOT NULL CHECK (status IN ('available', 'reserved', 'quarantined')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transport_tasks (
  id uuid PRIMARY KEY,
  receipt_id uuid NOT NULL REFERENCES inbound_receipts(id),
  load_id uuid NOT NULL REFERENCES loads(id),
  source_location_id uuid NOT NULL REFERENCES locations(id),
  destination_location_id uuid NOT NULL REFERENCES locations(id),
  equipment_id text,
  status text NOT NULL CHECK (status IN ('queued', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled', 'unknown')),
  blocking_alarm_id uuid,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_location_id <> destination_location_id)
);

CREATE INDEX transport_tasks_status_idx ON transport_tasks(status);
CREATE UNIQUE INDEX transport_tasks_equipment_active_idx ON transport_tasks(equipment_id)
  WHERE status IN ('assigned', 'in_progress', 'blocked', 'unknown');

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX outbox_events_unpublished_idx ON outbox_events(occurred_at)
  WHERE published_at IS NULL;

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'service', 'system')),
  actor_id text NOT NULL,
  action text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  details jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_aggregate_idx
  ON audit_events(aggregate_type, aggregate_id, occurred_at);

CREATE TABLE platform_metadata (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
