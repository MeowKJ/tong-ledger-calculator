import { useRef } from 'react'
import { Camera, ChevronDown, RefreshCw } from 'lucide-react'
import { FluentEmoji } from '../lib/emoji'
import type { AppSettings, SmartPrompt } from '../types'

interface HeroCaptureProps {
  compact?: boolean
  hasImage: boolean
  imageUrl: string
  prompt: SmartPrompt
  settings: AppSettings
  onFile: (file: File) => void
  onUpdateSettings: (patch: Partial<AppSettings>) => void
}

export function HeroCapture({
  compact = false,
  hasImage,
  imageUrl,
  prompt,
  settings,
  onFile,
  onUpdateSettings,
}: HeroCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (compact) {
    return (
      <div className="compact-capture">
        <input
          ref={inputRef}
          className="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
          }}
        />
        <button type="button" onClick={() => inputRef.current?.click()}>
          <RefreshCw size={18} />
          计算另一张
        </button>
      </div>
    )
  }

  return (
    <div className="hero-panel">
      <div className="hero-copy">
        <h2>{hasImage ? '照片已准备好' : '拍一张，算清楚'}</h2>
        <p>{hasImage ? '确认照片清晰后开始计算。' : '支持手写账本、表格和小票。'}</p>
      </div>

      <div className="capture-zone">
        <input
          ref={inputRef}
          className="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
          }}
        />
        <button
          className={`camera-button ${hasImage ? 'has-image' : ''}`}
          type="button"
          aria-label={hasImage ? '重新拍照' : '拍照或选择图片'}
          onClick={() => inputRef.current?.click()}
        >
          {hasImage ? (
            <>
              <img src={imageUrl} alt="" />
              <span><Camera size={20} /></span>
            </>
          ) : (
            <FluentEmoji assetName="Camera" fallback="📷" className="camera-emoji" />
          )}
        </button>
        <p className="camera-caption">{hasImage ? '点照片可更换' : '拍照或从相册选择'}</p>
      </div>

      <div className="prompt-picker">
        <label htmlFor="prompt-select">计算方式</label>
        <div className="select-wrap">
          <FluentEmoji name={prompt.emoji} fallback="✨" />
          <select
            id="prompt-select"
            value={settings.selectedPromptId}
            onChange={(event) => onUpdateSettings({ selectedPromptId: event.target.value })}
          >
            {settings.prompts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  )
}
