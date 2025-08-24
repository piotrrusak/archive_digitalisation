import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Home, FileText, ScanLine, User, LogOut } from 'lucide-react'

export default function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    void navigate('/login')
  }

  return (
    <div className="h-full bg-gray-800 text-white flex flex-col p-2">
      <div className="text-lg p-4 font-semibold">Archive Digitalization</div>

      <div className="flex-1 flex flex-col mt-4 space-y-2">
        <button
          onClick={() => void navigate('/')}
          className="flex items-center px-4 py-2 text-left hover:bg-gray-700 rounded-lg"
        >
          <Home className="w-5 h-5 mr-2" />
          Home
        </button>

        <button
          onClick={() => void navigate('/documents')}
          className="flex items-center px-4 py-2 text-left hover:bg-gray-700 rounded-lg"
        >
          <FileText className="w-5 h-5 mr-2" />
          Documents
        </button>

        <button
          onClick={() => void navigate('/scan')}
          className="flex items-center px-4 py-2 text-left hover:bg-gray-700 rounded-lg"
        >
          <ScanLine className="w-5 h-5 mr-2" />
          Scan
        </button>

        <button
          onClick={() => void navigate('/account')}
          className="flex items-center px-4 py-2 text-left hover:bg-gray-700 rounded-lg"
        >
          <User className="w-5 h-5 mr-2" />
          Account
        </button>
      </div>

      <div className="mb-4 px-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full py-2 px-3 hover:bg-gray-700 rounded-lg"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  )
}
