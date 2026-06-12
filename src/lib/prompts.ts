import { DEFAULT_PROMPTS } from '../data/defaultPrompts'
import type { AppSettings, SmartPrompt } from '../types'

export function activePrompt(settings: AppSettings): SmartPrompt {
  return (
    settings.prompts.find((prompt) => prompt.id === settings.selectedPromptId) ??
    settings.prompts[0] ??
    DEFAULT_PROMPTS[0]
  )
}

export function createPromptId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `prompt-${Date.now()}`
}

export function createBlankPrompt(): SmartPrompt {
  return {
    id: createPromptId(),
    name: '新的智能 prompt',
    emoji: 'lightBulb',
    description: '自定义账单识别规则。',
    prompt:
      '请根据图片识别账单内容，先找出表头、单位、倍率和计算规则，再抽取明细、置信度、不确定字符和最终合计。',
  }
}

export function normalizePrompts(prompts: SmartPrompt[] | undefined) {
  if (!prompts?.length) return DEFAULT_PROMPTS

  return prompts.map((prompt) => {
    const defaultPrompt = DEFAULT_PROMPTS.find((item) => item.id === prompt.id)
    if (!defaultPrompt) return prompt

    if (prompt.id === 'handwritten-ledger' && !prompt.prompt.includes('表头')) {
      return { ...prompt, prompt: defaultPrompt.prompt, description: defaultPrompt.description }
    }

    return prompt
  })
}
