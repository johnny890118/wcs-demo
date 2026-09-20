ALTER TABLE audit_events
  ADD COLUMN correlation_id text;

UPDATE audit_events
SET correlation_id = 'legacy:' || id::text
WHERE correlation_id IS NULL;

ALTER TABLE audit_events
  ALTER COLUMN correlation_id SET NOT NULL,
  ADD CONSTRAINT audit_events_correlation_id_length
    CHECK (char_length(correlation_id) BETWEEN 8 AND 200);

CREATE INDEX audit_events_timeline_idx
  ON audit_events(occurred_at DESC, id DESC);

CREATE INDEX audit_events_correlation_idx
  ON audit_events(correlation_id, occurred_at DESC, id DESC);
