// This is temporary admin page for component/colors testing
// In future this will become makeshift admin page that is protected
// see ARC-80
import { useState } from 'react'
import { TextField } from '../components/ui/TextField'

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

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
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
    </div>
  )
}
