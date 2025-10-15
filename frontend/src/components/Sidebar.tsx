import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Home, FileText, ScanLine, User, LogOut, UserStar } from 'lucide-react'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    void navigate('/login')
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const baseClasses =
    'flex items-center px-4 py-2 text-left rounded-4xl border transition-all duration-200'
  const inactiveClasses =
    'bg-gray-accent border-gray-outline hover:bg-gray-outline/60 hover:border-gray-text/80'
  const activeClasses = 'bg-gray-outline border-gray-text text-black-base'

  return (
    <div className="h-full bg-gray-base text-black-base flex flex-col p-2 w-[256px] items-center uppercase text-base font-semibold">
      <div className="text-base text-center p-4 font-semibold">Archive Digitalization</div>

      <div className="h-[1px] bg-gray-outline w-full" />

      <div className="flex-1 flex flex-col mt-4 space-y-7 w-[200px]">
        <button
          onClick={() => void navigate('/')}
          className={`${baseClasses} ${isActive('/') ? activeClasses : inactiveClasses}`}
        >
          <Home className="mr-2.5" size={24} />
          Home
        </button>

        <button
          onClick={() => void navigate('/documents')}
          className={`${baseClasses} ${isActive('/documents') ? activeClasses : inactiveClasses}`}
        >
          <FileText className="mr-2.5" size={24} />
          Documents
        </button>

        <button
          onClick={() => void navigate('/scan')}
          className={`${baseClasses} ${isActive('/scan') ? activeClasses : inactiveClasses}`}
        >
          <ScanLine className="mr-2.5" size={24} />
          Scan
        </button>

        <button
          onClick={() => void navigate('/account')}
          className={`${baseClasses} ${isActive('/account') ? activeClasses : inactiveClasses}`}
        >
          <User className="mr-2.5" size={24} />
          Account
        </button>
      </div>

      <div className="flex flex-col-reverse mt-4 gap-7 w-[200px] py-4">
        <button
          onClick={() => void navigate('/admin')}
          className={`${baseClasses} ${isActive('/admin') ? activeClasses : inactiveClasses} order-2`}
        >
          <UserStar className="mr-2.5" size={24} />
          Admin Panel
        </button>

        <button onClick={handleLogout} className={`${baseClasses} ${inactiveClasses} order-1`}>
          <LogOut className="mr-2.5" size={24} />
          Logout
        </button>
      </div>
    </div>
  )
}
