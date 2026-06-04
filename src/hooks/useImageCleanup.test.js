import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/githubApi', () => ({
  getFileSha: vi.fn(),
  getFileContent: vi.fn(),
  listDirectory: vi.fn(),
  deleteFile: vi.fn(),
}))

// Minimal supabase mock: from().select().in() resolves cached rows,
// from().upsert() resolves ok.
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(async () => ({ data: [], error: null })),
      })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
    })),
  },
}))

import { useImageCleanup } from './useImageCleanup.js'
import { getFileContent, listDirectory } from '../lib/githubApi'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runScan — course-scoped paths (Issue #2)', () => {
  // The save pipeline writes notes to src/content/notes/{course}/{module}/{subfolder}
  // and images to public/notes/img/{course}/{module}, referenced in markdown as
  // /notes/img/{course}/{module}/x. The cleanup scan must build the same
  // course-scoped paths, or it lists empty dirs and the referenced-vs-stored
  // comparison never matches (every image looks orphaned).

  const course = 'course1'
  const modules = [{ id: 'web', subfolders: ['intro'] }]

  function mockGithubForScan() {
    listDirectory.mockImplementation(async (path) => {
      if (path === `src/content/notes/${course}/web/intro`) {
        return [
          {
            name: 'note1.md',
            path: `src/content/notes/${course}/web/intro/note1.md`,
            sha: 'sha1',
          },
        ]
      }
      if (path === `public/notes/img/${course}/web`) {
        return [
          { name: '1.png', path: `public/notes/img/${course}/web/1.png` },
          { name: '2.png', path: `public/notes/img/${course}/web/2.png` },
        ]
      }
      // Any course-less path (the old buggy behaviour) returns empty.
      return []
    })

    // The note references image 1 (course-scoped path) but not image 2.
    getFileContent.mockResolvedValue(
      'intro ![diagram](/notes/img/course1/web/1.png) done'
    )
  }

  it('lists .md files using the course-scoped content path', async () => {
    mockGithubForScan()

    const { result } = renderHook(() => useImageCleanup({ modules, isOwner: true, course }))

    await act(async () => {
      await result.current.runScan(null)
    })

    expect(listDirectory).toHaveBeenCalledWith('src/content/notes/course1/web/intro')
    // The course-less path the bug produced must never be listed.
    expect(listDirectory).not.toHaveBeenCalledWith('src/content/notes/web/intro')
  })

  it('lists stored images using the course-scoped img path', async () => {
    mockGithubForScan()

    const { result } = renderHook(() => useImageCleanup({ modules, isOwner: true, course }))

    await act(async () => {
      await result.current.runScan(null)
    })

    expect(listDirectory).toHaveBeenCalledWith('public/notes/img/course1/web')
    expect(listDirectory).not.toHaveBeenCalledWith('public/notes/img/web')
  })

  it('matches referenced images to stored images so only true orphans are returned', async () => {
    mockGithubForScan()

    const { result } = renderHook(() => useImageCleanup({ modules, isOwner: true, course }))

    let scan
    await act(async () => {
      scan = await result.current.runScan(null)
    })

    // 1.png is referenced by the note → not an orphan.
    // 2.png is unreferenced → the only orphan.
    const orphanPaths = scan.orphans.map(o => o.path)
    expect(orphanPaths).toEqual(['/notes/img/course1/web/2.png'])
    expect(orphanPaths).not.toContain('/notes/img/course1/web/1.png')
    expect(scan.scannedCount).toBe(1)
  })
})
