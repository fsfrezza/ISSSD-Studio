# v6.92 -> v6.93 regression evidence

The recovered historical corridor shows a concrete architectural change between v6.92 and v6.93.

## v6.92

`teamsV1` used schema version 1. Project persistence for players was names-only. Restoring a project wrote player names back to the working ROM, while attributes and tactics remained original.

## v6.93

`teamsV1` moved to schema version 2 and began persisting additional physical ROM state:

- every persisted player entry could carry the exact 7-byte attribute record as `attrHex`;
- project open restored those 7 bytes directly into the player bank;
- known Plus mirrors were also written directly during project open;
- tactical state could carry a raw 31-byte tactical record as `rawHex`;
- project open restored that tactical record directly into the working ROM.

This is the first adjacent-version change in the critical corridor that turns project loading into broad physical ROM mutation for players and tactics.

## Why this matters

The target architecture is:

```
immutable base ROM
    -> semantic project state
    -> deterministic generated infrastructure
    -> surgical writers
    -> checksum
    -> output ROM
```

Opening a project must therefore be data-only. Raw 7-byte player records and raw 31-byte tactical records may be retained as migration evidence or semantic input, but they must not be written to a working ROM merely because the project was opened.

This finding does not by itself prove that every v6.93 output hangs. It does identify a concrete regression candidate that matches the observed failure mode and violates the current build invariants.

## Guardrail

`canonicalProjectOpen()` exists specifically to make project loading non-mutating. It accepts project data, canonicalizes persistent patches, rejects persisted expansion state, and returns detached semantic data. It accepts no ROM buffer and therefore cannot physically restore player or tactical records during open.
