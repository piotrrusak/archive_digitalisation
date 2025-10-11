import clsx from 'clsx'

interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  const base =
    'rounded-2xl px-4 py-2 font-semibold transition-colors duration-200 focus:outline-none'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, variants[variant], disabled && 'opacity-50 cursor-not-allowed')}
    >
      {label}
    </button>
  )
}
