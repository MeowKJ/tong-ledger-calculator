import { formatAmount, getEntryCalculatedAmount } from '../lib/calculation'
import type { RecognitionResult } from '../types'

interface EntryTableProps {
  result: RecognitionResult
  selectedEntryId: string
  onSelectEntry: (id: string) => void
}

export function EntryTable({ result, selectedEntryId, onSelectEntry }: EntryTableProps) {
  return (
    <section className="table-panel">
      <div className="entry-list">
        {result.entries.map((entry) => {
          const amount = getEntryCalculatedAmount(result, entry)

          return (
            <button
              className={`entry-row ${entry.id === selectedEntryId ? 'is-selected' : ''}`}
              key={entry.id}
              type="button"
              onClick={() => onSelectEntry(entry.id)}
            >
              <span className="entry-date">{entry.rowLabel}</span>
              <div className="entry-main">
                <strong>{entry.rawText}</strong>
                <span>
                  {entry.category ? `${entry.category} · ` : ''}
                  {entry.multiplier ? `x ${entry.multiplier} · ` : ''}
                  {entry.note || entry.label}
                </span>
              </div>
              <span className="entry-amount">
                {amount === null ? '-' : formatAmount(amount, result.currency)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
