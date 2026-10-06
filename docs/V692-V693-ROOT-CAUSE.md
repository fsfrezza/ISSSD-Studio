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

Opening a project must therefore be data-only. Raw 7-byte player records and raw 31-byte tactical records may be accepted as migration input, but they must not be written to a working ROM merely because the project was opened.

This finding does not by itself prove that every v6.93 output hangs. It does identify a concrete regression candidate that matches the observed failure mode and violates the current build invariants.

## Recovery implemented in the deterministic core

The core now treats the v6.93 physical snapshots as legacy import data and converts them before build.

### Project open

`canonicalProjectOpen()` is data-only. It accepts no ROM buffer, rejects persisted expansion state and returns detached canonical semantic state.

### Player records

Legacy `attrHex` is parsed through the verified Plus 7-byte player layout. Known fields become `playerEdits`:

- nine skills, converted from raw nibble 0-9 to UI value 1-10;
- natural position;
- jersey number.

The appearance byte is retained only as opaque `appearanceRaw` metadata and is deliberately not writable until its semantics are independently validated. Malformed or semantically invalid legacy records are quarantined rather than written.

During build, the built-in Plus player writer applies only verified surgical fields. Known Brazil mirrors are synchronized automatically; unrelated teams receive no invented mirror write.

### Tactical records

Legacy 31-byte `rawHex` is discarded after migration to canonical `plusTactics` state. The proven native layout is:

- byte 0: formation index;
- bytes 1-20: ten signed native X/Y coordinate pairs;
- bytes 21-30: ten flags;
- flag bits 0-1: DF=1, MC/MF=2, AT/FW=3;
- flag bit 0x04: attack participation.

Canonical tactical X is global field X (-57..57); Y is -39..39. The native X delta is reconstructed from the player's tactical zone. Unknown high flag bits are preserved when a semantic edit is encoded.

### Generated tactical infrastructure

A semantic tactical edit no longer requires a prepared 4 MiB image to be persisted in the project. During build only, the core can generate the validated bank-selector architecture recovered from the historical Studio:

1. expand a 2 MiB build copy to 4 MiB, filling new space with `0xFF` and setting the SNES ROM-size byte to `0x0C`;
2. keep the original 57-entry 16-bit pointer table at PC `0x05FDD0` unchanged;
3. group entries that share a pointer;
4. keep the first user in bank `0x8B` and clone later users to banks `0xC0..0xC7` at the same 16-bit address;
5. generate the `ISSDTACTBANKV1` bank-selector table and its three helpers;
6. patch only the three historically validated tactical loaders after exact fingerprint preflight;
7. apply the semantic tactical writer only after every edited team's record resolves to an exclusive physical record.

The tactical writer refuses unresolved or still-shared records instead of silently modifying a preset used by another team.

## Current build order

For a canonical Plus project, the deterministic path is now:

```
immutable 2 MiB base
    -> validated persisted native patches below the base boundary
    -> caller/generated infrastructure
    -> generated tactical bank-selector infrastructure when tactical edits exist
    -> surgical player writer
    -> exclusive-record tactical writer
    -> optional additional writers
    -> checksum
    -> output ROM
```

Generated 4 MiB tactical infrastructure exists only in the output build copy. It is not valid persistent `.issdproj` storage.
