import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ModelPreview from './ModelPreview'

interface Model {
  title: string
  description: string
}

interface ModelCarouselProps {
  models: Model[]
  selectedIndex: number
  onSelect: (index: number) => void
}

const ModelCarousel: React.FC<ModelCarouselProps> = ({ models, selectedIndex, onSelect }) => {
  const visibleCount = 4
  const [offset, setOffset] = useState(0)

  const prev = () => {
    setOffset((prevOffset) => (prevOffset - 1 + models.length) % models.length)
  }

  const next = () => {
    setOffset((prevOffset) => (prevOffset + 1) % models.length)
  }

  const getVisibleModels = () => {
    const result = []
    for (let i = 0; i < visibleCount; i++) {
      result.push(models[(offset + i) % models.length])
    }
    return result
  }

  const visibleModels = getVisibleModels()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="p-2 bg-gray-outline rounded-full hover:bg-gray-hover transition-colors"
      >
        <ChevronLeft />
      </button>

      <div className="flex justify-evenly items-center w-[1200px]">
        {visibleModels.map((model, i) => {
          const globalIndex = (offset + i) % models.length
          return (
            <ModelPreview
              key={globalIndex}
              modelTitle={model.title}
              modelDescription={model.description}
              selected={selectedIndex === globalIndex}
              onClick={() => {
                onSelect(globalIndex)
              }}
            />
          )
        })}
      </div>

      <button
        onClick={next}
        className="p-2 bg-gray-outline rounded-full hover:bg-gray-hover transition-colors"
      >
        <ChevronRight />
      </button>
    </div>
  )
}

export default ModelCarousel
