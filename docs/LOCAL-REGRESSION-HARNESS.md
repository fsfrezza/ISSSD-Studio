# Local regression harness

This harness is intentionally ROM-free in Git. It is for comparing recovered Studio behavior against the immutable commercial Plus base ROM on a developer machine.

## Required local inputs

- Clean Plus base ROM: exactly 2,097,152 bytes.
- Expected SHA-256: `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`.
- Recovered historical HTML/project artifacts as listed in `docs/REGRESSION-CORRIDOR.md`.

Never commit the ROM or generated commercial-ROM derivatives.

## First executable corridor

1. v6.92 — `ISSSD-Studio-v6.92-TROCAS-ESCALACAO-E-CAMPO.html`
2. v6.93 — `ISSSD-Studio-v6.93-PERSISTENCIA-EQUIPES.html`
3. Continue forward through every recovered version; do not assume v7.01 is the end of history.

The v6.92/v6.93 boundary is prioritized because v6.93 introduced team persistence changes, not because the regression is assumed to originate there.

## A/B cases for each candidate version

A. Open clean base ROM and save with no project.
B. Open project, disable every project change, then save.
C. Apply exactly one non-mirrored player skill edit.
D. Apply exactly one empirically mirrored Brazil player skill edit.
E. Load the recovered Brasil project unchanged.

For every generated ROM record:

- source Studio version and SHA-256;
- source project and SHA-256;
- output byte length;
- output SHA-256;
- checksum/complement status;
- changed byte count and changed ranges versus clean base;
- emulator boot result;
- whether any 2 MiB patch at `0x200000` was present in the project.

A regression is established only when adjacent recovered versions produce a reproducible behavioral difference under the same input. Convert that difference to an automated test before changing production behavior.
