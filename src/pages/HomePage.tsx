import { useIronLog } from '../context/IronLogContext'
import { LIFT_KEYS, PROGRAM } from '../lib/constants'
import { calcWeight } from '../lib/program'

export function HomePage() {
  const {
    state,
    selectWeek,
    toggleLiftOpen,
    openLift,
    updateSetReps,
    toggleSetDone,
    saveSession,
    confirmNextWeek,
    refreshState,
  } = useIronLog()

  const session = state.currentSession
  const prog = PROGRAM[state.week]

  if (!session) {
    return (
      <>
        <div className="section-label">PROGRAM WEEK</div>
        <div className="week-grid">
          {([1, 2, 3, 4] as const).map((w) => (
            <button
              key={w}
              type="button"
              className={`week-chip${state.week === w ? ' active' : ''}${w === 4 ? ' deload' : ''}`}
              onClick={() => selectWeek(w)}
            >
              <div className="wk-num">W{w}</div>
              <div className="wk-type">{PROGRAM[w].type}</div>
            </button>
          ))}
        </div>
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>No active session</p>
          <button type="button" className="save-btn" onClick={refreshState}>
            🔄 RELOAD
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="section-label">PROGRAM WEEK</div>
      <div className="week-grid">
        {([1, 2, 3, 4] as const).map((w) => (
          <button
            key={w}
            type="button"
            className={`week-chip${state.week === w ? ' active' : ''}${w === 4 ? ' deload' : ''}`}
            onClick={() => selectWeek(w)}
          >
            <div className="wk-num">W{w}</div>
            <div className="wk-type">{PROGRAM[w].type}</div>
          </button>
        ))}
      </div>

      <div className="section-label">TODAY&apos;S LIFTS</div>
      <div className="lift-cards">
        {LIFT_KEYS.map((lift) => {
          const tm = state.tm[lift]
          const sets = session.lifts[lift].sets
          const isOpen = openLift[lift]
          return (
            <div className="lift-card" key={lift}>
              <button type="button" className="lift-card-header" onClick={() => toggleLiftOpen(lift)}>
                <div className={`lift-name ${lift}`}>{lift === 'dl' ? 'DEADLIFT' : lift === 'bp' ? 'BENCH PRESS' : 'SMITH SQUAT'}</div>
                <div className="lift-tm">
                  <span>TM:</span> <span>{tm || '—'}</span> kg
                </div>
              </button>
              <div className={`sets-grid${isOpen ? ' open' : ''}`}>
                {sets.map((set, i) => {
                  const isAmrap = String(set.targetReps).includes('+')
                  const w = tm ? calcWeight(tm, set.pct) : '?'
                  return (
                    <div className="set-row" key={`${lift}-${i}`}>
                      <div className="set-label">
                        SET {i + 1}
                        <br />
                        <span style={{ color: 'var(--orange)', fontSize: 10 }}>{set.pct}%</span>
                      </div>
                      <div className="set-target">
                        {w}kg × {set.targetReps}
                      </div>
                      <input
                        className="set-input"
                        type="number"
                        inputMode="numeric"
                        placeholder={isAmrap ? 'AMRAP' : String(set.targetReps)}
                        value={set.actualReps}
                        onChange={(e) => updateSetReps(lift, i, e.target.value)}
                      />
                      <button
                        type="button"
                        className={`set-done-btn${set.done ? ' done' : ''}`}
                        onClick={() => toggleSetDone(lift, i)}
                        aria-label={set.done ? 'Mark set not done' : 'Mark set done'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
                {prog.sets.some((s) => String(s.reps).includes('+')) ? (
                  <div className="amrap-note">★ AMRAP = as many reps as possible on last set</div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ height: 12 }} />
      <button type="button" className="save-btn" onClick={saveSession}>
        💾 SAVE SESSION
      </button>
      <button type="button" className="danger-btn" onClick={confirmNextWeek}>
        ⚡ COMPLETE WEEK → NEXT
      </button>
    </>
  )
}
