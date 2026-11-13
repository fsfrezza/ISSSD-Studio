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

## Secret unlock — user-confirmed behavior

The original Deluxe accepts the sequence Up, Up, Down, Down, Back, Forward, Back, Forward, B, A through controller 2. The Plus ROM also accepts controller 1. The Deluxe improvements list records this separately under the existing stable ID `controller-one-codes`, explicitly preserving controller 2. This entry remains pending mapping: documenting it does not implement the input patch.

The uploaded project of 12 November 2026 (22:02:03 filename) is the source for reproducing the user's reported GG unlock. Its dormant semantic GG metadata alone is not sufficient evidence to deny the reported ROM behavior. Reproduction and complete GG project compatibility remain unresolved.

## GG reference ROM recovery — 2026-11-13

The supplied IASBESR.sfc (SHA-256 f57bb6928e9687ffc49fa3ee08e119f7b9aea9e8d374ee24db5d57033a21deec) reproduces the GG secret page in Snes9x. Its page contains Plus IDs 54–59; all six are selectable. The older uploaded Plus project still described the native All Stars page and dormant GG metadata, so it was not used to manufacture missing player data.

Recovery verifies the independent allocation log and matches the six full team records against the existing independent-team reference (attributes, player names, tactics, uniform patterns). All 1200 player names, jerseys, natural positions and skills are read from IASBESR itself, including 37 attribute bytes that differ from the existing reference build. Normal group membership is read from the ROM in logical order. The normal group labels are taken from the matching complete project reference. Existing Deluxe title/audio/text/composer domains are retained from the previously validated Deluxe project.

The Deluxe structure now supports 60 project teams: nine normal groups plus a separately persisted six-slot secret row. Legacy 54-team projects remain supported. Group swaps, team swaps and Plus normal-organization actions preserve the secret row and independent player edits. A saved converted project opens directly as a Deluxe project; this does not add automatic opening of Plus projects.

Sixty-team generation expands to 4 MB and places the complete player-name table at PC 0x200000. This avoids a collision between the 60-team table and the translated match-statistics reservation at 0x187400. Smaller structures retain their existing 2 MB layout. Header size/checksum are updated and copier headers are preserved. Player names use the existing native codec, including digits (the recovered Bugigangas player 'Ale 100'). Group headings can use both native 8-character rows, allowing the saved INTERCONTINENTAL label without truncating project data.

Validation: 51 tests passed, none skipped. All 1200 decoded roster records match the reference ROM after JSON save/reopen and export. UI-handler tests load ten group cards, 60 team selectors, edit/read GG players, save/reopen the complete data and export 4 MB. Snes9x verifies controller-2 native All Stars unlock, GG page navigation and short in-match execution for each of the six GG selections using controller inputs only. This is not a complete match/end-game or all-combinations stability test.

Remaining visual/runtime limitations: GG flags, lower team labels, scoreboard identities, custom uniform designs/colors and independent formations are not all transferred from the Plus ROM. The generated Deluxe currently uses its existing visual/tactical source-team references for those resources. Preserve the original IASBESR ROM as the complete appearance reference. Do not claim full Plus runtime or graphic parity from the roster tests. New-project enhancements remain deferred.

## Opening a recovered project before its ROM — 2026-11-13

The user reported that the converted project opened but replacing it with the GG file appeared to do nothing. Both the older converted project and the recovered GG project use the same Deluxe USA base SHA-256 and copier-header metadata. The newer structure adds 60 teams, plusId fields and a separate secret row, so it requires the GG-aware Editor revision (acac52c or later). The latest updated GG file also passes the UI-handler open/save/reopen/export test; a corrupt-file diagnosis was not established.

The project-first handoff formerly depended on programmatic input.click after asynchronously reading the project file. Browsers may suppress that picker; an exception could also obscure the pending-project message. A persistent, visible ROM-request card now names the selected project, explains which original ROM is required and offers a direct user-click button. The pending project survives cancellation and incompatible-ROM attempts. The card closes when the correct ROM is accepted. The sidebar explicitly identifies support for 60 teams/GG so users can distinguish the newer interface.

Four focused server/layout/UI tests pass with the updated real GG file, including a simulated blocked automatic picker, manual picker retry, wrong-ROM retry, complete 60-team rendering, saving, reopening and 4 MB export. Local Chromium launch failed before page execution because its process-singleton socket was denied; these checks do not establish the browser behavior of the user's installation.
