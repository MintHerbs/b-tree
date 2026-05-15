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

function stripHtmlTags(value) {
  if (!value) return ''
  return String(value).replace(/<[^>]*>/g, '')
}

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function usePosts() {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userVotes, setUserVotes] = useState({})
  const [userFlags, setUserFlags] = useState({})
  const channelName = useRef(`posts-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  const { checkLimit, recordAction, isBlacklisted } = useRateLimit()

  const loadUserInteractions = useCallback(async (sessionId, postIds) => {
    if (!sessionId || postIds.length === 0) return

    const [{ data: voteRows }, { data: flagRows }] = await Promise.all([
      supabase
        .from('post_votes')
        .select('post_id, vote_type')
        .eq('session_id', sessionId)
        .in('post_id', postIds),
      supabase
        .from('post_flags')
        .select('post_id')
        .eq('session_id', sessionId)
        .in('post_id', postIds),
    ])

    const nextVotes = {}
    for (const row of voteRows || []) nextVotes[row.post_id] = row.vote_type
    setUserVotes(nextVotes)

    const nextFlags = {}
    for (const row of flagRows || []) nextFlags[row.post_id] = true
    setUserFlags(nextFlags)
  }, [])

  useEffect(() => {
    let isActive = true

    const fetchPosts = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          sessions(id),
          upvotes:post_votes(count).eq(vote_type, 'up'),
          downvotes:post_votes(count).eq(vote_type, 'down'),
          comment_count:comments(count)
        `)
        .eq('is_deleted', false)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!isActive) return

      if (error) {
        setPosts([])
        setIsLoading(false)
        return
      }

      // Transform the count aggregates into simple numbers
      const nextPosts = (data || []).map(post => ({
        ...post,
        upvotes: post.upvotes?.[0]?.count ?? 0,
        downvotes: post.downvotes?.[0]?.count ?? 0,
        comment_count: post.comment_count?.[0]?.count ?? 0
      }))
      
      setPosts(nextPosts)

      const sessionId = getOrCreateSessionId()
      await loadUserInteractions(
        sessionId,
        nextPosts.map((p) => p.id).filter(Boolean)
      )

      if (isActive) setIsLoading(false)
    }

    fetchPosts()

    return () => {
      isActive = false
    }
  }, [loadUserInteractions])

  useEffect(() => {
    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const next = payload.new
          if (!next || next.is_deleted || next.is_flagged) return
          
          // Fetch vote counts for the new post
          const { data: voteCounts } = await supabase
            .from('post_votes')
            .select('vote_type')
            .eq('post_id', next.id)
          
          const upvotes = (voteCounts || []).filter(v => v.vote_type === 'up').length
          const downvotes = (voteCounts || []).filter(v => v.vote_type === 'down').length
          
          setPosts((prev) => sortByCreatedAtDesc([{ ...next, upvotes, downvotes }, ...prev]).slice(0, 50))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        async (payload) => {
          const next = payload.new
          if (!next) return

          if (next.is_deleted || next.is_flagged) {
            setPosts((prev) => prev.filter((p) => p.id !== next.id))
            return
          }

          // Fetch vote counts for the updated post
          const { data: voteCounts } = await supabase
            .from('post_votes')
            .select('vote_type')
            .eq('post_id', next.id)
          
          const upvotes = (voteCounts || []).filter(v => v.vote_type === 'up').length
          const downvotes = (voteCounts || []).filter(v => v.vote_type === 'down').length

          setPosts((prev) => {
            const exists = prev.some((p) => p.id === next.id)
            const updated = exists 
              ? prev.map((p) => (p.id === next.id ? { ...next, upvotes, downvotes } : p)) 
              : [{ ...next, upvotes, downvotes }, ...prev]
            return sortByCreatedAtDesc(updated).slice(0, 50)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const oldRow = payload.old
          if (!oldRow?.id) return
          setPosts((prev) => prev.filter((p) => p.id !== oldRow.id))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_votes' },
        async (payload) => {
          // When votes change, update the affected post's vote counts
          const postId = payload.new?.post_id || payload.old?.post_id
          if (!postId) return
          
          const { data: voteCounts } = await supabase
            .from('post_votes')
            .select('vote_type')
            .eq('post_id', postId)
          
          const upvotes = (voteCounts || []).filter(v => v.vote_type === 'up').length
          const downvotes = (voteCounts || []).filter(v => v.vote_type === 'down').length
          
          setPosts((prev) => prev.map(p => 
            p.id === postId ? { ...p, upvotes, downvotes } : p
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createPost = useCallback(
    async (data) => {
      const sessionId = getOrCreateSessionId()
      const allowed = await checkLimit('post')
      if (!allowed) {
        const { data: blacklistRow } = await supabase
          .from('bot_blacklist')
          .select('session_id')
          .eq('session_id', sessionId)
          .maybeSingle()

        if (blacklistRow?.session_id || isBlacklisted) return { error: 'Unable to post at this time' }
        return { error: 'Rate limited' }
      }

      if (isBlacklisted) return { error: 'Unable to post at this time' }

      await supabase.from('sessions').upsert({ id: sessionId, last_seen: new Date().toISOString() })

      const content = stripHtmlTags(data?.content).trim()
      if (content.length > 200) return { error: 'Content too long' }

      const title = data?.title != null && String(data.title).trim() !== '' ? stripHtmlTags(data.title).trim() : null

      const insertPayload = {
        session_id: sessionId,
        title,
        content,
        code: data?.code ?? null,
        code_language: data?.codeLanguage ?? data?.code_language ?? null,
        gif_url: data?.gifUrl ?? data?.gif_url ?? null,
      }

      const { data: postRow, error: postError } = await supabase
        .from('posts')
        .insert(insertPayload)
        .select('*')
        .single()

      if (postError) return { error: 'Failed to create post' }

      if (data?.poll) {
        const options = Array.isArray(data.poll?.options) ? data.poll.options : data.poll
        const { error: pollError } = await supabase.from('polls').insert({ post_id: postRow.id, options })
        if (pollError) return { error: 'Failed to create poll' }
      }

      await recordAction('post')
      return { data: postRow }
    },
    [checkLimit, isBlacklisted, recordAction]
  )

  const updatePost = useCallback(async (id, data) => {
    const updates = {}

    if (data?.title !== undefined) {
      updates.title = data.title != null && String(data.title).trim() !== '' ? stripHtmlTags(data.title).trim() : null
    }

    if (data?.content !== undefined) {
      const content = stripHtmlTags(data.content).trim()
      if (content.length > 200) return { error: 'Content too long' }
      updates.content = content
    }

    if (data?.code !== undefined) updates.code = data.code ?? null
    if (data?.codeLanguage !== undefined) updates.code_language = data.codeLanguage ?? null
    if (data?.gifUrl !== undefined) updates.gif_url = data.gifUrl ?? null

    updates.is_edited = true
    updates.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabase.from('posts').update(updates).eq('id', id).select('*').single()
    if (error) return { error: 'Failed to update post' }
    return { data: updated }
  }, [])

  const deletePost = useCallback(async (id) => {
    const sessionId = getOrCreateSessionId()
    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('session_id', sessionId)
    
    if (error) {
      console.error('Delete post error:', error)
      return { error: 'Failed to delete post' }
    }
    return { data: true }
  }, [])

  const votePost = useCallback(
    async (postId, voteType) => {
      const sessionId = getOrCreateSessionId()
      if (voteType !== 'up' && voteType !== 'down') return { error: 'Invalid vote type' }

      const { data: existing } = await supabase
        .from('post_votes')
        .select('id, vote_type')
        .eq('post_id', postId)
        .eq('session_id', sessionId)
        .maybeSingle()

      if (existing?.vote_type === voteType) {
        const { error } = await supabase.from('post_votes').delete().eq('id', existing.id)
        if (error) return { error: 'Failed to remove vote' }
        setUserVotes((prev) => {
          const next = { ...prev }
          delete next[postId]
          return next
        })
        return { data: null }
      }

      const { error } = await supabase
        .from('post_votes')
        .upsert({ post_id: postId, session_id: sessionId, vote_type: voteType }, { onConflict: 'post_id,session_id' })

      if (error) return { error: 'Failed to vote' }

      setUserVotes((prev) => ({ ...prev, [postId]: voteType }))
      return { data: voteType }
    },
    []
  )

  const flagPost = useCallback(async (postId) => {
    const sessionId = getOrCreateSessionId()

    // If already flagged, unflag it
    if (userFlags[postId]) {
      const { error } = await supabase
        .from('post_flags')
        .delete()
        .eq('post_id', postId)
        .eq('session_id', sessionId)

      if (error) return { error: 'Failed to unflag post' }

      setUserFlags((prev) => {
        const next = { ...prev }
        delete next[postId]
        return next
      })
      return { data: false }
    }

    // Otherwise, flag it
    const { error } = await supabase.from('post_flags').insert({ post_id: postId, session_id: sessionId })

    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
      return { error: 'Failed to flag post' }
    }

    setUserFlags((prev) => ({ ...prev, [postId]: true }))
    return { data: true }
  }, [userFlags])

  const getUserVote = useCallback((postId) => userVotes[postId] ?? null, [userVotes])

  const hasUserFlagged = useCallback((postId) => !!userFlags[postId], [userFlags])

  return useMemo(
    () => ({
      posts,
      isLoading,
      createPost,
      updatePost,
      deletePost,
      votePost,
      flagPost,
      getUserVote,
      hasUserFlagged,
    }),
    [createPost, deletePost, flagPost, getUserVote, hasUserFlagged, isLoading, posts, updatePost, votePost]
  )
}
