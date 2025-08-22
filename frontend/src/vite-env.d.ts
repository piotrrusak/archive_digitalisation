/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_BASE_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  // add more env vars here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
