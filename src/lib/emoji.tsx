import { createFluentEmojiClient } from '@meowkj/fluent-emoji-assets'

const emoji = createFluentEmojiClient({
  provider: 'jsdelivr',
  repo: { ref: 'main' },
})

interface FluentEmojiProps {
  name?: string
  assetName?: string
  fallback: string
  className?: string
}

export function FluentEmoji({ name, assetName, fallback, className }: FluentEmojiProps) {
  const src = name && emoji.has(name) ? emoji.url(name) : assetName ? emoji.rawUrl(assetName) : ''

  if (!src) {
    return (
      <span className={className} aria-hidden="true">
        {fallback}
      </span>
    )
  }

  return <img className={className} src={src} alt={fallback} loading="lazy" />
}
