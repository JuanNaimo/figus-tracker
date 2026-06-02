import { describe, it, expect } from 'vitest'
import { toJsonBackup, parseJsonBackup, toCsv, parseCsv } from './importExport'
import type { Sticker } from '../types'

const catalog: Sticker[] = [
  { id: 'A-1', number: 1, team: 'Argentina', type: 'player', label: 'Messi, Lionel' },
  { id: 'A-2', number: 2, team: 'Argentina', type: 'player', label: 'Di María' },
]

describe('JSON backup', () => {
  it('round-trip preserva la colección', () => {
    const col = { 'A-1': 1, 'A-2': 3 }
    const text = toJsonBackup(col, '2026-06-02T00:00:00.000Z')
    expect(parseJsonBackup(text)).toEqual(col)
  })

  it('descarta cantidades <= 0 e inválidas', () => {
    const text = JSON.stringify({ collection: { 'A-1': 0, 'A-2': 2, 'A-3': 'x' } })
    expect(parseJsonBackup(text)).toEqual({ 'A-2': 2 })
  })

  it('lanza con JSON inválido', () => {
    expect(() => parseJsonBackup('{no json')).toThrow()
  })
})

describe('CSV', () => {
  it('exporta con header y escapa comas', () => {
    const csv = toCsv(catalog, { 'A-1': 2 })
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('numero,equipo,label,cantidad')
    expect(lines[1]).toBe('1,Argentina,"Messi, Lionel",2')
    expect(lines[2]).toBe('2,Argentina,Di María,0')
  })

  it('importa mapeando por equipo + numero', () => {
    const csv = 'numero,equipo,label,cantidad\r\n1,Argentina,Messi,2\r\n2,Argentina,Di Maria,0'
    expect(parseCsv(csv, catalog)).toEqual({ 'A-1': 2 })
  })

  it('distingue el mismo numero en equipos distintos', () => {
    const cat = [
      { id: 'A-1', number: 1, team: 'Argentina', type: 'player' as const },
      { id: 'B-1', number: 1, team: 'Brasil', type: 'player' as const },
    ]
    const csv = 'numero,equipo,cantidad\r\n1,Argentina,2\r\n1,Brasil,3'
    expect(parseCsv(csv, cat)).toEqual({ 'A-1': 2, 'B-1': 3 })
  })

  it('lanza si faltan columnas', () => {
    expect(() => parseCsv('foo,bar\n1,2', catalog)).toThrow()
  })
})
