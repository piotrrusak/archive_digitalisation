type Dict = Record<string, unknown>

export interface StoredFileRequest {
  filename: string
  content_type: string
  byte_size: number
  file_base64: string
  metadata?: Record<string, string | number | boolean | null>
}

export type StoredFileResponse = Dict

let AUTH_TOKEN: string | null = null

export function setAuthToken(token: string | null) {
  AUTH_TOKEN = token
}

export function getApiBaseUrl(): string {
  const base = (import.meta as unknown as { env?: { VITE_REST_API_BASE_URL?: string } }).env
    ?.VITE_REST_API_BASE_URL

  if (!base) {
    throw new Error(
      'No VITE_REST_API_BASE_URL in env. Set e.g. VITE_REST_API_BASE_URL=http://localhost:8080/api/v1',
    )
  }
  return base.replace(/\/+$/, '')
}

function inferContentType(file: File): string {
  if (file.type) return file.type

  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'tif':
    case 'tiff':
      return 'image/tiff'
    case 'pdf':
      return 'application/pdf'
    case 'bmp':
      return 'image/bmp'
    case 'heic':
      return 'image/heic'
    default:
      return 'application/octet-stream'
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const result = reader.result as string
      const commaIndex = result.indexOf(',')
      if (commaIndex === -1) {
        reject(new Error('Invalid base64 data format'))
        return
      }
      resolve(result.slice(commaIndex + 1))
    }
    reader.readAsDataURL(file)
  })
}

async function postJson<T>(
  url: string,
  body: unknown,
  { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (AUTH_TOKEN) headers.set('Authorization', `Bearer ${AUTH_TOKEN}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const rawText = await response.text().catch(() => '')
    let payload: unknown = null
    try {
      payload = rawText ? JSON.parse(rawText) : null
    } catch {
      payload = rawText
    }

    if (!response.ok) {
      let message: string | null = null
      if (payload && typeof payload === 'object') {
        const pl = payload as Record<string, unknown>
        if (typeof pl.message === 'string') message = pl.message
        else if (typeof pl.error === 'string') message = pl.error
        else if (typeof pl.detail === 'string') message = pl.detail
      }
      const finalMessage = message ?? `HTTP Error ${String(response.status)}`
      const err = new Error(finalMessage) as Error & { status?: number; data?: unknown }
      err.status = response.status
      err.data = payload
      throw err
    }

    return payload as T
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function uploadStoredFile(
  file: File,
  metadata?: Record<string, string | number | boolean | null>,
): Promise<StoredFileResponse> {
  const [apiBase, file_base64] = await Promise.all([
    Promise.resolve(getApiBaseUrl()),
    fileToBase64(file),
  ])

  const payload: StoredFileRequest = {
    filename: file.name,
    content_type: inferContentType(file),
    byte_size: file.size,
    file_base64,
    ...(metadata ? { metadata } : {}),
  }

  const url = `${apiBase}/stored_files`
  return postJson<StoredFileResponse>(url, payload, { timeoutMs: 30_000 })
}
