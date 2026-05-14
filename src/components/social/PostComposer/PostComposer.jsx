import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle, Code as CodeIcon } from '@phosphor-icons/react'
import AgentAvatar from '../../effects/smoothui/agent-avatar'
import PollBuilder from './PollBuilder/PollBuilder'
import CodeAttachment from './CodeAttachment/CodeAttachment'
import TitleModal from './TitleModal/TitleModal'
import styles from './PostComposer.module.css'

export default function PostComposer({ onPost, sessionId }) {
  const [content, setContent] = useState('')
  const [code, setCode] = useState(null)
  const [codeLanguage, setCodeLanguage] = useState('python')
  const [poll, setPoll] = useState(null)
  const [activeFeature, setActiveFeature] = useState(null)
  const [showTitleModal, setShowTitleModal] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState(null)
  const [shake, setShake] = useState(false)

  const textareaRef = useRef(null)
  const shakeTimeoutRef = useRef(null)

  const charCount = content.length
  const warnCount = charCount >= 180

  const isExpanded = useMemo(() => {
    if (!content) return false
    if (content.includes('\n')) return true
    return content.length > 80
  }, [content])

  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const computed = window.getComputedStyle(el)
    const lineHeight = Number.parseFloat(computed.lineHeight || '20') || 20
    const maxHeight = Math.round(lineHeight * 6 + 20)
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    resizeTextarea()
  }, [content])

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current)
    }
  }, [])

  const handleContentChange = (e) => {
    setError(null)
    setContent(e.target.value)
  }

  const handleToggleVote = () => {
    setError(null)
    if (activeFeature === 'poll' && poll?.type === 'binary') {
      setActiveFeature(null)
      setPoll(null)
      return
    }
    setActiveFeature('poll')
    setPoll({ type: 'binary', options: ['Yes', 'No'] })
  }

  const handleToggleCode = () => {
    setError(null)
    if (activeFeature === 'code') {
      setActiveFeature(null)
      return
    }
    setActiveFeature('code')
    if (code == null) setCode('')
  }

  const resetState = () => {
    setContent('')
    setCode(null)
    setCodeLanguage('python')
    setPoll(null)
    setActiveFeature(null)
    setShowTitleModal(false)
    setError(null)
  }

  const doPost = async ({ title } = {}) => {
    if (isPosting) return
    setError(null)

    const cleanContent = content.trim()

    if (!cleanContent) {
      setError('Post content is required')
      return
    }
    const cleanTitle = String(title || '').trim()

    const postData = {
      content: cleanContent,
      title: cleanTitle ? cleanTitle : undefined,
      code: code ? String(code) : undefined,
      codeLanguage: code ? codeLanguage : undefined,
      poll: poll || undefined,
    }

    setIsPosting(true)
    try {
      const res = await onPost?.(postData)
      if (res?.error) {
        setError(res.error)
        return
      }
      resetState()
      textareaRef.current?.focus()
    } catch (e) {
      setError('Failed to post')
    } finally {
      setIsPosting(false)
    }
  }

  const triggerShake = () => {
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current)
    setShake(true)
    shakeTimeoutRef.current = window.setTimeout(() => setShake(false), 450)
  }

  const handlePostClick = () => {
    if (!content.trim()) {
      triggerShake()
      return
    }
    setShowTitleModal(true)
  }

  return (
    <div className={`${styles.composer} ${shake ? styles.shake : ''}`}>
      <div className={styles.row}>
        <div className={styles.avatar}>
          <AgentAvatar seed={sessionId || 'anon'} size={32} animated={true} />
        </div>

        <div className={styles.inputs}>
          <textarea
            ref={textareaRef}
            className={`${styles.textarea} ${isExpanded ? styles.textareaExpanded : ''}`}
            placeholder="What's on your mind?"
            value={content}
            onChange={handleContentChange}
            maxLength={200}
            rows={1}
          />

          <div className={styles.bar}>
            <div className={styles.features}>
              <button
                type="button"
                className={`${styles.featureBtn} ${activeFeature === 'poll' && poll?.type === 'binary' ? styles.featureBtnActive : ''}`}
                onClick={handleToggleVote}
              >
                <CheckCircle size={16} /> Vote
              </button>

              <button
                type="button"
                className={`${styles.featureBtn} ${activeFeature === 'code' ? styles.featureBtnActive : ''}`}
                onClick={handleToggleCode}
              >
                <CodeIcon size={16} /> Code
              </button>
            </div>

            <div className={`${styles.charCount} ${warnCount ? styles.charCountWarn : ''}`}>{charCount}/200</div>
          </div>

          {activeFeature === 'poll' && (
            <div className={styles.panel}>
              <PollBuilder poll={poll} onChange={setPoll} />
            </div>
          )}

          {activeFeature === 'code' && (
            <div className={styles.panel}>
              <CodeAttachment
                code={code || ''}
                language={codeLanguage}
                onChange={(nextCode, lang) => {
                  setCode(nextCode)
                  setCodeLanguage(lang)
                }}
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button type="button" className={styles.postBtn} onClick={handlePostClick} disabled={isPosting}>
              {isPosting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <TitleModal
        open={showTitleModal}
        onClose={() => setShowTitleModal(false)}
        onSubmit={(nextTitle) => doPost({ title: nextTitle })}
      />
    </div>
  )
}
