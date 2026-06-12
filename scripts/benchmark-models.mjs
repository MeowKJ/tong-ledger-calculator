import fs from 'node:fs'
import path from 'node:path'

const EXPECTED_TOTAL = 2860.38
const DEFAULT_BASE_URL = 'https://autorouter.io'
const DEFAULT_MODELS = ['gpt-5.5']

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.AUTOROUTER_BASE_URL || DEFAULT_BASE_URL,
    models: DEFAULT_MODELS,
    quality: 'high',
  }

  for (const arg of argv) {
    if (arg.startsWith('--models=')) args.models = arg.slice('--models='.length).split(',')
    if (arg.startsWith('--quality=')) args.quality = arg.slice('--quality='.length)
    if (arg.startsWith('--base-url=')) args.baseUrl = arg.slice('--base-url='.length)
  }

  return args
}

function readSampleImage() {
  const imagePath = path.resolve('public/samples/handwritten-ledger.png')
  const image = fs.readFileSync(imagePath).toString('base64')
  return `data:image/png;base64,${image}`
}

function buildPrompt(previousResult) {
  const base = [
    '你是 tong账本计算器 的票据识别和账本计算引擎。',
    '请只根据图片识别账本，不要编造看不见的内容。',
    '先读取列上方表头倍率/小数，再识别每日手写数字。',
    '手写账本里写在列上方的小数是该列所有下方数字的乘数。',
    '常见易错点：右列上方可能是 0.05，不要误读成 0.25；必须逐列确认小数点和数字。',
    'X、空白、划掉的非金额标记不要计入 entries。',
    '按日期行网格分配数字，不要把上半部分密集数字错配到相邻日期。',
    'computedTotal 必须等于 entries.calculatedAmount 的合计。',
    '只输出 JSON，不要 Markdown。',
    'JSON 格式：{"title":"","computedTotal":0,"formula":"","entries":[{"rowLabel":"4日","column":"0.088列","rawValue":150,"multiplier":0.088,"calculatedAmount":13.2,"confidence":0.8}],"uncertain":[{"text":"","reason":"","candidates":[]}],"notes":[]}',
  ]

  if (!previousResult) return base.join('\n')

  return [
    ...base,
    '下面是第一阶段结果。请作为审计员逐行复核原图，修正读错的数字、日期行和倍率；无法确认则降低 confidence 并写入 uncertain。',
    JSON.stringify(previousResult),
  ].join('\n')
}

function parseJsonObject(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('response is not JSON')
    return JSON.parse(trimmed.slice(start, end + 1))
  }
}

async function callModel({ apiKey, baseUrl, imageUrl, model, previousResult }) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt(previousResult) },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  })

  const body = await response.text()
  if (!response.ok) throw new Error(body)

  const payload = JSON.parse(body)
  return parseJsonObject(payload.choices?.[0]?.message?.content || '')
}

async function runModel({ apiKey, baseUrl, imageUrl, model, quality }) {
  const startedAt = Date.now()
  const first = await callModel({ apiKey, baseUrl, imageUrl, model })
  const finalResult =
    quality === 'high'
      ? await callModel({ apiKey, baseUrl, imageUrl, model, previousResult: first })
      : first
  const total = Number(finalResult.computedTotal)
  const totalError = Number.isFinite(total) ? Math.round((total - EXPECTED_TOTAL) * 100) / 100 : null

  return {
    model,
    quality,
    ok: true,
    elapsedSeconds: Math.round((Date.now() - startedAt) / 1000),
    total,
    totalError,
    entries: Array.isArray(finalResult.entries) ? finalResult.entries.length : 0,
    title: finalResult.title || '',
    uncertain: Array.isArray(finalResult.uncertain) ? finalResult.uncertain.length : 0,
    firstEntries: Array.isArray(finalResult.entries) ? finalResult.entries.slice(0, 8) : [],
  }
}

const apiKey = process.env.AUTOROUTER_API_KEY
if (!apiKey) {
  console.error('Set AUTOROUTER_API_KEY before running this benchmark.')
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))
const imageUrl = readSampleImage()
const results = []

for (const model of args.models) {
  try {
    results.push(await runModel({ apiKey, baseUrl: args.baseUrl, imageUrl, model, quality: args.quality }))
  } catch (error) {
    results.push({
      model,
      quality: args.quality,
      ok: false,
      error: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown error',
    })
  }
}

console.log(JSON.stringify(results, null, 2))
