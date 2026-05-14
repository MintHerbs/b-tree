import { ArrowUp, ArrowDown, MessageCircle } from 'lucide-react'
import styles from './PostActions.module.css'

export default function PostActions({
  upvotes,
  downvotes,
  commentCount,
  userVote,
  hasFlagged,
  onVote,
  onFlag,
  onCommentToggle,
}) {
  const safeUpvotes = upvotes ?? 0
  const safeDownvotes = downvotes ?? 0
  const safeCommentCount = commentCount ?? 0

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={`${styles.voteBtn} ${userVote === 'up' ? styles.upActive : ''}`}
        onClick={() => onVote('up')}
      >
        <ArrowUp size={14} />
        <span>{safeUpvotes}</span>
      </button>

      <button
        type="button"
        className={`${styles.voteBtn} ${userVote === 'down' ? styles.downActive : ''}`}
        onClick={() => onVote('down')}
      >
        <ArrowDown size={14} />
        <span>{safeDownvotes}</span>
      </button>

      <button type="button" className={styles.commentBtn} onClick={onCommentToggle}>
        <MessageCircle size={14} />
        <span>{safeCommentCount}</span>
      </button>

      <button
        type="button"
        className={`${styles.hexFlagBtn} ${hasFlagged ? styles.flagged : ''}`}
        onClick={onFlag}
        aria-label={hasFlagged ? 'Flagged' : 'Flag post'}
        title={hasFlagged ? 'You flagged this post' : 'Flag as inappropriate'}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L14.06 4.5V11.5L8 15L1.94 11.5V4.5L8 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill={hasFlagged ? 'currentColor' : 'none'}
          />
        </svg>
      </button>
    </div>
  )
}
