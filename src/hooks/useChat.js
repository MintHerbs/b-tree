// Chat state management hook using Supabase real-time subscriptions
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function useChat(isChatOpen) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const isChatOpenRef = useRef(false)
  const lastReadAtRef = useRef(new Date().toISOString())
  // Unique channel name per hook instance — prevents collision when
  // useChat is called in multiple components (ChatPanel + Sidebar)
  const channelName = useRef(`messages-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  function markAsRead() {
    lastReadAtRef.current = new Date().toISOString()
    setUnreadCount(0)
  }

  useEffect(() => {
    isChatOpenRef.current = isChatOpen
    if (isChatOpen) markAsRead()
  }, [isChatOpen])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(50)

        if (error) {
          console.error('Error fetching messages:', error)
          return
        }

        setMessages(data || [])
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    fetchMessages()

    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])

          if (!isChatOpenRef.current) {
            if (payload.new.created_at > lastReadAtRef.current) {
              setUnreadCount(prev => Math.min(prev + 1, 10))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const sendMessage = useCallback(async (content) => {
    const sessionId = localStorage.getItem('session_id')

    if (!sessionId) {
      console.error('No session_id found in localStorage')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ session_id: sessionId, content }])

      if (error) {
        console.error('Error sending message:', error)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    messages,
    sendMessage,
    isLoading,
    unreadCount,
    markAsRead,
  }
}