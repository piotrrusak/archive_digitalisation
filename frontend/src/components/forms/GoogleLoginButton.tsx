import { useState } from 'react'
import googleLogo from '/google-logo.svg'

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false)

  const handleCustomGoogleLogin = () => {
    setLoading(true)
    console.log(`${window.location.origin}/auth/google/callback`)

    const params = {
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    }

    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'
    const url = `${oauth2Endpoint}?${new URLSearchParams(params).toString()}`

    window.location.href = url
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleCustomGoogleLogin}
      className="border rounded-md border-gray-outline bg-gray-accent h-14 w-full px-6 py-3 flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <img src={googleLogo} alt="Google" className="w-8 h-8" />
      <span className="text-black-base font-medium">
        {loading ? 'Redirecting...' : 'Sign in with Google'}
      </span>
    </button>
  )
}
