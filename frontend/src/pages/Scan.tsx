import { useEffect, useState } from 'react'
import Dropzone from '../components/upload/Dropzone'
import { uploadStoredFiles } from '../lib/modelClient'
import { useAuth } from '../hooks/useAuth'
import MainLayout from '../components/MainLayout'
import { ScanLine } from 'lucide-react'
import ModelCarousel from '../components/upload/ModelCarousel'
import { useFlash } from '../contexts/FlashContext'
import { Button } from '../components/ui/Button'
import type Model from '../types/models'

const apiBase = import.meta.env.VITE_BACKEND_API_BASE_URL as string

async function getModels(token: string): Promise<Model[]> {
  const response = await fetch(`${apiBase}/information/available_models`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch the models')
  }

  const data = (await response.json()) as Model[]

  return data
}

export default function Scan() {
  const { token, userId } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const { addFlash } = useFlash()
  const [models, setModels] = useState<Model[]>([])

  useEffect(() => {
    const fetchModels = async () => {
      if (!token) {
        addFlash('error', 'Failed to fetch the models. Please log in again')
        return
      }
      try {
        const models = await getModels(token)

        setModels(models)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch the models. Please log in again'
        addFlash('error', message)
      }
    }
    void fetchModels()
  }, [token, addFlash])

  const cleanup = () => {
    setIsSending(false)
    setFiles([])
  }

  const handleSend = async (): Promise<void> => {
    if (files.length === 0) return
    if (!token) {
      addFlash('error', 'Invalid token - try logging in again')
      return
    }
    const ownerId = typeof userId === 'string' ? Number(userId) : userId

    if (ownerId == null || !Number.isFinite(ownerId)) {
      addFlash('error', 'Invalid ownerId - try logging in again')
      return
    }

    setIsSending(true)
    try {
      await uploadStoredFiles(
        files,
        {
          ownerId,
          generation: 1,
          primaryFileId: null,
          processingModelId: models[selectedModelIndex]?.id ?? 0,
          sendToOCR: '1',
        },
        token,
      )
      addFlash('success', 'Upload successful!')
      cleanup()
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        const e = err as { message?: string; status?: number; data?: unknown }

        const backendDetail =
          e.data && typeof e.data === 'object'
            ? JSON.stringify(e.data as Record<string, unknown>)
            : null

        const msg = [
          e.status != null ? `HTTP ${String(e.status)}` : null,
          e.message ?? null,
          backendDetail ? `Details: ${backendDetail}` : null,
        ]
          .filter(Boolean)
          .join(' — ')

        addFlash('error', `Upload failed — ${msg}`)
        cleanup()
      } else {
        addFlash('error', 'Upload failed')
        cleanup()
      }
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full h-full align-middle justify-center gap-5 p-4">
        <div className="flex gap-2.5">
          <span className="text-3xl font-semibold mb-4">Scan a document</span>
          <ScanLine size={32} />
        </div>

        <div className="bg-gray-outline h-px w-full" />

        <div className="flex flex-col gap-2.5">
          <span className="text-gray-text text-lg">Select Model</span>
          <div className="flex justify-between">
            <ModelCarousel
              models={models}
              selectedIndex={selectedModelIndex}
              onSelect={setSelectedModelIndex}
            />
          </div>
        </div>

        <div className="bg-gray-outline h-px w-full" />

        {!isSending && (
          <div className="flex flex-col gap-2.5">
            <span className="text-gray-text text-lg">Scan Documents</span>
            <div className="flex justify-between">
              <Dropzone className="w-full" onFilesChange={setFiles} disabled={isSending} />
            </div>
          </div>
        )}

        {isSending && (
          <div className="animate-pulse bg-gray-200 h-24 rounded-lg w-full flex items-center justify-center">
            Uploading...
          </div>
        )}

        <div className="flex items-center justify-center">
          <Button
            buttonClass="max-w-1/4"
            label="Schedule conversion"
            onClick={() => void handleSend()}
            disabled={files.length === 0}
          />
        </div>
      </div>
    </MainLayout>
  )
}
