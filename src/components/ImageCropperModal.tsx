import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export interface ImageCropperModalProps {
  open: boolean
  imageSrc: string | null
  originalFileName?: string
  onClose: () => void
  onConfirm: (croppedFile: File, previewUrl: string) => void
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  open,
  imageSrc,
  originalFileName = 'foto-perfil.jpg',
  onClose,
  onConfirm,
}) => {
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef<boolean>(false)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const positionStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialTouchDistanceRef = useRef<number | null>(null)
  const initialScaleOnTouchRef = useRef<number>(1)

  // Reset state when a new image is provided or modal opens
  useEffect(() => {
    if (open && imageSrc) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setImageLoaded(false)

      const img = new Image()
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
        setImageLoaded(true)
      }
      img.src = imageSrc
    }
  }, [open, imageSrc])

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    positionStartRef.current = { ...position }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Touch handlers for Mobile (Drag and Pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      positionStartRef.current = { ...position }
      initialTouchDistanceRef.current = null
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      initialTouchDistanceRef.current = dist
      initialScaleOnTouchRef.current = scale
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      })
    } else if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const ratio = currentDist / initialTouchDistanceRef.current
      const newScale = Math.min(3, Math.max(1, initialScaleOnTouchRef.current * ratio))
      setScale(newScale)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isDraggingRef.current = false
      initialTouchDistanceRef.current = null
    } else if (e.touches.length === 1) {
      // Switched from pinch to single finger
      isDraggingRef.current = true
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      positionStartRef.current = { ...position }
      initialTouchDistanceRef.current = null
    }
  }

  // Wheel zoom on desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.002
    setScale((prev) => Math.min(3, Math.max(1, prev + delta)))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Generate 800x800 square JPEG canvas output with ~0.85 quality
  const handleCropAndSave = () => {
    if (!imageSrc || !containerRef.current || naturalSize.width === 0) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerSize = containerRect.width // 1:1 box

    // Dimensions of image rendered at scale 1 (cover)
    const aspectImg = naturalSize.width / naturalSize.height
    let baseRenderW = containerSize
    let baseRenderH = containerSize
    if (aspectImg >= 1) {
      // Landscape or square: height fits, width exceeds
      baseRenderH = containerSize
      baseRenderW = containerSize * aspectImg
    } else {
      // Portrait: width fits, height exceeds
      baseRenderW = containerSize
      baseRenderH = containerSize / aspectImg
    }

    const currentRenderW = baseRenderW * scale
    const currentRenderH = baseRenderH * scale

    // Image center relative to container center
    // When position is {0, 0}, image is centered in container:
    // Left of image relative to container top-left:
    const imgLeftInContainer = (containerSize - currentRenderW) / 2 + position.x
    const imgTopInContainer = (containerSize - currentRenderH) / 2 + position.y

    // We want the region in the source image corresponding to container [0, containerSize]
    // The ratio of source image pixel to rendered pixel is naturalSize.width / currentRenderW
    const pixelRatio = naturalSize.width / currentRenderW

    const sourceCropX = (0 - imgLeftInContainer) * pixelRatio
    const sourceCropY = (0 - imgTopInContainer) * pixelRatio
    const sourceCropW = containerSize * pixelRatio
    const sourceCropH = containerSize * pixelRatio

    const canvas = document.createElement('canvas')
    const OUTPUT_SIZE = 800
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Fill white background just in case
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(
        img,
        sourceCropX,
        sourceCropY,
        sourceCropW,
        sourceCropH,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const baseName = originalFileName.replace(/\.[^/.]+$/, '')
          const fileName = `${baseName || 'foto-recortada'}.jpg`
          const file = new File([blob], fileName, { type: 'image/jpeg' })
          const previewUrl = URL.createObjectURL(blob)
          onConfirm(file, previewUrl)
        },
        'image/jpeg',
        0.85,
      )
    }
    img.src = imageSrc
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-lg p-5 sm:p-6 select-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Move className="w-5 h-5 text-brand-orange" />
            <span>Enquadrar Foto de Perfil</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-600 leading-relaxed">
            Ajuste a imagem dentro do quadro quadrado. Arraste para mover e use a barra ou pinça
            para dar zoom.
          </DialogDescription>
        </DialogHeader>

        {/* Viewport de Recorte 1:1 */}
        <div className="flex flex-col items-center justify-center my-2">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-brand-orange/60 shadow-inner bg-neutral-900 overflow-hidden relative cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center"
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Para recortar"
                draggable={false}
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width:
                    naturalSize.width >= naturalSize.height
                      ? `${(naturalSize.width / naturalSize.height) * 100}%`
                      : '100%',
                  height:
                    naturalSize.width < naturalSize.height
                      ? `${(naturalSize.height / naturalSize.width) * 100}%`
                      : '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                  opacity: imageLoaded ? 1 : 0,
                  transition: isDraggingRef.current ? 'none' : 'opacity 0.2s ease',
                }}
                className="select-none"
              />
            )}

            {/* Guia de grade 3x3 sutil sobreposta */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-white/15" />
              <div className="border-r border-white/15" />
              <div />
            </div>

            {/* Dica de arraste */}
            <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
              <span className="text-[10px] bg-black/60 text-white/90 px-2 py-0.5 rounded-full backdrop-blur-xs">
                Toque e arraste para posicionar
              </span>
            </div>
          </div>
        </div>

        {/* Controles de Zoom e Reset */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 px-1">
            <ZoomOut className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-brand-orange h-2 bg-neutral-200 rounded-lg cursor-pointer"
              aria-label="Controle deslizante de zoom"
            />
            <ZoomIn className="w-4 h-4 text-neutral-500 shrink-0" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-neutral-600 hover:text-neutral-900 h-8 px-2 shrink-0 gap-1"
              title="Centralizar e redefinir zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redefinir</span>
            </Button>
          </div>

          <p className="text-[11px] text-neutral-500 text-center">
            A imagem final será exportada em formato quadrado de 800×800 pixels.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between flex-col sm:flex-row pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-neutral-300 text-neutral-700 text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCropAndSave}
            className="bg-gradient-brand text-white hover:opacity-90 text-xs font-semibold px-5"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Confirmar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
