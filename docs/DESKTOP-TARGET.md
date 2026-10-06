# ISSSD Studio desktop target

## Decision

The preferred final distribution target is a Windows desktop application built with **Tauri**, while preserving the current HTML/CSS/JavaScript frontend model and the portable JavaScript core in `src/core`.

The historical standalone HTML snapshots remain preserved as recovery evidence and may continue to exist as a secondary portable/web artifact. They are not required to remain the primary product format.

## Architectural boundary

The project must keep this separation:

```text
frontend (HTML/CSS/JS)
        |
        v
portable semantic core (`src/core`)
        |
        v
desktop/web adapter
        |
        v
filesystem / dialogs / operating-system integration
```

`src/core` must not depend directly on:

- Node.js built-ins;
- Electron;
- Tauri APIs;
- browser DOM globals such as `window` or `document`;
- local/session storage.

This is enforced by `tests/core-portability.test.mjs`.

## Why Tauri

Tauri allows the existing browser-style UI to be reused while providing native desktop capabilities such as:

- opening and saving `.issdproj` files;
- opening a user-owned ROM base from disk;
- remembering approved paths through the desktop shell;
- direct ROM export;
- drag-and-drop;
- automatic backups;
- recent-project lists;
- Windows file association for `.issdproj`;
- native dialogs and filesystem access;
- producing an installable Windows executable without bundling a commercial ROM.

A complete native rewrite in C#/C++/Java is explicitly not the current plan because it would duplicate already recovered and tested editor behavior.

## Distribution target

Preferred artifacts when the desktop phase begins:

```text
ISSSD-Studio-Setup.exe    # installable Windows build
ISSSD-Studio.exe          # portable Windows build when practical
ISSSD-Studio.html         # optional secondary portable/web artifact
```

The commercial ROM base is never included in any of these artifacts or committed to the repository.

## Desktop data layout

A desktop shell may expose user-selectable locations similar to:

```text
ISSSD Studio/
  projects/
    *.issdproj
  backups/
  exports/
    *.sfc
```

The ROM base should remain external/user-owned. The application may remember its approved path but must not silently copy it into the repository or package.

## Build invariants remain unchanged

Packaging does not alter the ROM architecture:

```text
immutable base ROM
    -> canonical project state
    -> generated infrastructure
    -> semantic surgical writers
    -> checksum
    -> output ROM
```

Opening a project remains data-only. Expansion, tactical bank-selector infrastructure and similar generated structures belong to the build output, not persisted project state.

## Migration order

1. Finish recovery and deterministic-core coverage.
2. Keep historical HTML snapshots untouched.
3. Extract/reuse the active frontend without rewriting behavior.
4. Add a thin desktop adapter for file dialogs/filesystem operations.
5. Add the Tauri shell around that adapter.
6. Produce Windows installer/portable artifacts in CI.
7. Retain HTML output only where it remains useful.

The Tauri shell must therefore be an adapter around the recovered Studio, not a rewrite of the editor core.
