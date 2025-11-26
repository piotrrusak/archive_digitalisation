import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { useAuth } from '../hooks/useAuth'

import { DocumentEditorContainerComponent, Toolbar } from '@syncfusion/ej2-react-documenteditor'

// This library uses "any" type that linter does not let pass, so we disable warnings here:

// /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */

DocumentEditorContainerComponent.Inject(Toolbar)

const BACKEND_API_BASE: string =
  (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined) ??
  'http://localhost:8080/api/v1'

export default function SyncfusionEditor() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ?? ''
  const { token } = useAuth()

  const containerRef = useRef<DocumentEditorContainerComponent | null>(null)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadDocument = async () => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/syncfusion`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to load SFDT: ${String(res.status)}`)
        }

        const sfdt = await res.text()

        if (containerRef.current) {
          containerRef.current.documentEditor.open(sfdt)
        }
      } catch (err) {
        console.error('Failed to load document for Syncfusion editor', err)
      }
    }

    void loadDocument()
  }, [id, token])

  const handleSave = async () => {
    if (!id) return
    if (!containerRef.current) return

    const editor = containerRef.current.documentEditor
    setSaving(true)

    try {
      const sfdt = editor.serialize()

      const res = await fetch(`${BACKEND_API_BASE}/stored_files/${id}/syncfusion`, {
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

      console.log('Document saved')
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save document.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="p-4 w-full h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Edit document #{id}</h1>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-base text-white-base disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <DocumentEditorContainerComponent
          id="syncfusion-editor"
          ref={containerRef}
          height={'85vh'}
          enableToolbar={true}
          style={{ border: '1px solid #ddd' }}
        />
      </div>
    </MainLayout>
  )
}
// /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */