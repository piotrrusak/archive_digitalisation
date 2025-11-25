import { useCallback, useEffect, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { useFlash } from '../contexts/FlashContext'
import { Modal } from '../components/ui/Modal'
import { getApiBaseUrl } from '../lib/modelClient'
import { useAuth } from '../hooks/useAuth'

const colors = [
  { name: 'white-base', hex: '#FFFFFF' },
  { name: 'black-base', hex: '#292929' },
  { name: 'gray-base', hex: '#F5F5F5' },
  { name: 'gray-accent', hex: '#ECECEC' },
  { name: 'gray-outline', hex: '#CACACA' },
  { name: 'gray-text', hex: '#939393' },
  { name: 'blue-base', hex: '#3F4FCF' },
  { name: 'blue-accent', hex: '#EAEAFF' },
  { name: 'blue-outline', hex: '#B5B5F0' },
  { name: 'blue-action', hex: '#323280' },
  { name: 'red-base', hex: '#FAE2E2' },
  { name: 'red-mid', hex: '#F5C5C5' },
  { name: 'red-dark', hex: '#E76E64' },
  { name: 'green-base', hex: '#E6F2E6' },
  { name: 'green-mid', hex: '#99CA99' },
  { name: 'green-dark', hex: '#00743E' },
  { name: 'yellow-base', hex: '#FEF2CD' },
  { name: 'yellow-mid', hex: '#75B798' },
  { name: 'yellow-dark', hex: '#CC9E08' },
]

export default function Admin() {
  const { addFlash } = useFlash()
  const { token } = useAuth()

  const [formats, setFormats] = useState<{ id: number; format: string; mimeType: string }[]>([])
  const [newFormat, setNewFormat] = useState<{ format: string; mimeType: string }>({
    format: '',
    mimeType: '',
  })

  useEffect(() => {
    async function loadFormats() {
      if (!token) return
      try {
        const res = await fetch(`${getApiBaseUrl()}/formats`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) return

        const data = (await res.json()) as { id: number; format: string; mimeType: string }[]
        setFormats(data)
      } catch (err) {
        addFlash('error', `Failed to load formats`)
      }
    }

    void loadFormats()
  }, [token, addFlash])

  async function addNewFormat() {
    if (!newFormat.format || !newFormat.mimeType) return
    if (!token) return

    try {
      const res = await fetch(`${getApiBaseUrl()}/formats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFormat),
      })

      if (!res.ok) return

      const created = (await res.json()) as { id: number; format: string; mimeType: string }
      setFormats((prev) => [...prev, created])
      setNewFormat({ format: '', mimeType: '' })
    } catch (err) {
      console.error('Failed to add format', err)
    }
  }

  async function deleteFormat(id: number) {
    if (!token) return

    try {
      await fetch(`${getApiBaseUrl()}/formats/${id.toString()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      setFormats((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      console.error('Failed to delete format', err)
    }
  }

  const ADMIN_API = `${import.meta.env.VITE_AUTH_API_BASE_URL}/admins`

  const [admins, setAdmins] = useState<{ id: number; email: string }[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')

  const loadAdmins = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(ADMIN_API, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) return

      const data = (await res.json()) as { admins: { id: number; email: string }[] }
      setAdmins(data.admins)
    } catch (err) {
      console.error('Failed to load admins', err)
    }
  }, [token, ADMIN_API])

  useEffect(() => {
    void loadAdmins()
  }, [loadAdmins])

  async function addAdmin() {
    if (!newAdminEmail) return
    if (!token) return

    try {
      const res = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newAdminEmail, is_admin: true }),
      })

      if (!res.ok) return

      setNewAdminEmail('')
      void loadAdmins()
    } catch (err) {
      console.error('Failed to add admin', err)
    }
  }

  async function removeAdmin(email: string) {
    if (!token) return
    try {
      const res = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, is_admin: false }),
      })

      if (!res.ok) return

      void loadAdmins()
    } catch (err) {
      console.error('Failed to remove admin', err)
    }
  }

  const handleTestFlash = (type: 'success' | 'error' | 'info' | 'warning') => {
    const messages: Record<typeof type, string> = {
      success: '✅ Operation completed successfully!',
      error: '❌ Something went wrong!',
      info: "i Here's some useful information.",
      warning: '⚠️ Be careful — check your inputs!',
    }
    addFlash(type, messages[type])
  }

  const [values, setValues] = useState({
    text: '',
    textDisabled: '',
    textError: '',
    password: '',
    passwordDisabled: '',
    passwordError: '',
  })

  const [modals, setModals] = useState({
    confirmCancel: false,
    confirmOnly: false,
    cancelOnly: false,
    backModal: false,
    deleteModal: false,
  })

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const openModal = (key: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [key]: true }))
  }
  const closeModal = (key: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [key]: false }))
  }

  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-12 text-center">🛠 Admin Panel</h1>
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-6 text-center">🧾 Format Control</h2>

        <table className="w-full max-w-2xl mx-auto border border-gray-outline rounded-lg">
          <thead>
            <tr className="bg-gray-accent">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Format</th>
              <th className="p-3 text-left">MIME Type</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {formats.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3">{f.id}</td>
                <td className="p-3">{f.format}</td>
                <td className="p-3">{f.mimeType}</td>
                <td className="p-3 text-center">
                  <Button label="DELETE" variant="danger" onClick={() => void deleteFormat(f.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="max-w-2xl mx-auto mt-8 flex gap-4">
          <TextField
            label="Format"
            value={newFormat.format}
            onChange={(v) => {
              setNewFormat((p) => ({ ...p, format: v }))
            }}
            placeholder="e.g. docx"
          />
          <TextField
            label="MIME"
            value={newFormat.mimeType}
            onChange={(v) => {
              setNewFormat((p) => ({ ...p, mimeType: v }))
            }}
            placeholder="application/vnd..."
          />
          <Button label="ADD" type="add" onClick={() => void addNewFormat()} />
        </div>
      </section>

      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-6 text-center">👤 Admin Management</h2>

        <table className="w-full max-w-2xl mx-auto border border-gray-outline rounded-lg">
          <thead>
            <tr className="bg-gray-accent">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.id}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3 text-center">
                  <Button
                    label="REMOVE"
                    variant="danger"
                    onClick={() => void removeAdmin(a.email)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="max-w-2xl mx-auto mt-8 flex gap-4">
          <TextField
            label="Email"
            value={newAdminEmail}
            onChange={setNewAdminEmail}
            placeholder="email@example.com"
          />
          <Button label="ADD" type="add" onClick={() => void addAdmin()} />
        </div>
      </section>

      <div
        className="hidden
        bg-white-base bg-black-base bg-gray-base bg-gray-accent bg-gray-outline bg-gray-text
        bg-blue-base bg-blue-accent bg-blue-outline bg-blue-action
        bg-red-base bg-red-mid bg-red-dark
        bg-green-base bg-green-mid bg-green-dark
        bg-yellow-base bg-yellow-mid bg-yellow-dark
        "
      ></div>
      <h1 className="text-3xl font-bold mb-8 text-center">🎨 Color Palette</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {colors.map((color) => (
          <div
            key={color.name}
            className="flex flex-col items-center justify-center rounded-xl shadow-md border border-gray-outline p-4 text-center"
          >
            <div
              className="w-24 h-24 rounded-lg border border-gray-outline mb-3"
              style={{ backgroundColor: `var(--color-${color.name})` }}
            />
            <p className="font-medium text-sm">{color.name}</p>
            <p className="text-xs text-gray-text">{color.hex}</p>
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold mb-8 text-center">Main Components</h1>
      <div className="w-full mx-auto mt-10 flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-8 text-center">All TextField Variants</h1>
        <div className="flex flex-col gap-6 max-w-md mx-auto">
          {/* TextField Variants */}
          <TextField
            label="Text - Normal"
            value={values.text}
            onChange={(v) => {
              handleChange('text', v)
            }}
            placeholder="Normal text"
          />
          <TextField
            label="Text - Disabled"
            value={values.textDisabled}
            onChange={(v) => {
              handleChange('textDisabled', v)
            }}
            placeholder="Disabled text"
            disabled
          />
          <TextField
            label="Text - Error"
            value={values.textError}
            onChange={(v) => {
              handleChange('textError', v)
            }}
            placeholder="Text with error"
            error="This field is required"
          />

          {/* Password Variants */}
          <TextField
            label="Password - Normal"
            type="password"
            value={values.password}
            onChange={(v) => {
              handleChange('password', v)
            }}
            placeholder="Enter password"
          />
          <TextField
            label="Password - Disabled"
            type="password"
            value={values.passwordDisabled}
            onChange={(v) => {
              handleChange('passwordDisabled', v)
            }}
            placeholder="Disabled password"
            disabled
          />
          <TextField
            label="Password - Error"
            type="password"
            value={values.passwordError}
            onChange={(v) => {
              handleChange('passwordError', v)
            }}
            placeholder="Password with error"
            error="Invalid password"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-12">
        <h1 className="text-3xl font-bold mb-4 text-center">🧩 Button Variants</h1>

        <div className="flex flex-col gap-4 items-start max-w-md mx-auto">
          <Button
            label="Primary Button"
            variant="primary"
            onClick={() => {
              alert('Primary button clicked!')
            }}
          />
          <Button
            label="Primary Add Button"
            variant="primary"
            type="add"
            onClick={() => {
              alert('Primary Add button clicked!')
            }}
          />

          <Button
            label="Secondary Button"
            variant="secondary"
            onClick={() => {
              alert('Secondary button clicked!')
            }}
          />

          <Button
            label="Danger Button"
            variant="danger"
            onClick={() => {
              alert('Danger button clicked!')
            }}
          />

          <Button
            label="Disabled Button"
            variant="primary"
            disabled
            onClick={() => {
              alert('This should not fire')
            }}
          />

          <Button
            label="Custom Styled Button"
            variant="secondary"
            buttonClass="border-2 border-blue-base bg-blue-accent text-blue-action hover:bg-blue-outline"
            onClick={() => {
              alert('Custom styled button clicked!')
            }}
          />
          <Button
            label="Custom Styled Disabled Button"
            variant="secondary"
            disabled
            buttonClass="border-2 border-blue-base bg-blue-accent text-blue-action"
            onClick={() => {
              alert('Custom styled button clicked!')
            }}
          />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">⚠️ Flash Messages</h1>
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        <button
          onClick={() => {
            handleTestFlash('success')
          }}
          className="bg-green-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          Test Success Flash
        </button>
        <button
          onClick={() => {
            handleTestFlash('error')
          }}
          className="bg-red-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          Test Error Flash
        </button>
        <button
          onClick={() => {
            handleTestFlash('info')
          }}
          className="bg-blue-base text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          Test Info Flash
        </button>
        <button
          onClick={() => {
            handleTestFlash('warning')
          }}
          className="bg-yellow-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          Test Warning Flash
        </button>
      </div>

      <div className="mt-20 flex flex-col gap-4 items-center">
        <h1 className="text-3xl font-bold mb-4 text-center">🪟 Modal Variants</h1>

        <Button
          label="Open Confirm + Cancel Modal"
          onClick={() => {
            openModal('confirmCancel')
          }}
        />
        <Button
          label="Open Confirm-only Modal"
          onClick={() => {
            openModal('confirmOnly')
          }}
        />
        <Button
          label="Open Cancel-only Modal"
          onClick={() => {
            openModal('cancelOnly')
          }}
        />
        <Button
          label="Open Modal with Back Button"
          onClick={() => {
            openModal('backModal')
          }}
        />
        <Button
          label="Open Delete Modal"
          variant="danger"
          onClick={() => {
            openModal('deleteModal')
          }}
        />
      </div>

      {/* Modals */}
      <Modal
        id="confirmCancel"
        show={modals.confirmCancel}
        onConfirm={() => {
          alert('Confirmed!')
          closeModal('confirmCancel')
        }}
        onCancel={() => {
          closeModal('confirmCancel')
        }}
        title="Confirm + Cancel Modal"
        subtitle="A basic modal with both buttons"
      >
        <p className="text-center">This modal has both Confirm and Cancel actions.</p>
      </Modal>

      <Modal
        id="confirmOnly"
        show={modals.confirmOnly}
        onConfirm={() => {
          alert('Confirmed!')
          closeModal('confirmOnly')
        }}
        title="Confirm Only Modal"
        subtitle="Only confirm button is visible"
      >
        <p className="text-center">This modal only has a confirm action.</p>
      </Modal>

      <Modal
        id="cancelOnly"
        show={modals.cancelOnly}
        onCancel={() => {
          closeModal('cancelOnly')
        }}
        title="Cancel Only Modal"
        subtitle="Only cancel button is visible"
      >
        <p className="text-center">This modal only has a cancel button.</p>
      </Modal>

      <Modal
        id="backModal"
        show={modals.backModal}
        onCancel={() => {
          closeModal('backModal')
        }}
        onBack={() => {
          alert('Back button clicked!')
        }}
        hideExit
        title="Back Button Modal"
        subtitle="Modal with a back button and no close icon"
      >
        <p className="text-center">This modal includes a back arrow and hides the exit icon.</p>
      </Modal>

      <Modal
        id="deleteModal"
        show={modals.deleteModal}
        onConfirm={() => {
          alert('Deleted!')
          closeModal('deleteModal')
        }}
        confirmVariant="danger"
        confirmLabel="Delete"
        onCancel={() => {
          closeModal('deleteModal')
        }}
        onBack={() => {
          alert('Back button clicked!')
        }}
        hideExit
        title="Delete Modal"
        subtitle="Modal with a confirm button in different variant"
      >
        <p className="text-center">
          Are you sure you want to delete this?
          {/* Yes I did just write 'random image' into google, problem? :troll: */}
          <img src="https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg" />
        </p>
      </Modal>
    </MainLayout>
  )
}
