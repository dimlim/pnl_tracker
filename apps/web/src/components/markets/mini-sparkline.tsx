'use client'

import { useEffect, useRef } from 'react'

interface MiniSparklineProps {
  data: number[]
  color?: 'green' | 'red' | 'blue'
  width?: number
  height?: number
}

export function MiniSparkline({ 
  data, 
  color = 'blue',
  width = 100,
  height = 40 
}: MiniSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Find min and max values
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    // Calculate points
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return { x, y }
    })

    // Set stroke color
    const colors = {
      green: '#10b981',
      red: '#ef4444',
      blue: '#3b82f6',
    }
    ctx.strokeStyle = colors[color]
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Draw line
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()

    // Optional: Fill area under line
    ctx.globalAlpha = 0.1
    ctx.fillStyle = colors[color]
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
  }, [data, color, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="inline-block"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  )
}
