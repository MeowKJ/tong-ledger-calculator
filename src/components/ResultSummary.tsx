import { formatAmount, getConfidenceColor, summarizeRecognition } from '../lib/calculation'
import { cssVars } from '../lib/style'
import type { BenchmarkEvaluation, RecognitionResult } from '../types'

interface ResultSummaryProps {
  benchmark?: BenchmarkEvaluation | null
  developerMode?: boolean
  reviewCount?: number
  result: RecognitionResult
  summary: ReturnType<typeof summarizeRecognition>
}

export function ResultSummary({
  benchmark,
  developerMode = false,
  reviewCount,
  result,
  summary,
}: ResultSummaryProps) {
  return (
    <section className="result-panel">
      <div className="total-block">
        <span>计算结果</span>
        <strong>{formatAmount(summary.total, result.currency)}</strong>
        <p>{result.title}</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>识别明细</span>
          <strong>{summary.countedEntries}</strong>
          <small>笔</small>
        </div>
        <div className="summary-card">
          <span>需要核对</span>
          <strong>{reviewCount ?? result.uncertainMarks.length + summary.lowConfidenceCount}</strong>
          <small>处</small>
        </div>
        <div className="summary-card">
          <span>可信程度</span>
          <strong
            style={cssVars({ '--score-color': getConfidenceColor(result.overallConfidence) })}
          >
            {Math.round(result.overallConfidence * 100)}
          </strong>
          <small>%</small>
        </div>
      </div>

      {result.calculationFormula || result.columnRules?.length ? (
        <div className="formula-panel">
          <span>计算依据</span>
          {result.calculationFormula ? <p>{result.calculationFormula}</p> : null}
          {result.columnRules?.length ? (
            <div className="rule-chips">
              {result.columnRules.map((rule) => (
                <span key={rule.id}>
                  {rule.label} x {rule.multiplier}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {developerMode && (result.visualTokens?.length || result.calculationProgram) ? (
        <div className="pipeline-panel">
          <div>
            <span>视觉 token</span>
            <strong>{result.visualTokens?.length ?? 0}</strong>
          </div>
          <div>
            <span>计算 DSL</span>
            <strong>{result.calculationProgram?.dslVersion ?? 'legacy'}</strong>
          </div>
          <p>模型输出位置与数字候选，前端按 DSL 执行乘法和求和。</p>
        </div>
      ) : null}

      {developerMode && benchmark ? (
        <div className={`benchmark-panel ${benchmark.passed ? 'is-passed' : 'is-warning'}`}>
          <div className="benchmark-head">
            <div>
              <span>测试基准</span>
              <strong>{benchmark.totalScore.toFixed(1)} 分</strong>
            </div>
            <b>{benchmark.passed ? '通过' : '继续迭代'}</b>
          </div>
          <div className="benchmark-grid">
            <span>标准 {formatAmount(benchmark.expectedTotal, result.currency)}</span>
            <span>误差 {benchmark.totalError >= 0 ? '+' : ''}{benchmark.totalError.toFixed(2)}</span>
            <span>
              命中 {benchmark.matchedEntries}/{benchmark.expectedEntries}
            </span>
          </div>
          <ul>
            {benchmark.findings.slice(0, 5).map((finding) => (
              <li key={finding.id} className={`is-${finding.severity}`}>
                {finding.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {developerMode ? (
        <ul className="text-list">
          {result.extractedText.slice(0, 6).map((line) => <li key={line}>{line}</li>)}
        </ul>
      ) : null}
    </section>
  )
}
