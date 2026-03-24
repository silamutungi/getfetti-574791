import { useEffect, useState, type CSSProperties } from 'react'

const COLORS = ['#c8f060', '#ff7b54', '#1a1410', '#fdf8f0', '#8ab800', '#ffe29a', '#ffb347']
type Shape = 'square' | 'rect' | 'circle'
const SHAPES: Shape[] = ['square', 'rect', 'circle']

interface Piece {
  id: number
  left: number
  color: string
  shape: Shape
  w: number
  h: number
  duration: number
  delay: number
  drift: number
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    const base = 6 + Math.random() * 9
    return {
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape,
      w: shape === 'rect' ? base * 1.8 : base,
      h: shape === 'rect' ? base * 0.55 : shape === 'circle' ? base : base,
      duration: 1.9 + Math.random() * 1.3,
      delay: Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 80,
    }
  })
}

interface ConfettiProps {
  active: boolean
  count?: number
}

export default function Confetti({ active, count = 50 }: ConfettiProps) {
  const [pieces] = useState<Piece[]>(() => makePieces(count))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [active])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 999 }}
    >
      {pieces.map(p => (
        <div
          key={p.id}
          style={
            {
              position: 'absolute',
              top: 0,
              left: `${p.left}%`,
              width: `${p.w}px`,
              height: `${p.h}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              '--drift': `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
