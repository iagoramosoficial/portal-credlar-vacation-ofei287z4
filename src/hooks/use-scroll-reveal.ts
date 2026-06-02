import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
  threshold?: number | number[]
  rootMargin?: string
}

export function useScrollReveal(
  options: ScrollRevealOptions = { threshold: 0.1, rootMargin: '0px' },
) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        if (ref.current) observer.unobserve(ref.current)
      }
    }, options)

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current)
    }
  }, [options.threshold, options.rootMargin])

  return { ref, isVisible }
}
