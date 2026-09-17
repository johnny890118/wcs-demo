ALTER TABLE outbox_events
  ADD COLUMN attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN locked_until timestamptz,
  ADD COLUMN locked_by text,
  ADD COLUMN last_error text;

DROP INDEX outbox_events_unpublished_idx;

CREATE INDEX outbox_events_delivery_idx
  ON outbox_events(next_attempt_at, occurred_at)
  WHERE published_at IS NULL;
