import { useEffect, useMemo, useRef, useState } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'
import AgentAvatar from '../../effects/smoothui/agent-avatar'
import { supabase } from '../../../lib/supabaseClient'
import PostActions from '../PostActions/PostActions'
import styles from './PostCard.module.css'

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

function getFirstLines(text, lineCount) {
  const lines = String(text || '').split('\n')
  return lines.slice(0, lineCount).join('\n')
}

function toPercent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default function PostCard({ post, sessionId, onVote, onFlag, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post?.content || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [poll, setPoll] = useState(null)
  const [pollVotes, setPollVotes] = useState([])
  const [userPollVote, setUserPollVote] = useState(null)
  const [isVotingPoll, setIsVotingPoll] = useState(false)

  const menuRef = useRef(null)

  const isOwnPost = post?.session_id && sessionId && post.session_id === sessionId

  const timeLabel = useMemo(() => formatRelativeTime(post?.created_at), [post?.created_at])

  const contentLines = useMemo(() => String(post?.content || '').split('\n').length, [post?.content])
  const showReadMore = contentLines > 4 && !isExpanded && !isEditing
  const contentToShow = useMemo(() => {
    if (isEditing) return ''
    if (isExpanded) return String(post?.content || '')
    if (contentLines <= 4) return String(post?.content || '')
    return getFirstLines(post?.content || '', 4)
  }, [contentLines, isExpanded, isEditing, post?.content])

  const userVote = post?.userVote ?? post?.user_vote ?? null
  const hasFlagged = !!(post?.hasFlagged ?? post?.has_flagged)
  const commentCount = post?.commentCount ?? post?.comment_count ?? 0

  useEffect(() => {
    setEditContent(post?.content || '')
  }, [post?.content])

  useEffect(() => {
    if (!menuOpen) return undefined
    const handler = (e) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(e.target)) return
      setMenuOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    let isActive = true

    const loadPoll = async () => {
      if (!post?.id) {
        setPoll(null)
        return
      }

      const { data: pollRow } = await supabase.from('polls').select('*').eq('post_id', post.id).maybeSingle()
      if (!isActive) return
      if (!pollRow?.id) {
        setPoll(null)
        setPollVotes([])
        setUserPollVote(null)
        return
      }

      setPoll(pollRow)

      const [{ data: voteRows }, { data: myVoteRow }] = await Promise.all([
        supabase.from('poll_votes').select('option_index').eq('poll_id', pollRow.id),
        sessionId
          ? supabase.from('poll_votes').select('option_index').eq('poll_id', pollRow.id).eq('session_id', sessionId).maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      if (!isActive) return
      setPollVotes(voteRows || [])
      setUserPollVote(myVoteRow?.option_index ?? null)
    }

    loadPoll()
    return () => {
      isActive = false
    }
  }, [post?.id, sessionId])

  const pollStats = useMemo(() => {
    if (!poll?.id) return null
    const options = Array.isArray(poll.options) ? poll.options : []
    const counts = options.map(() => 0)
    for (const v of pollVotes) {
      if (typeof v.option_index !== 'number') continue
      if (v.option_index < 0 || v.option_index >= counts.length) continue
      counts[v.option_index] += 1
    }
    const total = counts.reduce((a, b) => a + b, 0)
    return { options, counts, total }
  }, [poll?.id, poll?.options, pollVotes])

  const hasVotedPoll = userPollVote != null

  const handlePollVote = async (idx) => {
    if (!poll?.id) return
    if (!sessionId) return
    if (hasVotedPoll) return
    if (isVotingPoll) return

    setIsVotingPoll(true)
    const { error } = await supabase
      .from('poll_votes')
      .upsert({ poll_id: poll.id, session_id: sessionId, option_index: idx }, { onConflict: 'poll_id,session_id' })

    if (!error) {
      setUserPollVote(idx)
      setPollVotes((prev) => [...prev, { option_index: idx }])
    }

    setIsVotingPoll(false)
  }

  const handleEdit = () => {
    setConfirmDelete(false)
    setMenuOpen(false)
    setIsEditing(true)
    setIsExpanded(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(post?.content || '')
  }

  const handleSaveEdit = async () => {
    const trimmed = String(editContent || '').trim()
    const res = await onEdit?.(post.id, { content: trimmed })
    if (res?.error) return
    setIsEditing(false)
  }

  const handleDeleteClick = () => {
    setMenuOpen(false)
    setIsEditing(false)
    setConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    await onDelete?.(post.id)
    setConfirmDelete(false)
  }

  const handleCancelDelete = () => {
    setConfirmDelete(false)
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <AgentAvatar seed={post?.session_id || 'anon'} size={32} animated={true} />
        </div>

        <div className={styles.meta}>
          <div className={styles.name}>anon</div>
          <div className={styles.time}>{timeLabel}</div>
        </div>

        {isOwnPost && (
          <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)}>
            <DotsThreeVertical size={18} />
          </button>
        )}
      </div>

      {menuOpen && (
        <div className={styles.menu} ref={menuRef}>
          <button type="button" className={styles.menuItem} onClick={handleEdit}>
            Edit post
          </button>
          <button type="button" className={`${styles.menuItem} ${styles.menuDanger}`} onClick={handleDeleteClick}>
            Delete post
          </button>
        </div>
      )}

      {post?.title && <div className={styles.title}>{post.title}</div>}

      {!isEditing && <div className={styles.content}>{contentToShow}</div>}

      {showReadMore && (
        <div className={styles.readMore} onClick={() => setIsExpanded(true)}>
          ...read more
        </div>
      )}

      {isEditing && (
        <div className={styles.editArea}>
          <textarea
            className={styles.editTextarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={200}
            rows={5}
          />
          <div className={styles.editActions}>
            <button type="button" className={styles.btn} onClick={handleCancelEdit}>
              Cancel
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSaveEdit}>
              Save
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.confirm}>
          <div className={styles.confirmText}>Delete this post?</div>
          <div className={styles.editActions}>
            <button type="button" className={styles.btn} onClick={handleCancelDelete}>
              Cancel
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConfirmDelete}>
              Yes, delete
            </button>
          </div>
        </div>
      )}

      {post?.code && (
        <div className={styles.codeWrap}>
          <div className={styles.codeLang}>{post?.code_language || 'code'}</div>
          <pre className={styles.code}>
            <code>{post.code}</code>
          </pre>
        </div>
      )}

      {post?.gif_url && <img className={styles.gif} src={post.gif_url} alt="GIF" />}

      {pollStats && pollStats.options.length > 0 && (
        <div className={styles.poll}>
          {!hasVotedPoll &&
            pollStats.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.pollOptionBtn}
                onClick={() => handlePollVote(idx)}
                disabled={isVotingPoll}
              >
                {opt}
              </button>
            ))}

          {hasVotedPoll &&
            pollStats.options.map((opt, idx) => {
              const count = pollStats.counts[idx] || 0
              const pct = toPercent(count, pollStats.total)
              const isSelected = userPollVote === idx
              return (
                <div key={idx} className={styles.barRow}>
                  <div className={styles.barTop}>
                    <span>{opt}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${isSelected ? styles.barFillSelected : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {post?.is_edited && <div className={styles.edited}>edited</div>}

      <PostActions
        postId={post?.id}
        upvotes={post?.upvotes}
        downvotes={post?.downvotes}
        commentCount={commentCount}
        userVote={userVote}
        hasFlagged={hasFlagged}
        sessionId={sessionId}
        onVote={(voteType) => onVote?.(post?.id, voteType)}
        onFlag={(id) => onFlag?.(id)}
        onCommentToggle={() => setShowComments((v) => !v)}
        isCommentOpen={showComments}
      />
    </div>
  )
}
