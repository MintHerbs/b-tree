import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAllImageBlobs,
  extractDraftKeys,
  getAllImageKeys,
  getImageBlob,
  nextImageKey,
  saveImageBlob,
} from './draftDB.js'

beforeEach(async () => {
  vi.restoreAllMocks()
  localStorage.clear()
  await clearAllImageBlobs()
})

describe('nextImageKey', () => {
  it('increments counter correctly across calls', () => {
    expect(nextImageKey('png')).toBe('img-1.png')
    expect(nextImageKey('.png')).toBe('img-2.png')
    expect(nextImageKey('jpg')).toBe('img-3.jpg')
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

  it('returns empty array when no draft:// URLs present', () => {
    expect(extractDraftKeys('![a](/notes/img/1.png)')).toEqual([])
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
