import type {
  ExternalOcrToken,
  ImageRegion,
  VisualExtractionResult,
  VisualToken,
  VisualTokenCandidate,
} from '../types'

const MAX_CENTER_DISTANCE = 5
const MIN_OCR_CONFIDENCE = 0.45

function center(region: ImageRegion) {
  return {
    x: region.x + region.width / 2,
    y: region.y + region.height / 2,
  }
}

function centerDistance(first: ImageRegion, second: ImageRegion) {
  const a = center(first)
  const b = center(second)
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function normalizeCandidateText(text: string) {
  return text.trim().replace(/\s+/g, '')
}

function isCompatible(token: VisualToken, ocrToken: ExternalOcrToken) {
  if (!ocrToken.kind) return true
  if (token.kind === ocrToken.kind) return true

  return (
    (token.kind === 'number' || token.kind === 'multiplier') &&
    (ocrToken.kind === 'number' || ocrToken.kind === 'multiplier')
  )
}

function mergeCandidates(
  candidates: VisualTokenCandidate[],
  ocrToken: ExternalOcrToken,
): VisualTokenCandidate[] {
  const text = normalizeCandidateText(ocrToken.text)
  const next = [...candidates]
  const existingIndex = next.findIndex(
    (candidate) => normalizeCandidateText(candidate.text) === text,
  )
  const confidence = Math.min(1, Math.max(0, ocrToken.confidence * 0.85))

  if (existingIndex >= 0) {
    next[existingIndex] = {
      ...next[existingIndex],
      confidence: Math.max(next[existingIndex].confidence, confidence),
    }
  } else {
    next.push({ text, confidence })
  }

  return next.sort((a, b) => b.confidence - a.confidence)
}

function mergeToken(token: VisualToken, ocrToken: ExternalOcrToken): VisualToken {
  const visualText = normalizeCandidateText(token.normalizedText || token.rawText)
  const ocrText = normalizeCandidateText(ocrToken.text)
  const disagrees = Boolean(visualText && ocrText && visualText !== ocrText)
  const provider = ocrToken.provider || 'external OCR'
  const fusionNote = disagrees
    ? `${provider} 在同一位置识别为 ${ocrText}，与视觉结果 ${visualText} 不一致。`
    : `${provider} 在同一位置提供了相同读数。`

  return {
    ...token,
    candidates: mergeCandidates(token.candidates, ocrToken),
    confidence: disagrees ? Math.max(0, token.confidence * 0.88) : token.confidence,
    note: [token.note, fusionNote].filter(Boolean).join(' '),
  }
}

export interface OcrFusionReport {
  extraction: VisualExtractionResult
  matched: number
  conflicts: number
  unmatched: ExternalOcrToken[]
}

export function fuseExternalOcrTokens(
  extraction: VisualExtractionResult,
  externalTokens: ExternalOcrToken[],
): OcrFusionReport {
  const usableOcrTokens = externalTokens.filter(
    (token) =>
      token.confidence >= MIN_OCR_CONFIDENCE &&
      Boolean(normalizeCandidateText(token.text)),
  )
  const claimed = new Set<string>()
  let matched = 0
  let conflicts = 0

  const tokens = extraction.tokens.map((token) => {
    const nearest = usableOcrTokens
      .filter((ocrToken) => !claimed.has(ocrToken.id) && isCompatible(token, ocrToken))
      .map((ocrToken) => ({
        distance: centerDistance(token.region, ocrToken.region),
        token: ocrToken,
      }))
      .filter((candidate) => candidate.distance <= MAX_CENTER_DISTANCE)
      .sort((a, b) => a.distance - b.distance)[0]

    if (!nearest) return token

    claimed.add(nearest.token.id)
    matched += 1
    const visualText = normalizeCandidateText(token.normalizedText || token.rawText)
    const ocrText = normalizeCandidateText(nearest.token.text)
    if (visualText !== ocrText) conflicts += 1

    return mergeToken(token, nearest.token)
  })

  const unmatched = usableOcrTokens.filter((token) => !claimed.has(token.id))
  const auditNotes = [...extraction.auditNotes]

  if (matched) {
    auditNotes.push(
      `外部 OCR 融合：位置匹配 ${matched} 项，其中 ${conflicts} 项与视觉模型不一致，已加入候选并降低置信度。`,
    )
  }
  if (unmatched.length) {
    auditNotes.push(
      `外部 OCR 另检测到 ${unmatched.length} 项未匹配内容；为避免误计费，仅保留为复核证据。`,
    )
  }

  return {
    extraction: { ...extraction, tokens, auditNotes },
    matched,
    conflicts,
    unmatched,
  }
}
