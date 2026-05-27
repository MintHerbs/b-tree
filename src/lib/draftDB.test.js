import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAllImageBlobs,
  clearDraftBlobs,
  extractDraftKeys,
  getAllImageKeys,
  getDraftImageKeys,
  getImageBlob,
  nextImageKey,
  restoreDraftBlobs,
  saveImageBlob,
} from './draftDB.js'

beforeEach(async () => {
  vi.restoreAllMocks()
  localStorage.clear()
  await clearAllImageBlobs()
})

describe('nextImageKey', () => {
  it('scopes keys to the draftId and increments a per-draft counter', () => {
    expect(nextImageKey('draft-a', 'png')).toBe('draft-a:img-1.png')
    expect(nextImageKey('draft-a', '.png')).toBe('draft-a:img-2.png')
    expect(nextImageKey('draft-a', 'jpg')).toBe('draft-a:img-3.jpg')
  })

  it('keeps independent counters per draft', () => {
    expect(nextImageKey('draft-a', 'png')).toBe('draft-a:img-1.png')
    expect(nextImageKey('draft-b', 'png')).toBe('draft-b:img-1.png')
    expect(nextImageKey('draft-a', 'png')).toBe('draft-a:img-2.png')
  })

  it('falls back to the "legacy" draftId when called with one argument', () => {
    expect(nextImageKey('png')).toBe('legacy:img-1.png')
    expect(nextImageKey('.jpg')).toBe('legacy:img-2.jpg')
  })

  it('does not let the legacy counter clobber a draft named "legacy"', () => {
    // Both the one-arg shim and an explicit 'legacy' draftId share one counter.
    expect(nextImageKey('png')).toBe('legacy:img-1.png')
    expect(nextImageKey('legacy', 'png')).toBe('legacy:img-2.png')
  })
})

describe('extractDraftKeys', () => {
  it('returns correct keys from markdown containing draft:// URLs', () => {
    const md = [
      '![a](draft://img-1.png)',
      '![b](draft://img-2.jpg)',
      '![c](draft://img-1.png)',
    ].join('\n')

    expect(extractDraftKeys(md)).toEqual(['img-1.png', 'img-2.jpg'])
  })

  it('captures draft-scoped keys in ${draftId}:img-N.ext format', () => {
    const md = [
      '![a](draft://abc-123:img-1.png)',
      '![b](draft://abc-123:img-2.jpg)',
      '![dup](draft://abc-123:img-1.png)',
    ].join('\n')

    expect(extractDraftKeys(md)).toEqual([
      'abc-123:img-1.png',
      'abc-123:img-2.jpg',
    ])
  })

  it('returns empty array when no draft:// URLs present', () => {
    expect(extractDraftKeys('![a](/notes/img/1.png)')).toEqual([])
  })
})

describe('getDraftImageKeys', () => {
  it('returns only the keys belonging to the given draft', async () => {
    await saveImageBlob('draft-a:img-1.png', new Blob(['a']))
    await saveImageBlob('draft-a:img-2.jpg', new Blob(['b']))
    await saveImageBlob('draft-b:img-1.png', new Blob(['c']))

    const keys = await getDraftImageKeys('draft-a')
    expect(keys.sort()).toEqual(['draft-a:img-1.png', 'draft-a:img-2.jpg'])
  })

  it('does not match a draft whose id is a prefix of another', async () => {
    await saveImageBlob('draft:img-1.png', new Blob(['a']))
    await saveImageBlob('draft-2:img-1.png', new Blob(['b']))

    expect(await getDraftImageKeys('draft')).toEqual(['draft:img-1.png'])
  })

  it('returns an empty array when the draft has no blobs', async () => {
    expect(await getDraftImageKeys('nope')).toEqual([])
  })
})

describe('clearDraftBlobs', () => {
  it('deletes only the target draft blobs and leaves others intact', async () => {
    await saveImageBlob('draft-a:img-1.png', new Blob(['a']))
    await saveImageBlob('draft-a:img-2.jpg', new Blob(['b']))
    await saveImageBlob('draft-b:img-1.png', new Blob(['c']))

    await clearDraftBlobs('draft-a')

    expect(await getDraftImageKeys('draft-a')).toEqual([])
    expect(await getImageBlob('draft-a:img-1.png')).toBeNull()
    expect(await getImageBlob('draft-b:img-1.png')).not.toBeNull()
  })

  it('is a no-op when the draft has no blobs', async () => {
    await saveImageBlob('draft-b:img-1.png', new Blob(['c']))

    await clearDraftBlobs('draft-a')

    expect(await getAllImageKeys()).toEqual(['draft-b:img-1.png'])
  })
})

describe('restoreDraftBlobs', () => {
  it('returns a queue map of { file, ext } keyed by blob key', async () => {
    const png = new NodeBlob(['png-bytes'], { type: 'image/png' })
    const jpg = new NodeBlob(['jpg-bytes'], { type: 'image/jpeg' })
    await saveImageBlob('draft-a:img-1.png', png)
    await saveImageBlob('draft-a:img-2.jpg', jpg)
    await saveImageBlob('draft-b:img-1.png', new Blob(['other']))

    const restored = await restoreDraftBlobs('draft-a')

    expect(Object.keys(restored).sort()).toEqual([
      'draft-a:img-1.png',
      'draft-a:img-2.jpg',
    ])
    expect(restored['draft-a:img-1.png'].ext).toBe('png')
    expect(restored['draft-a:img-2.jpg'].ext).toBe('jpg')
    expect(restored['draft-a:img-1.png'].file).not.toBeNull()
    expect(restored['draft-a:img-2.jpg'].file.size).toBe(jpg.size)
  })

  it('returns an empty object when the draft has no blobs', async () => {
    expect(await restoreDraftBlobs('nope')).toEqual({})
  })

  it('round-trips a key produced by nextImageKey', async () => {
    const key = nextImageKey('draft-a', 'png')
    await saveImageBlob(key, new NodeBlob(['data'], { type: 'image/png' }))

    const restored = await restoreDraftBlobs('draft-a')
    expect(restored[key]).toBeDefined()
    expect(restored[key].ext).toBe('png')
  })
})

describe('saveImageBlob', () => {
  it('and getImageBlob round-trip correctly', async () => {
    const blob = new NodeBlob(['test content'], { type: 'image/png' })
    await saveImageBlob('k1', blob)
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('mooner-admin', 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'key' })
        }
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('images', 'readonly')
        tx.objectStore('images').get('k1')
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error)
        }
      }
      request.onerror = () => reject(request.error)
    })

    const loaded = await getImageBlob('k1')
    expect(loaded).not.toBeNull()
    if (loaded && typeof loaded.text === 'function') {
      expect(await loaded.text()).toBe('test content')
    } else {
      expect(loaded?.size).toBe(blob.size)
    }
  })
})

describe('clearAllImageBlobs', () => {
  it('removes all entries', async () => {
    await saveImageBlob('k1', new Blob(['a']))
    await saveImageBlob('k2', new Blob(['b']))

    await clearAllImageBlobs()

    expect(await getAllImageKeys()).toEqual([])
    expect(await getImageBlob('k1')).toBeNull()
    expect(await getImageBlob('k2')).toBeNull()
  })
})
