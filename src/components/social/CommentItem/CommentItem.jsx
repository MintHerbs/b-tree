import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Trash } from '@phosphor-icons/react'
import AgentAvatar from '../../effects/smoothui/agent-avatar'
import styles from './CommentItem.module.css'

function formatRelativeTime(iso) {
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return ''
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export default function CommentItem({ comment, sessionId, depth, onVote, onReply, onDelete, getUserVote }) {
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isOwn = comment?.session_id && sessionId && comment.session_id === sessionId
  const timeLabel = useMemo(() => formatRelativeTime(comment?.created_at), [comment?.created_at])

  const userVote = getUserVote?.(comment?.id) ?? null
  const isRemoved = !!comment?.is_deleted
  const replies = Array.isArray(comment?.replies) ? comment.replies : []

  const handlePostReply = async () => {
    const trimmed = String(replyContent || '').trim()
    if (!trimmed) return
    const res = await onReply?.(trimmed, comment.id)
    if (res?.error) return
    setReplyContent('')
    setShowReply(false)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    const res = await onDelete?.(comment.id)
    if (res?.error) {
      console.error('Failed to delete comment:', res.error)
      alert('Failed to delete comment. Please try again.')
      setShowDeleteConfirm(false)
      return
    }
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div className={`${styles.item} ${depth === 1 ? styles.indentReply : ''}`}>
      <div className={styles.threadLine} />

      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.avatar}>
            <AgentAvatar seed={comment?.session_id || 'anon'} size={24} animated={true} />
          </div>

          <div className={styles.bubble}>
            <div className={`${styles.text} ${isRemoved ? styles.removed : ''}`}>
              {isRemoved ? '[Comment removed]' : comment?.content}
            </div>

            <div className={styles.meta}>
              <span>{timeLabel}</span>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${userVote === 'up' ? styles.activeUp : ''}`}
                  onClick={() => onVote?.(comment.id, 'up')}
                >
                  <ArrowUp size={14} weight={userVote === 'up' ? 'fill' : 'regular'} />
                  {comment?.upvotes ?? 0}
                </button>

                <button
                  type="button"
                  className={`${styles.actionBtn} ${userVote === 'down' ? styles.activeDown : ''}`}
                  onClick={() => onVote?.(comment.id, 'down')}
                >
                  <ArrowDown size={14} weight={userVote === 'down' ? 'fill' : 'regular'} />
                  {comment?.downvotes ?? 0}
                </button>

                {depth === 0 && !isRemoved && (
                  <button type="button" className={styles.actionBtn} onClick={() => setShowReply((v) => !v)}>
                    Reply
                  </button>
                )}

                {isOwn && !isRemoved && (
                  <button type="button" className={styles.actionBtn} onClick={handleDeleteClick}>
                    <Trash size={14} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className={styles.deleteConfirm}>
            <span className={styles.deleteConfirmText}>Delete this comment?</span>
            <div className={styles.deleteConfirmActions}>
              <button type="button" className={styles.btn} onClick={handleCancelDelete}>
                Cancel
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        )}

        {depth === 0 && showReply && (
          <div className={styles.replyBox}>
            <textarea
              className={styles.replyTextarea}
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
            />
            <div className={styles.replyActions}>
              <button type="button" className={styles.btn} onClick={() => setShowReply(false)}>
                Cancel
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePostReply}>
                Post reply
              </button>
            </div>
          </div>
        )}

        {depth === 0 &&
          replies.length > 0 &&
          replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              sessionId={sessionId}
              depth={1}
              onVote={onVote}
              onReply={onReply}
              onDelete={onDelete}
              getUserVote={getUserVote}
            />
          ))}
      </div>
    </div>
  )
}
