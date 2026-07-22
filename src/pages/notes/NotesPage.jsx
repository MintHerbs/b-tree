import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import NoteReader from '../../components/markdown/NoteReader'
import { MODULES, primaryTool } from '../../components/layout/Sidebar/modules.js'

const notes = import.meta.glob('../../content/notes/**/*.md', {
  query: '?raw',
  import: 'default',
})

/** "getting-started" / "notes/img-push" → "Getting Started" (last segment, humanised). */
function humaniseFilename(subpath) {
  const leaf = String(subpath || '').split('/').filter(Boolean).pop() || ''
  return leaf
    .replace(/\.md$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Registry label for a module id, else a title-cased fallback of the id. */
function moduleLabel(section) {
  const found = MODULES.find((m) => m.id === section)
  if (found?.label) return found.label
  return String(section || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function NotesPage() {
  const { section } = useParams()
  const subpath = useParams()['*']
  const navigate = useNavigate()
  const location = useLocation()
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')

  const noteKey = useMemo(() => {
    if (!section || !subpath) return null
    return `../../content/notes/${section}/${subpath}.md`
  }, [section, subpath])

  const eyebrow = useMemo(() => {
    if (!section) return ''
    const file = humaniseFilename(subpath)
    return file ? `${moduleLabel(section)} · ${file}` : moduleLabel(section)
  }, [section, subpath])

  const handleBack = () => {
    // Go back when there's in-app history; otherwise land on the module so a
    // deep-linked note never strands the reader.
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    const module = MODULES.find((m) => m.id === section)
    navigate((module && primaryTool(module)?.route) ?? '/home')
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!noteKey) return
      const loader = notes[noteKey]
      if (!loader) {
        setStatus('not_found')
        setContent('')
        return
      }

      setStatus('loading')
      try {
        const text = await loader()
        if (cancelled) return
        setContent(text)
        setStatus('loaded')
      } catch {
        if (cancelled) return
        setStatus('error')
        setContent('')
      }
    }

    load()
    return () => { cancelled = true }
  }, [noteKey])

  if (status === 'loaded') {
    return <NoteReader content={content} eyebrow={eyebrow} onBack={handleBack} />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
      {status === 'loading' && (
        <div style={{ color: '#E8E0D5', fontSize: '18px' }}>Loading...</div>
      )}
      {status === 'not_found' && (
        <div style={{ color: '#ff6b6b', fontSize: '18px' }}>Note not found.</div>
      )}
      {status === 'error' && (
        <div style={{ color: '#ff6b6b', fontSize: '18px' }}>Failed to load note.</div>
      )}
    </div>
  )
}

export default NotesPage
