import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import MainLayout from '../components/MainLayout'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API_BASE: string =
  (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined) ??
  'http://localhost:8080/api/v1'

type StoredFileDTO = {
  id: number
  ownerId: number
  formatId: number
  resourcePath: string
  generation: number
  primaryFileId: number | null
  content?: string | null
  processingModelId?: number | null
}

function SegmentedToggle({
  value,
  onChange,
  leftLabel,
  rightLabel,
  disabledLeft = false,
}: {
  value: boolean
  onChange: (v: boolean) => void
  leftLabel: string
  rightLabel: string
  disabledLeft?: boolean
}) {
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabledLeft}
        className={clsx(
          'px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed',
          value ? 'bg-blue-base text-white-base' : 'text-gray-700 hover:bg-gray-50',
        )}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={clsx(
          'px-4 py-2 rounded-lg text-sm font-semibold transition',
          !value ? 'bg-blue-base text-white-base' : 'text-gray-700 hover:bg-gray-50',
        )}
      >
        {rightLabel}
      </button>
    </div>
  )
}

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const [fileDto, setFileDto] = useState<StoredFileDTO | null>(null)
  const [originalDto, setOriginalDto] = useState<StoredFileDTO | null>(null)

  const [showPreview, setShowPreview] = useState(true)
  const originalId = useMemo(() => fileDto?.primaryFileId ?? null, [fileDto])
  const canShowPreview = Boolean(originalId)

  useEffect(() => {
    if (!id) return

    const loadCurrent = async () => {
      try {
        const res = await fetch(`${API_BASE}/stored_files/${id}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) throw new Error('Failed to load StoredFileDTO.')

        const dto = (await res.json()) as StoredFileDTO
        setFileDto(dto)

        if (!dto.primaryFileId) setShowPreview(false)
      } catch (e) {
        console.error(e)
        setFileDto(null)
        setShowPreview(false)
      }
    }

    void loadCurrent()
  }, [id, token])

  useEffect(() => {
    if (!showPreview) return
    if (!originalId) return

    const loadOriginal = async () => {
      try {
        const res = await fetch(`${API_BASE}/stored_files/${originalId}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) throw new Error('Failed to load original DTO.')

        const dto = (await res.json()) as StoredFileDTO
        setOriginalDto(dto)
      } catch (e) {
        console.error(e)
        setOriginalDto(null)
      }
    }

    void loadOriginal()
  }, [showPreview, originalId, token])

  useEffect(() => {
    if (!id) return

    let isMounted = true
    let objectUrl: string | null = null

    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError(null)

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

  const OriginalPreviewPanel = () => {
    if (!canShowPreview) {
      return <div className="p-4 text-sm text-gray-600">No original image available.</div>
    }

    if (!originalDto) {
      return <div className="p-4 text-sm text-gray-600">Loading preview…</div>
    }

    if (!originalDto.content) {
      return (
        <div className="p-4 text-sm text-gray-600">
          Preview data is missing (original file content not included in DTO).
        </div>
      )
    }

    const src = `data:image/png;base64,${originalDto.content}`

    return (
      <div className="w-full h-full overflow-auto p-2">
        <img src={src} alt="Original PNG" className="max-w-full h-auto" />
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => void navigate('/documents')}
            className="flex items-center gap-2 text-gray-700 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>

          <SegmentedToggle
            value={showPreview}
            onChange={(v) => {
              if (!canShowPreview && v) return
              setShowPreview(v)
            }}
            leftLabel="Show preview"
            rightLabel="Hide preview"
            disabledLeft={!canShowPreview}
          />
        </div>

        {loading && <p className="text-gray-500">Loading document…</p>}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg">{error}</div>
        )}

        {!loading && !error && pdfUrl && (
          <div className="w-full flex-1 grid grid-cols-12 gap-4 min-h-[85vh]">
            {/* Preview panel */}
            <div
              className={clsx(
                'border border-gray-200 rounded-lg overflow-hidden bg-white min-w-0',
                showPreview ? 'col-span-12 lg:col-span-6' : 'hidden',
              )}
            >
              <div className="px-3 py-2 border-b border-gray-200 font-medium">
                Original image preview (PNG)
              </div>
              <OriginalPreviewPanel />
            </div>

            {/* PDF panel */}
            <div
              className={clsx(
                'border rounded-lg overflow-hidden shadow-md min-w-0',
                showPreview ? 'col-span-12 lg:col-span-6' : 'col-span-12',
              )}
            >
              <iframe src={pdfUrl} title="Document" className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
