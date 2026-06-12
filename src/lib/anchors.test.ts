import { describe, expect, it } from 'vitest'
import { SAMPLE_RECOGNITION } from '../data/sampleRecognition'
import { buildAnchorGrid, getAnchorPosition } from './anchors'

describe('anchors', () => {
  it('creates a stable labeled grid', () => {
    const anchors = buildAnchorGrid()

    expect(anchors).toHaveLength(60)
    expect(anchors[0]).toEqual({ id: 'A1', x: 10, y: 12 })
    expect(anchors.at(-1)).toEqual({ id: 'F10', x: 90, y: 92 })
  })

  it('uses anchor offsets before falling back to region center', () => {
    expect(
      getAnchorPosition(
        { anchorId: 'A1', offsetX: 2, offsetY: -1, note: 'nearby' },
        { x: 20, y: 30, width: 10, height: 10 },
      ),
    ).toEqual({ x: 12, y: 11 })

    expect(getAnchorPosition(null, { x: 20, y: 30, width: 10, height: 10 })).toEqual({
      x: 25,
      y: 35,
    })
  })

  it('keeps the sample review target inside its precise region', () => {
    const target = SAMPLE_RECOGNITION.uncertainMarks[0]
    const position = getAnchorPosition(target.anchor, target.region)

    expect(position.x).toBeGreaterThanOrEqual(target.region.x)
    expect(position.x).toBeLessThanOrEqual(target.region.x + target.region.width)
    expect(position.y).toBeGreaterThanOrEqual(target.region.y)
    expect(position.y).toBeLessThanOrEqual(target.region.y + target.region.height)
  })
})
