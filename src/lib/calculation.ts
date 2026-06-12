import type { CalculationSummary, ConfidenceLevel, RecognizedEntry, RecognitionResult } from '../types'

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

export function getConfidenceColor(confidence: number) {
  const level = getConfidenceLevel(confidence)
  if (level === 'high') return '#1ea672'
  if (level === 'medium') return '#f0a202'
  return '#ef476f'
}

export function summarizeRecognition(result: RecognitionResult): CalculationSummary {
  const amounts = result.entries
    .map((entry) => getEntryCalculatedAmount(result, entry))
    .filter((amount): amount is number => typeof amount === 'number' && Number.isFinite(amount))

  const confidenceValues = result.entries.map((entry) => entry.confidence)
  const averageConfidence =
    confidenceValues.length === 0
      ? 0
      : confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length

  return {
    total:
      typeof result.computedTotal === 'number' && Number.isFinite(result.computedTotal)
        ? result.computedTotal
        : Math.round((amounts.reduce((total, amount) => total + amount, 0) + Number.EPSILON) * 100) / 100,
    countedEntries: amounts.length,
    averageConfidence,
    lowConfidenceCount: result.entries.filter((entry) => entry.confidence < 0.6).length,
    level: getConfidenceLevel(result.overallConfidence),
  }
}

export function getEntryCalculatedAmount(result: RecognitionResult, entry: RecognizedEntry) {
  if (typeof entry.calculatedAmount === 'number' && Number.isFinite(entry.calculatedAmount)) {
    return entry.calculatedAmount
  }

  const rawValue =
    typeof entry.rawValue === 'number' && Number.isFinite(entry.rawValue)
      ? entry.rawValue
      : entry.amount

  if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) return null

  if (typeof entry.multiplier === 'number' && Number.isFinite(entry.multiplier)) {
    return rawValue * entry.multiplier
  }

  const inferredRule = result.columnRules?.find((rule) => entry.label.includes(rule.label))
  if (inferredRule) return rawValue * inferredRule.multiplier

  return rawValue
}

export function formatAmount(amount: number, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}
