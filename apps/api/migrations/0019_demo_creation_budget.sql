-- One global row bounds committed creation, independently of live capacity.
CREATE TABLE demo_creation_budget (
  singleton boolean PRIMARY KEY CHECK (singleton),
  window_started_at timestamptz NOT NULL,
  window_seconds integer NOT NULL CHECK (window_seconds BETWEEN 10 AND 3600),
  maximum_creations integer NOT NULL CHECK (maximum_creations BETWEEN 1 AND 1000),
  creations integer NOT NULL CHECK (creations > 0 AND creations <= maximum_creations)
);
ALTER TABLE demo_creation_budget ENABLE ROW LEVEL SECURITY;
