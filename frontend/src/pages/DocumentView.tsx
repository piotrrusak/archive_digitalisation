import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API_BASE: string =
  (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? '/api' : 'http://localhost:8080')

export default function DocumentView() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { token } = useAuth()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    useEffect(() => {
        let objectUrl: string | null = null

        const fetchDocument = async () => {
            try {
                const res = await fetch(`${API_BASE}/stored_files/2/export`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/pdf',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                })

                if (!res.ok) throw new Error('Failed to load document.')

                const blob = await res.blob()
                const pdfBlob =
                    blob.type === 'application/pdf'
                        ? blob
                        : new Blob([blob], { type: 'application/pdf' })

                objectUrl = URL.createObjectURL(pdfBlob)
                setPdfUrl(objectUrl)
            } catch (err) {
                console.error('Document fetch failed:', err)
                setError('Failed to load document.')
            } finally {
                setLoading(false)
            }
        }

        void fetchDocument()

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [token])

    return (
        <MainLayout>
            <div className="p-4 flex flex-col gap-4 h-full min-h-screen">
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
                    <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {!loading && !error && pdfUrl && (
                    <iframe
                        src={pdfUrl}
                        title="Document"
                        className="w-full flex-1 min-h-[80vh] border rounded-lg shadow-md"
                    />
                )}
            </div>
        </MainLayout>
    )
}
