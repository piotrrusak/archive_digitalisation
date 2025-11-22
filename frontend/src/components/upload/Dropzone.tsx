import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { MAX_FILE_SIZE_BYTES } from '../../config/upload'
import { Button } from '../ui/Button'
import FilePreview from './FilePreview'
import { useFlash } from '../../contexts/FlashContext'
import { getApiBaseUrl } from '../../lib/modelClient'
import { useAuth } from '../../hooks/useAuth'

interface DropzoneProps {
  disabled?: boolean
  accept?: string[]
  maxSizeBytes?: number
  className?: string
  onFilesChange?: (files: File[]) => void
}

const Dropzone: React.FC<DropzoneProps> = ({
  disabled = false,
  accept,
  maxSizeBytes,
  className = '',
  onFilesChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isOver, setIsOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const { addFlash } = useFlash()
  const { token } = useAuth()

  const [availableFormats, setAvailableFormats] = useState<string[]>([])
  const [availableMimes, setAvailableMimes] = useState<string[]>([])
  const [dynamicMaxSize, setDynamicMaxSize] = useState<number>(maxSizeBytes ?? MAX_FILE_SIZE_BYTES)

  useEffect(() => {
    async function loadFormats() {
      if (!token) return
      try {
        const res = await fetch(`${getApiBaseUrl()}/formats`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) return

        const data = (await res.json()) as { id: number; format: string; mimeType: string }[]

        const filtered = data.filter((f) => f.format.toLowerCase() !== 'pdf')

        setAvailableFormats(filtered.map((f) => `.${f.format.toLowerCase()}`))
        setAvailableMimes(filtered.map((f) => f.mimeType.toLowerCase()))

        if (!maxSizeBytes) {
          setDynamicMaxSize(20 * 1024 * 1024)
        }
      } catch (err) {
        console.error('Failed to load formats', err)
      }
    }

    void loadFormats()
  }, [maxSizeBytes, token])

  const effectiveAccept = useMemo(() => {
    return accept ?? [...availableFormats, ...availableMimes]
  }, [accept, availableFormats, availableMimes])
  const effectiveMaxSize = maxSizeBytes ?? dynamicMaxSize
  const describeAcceptAttr = effectiveAccept.join(',')

  const validateAndAdd = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return

      const validFiles: File[] = []

      Array.from(newFiles).forEach((file) => {
        if (file.size > effectiveMaxSize) {
          const mb = (effectiveMaxSize / (1024 * 1024)).toFixed(1)
          addFlash('error', `File "${file.name}" is too large. Max size: ${mb} MB.`)
          return
        }

        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        const mime = file.type.toLowerCase()
        if (
          effectiveAccept.length &&
          !effectiveAccept.some((rule) => rule === '.' + ext || rule.toLowerCase() === mime)
        ) {
          addFlash('error', `Unsupported file type for "${file.name}".`)
          return
        }

        validFiles.push(file)
      })

      if (validFiles.length === 0) return

      setFiles((prev) => {
        const updated = [...prev, ...validFiles]
        onFilesChange?.(updated)
        return updated
      })
    },
    [effectiveAccept, effectiveMaxSize, onFilesChange, addFlash],
  )

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const updated = prev.filter((_, i) => i !== index)
        onFilesChange?.(updated)
        return updated
      })
    },
    [onFilesChange],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      validateAndAdd(e.target.files)
      if (inputRef.current) inputRef.current.value = ''
    },
    [validateAndAdd],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      setIsOver(false)
      validateAndAdd(e.dataTransfer.files)
    },
    [disabled, validateAndAdd],
  )

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      setIsOver(true)
    },
    [disabled],
  )

  const onDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      setIsOver(false)
    },
    [disabled],
  )

  const openFileDialog = useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={clsx(
          'border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition',
          isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={describeAcceptAttr}
          multiple={true}
          onChange={onInputChange}
          className="hidden"
          disabled={disabled}
        />

        {files.length > 0 ? (
          <div className="flex flex-wrap justify-start gap-3 w-full">
            {files.map((file, idx) => (
              <div key={idx} className="relative">
                <FilePreview file={file} />
                <button
                  type="button"
                  onClick={() => {
                    removeFile(idx)
                  }}
                  className="absolute -top-2 -right-2 shadow-xl bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-700 transition"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-600 text-sm">Drag & drop files here</span>
        )}

        {!disabled && (
          <div className="mt-3">
            <Button label="Add File" type="add" onClick={openFileDialog} variant="secondary" />
          </div>
        )}
      </div>

      <div className="flex flex-col text-xs text-gray-500 mt-1">
        {effectiveAccept.length > 0 && <span>Allowed types: {effectiveAccept.join(', ')}</span>}
        {effectiveMaxSize > 0 && (
          <span>Max file size: {(effectiveMaxSize / (1024 * 1024)).toFixed(1)} MB</span>
        )}
      </div>
    </div>
  )
}

export default Dropzone
