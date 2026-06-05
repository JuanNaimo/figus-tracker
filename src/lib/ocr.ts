import type { Worker } from 'tesseract.js'

const WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

let workerPromise: Promise<Worker> | null = null

/** Crea (una sola vez) el worker de Tesseract. Se importa de forma perezosa para
 *  no inflar el bundle inicial; el modelo se baja del CDN de tesseract.js. */
function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js')
      const worker = await createWorker('eng')
      await worker.setParameters({
        tessedit_char_whitelist: WHITELIST,
        tessedit_pageseg_mode: PSM.SINGLE_LINE, // el código es una línea corta
      })
      return worker
    })()
  }
  return workerPromise
}

export interface OcrRead {
  text: string
  confidence: number
}

/** Corre OCR sobre un canvas ya preprocesado. */
export async function recognizeRegion(canvas: HTMLCanvasElement): Promise<OcrRead> {
  const worker = await getWorker()
  const { data } = await worker.recognize(canvas)
  return { text: data.text ?? '', confidence: data.confidence ?? 0 }
}

/** Libera el worker (llamar al salir del escáner). */
export async function terminateOcr(): Promise<void> {
  if (!workerPromise) return
  const w = workerPromise
  workerPromise = null
  try {
    ;(await w).terminate()
  } catch {
    /* ya terminado: ignorar */
  }
}
