import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFlash } from '../contexts/FlashContext'

export function GoogleCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { addFlash } = useFlash()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    const query = new URLSearchParams(location.search)
    const code = query.get('code')

    if (!code) {
      addFlash('error', 'No code returned from Google')
      void navigate('/login')
      return
    }

    const exchangeCodeForJWT = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/google/callback`,
            user_found_redirect: `/`,
            user_created_redirect: `/register/auth/callback`,
          }),
        })

        if (!response.ok) throw new Error('Failed to exchange code')

        const data = (await response.json()) as {
          token: string
          user: { id: number; email: string }
          redirect_path: string
        }
        login(data.token, data.user.id, data.user.email)
        void navigate(data.redirect_path)
      } catch (err) {
        console.error(err)
        addFlash('error', 'Google login failed')
        void navigate('/login')
      }
    }

    void exchangeCodeForJWT()
  }, [location, login, navigate, addFlash])

  return <div>Logging in with Google...</div>
}
