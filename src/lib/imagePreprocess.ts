export interface Region {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Recorta la región guía del video/canvas, la agranda y la binariza para que el
 * OCR lea mejor el código (texto chico de cámara). Devuelve un canvas listo para
 * pasarle a Tesseract.
 */
export function preprocessRegion(
  source: HTMLVideoElement | HTMLCanvasElement,
  region: Region,
  scale = 3,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(region.w * scale)
  canvas.height = Math.round(region.h * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, region.x, region.y, region.w, region.h, 0, 0, canvas.width, canvas.height)

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = img.data

  // 1) Escala de grises + promedio para el umbral.
  const gray = new Uint8ClampedArray(data.length / 4)
  let sum = 0
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const g = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0
    gray[j] = g
    sum += g
  }
  const mean = sum / gray.length

  // 2) Detectar si el fondo es oscuro (texto claro) para invertir.
  const darkBackground = mean < 110

  // 3) Binarizar con un umbral relativo a la media (contraste agresivo).
  const threshold = mean
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    let v = gray[j] > threshold ? 255 : 0
    if (darkBackground) v = 255 - v // texto siempre negro sobre blanco
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

/** Región guía centrada dentro de un alto/ancho dados (ancho ~75%, alto ~22%). */
export function centeredGuide(width: number, height: number): Region {
  const w = Math.round(width * 0.75)
  const h = Math.round(height * 0.22)
  return { x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), w, h }
}
