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
  const regex = /draft:\/\/([A-Za-z0-9._-]+)/g

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

export function nextImageKey(ext) {
  const normalizedExt = String(ext || '').replace(/^\./, '')
  const raw = localStorage.getItem('admin-draft-img-counter')
  const current = Number.parseInt(raw || '0', 10)
  const next = (Number.isFinite(current) ? current : 0) + 1

  localStorage.setItem('admin-draft-img-counter', String(next))
  return `img-${next}.${normalizedExt}`
}

