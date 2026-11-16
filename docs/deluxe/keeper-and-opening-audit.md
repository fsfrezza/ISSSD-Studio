# Keeper and opening audit

- Free kick and corner selection now share the native Plus renderer, with mask 1, 2 or 3 depending on the selected options. Free kicks remain experimental until the actual kick, subsequent catch and substitution are validated in gameplay.
- Individual tactics are already exported separately per team; no migration is necessary.
- Opening media now has proportional zoom (10–400%) and native pixel X/Y offsets before import. The same converted frames drive the editor preview and ROM. Existing project media is unchanged until reimported.
- Player closeups already derive their colors from the player's saved appearance. Both keeper slots have independent color palettes. Keeper hairstyle geometry remains native; the sixteen outfield hairstyle shapes are not wired to keeper sprites.
- The screenshot of corrupt field graphics after a keeper catch is not sufficient to identify a faulty instruction. Existing backpass tests verify legal headers and opposing shots stay native, but do not reproduce that corruption. The exact generated ROM, enabled options, and a state immediately before the catch are needed to isolate the regression.
- PB9T changes 84:EA1C (LDY #$0024) to JSR $FFB3 within 84:EA09, after the call to 8B:A976. Its helper tests controller edges and updates $008E,X, then restores Y=$0024. The helper overlaps the existing Plus penalty-input helper at 84:FFC0, so blindly importing both is unsafe. This is a candidate, not a verified replay-only fix.
