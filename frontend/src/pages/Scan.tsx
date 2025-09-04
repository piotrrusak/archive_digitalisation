import { useState } from 'react'
import Dropzone from '../components/upload/Dropzone'
import { uploadStoredFile } from '../lib/modelClient'
import type { StoredFileResponse } from '../lib/modelClient'
import { useAuth } from '../hooks/useAuth'
import MainLayout from '../components/MainLayout'

export default function Scan() {
  const { token, userId } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StoredFileResponse | null>(null)

  const handleFileSelected = (f: File) => {
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleSend = async (): Promise<void> => {
    if (!file) return
    if (!token) {
      setError('Invalid token - try logging in again')
      return
    }
    const ownerId = typeof userId === 'string' ? Number(userId) : userId

    if (ownerId == null || !Number.isFinite(ownerId)) {
      setError('Invalid ownerId - try logging in again')
      return
    }

    setIsSending(true)
    setError(null)
    try {
      const response = await uploadStoredFile(
        file,
        {
          ownerId,
          formatId: 1,
          generation: 1,
          primaryFileId: null,
        },
        token,
      )
      setResult(response)
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        const e = err as { message?: string; status?: number; data?: unknown }

        const backendDetail =
          e.data && typeof e.data === 'object'
            ? JSON.stringify(e.data as Record<string, unknown>)
            : null

        const msg = [
          e.status != null ? `HTTP ${String(e.status)}` : null,
          e.message ?? null,
          backendDetail ? `Details: ${backendDetail}` : null,
        ]
          .filter(Boolean)
          .join(' — ')

        setError(msg || 'Upload failed')
      } else {
        setError('Upload failed')
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Send Scan</h1>

        <Dropzone onFileSelected={handleFileSelected} />

        {file && (
          <div className="mt-4">
            <p>
              Selected file: <strong>{file.name}</strong>
            </p>
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={isSending}
              onClick={() => {
                void handleSend()
              }}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}

        {error && <p className="mt-2 text-red-600 break-words">Error: {error}</p>}

        <p className="mt-2 text-white-600">{result ? 'Upload successful!' : 'No result yet.'}</p>
      </div>
    </MainLayout>
  )
}
