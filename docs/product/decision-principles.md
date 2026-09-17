# Product and Decision Principles

Status: Non-negotiable governance baseline

## Product intent

One Smart Warehouse Platform core must support materially different customer warehouses without forking the core per site. Layout, topology, routes, equipment composition, transfer points, resources, operational constraints, and traffic rules vary by customer and over time. Warehouse-specific facts belong in validated configuration and persisted domain data.

The current legacy warehouse is discovery material, a behavior reference, and a regression safety net. Its React tree, SVG elements, numeric cells, coordinates, path arrays, timers, and dispatch assumptions are not target domain truth.

## Non-negotiable requirements

- Warehouse and routing behavior must not be hard-coded to one customer or demo layout.
- The domain model must remain independent of SVG, Canvas, React, and any particular visualization implementation.
- Routes must be calculated from versioned topology and current availability/constraints; a fixed coordinate sequence is scenario data, not architecture.
- Equipment selection must be capability- and contract-based. Core orchestration must not grow a branch per vendor or equipment label.
- The same application-facing contracts must support deterministic simulation and future hardware adapters.
- The product must retain its commercial evolution path, security, accessibility, responsive design, `zh-TW`/`en`, and hardware-free demo requirements.
- Unknown physical outcomes remain `unknown` until reconciliation; visualization state never establishes inventory truth.

## Evidence hierarchy

The owner is authoritative about product intent, business goals, constraints, preferences, and observed problems. Owner-provided equipment names, workflows, node/edge examples, UI ideas, and technical implementation suggestions are working assumptions unless explicitly marked non-negotiable.

Decisions follow:

`Intent -> Research -> Evidence -> Decision -> ADR/documentation -> Implementation -> Verification`

When an example conflicts with standards, credible sources, repository evidence, operational safety, usability, maintainability, or testability, record the conflict and select the design that best satisfies the underlying intent. Do not stop domain research because one plausible implementation was suggested.

## Extensibility discipline

Be extensible, not speculative. Add extension points when current evidence shows stable variation—such as topology edges, constraint evaluators, capabilities, and adapters. Do not pre-implement every possible device, customer workflow, optimization algorithm, or protocol.

During design and review, actively look for likely unspoken customer needs: topology and equipment variation, runtime closures, shared resources, concurrent work, degraded connectivity, recovery, configuration versioning, and integration boundaries. Convert only supported needs into current scope; record the rest as hypotheses.
