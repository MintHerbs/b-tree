// src/hooks/useImageCleanup.js
//
// Finds images in the repo (public/notes/img/**) that no note references, so
// they can be deleted. The set of "referenced images" is derived from note
// CONTENT in Supabase (notes.content_md) — the source of truth since
// E-005/T-043. Previously this scanned committed .md in GitHub and keyed on
// file SHA; once content moved to the DB that scan saw nothing and flagged
// every live image as orphaned (T-002). Reading content_md fixes that.
//
// Images themselves still live in GitHub (served static), so listing and
// deleting them still goes through the GitHub proxy.

import { supabase } from '../lib/supabaseClient'
import { listDirectory, deleteFile } from '../lib/githubApi'

// Extract all image paths from a markdown string
function extractImages(markdown) {
  return [...String(markdown || '').matchAll(/!\[.*?\]\((\/notes\/img\/.*?)\)/g)]
    .map(m => m[1])
}

export function useImageCleanup({ modules, isOwner }) {

  // ── SCAN ──────────────────────────────────────────────────────────────────
  // For the given module (or all), collect every image referenced by any of
  // that module's notes (from the DB), list the images actually stored in the
  // module's img folder (from GitHub), and return the stored ones nothing
  // references.
  async function runScan(moduleId, onProgress) {
    if (!isOwner) throw new Error('Owners only')

    const modulesToScan = moduleId
      ? modules.filter(m => m.id === moduleId)
      : modules
    const moduleIds = modulesToScan.map(m => m.id)
    if (moduleIds.length === 0) {
      return { orphans: [], scannedCount: 0, skippedCount: 0, totalFiles: 0 }
    }

    // 1. Referenced images, straight from note content in Supabase.
    const { data: rows, error } = await supabase
      .from('notes')
      .select('module_id, path, content_md')
      .in('module_id', moduleIds)
    if (error) throw new Error(error.message)

    const allReferencedImages = new Set()
    let scannedCount = 0
    const notes = rows ?? []
    for (const row of notes) {
      onProgress?.(scannedCount + 1, notes.length, 0)
      extractImages(row.content_md).forEach(img => allReferencedImages.add(img))
      scannedCount++
    }

    // 2. Images actually stored per module (GitHub), served static.
    const allStoredImages = []
    for (const mod of modulesToScan) {
      try {
        const files = await listDirectory(`public/notes/img/${mod.id}`)
        files.forEach(f => {
          allStoredImages.push({
            path: `/notes/img/${mod.id}/${f.name}`,
            githubPath: f.path,
            rawUrl: `https://raw.githubusercontent.com/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/${import.meta.env.VITE_GITHUB_BRANCH}/public/notes/img/${mod.id}/${f.name}`,
          })
        })
      } catch {
        // no images for this module yet
      }
    }

    // 3. Orphans = stored images no note references.
    const orphans = allStoredImages.filter(
      img => !allReferencedImages.has(img.path)
    )

    return { orphans, scannedCount, skippedCount: 0, totalFiles: notes.length }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  // Deletes confirmed orphan images from GitHub. Each item needs { githubPath }.
  async function deleteOrphans(confirmedOrphans, onProgress) {
    if (!isOwner) throw new Error('Owners only')
    let deleted = 0
    let failed  = 0

    for (let i = 0; i < confirmedOrphans.length; i++) {
      const img = confirmedOrphans[i]
      onProgress?.(i + 1, confirmedOrphans.length)
      try {
        await deleteFile(img.githubPath, `chore: remove unused image ${img.githubPath}`)
        deleted++
      } catch {
        failed++  // log but don't abort — delete as many as possible
      }
    }

    return { deleted, failed }
  }

  return { runScan, deleteOrphans }
}
