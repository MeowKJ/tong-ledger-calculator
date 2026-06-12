export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type OverlayMode = 'all' | 'focus' | 'low' | 'grid' | 'off'
export type ApiMode = 'responses' | 'chatCompletions'
export type QualityMode = 'fast' | 'high' | 'max'
export type VerificationStatus = 'pending' | 'confirmed' | 'skipped' | 'flagged'

export interface ImageRegion {
  x: number
  y: number
  width: number
  height: number
}

export interface AnchorPoint {
  id: string
  x: number
  y: number
}

export interface AnchorReference {
  anchorId: string
  offsetX: number
  offsetY: number
  note: string
}

export interface SmartPrompt {
  id: string
  name: string
  emoji: string
  description: string
  prompt: string
}

export interface PaperProductColumn {
  id: string
  label: string
  unitPrice: number | null
}

export type PaperGridColumnKind =
  | 'date'
  | 'attendance'
  | 'product'
  | 'unloading'
  | 'deduction'
  | 'dailyTotal'

export interface PaperGridColumn {
  id: string
  label: string
  kind: PaperGridColumnKind
  productColumnId?: string
}

export interface PaperTemplateGridAnchor {
  id: string
  label: string
  x: number
  y: number
}

export interface PaperTemplateGrid {
  rows: number
  columns: PaperGridColumn[]
  headerRows: number
  tableRegion: ImageRegion
  columnRatios: number[]
  rowRatios: number[]
  anchors: PaperTemplateGridAnchor[]
}

export interface PaperTemplateRules {
  firstColumnIsAttendance: boolean
  absentMarks: string[]
  halfDayMarks: string[]
  headerRowIsUnitPrice: boolean
  unloadingAlreadyCalculated: boolean
  deductionsAreSeparateAdjustments: boolean
}

export interface PaperTemplate {
  id: string
  name: string
  rowCount: number
  productColumns: PaperProductColumn[]
  unloadingColumnLabel: string
  deductionLabel: string
  grid: PaperTemplateGrid
  rules: PaperTemplateRules
}

export interface AppSettings {
  apiBaseUrl: string
  apiKey: string
  apiMode: ApiMode
  model: string
  qualityMode: QualityMode
  selectedPromptId: string
  prompts: SmartPrompt[]
  selectedPaperTemplateId: string
  paperTemplates: PaperTemplate[]
}

export interface RecognizedEntry {
  id: string
  label: string
  rowLabel: string
  rawText: string
  normalizedText: string
  amount: number | null
  rawValue?: number | null
  multiplier?: number | null
  calculatedAmount?: number | null
  formula?: string
  category: string
  confidence: number
  region: ImageRegion
  anchor?: AnchorReference | null
  note?: string
  cellId?: string
}

export type LedgerCellSemanticType =
  | 'blank'
  | 'attendance'
  | 'quantity'
  | 'directMoney'
  | 'deduction'
  | 'note'
  | 'uncertain'

export type LedgerCellRiskFlag =
  | 'lowConfidence'
  | 'nearBorder'
  | 'crossCell'
  | 'possibleMissedDigit'
  | 'ambiguousHalfDay'
  | 'moneyUnit'
  | 'calculationMismatch'
  | 'userEdited'

export interface LedgerCell {
  id: string
  row: number
  columnId: string
  columnLabel: string
  columnKind: PaperGridColumnKind
  bboxOriginal: ImageRegion
  bboxWarped: ImageRegion
  cropRef: string
  rawText: string
  normalizedText: string
  semanticType: LedgerCellSemanticType
  blankConfidence: number
  confidence: number
  riskFlags: LedgerCellRiskFlag[]
  entryIds: string[]
  amount: number | null
  note: string
}

export type VisualTokenKind = 'number' | 'multiplier' | 'mark' | 'text'

export interface VisualTokenCandidate {
  text: string
  confidence: number
}

export interface ExternalOcrToken {
  id: string
  text: string
  confidence: number
  region: ImageRegion
  kind?: VisualTokenKind
  provider?: string
}

export interface VisualToken {
  id: string
  kind: VisualTokenKind
  label: string
  rowLabel: string
  columnLabel: string
  rawText: string
  normalizedText: string
  numericValue: number | null
  candidates: VisualTokenCandidate[]
  confidence: number
  region: ImageRegion
  anchor?: AnchorReference | null
  note: string
}

export interface ColumnRule {
  id: string
  label: string
  multiplier: number
  evidenceText: string
  confidence: number
}

export interface UncertainMark {
  id: string
  text: string
  reason: string
  confidence: number
  region: ImageRegion
  anchor?: AnchorReference | null
  candidates: string[]
}

export interface RecognitionResult {
  title: string
  sourceType: string
  summary: string
  currency: string
  overallConfidence: number
  computedTotal?: number | null
  calculationFormula?: string
  calculationProgram?: CalculationProgram
  columnRules?: ColumnRule[]
  entries: RecognizedEntry[]
  uncertainMarks: UncertainMark[]
  extractedText: string[]
  auditNotes: string[]
  visualTokens?: VisualToken[]
  cells?: LedgerCell[]
}

export interface VisualExtractionResult {
  title: string
  sourceType: string
  summary: string
  currency: string
  overallConfidence: number
  tokens: VisualToken[]
  extractedText: string[]
  auditNotes: string[]
}

export interface CalculationTerm {
  id: string
  label: string
  rowLabel: string
  sourceTokenIds: string[]
  rawText: string
  normalizedText: string
  rawValue: number | null
  multiplier: number | null
  include: boolean
  category: string
  confidence: number
  formula: string
  note: string
}

export interface CalculationProgram {
  dslVersion: 'tong-ledger-dsl/v1'
  title: string
  sourceType: string
  summary: string
  currency: string
  calculationFormula: string
  columnRules: ColumnRule[]
  terms: CalculationTerm[]
  uncertainMarks: UncertainMark[]
  extractedText: string[]
  auditNotes: string[]
}

export interface CalculationSummary {
  total: number
  countedEntries: number
  averageConfidence: number
  lowConfidenceCount: number
  level: ConfidenceLevel
}

export interface BenchmarkFinding {
  id: string
  severity: 'ok' | 'warning' | 'error'
  text: string
}

export interface BenchmarkEvaluation {
  expectedTotal: number
  actualTotal: number
  totalError: number
  totalScore: number
  matchedEntries: number
  expectedEntries: number
  unexpectedEntries: number
  findings: BenchmarkFinding[]
  passed: boolean
}

export interface ModelRunRecord {
  id: string
  apiMode: ApiMode
  benchmark?: BenchmarkEvaluation
  createdAt: string
  durationMs: number
  error?: string
  model: string
  qualityMode: QualityMode
  status: 'success' | 'error'
}

export interface VerificationItem {
  id: string
  targetId: string
  kind: 'entry' | 'uncertain' | 'rule' | 'cell'
  title: string
  detail: string
  risk: number
  amountImpact: number
  confidence: number
  region?: ImageRegion
}
