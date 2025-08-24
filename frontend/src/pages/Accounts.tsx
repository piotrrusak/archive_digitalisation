import { useState } from 'react'
import MainLayout from '../components/MainLayout'
import Modal from '../components/Modal'
import { User, Mail, Lock, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { FormEvent } from 'react'

export default function Accounts() {
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const { token } = useAuth()

  const handleChangePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: ARC-40
    console.log('Password change submitted')
    setShowPasswordModal(false)
  }

  const handleDeleteAccount = async () => {
    const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/users/delete_account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ?? '',
      },
    })

    if (!response.ok) {
      const data = (await response.json()) as { error: string }
      throw new Error(data.error)
    }

    const data = (await response.json()) as { message: string }
    alert(data.message)
    setShowDeleteModal(false)
  }

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-500">Account Name</p>
            {/* Placeholder */}
            <p className="text-lg font-medium">John Doe</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            {/* Placeholder */}
            <p className="text-lg font-medium text-gray-800">john.doe@example.com</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={() => {
              setShowPasswordModal(true)
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </button>

          <button
            onClick={() => {
              setShowDeleteModal(true)
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <Modal
          title="Change Password"
          onClose={() => {
            setShowPasswordModal(false)
          }}
          footer={null}
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Current Password"
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full border p-2 rounded"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Update Password
            </button>
          </form>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          title="Delete Account"
          onClose={() => {
            setShowDeleteModal(false)
          }}
          onConfirm={void handleDeleteAccount}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        >
          <p className="text-gray-700">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
        </Modal>
      )}
    </MainLayout>
  )
}
