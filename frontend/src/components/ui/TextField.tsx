import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

interface TextFieldProps {
  label?: string
  value?: string
  placeholder?: string
  labelClass?: string
  inputClass?: string
  onChange?: (value: string) => void
  type?: 'text' | 'password'
  disabled?: boolean
  error?: string
}

export function TextField({
  label,
  value,
  placeholder,
  labelClass,
  inputClass,
  onChange,
  type = 'text',
  disabled = false,
  error,
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword && !showPassword ? 'password' : 'text'

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label className={clsx('text-normal font-medium text-black-base', labelClass)}>
          {label}
        </label>
      )}

      <div
        className={clsx(
          'flex items-center rounded-[5px] border px-3 py-2 focus-within:ring-2 bg-gray-accent border-gray-outline h-13',
          disabled && 'opacity-50 cursor-not-allowed',
          error ? 'border-red-500 ring-red-100' : 'border-gray-300 focus-within:ring-blue-200',
          inputClass,
        )}
      >
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-black-base"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => {
              setShowPassword((v) => !v)
            }}
            className="ml-2 text-gray-outline hover:text-gray-text"
          >
            {showPassword ? <Eye size={24} /> : <EyeOff size={24} />}
          </button>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
