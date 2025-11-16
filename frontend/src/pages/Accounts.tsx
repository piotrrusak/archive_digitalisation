import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import MainLayout from '../components/MainLayout'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/ui/Modal'
import { useNavigate } from 'react-router-dom'
import { useFlash } from '../contexts/FlashContext'

// Private component for divider
function Divider() {
  return <div className="h-px w-full bg-gray-outline" />
}

interface UserProfileResponse {
  id: number
  mail: string
  firstName: string | null
  lastName: string | null
}

interface UserProfile {
  firstName: string
  lastName: string
}

interface AuthApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

async function fetchUserProfile(userId: number, userToken: string): Promise<UserProfile> {
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

  const data: UserProfileResponse = (await res.json()) as UserProfileResponse

  return {
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
  }
}

async function handleDeleteAccount(
  userId: number | null,
  userToken: string | null,
  logout: () => void,
  navigate: ReturnType<typeof useNavigate>,
): Promise<void> {
  if (typeof userId !== 'number' || isNaN(userId) || !userToken) return

  const url = `${import.meta.env.VITE_AUTH_API_BASE_URL}/users/delete_account`

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    })

    if (res.ok) {
      logout()
      void navigate('/')
    } else {
      const text = await res.text()
      console.error(`Failed to delete user (${res.status.toString()}): ${text}`)
    }
  } catch (err) {
    console.error('Error while deleting user:', err)
  }
}

async function handleChangePasswordApi(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  token: string | null,
) {
  if (!token) return

  const url = `${import.meta.env.VITE_AUTH_API_BASE_URL}/users/update_password`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    }),
  })

  if (!res.ok) {
    const data = (await res.json()) as AuthApiErrorResponse
    throw new Error(data.message ?? 'Failed to change password')
  }
}

async function handleChangeUserName(
  userId: number | null,
  userToken: string | null,
  userFirstName: string | null,
  userLastName: string | null,
) {
  if (typeof userId !== 'number' || isNaN(userId) || !userToken) return

  const url = `${import.meta.env.VITE_BACKEND_API_BASE_URL as string}/users/${userId.toString()}`

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

  return res
}

export default function Accounts() {
  const { userId, token, userEmail, logout } = useAuth()
  const { addFlash } = useFlash()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [initialFirst, setInitialFirst] = useState(firstName)
  const [initialLast, setInitialLast] = useState(lastName)
  const [showModal, setShowModal] = useState(false)

  const isProfileChanged = firstName !== initialFirst || lastName !== initialLast

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const isPasswordValid =
    currentPassword.length >= 6 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword

  const navigate = useNavigate()

  useEffect(() => {
    if (typeof userId !== 'number' || isNaN(userId) || !token) return
    const loadProfile = async () => {
      try {
        const data = await fetchUserProfile(userId, token)
        setFirstName(data.firstName)
        setLastName(data.lastName)
        setInitialFirst(data.firstName)
        setInitialLast(data.lastName)
      } catch (err) {
        console.error('Failed to fetch user profile', err)
      }
    }

    void loadProfile()
  }, [userId, token])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await handleChangeUserName(userId, token, firstName, lastName)

      setInitialFirst(firstName)
      setInitialLast(lastName)
      addFlash('success', 'Profile updated successfully!')
    } catch (err) {
      addFlash('error', err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid || !token) return

    try {
      await handleChangePasswordApi(currentPassword, password, confirmPassword, token)

      addFlash('success', 'Password changed successfully!')

      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      addFlash('error', `Failed to change password: ${(err as Error).message}`)
    }
  }

  return (
    <MainLayout>
      <div className="w-fit p-3 mr-auto flex flex-col justify-center gap-5">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-semibold text-black-base">My Account</span>
          <User className="w-7 h-7 text-black-base" />
        </div>
        <Divider />

        <form
          onSubmit={(e) => void handleSaveProfile(e)}
          className="flex flex-col items-start gap-2.5 w-[450px]"
        >
          <span className="text-gray-text font-semibold">General Information</span>
          <TextField
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            placeholder="Enter first name"
            inputClass="flex-1"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            placeholder="Enter last name"
            inputClass="flex-1"
          />
          <Button label="Save" variant="primary" type="normal" disabled={!isProfileChanged} />
        </form>

        <Divider />

        <div className="flex flex-col items-start gap-2.5 w-[450px]">
          <span className="text-gray-text font-semibold">Email address</span>
          <p className="text-gray-text text-sm">
            Email address is used to identify user and receive notifications about completed scans
          </p>
          <TextField inputClass="flex-1" disabled value={userEmail ?? ''} />
        </div>

        <Divider />

        <form
          onSubmit={(e) => {
            void handleChangePassword(e)
          }}
          className="flex flex-col items-start gap-2.5 w-[450px]"
        >
          <span className="text-gray-text font-semibold">Change Password</span>
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
            inputClass="flex-1"
            error={
              currentPassword.length > 0 && currentPassword.length < 6
                ? 'Password must be at least 6 characters'
                : undefined
            }
          />
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
            inputClass="flex-1"
            error={
              password.length > 0 && password.length < 6
                ? 'Password must be at least 6 characters'
                : undefined
            }
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            inputClass="flex-1"
            error={
              confirmPassword.length > 0 && confirmPassword !== password
                ? 'Passwords do not match'
                : undefined
            }
          />
          <Button
            label="Change Password"
            variant="primary"
            type="normal"
            disabled={!isPasswordValid}
          />
        </form>

        <Divider />

        <div className="flex-1 flex-col justify-start">
          <Button
            label="Delete Account"
            variant="danger"
            type="normal"
            onClick={() => {
              setShowModal(true)
            }}
          />
        </div>
      </div>
      <Modal
        id="deleteModal"
        show={showModal}
        onConfirm={() => void handleDeleteAccount(userId, token, logout, navigate)}
        confirmVariant="danger"
        confirmLabel="Delete"
        onCancel={() => {
          setShowModal(false)
        }}
        title="Delete Account"
      >
        <p className="text-center text-black-base text-xl">
          Are you sure you want to delete this account? This action is permanent and cannot be
          undone
        </p>
      </Modal>
    </MainLayout>
  )
}
