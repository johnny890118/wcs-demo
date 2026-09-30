ALTER TABLE audit_events
  DROP CONSTRAINT audit_events_actor_type_check;

ALTER TABLE audit_events
  ADD CONSTRAINT audit_events_actor_type_check
    CHECK (actor_type IN ('user', 'anonymous_demo', 'service', 'system'));
