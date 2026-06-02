import { describe, it, expect } from 'vitest'
import { computeOverall, computeByTeam, countOf } from './stats'
import type { Sticker } from '../types'

const catalog: Sticker[] = [
  { id: 'A-1', number: 1, team: 'A', type: 'player' },
  { id: 'A-2', number: 2, team: 'A', type: 'player' },
  { id: 'B-1', number: 3, team: 'B', type: 'player' },
  { id: 'B-2', number: 4, team: 'B', type: 'player' },
]

describe('countOf', () => {
  it('devuelve 0 si no está', () => {
    expect(countOf({}, 'A-1')).toBe(0)
  })
})

describe('computeOverall', () => {
  it('cuenta tengo/faltan/repes/sobrantes y porcentaje', () => {
    const col = { 'A-1': 1, 'A-2': 3, 'B-1': 0 }
    const s = computeOverall(catalog, col)
    expect(s.total).toBe(4)
    expect(s.owned).toBe(2) // A-1, A-2
    expect(s.missing).toBe(2) // B-1, B-2
    expect(s.duplicates).toBe(1) // A-2
    expect(s.extras).toBe(2) // A-2 tiene 3 => 2 de sobra
    expect(s.percent).toBe(50)
  })
})

describe('computeByTeam', () => {
  it('agrupa por equipo en orden de catálogo', () => {
    const col = { 'A-1': 1, 'B-1': 2 }
    const teams = computeByTeam(catalog, col)
    expect(teams.map((t) => t.team)).toEqual(['A', 'B'])
    expect(teams[0]).toMatchObject({ owned: 1, total: 2, missing: 1, percent: 50, extras: 0 })
    expect(teams[1]).toMatchObject({ owned: 1, total: 2, extras: 1 })
  })
})
