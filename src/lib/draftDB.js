// IndexedDB database: 'mooner-admin'
// Object store: 'images', keyPath: 'key'
// Image counter key in localStorage: 'admin-draft-img-counter'

const DB_NAME = 'mooner-admin'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txPromise(db, mode, run) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)

    let result

    Promise.resolve()
      .then(() => run(store, (value) => {
        result = value
      }))
      .catch((err) => {
        try {
          tx.abort()
        } catch {
        }
        reject(err)
      })

    tx.oncomplete = () => resolve(result)
    tx.onabort = () => reject(tx.error)
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveImageBlob(key, blob) {
  const db = await openDB()
  try {
    await txPromise(db, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.put({ key, blob })
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
  } finally {
    db.close()
  }
}

export async function getImageBlob(key) {
  const db = await openDB()
  try {
    return await txPromise(db, 'readonly', (store, setResult) => {
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => {
          const record = request.result
          setResult(record ? record.blob : null)
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    })
  } finally {
    db.close()
  }
}

export async function deleteImageBlob(key) {
  const db = await openDB()
  try {
    await txPromise(db, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
  } finally {
    db.close()
  }
}

export async function getAllImageKeys() {
  const db = await openDB()
  try {
    return await txPromise(db, 'readonly', (store, setResult) => {
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys()
        request.onsuccess = () => {
          setResult(request.result || [])
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    })
  } finally {
    db.close()
  }
}

export async function clearAllImageBlobs() {
  const db = await openDB()
  try {
    await txPromise(db, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
  } finally {
    db.close()
  }
}

export function extractDraftKeys(markdown) {
  const keys = []
  const seen = new Set()
  // `:` is allowed so draft-scoped keys (`${draftId}:img-N.ext`) are captured
  // whole; the closing `)` of a markdown image still terminates the match.
  const regex = /draft:\/\/([A-Za-z0-9._:-]+)/g

  let match
  while ((match = regex.exec(markdown)) !== null) {
    const key = match[1]
    if (!seen.has(key)) {
      seen.add(key)
      keys.push(key)
    }
  }

  return keys
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function patchDraftUrls(markdown) {
  const keys = extractDraftKeys(markdown)
  const createdUrls = []
  let patched = markdown

  for (const key of keys) {
    const blob = await getImageBlob(key)
    if (!blob) continue

    const url = URL.createObjectURL(blob)
    createdUrls.push(url)
    patched = patched.replace(new RegExp(`draft:\\/\\/${escapeRegExp(key)}`, 'g'), url)
  }

  const cleanup = () => {
    for (const url of createdUrls) {
      URL.revokeObjectURL(url)
    }
  }

  return { patched, cleanup }
}

// Allocate the next blob key for a draft, scoped as `${draftId}:img-N.ext`.
// Each draft keeps its own counter in localStorage so numbering never collides
// across drafts.
//
// Backward-compatibility shim: older callers invoke `nextImageKey(ext)` with a
// single argument. In that case we fall back to the `'legacy'` draftId, so the
// call keeps working (returning e.g. `legacy:img-1.png`) instead of treating an
// extension as a draftId.
export function nextImageKey(draftIdOrExt, ext) {
  let draftId
  let extension
  if (ext === undefined) {
    draftId = 'legacy'
    extension = draftIdOrExt
  } else {
    draftId = draftIdOrExt
    extension = ext
  }

  const normalizedExt = String(extension || '').replace(/^\./, '')
  const counterKey = `admin-draft-img-counter-${draftId}`
  const raw = localStorage.getItem(counterKey)
  const current = Number.parseInt(raw || '0', 10)
  const next = (Number.isFinite(current) ? current : 0) + 1

  localStorage.setItem(counterKey, String(next))
  return `${draftId}:img-${next}.${normalizedExt}`
}

// All blob keys belonging to a specific draft.
export async function getDraftImageKeys(draftId) {
  const all = await getAllImageKeys()
  return all.filter((key) => typeof key === 'string' && key.startsWith(`${draftId}:`))
}

// Delete every blob belonging to a specific draft (e.g. when the draft is
// deleted or published).
export async function clearDraftBlobs(draftId) {
  const keys = await getDraftImageKeys(draftId)
  for (const key of keys) {
    await deleteImageBlob(key)
  }
}

// Load every blob for a draft into a queue map keyed by blob key. Used when
// switching to a draft so the editor's pending-image queue is repopulated.
// Shape mirrors the in-memory queue: `{ [key]: { file: Blob, ext: string } }`.
export async function restoreDraftBlobs(draftId) {
  const keys = await getDraftImageKeys(draftId)
  const result = {}
  for (const key of keys) {
    const blob = await getImageBlob(key)
    if (blob) {
      const ext = key.split('.').pop()
      result[key] = { file: blob, ext }
    }
  }
  return result
}

