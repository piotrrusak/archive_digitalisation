interface ConfigEnv {
  VITE_GOOGLE_CLIENT_ID?: string
  VITE_AUTH_API_BASE_URL?: string
  VITE_BACKEND_API_BASE_URL?: string
}

declare global {
  interface Window {
    _env_?: ConfigEnv
  }
}

const getEnv = (key: keyof ConfigEnv): string => {
  const runtimeValue = window._env_?.[key]
  if (runtimeValue) {
    return runtimeValue
  }

  return (import.meta.env[key] as string) || ''
}

export const config = {
  googleClientId: getEnv('VITE_GOOGLE_CLIENT_ID'),
  authApiUrl: getEnv('VITE_AUTH_API_BASE_URL'),
  backendApiUrl: getEnv('VITE_BACKEND_API_BASE_URL'),
}
