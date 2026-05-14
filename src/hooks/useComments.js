import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRateLimit } from './useRateLimit'

function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

function buildNestedComments(flatComments) {
  const topLevel = (flatComments || []).filter((c) => !c.parent_comment_id)

  const repliesByParent = new Map()
  for (const c of flatComments || []) {
    if (!c.parent_comment_id) continue
    const list = repliesByParent.get(c.parent_comment_id) || []
    list.push(c)
    repliesByParent.set(c.parent_comment_id, list)
  }

  return topLevel.map((c) => ({
    ...c,
    replies: repliesByParent.get(c.id) || [],
  }))
}

export function useComments(postId) {
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userVotes, setUserVotes] = useState({})
  const channelName = useRef(`comments-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  const { checkLimit } = useRateLimit()

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([])
      return
    }

    setIsLoading(true)

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      setComments([])
      setIsLoading(false)
      return
    }

    const flat = data || []
    setComments(buildNestedComments(flat))

    const sessionId = getOrCreateSessionId()
    const commentIds = flat.map((c) => c.id).filter(Boolean)

    if (commentIds.length) {
      const { data: voteRows } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .eq('session_id', sessionId)
        .in('comment_id', commentIds)

      const nextVotes = {}
      for (const row of voteRows || []) nextVotes[row.comment_id] = row.vote_type
      setUserVotes(nextVotes)
    } else {
      setUserVotes({})
    }

    setIsLoading(false)
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  useEffect(() => {
    if (!postId) return undefined

    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          fetchComments()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchComments, postId])

  const createComment = useCallback(
    async (content, parentCommentId) => {
      if (!postId) return { error: 'Missing postId' }
      const sessionId = getOrCreateSessionId()

      const allowed = await checkLimit('comment')
      if (!allowed) return { error: 'Rate limited' }

      const trimmed = String(content ?? '').trim()
      if (!trimmed) return { error: 'Empty comment' }

      let depth = 0
      let parentId = parentCommentId ?? null

      if (parentId) {
        const { data: parentRow } = await supabase
          .from('comments')
          .select('id, depth')
          .eq('id', parentId)
          .maybeSingle()

        if (!parentRow?.id || parentRow.depth !== 0) return { error: 'Invalid parent comment' }
        depth = 1
      }

      const { data: inserted, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: parentId,
          session_id: sessionId,
          content: trimmed,
          depth,
        })
        .select('*')
        .single()

      return { data: inserted ?? null, error: error ?? null }
    },
    [checkLimit, postId]
  )

  const voteComment = useCallback(async (commentId, voteType) => {
    const sessionId = getOrCreateSessionId()
    if (voteType !== 'up' && voteType !== 'down') return { error: 'Invalid vote type' }

    const { error } = await supabase
      .from('comment_votes')
      .upsert(
        { comment_id: commentId, session_id: sessionId, vote_type: voteType },
        { onConflict: 'comment_id,session_id' }
      )

    if (error) return { error: 'Failed to vote' }
    setUserVotes((prev) => ({ ...prev, [commentId]: voteType }))
    return { data: voteType }
  }, [])

  const deleteComment = useCallback(async (commentId) => {
    const { error } = await supabase.from('comments').update({ is_deleted: true }).eq('id', commentId)
    if (error) return { error: 'Failed to delete comment' }
    return { data: true }
  }, [])

  const getUserCommentVote = useCallback((commentId) => userVotes[commentId] ?? null, [userVotes])

  return useMemo(
    () => ({
      comments,
      isLoading,
      createComment,
      voteComment,
      deleteComment,
      getUserCommentVote,
    }),
    [comments, createComment, deleteComment, getUserCommentVote, isLoading, voteComment]
  )
}
