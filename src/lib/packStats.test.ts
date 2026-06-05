import { describe, it, expect } from 'vitest'
import { summarizePacks, buildTimeline, predict, expectedPacksToComplete } from './packStats'
import type { PackEvent } from '../types'

function pack(p: Partial<PackEvent>): PackEvent {
  return { id: 'x', date: '2026-01-01', packs: 1, cost: 100, newCount: 3, ownedAfter: 3, ...p }
}

describe('summarizePacks', () => {
  it('agrega sobres, costo y nuevas', () => {
    const s = summarizePacks([
      pack({ packs: 2, cost: 200, newCount: 6 }),
      pack({ packs: 1, cost: 100, newCount: 2 }),
    ])
    expect(s.entries).toBe(2)
    expect(s.totalPacks).toBe(3)
    expect(s.totalCost).toBe(300)
    expect(s.totalNew).toBe(8)
    expect(s.avgCostPerPack).toBe(100)
    expect(s.costPerNew).toBe(37.5)
  })

  it('no divide por cero con lista vacía', () => {
    const s = summarizePacks([])
    expect(s).toMatchObject({ totalPacks: 0, avgCostPerPack: 0, costPerNew: 0, avgNewPerPack: 0 })
  })
})

describe('buildTimeline', () => {
  it('ordena por fecha y agrega el estado actual', () => {
    const points = buildTimeline(
      [
        pack({ date: '2026-02-01', ownedAfter: 10 }),
        pack({ date: '2026-01-01', ownedAfter: 5 }),
      ],
      12, // owned actual
      100, // total
      '2026-03-01',
    )
    expect(points.map((p) => p.owned)).toEqual([5, 10, 12])
    expect(points[0].percent).toBe(5)
    expect(points[2]).toMatchObject({ date: '2026-03-01', percent: 12 })
  })

  it('no duplica el punto actual si coincide con el último', () => {
    const points = buildTimeline([pack({ date: '2026-01-01', ownedAfter: 12 })], 12, 100, '2026-03-01')
    expect(points).toHaveLength(1)
  })
})

describe('expectedPacksToComplete', () => {
  it('es 0 si ya está completo', () => {
    expect(expectedPacksToComplete(100, 100)).toBe(0)
    expect(expectedPacksToComplete(120, 100)).toBe(0)
  })

  it('crece con los rendimientos decrecientes (la cola es cara)', () => {
    // Las últimas 10 de 100 cuestan más sobres por figu que las primeras 10.
    const primeras = expectedPacksToComplete(0, 100) - expectedPacksToComplete(10, 100)
    const ultimas = expectedPacksToComplete(90, 100)
    expect(ultimas).toBeGreaterThan(primeras)
  })

  it('con álbum casi lleno, la última figurita cuesta ~total/packSize sobres', () => {
    // Última de 100 con sobres de 5: ~100/5 = 20 sobres esperados.
    expect(expectedPacksToComplete(99, 100, 5)).toBeGreaterThan(15)
  })
})

describe('predict', () => {
  it('estima sobres (modelo) y costo según el gasto real', () => {
    const s = summarizePacks([pack({ packs: 10, cost: 1000, newCount: 20 })]) // $100/sobre
    const p = predict(s, 50, 100) // owned 50, total 100
    expect(p.missing).toBe(50)
    expect(p.packsToFinish).toBe(expectedPacksToComplete(50, 100))
    expect(p.costToFinish).toBe(p.packsToFinish * 100)
    expect(p.avgNewPerPack).toBe(2)
  })

  it('estima sobres aunque no haya historial, pero sin costo', () => {
    const p = predict(summarizePacks([]), 50, 100)
    expect(p.packsToFinish).toBeGreaterThan(0)
    expect(p.costToFinish).toBeNull()
  })

  it('devuelve 0 sobres y 0 faltan si ya está completo', () => {
    const s = summarizePacks([pack({ packs: 10, cost: 1000, newCount: 20 })])
    const p = predict(s, 100, 100)
    expect(p.missing).toBe(0)
    expect(p.packsToFinish).toBe(0)
  })
})
