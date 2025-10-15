import React from 'react'
import clsx from 'clsx'
import { X, ArrowLeft } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  id: string
  show: boolean
  onCancel?: () => void
  onConfirm?: () => void
  onBack?: () => void
  hideExit?: boolean
  rounded?: boolean
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger'
  cancelVariant?: 'secondary' | 'danger'
  confirmDisabled?: boolean
  cancelDisabled?: boolean
  containerClass?: string
  contentClass?: string
  buttonClass?: string
  innerContentClass?: string
  boxClass?: string
  backNavigationClass?: string
}

export function Modal({
  id,
  show,
  onCancel,
  onConfirm,
  onBack,
  hideExit = false,
  rounded = true,
  title,
  subtitle,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  confirmDisabled = false,
  cancelDisabled = false,
  containerClass = '',
  contentClass = '',
  buttonClass = '',
  innerContentClass = '',
  boxClass = '',
  backNavigationClass = '',
}: ModalProps) {
  if (!show) return null

  return (
    <div
      id={id}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center overscroll-contain',
        boxClass,
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx('fixed inset-0 bg-black/60 transition-opacity', rounded && 'rounded-lg')}
        onClick={onCancel ?? onBack}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative bg-white-base shadow-lg w-full max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col',
          rounded && 'rounded-lg',
          containerClass,
        )}
      >
        <div className={clsx('flex w-full justify-center items-center p-6', innerContentClass)}>
          {onBack && (
            <button
              onClick={onBack}
              className={clsx('absolute left-4 text-gray-text', backNavigationClass)}
            >
              <ArrowLeft />
            </button>
          )}
          {title && (
            <h2 id={`${id}-title`} className="text-base font-semibold text-black-base text-center">
              {title}
            </h2>
          )}
          {!hideExit && onCancel && (
            <button
              onClick={onCancel}
              className="absolute right-4 text-gray-outline hover:text-gray-text"
            >
              <X />
            </button>
          )}
        </div>

        {subtitle && <p className="px-6 pt-2 text-xs text-gray-text text-center">{subtitle}</p>}

        <div
          id={`${id}-content`}
          className={clsx('p-6 overflow-y-auto flex-1 text-sm text-black-base', contentClass)}
        >
          {children}
        </div>

        {(onConfirm ?? onCancel) && (
          <div className={clsx('flex items-center justify-center gap-4 p-4', buttonClass)}>
            {onConfirm && (
              <Button
                label={confirmLabel}
                onClick={onConfirm}
                variant={confirmVariant}
                disabled={confirmDisabled}
              />
            )}
            {onCancel && (
              <Button
                label={cancelLabel}
                onClick={onCancel}
                variant={cancelVariant}
                disabled={cancelDisabled}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
