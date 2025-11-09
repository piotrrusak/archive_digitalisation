import React, { useEffect, useState } from 'react'

interface FilePreviewProps {
  file: File
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'unknown'
  const name = file.name.replace(/\.[^/.]+$/, '') // remove extension from display name

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const renderPreview = () => {
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      return previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-[150px] h-[150px] object-cover rounded-3xl"
        />
      ) : (
        <div className="w-[150px] h-[150px] bg-gray-200 rounded-3xl flex items-center justify-center text-gray-500 text-sm">
          Loading...
        </div>
      )
    }

    if (extension === 'pdf') {
      return previewUrl ? (
        <iframe
          src={previewUrl + '#toolbar=0'}
          title={file.name}
          className="w-[150px] h-[150px] rounded-3xl border border-gray-200"
        />
      ) : (
        <div className="w-[150px] h-[150px] bg-gray-200 rounded-3xl flex items-center justify-center text-gray-500 text-sm">
          Loading...
        </div>
      )
    }

    return (
      <div className="w-[150px] h-[150px] bg-gray-200 rounded-3xl flex items-center justify-center text-gray-500 text-sm">
        No preview
      </div>
    )
  }

  return (
    <div className="flex flex-col p-3 gap-1.5 items-center shadow-md hover:shadow-lg transition-all">
      {renderPreview()}
      <span className="text-black-base text-sm text-center truncate w-[150px]">
        {name}.{extension}
      </span>
    </div>
  )
}

export default FilePreview
