import type {
  CalculationProgram,
  CalculationTerm,
  ImageRegion,
  RecognitionResult,
  RecognizedEntry,
  VisualExtractionResult,
  VisualToken,
} from '../types'

const EMPTY_REGION: ImageRegion = { x: 50, y: 50, width: 4, height: 2 }

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function calculatedAmount(term: CalculationTerm) {
  if (!term.include) return null
  if (typeof term.rawValue !== 'number' || !Number.isFinite(term.rawValue)) return null
  const multiplier =
    typeof term.multiplier === 'number' && Number.isFinite(term.multiplier)
      ? term.multiplier
      : 1
  return roundMoney(term.rawValue * multiplier)
}

function tokenForTerm(tokensById: Map<string, VisualToken>, term: CalculationTerm) {
  return term.sourceTokenIds.map((id) => tokensById.get(id)).find(Boolean) ?? null
}

function entryFromTerm(
  tokensById: Map<string, VisualToken>,
  term: CalculationTerm,
): RecognizedEntry | null {
  const amount = calculatedAmount(term)
  if (!term.include || amount === null) return null

  const token = tokenForTerm(tokensById, term)
  const rawText = term.rawText || token?.rawText || ''
  const normalizedText = term.normalizedText || token?.normalizedText || rawText
  const rawValue =
    typeof term.rawValue === 'number' && Number.isFinite(term.rawValue)
      ? term.rawValue
      : token?.numericValue ?? null

  return {
    id: term.id,
    label: term.label || token?.label || term.id,
    rowLabel: term.rowLabel || token?.rowLabel || '',
    rawText,
    normalizedText,
    amount: rawValue,
    rawValue,
    multiplier:
      typeof term.multiplier === 'number' && Number.isFinite(term.multiplier)
        ? term.multiplier
        : 1,
    calculatedAmount: amount,
    formula: term.formula,
    category: term.category || '金额',
    confidence: clampConfidence(Math.min(term.confidence, token?.confidence ?? term.confidence)),
    region: token?.region ?? EMPTY_REGION,
    anchor: token?.anchor ?? null,
    note: term.note,
  }
}

export function executeCalculationProgram(
  extraction: VisualExtractionResult,
  program: CalculationProgram,
): RecognitionResult {
  const tokensById = new Map(extraction.tokens.map((token) => [token.id, token]))
  const entries = program.terms
    .map((term) => entryFromTerm(tokensById, term))
    .filter((entry): entry is RecognizedEntry => Boolean(entry))
  const total = roundMoney(
    entries.reduce((sum, entry) => sum + (entry.calculatedAmount ?? 0), 0),
  )
  const confidenceValues = [
    extraction.overallConfidence,
    ...entries.map((entry) => entry.confidence),
    ...program.columnRules.map((rule) => rule.confidence),
  ]
  const overallConfidence = clampConfidence(
    confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : extraction.overallConfidence,
  )

  return {
    title: program.title || extraction.title,
    sourceType: program.sourceType || extraction.sourceType,
    summary: program.summary || extraction.summary,
    currency: program.currency || extraction.currency,
    overallConfidence,
    computedTotal: total,
    calculationFormula: program.calculationFormula,
    calculationProgram: program,
    columnRules: program.columnRules,
    entries,
    uncertainMarks: program.uncertainMarks,
    extractedText: program.extractedText.length ? program.extractedText : extraction.extractedText,
    auditNotes: [
      ...program.auditNotes,
      '前端已按 tong-ledger-dsl/v1 重新执行计算；合计不直接采用模型口述结果。',
    ],
    visualTokens: extraction.tokens,
  }
}

export function normalizeRecognitionResult(result: RecognitionResult): RecognitionResult {
  const computedTotal = roundMoney(
    result.entries.reduce((sum, entry) => {
      if (typeof entry.calculatedAmount === 'number' && Number.isFinite(entry.calculatedAmount)) {
        return sum + entry.calculatedAmount
      }

      const rawValue =
        typeof entry.rawValue === 'number' && Number.isFinite(entry.rawValue)
          ? entry.rawValue
          : entry.amount
      if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) return sum
      const multiplier =
        typeof entry.multiplier === 'number' && Number.isFinite(entry.multiplier)
          ? entry.multiplier
          : 1
      return sum + rawValue * multiplier
    }, 0),
  )

  return {
    ...result,
    computedTotal,
    auditNotes: result.auditNotes.includes('前端已重新执行 entries 算术合计。')
      ? result.auditNotes
      : [...result.auditNotes, '前端已重新执行 entries 算术合计。'],
  }
}
