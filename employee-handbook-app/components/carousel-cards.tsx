import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CarouselCard } from '@/types/ai'

interface CarouselCardsProps {
  cards: CarouselCard[]
}

export function CarouselCards({ cards }: CarouselCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? cards.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % cards.length
    )
  }

  if (cards.length === 0) return null

  return (
    <div className="relative w-full max-w-4xl mx-auto my-4">
      <div className="overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 px-4"
            >
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                {card.icon && (
                  <div className="text-3xl mb-3">{card.icon}</div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {card.title}
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {card.content}
                </div>
                {card.action && (
                  <a
                    href={card.action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    {card.action.text}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cards.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:shadow-lg transition"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:shadow-lg transition"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </>
      )}

      {cards.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}