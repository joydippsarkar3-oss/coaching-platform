import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeCanvasProps {
  value: string
  size?: number
  includeMargin?: boolean
  level?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Canvas QR renderer over the `qrcode` package, so marketing collateral can be
 * rasterized with html2canvas alongside the rest of the card.
 */
export function QRCodeCanvas({
  value,
  size = 180,
  includeMargin = false,
  level = 'M',
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    void QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: includeMargin ? 4 : 0,
      errorCorrectionLevel: level,
    })
  }, [value, size, includeMargin, level])

  return <canvas ref={canvasRef} width={size} height={size} />
}

export default QRCodeCanvas
