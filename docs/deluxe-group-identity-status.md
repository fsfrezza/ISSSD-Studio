# Group identities and compatibility — 2026-11-12

The agreed target uses Plus country identities while new projects display the original Deluxe organization. Unchanged projects must export the original Deluxe byte for byte. Direct import of Plus projects is outside the current scope; the Plus catalog is a reference, not a request to open Plus project files.

Implemented in this change:

- A read-only country-identity view distinguishes Plus IDs, native Deluxe IDs and legacy Deluxe project slots. Northern Ireland is Deluxe 21 / Plus 53; Turkey is Deluxe 26 / Plus 21. The first extra legacy slot 36 represents Plus 26 (Saudi Arabia).
- Legacy project slots, player keys and prepared title data are preserved. No implicit renumbering on load.
- Whole-group swaps preserve team membership, group titles, player edits and unrelated project data.
- Native projects can rename their six groups. Names are encoded through the native SmallMenuText font into guarded empty space, without activating expanded teams. As with existing expanded headings, up to eight supported characters excluding spaces are accepted for ROM generation.
- Existing per-team swaps remain available.

Validation: 47 Deluxe tests pass with original Deluxe and Plus fixtures, saved Deluxe project and the correct roster backup. New coverage exercises original-byte restoration, restricted ROM writes, special index mappings, nine-group saved project generation and preservation of all 1080 edited players. These are automated generation/UI-handler checks, not new emulator playtesting.

Still required before the complete target can be claimed:

- Embedded catalog and six distinct available-team selections when adding a group.
- Apply Plus group/team organization button, preserving independent player edits.
- A validated transition to the functional Plus runtime when extra teams are enabled. The existing experimental Deluxe expansion remains unchanged by this patch.
- Independent visual resources and treatment of the two secret teams.
- Browser file-picker handoff when a project is opened without its ROM.

The reference saved project examined was validation/project.json (54 teams, 9 groups, 1080 edited players). It is a local validation fixture, not a new baseline shipped to users.

## Catalog and group selection follow-up

Implemented: embedded reference catalog with 54 normal and two secret team identities (1120 reference players). Secret teams are excluded from regular six-team selection. Adding a group now opens six selectors, removes duplicate choices and requires all six selections. New teams receive their own clean Plus roster records, while existing project slots and player edits are retained. The Plus organization action enables remaining normal teams and applies the nine normal group rows by stable country ID, without resetting existing team names or player edits. These actions validate ROM generation before updating the active project.

New team records can persist `plusId`; legacy records resolve through their original Deluxe project mapping. Reordering or adding teams therefore does not change the identity of earlier slots. Native graphic group labels now reuse their original pointers when moved, including labels too wide for the editable eight-character encoding.

Validation: 50 tests passed, none skipped. Coverage includes arbitrary catalog selection order, duplicate/secret-team rejection, exported roster comparison, legacy saved project preservation, exact unchanged-ROM restoration, all prior title/menu tests and the six-selector UI flow.

Runtime limitation remains: ROM generation still uses the existing Deluxe expansion. Full functional Plus runtime activation and independent flags/kits are not implemented by this follow-up. The two secret teams are cataloged but are not added to the normal-group workflow. No new emulator playthrough was performed.
