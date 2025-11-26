import clsx from 'clsx'

interface ModelPreviewProps {
  modelName: string
  modelDescription?: string
  selected: boolean
  onClick: () => void
}

const ModelPreview: React.FC<ModelPreviewProps> = ({
  modelName,
  modelDescription = '',
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-start gap-2 transition-all duration-200 ease-out',
        'w-[220px] h-[310px] rounded-2xl border shadow-sm p-3',
        selected
          ? 'bg-blue-accent border-blue-outline scale-[1.03]'
          : 'bg-white-base border-gray-200 hover:shadow-md hover:-translate-y-1 hover:border-blue-outline',
      )}
    >
      <div
        className={clsx('w-[190px] h-[190px] rounded-xl', selected ? 'bg-blue-200' : 'bg-gray-100')}
      />
      <span
        className={clsx(
          'text-lg font-semibold text-center',
          selected ? 'text-blue-900' : 'text-black-base',
        )}
      >
        {modelName}
      </span>
      <p className="text-xs text-gray-text text-center px-1">{modelDescription}</p>
    </button>
  )
}

export default ModelPreview
