// src/pages/Documents.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { RefreshCcw, Search, FileText, Clipboard, AlertCircle } from 'lucide-react'

// Prefer a relative, proxied API in dev to avoid CORS/mixed content.
// Configure Vite proxy: vite.config.ts -> server.proxy['/api'] -> http://localhost:8080
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? '/api' : 'http://localhost:8080')

interface APIStoredFileFormat {
  id?: number | string
  mimeType?: string
  name?: string
  extension?: string
}

interface APIStoredFile {
  id: number | string
  // Mark optional so using ?? isn’t an unnecessary-condition
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
  path: string
  generation?: number
}

function normalizeDoc(d: APIStoredFile): Doc {
  const id = String(d.id)
  const path = d.resourcePath ?? ''
  const name = path.split(/[/\\]/).pop() ?? `file-${id}`
  const type = d.format?.mimeType ?? d.format?.name ?? d.format?.extension
  return { id, name, type, path, generation: d.generation }
}

export default function Documents() {
  const { token } = useAuth()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  const fetchDocs = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setLoading(true)
      setError(null)
      const url = `${API_BASE}/v1/stored_files`
      // eslint-disable-next-line no-console
      console.log('[Documents] GET', url, 'token?', Boolean(token))
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal,
        })

        // eslint-disable-next-line no-console
        console.log('[Documents] status:', res.status)

        if (!res.ok) {
          const body = await res.text().catch(() => '')
          const status = String(res.status)
          const statusText = String(res.statusText)
          throw new Error(`${status} ${statusText}${body ? ` – ${body}` : ''}`)
        }

        const json: unknown = await res.json()
        if (!Array.isArray(json)) throw new Error('Unexpected response shape.')
        const parsed = (json as unknown[]).map((x) => normalizeDoc(x as APIStoredFile))
        setDocs(parsed)
      } catch (e: unknown) {
        // eslint-disable-next-line no-console
        console.error('[Documents] fetch error:', e)
        // Abort?
        if (e instanceof DOMException && e.name === 'AbortError') return

        // Browser network/CORS/mixed-content issues surface as TypeError
        if (e instanceof TypeError) {
          setError(
            'Network/CORS error: the browser blocked the request. Use a dev proxy or matching protocols.'
          )
          return
        }

        const msg = e instanceof Error ? e.message : String(e ?? 'Something went wrong.')
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[Documents] mounted')
    const ctrl = new AbortController()
    void fetchDocs(ctrl.signal)
    return () => {
      // eslint-disable-next-line no-console
      console.log('[Documents] unmounted (abort fetch)')
      ctrl.abort()
    }
  }, [fetchDocs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return docs
    return docs.filter((d) =>
      [d.name, d.type, d.path, d.id].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [docs, query])

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // silent fallback
    }
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Documents</h1>
            <p className="text-sm text-gray-500">
              {loading
                ? 'Loading…'
                : `${String(filtered.length)} of ${String(docs.length)} shown`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                }}
                placeholder="Search by name, type, path…"
                className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                void fetchDocs()
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {error !== null && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Failed to load documents</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Path</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Generation</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-80 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-8 w-28 rounded bg-gray-200" />
                    </td>
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
                      <div className="text-xs text-gray-500">ID: {d.id}</div>
                    </td>
                    <td className="px-4 py-3">{d.type ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm break-all">{d.path}</span>
                    </td>
                    <td className="px-4 py-3">{d.generation ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            void copy(d.path)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
                          title="Copy the file system path"
                        >
                          <Clipboard className="h-4 w-4" />
                          Copy path
                        </button>
                        {/* Open/Download buttons require backend URLs; add later if exposed */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Dev tip: with Vite, set <code>server.proxy['/api']</code> to <code>http://localhost:8080</code> to see the
          request in Spring logs.
        </p>
      </div>
    </MainLayout>
  )
}
