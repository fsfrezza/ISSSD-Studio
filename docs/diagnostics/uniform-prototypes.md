# Two native-overlay jersey prototypes

The project applies `white-green-sleeves` to MACUCOS (57) and `navy-red-halves`
to BUGIGANGAS (55). `uniformModelV1` records the selected prototype; the normal
256-byte team pattern and titular palette are the canonical ROM input. Manual
pattern editing clears the preset marker, preserving the edited pixels.

The split shirt uses the wearer's left/right: navy on the wearer's left, red
on the right. In a front-facing schematic this appears red on the viewer's left.
MAC uses white shirt colors, green sleeve details, shorts and socks. BUG keeps
white shorts and navy socks. Skin/hair indices 0–6, shadow index 15, names,
attributes and the reserve palette are preserved.

These are explicitly prototypes, not complete body sprite replacements. The
native eight overlays apply to front/diagonal and selected leaning/lying poses.
Back views use number graphics and some profiles use no overlay. Sleeves outside
the overlay rectangle remain part of the native body. The pattern is shared by
home/away; only the home palette is changed by selecting a preset. Full independent
home/away body designs require further engine work. The Editor names and status make these constraints visible. Its preview now uses
the actual body/OAM pose, the chosen palette and the native jersey tile, rather
than a schematic drawing. The original hair is shown for body reference.

Validation: preset codec and project/Editor round trips, non-clothing preservation,
full tests and final Editor build; actual cumulative ROM generation; Snes9x fresh
boot MACUCOS vs BUGIGANGAS and continued play/replay. This checks the new native
assets load in a match, not complete coverage of every animation or ZSNES version.

Scoreboard flags: exported custom graphics now avoid index 12, which is shared
with a live match indicator. Selection retains all four source colors; match
previews and exported flags adapt to stable indices 13–15, preserving border
colors and the darkest emblem color. Source project pixels are never rewritten.
