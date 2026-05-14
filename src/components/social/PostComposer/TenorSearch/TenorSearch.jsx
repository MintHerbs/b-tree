import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './TenorSearch.module.css'

const LIMIT = 20

function toGifItems(results) {
  if (!Array.isArray(results)) return []
  return results
    .map((result) => {
      const thumb = result?.media_formats?.tinygif?.url
      const gif = result?.media_formats?.gif?.url
      if (!thumb || !gif) return null
      return { gif, thumb }
    })
    .filter(Boolean)
}

export default function TenorSearch({ onSelect, onClose }) {
  const apiKey = import.meta.env.VITE_TENOR_API_KEY
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => window.clearTimeout(id)
  }, [query])

  const url = useMemo(() => {
    const key = encodeURIComponent(apiKey || '')
    if (debouncedQuery) {
      return `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(debouncedQuery)}&key=${key}&limit=${LIMIT}&media_filter=gif`
    }
    return `https://tenor.googleapis.com/v2/featured?key=${key}&limit=${LIMIT}&media_filter=gif`
  }, [apiKey, debouncedQuery])

  useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      if (!apiKey) {
        setItems([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()
        if (controller.signal.aborted) return
        setItems(toGifItems(data?.results))
      } catch (e) {
        if (controller.signal.aborted) return
        setItems([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [apiKey, url])

  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

  return (
    <div className={styles.panel}>
      <input
        ref={inputRef}
        className={styles.searchInput}
        placeholder="Search GIFs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.grid} role="list">
        {loading
          ? skeletons.map((i) => <div key={i} className={styles.skeleton} />)
          : items.map((item) => (
              <button
                key={item.gif}
                type="button"
                className={styles.thumbBtn}
                onClick={() => {
                  onSelect?.(item.gif, item.thumb)
                  onClose?.()
                }}
              >
                <img className={styles.thumbImg} src={item.thumb} alt="GIF" loading="lazy" />
              </button>
            ))}
      </div>

      <div className={styles.attribution}>via Tenor</div>
    </div>
  )
}
