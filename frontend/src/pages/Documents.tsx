import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { Download, RefreshCw, FileText, Search, ArrowUpDown, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type StagedFile = {
  id: string | number
  // Najczęściej spotykane pola — dostosuj do swojego backendu:
  originalName?: string
  fileName?: string
  filename?: string
  mimeType?: string
  size?: number
  sizeBytes?: number
  createdAt?: string
  uploadedAt?: string
  url?: string
  downloadUrl?: string
  // dowolne inne pola:
  [key: string]: unknown
}

type SortKey = 'name' | 'date' | 'size'

const apiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

function decodeJwt<T = Record<string, unknown>>(token: string | null | undefined): T | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json))) as T
  } catch {
    return null
  }
}

function getOwnerIdFromAuth(authToken: string | null | undefined): string | null {
  const payload = decodeJwt<{ id?: string | number; sub?: string | number }>(authToken)
  if (!payload) return null
  const val = payload.id ?? payload.sub
  return val != null ? String(val) : null
}

function formatBytes(n?: number): string {
  if (n == null || Number.isNaN(n)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let idx = 0
  let value = n
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx++
  }
  return `${value.toFixed(value < 10 && idx > 0 ? 1 : 0)} ${units[idx]}`
}

function coalesceName(f: StagedFile): string {
  return (f.originalName ?? f.fileName ?? f.filename ?? String(f.id)) as string
}

function coalesceDate(f: StagedFile): string | undefined {
  return f.createdAt ?? f.uploadedAt
}

function coalesceSize(f: StagedFile): number | undefined {
  return f.size ?? f.sizeBytes
}

function coalesceDownloadUrl(f: StagedFile): string | undefined {
  return f.downloadUrl ?? f.url
}

export default function Documents() {
  const { token } = useAuth() as { token?: string | null }
  const [docs, setDocs] = useState<StagedFile[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const ownerId = getOwnerIdFromAuth(token)

  async function fetchDocs() {
    if (!ownerId) {
      setError('Brak owner_id — upewnij się, że token JWT zawiera pole id/sub albo zaktualizuj useAuth, aby udostępniał user.id.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${apiBase}/api/v1/stored_files/owner/${ownerId}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Błąd pobierania dokumentów (${res.status})`)
      }
      const data = (await res.json()) as StagedFile[] | { data: StagedFile[] }
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setDocs(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się pobrać dokumentów')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? docs.filter((d) => {
          const name = coalesceName(d).toLowerCase()
          const mime = (d.mimeType ?? '').toString().toLowerCase()
          return name.includes(q) || mime.includes(q)
        })
      : docs.slice()

    base.sort((a, b) => {
      if (sortKey === 'name') {
        const an = coalesceName(a).toLowerCase()
        const bn = coalesceName(b).toLowerCase()
        return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an)
      }
      if (sortKey === 'size') {
        const as = coalesceSize(a) ?? -1
        const bs = coalesceSize(b) ?? -1
        return sortDir === 'asc' ? as - bs : bs - as
      }
      // date
      const ad = coalesceDate(a) ? new Date(coalesceDate(a) as string).getTime() : -1
      const bd = coalesceDate(b) ? new Date(coalesceDate(b) as string).getTime() : -1
      return sortDir === 'asc' ? ad - bd : bd - ad
    })

    return base
  }, [docs, query, sortKey, sortDir])

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-semibold text-white">Documents</h1>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po nazwie lub typie..."
                className="pl-9 pr-3 py-2 rounded-xl bg-gray-700 text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <button
              onClick={() => {
                setSortKey('date')
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-600"
              title="Sortuj wg daty"
            >
              <ArrowUpDown className="h-4 w-4" />
              Data
            </button>

            <button
              onClick={() => {
                setSortKey('name')
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-600"
              title="Sortuj wg nazwy"
            >
              <ArrowUpDown className="h-4 w-4" />
              Nazwa
            </button>

            <button
              onClick={() => {
                setSortKey('size')
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-600"
              title="Sortuj wg rozmiaru"
            >
              <ArrowUpDown className="h-4 w-4" />
              Rozmiar
            </button>

            <button
              onClick={() => void fetchDocs()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </button>
          </div>
        </div>

        {/* Stany: ładowanie / błąd / pusto */}
        {loading && (
          <div className="text-gray-200">Ładowanie dokumentów…</div>
        )}

        {error && !loading && (
          <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-gray-300">
            Brak dokumentów do wyświetlenia.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => {
              const name = coalesceName(f)
              const when = coalesceDate(f)
              const size = coalesceSize(f)
              const link = coalesceDownloadUrl(f)

              return (
                <li key={String(f.id)} className="rounded-2xl bg-gray-700 text-white p-4 shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-gray-800">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" title={name}>
                        {name}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        {f.mimeType ?? '—'}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {when ? new Date(when).toLocaleString() : '—'} • {formatBytes(size)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-600 hover:bg-gray-500"
                      >
                        <Download className="h-4 w-4" />
                        Pobierz
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Brak linku do pobrania</span>
                    )}

                    {/* Pokaż surowe API (debug) */}
                    <details className="text-xs text-gray-300">
                      <summary className="cursor-pointer inline-flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> Szczegóły
                      </summary>
                      <pre className="mt-2 bg-gray-800 p-2 rounded-lg overflow-x-auto max-h-40">
                        {JSON.stringify(f, null, 2)}
                      </pre>
                    </details>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </MainLayout>
  )
}