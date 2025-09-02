import { useState } from 'react'
import Dropzone from '../components/upload/Dropzone'
import { uploadStoredFile } from '../lib/modelClient'
import type { StoredFileResponse } from '../lib/modelClient'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'

export default function Scan() {
  const { token, userId } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StoredFileResponse | null>(null)

  console.log("User ID:", userId)

  const handleFileSelected = (f: File) => {
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleSend = async (): Promise<void> => {
    if (!file) return
    if (!token) {
      setError('No token - log in again')
      return
    }
    if (userId == null) {
      setError('Cannot determine ownerId from token. Make sure JWT contains id/userId/uid or numeric sub.')
      return
    }

    const ownerId = typeof userId === 'string' ? Number(userId) : userId
    if (!Number.isFinite(ownerId)) {
      setError('Invalid ownerId (not a number)')
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
          e?.data && typeof e.data === 'object'
            ? JSON.stringify(e.data as Record<string, unknown>)
            : null
        const msg = [
          e.status ? `HTTP ${e.status}` : null,
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
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r bg-white">
        <Sidebar />
      </aside>

      <main className="flex-1 p-4">
        <h1 className="text-xl font-bold mb-4">Send Scan</h1>

        <div className="mb-3 text-sm text-gray-600">
          <div>
            <strong>Token:</strong> {token ? '✓ obecny' : '✗ brak'}
          </div>
          <div>
            <strong>userId:</strong>{' '}
            {userId != null ? userId : <span className="text-red-600">nieustalony</span>}
          </div>
        </div>

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
        {result && (
          <pre className="mt-4 p-2 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </main>
    </div>
  )
}
