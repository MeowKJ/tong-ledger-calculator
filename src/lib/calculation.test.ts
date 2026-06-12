import { describe, expect, it } from 'vitest'
import { SAMPLE_RECOGNITION } from '../data/sampleRecognition'
import { getConfidenceLevel, getEntryCalculatedAmount, summarizeRecognition } from './calculation'

describe('ledger calculation', () => {
  it('sums recognized amount entries', () => {
    const summary = summarizeRecognition(SAMPLE_RECOGNITION)

    expect(summary.countedEntries).toBe(34)
    const entryTotal = SAMPLE_RECOGNITION.entries.reduce(
      (total, entry) => total + (getEntryCalculatedAmount(SAMPLE_RECOGNITION, entry) ?? 0),
      0,
    )

    expect(summary.total).toBe(2860.38)
    expect(Math.round(entryTotal * 100) / 100).toBe(2860.38)
  })

  it('maps confidence into display levels', () => {
    expect(getConfidenceLevel(0.9)).toBe('high')
    expect(getConfidenceLevel(0.7)).toBe('medium')
    expect(getConfidenceLevel(0.4)).toBe('low')
  })
})
