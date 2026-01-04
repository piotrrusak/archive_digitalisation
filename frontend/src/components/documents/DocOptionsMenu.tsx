import { useState, useRef, useEffect } from 'react'
import { Ellipsis } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { FC } from 'react'
import { config } from '../../config'

interface DocOptionsMenuProps {
  doc: { id: number; name: string; type?: string }
  onDelete?: (id: number) => void
  token: string | null
}

const BACKEND_API_BASE: string =
  (config.backendApiUrl as string | undefined) ?? 'http://localhost:8080/api/v1'

export const DocOptionsMenu: FC<DocOptionsMenuProps> = ({ doc, onDelete, token }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [])

  const handleExport = async () => {
    try {
      const url = `${BACKEND_API_BASE}/stored_files/${doc.id.toString()}/export`
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) throw new Error('Failed to export document')

      const blob = await res.blob()
      const urlBlob = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = urlBlob
      link.download = `${doc.name}.pdf`
      link.click()
      window.URL.revokeObjectURL(urlBlob)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export document.')
    } finally {
      setOpen(false)
    }
  }

  const handleEdit = () => {
    setOpen(false)
    void navigate(`/editor/${doc.id.toString()}`)
  }

  const handleDelete = () => {
    onDelete?.(doc.id)
    setOpen(false)
  }

  const handleView = () => {
    setOpen(false)
    void navigate(`/document/${doc.id.toString()}`)
  }

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o)
        }}
        className="p-1.5 rounded-full hover:bg-gray-100"
      >
        <Ellipsis className="h-5 w-5 text-gray-600" />
      </button>
      {open && (
        <>
          <div
            onClick={() => {
              setOpen(false)
            }}
            className="fixed inset-0 bg-black-base opacity-50 z-40"
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-white-base shadow-2xl z-50 p-4 flex flex-col">
            <ul className="flex flex-col space-y-2 text-gray-text text-sm mt-4">
              {doc.type === 'pdf' && (
                <li
                  className="px-3 py-2 rounded-md hover:bg-gray-accent cursor-pointer"
                  onClick={handleView}
                >
                  View Document
                </li>
              )}
              {doc.type === 'pdf' && (
                <li
                  className="px-3 py-2 rounded-md hover:bg-gray-accent cursor-pointer"
                  onClick={() => void handleExport()}
                >
                  Export Document
                </li>
              )}
              {doc.type === 'docx' && (
                <li
                  className="px-3 py-2 rounded-md hover:bg-gray-accent cursor-pointer"
                  onClick={handleEdit}
                >
                  Edit Document
                </li>
              )}
              <li
                className="px-3 py-2 rounded-md hover:bg-gray-accent cursor-pointer"
                onClick={handleDelete}
              >
                Delete Document
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
