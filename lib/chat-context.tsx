'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export const ChatContext = createContext({})

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    // Load initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    // Set up real-time subscriptions
    const channel = supabase.channel('chat-room', {
      config: {
        presence: {
          key: currentUser?.id,
        },
      },
    })

    // Handle presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presenceUsers = Object.values(state).flat()
        setOnlineUsers(presenceUsers)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Add system message for new user
        const newUser = newPresences[0]
        addSystemMessage(`${newUser.nickname} joined the chat`)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const leftUser = leftPresences[0]
        addSystemMessage(`${leftUser.nickname} left the chat`)
      })

    // Handle new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((current) => [...current, payload.new])
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser) {
          await channel.track({
            id: currentUser.id,
            nickname: currentUser.nickname,
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [currentUser])

  const addSystemMessage = async (content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          content,
          type: 'system',
          user_id: null,
        },
      ])
      .select()
      .single()

    if (error) console.error('Error adding system message:', error)
  }

  const createGuestUser = async (nickname: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .insert([{ nickname, is_guest: true }])
        .select()
        .single()

      if (error) throw error

      setCurrentUser(data)
      localStorage.setItem('chatUser', JSON.stringify(data))

      // Add system message for new user
      await addSystemMessage(`${nickname} joined the chat`)

      return data
    } catch (error) {
      console.error('Error creating guest user:', error)
      throw error
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentUser) return

    try {
      const { error } = await supabase.from('messages').insert([
        {
          content,
          user_id: currentUser.id,
          type: 'text',
        },
      ])

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentUser,
        onlineUsers,
        createGuestUser,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)