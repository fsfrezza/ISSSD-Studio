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

## Semantic test target

The probe is a discovery tool, not the final assertion. Once one or more WRAM addresses are verified to identify stable ISSSD states, they should be promoted into a semantic Mesen test such as:

```text
boot
  -> intro state
  -> START
  -> main menu state
  -> A
  -> team selection state
  -> PASS
```

A candidate address must not be treated as a screen identifier until it has been reproduced across the clean base and at least one generated ROM. Timing-only or animation-dependent values should not be promoted.
