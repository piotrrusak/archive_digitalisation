import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { TextField } from '../ui/TextField'
import { Button } from '../ui/Button'
import { useFlash } from '../../contexts/FlashContext'

interface Errors {
  email?: string
  password?: string
}

interface LoginResponse {
  message: string
  user: {
    id: number
    email: string
  }
  token: string
}

interface LoginErrorResponse {
  message?: string
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addFlash } = useFlash()

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Invalid email format'
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return undefined
  }

  const validateForm = (): Errors => {
    const newErrors: Errors = {}
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError
    return newErrors
  }

  const attemptToLogIn = async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = (await response.json()) as LoginResponse | LoginErrorResponse
    if (!response.ok) throw new Error(data.message ?? 'Login request failed')

    return data as LoginResponse
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const data = await attemptToLogIn(email, password)
      login(data.token, data.user.id, data.user.email)
      addFlash('success', data.message)
      void navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      addFlash('error', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormInvalid =
    !email.trim() || !password.trim() || !!validateEmail(email) || !!validatePassword(password)

  return (
    <div className="w-full flex-col gap-8">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <TextField
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          disabled={isSubmitting}
        />

        <TextField
          label="Password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          disabled={isSubmitting}
        />

        <Button
          label={isSubmitting ? 'Signing In...' : 'Sign In'}
          variant="primary"
          buttonClass="text-center"
          disabled={isSubmitting || isFormInvalid}
        />
      </form>
    </div>
  )
}

export default LoginForm
