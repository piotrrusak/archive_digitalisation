import React, { useState, useCallback } from 'react'
import { FlashContext } from '../contexts/FlashContext'
import { FlashContainer } from '../components/flash/FlashContainer'

import type { FlashMessage, FlashType } from '../contexts/FlashContext'
import type { ReactNode } from 'react'

interface FlashProviderProps {
  children: ReactNode
}

export const FlashProvider: React.FC<FlashProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<FlashMessage[]>([])

  const addFlash = useCallback((type: FlashType, text: string, timeout = 3000) => {
    const id = `flash-message-${Date.now().toString()}`
    const newMessage: FlashMessage = { id, type, text }
    setMessages((prev) => [...prev, newMessage])

    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id))
    }, timeout)
  }, [])

  const removeFlash = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }, [])

  return (
    <FlashContext.Provider value={{ addFlash }}>
      {children}
      <FlashContainer messages={messages} onDismiss={removeFlash} />
    </FlashContext.Provider>
  )
}
