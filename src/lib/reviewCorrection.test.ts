import { describe, expect, it } from 'vitest'
import { SAMPLE_RECOGNITION } from '../data/sampleRecognition'
import { correctRecognitionValue } from './reviewCorrection'

describe('review correction', () => {
  it('preserves the inferred column multiplier and recalculates the total', () => {
    const corrected = correctRecognitionValue(SAMPLE_RECOGNITION, 'u-4a', '884')
    const entry = corrected.entries.find((item) => item.id === 'd4-a')
    const mark = corrected.uncertainMarks.find((item) => item.id === 'u-4a')

    expect(entry?.rawValue).toBe(884)
    expect(entry?.multiplier).toBe(0.1)
    expect(entry?.calculatedAmount).toBeCloseTo(88.4)
    expect(corrected.computedTotal).toBe(2890.38)
    expect(mark?.confidence).toBe(1)
    expect(mark?.candidates).toEqual(['884'])
  })

  it('leaves the result unchanged for invalid input', () => {
    expect(correctRecognitionValue(SAMPLE_RECOGNITION, 'u-4a', 'abc')).toBe(
      SAMPLE_RECOGNITION,
    )
  })
})
