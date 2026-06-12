import { describe, expect, it } from 'vitest'
import { fuseExternalOcrTokens } from './ocrFusion'
import type { ExternalOcrToken, VisualExtractionResult } from '../types'

function extraction(): VisualExtractionResult {
  return {
    title: '测试账本',
    sourceType: '手写表格',
    summary: '',
    currency: 'CNY',
    overallConfidence: 0.9,
    tokens: [
      {
        id: 'visual-d5',
        kind: 'number',
        label: '5日中列',
        rowLabel: '5日',
        columnLabel: '中列',
        rawText: '510',
        normalizedText: '510',
        numericValue: 510,
        candidates: [{ text: '510', confidence: 0.9 }],
        confidence: 0.9,
        region: { x: 36, y: 22, width: 4, height: 2 },
        anchor: null,
        note: '',
      },
    ],
    extractedText: [],
    auditNotes: [],
  }
}

describe('external OCR fusion', () => {
  it('adds a conflicting OCR reading as a candidate without overwriting the visual value', () => {
    const externalTokens: ExternalOcrToken[] = [
      {
        id: 'ocr-d5',
        text: '570',
        confidence: 0.82,
        kind: 'number',
        provider: 'PP-OCRv5',
        region: { x: 36.5, y: 22.2, width: 4, height: 2 },
      },
    ]

    const report = fuseExternalOcrTokens(extraction(), externalTokens)
    const token = report.extraction.tokens[0]

    expect(report.matched).toBe(1)
    expect(report.conflicts).toBe(1)
    expect(token.normalizedText).toBe('510')
    expect(token.candidates.map((candidate) => candidate.text)).toContain('570')
    expect(token.confidence).toBeLessThan(0.9)
    expect(token.note).toContain('PP-OCRv5')
  })

  it('does not inject unmatched OCR detections into billable visual tokens', () => {
    const report = fuseExternalOcrTokens(extraction(), [
      {
        id: 'ocr-noise',
        text: '9999',
        confidence: 0.99,
        kind: 'number',
        region: { x: 80, y: 80, width: 4, height: 2 },
      },
    ])

    expect(report.extraction.tokens).toHaveLength(1)
    expect(report.unmatched).toHaveLength(1)
    expect(report.extraction.auditNotes.at(-1)).toContain('仅保留为复核证据')
  })

  it('ignores low-confidence OCR noise', () => {
    const report = fuseExternalOcrTokens(extraction(), [
      {
        id: 'ocr-low',
        text: '570',
        confidence: 0.2,
        kind: 'number',
        region: { x: 36, y: 22, width: 4, height: 2 },
      },
    ])

    expect(report.matched).toBe(0)
    expect(report.unmatched).toHaveLength(0)
    expect(report.extraction.tokens[0].candidates).toEqual([
      { text: '510', confidence: 0.9 },
    ])
  })
})
