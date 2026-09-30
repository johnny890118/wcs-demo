CREATE TABLE access_principals (
  id uuid PRIMARY KEY,
  principal_kind text NOT NULL CHECK (principal_kind = 'human'),
  identity_provider text NOT NULL CHECK (char_length(identity_provider) BETWEEN 1 AND 80),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 120),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 160),
  status text NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identity_provider, subject)
);

CREATE TABLE warehouse_access_assignments (
  principal_id uuid NOT NULL REFERENCES access_principals(id),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  permissions text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'revoked')),
  is_default boolean NOT NULL DEFAULT false,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (principal_id, warehouse_id),
  CHECK (cardinality(permissions) > 0),
  CHECK (
    permissions <@ ARRAY[
      'operations.view',
      'audit.view',
      'inbound.create',
      'outbound.create',
      'transport.execute',
      'alarm.acknowledge',
      'alarm.recover'
    ]::text[]
  ),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE UNIQUE INDEX warehouse_access_assignments_default_idx
  ON warehouse_access_assignments(principal_id)
  WHERE is_default AND status = 'active';

CREATE INDEX warehouse_access_assignments_active_idx
  ON warehouse_access_assignments(principal_id, warehouse_id)
  WHERE status = 'active';

-- Existing managed demo databases are migrated without turning the demo
-- identity into a production default. Fresh demo databases receive the same
-- rows from the deterministic seed after migrations.
INSERT INTO access_principals
  (id, principal_kind, identity_provider, subject, display_name, status)
SELECT
  'a0000000-0000-4000-8000-000000000001',
  'human',
  'demo-credentials',
  'legacy-demo-admin',
  'Demo Administrator',
  'active'
WHERE EXISTS (
  SELECT 1 FROM platform_metadata
  WHERE key = 'deployment_mode' AND value = 'demo'
)
ON CONFLICT (identity_provider, subject) DO NOTHING;

INSERT INTO warehouse_access_assignments
  (principal_id, warehouse_id, permissions, status, is_default)
SELECT
  principal.id,
  warehouse.id,
  ARRAY[
    'operations.view',
    'audit.view',
    'inbound.create',
    'outbound.create',
    'transport.execute',
    'alarm.acknowledge',
    'alarm.recover'
  ]::text[],
  'active',
  true
FROM access_principals principal
JOIN warehouses warehouse
  ON warehouse.id = '10000000-0000-4000-8000-000000000001'
WHERE principal.identity_provider = 'demo-credentials'
  AND principal.subject = 'legacy-demo-admin'
  AND EXISTS (
    SELECT 1 FROM platform_metadata
    WHERE key = 'deployment_mode' AND value = 'demo'
  )
ON CONFLICT (principal_id, warehouse_id) DO NOTHING;
