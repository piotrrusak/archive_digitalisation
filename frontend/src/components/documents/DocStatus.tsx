import type { FC } from 'react'

interface DocStatusProps {
  doc: { id: string; name: string }
}

export const DocStatus: FC<DocStatusProps> = ({ doc }) => {
  // TODO: implement your own status UI logic
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
      Pending
    </span>
  )
}
