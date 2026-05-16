import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, withSession } from '../lib/supabaseClient'
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

  const { checkLimit, recordAction } = useRateLimit()

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
    
    // Fetch vote counts for all comments
    const commentIds = flat.map((c) => c.id).filter(Boolean)
    let voteCounts = {}
    
    if (commentIds.length > 0) {
      const { data: voteData } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .in('comment_id', commentIds)
      
      // Count votes for each comment
      for (const vote of voteData || []) {
        if (!voteCounts[vote.comment_id]) {
          voteCounts[vote.comment_id] = { upvotes: 0, downvotes: 0 }
        }
        if (vote.vote_type === 'up') {
          voteCounts[vote.comment_id].upvotes++
        } else if (vote.vote_type === 'down') {
          voteCounts[vote.comment_id].downvotes++
        }
      }
    }
    
    // Add vote counts to comments
    const flatWithCounts = flat.map(c => ({
      ...c,
      upvotes: voteCounts[c.id]?.upvotes ?? 0,
      downvotes: voteCounts[c.id]?.downvotes ?? 0
    }))
    
    setComments(buildNestedComments(flatWithCounts))

    const sessionId = getOrCreateSessionId()

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

      const { data: botCheck } = await supabase.rpc('check_bot_blacklist', {
        p_session_id: localStorage.getItem('session_id')
      })
      if (botCheck?.is_blacklisted) throw new Error('Unable to post at this time.')

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

      if (!error) await recordAction('comment')
      return { data: inserted ?? null, error: error ?? null }
    },
    [checkLimit, postId, recordAction]
  )

  const voteComment = useCallback(async (commentId, voteType) => {
    const sessionId = getOrCreateSessionId()
    if (voteType !== 'up' && voteType !== 'down') return { error: 'Invalid vote type' }

    const currentVote = userVotes[commentId]
    
    // If clicking the same vote type, remove the vote
    if (currentVote === voteType) {
      const { error } = await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq('session_id', sessionId)

      if (error) return { error: 'Failed to remove vote' }
      
      setUserVotes((prev) => {
        const next = { ...prev }
        delete next[commentId]
        return next
      })
      
      // Refresh comments to update counts
      fetchComments()
      return { data: null }
    }

    // Otherwise, upsert the new vote
    const { error } = await supabase
      .from('comment_votes')
      .upsert(
        { comment_id: commentId, session_id: sessionId, vote_type: voteType },
        { onConflict: 'comment_id,session_id' }
      )

    if (error) return { error: 'Failed to vote' }
    setUserVotes((prev) => ({ ...prev, [commentId]: voteType }))
    
    // Refresh comments to update counts
    fetchComments()
    return { data: voteType }
  }, [userVotes, fetchComments])

  const deleteComment = useCallback(async (commentId) => {
    await withSession()
    const { data, error } = await supabase.rpc('soft_delete_comment', {
      p_comment_id: commentId,
      p_session_id: localStorage.getItem('session_id'),
    })

    if (error || !data?.success) throw new Error(data?.error || 'Failed to delete comment')
    
    // Refresh comments to show the deleted state
    fetchComments()
    return { data: true }
  }, [fetchComments])

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
