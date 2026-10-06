# Build invariants

The deterministic build pipeline must enforce these invariants before a ROM is offered as output:

1. The immutable Plus base is 0x200000 bytes and is identified by SHA-256.
2. Project loading must not mutate the immutable base.
3. A NO-OP project must reproduce the base byte-for-byte before checksum metadata handling.
4. Player edits use surgical writes; unrelated nibbles/bytes remain untouched.
5. Only empirically verified mirrors are synchronized.
6. Generated expansion infrastructure must not accumulate as repeated persisted 2 MiB project patches.
7. Output size must be one of the explicitly supported canonical sizes.
8. SNES checksum and complement must be exact one's-complement pairs.
9. Every build should emit a byte-diff report: changed byte count and contiguous ranges.
10. A structural change is generated once in the output build copy, never by repeatedly mutating project/base state.

These checks do not replace emulator boot testing. They make structural regressions observable and reproducible.
