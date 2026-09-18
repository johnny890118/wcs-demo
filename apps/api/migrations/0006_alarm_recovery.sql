CREATE TABLE alarms (
  id uuid PRIMARY KEY,
  transport_task_id uuid NOT NULL REFERENCES transport_tasks(id),
  equipment_id text NOT NULL,
  source_id text NOT NULL,
  code text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'acknowledged', 'cleared')),
  previous_task_status text NOT NULL CHECK (previous_task_status IN ('assigned', 'in_progress')),
  raised_at timestamptz NOT NULL,
  acknowledged_at timestamptz,
  acknowledged_by text,
  cleared_at timestamptz,
  cleared_by text,
  resolution text,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'active' AND acknowledged_at IS NULL AND acknowledged_by IS NULL)
    OR (status IN ('acknowledged', 'cleared') AND acknowledged_at IS NOT NULL AND acknowledged_by IS NOT NULL)
  ),
  CHECK (
    (status <> 'cleared' AND cleared_at IS NULL AND cleared_by IS NULL AND resolution IS NULL)
    OR (status = 'cleared' AND cleared_at IS NOT NULL AND cleared_by IS NOT NULL AND resolution IS NOT NULL)
  )
);

CREATE UNIQUE INDEX alarms_open_task_idx ON alarms(transport_task_id)
  WHERE status IN ('active', 'acknowledged');
CREATE INDEX alarms_status_raised_idx ON alarms(status, raised_at DESC);

ALTER TABLE transport_tasks
  ADD CONSTRAINT transport_tasks_blocking_alarm_fk
  FOREIGN KEY (blocking_alarm_id) REFERENCES alarms(id);
