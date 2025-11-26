import type { FC } from 'react'

interface DocStatusProps {
  doc: { id: string; name: string }
}

export const DocStatus: FC<DocStatusProps> = () => {
  // TODO: implement if we have time to include status in documents
  return (
    <span className="inline-flex items-center rounded-full bg-blue-accent px-2 py-0.5 w-[100px] justify-center text-xs text-gray-text">
      Active
    </span>
  )
}
