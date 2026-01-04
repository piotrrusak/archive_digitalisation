import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFlash } from '../contexts/FlashContext'
import NameForm from '../components/forms/NameForm'
import { LibraryBig } from 'lucide-react'
import { config } from '../config'

interface AuthApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

async function handleChangeUserName(
  userId: number | null,
  userToken: string | null,
  userFirstName: string | null,
  userLastName: string | null,
) {
  if (typeof userId !== 'number' || isNaN(userId) || !userToken) return

  const url = `${config.backendApiUrl}/users/${userId.toString()}`

  const body = {
    ...(userFirstName !== null && { firstName: userFirstName }),
    ...(userLastName !== null && { lastName: userLastName }),
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = (await res.json()) as AuthApiErrorResponse
    throw new Error(data.message ?? 'Failed to change name')
  }
}

export default function RegisterAdditionalInfo() {
  const { userId, token } = useAuth()
  const { addFlash } = useFlash()
  const navigate = useNavigate()

  const handleFormSubmit = async (firstName: string, lastName: string) => {
    try {
      await handleChangeUserName(userId, token, firstName, lastName)

      addFlash('success', 'Profile created successfully!')
      void navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      addFlash('error', message)
    }
  }

  return (
    <div className="flex p-5 w-full h-full text-black-base">
      <div className="min-w-[600px] flex flex-col">
        <div className="w-full flex gap-3 p-3 items-center">
          <LibraryBig size={32} />
          <div className="text-3xl h-8 flex items-center leading-none">
            <span className="font-bold">Archive</span>
            <span>Digitalization</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start justify-center px-20 gap-9">
          <div className="flex flex-col gap-2">
            <span className="font-bold text-[40px] h-[49px]">Register</span>
            <span className="font-normal text-xl text-gray-text">
              Please enter additional details
            </span>
          </div>
          <NameForm onSubmit={handleFormSubmit} />
        </div>
      </div>
      <div className="rounded-[20px] overflow-hidden w-full h-full">
        <img
          src="https://as1.ftcdn.net/v2/jpg/02/86/74/06/1000_F_286740601_d16NX2q8zoOfzkeN8pR8JBzbkDil2xjW.jpg"
          className="w-full h-full object-cover"
          alt="This is Placeholder image"
        />
      </div>
    </div>
  )
}
