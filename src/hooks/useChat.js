// Chat state management hook using Supabase real-time subscriptions
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch initial messages on mount
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

    // Subscribe to real-time inserts
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Send a new message
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
        .insert([
          {
            session_id: sessionId,
            content: content,
          },
        ])

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
  }
}
