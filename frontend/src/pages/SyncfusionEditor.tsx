import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import clsx from 'clsx'

import MainLayout from '../components/MainLayout'
import { useAuth } from '../hooks/useAuth'

import { DocumentEditorContainerComponent, Toolbar } from '@syncfusion/ej2-react-documenteditor'
DocumentEditorContainerComponent.Inject(Toolbar)

const BACKEND_API_BASE: string =
  (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined) ??
  'http://localhost:8080/api/v1'

/**
 * Backend byte[] -> frontend base64 string
 */
type StoredFileDTO = {
  id: number
  ownerId: number
  formatId: number
  resourcePath: string
  generation: number
  primaryFileId: number | null
  content?: string | null // base64 (if fetchContent=true or you always include content)
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

export default function SyncfusionEditor() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ?? ''
  const { token } = useAuth()

  const containerRef = useRef<DocumentEditorContainerComponent | null>(null)

  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)

  const [fileDto, setFileDto] = useState<StoredFileDTO | null>(null)
  const [originalDto, setOriginalDto] = useState<StoredFileDTO | null>(null)

  // UI
  const [showPreview, setShowPreview] = useState(true)

  const originalId = useMemo(() => fileDto?.primaryFileId ?? null, [fileDto])
  const canShowPreview = Boolean(originalId)

  /**
   * Load current document DTO (to get primaryFileId)
   */
  useEffect(() => {
    if (!id) return

    const loadCurrent = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) throw new Error(`Failed to load StoredFileDTO: ${String(res.status)}`)

        const dto = (await res.json()) as StoredFileDTO
        setFileDto(dto)

        // if no original, force preview OFF
        if (!dto.primaryFileId) setShowPreview(false)
      } catch (e) {
        console.error(e)
      }
    }

    void loadCurrent()
  }, [id, token])

  /**
   * Load original PNG DTO with content base64.
   * If your backend only includes content conditionally, you may need:
   * GET /stored_files/{id}?fetchContent=true (if you have it)
   */
  useEffect(() => {
    if (!showPreview) return
    if (!originalId) return

    const loadOriginal = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${originalId}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) throw new Error(`Failed to load original DTO: ${String(res.status)}`)

        const dto = (await res.json()) as StoredFileDTO
        setOriginalDto(dto)
      } catch (e) {
        console.error(e)
        setOriginalDto(null)
      }
    }

    void loadOriginal()
  }, [showPreview, originalId, token])

  /**
   * Load SFDT into Syncfusion editor
   */
  useEffect(() => {
    if (!id) return

    const loadSfdt = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/convert/docx_to_sfdt`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) throw new Error(`Failed to load SFDT: ${String(res.status)}`)

        const sfdt = await res.text()
        containerRef.current?.documentEditor.open(sfdt)
      } catch (e) {
        console.error(e)
      }
    }

    void loadSfdt()
  }, [id, token])

  /**
   * IMPORTANT FIX:
   * When switching between 2-column and 1-column layout,
   * Syncfusion editor must be resized after DOM reflow.
   * Also: keep the editor always mounted (we do).
   */
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const c = containerRef.current
      if (!c) return

      const raf2 = requestAnimationFrame(() => {
        try {
          // depending on Syncfusion version, one (or both) may exist
          c.resize?.()
          c.documentEditor?.resize?.()
        } catch {
          // no-op
        }
      })

      // cleanup inner raf
      return () => cancelAnimationFrame(raf2)
    })

    return () => cancelAnimationFrame(raf1)
  }, [showPreview])

  const handleSave = async () => {
    if (!id) return
    if (!containerRef.current) return

    setSaving(true)
    try {
      const sfdt = containerRef.current.documentEditor.serialize()

      const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/update/sfdt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: sfdt,
      })

      if (!res.ok) throw new Error(`Failed to save document: ${String(res.status)}`)
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
      if (!res.ok) throw new Error(`Failed to convert to PDF: ${String(res.status)}`)
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

    // show "loading" instead of "empty" to avoid confusion
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
            <h1 className="text-lg font-semibold">Edit document #{id}</h1>
            <span className="text-sm text-gray-500">
              {originalId ? `Original image (PNG): #${originalId}` : 'No original image (PNG) linked'}
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
              onClick={() => void handleConvertToPdf()}
              disabled={converting}
              className="px-4 py-2 rounded-lg bg-gray-600 text-white-base disabled:opacity-50"
            >
              {converting ? 'Converting…' : 'Convert to PDF'}
            </button>

            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-base text-white-base disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* FIXED LAYOUT:
            - editor is ALWAYS mounted
            - we only change grid spans / hide preview panel
            - min-w-0 prevents "pushing" the layout wider than viewport
        */}
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
