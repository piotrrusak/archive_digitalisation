// This is temporary admin page for component/colors testing
// In future this will become makeshift admin page that is protected
// see ARC-80
import { useFlash } from '../contexts/FlashContext'

const colors = [
  { name: 'white-base', hex: '#FFFFFF' },
  { name: 'black-base', hex: '#292929' },
  { name: 'grey-base', hex: '#F5F5F5' },
  { name: 'grey-accent', hex: '#ECECEC' },
  { name: 'grey-outline', hex: '#CACACA' },
  { name: 'grey-text', hex: '#939393' },
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

  const handleTestFlash = (type: 'success' | 'error' | 'info' | 'warning') => {
    const messages: Record<typeof type, string> = {
      success: '✅ Operation completed successfully!',
      error: '❌ Something went wrong!',
      info: "i Here's some useful information.",
      warning: '⚠️ Be careful — check your inputs!',
    }
    addFlash(type, messages[type])
  }

  return (
    <div className="min-h-screen bg-white-base text-black-base p-8">
      {/* hack to render everything, definitely remove this in the future*/}
      <div
        className="hidden
        bg-white-base bg-black-base bg-grey-base bg-grey-accent bg-grey-outline bg-grey-text
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
            className="flex flex-col items-center justify-center rounded-xl shadow-md border border-grey-outline p-4 text-center"
          >
            <div
              className="w-24 h-24 rounded-lg border border-grey-outline mb-3"
              style={{ backgroundColor: `var(--color-${color.name})` }}
            />
            <p className="font-medium text-sm">{color.name}</p>
            <p className="text-xs text-grey-text">{color.hex}</p>
          </div>
        ))}
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
    </div>
  )
}
