export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

export async function urlToDataUrl(url: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  return fileToDataUrl(new File([blob], 'sample.png', { type: blob.type }))
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('图片加载失败。')))
    image.src = dataUrl
  })
}

function percentile(sortedValues: number[], ratio: number) {
  if (!sortedValues.length) return 0
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * ratio)))
  return sortedValues[index]
}

export async function preprocessImageForOcr(dataUrl: string) {
  const image = await loadImage(dataUrl)
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return dataUrl

  context.drawImage(image, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const data = imageData.data
  const gray = new Uint8ClampedArray(width * height)
  const samples: number[] = []

  for (let pixel = 0; pixel < gray.length; pixel += 1) {
    const offset = pixel * 4
    const value = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114)
    gray[pixel] = value
    if (pixel % 7 === 0) samples.push(value)
  }

  samples.sort((a, b) => a - b)
  const low = percentile(samples, 0.04)
  const high = Math.max(low + 24, percentile(samples, 0.965))
  const normalized = new Uint8ClampedArray(gray.length)

  for (let pixel = 0; pixel < gray.length; pixel += 1) {
    const stretched = ((gray[pixel] - low) / (high - low)) * 255
    normalized[pixel] = Math.min(255, Math.max(0, stretched))
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x
      const offset = pixel * 4
      const center = normalized[pixel]
      const left = normalized[y * width + Math.max(0, x - 1)]
      const right = normalized[y * width + Math.min(width - 1, x + 1)]
      const top = normalized[Math.max(0, y - 1) * width + x]
      const bottom = normalized[Math.min(height - 1, y + 1) * width + x]
      const blur = (left + right + top + bottom + center * 2) / 6
      let value = center + (center - blur) * 0.9
      value = value < 150 ? value * 0.82 : value * 1.08 + 6
      value = Math.min(255, Math.max(0, value))
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }

  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.84)
}
