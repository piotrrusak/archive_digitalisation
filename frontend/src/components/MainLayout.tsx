import Sidebar from './Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />

      {/* 1. Dodaj flex-col i h-full do elementu <main> */}
      <main className="flex-1 flex flex-col pt-10 pb-2.5 pr-5 overflow-y-auto bg-gray-base">
        {/* 2. Zmień min-h-full na h-full. Dodaj flex-1, aby ten kontener z białym tłem 
            rozciągnął się na całą wysokość elementu <main>. */}
        <div className="p-8 bg-white-base border border-gray-outline rounded-3xl **h-full flex-1** text-black-base">
          {children}
        </div>
      </main>
    </div>
  )
}
