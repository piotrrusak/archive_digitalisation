import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { RefreshCcw, Search, FileText } from 'lucide-react'
import { DocStatus } from '../components/documents/DocStatus'
import { DocOptionsMenu } from '../components/documents/DocOptionsMenu'

const API_BASE: string =
  (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? '/api' : 'http://localhost:8080')

interface APIStoredFileFormat {
  id?: number | string
  mimeType?: string
  name?: string
  extension?: string
}

interface APIStoredFile {
  id: number | string
  resourcePath?: string
  format?: APIStoredFileFormat
  generation?: number
  primaryFile?: unknown
  owner?: unknown
}

interface Doc {
  id: string
  name: string
  type?: string
  generation?: number
}

function normalizeDoc(d: APIStoredFile): Doc {
  const rawId = d.id
  const id = typeof rawId === 'number' ? String(rawId) : rawId
  const name =
    d.resourcePath?.split(/[/\\]/).pop() ?? `file-${id}`
  const type = d.format?.mimeType ?? d.format?.name ?? d.format?.extension
  return { id, name, type, generation: d.generation }
}

export default function Documents() {
  const { token } = useAuth()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  const ctrlRef = useRef<AbortController | null>(null)

  const fetchDocs = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setLoading(true)
      setError(null)
      const url = `${API_BASE}/v1/stored_files`

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal,
        })

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        if (res.status === 204) {
          setDocs([])
          return
        }

        const json: unknown = await res.json()
        if (!Array.isArray(json)) throw new Error('Unexpected response shape.')
        const parsed = (json as APIStoredFile[]).map((x) => normalizeDoc(x))
        setDocs(parsed)
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        console.error('[Documents] fetch error:', e)
        setError(e instanceof Error ? e.message : 'Failed to load documents.')
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    void fetchDocs(ctrl.signal)
    return () => ctrlRef.current?.abort()
  }, [fetchDocs])

  const refresh = useCallback(() => {
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    void fetchDocs(ctrl.signal)
  }, [fetchDocs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return docs
    return docs.filter((d) =>
      [d.name, d.type, d.id]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
    )
  }, [docs, query])

  return (
    <MainLayout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className='flex gap-3 items-center text-black-base'>
              <span className="text-2xl font-semibold">Documents</span>
              <FileText />
            </div>
            
            <p className="text-sm text-gray-text">
              {loading ? 'Loading…' : `${filtered.length} of ${docs.length} shown`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-text" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:to-blue-action"
              />
            </div>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* //TODO: move to flash */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">Failed to load documents</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-b-xl w-full">
          <table className="min-w-full divide-y divide-gray-outline bg-white">
            <thead className="bg-gray-accent border border-gray-outline w-full rounded-xl">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-text">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-text">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-text">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-text">
                  Generation
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-text">
                  {/* Empty header for ellipsis menu */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-outline text-base-black bg-gray-base">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-gray-200" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-8 w-8 rounded bg-gray-200" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    No documents found.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <DocStatus doc={d} />
                    </td>
                    <td className="px-4 py-3">{d.type ?? ''}</td>
                    <td className="px-4 py-3">{d.generation ?? ''}</td>
                    <td className="px-4 py-3 text-right">
                      <DocOptionsMenu doc={d} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}
