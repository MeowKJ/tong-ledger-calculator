import { describe, expect, it } from 'vitest'
import { summarizeRecognition } from './calculation'
import { executeCalculationProgram } from './program'
import type { CalculationProgram, VisualExtractionResult } from '../types'

describe('calculation program execution', () => {
  it('turns visual tokens and DSL terms into deterministic entries and totals', () => {
    const extraction: VisualExtractionResult = {
      title: '测试账本',
      sourceType: '手写表格',
      summary: '视觉层只抽取位置和数字。',
      currency: 'CNY',
      overallConfidence: 0.82,
      tokens: [
        {
          id: 't-rate',
          kind: 'multiplier',
          label: '中列倍率',
          rowLabel: '表头',
          columnLabel: '中列',
          rawText: '0.088',
          normalizedText: '0.088',
          numericValue: 0.088,
          candidates: [{ text: '0.088', confidence: 0.9 }],
          confidence: 0.9,
          region: { x: 34, y: 9, width: 5, height: 2 },
          anchor: null,
          note: '',
        },
        {
          id: 't-d5',
          kind: 'number',
          label: '5日中列',
          rowLabel: '5日',
          columnLabel: '中列',
          rawText: '570',
          normalizedText: '570',
          numericValue: 570,
          candidates: [
            { text: '570', confidence: 0.76 },
            { text: '170', confidence: 0.2 },
          ],
          confidence: 0.76,
          region: { x: 37, y: 22, width: 4, height: 2 },
          anchor: null,
          note: '5/1 有轻微歧义',
        },
      ],
      extractedText: ['表头 0.088', '5日 570'],
      auditNotes: [],
    }
    const program: CalculationProgram = {
      dslVersion: 'tong-ledger-dsl/v1',
      title: '测试账本',
      sourceType: '手写表格',
      summary: '按倍率计算。',
      currency: 'CNY',
      calculationFormula: '5日中列 570 x 0.088',
      columnRules: [
        {
          id: 'middle',
          label: '中列',
          multiplier: 0.088,
          evidenceText: 't-rate',
          confidence: 0.9,
        },
      ],
      terms: [
        {
          id: 'd5-middle',
          label: '5日中列',
          rowLabel: '5日',
          sourceTokenIds: ['t-d5'],
          rawText: '570',
          normalizedText: '570',
          rawValue: 570,
          multiplier: 0.088,
          include: true,
          category: '金额',
          confidence: 0.76,
          formula: '570 x 0.088',
          note: '',
        },
      ],
      uncertainMarks: [],
      extractedText: [],
      auditNotes: [],
    }

    const result = executeCalculationProgram(extraction, program)
    const summary = summarizeRecognition(result)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].region).toEqual(extraction.tokens[1].region)
    expect(result.entries[0].calculatedAmount).toBe(50.16)
    expect(summary.total).toBe(50.16)
    expect(result.auditNotes.at(-1)).toContain('前端已按 tong-ledger-dsl/v1')
  })
})
