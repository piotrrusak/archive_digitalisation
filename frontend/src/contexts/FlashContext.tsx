import { createContext, useContext } from 'react'

export type FlashType = 'success' | 'error' | 'info' | 'warning'

export interface FlashMessage {
  id: string
  type: FlashType
  text: string
}

export interface FlashContextType {
  addFlash: (type: FlashType, text: string, timeout?: number) => void
}

export const FlashContext = createContext<FlashContextType | undefined>(undefined)

export const useFlash = (): FlashContextType => {
  const context = useContext(FlashContext)
  if (!context) {
    throw new Error('useFlash must be used within a FlashProvider')
  }
  return context
}
