// src/lib/draftImagePreviews.js
//
// Blob-URL previews for not-yet-uploaded images. When an image is added in the
// editor it's queued under a `draft-img-…` key and inserted into the Markdown
// as `![alt](draft://<key>)` — a marker useEditorSave rewrites to the real
// `/notes/img/…` path on save. `draft://` isn't a loadable URL, so without this
// the image renders broken (showing its alt text) until saved.
//
// useEditorImages registers the File here on upload; the editor's image node
// view resolves `draft://<key>` to the object URL so the image previews
// immediately. useEditorSave revokes the URL once the image is uploaded.

const previews = new Map() // key -> object URL

export function registerDraftPreview(key, file) {
  if (previews.has(key)) return previews.get(key)
  const url = URL.createObjectURL(file)
  previews.set(key, url)
  return url
}

/** Map a `draft://<key>` src to its blob URL for display; pass others through. */
export function resolveDraftSrc(src) {
  if (typeof src === 'string' && src.startsWith('draft://')) {
    const key = src.slice('draft://'.length)
    return previews.get(key) || src
  }
  return src
}

export function revokeDraftPreview(key) {
  const url = previews.get(key)
  if (url) {
    URL.revokeObjectURL(url)
    previews.delete(key)
  }
}
