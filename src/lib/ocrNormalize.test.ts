import { describe, it, expect } from 'vitest'
import { normalizeCode } from './ocrNormalize'

describe('normalizeCode — match exacto', () => {
  it('reconoce un código limpio', () => {
    const r = normalizeCode('ARG5')
    expect(r.match?.id).toBe('ARG5')
    expect(r.corrected).toBe(false)
  })

  it('ignora mayúsculas, espacios y guiones', () => {
    expect(normalizeCode('arg 5').match?.id).toBe('ARG5')
    expect(normalizeCode('  ARG-5 ').match?.id).toBe('ARG5')
  })

  it('reconoce especiales (FWC y 00)', () => {
    expect(normalizeCode('FWC9').match?.id).toBe('FWC9')
    expect(normalizeCode('00').match?.id).toBe('00')
  })
})

describe('normalizeCode — corrige errores típicos de OCR', () => {
  it('S→5 en el número (ARGS → ARG5)', () => {
    const r = normalizeCode('ARGS')
    expect(r.match?.id).toBe('ARG5')
    expect(r.corrected).toBe(true)
  })

  it('l/I→1 en el número (ARGl → ARG1)', () => {
    expect(normalizeCode('ARGl').match?.id).toBe('ARG1')
    expect(normalizeCode('ARGI').match?.id).toBe('ARG1')
  })

  it('dígito→letra en el prefijo (4RG5 → ARG5)', () => {
    const r = normalizeCode('4RG5')
    expect(r.match?.id).toBe('ARG5')
    expect(r.corrected).toBe(true)
  })

  it('O→0 en el especial (O0 → 00)', () => {
    const r = normalizeCode('O0')
    expect(r.match?.id).toBe('00')
    expect(r.corrected).toBe(true)
  })
})

describe('normalizeCode — sin match', () => {
  it('número fuera de rango devuelve candidatos cercanos', () => {
    const r = normalizeCode('ARG21') // Argentina llega hasta 20
    expect(r.match).toBeNull()
    expect(r.candidates.map((s) => s.id)).toContain('ARG20')
  })

  it('texto sin sentido no matchea', () => {
    expect(normalizeCode('XQXQ').match).toBeNull()
  })

  it('cadena vacía', () => {
    const r = normalizeCode('   ')
    expect(r.match).toBeNull()
    expect(r.candidates).toEqual([])
  })
})
