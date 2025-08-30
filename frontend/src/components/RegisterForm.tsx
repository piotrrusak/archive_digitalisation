import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Errors {
  email?: string
  password?: string
  confirmPassword?: string
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
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [errors, setErrors] = useState<Errors>({})
  const navigate = useNavigate()
  const { login } = useAuth()

  const validate = (): Errors => {
    const newErrors: Errors = {}
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  const attemptToRegister = async (email: string, password: string): Promise<RegisterResponse> => {
    const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = (await response.json()) as RegisterResponse | RegisterErrorResponse

    if (!response.ok) {
      throw new Error(data.message ?? 'Register request failed')
    }

    console.log('Server response:', data)
    return data as RegisterResponse
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
    } else {
      setErrors({})

      void attemptToRegister(email, password)
        .then((data) => {
          login(data.token)
          alert(data.message)
          void navigate('/')
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Register failed'
          setErrors({ email: message })
        })
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            style={{ width: '100%', padding: '.5rem' }}
          />
          {errors.email && (
            <span style={{ color: 'red', fontSize: '.875rem' }}>{errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            style={{ width: '100%', padding: '.5rem' }}
          />
          {errors.password && (
            <span style={{ color: 'red', fontSize: '.875rem' }}>{errors.password}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
            }}
            style={{ width: '100%', padding: '.5rem' }}
          />
          {errors.confirmPassword && (
            <span style={{ color: 'red', fontSize: '.875rem' }}>{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" style={{ padding: '.5rem 1rem' }}>
          Register
        </button>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '.9rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
          Login
        </Link>
      </p>
    </div>
  )
}

export default RegisterForm
