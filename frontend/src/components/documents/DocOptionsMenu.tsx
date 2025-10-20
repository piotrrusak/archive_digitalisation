import { useState, useRef, useEffect } from 'react'
import { Ellipsis } from 'lucide-react'

import type { FC } from 'react';

interface DocOptionsMenuProps {
  doc: { id: string; name: string }
}

export const DocOptionsMenu: FC<DocOptionsMenuProps> = ({ doc }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-full hover:bg-gray-100"
      >
        <Ellipsis className="h-5 w-5 text-gray-600" />
      </button>

    {/* TODO: Finish */}

      {open && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg z-10">
          <ul className="py-1 text-sm text-gray-700">
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Option A</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Option B</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Option C</li>
          </ul>
        </div>
      )}
    </div>
  )
}
