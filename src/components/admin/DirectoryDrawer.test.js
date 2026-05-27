import { describe, it, expect } from 'vitest'
import { deriveModuleSubfolders } from './directorySubfolders'

describe('deriveModuleSubfolders', () => {
  it('derives subfolders from note path prefixes', () => {
    const module = {
      id: 'math',
      notes: [
        { filename: 'notes/intro.md' },
        { filename: 'unit-1/vectors.md' },
        { filename: 'unit-1/matrices.md' },
        { filename: 'top-level.md' },
      ],
    }
    expect(deriveModuleSubfolders(module)).toEqual(['notes', 'unit-1'])
  })

  // Regression: a freshly created (still-empty) subfolder is stored in
  // module.subfolders, not module.notes. The tree previously ignored it, so
  // the new folder never appeared after "Subfolder created". It must show.
  it('includes an explicit subfolders entry even when the module has no notes', () => {
    const module = { id: 'database', subfolders: ['unit-1'] }
    expect(deriveModuleSubfolders(module)).toEqual(['unit-1'])
  })

  it('merges note-derived and explicit subfolders without duplicates', () => {
    const module = {
      id: 'cs',
      notes: [{ filename: 'notes/a.md' }, { filename: 'unit-1/b.md' }],
      subfolders: ['unit-1', 'unit-2'],
    }
    expect(deriveModuleSubfolders(module)).toEqual(['notes', 'unit-1', 'unit-2'])
  })

  it('falls back to notes/tools when the module has neither notes nor subfolders', () => {
    expect(deriveModuleSubfolders({ id: 'empty' })).toEqual(['notes', 'tools'])
  })
})
