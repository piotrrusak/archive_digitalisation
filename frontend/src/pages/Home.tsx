import { useEffect, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { HomeIcon } from 'lucide-react'

function Divider() {
  return <div className="h-px w-full bg-gray-outline" />
}

interface UserProfileResponse {
  id: number
  mail: string
  firstName: string | null
  lastName: string | null
}

interface StoredFileDTO {
  id: number
  fileName: string
  ownerId: number
}

async function fetchUserProfile(userId: number, userToken: string): Promise<string> {
  const url = `${import.meta.env.VITE_BACKEND_API_BASE_URL as string}/users/${userId.toString()}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.status.toString()}`)
  }

  const data = (await res.json()) as UserProfileResponse
  return `${data.firstName ?? ''} ${data.lastName ?? ''}`
}

export default function Home() {
  const { userId, token } = useAuth()
  const [username, setUsername] = useState('')

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !token) return

    const loadProfile = async () => {
      try {
        const data = await fetchUserProfile(userId, token)
        setUsername(data)
      } catch (err) {
        console.error('Failed to fetch user profile', err)
      }
    }

    void loadProfile()
  }, [userId, token])

  useEffect(() => {
    if (!userId || !token) return

    const loadRandomDocument = async () => {
      setLoading(true)
      try {
        const base = import.meta.env.VITE_BACKEND_API_BASE_URL as string
        const listUrl = `${base}/stored_files/owner/${userId.toString()}`

        const listRes = await fetch(listUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!listRes.ok) throw new Error("Failed to fetch user's files")

        const files = (await listRes.json()) as StoredFileDTO[]

        if (files.length === 0) {
          setError('User has no documents')
          setLoading(false)
          return
        }

        const randomFile = files[Math.floor(Math.random() * files.length)]

        const exportUrl = `${base}/stored_files/${randomFile.id.toString()}/export`
        const pdfRes = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!pdfRes.ok) throw new Error('Failed to export PDF')

        const blob = await pdfRes.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (err: unknown) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to create blob')
      } finally {
        setLoading(false)
      }
    }

    void loadRandomDocument()
  }, [userId, token])

  return (
    <MainLayout>
      <div className="w-full p-3 flex flex-col justify-center gap-5">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-semibold text-black-base">Home</span>
          <HomeIcon className="w-7 h-7 text-black-base" />
        </div>
        <span className="text-xl font-semibold text-black-base">Welcome {username}</span>

        <Divider />

        <div className="flex gap-10 items-start justify-center align-middle">
          <div className="flex flex-col gap-2 items-start justify-start flex-1 flex-grow">
            <span className="text-3xl font-semibold text-black-base">Random Document</span>

            <div className="w-full flex-1 justify-center align-middle bg-gray-base p-4 rounded-xl shadow-inner border min-h-[600px] border-gray-300">
              {loading && <p>Loading document…</p>}

              {error && error === 'User has no documents' && (
                <p className="text-black-base font-medium">You have no documents yet.</p>
              )}

              {error && error !== 'User has no documents' && (
                <p className="text-red-dark">{error}</p>
              )}

              {!loading && !error && pdfUrl && (
                <iframe
                  src={pdfUrl}
                  title="Document"
                  className="w-full h-[600px] border rounded-lg shadow-lg bg-white"
                />
              )}
            </div>
          </div>
          <div className="flex items-start justify-center align-middle flex-1 flex-grow h-full my-auto p-4">
            <div className="bg-gray-base p-6 rounded-xl shadow-sm w-full">
              <h2 className="text-2xl font-semibold text-black-base mb-4">About This Project</h2>

              <p className="text-black-base leading-relaxed mb-4">
                This project focuses on building a content-aware OCR platform capable of handling
                multiple document types and multiple AI models. Explore the app using the sections
                below:
              </p>

              <ul className="list-disc list-inside space-y-3 text-black-base">
                <li>
                  Documents Page: View, manage, and download all previously created or uploaded
                  documents.
                </li>

                <li>
                  Scan Page: The core of the application. Schedule document scans, select scanning
                  models, and let the system extract information using advanced OCR pipelines.
                </li>

                <li>
                  Account Page: Update your personal information and view your account details.
                </li>

                <li>Logout: Sign out and switch between user accounts securely.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
