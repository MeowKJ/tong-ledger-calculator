import { SAMPLE_RECOGNITION } from '../data/sampleRecognition'
import type { SampleCase } from '../data/sampleCases'
import { getEntryCalculatedAmount, summarizeRecognition } from './calculation'
import type { BenchmarkEvaluation, BenchmarkFinding, RecognizedEntry, RecognitionResult } from '../types'

const MONEY_EPSILON = 0.01
const PASS_TOTAL_ERROR = 1

function inferColumnKey(entry: RecognizedEntry) {
  if (typeof entry.multiplier === 'number' && Number.isFinite(entry.multiplier)) {
    return String(entry.multiplier)
  }

  const text = `${entry.label} ${entry.note ?? ''}`
  if (text.includes('左') || text.includes('0.1')) return '0.1'
  if (text.includes('中') || text.includes('0.088')) return '0.088'
  if (text.includes('右') || text.includes('0.05')) return '0.05'

  return 'none'
}

function entryKey(entry: RecognizedEntry) {
  return `${entry.rowLabel}|${inferColumnKey(entry)}`
}

function numericRawValue(entry: RecognizedEntry) {
  if (typeof entry.rawValue === 'number' && Number.isFinite(entry.rawValue)) return entry.rawValue
  if (typeof entry.amount === 'number' && Number.isFinite(entry.amount)) return entry.amount

  const normalized = Number(entry.normalizedText || entry.rawText)
  return Number.isFinite(normalized) ? normalized : null
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(2)}`
}

export function evaluateRecognitionBenchmark(
  result: RecognitionResult,
  expectedResult = SAMPLE_RECOGNITION,
): BenchmarkEvaluation {
  const expectedSummary = summarizeRecognition(expectedResult)
  const actualSummary = summarizeRecognition(result)
  const expectedEntries = new Map(expectedResult.entries.map((entry) => [entryKey(entry), entry]))
  const actualEntries = new Map(result.entries.map((entry) => [entryKey(entry), entry]))
  const findings: BenchmarkFinding[] = []
  let matchedEntries = 0

  for (const [key, expectedEntry] of expectedEntries) {
    const actualEntry = actualEntries.get(key)
    if (!actualEntry) {
      findings.push({
        id: `missing-${key}`,
        severity: 'error',
        text: `${expectedEntry.rowLabel} ${expectedEntry.label} 缺失，期望 ${expectedEntry.rawText}`,
      })
      continue
    }

    const expectedRaw = numericRawValue(expectedEntry)
    const actualRaw = numericRawValue(actualEntry)
    const expectedAmount = getEntryCalculatedAmount(expectedResult, expectedEntry)
    const actualAmount = getEntryCalculatedAmount(result, actualEntry)

    if (
      expectedRaw === actualRaw &&
      expectedAmount !== null &&
      actualAmount !== null &&
      Math.abs(expectedAmount - actualAmount) <= MONEY_EPSILON
    ) {
      matchedEntries += 1
      continue
    }

    findings.push({
      id: `mismatch-${key}`,
      severity: 'error',
      text: `${expectedEntry.rowLabel} ${expectedEntry.label} 期望 ${expectedEntry.rawText}，实际 ${actualEntry.rawText}`,
    })
  }

  for (const [key, actualEntry] of actualEntries) {
    if (!expectedEntries.has(key)) {
      findings.push({
        id: `unexpected-${key}`,
        severity: 'warning',
        text: `${actualEntry.rowLabel} 多出 ${actualEntry.rawText}（${actualEntry.label}）`,
      })
    }
  }

  const totalError = actualSummary.total - expectedSummary.total
  const absoluteError = Math.abs(totalError)
  const totalScore = Math.max(0, Math.round((1 - absoluteError / expectedSummary.total) * 1000) / 10)
  const unexpectedEntries = Math.max(0, result.entries.length - expectedResult.entries.length)

  findings.unshift({
    id: 'total',
    severity: absoluteError <= PASS_TOTAL_ERROR ? 'ok' : 'error',
    text: `合计 ${actualSummary.total.toFixed(2)}，标准 ${expectedSummary.total.toFixed(2)}，误差 ${formatDelta(totalError)}`,
  })

  return {
    expectedTotal: expectedSummary.total,
    actualTotal: actualSummary.total,
    totalError,
    totalScore,
    matchedEntries,
    expectedEntries: expectedResult.entries.length,
    unexpectedEntries,
    findings,
    passed: absoluteError <= PASS_TOTAL_ERROR && matchedEntries === expectedResult.entries.length,
  }
}

export function evaluateSampleBenchmark(result: RecognitionResult): BenchmarkEvaluation {
  return evaluateRecognitionBenchmark(result, SAMPLE_RECOGNITION)
}

export function evaluateSampleCaseBenchmark(
  result: RecognitionResult,
  sampleCase: SampleCase,
): BenchmarkEvaluation {
  return evaluateRecognitionBenchmark(result, sampleCase.expectedResult)
}
