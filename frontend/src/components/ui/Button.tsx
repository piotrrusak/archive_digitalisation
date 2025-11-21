import clsx from 'clsx'
import { CirclePlus } from 'lucide-react'

interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'normal' | 'add'
  disabled?: boolean
  buttonClass?: string
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  type = 'normal',
  disabled = false,
  buttonClass = '',
}: ButtonProps) {
  const base =
    'rounded-[4px] px-4 py-2 font-semibold transition-all duration-200 focus:outline-none shadow-sm hover:shadow-md active:shadow-inner'

  const variants = {
    primary: 'bg-blue-action text-white-base',
    secondary: 'text-black-base hover:bg-gray-accent',
    danger: 'border border-red-dark text-black-base hover:bg-red-base',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        base,
        variants[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:opacity-80',
        buttonClass,
      )}
    >
      <div className="flex gap-2.5 align-middle items-center justify-center">
        {type === 'add' && <CirclePlus size={16} />}
        <span className="uppercase">{label}</span>
      </div>
    </button>
  )
}
