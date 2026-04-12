import { LIFT_KEYS, LIFTS } from '../lib/constants'
import { useIronLog } from '../context/IronLogContext'

export function HistoryPage() {
  const { state, deleteSession } = useIronLog()
  const { sessions } = state

  if (!sessions.length) {
    return (
      <>
        <div className="section-label">SESSION LOG</div>
        <div className="history-list">
          <div className="empty-state">
            <div className="icon">📋</div>
            No sessions logged yet.
            <br />
            Complete a workout to see history.
          </div>
        </div>
      </>
    )
  }

  const reversed = [...sessions].map((s, i) => ({ s, index: i })).reverse()

  return (
    <>
      <div className="section-label">SESSION LOG</div>
      <div className="history-list">
        {reversed.map(({ s, index }) => {
          const lifts = LIFT_KEYS.map((l) => {
            const sets = s.lifts[l].sets
            const maxW = sets.reduce((a, b) => Math.max(a, b.weight || 0), 0)
            return `${LIFTS[l].name.split(' ')[0]}: ${maxW}kg`
          }).join(' | ')
          return (
            <div className="history-entry" key={`session-${index}`}>
              <div className="hist-info">
                <div className="hist-date">
                  {s.date} · C{s.cycle}
                </div>
                <div className="hist-lifts">{lifts}</div>
              </div>
              <div className="hist-week">W{s.week}</div>
              <button
                type="button"
                onClick={() => deleteSession(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                }}
                aria-label="Delete session"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
