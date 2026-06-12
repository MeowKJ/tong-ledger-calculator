import { useState } from 'react'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { productColumnsFromText, productColumnsToText } from '../lib/paperTemplates'
import { PromptManager } from './PromptManager'
import type { AppSettings, PaperTemplate, SmartPrompt } from '../types'

interface SettingsPanelProps {
  activePaperTemplate: PaperTemplate
  prompt: SmartPrompt
  settings: AppSettings
  onAddPrompt: () => void
  onDeletePrompt: () => void
  onUpdatePaperTemplate: (
    patch: Partial<PaperTemplate> | ((template: PaperTemplate) => PaperTemplate),
  ) => void
  onUpdatePrompt: (patch: Partial<SmartPrompt>) => void
  onUpdateSettings: (patch: Partial<AppSettings>) => void
}

export function SettingsPanel({
  activePaperTemplate,
  prompt,
  settings,
  onAddPrompt,
  onDeletePrompt,
  onUpdatePaperTemplate,
  onUpdatePrompt,
  onUpdateSettings,
}: SettingsPanelProps) {
  const productColumnText = productColumnsToText(activePaperTemplate.productColumns)
  const [rowCountDraft, setRowCountDraft] = useState(() => String(activePaperTemplate.rowCount))

  return (
    <section className="settings-panel">
      <div className="settings-grid">
        <div className="model-lock">
          <ShieldCheck size={18} />
          <div>
            <strong>Gemini 3.5 Flash</strong>
            <span>深度识别与三阶段复核已开启</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="api-key">API Key</label>
          <input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={settings.apiKey}
            onChange={(event) => onUpdateSettings({ apiKey: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="api-base-url">API 地址</label>
          <input
            id="api-base-url"
            type="url"
            placeholder="https://api.openai.com"
            value={settings.apiBaseUrl}
            onChange={(event) => onUpdateSettings({ apiBaseUrl: event.target.value })}
          />
        </div>
      </div>

      <details className="settings-details">
        <summary>
          <span>纸张与接口设置</span>
          <ChevronDown size={17} />
        </summary>
        <div className="paper-template-editor">
          <div className="paper-template-head">
            <div>
              <strong>本子格式</strong>
              <span>固定月表，按切割后的行列格子复核。</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="paper-name">纸张配置名</label>
            <input
              id="paper-name"
              value={activePaperTemplate.name}
              onChange={(event) => onUpdatePaperTemplate({ name: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="paper-rows">日期行数</label>
            <input
              id="paper-rows"
              inputMode="numeric"
              type="number"
              min={1}
              max={31}
              value={rowCountDraft}
              onChange={(event) => {
                const nextValue = event.target.value
                setRowCountDraft(nextValue)
                if (!nextValue) return

                const rowCount = Number(nextValue)
                if (!Number.isFinite(rowCount)) return
                onUpdatePaperTemplate({ rowCount: Math.min(31, Math.max(1, rowCount)) })
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="paper-columns">纸类列与单价</label>
            <textarea
              id="paper-columns"
              value={productColumnText}
              onChange={(event) =>
                onUpdatePaperTemplate((template) => ({
                  ...template,
                  productColumns: productColumnsFromText(event.target.value),
                }))
              }
            />
            <p className="field-hint">每行一个纸类，格式为“名称=单价”。不填单价时读取图片第一行。</p>
          </div>
          <div className="template-rule-grid">
            <label>
              <input
                type="checkbox"
                checked={activePaperTemplate.rules.firstColumnIsAttendance}
                onChange={(event) =>
                  onUpdatePaperTemplate((template) => ({
                    ...template,
                    rules: { ...template.rules, firstColumnIsAttendance: event.target.checked },
                  }))
                }
              />
              第一列为上班/没上班
            </label>
            <label>
              <input
                type="checkbox"
                checked={activePaperTemplate.rules.unloadingAlreadyCalculated}
                onChange={(event) =>
                  onUpdatePaperTemplate((template) => ({
                    ...template,
                    rules: { ...template.rules, unloadingAlreadyCalculated: event.target.checked },
                  }))
                }
              />
              上下货是已算好的金额
            </label>
            <label>
              <input
                type="checkbox"
                checked={activePaperTemplate.rules.deductionsAreSeparateAdjustments}
                onChange={(event) =>
                  onUpdatePaperTemplate((template) => ({
                    ...template,
                    rules: {
                      ...template.rules,
                      deductionsAreSeparateAdjustments: event.target.checked,
                    },
                  }))
                }
              />
              扣款单独扣减
            </label>
          </div>
        </div>
        <div className="field">
          <label htmlFor="api-mode">接口格式</label>
          <select
            id="api-mode"
            value={settings.apiMode}
            onChange={(event) =>
              onUpdateSettings({ apiMode: event.target.value as AppSettings['apiMode'] })
            }
          >
            <option value="chatCompletions">OpenAI 兼容接口</option>
            <option value="responses">Responses 接口</option>
          </select>
        </div>
        <PromptManager
          prompt={prompt}
          settings={settings}
          onAddPrompt={onAddPrompt}
          onDeletePrompt={onDeletePrompt}
          onUpdatePrompt={onUpdatePrompt}
          onUpdateSettings={onUpdateSettings}
        />
      </details>
    </section>
  )
}
