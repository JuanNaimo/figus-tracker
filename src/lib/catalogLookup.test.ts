import { describe, it, expect } from 'vitest'
import { getStickerById, PREFIX_TO_TEAM, VALID_PREFIXES, stickersByPrefix } from './catalogLookup'

describe('catalogLookup', () => {
  it('encuentra figuritas por código', () => {
    const s = getStickerById('ARG5')
    expect(s).toBeDefined()
    expect(s?.number).toBe(5)
    expect(s?.team).toBe('Argentina')
  })

  it('devuelve undefined para códigos inexistentes', () => {
    expect(getStickerById('ARG999')).toBeUndefined()
  })

  it('deriva prefijos válidos del catálogo (ARG, FWC)', () => {
    expect(VALID_PREFIXES.has('ARG')).toBe(true)
    expect(VALID_PREFIXES.has('FWC')).toBe(true)
    expect(PREFIX_TO_TEAM.get('ARG')).toBe('Argentina')
  })

  it('lista las figuritas de un prefijo ordenadas por número', () => {
    const arg = stickersByPrefix('ARG')
    expect(arg.length).toBe(20)
    expect(arg[0].number).toBe(1)
    expect(arg[arg.length - 1].number).toBe(20)
  })
})
