import { describe, expect, it } from 'vitest'
import { applyPaperTemplateRules, DEFAULT_PAPER_TEMPLATE, productColumnsFromText } from './paperTemplates'
import type { RecognitionResult, RecognizedEntry } from '../types'

const baseEntry = (entry: Partial<RecognizedEntry>): RecognizedEntry => ({
  id: entry.id ?? crypto.randomUUID(),
  label: entry.label ?? '纸类1',
  rowLabel: entry.rowLabel ?? '1日',
  rawText: entry.rawText ?? '',
  normalizedText: entry.normalizedText ?? entry.rawText ?? '',
  amount: entry.amount ?? null,
  rawValue: entry.rawValue ?? entry.amount ?? null,
  multiplier: entry.multiplier ?? 1,
  calculatedAmount: entry.calculatedAmount ?? null,
  formula: entry.formula ?? '',
  category: entry.category ?? '金额',
  confidence: entry.confidence ?? 0.9,
  region: entry.region ?? { x: 40, y: 20, width: 4, height: 2 },
  anchor: entry.anchor ?? null,
  note: entry.note ?? '',
})

const baseResult = (entries: RecognizedEntry[]): RecognitionResult => ({
  title: 'test',
  sourceType: 'ledger',
  summary: '',
  currency: 'CNY',
  overallConfidence: 0.9,
  computedTotal: null,
  calculationFormula: '',
  columnRules: [],
  entries,
  uncertainMarks: [],
  extractedText: [],
  auditNotes: [],
})

describe('paper template rules', () => {
  it('excludes attendance marks and half-day marks from money total', () => {
    const result = applyPaperTemplateRules(
      baseResult([
        baseEntry({
          id: 'absent',
          label: '上班',
          rawText: 'X',
          normalizedText: 'X',
          region: { x: 14, y: 10, width: 4, height: 2 },
        }),
        baseEntry({
          id: 'half-day',
          label: '上班',
          rawText: '0.5',
          normalizedText: '0.5',
          amount: 0.5,
          rawValue: 0.5,
          calculatedAmount: 0.5,
          region: { x: 15, y: 40, width: 4, height: 2 },
        }),
        baseEntry({
          id: 'paper',
          rawText: '68',
          normalizedText: '68',
          amount: 68,
          rawValue: 68,
          multiplier: 2.5,
          calculatedAmount: 170,
          region: { x: 31, y: 40, width: 4, height: 2 },
        }),
      ]),
      DEFAULT_PAPER_TEMPLATE,
    )

    expect(result.entries.find((entry) => entry.id === 'absent')?.calculatedAmount).toBeNull()
    expect(result.entries.find((entry) => entry.id === 'half-day')?.category).toBe('出勤')
    expect(result.computedTotal).toBe(170)
  })

  it('does not treat a product quantity of 0.5 outside the attendance column as half-day', () => {
    const result = applyPaperTemplateRules(
      baseResult([
        baseEntry({
          id: 'quantity',
          label: '纸类1',
          rawText: '0.5',
          normalizedText: '0.5',
          amount: 0.5,
          rawValue: 0.5,
          multiplier: 10,
          calculatedAmount: null,
          region: { x: 42, y: 40, width: 4, height: 2 },
        }),
      ]),
      DEFAULT_PAPER_TEMPLATE,
    )

    expect(result.entries[0].category).toBe('金额')
    expect(result.computedTotal).toBe(5)
  })

  it('keeps existing column rule multipliers when recomputing the total', () => {
    const result = applyPaperTemplateRules(
      {
        ...baseResult([
          {
            ...baseEntry({
              id: 'sample-like',
              label: '4日中列',
              rawText: '150',
              normalizedText: '150',
              amount: 150,
              calculatedAmount: null,
            }),
            multiplier: undefined,
          },
        ]),
        columnRules: [
          {
            id: 'rate-middle',
            label: '中列',
            multiplier: 0.088,
            evidenceText: '表头 0.088',
            confidence: 0.9,
          },
        ],
      },
      DEFAULT_PAPER_TEMPLATE,
    )

    expect(result.computedTotal).toBe(13.2)
  })

  it('keeps unloading as direct money and deductions as negative adjustments', () => {
    const result = applyPaperTemplateRules(
      baseResult([
        baseEntry({
          id: 'unload',
          label: '上下货',
          rawText: '99.8元',
          normalizedText: '99.8元',
          amount: 99.8,
          rawValue: 99.8,
          multiplier: 2,
          calculatedAmount: 199.6,
          region: { x: 90, y: 45, width: 6, height: 2 },
        }),
        baseEntry({
          id: 'deduction',
          label: '扣款',
          rawText: '扣款10元',
          normalizedText: '扣款10元',
          amount: 10,
          rawValue: 10,
          multiplier: 1,
          calculatedAmount: 10,
          region: { x: 63, y: 52, width: 8, height: 3 },
        }),
      ]),
      DEFAULT_PAPER_TEMPLATE,
    )

    expect(result.entries.find((entry) => entry.id === 'unload')?.calculatedAmount).toBe(99.8)
    expect(result.entries.find((entry) => entry.id === 'deduction')?.calculatedAmount).toBe(-10)
    expect(result.computedTotal).toBe(89.8)
  })

  it('parses one product column per line', () => {
    expect(productColumnsFromText('大纸=2.5\n小纸=0.5\n散纸')).toEqual([
      { id: 'paper-1', label: '大纸', unitPrice: 2.5 },
      { id: 'paper-2', label: '小纸', unitPrice: 0.5 },
      { id: 'paper-3', label: '散纸', unitPrice: null },
    ])
  })
})
