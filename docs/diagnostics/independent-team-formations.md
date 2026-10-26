# Six-team formation and roster review

The project already contained the same valid native Italy 4-4-2 record for
all six independent teams. Resetting those bytes alone did not address the
runtime problem.

The pre-match loader at PC 02AA88 stores the doubled team ID in $00 and the
selected tactical bank in $04. Its first MVN copies 20 coordinate bytes.
Before the second MVN, CODE_8585F7 computes formationIndex*10 in absolute
scratch $0004 to find the destination for the ten role/attack flags. The
old copy helper then misinterpreted this displacement as a source bank and
fell back to native $8B, even when the private record belonged to $DD.
Coordinates could be correct while role bytes were unrelated ROM data.

The copy helper now resolves the bank from the per-team selector using the
stable doubled ID in $00, preserving the source X before the block move.
It does this for both copies. The regression deliberately overwrites $04
between them, executes the emitted code and checks both destination buffers
for all six IDs and both sides. The old helper fails that regression.
Normal $8B and individualized $C0-$C7 records are covered too.

The real-project emulator check selects VAPOROSOS (118) versus TELURICOS
(116), enters formation, and reads both native coordinate and role caches.
Both match the private 4-4-2 exactly. This check establishes correct loading;
it is not a claim that every replay, goal kick or visual transition has been
exhaustively validated in the user's ZSNES version.

## Roster recovery

project-data/recovered-gg-rosters.json preserves the September 12 reviewed
distribution, proposed at 18:12 UTC and accepted at 18:16, including the
explicit correction that Paulo Martins is a defender, not a goalkeeper.
Each of the six teams has twenty names and two goalkeepers at slots 1/12.
The full historical names are retained alongside their eight-character ROM
abbreviations, also copied into each team's rosterRecoveryV1 provenance.

All six project formations remain native 4-4-2. Outfield attribute positions
are provisional 4-4-2 roles, as in the earlier recovery; no individual GG
skill calibration or real-person appearance was inferred. Existing skills,
uniforms, flags and outfield appearance bytes were preserved. Goalkeeper
appearance uses native style zero, required by its headless descriptors.
Both shipped project files carry the recovered names and formations; the
ordinary Editor controls continue to use the independent team records.
