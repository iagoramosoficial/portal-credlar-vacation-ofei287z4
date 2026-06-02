import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1, rootMargin: '50px' })

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out opacity-0 translate-y-8',
        isVisible ? 'opacity-100 translate-y-0' : '',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
