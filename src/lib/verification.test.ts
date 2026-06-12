import { describe, expect, it } from 'vitest'
import { SAMPLE_RECOGNITION } from '../data/sampleRecognition'
import { normalizeResultCells } from './ledgerCells'
import { DEFAULT_PAPER_TEMPLATE } from './paperTemplates'
import { buildVerificationQueue, getVerificationProgress } from './verification'

describe('verification queue', () => {
  it('prioritizes risky evidence without dropping fixed-grid risks', () => {
    const queue = buildVerificationQueue(SAMPLE_RECOGNITION)

    expect(queue[0].kind).toBe('uncertain')
    expect(queue.some((item) => item.kind === 'rule')).toBe(true)
  })

  it('keeps every unedited risky cell in the review queue', () => {
    const result = normalizeResultCells(SAMPLE_RECOGNITION, DEFAULT_PAPER_TEMPLATE)
    const queue = buildVerificationQueue(result)
    const riskyCellIds =
      result.cells
        ?.filter(
          (cell) =>
            cell.columnKind !== 'date' &&
            cell.columnKind !== 'dailyTotal' &&
            cell.riskFlags.length > 0 &&
            !cell.riskFlags.includes('userEdited'),
        )
        .map((cell) => cell.id) ?? []

    expect(riskyCellIds.length).toBeGreaterThan(100)
    for (const cellId of riskyCellIds) {
      expect(queue.some((item) => item.kind === 'cell' && item.targetId === cellId)).toBe(true)
    }
  })

  it('tracks completed verification items', () => {
    const queue = buildVerificationQueue(SAMPLE_RECOGNITION)
    const progress = getVerificationProgress(queue, { [queue[0].id]: 'confirmed' })

    expect(progress.completed).toBe(1)
    expect(progress.remaining).toBe(queue.length - 1)
  })
})
