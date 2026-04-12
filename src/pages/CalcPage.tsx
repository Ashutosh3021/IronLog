import { useMemo, useState } from 'react'
import { useIronLog } from '../context/IronLogContext'
import { HIGHLIGHT_PCTS, PCT_TABLE, PROGRAM } from '../lib/constants'
import { estimate1RM, roundBar } from '../lib/program'

type CalcTab = '1rm' | 'pct' | 'tm'

export function CalcPage() {
  const { showToast } = useIronLog()
  const [tab, setTab] = useState<CalcTab>('1rm')
  const [oneRmWeight, setOneRmWeight] = useState('')
  const [oneRmReps, setOneRmReps] = useState('')
  const [show1rmResult, setShow1rmResult] = useState(false)
  const [oneRmValue, setOneRmValue] = useState<number | null>(null)

  const [pctBase, setPctBase] = useState('')
  const [tm1rm, setTm1rm] = useState('')

  const pctRows = useMemo(() => {
    const w = parseFloat(pctBase)
    if (!w) return []
    return PCT_TABLE.map((pct) => {
      const pw = Math.round((w * pct) / 100 * 2) / 2
      const hl = HIGHLIGHT_PCTS.has(pct)
      return { pct, pw, rb: roundBar(pw), hl }
    })
  }, [pctBase])

  const calc1RM = () => {
    const w = parseFloat(oneRmWeight)
    const r = parseInt(oneRmReps, 10)
    if (!w || !r || r <= 0) {
      showToast('⚠ Enter weight and reps')
      return
    }
    const e1rm = estimate1RM(w, r)
    setOneRmValue(e1rm)
    setShow1rmResult(true)
  }

  const oneRmBreakdown = useMemo(() => {
    if (!oneRmValue) return []
    return PCT_TABLE.map((pct) => {
      const pw = Math.round((oneRmValue * pct) / 100 * 2) / 2
      const hl = HIGHLIGHT_PCTS.has(pct)
      return { pct, pw, rb: roundBar(pw), hl }
    })
  }, [oneRmValue])

  const tmResult = useMemo(() => {
    const v = parseFloat(tm1rm)
    if (!v) return { tm: null as number | null, weeks: null as typeof PROGRAM | null }
    const tm = Math.round(v * 0.9 * 2) / 2
    return { tm, weeks: PROGRAM }
  }, [tm1rm])

  return (
    <>
      <div className="calc-tabs">
        {(
          [
            ['1rm', '1RM CALC'],
            ['pct', '% CALC'],
            ['tm', 'TM BUILDER'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`calc-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`calc-panel${tab === '1rm' ? ' active' : ''}`} id="calc-1rm">
        <div className="section-label">ESTIMATE 1 REP MAX</div>
        <div className="card">
          <div className="input-group">
            <label className="input-label">WEIGHT LIFTED (KG)</label>
            <input
              className="calc-input"
              type="number"
              placeholder="e.g. 100"
              inputMode="decimal"
              value={oneRmWeight}
              onChange={(e) => setOneRmWeight(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">REPS COMPLETED</label>
            <input
              className="calc-input"
              type="number"
              placeholder="e.g. 8"
              inputMode="numeric"
              value={oneRmReps}
              onChange={(e) => setOneRmReps(e.target.value)}
            />
          </div>
          <button type="button" className="calc-btn" onClick={calc1RM}>
            CALCULATE
          </button>
          <div className={`result-box${show1rmResult && oneRmValue ? ' visible' : ''}`}>
            <div className="result-main">{oneRmValue ? `${Math.round(oneRmValue)} kg` : '—'}</div>
            <div className="result-sub">ESTIMATED 1RM (EPLEY FORMULA)</div>
          </div>
          {oneRmBreakdown.length > 0 ? (
            <table className="pct-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>%</th>
                  <th>WEIGHT</th>
                  <th>ROUNDED</th>
                </tr>
              </thead>
              <tbody>
                {oneRmBreakdown.map((row) => (
                  <tr key={row.pct} className={row.hl ? 'highlight' : undefined}>
                    <td>{row.pct}%</td>
                    <td>{row.pw} kg</td>
                    <td>{row.rb} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      <div className={`calc-panel${tab === 'pct' ? ' active' : ''}`} id="calc-pct">
        <div className="section-label">PERCENTAGE CALCULATOR</div>
        <div className="card">
          <div className="input-group">
            <label className="input-label">BASE WEIGHT (KG)</label>
            <input
              className="calc-input"
              type="number"
              placeholder="e.g. 120"
              inputMode="decimal"
              value={pctBase}
              onChange={(e) => setPctBase(e.target.value)}
            />
          </div>
          <div className="result-box visible" style={{ display: 'block' }}>
            <table className="pct-table">
              <thead>
                <tr>
                  <th>%</th>
                  <th>WEIGHT (KG)</th>
                  <th>ROUNDED</th>
                </tr>
              </thead>
              <tbody>
                {pctRows.map((row) => (
                  <tr key={row.pct} className={row.hl ? 'highlight' : undefined}>
                    <td>{row.pct}%</td>
                    <td>{row.pw}</td>
                    <td>{row.rb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`calc-panel${tab === 'tm' ? ' active' : ''}`} id="calc-tm">
        <div className="section-label">TRAINING MAX BUILDER</div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
            Training Max (TM) = 90% of your 1RM. All 5/3/1 percentages are based on TM.
          </p>
          <div className="input-group">
            <label className="input-label">YOUR ACTUAL 1RM (KG)</label>
            <input
              className="calc-input"
              type="number"
              placeholder="e.g. 140"
              inputMode="decimal"
              value={tm1rm}
              onChange={(e) => setTm1rm(e.target.value)}
            />
          </div>
          <div className="result-box visible" style={{ display: 'block' }}>
            <div className="result-main">{tmResult.tm != null ? `${tmResult.tm} kg` : '—'}</div>
            <div className="result-sub">
              {tmResult.tm != null ? `TM = ${tmResult.tm}kg  (90% of ${parseFloat(tm1rm)}kg)` : 'TRAINING MAX (90% OF 1RM)'}
            </div>
          </div>
          {tmResult.tm != null && tmResult.weeks
            ? ([1, 2, 3, 4] as const).map((w) => {
                const prog = tmResult.weeks![w]
                return (
                  <div key={w} style={{ marginTop: 12 }}>
                    <div className="section-label" style={{ fontSize: 11 }}>
                      WEEK {w} — {prog.type}
                    </div>
                    {prog.sets.map((s, i) => {
                      const pw = Math.round((tmResult.tm! * s.pct) / 100 * 2) / 2
                      return (
                        <div
                          key={`${w}-${i}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom: '1px solid var(--surface3)',
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: 'var(--text3)', fontWeight: 700 }}>
                            SET {i + 1} — {s.pct}%
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>
                            {pw}kg × {s.reps}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            : null}
        </div>
      </div>
    </>
  )
}
