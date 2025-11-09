type Dict = Record<string, unknown>

export interface SendFilePayload {
  ownerId: number
  formatId: number
  generation: number
  primaryFileId: number | null
  content: string
}

export type StoredFileResponse = Dict

export function getApiBaseUrl(): string {
  const base = (import.meta as unknown as { env?: { VITE_BACKEND_API_BASE_URL?: string } }).env
    ?.VITE_BACKEND_API_BASE_URL

  if (!base) {
    throw new Error(
      'VITE_BACKEND_API_BASE_URL in env. Set e.g. VITE_BACKEND_API_BASE_URL=http://localhost:8080/api/v1',
    )
  }
  return base.replace(/\/+$/, '')
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

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
  { timeoutMs = 30_000, token }: { timeoutMs?: number; token?: string } = {},
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    window.clearTimeout(timeoutId)
  }
}

export async function uploadStoredFile(
  file: File,
  options: {
    ownerId: number
    formatId: number
    generation: number
    primaryFileId: number | null
    endpointPath?: string
  },
  token?: string,
): Promise<StoredFileResponse> {
  if (!Number.isFinite(options.ownerId)) {
    throw new Error('uploadStoredFile: options.ownerId must be a finite number')
  }

  const [apiBase, content] = await Promise.all([
    Promise.resolve(getApiBaseUrl()),
    fileToBase64(file),
  ])

  const payload: SendFilePayload = {
    ownerId: options.ownerId,
    formatId: options.formatId,
    generation: options.generation,
    primaryFileId: options.primaryFileId,
    content,
  }

  const url = `${apiBase}/${options.endpointPath ?? 'stored_files'}`
  return postJson<StoredFileResponse>(url, payload, { timeoutMs: 30_000, token })
}

export async function uploadStoredFiles(
  files: File[],
  options: {
    ownerId: number
    formatId: number
    generation: number
    primaryFileId: number | null
    endpointPath?: string
  },
  token?: string,
): Promise<StoredFileResponse[]> {
  if (files.length === 0) {
    return []
  }

  const results = await Promise.all(files.map((file) => uploadStoredFile(file, options, token)))

  return results
}
