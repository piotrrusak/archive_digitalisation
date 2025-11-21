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
  confirmPassword?: string
  firstName?: string
  lastName?: string
}

interface RegisterResponse {
  message: string
  user: {
    id: number
    email: string
  }
  token: string
}

interface RegisterErrorResponse {
  message?: string
}

const RegisterForm: React.FC = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addFlash } = useFlash()

  const validate = (): Errors => {
    const newErrors: Errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!emailRegex.test(email)) newErrors.email = 'Invalid email format'
    if (!password.trim()) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password'
    else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match'

    return newErrors
  }

  const attemptToRegister = async (): Promise<RegisterResponse> => {
    const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      }),
    })
    const data = (await response.json()) as RegisterResponse | RegisterErrorResponse
    if (!response.ok) throw new Error(data.message ?? 'Registration failed')
    return data as RegisterResponse
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const data = await attemptToRegister()
      login(data.token, data.user.id, data.user.email)
      addFlash('success', data.message)
      void navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      addFlash('error', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormInvalid =
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim() ||
    !password.trim() ||
    !confirmPassword.trim() ||
    Object.keys(validate()).length > 0

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 w-full">
      <TextField
        label="First Name"
        placeholder="Enter your first name"
        value={firstName}
        onChange={setFirstName}
        error={errors.firstName}
        disabled={isSubmitting}
      />
      <TextField
        label="Last Name"
        placeholder="Enter your last name"
        value={lastName}
        onChange={setLastName}
        error={errors.lastName}
        disabled={isSubmitting}
      />
      <TextField
        label="Email Address"
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
      <TextField
        label="Confirm Password"
        placeholder="Confirm your password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={errors.confirmPassword}
        disabled={isSubmitting}
      />
      <Button
        label={isSubmitting ? 'Registering...' : 'Register'}
        variant="primary"
        buttonClass="text-center"
        disabled={isSubmitting || isFormInvalid}
      />
    </form>
  )
}

export default RegisterForm
