import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

const notes = import.meta.glob('../content/notes/**/*.md', {
  query: '?raw',
  import: 'default',
})

function NotesPage() {
  const { section, file } = useParams()
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')

  const noteKey = useMemo(() => {
    if (!section || !file) return null
    return `../content/notes/${section}/${file}`
  }, [section, file])

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

  const text =
    status === 'loading'
      ? 'Loading...'
      : status === 'not_found'
        ? 'Note not found.'
        : status === 'error'
          ? 'Failed to load note.'
          : content

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 5,
        marginLeft: '76px',
        minHeight: '100vh',
        padding: '48px 20px',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          color: '#ffffff',
          fontFamily: 'monospace',
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export default NotesPage
