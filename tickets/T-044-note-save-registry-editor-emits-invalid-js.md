---
id: T-044
title: Note-save registry editor (upsertNoteEntry) can emit invalid JS and break the build
status: backlog
severity: high
area: admin
epic: none
created: 2026-07-23
---

## Summary

The note-save pipeline edits `src/components/layout/Sidebar/modules.js` as text
(`upsertNoteEntry` in `useEditorSave.js`). Its string/regex surgery is brittle and
has already produced **syntactically invalid JS**, which breaks `vite build` — i.e.
a routine "add a note" can leave `main` un-buildable and undeployable.

## Evidence

- Registry editing is regex/brace-counting text manipulation:
  `upsertNoteEntry` / `findModuleBlock` in
  [src/hooks/useEditorSave.js:56-115](../src/hooks/useEditorSave.js#L56-L115),
  with the `notes: [...]` array located by `/(notes:\s*\[)([\s\S]*?)(\])/m`.
- Real corruption landed on `main` via commit `4c7c720`
  ("add lecture-1-binary-numbers to computer-architecture notes"): the note was
  inserted into the **wrong** module block (`operating-systems` instead of
  `computer-architecture`) with a missing `},`, a duplicated `notes: [` key and
  unbalanced brackets. `node`/rollup failed with
  `modules.js (133:4): Expected ',', got 'ident'`.
- Repaired in `5406deb` (this was a manual fix of the emitted output, not of the
  generator).

## Impact

Any owner/editor saving a note can silently commit invalid `modules.js` to GitHub;
the next build/deploy of `main` fails. The failure surfaces far from the cause (a
build error, not a save error), so it is easy to ship and hard to trace back.

## Suggested fix

- Stop editing `modules.js` as text. Parse → mutate an AST (or a real data
  structure) → serialize, so output is always valid; or move the registry out of a
  hand-edited source file entirely.
- Interim guardrail: after generating the new `modules.js`, parse it (e.g. attempt
  an import / `new Function`) before committing, and abort the save with a clear
  error if it does not parse — never commit unparseable output.

## Acceptance criteria

- [ ] A note save can never commit a `modules.js` that fails to parse.
- [ ] Adding a note always targets the correct module block with balanced braces.
- [ ] A regression test covers insert into: an empty module, a module with existing
      notes, and the single-line module shorthand.

## References

- Root-cause elimination: **E-005** (notes → Supabase) / T-043 would retire the
  registry-surgery approach; this ticket guards the current pipeline until then.
- Related: T-028 (resave existing file fails), T-011 (Ctrl+S save guard).
