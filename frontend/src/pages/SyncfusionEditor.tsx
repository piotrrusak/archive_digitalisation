import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowLeft } from 'lucide-react'

import MainLayout from '../components/MainLayout'
import { useAuth } from '../hooks/useAuth'

import { DocumentEditorContainerComponent, Toolbar } from '@syncfusion/ej2-react-documenteditor'
import { config } from '../config'

DocumentEditorContainerComponent.Inject(Toolbar)

const BACKEND_API_BASE: string =
  (config.backendApiUrl as string | undefined) ?? 'http://localhost:8080/api/v1'

interface StoredFileDTO {
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
        onClick={() => {
          onChange(true)
        }}
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
        onClick={() => {
          onChange(false)
        }}
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

export default function SyncfusionEditor() {
  const navigate = useNavigate()
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ?? ''
  const { token } = useAuth()

  const containerRef = useRef<DocumentEditorContainerComponent | null>(null)

  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)

  const [fileDto, setFileDto] = useState<StoredFileDTO | null>(null)
  const [originalDto, setOriginalDto] = useState<StoredFileDTO | null>(null)

  const [showPreview, setShowPreview] = useState(true)

  const originalId = useMemo<number | null>(() => fileDto?.primaryFileId ?? null, [fileDto])
  const canShowPreview = originalId != null

  // Load current StoredFileDTO
  useEffect(() => {
    if (!id) return

    let cancelled = false

    const loadCurrent = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          throw new Error(`Failed to load StoredFileDTO: ${String(res.status)}`)
        }

        const dto = (await res.json()) as StoredFileDTO
        if (cancelled) return

        setFileDto(dto)

        if (dto.primaryFileId == null) {
          setShowPreview(false)
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setFileDto(null)
          setShowPreview(false)
        }
      }
    }

    void loadCurrent()

    return () => {
      cancelled = true
    }
  }, [id, token])

  useEffect(() => {
    if (!showPreview) return
    if (originalId == null) return

    let cancelled = false

    const loadOriginal = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${String(originalId)}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          throw new Error(`Failed to load original DTO: ${String(res.status)}`)
        }

        const dto = (await res.json()) as StoredFileDTO
        if (!cancelled) setOriginalDto(dto)
      } catch (e) {
        console.error(e)
        if (!cancelled) setOriginalDto(null)
      }
    }

    void loadOriginal()

    return () => {
      cancelled = true
    }
  }, [showPreview, originalId, token])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const loadSfdt = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/convert/docx_to_sfdt`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          throw new Error(`Failed to load SFDT: ${String(res.status)}`)
        }

        const sfdt = await res.text()
        if (cancelled) return

        containerRef.current?.documentEditor.open(sfdt)
      } catch (e) {
        console.error(e)
      }
    }

    void loadSfdt()

    return () => {
      cancelled = true
    }
  }, [id, token])

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const c = containerRef.current
      if (!c) return

      const raf2 = requestAnimationFrame(() => {
        try {
          c.resize()
          c.documentEditor.resize()
        } catch (e) {
          console.error(e)
        }
      })

      return () => {
        cancelAnimationFrame(raf2)
      }
    })

    return () => {
      cancelAnimationFrame(raf1)
    }
  }, [showPreview])

  const handleSave = async () => {
    if (!id) return
    const container = containerRef.current
    if (!container) return

    setSaving(true)
    try {
      const sfdt = container.documentEditor.serialize()

      const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/update/sfdt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: sfdt,
      })

      if (!res.ok) {
        throw new Error(`Failed to save document: ${String(res.status)}`)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to save document.')
    } finally {
      setSaving(false)
    }
  }

  const handleConvertToPdf = async () => {
    if (!id) return

    setConverting(true)
    try {
      const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/convert/docx_to_pdf`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to convert to PDF: ${String(res.status)}`)
      }
    } catch (e) {
      console.error(e)
      alert('Convert to PDF failed.')
    } finally {
      setConverting(false)
    }
  }

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
      <div className="p-4 w-full h-full flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => void navigate('/documents')}
              className="flex items-center gap-2 text-gray-700 hover:text-black w-fit"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            <h1 className="text-lg font-semibold mt-2">Edit document #{id}</h1>
            <span className="text-sm text-gray-500">
              {originalId != null
                ? `Original image (PNG): #${String(originalId)}`
                : 'No original image (PNG) linked'}
            </span>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={() => void handleConvertToPdf()}
              disabled={converting}
              className="px-4 py-2 rounded-lg bg-gray-600 text-white-base disabled:opacity-50"
            >
              {converting ? 'Converting…' : 'Convert to PDF'}
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-base text-white-base disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

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

          {/* Editor panel */}
          <div
            className={clsx(
              'border border-gray-200 rounded-lg overflow-hidden bg-white min-w-0',
              showPreview ? 'col-span-12 lg:col-span-6' : 'col-span-12',
            )}
          >
            <DocumentEditorContainerComponent
              id="syncfusion-editor"
              ref={containerRef}
              height="85vh"
              enableToolbar={true}
              style={{ border: 'none' }}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
