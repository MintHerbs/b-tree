import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import MarkdownRenderer from '../../components/markdown/MarkdownRenderer'
import styles from '../../components/markdown/MarkdownRenderer.module.css'
import tocStyles from './NotesPage.module.css'

const notes = import.meta.glob('../../content/notes/**/*.md', {
  query: '?raw',
  import: 'default',
})

function NotesPage() {
  const { section, file } = useParams()
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')
  const [sections, setSections] = useState([])
  const [visibleSections, setVisibleSections] = useState(new Set([0]))
  const [activeSection, setActiveSection] = useState(0)
  const [tocExpanded, setTocExpanded] = useState(false)
  const sectionRefs = useRef([])
  const observerRef = useRef(null)
  const tocTimeoutRef = useRef(null)

  const noteKey = useMemo(() => {
    if (!section || !file) return null
    return `../../content/notes/${section}/${file}`
  }, [section, file])

  // Extract sections from markdown content
  useEffect(() => {
    if (!content) return

    const lines = content.split('\n')
    const extractedSections = []
    let currentSection = { title: 'Introduction', content: '', startLine: 0 }
    let lineIndex = 0

    for (const line of lines) {
      // Match only h1 (# ) - ignore h2
      const h1Match = line.match(/^#\s+(.+)$/)

      if (h1Match) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          extractedSections.push(currentSection)
        }
        // Start new section
        currentSection = {
          title: h1Match[1],
          content: line + '\n',
          startLine: lineIndex,
          level: 1
        }
      } else {
        currentSection.content += line + '\n'
      }
      lineIndex++
    }

    // Add the last section
    if (currentSection.content.trim()) {
      extractedSections.push(currentSection)
    }

    setSections(extractedSections)
    sectionRefs.current = new Array(extractedSections.length)
  }, [content])

  // Intersection Observer for progressive disclosure
  useEffect(() => {
    if (sections.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.dataset.sectionIndex, 10)
          
          if (entry.isIntersecting) {
            setActiveSection(index)
            
            // Reveal next section when current section is 70% visible
            if (entry.intersectionRatio > 0.7 && index < sections.length - 1) {
              setVisibleSections((prev) => new Set([...prev, index + 1]))
            }
          }
        })
      },
      {
        threshold: [0, 0.3, 0.7, 1.0],
        rootMargin: '-10% 0px -30% 0px'
      }
    )

    // Observe all section refs
    sectionRefs.current.forEach((ref) => {
      if (ref) observerRef.current.observe(ref)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [sections])

  // Scroll to section - optimized for instant navigation
  const scrollToSection = (index) => {
    // Immediately reveal the section and all previous sections
    setVisibleSections((prev) => {
      const newSet = new Set(prev)
      for (let i = 0; i <= index; i++) {
        newSet.add(i)
      }
      return newSet
    })

    // Immediately update active section
    setActiveSection(index)

    // Use requestAnimationFrame for immediate scroll
    requestAnimationFrame(() => {
      const element = sectionRefs.current[index]
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    })
  }

  // Handle TOC hover
  const handleTocMouseEnter = () => {
    if (tocTimeoutRef.current) {
      clearTimeout(tocTimeoutRef.current)
    }
    setTocExpanded(true)
  }

  const handleTocMouseLeave = () => {
    tocTimeoutRef.current = setTimeout(() => {
      setTocExpanded(false)
    }, 150)
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

  return (
    <div className={tocStyles.pageWrapper}>
      {/* Table of Contents Sidebar - LEFT SIDE - Collapsible */}
      {status === 'loaded' && sections.length > 0 && (
        <aside 
          className={`${tocStyles.tocSidebar} ${tocExpanded ? tocStyles.tocExpanded : ''}`}
          onMouseEnter={handleTocMouseEnter}
          onMouseLeave={handleTocMouseLeave}
        >
          {/* Hamburger Icon - Always visible */}
          <div className={tocStyles.tocHamburger}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Expanded content */}
          <div className={tocStyles.tocContent}>
            <div className={tocStyles.tocHeader}>
              <div className={tocStyles.tocTitle}>Guide</div>
            </div>
            <nav className={tocStyles.tocNav}>
              {sections.map((sec, index) => (
                <div key={index} className={tocStyles.tocItemWrapper}>
                  <div className={tocStyles.tocTimeline}>
                    <div className={`${tocStyles.tocDot} ${activeSection === index ? tocStyles.tocDotActive : ''}`} />
                  </div>
                  <button
                    onClick={() => scrollToSection(index)}
                    className={`${tocStyles.tocItem} ${
                      activeSection === index ? tocStyles.tocItemActive : ''
                    }`}
                    title={sec.title}
                  >
                    {sec.title}
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Notes Container - RIGHT SIDE */}
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
        {status === 'loaded' && sections.length > 0 && (
          <>
            {/* Main content with progressive sections */}
            {sections.map((sec, index) => (
              <div
                key={index}
                ref={(el) => (sectionRefs.current[index] = el)}
                data-section-index={index}
                className={`${tocStyles.section} ${
                  visibleSections.has(index) ? tocStyles.sectionVisible : tocStyles.sectionHidden
                }`}
              >
                <MarkdownRenderer content={sec.content} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default NotesPage
