import { useState } from 'react'
import Dropzone from '../components/upload/Dropzone'
import { uploadStoredFile } from '../lib/modelClient'
import type { StoredFileResponse } from '../lib/modelClient'

export default function Scan() {
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
    setIsSending(true)
    setError(null)
    try {
      const res = await uploadStoredFile(file)
      setResult(res)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : typeof e === 'string' ? e : null
      setError(message ?? 'Upload failed')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Send Scan</h1>
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
      {error && <p className="mt-2 text-red-600">Error: {error}</p>}
      {result && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
