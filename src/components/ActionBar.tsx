import { LoaderCircle, WandSparkles } from 'lucide-react'

interface ActionBarProps {
  hasImage: boolean
  isRecognizing: boolean
  onRunRecognition: () => void
}

export function ActionBar({
  hasImage,
  isRecognizing,
  onRunRecognition,
}: ActionBarProps) {
  return (
      <button
        className="primary-button"
        type="button"
        disabled={!hasImage || isRecognizing}
        onClick={onRunRecognition}
      >
        {isRecognizing ? <LoaderCircle className="spin-icon" size={18} /> : <WandSparkles size={18} />}
        {isRecognizing ? '正在仔细识别并复核…' : '开始计算'}
      </button>
  )
}
