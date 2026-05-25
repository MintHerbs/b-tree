import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('smiles-drawer', () => ({
  default: {
    SvgDrawer: vi.fn().mockImplementation(() => ({
      draw: vi.fn(),
    })),
    parse: vi.fn((smiles, success, error) => {
      if (smiles === 'INVALID') error('bad smiles')
      else success({})
    }),
  },
}))

import SmilesDrawer from 'smiles-drawer'
import * as chemUtils from './chemUtils.js'

const pubChemSuccess = {
  PropertyTable: {
    Properties: [{ IsomericSMILES: 'C1=CC=CC=C1' }],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = vi.fn()
  vi.spyOn(document, 'createElementNS').mockImplementation(() => ({}))
  globalThis.XMLSerializer = vi.fn().mockImplementation(() => ({
    serializeToString: vi.fn(() => '<svg></svg>'),
  }))
})

describe('isSmilesString', () => {
  it('returns true for "C1=CC=CC=C1" (contains = and digits)', () => {
    expect(chemUtils.isSmilesString('C1=CC=CC=C1')).toBe(true)
  })

  it('returns true for "CC(=O)O" (contains parentheses)', () => {
    expect(chemUtils.isSmilesString('CC(=O)O')).toBe(true)
  })

  it('returns false for "benzene"', () => {
    expect(chemUtils.isSmilesString('benzene')).toBe(false)
  })

  it('returns false for "sulfuric acid"', () => {
    expect(chemUtils.isSmilesString('sulfuric acid')).toBe(false)
  })

  it('returns false for "water"', () => {
    expect(chemUtils.isSmilesString('water')).toBe(false)
  })
})

describe('nameToSmiles', () => {
  it('calls PubChem API with encoded compound name', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(pubChemSuccess),
    })

    await chemUtils.nameToSmiles('sulfuric acid')

    expect(fetch).toHaveBeenCalledWith(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/sulfuric%20acid/property/IsomericSMILES/JSON'
    )
  })

  it('returns SMILES string on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(pubChemSuccess),
    })

    await expect(chemUtils.nameToSmiles('benzene')).resolves.toBe('C1=CC=CC=C1')
  })

  it('throws with descriptive message on 404', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(chemUtils.nameToSmiles('benzene')).rejects.toThrow(
      'Compound "benzene" not found in PubChem'
    )
  })

  it('throws with descriptive message on network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(chemUtils.nameToSmiles('benzene')).rejects.toThrow('Network error')
  })
})

describe('smilesToSvgDataUrl', () => {
  it('returns a string starting with "data:image/svg+xml;base64,"', async () => {
    await expect(chemUtils.smilesToSvgDataUrl('C1=CC=CC=C1')).resolves.toMatch(
      /^data:image\/svg\+xml;base64,/
    )
  })

  it('rejects with "Invalid SMILES" message for invalid input', async () => {
    await expect(chemUtils.smilesToSvgDataUrl('INVALID')).rejects.toThrow(
      'Invalid SMILES: bad smiles'
    )
  })
})

describe('inputToSvgDataUrl', () => {
  it('calls nameToSmiles when input is a name', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(pubChemSuccess),
    })

    const result = await chemUtils.inputToSvgDataUrl('benzene')

    expect(fetch).toHaveBeenCalled()
    expect(fetch.mock.calls[0][0]).toContain('pubchem.ncbi.nlm.nih.gov')
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it('calls smilesToSvgDataUrl directly when input is SMILES', async () => {
    const result = await chemUtils.inputToSvgDataUrl('C1=CC=CC=C1')

    expect(fetch).not.toHaveBeenCalled()
    expect(SmilesDrawer.parse).toHaveBeenCalled()
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it('returns data URL on valid input', async () => {
    await expect(chemUtils.inputToSvgDataUrl('C1=CC=CC=C1')).resolves.toMatch(
      /^data:image\/svg\+xml;base64,/
    )
  })
})
