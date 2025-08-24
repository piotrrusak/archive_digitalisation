import { X } from 'lucide-react'
import type { ReactNode, FC } from 'react'

interface ModalProps {
  title?: string
  onClose: () => void
  children: ReactNode
  showCloseButton?: boolean
  footer?: ReactNode
  onConfirm?: () => void
  confirmLabel?: string
  cancelLabel?: string
}

const Modal: FC<ModalProps> = ({
  title = 'Modal',
  onClose,
  children,
  showCloseButton = true,
  footer,
  onConfirm,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showCloseButton && (
            <button onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="mb-4">{children}</div>

        {/* Footer */}
        <div className="flex justify-end space-x-3">
          {footer ? (
            footer
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                {cancelLabel}
              </button>
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {confirmLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
