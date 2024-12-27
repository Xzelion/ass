'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Message, ChatUser } from '@/lib/types'
import { SystemMessageService } from '@/lib/chat/system-message-service'
import { MessageService } from '@/lib/chat/message-service'
import { PresenceService } from '@/lib/chat/presence-service'

interface ChatContextType {
  messages: Message[]
  currentUser: ChatUser | null
  onlineUsers: ChatUser[]
  createGuestUser: (nickname: string) => Promise<ChatUser>
  sendMessage: (content: string) => Promise<void>
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  currentUser: null,
  onlineUsers: [],
  createGuestUser: async () => { throw new Error('Not implemented') },
  sendMessage: async () => { throw new Error('Not implemented') }
})

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const systemMessages = new SystemMessageService()
  const presenceService = PresenceService.getInstance()

  useEffect(() => {
    // Load initial messages
    MessageService.fetchMessages().then(setMessages)

    // Subscribe to new messages
    const channel = MessageService.subscribeToMessages((message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    // Initialize presence
    presenceService.initialize(currentUser, setOnlineUsers)

    return () => {
      presenceService.cleanup()
    }
  }, [currentUser])

  const createGuestUser = async (nickname: string): Promise<ChatUser> => {
    const { data, error } = await supabase
      .from('chat_users')
      .insert([{ nickname, is_guest: true }])
      .select()
      .single()

    if (error) throw error

    setCurrentUser(data)
    localStorage.setItem('chatUser', JSON.stringify(data))
    await systemMessages.createJoinMessage(nickname)

    return data
  }

  const sendMessage = async (content: string) => {
    if (!currentUser) throw new Error('No user found')
    await MessageService.sendMessage(content, currentUser.id)
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

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}