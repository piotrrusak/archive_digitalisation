import Sidebar from './Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto bg-gray-600">{children}</main>
    </div>
  )
}
