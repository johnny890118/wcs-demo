ALTER TABLE inventory_units DROP CONSTRAINT inventory_units_status_check;
ALTER TABLE inventory_units
  ADD CONSTRAINT inventory_units_status_check
  CHECK (status IN ('available', 'reserved', 'quarantined', 'shipped'));
