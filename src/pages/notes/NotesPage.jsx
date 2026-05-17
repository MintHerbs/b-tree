import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import MarkdownRenderer from '../../components/markdown/MarkdownRenderer'

const notes = import.meta.glob('../../content/notes/**/*.md', {
  query: '?raw',
  import: 'default',
})

function NotesPage() {
  const { section, file } = useParams()
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')

  const noteKey = useMemo(() => {
    if (!section || !file) return null
    return `../../content/notes/${section}/${file}`
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
      {status === 'loading' && (
        <div style={{ color: '#ffffff', fontSize: '18px' }}>Loading...</div>
      )}
      {status === 'not_found' && (
        <div style={{ color: '#ff6b6b', fontSize: '18px' }}>Note not found.</div>
      )}
      {status === 'error' && (
        <div style={{ color: '#ff6b6b', fontSize: '18px' }}>Failed to load note.</div>
      )}
      {status === 'loaded' && <MarkdownRenderer content={content} />}
    </div>
  )
}

export default NotesPage
