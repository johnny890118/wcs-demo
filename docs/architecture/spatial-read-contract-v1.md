# Spatial read contract v1

S2 read-only foundation; not S6 spatial authoring or equipment authority.

## Evidence and decision

EquipmentObservationWrite already carries topology ID/revision and node ID.
Adapters normalize into that contract before persistence. Live View validates
the active topology/node, observation quality/connectivity and received-evidence
deadline. Assignment is not observation. Location codes derive from explicit
active-version bindings, never label matching.

Topology nodes may carry coordinateSystem and finite X/Y/optional Z. The database
does not record physical units, floor identity, coordinate-frame identity or
calibration. The inspector scales diagram coordinates or uses a schematic grid;
neither representation supplies physical coordinates. Z is not a floor number.

The v1 spatial read context therefore identifies the normalized position basis
as a versioned topology node, preserves distinct configured diagram coordinate
systems, and marks physical layout/unit/floor/frame/calibration as unrecorded.
Each usable position includes its topology ID/revision/node reference; unknown
positions have no reference. This is a read qualification, not a second topology
or customer-specific map model. No new ADR is needed to apply existing observation
and presentation-versus-domain decisions.

## Contract and guard

`spatialContext` has contractVersion 1, positionRepresentation
`versioned_topology_node`, physicalLayout `unrecorded`, and coordinateSystems.
Each coordinate-system identifier labels configured topology diagram data only;
unit, floorId and coordinateFrameId are null; calibration is `unrecorded`.
No node coordinates means an empty list, not an implicit default frame.
Identifiers are deduplicated/sorted; different systems are not merged or assumed
convertible. The response guard verifies context against returned topology and
position references against the qualified node/version; unsupported physical
claims fail closed.

## Future boundary

S6 may persist floors/frames, units, calibration and transformation governance.
Real vendor coordinates must be normalized behind an adapter/configuration
boundary into an explicitly qualified warehouse frame before physical overlays
can consume them. This v1 does not implement vendor transforms or claim meter,
axis, origin, floor or safety equivalence. Future contract evolution must carry
the new recorded provenance; it must not reinterpret diagram numbers silently.

No DB migration, new network request, physical layout, map editor, command lease,
position-based routing, warehouse-wide snapshot or commissioning claim is added.
