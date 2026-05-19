import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import MarkdownRenderer from '../../components/markdown/MarkdownRenderer'
import styles from '../../components/markdown/MarkdownRenderer.module.css'

const notes = import.meta.glob('../../content/notes/**/*.md', {
  query: '?raw',
  import: 'default',
})

function NotesPage() {
  const { section } = useParams()
  const subpath = useParams()['*']
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')

  const noteKey = useMemo(() => {
    if (!section || !subpath) return null
    return `../../content/notes/${section}/${subpath}.md`
  }, [section, subpath])

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
    <div className={styles.notesContainer}>
      {status === 'loading' && (
        <div style={{ color: '#E8E0D5', fontSize: '18px' }}>Loading...</div>
      )}
      {status === 'not_found' && (
        <div style={{ color: '#ff6b6b', fontSize: '18px' }}>Note not found.</div>
      )}
      {status === 'error' && (
        <div style={{ color: '#ff6b6b', fontSize: '18px' }}>Failed to load note.</div>
      )}
      {status === 'loaded' && (
        <MarkdownRenderer content={content} />
      )}
    </div>
  )
}

export default NotesPage
