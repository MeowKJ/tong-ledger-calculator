import { Plus, Save, Trash2 } from 'lucide-react'
import { FluentEmoji } from '../lib/emoji'
import type { AppSettings, SmartPrompt } from '../types'

interface PromptManagerProps {
  prompt: SmartPrompt
  settings: AppSettings
  onAddPrompt: () => void
  onDeletePrompt: () => void
  onUpdatePrompt: (patch: Partial<SmartPrompt>) => void
  onUpdateSettings: (patch: Partial<AppSettings>) => void
}

export function PromptManager({
  prompt,
  settings,
  onAddPrompt,
  onDeletePrompt,
  onUpdatePrompt,
  onUpdateSettings,
}: PromptManagerProps) {
  return (
    <section className="prompt-manager">
      <div className="prompt-manager-head">
        <div>
          <h3>智能 prompt</h3>
          <p>可新增、编辑和删除，自动保存在本机。</p>
        </div>
        <button className="icon-button compact" type="button" onClick={onAddPrompt} aria-label="新增 prompt">
          <Plus size={18} />
        </button>
      </div>

      <div className="field">
        <label htmlFor="settings-prompt-select">当前模板</label>
        <select
          id="settings-prompt-select"
          value={settings.selectedPromptId}
          onChange={(event) => onUpdateSettings({ selectedPromptId: event.target.value })}
        >
          {settings.prompts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="prompt-meta-grid">
        <div className="field">
          <label htmlFor="prompt-name">名称</label>
          <input
            id="prompt-name"
            value={prompt.name}
            onChange={(event) => onUpdatePrompt({ name: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="prompt-emoji">Emoji 别名</label>
          <div className="emoji-input">
            <FluentEmoji name={prompt.emoji} fallback="✨" />
            <input
              id="prompt-emoji"
              value={prompt.emoji}
              onChange={(event) => onUpdatePrompt({ emoji: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="prompt-description">说明</label>
        <input
          id="prompt-description"
          value={prompt.description}
          onChange={(event) => onUpdatePrompt({ description: event.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="prompt-text">Prompt 内容</label>
        <textarea
          id="prompt-text"
          value={prompt.prompt}
          onChange={(event) => onUpdatePrompt({ prompt: event.target.value })}
        />
      </div>

      <div className="prompt-manager-actions">
        <button className="ghost-button" type="button">
          <Save size={18} />
          已自动保存
        </button>
        <button
          className="danger-button"
          type="button"
          disabled={settings.prompts.length <= 1}
          onClick={onDeletePrompt}
        >
          <Trash2 size={18} />
          删除
        </button>
      </div>
    </section>
  )
}
