import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import MainLayout from '../components/MainLayout'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/ui/Modal'
import { useNavigate } from 'react-router-dom'

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

export default function Accounts() {
  const { userId, token, userEmail, logout } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [initialFirst, setInitialFirst] = useState(firstName)
  const [initialLast, setInitialLast] = useState(lastName)
  const [showModal, setShowModal] = useState(false)

  const isProfileChanged = firstName !== initialFirst || lastName !== initialLast

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const isPasswordValid =
    password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword

  const navigate = useNavigate()

  useEffect(() => {
    if (typeof userId !== 'number' || isNaN(userId) || !token) return
    const loadProfile = async () => {
      try {
        const data = await fetchUserProfile(userId, token)
        console.log(data)
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

  const handleSaveProfile = (e: React.FormEvent) => {
    // Not yet implemented
    // see ARC-96 (https://linear.app/archive-digitalisation/issue/ARC-96/implement-edit-first-and-last-name-on-the-account-page)
    // for more context
    e.preventDefault()
    setInitialFirst(firstName)
    setInitialLast(lastName)
    alert('Profile updated successfully!')
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) return
    alert('Password changed successfully!')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <MainLayout>
      <div className="w-fit p-3 mr-auto flex flex-col justify-center gap-5">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-semibold text-black-base">My Account</span>
          <User className="w-7 h-7 text-black-base" />
        </div>
        <Divider />

        <form onSubmit={handleSaveProfile} className="flex flex-col items-start gap-2.5 w-[450px]">
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
          onSubmit={handleChangePassword}
          className="flex flex-col items-start gap-2.5 w-[450px]"
        >
          <span className="text-gray-text font-semibold">Change Password</span>
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
