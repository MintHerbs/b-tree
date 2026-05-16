import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useComments } from '../../../hooks/useComments'
import styles from './CommentSection.module.css'
import CommentItem from '../CommentItem/CommentItem'

export default function CommentSection({ postId, sessionId, isOpen }) {
  const [shouldInit, setShouldInit] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [error, setError] = useState(null)
  const [isPosting, setIsPosting] = useState(false)

  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen) setShouldInit(true)
  }, [isOpen])

  const { comments, createComment, voteComment, deleteComment, getUserCommentVote } = useComments(shouldInit ? postId : null)

  const isExpanded = useMemo(() => {
    if (!newContent) return false
    if (newContent.includes('\n')) return true
    return newContent.length > 80
  }, [newContent])

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
  }, [newContent])

  const handlePost = async () => {
    if (isPosting) return
    setError(null)
    const trimmed = String(newContent || '').trim()
    if (!trimmed) return

    setIsPosting(true)
    const res = await createComment?.(trimmed)
    if (res?.error) {
      setError(res.error)
      setIsPosting(false)
      return
    }
    setNewContent('')
    setIsPosting(false)
  }

  const handleReply = async (content, parentId) => {
    const res = await createComment?.(content, parentId)
    return res
  }

  return (
    <div className={styles.section}>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className={styles.panel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className={styles.content}>
              <div className={styles.threadHeader}>Discussion</div>

              {(comments || []).map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  sessionId={sessionId}
                  depth={0}
                  onVote={(commentId, voteType) => voteComment?.(commentId, voteType)}
                  onReply={handleReply}
                  onDelete={(commentId) => deleteComment?.(commentId)}
                  getUserVote={getUserCommentVote}
                />
              ))}

              <div className={styles.newComment}>
                <textarea
                  ref={textareaRef}
                  className={`${styles.textarea} ${isExpanded ? styles.textareaExpanded : ''}`}
                  placeholder="Add a thoughtful reply"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={1}
                />
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.actions}>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePost} disabled={isPosting}>
                    {isPosting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
