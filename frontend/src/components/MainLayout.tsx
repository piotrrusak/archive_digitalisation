import Sidebar from './Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-gray-base">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-10 pb-2.5 pr-5 bg-gray-base">
        <div className="p-8 bg-white-base border border-gray-outline rounded-3xl min-h-full text-black-base">
          {children}
        </div>
      </main>
    </div>
  )
}
