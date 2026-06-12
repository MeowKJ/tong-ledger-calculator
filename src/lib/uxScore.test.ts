import { describe, expect, it } from 'vitest'
import { SAMPLE_RECOGNITION } from '../data/sampleRecognition'
import { normalizeResultCells } from './ledgerCells'
import { DEFAULT_PAPER_TEMPLATE } from './paperTemplates'
import { evaluateMobileAuditUx } from './uxScore'

describe('mobile audit UX scoring', () => {
  it('scores the fixed-grid sample as S level when evidence and review flow are present', () => {
    const result = normalizeResultCells(SAMPLE_RECOGNITION, DEFAULT_PAPER_TEMPLATE)
    const evaluation = evaluateMobileAuditUx(result)

    expect(evaluation.grade).toBe('S')
    expect(evaluation.score).toBe(100)
    expect(evaluation.criteria.every((criterion) => criterion.passed)).toBe(true)
  })
})
