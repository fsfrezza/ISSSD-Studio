# Semantic opening: resolved UI model

## Confirmed causes

The recovered legacy HTML places `teams`, `refreshPlusTeamFromRom`, `buildTeams`
and `plusTacticalRecordForTeam` inside its main IIFE. The former overlay patch
appended a separate script. Its hydrate function ran, but `applyModels()` returned
false because `teams` was inaccessible. Its tactical adapter was never installed:
`typeof plusTacticalRecordForTeam` was `undefined` in that external scope.

Even when a model was projected, `renderPlayerList()` and `renderPlayer()` call
`ensureCurrentTeamFresh()`, which replaces the current team with ROM-derived data.
`TEAM_STATE_API.refresh()` also calls `syncModelsFromRom()` / `buildTeams()`.

The overlay now installs within the main IIFE. Both refresh paths reconstruct the
base model and project the resolved state again. The global tactical reader forwards
into the same lexical function consumed by the UI. Explicit original-ROM reads bypass
the projection; returned tactical raw bytes and decoded fields agree, without ROM
writes. Opening a new project clears previous overlay and baseline state before
initializing the clean ROM session. Resolution uses baseSlot for original identity,
slot for the output order, and sparse custom fields for overrides.

## Regression coverage

The production patch is executed against HTML containing a private legacy-style
IIFE, then evaluated in a VM. Tests cover hydration, repeated refresh/render/rebuild,
Cafu's name/number/position/skills/appearance/tactics, identity movement, tactical
raw/decoded consistency, original reads, new sessions and byte-equal ROM buffers.
The fixture extracted from `novo projeto(2).issdproj` retains the actual Brazil
sparse fields. A second fixture preserves the Brazil state from the historical
20261014-044232 project. No project file is silently repaired during opening.

## Historical data findings

`novo projeto.issdproj`, `novo projeto(1).issdproj`, and `novo projeto(2).issdproj`
are byte-identical (SHA-256 prefix f522ac26377a). Brazil is team 30. These files
retain newer tactical coordinates and skills, but no Brazil name overrides.

`International-Superstar-Soccer-Deluxe-Plus-projeto(20261014-044232).issdproj`
contains the 20 Brazil names in v3 sparse custom fields, with older coordinates:
Cafu y=32; Dunga (-16,-10); Gerson (-15,11); R.Gaucho (15,-30);
Pele' (10,0); Ronaldo (36,5); Garrinch (30,30).

`International-Superstar-Soccer-Deluxe-Plus-projeto-ATUALIZADO(2).issdproj`
also retains names, attributes and tactical state in v2. Its roster is older
(e.g. slot 3 Aldair rather than D.daGuia), so it must not replace a newer roster
without comparing identity and history. Missing position/attack fields in v3
remain baseline values, not evidence that those fields have explicit overrides.

## Validation scope

The editor build was run using the recovered `ISSSD-Studio-layout-ajustado.html`
from the prior recovery ZIP, copied into this isolated checkout's previously absent
vendor directory. It passes source verification and final invariants. The user's
Windows worktrees and vendor baseline were never accessed or changed. Tests do
not claim a complete interactive browser validation with the user's ROM.

A full syntax pass also detected two pre-existing recovery-source defects: v6.64
omitted a closing brace before workspace processing, and v6.73 serialized script
newlines as literal escapes. The build normalizer repairs only those recognized
patterns in generated output. The final verifier now compiles every classic script,
so syntax-invalid historical modules cannot pass presence-only checks.

Module syntax verification then exposed replacement-string interpolation in HTML
insertion: the importer's literal `$&` was expanded by String.replace into the
matched HTML, corrupting the module. Build and canonical module restoration now
use callback replacements, preserving source bytes. Final verification checks
module syntax as well as classic script syntax.

## Startup-order regression correction

Moving installation into the main IIFE fixed lexical access but initially executed
it too early: the canonical `studioTeamsV3ReadFull` is declared in a later script,
not the same script. Browser script declarations are not hoisted across separate
script elements. This threw during main initialization before core setup completed.
The scoped closure is now registered in the main IIFE and invoked by a final
bootstrap after the canonical script has executed. Runtime tests place the main
IIFE and canonical helpers in separate script elements and execute them in order.
The delivered recovered project also passes the actual generated legacy project
validator; the startup defect is in the Editor, not invalid JSON in that project.
