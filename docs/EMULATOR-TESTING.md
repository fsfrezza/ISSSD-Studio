# Emulator testing with Mesen

The ISSSD Studio emulator harness is intentionally local. Commercial ROM bytes are never committed to the repository or uploaded to public CI.

## Windows setup

Run once from PowerShell:

```powershell
npm run setup:mesen:windows
```

This installs the pinned official Mesen build under `.tools/mesen/`, which is ignored by Git.

## Test levels

### 1. Boot smoke test

```powershell
npm run test:emulator -- "C:\path\output.sfc"
```

Runs 600 frames and fails on timeout, emulator error or missing completion marker.

### 2. Navigation smoke test

```powershell
npm run test:emulator:nav -- "C:\path\output.sfc"
```

Injects deterministic controller pulses and requires the ROM to survive 1200 frames.

### 3. WRAM state probe

```powershell
npm run test:emulator:probe -- "C:\path\output.sfc" --report "probe.json"
```

The probe samples all 128 KiB of SNES Work RAM at stable checkpoint pairs around the navigation sequence. It filters values that fluctuate inside a checkpoint and reports addresses that are stable locally but change between stages.

The JSON report schema is `isssd-mesen-probe-v1` and contains:

```json
{
  "schema": "isssd-mesen-probe-v1",
  "frames": 1200,
  "totalCandidates": 27,
  "emittedCandidates": 27,
  "candidates": [
    {
      "address": 291,
      "addressHex": "0x00123",
      "value": 4,
      "mask": 22,
      "maskHex": "0x16",
      "changes": 3
    }
  ]
}
```

Candidate ranking is available with:

```powershell
npm run analyze:emulator:probe -- probe.json --limit 20 --out probe-ranked.json
```

On Windows the setup, probe and ranking can be chained with one command:

```powershell
npm run discover:emulator:windows -- "C:\path\output.sfc"
```

### 4. Cross-ROM WRAM comparison

A candidate should be reproduced on the canonical/base ROM and on a generated ROM before it becomes a semantic assertion.

Existing reports can be compared with:

```powershell
npm run compare:emulator:probes -- probe-base.json probe-generated.json --limit 20 --out probe-comparison.json
```

The comparison classifies shared addresses as:

- `exact`: value, transition mask and change count are identical;
- `compatible`: value and transition mask are identical, but the change count differs;
- `divergent`: the address exists in both reports but does not behave equivalently.

Only `exact` and `compatible` candidates are listed as promotable, with exact matches ranked first.

On Windows the two probes and their comparison can be produced in one command:

```powershell
npm run discover:emulator:cross-rom:windows -- "C:\path\base.sfc" "C:\path\generated.sfc"
```

This creates local `probe-base.json`, `probe-generated.json` and `probe-comparison.json` files. Probe reports are ignored by Git.

### 5. One-command Plus project regression

The preferred local regression path starts from the same inputs as the Studio itself: the canonical Plus ROM and an `.issdproj` file.

```powershell
npm run test:emulator:project:windows -- "C:\path\base.sfc" "C:\path\project.issdproj"
```

This command:

1. validates the canonical Plus base size and SHA-256;
2. builds the project twice through `buildPlusProjectRom` and requires deterministic identical output;
3. writes the generated ROM under `.tools/mesen-runs/<timestamp>/`;
4. probes both the canonical base and the generated ROM in Mesen;
5. writes a cross-ROM WRAM comparison in the same local run directory.

No commercial ROM, generated ROM or probe report is committed. The full run directory lives under `.tools/`, which is ignored by Git.

This is the best pre-semantic regression command because it tests the complete chain:

```text
canonical base ROM + .issdproj
        -> deterministic Studio core build
        -> generated ROM
        -> Mesen probe on base + generated ROM
        -> cross-ROM state comparison
```

### 6. Semantic WRAM test

Once candidate addresses have been verified, describe them in a declarative profile instead of editing Lua manually.

Example profile:

```json
{
  "schema": "isssd-mesen-semantic-v1",
  "maxFrames": 1200,
  "pulses": [
    {"name":"start","start":360,"stop":366,"input":{"start":true}},
    {"name":"confirm","start":520,"stop":526,"input":{"a":true}}
  ],
  "checkpoints": [
    {"name":"intro","address":291,"expected":2,"start":200,"stop":350},
    {"name":"main-menu","address":291,"expected":5,"start":380,"stop":500},
    {"name":"team-selection","address":1110,"expected":7,"start":540,"stop":900}
  ]
}
```

Run it with:

```powershell
npm run test:emulator:semantic -- "C:\path\output.sfc" "C:\path\semantic-profile.json"
```

The launcher validates the profile, generates a temporary Lua script, injects the configured controller pulses and waits for each expected WRAM value inside its frame window. The generated Lua file is deleted after the run.

A semantic failure identifies the checkpoint that was not reached rather than reporting only a generic emulator failure.

## Promotion rule for semantic states

The probe is a discovery tool, not the final assertion. A candidate address must not be treated as a screen identifier until it has been reproduced across:

1. the clean canonical Plus base;
2. at least one generated ROM;
3. repeated runs with the same navigation sequence.

Timing-only, animation-dependent or volatile values must not be promoted.

The target semantic flow is therefore:

```text
boot
  -> intro state confirmed by WRAM
  -> START
  -> main menu state confirmed by WRAM
  -> A
  -> team selection state confirmed by WRAM
  -> PASS
```

Frame windows are intentionally used instead of exact frame numbers so the test remains tolerant of small timing differences while still detecting a missing game state.
