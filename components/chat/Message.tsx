'use client'

import { useChat } from '@/context/ChatContext'
import { Message as MessageType } from '@/lib/types'

interface MessageProps {
  message: MessageType
}

export default function Message({ message }: MessageProps) {
  const { currentUser } = useChat()
  const isOwnMessage = message.user_id === currentUser?.id

  if (message.type === 'system') {
    return (
      <div className="text-center text-gray-500 my-2">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`px-4 py-2 rounded-lg ${
        isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
      }`}>
        {message.content}
      </div>
    </div>
  )
}