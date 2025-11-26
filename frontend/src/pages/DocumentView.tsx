import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API_BASE: string =
  (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined) ??
  'http://localhost:8080/api/v1'

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let objectUrl: string | null = null

    const fetchDocument = async () => {
      if (!id) return
      try {
        const res = await fetch(`${API_BASE}/stored_files/${id}/export`, {
          method: 'GET',
          headers: {
            Accept: 'application/pdf',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!res.ok) throw new Error('Failed to load document.')

        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        if (isMounted) setPdfUrl(objectUrl)
      } catch (err) {
        console.error('Document fetch failed:', err)
        if (isMounted) setError('Failed to load document.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchDocument()

    return () => {
      isMounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, token])

  return (
    <MainLayout>
      <div className="p-4 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void navigate('/documents')}
            className="flex items-center gap-2 text-gray-700 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading document…</p>}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg">{error}</div>
        )}
        {!loading && !error && pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Document"
            className="w-full h-full flex-1 border rounded-lg shadow-md"
          />
        )}
      </div>
    </MainLayout>
  )
}
