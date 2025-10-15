// This is temporary admin page for component/colors testing
// In future this will become makeshift admin page that is protected
// see ARC-80
import { useState } from 'react'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

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
    <div className="min-h-screen bg-white-base text-black-base p-8">
      {/* hack to render everything, definitely remove this in the future*/}
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
    </div>
  )
}
