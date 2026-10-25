# Cascão: body graphics in SRAM-routed banks

The diagnostic reference ROM corrupted the field during play. Two copies of
that exact ROM, changing only Ronaldo's appearance byte from 15 to 0 or 14
(and updating the checksum), did not reproduce the corruption in the user's
comparison. This isolates the type-15 rendering path in that test.

The original Cascão atlas placed 389 pose references in CPU banks F0–F3
(99 + 97 + 97 + 96 in the supplied project). The original-style body atlas
was outside those banks. Early affected frames included Up_Dive1 and
Down_Dive1, followed by knocked-over frames.

The ZSNES 1.42 source distributed in Debian's zsnes_1.420.orig.tar.gz
installs unconditional SRAM read handlers for F0–F3 in src/init.asm
(the “LoROM SRAM mapping” section). In src/cpu/memory.asm,
sramaccessbankr16 and sramaccessbankr16b read the battery RAM without
selecting ROM for upper-half addresses. The DMA reader in src/cpu/dma.asm
also uses the bank's read handler.

Thus a body-length read from these banks can return FFFF from erased SRAM
instead of the ROM header. Native CODE_84E6C2 reads this header and queues
it as the VRAM upload length. A 65535-byte upload explains corruption
extending far beyond a player sprite. This is an emulator compatibility
hazard, not an inherently invalid SNES LoROM address.

The allocator now skips PC 380000–39FFFF (CPU F0–F3) and continues at
3A0000. Both body halves and their headers still fit within one 32 KiB
bank, and the existing 3DC000 allocation limit still applies. The change
preserves Cascão drawings and does not spend native hair overlay slots.

The regression enumerates both atlases, checks that no reference uses
F0–F3, and checks each native body length and bank boundary. It fails on
the old allocator. The supplied real project was also rebuilt and all
1858 body references checked against their expected headers.

This addresses the isolated Cascão compatibility issue. It does not by
itself establish that independent GG replay, stadium, palette or other
reported graphical issues have the same cause. A fresh run in the user's
ZSNES environment remains the runtime acceptance test; an already-corrupt
save state cannot test the fix.
