import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FlashMessage } from '../../contexts/FlashContext'

interface FlashContainerProps {
  messages: FlashMessage[]
  onDismiss: (id: string) => void
}

export const FlashContainer: React.FC<FlashContainerProps> = ({ messages, onDismiss }) => {
  const colorMap: Record<FlashMessage['type'], string> = {
    success: 'bg-green-base border-green-dark',
    error: 'bg-red-base border-red-dark',
    info: 'bg-blue-accent border-blue-base',
    warning: 'bg-yellow-base border-yellow-dark',
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-3 w-[90%] sm:w-auto max-w-sm">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className={`relative w-full flex flex-col rounded-t-[10px] shadow-lg text-black-base border-2 border-b-0 overflow-hidden ${colorMap[msg.type]}`}
          >
            <div className="flex justify-between items-center p-3">
              <span>{msg.text}</span>
              <button
                type="button"
                onClick={() => {
                  onDismiss(msg.id)
                }}
                className="ml-3 font-bold"
                aria-label="Dismiss flash message"
              >
                ×
              </button>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-black-base/10">
              <div className="h-full bg-black-base/40 animate-flash-timer" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
