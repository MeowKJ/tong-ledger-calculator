import { getEntryCalculatedAmount } from './calculation'
import type { RecognitionResult } from '../types'

export function correctRecognitionValue(
  result: RecognitionResult,
  targetId: string,
  value: string,
): RecognitionResult {
  const normalized = value.trim()
  const numericValue = Number(normalized)
  if (!normalized || !Number.isFinite(numericValue)) return result

  const targetMark = result.uncertainMarks.find((mark) => mark.id === targetId)
  const targetRegion = targetMark?.region
  const entries = result.entries.map((entry) => {
    const sameTarget = entry.id === targetId
    const sameRegion =
      targetRegion &&
      Math.abs(entry.region.x - targetRegion.x) < 1 &&
      Math.abs(entry.region.y - targetRegion.y) < 1

    if (!sameTarget && !sameRegion) return entry

    const inferredMultiplier = result.columnRules?.find((rule) =>
      entry.label.includes(rule.label),
    )?.multiplier
    const multiplier =
      typeof entry.multiplier === 'number' ? entry.multiplier : inferredMultiplier
    const calculatedAmount =
      typeof multiplier === 'number' ? numericValue * multiplier : numericValue

    return {
      ...entry,
      rawText: normalized,
      normalizedText: normalized,
      amount: numericValue,
      rawValue: numericValue,
      multiplier,
      calculatedAmount,
      confidence: 1,
      note: [entry.note, '用户已人工校正'].filter(Boolean).join('；'),
    }
  })
  const interim: RecognitionResult = {
    ...result,
    entries,
    uncertainMarks: result.uncertainMarks.map((mark) =>
      mark.id === targetId
        ? {
            ...mark,
            text: normalized,
            reason: '用户已人工确认该位置。',
            confidence: 1,
            candidates: [normalized],
          }
        : mark,
    ),
  }
  const computedTotal = entries.reduce(
    (total, entry) => total + (getEntryCalculatedAmount(interim, entry) ?? 0),
    0,
  )

  return {
    ...interim,
    computedTotal: Math.round((computedTotal + Number.EPSILON) * 100) / 100,
  }
}
