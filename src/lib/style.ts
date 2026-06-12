import type { CSSProperties } from 'react'

type CssVars = CSSProperties & Record<`--${string}`, string>

export function cssVars(style: CssVars): CSSProperties {
  return style
}
