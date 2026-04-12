import { useMemo } from 'react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useIronLog } from '../context/IronLogContext'
import { LIFT_KEYS, LIFTS } from '../lib/constants'
import { estimate1RM } from '../lib/program'
import type { Session } from '../lib/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

function chartOpts(unit = '', legend = true) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: legend,
        labels: {
          color: '#a0a0a0',
          font: { family: 'JetBrains Mono', size: 10 },
          boxWidth: 12,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#666', font: { family: 'JetBrains Mono', size: 9 } },
        grid: { color: '#2e2e2e' },
      },
      y: {
        ticks: {
          color: '#666',
          font: { family: 'JetBrains Mono', size: 9 },
          callback: (v: string | number) => `${v}${unit}`,
        },
        grid: { color: '#2e2e2e' },
      },
    },
  }
}

function buildLineDS(label: string, data: (number | null)[], color: string) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: `${color}22`,
    fill: true,
    tension: 0.4,
    pointBackgroundColor: color,
    pointRadius: 4,
    borderWidth: 2,
    spanGaps: true,
  }
}

export function AnalyticsPage({ visible }: { visible: boolean }) {
  const { state } = useIronLog()
  const sessions = state.sessions

  const labels = useMemo(() => sessions.map((s) => `W${s.week}C${s.cycle}`), [sessions])

  const colors = { dl: '#f97316', bp: '#fbbf24', sq: '#38bdf8' }

  const stats = useMemo(() => {
    let totalVol = 0
    sessions.forEach((s) => {
      LIFT_KEYS.forEach((l) => {
        s.lifts[l].sets.forEach((set) => {
          const r = parseInt(String(set.actualReps), 10) || parseInt(String(set.targetReps), 10) || 0
          totalVol += (set.weight || 0) * r
        })
      })
    })
    const volLabel = totalVol > 1000 ? `${(totalVol / 1000).toFixed(1)}t` : `${totalVol}kg`
    return { totalVol, volLabel }
  }, [sessions])

  const prs = useMemo(() => {
    const best: Record<string, { w: number; d: string }> = {
      dl: { w: 0, d: '' },
      bp: { w: 0, d: '' },
      sq: { w: 0, d: '' },
    }
    const pr1rm: Record<string, { v: number; d: string }> = {
      dl: { v: 0, d: '' },
      bp: { v: 0, d: '' },
      sq: { v: 0, d: '' },
    }
    sessions.forEach((s) => {
      LIFT_KEYS.forEach((l) => {
        s.lifts[l].sets.forEach((set) => {
          if ((set.weight || 0) > best[l].w) {
            best[l].w = set.weight || 0
            best[l].d = s.date
          }
          const r = parseInt(String(set.actualReps), 10) || 0
          if (r > 0) {
            const e1rm = estimate1RM(set.weight || 0, r)
            if (e1rm > pr1rm[l].v) {
              pr1rm[l].v = e1rm
              pr1rm[l].d = s.date
            }
          }
        })
      })
    })
    return { best, pr1rm }
  }, [sessions])

  const tmChart = useMemo(() => {
    /** Infer TM from the top work set: weight ÷ (pct/100). Third set is 85%, 90%, 95%, or 60% by week — not always 85%. */
    const tmLine = (s: Session, lift: 'dl' | 'bp' | 'sq') => {
      const st = s.lifts[lift].sets[2]
      const w = st?.weight
      const pct = st?.pct
      if (!w || !pct) return null
      return w / (pct / 100)
    }
    return {
      labels,
      datasets: [
        buildLineDS('Deadlift', sessions.map((s) => tmLine(s, 'dl')), colors.dl),
        buildLineDS('Bench', sessions.map((s) => tmLine(s, 'bp')), colors.bp),
        buildLineDS('Squat', sessions.map((s) => tmLine(s, 'sq')), colors.sq),
      ],
    }
  }, [labels, sessions])

  const volChart = useMemo(() => {
    const volByLift = { dl: [] as number[], bp: [] as number[], sq: [] as number[] }
    sessions.forEach((s) => {
      LIFT_KEYS.forEach((l) => {
        let v = 0
        s.lifts[l].sets.forEach((set) => {
          v +=
            (set.weight || 0) *
            (parseInt(String(set.actualReps || set.targetReps), 10) || 0)
        })
        volByLift[l].push(v)
      })
    })
    return {
      labels,
      datasets: [
        {
          label: 'Deadlift',
          data: volByLift.dl,
          backgroundColor: `${colors.dl}99`,
          borderColor: colors.dl,
          borderWidth: 1,
        },
        {
          label: 'Bench',
          data: volByLift.bp,
          backgroundColor: `${colors.bp}99`,
          borderColor: colors.bp,
          borderWidth: 1,
        },
        {
          label: 'Squat',
          data: volByLift.sq,
          backgroundColor: `${colors.sq}99`,
          borderColor: colors.sq,
          borderWidth: 1,
        },
      ],
    }
  }, [labels, sessions])

  const pie = useMemo(() => {
    const totals = { dl: 0, bp: 0, sq: 0 }
    sessions.forEach((s) => {
      LIFT_KEYS.forEach((l) => {
        s.lifts[l].sets.forEach((set) => {
          totals[l] +=
            (set.weight || 0) *
            (parseInt(String(set.actualReps || set.targetReps), 10) || 0)
        })
      })
    })
    const totalAll = totals.dl + totals.bp + totals.sq || 1
    return { totals, totalAll }
  }, [sessions])

  const oneRmChart = useMemo(
    () => ({
      labels,
      datasets: LIFT_KEYS.map((l) =>
        buildLineDS(
          LIFTS[l].name,
          sessions.map((s) => {
            const sets = s.lifts[l].sets
            let best = 0
            sets.forEach((set) => {
              const r = parseInt(String(set.actualReps), 10) || 0
              if (r > 0) {
                const e = estimate1RM(set.weight || 0, r)
                if (e > best) best = e
              }
            })
            return best ? Math.round(best) : null
          }),
          colors[l],
        ),
      ),
    }),
    [labels, sessions],
  )

  if (!visible) return null

  return (
    <>
      <div className="section-label">TOTALS</div>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-val">{sessions.length}</div>
          <div className="stat-key">SESSIONS</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{state.cycle}</div>
          <div className="stat-key">CYCLES</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{stats.volLabel}</div>
          <div className="stat-key">TOTAL VOL</div>
        </div>
      </div>

      <div className="section-label">TRAINING MAX PROGRESS</div>
      <div className="chart-wrap">
        <div className="chart-title">TM OVER TIME (KG)</div>
        <Line data={tmChart} options={chartOpts('kg', true)} />
      </div>

      <div className="section-label">WEEKLY VOLUME</div>
      <div className="chart-wrap">
        <div className="chart-title">VOLUME PER LIFT (KG×REPS)</div>
        <Bar data={volChart} options={{ ...chartOpts('kg', true) }} />
      </div>

      <div className="section-label">LIFT DISTRIBUTION</div>
      <div
        className="chart-wrap"
        style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 180 }}
      >
        <div style={{ maxWidth: 160, maxHeight: 160, flex: '0 0 auto' }}>
          <Doughnut
            data={{
              labels: ['Deadlift', 'Bench', 'Squat'],
              datasets: [
                {
                  data: [pie.totals.dl, pie.totals.bp, pie.totals.sq],
                  backgroundColor: [colors.dl, colors.bp, colors.sq],
                  borderColor: '#1a1a1a',
                  borderWidth: 3,
                },
              ],
            }}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const raw = typeof ctx.raw === 'number' ? ctx.raw : 0
                      return ` ${Math.round((raw / pie.totalAll) * 100)}%`
                    },
                  },
                },
              },
              cutout: '60%',
            }}
          />
        </div>
        <div style={{ flex: 1, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LIFT_KEYS.map((l) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="dot" style={{ background: colors[l] }} />
              <span style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
                {LIFTS[l].name}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>
                {Math.round((pie.totals[l] / pie.totalAll) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-label">PERSONAL RECORDS</div>
      <div className="pr-list">
        {LIFT_KEYS.map((l) => (
          <div className="pr-row" key={l}>
            <div>
              <div className={`pr-lift ${l}`}>{LIFTS[l].name}</div>
              <div className="pr-date">{prs.best[l].d || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="pr-val">{prs.best[l].w ? `${prs.best[l].w}kg` : '—'}</div>
              <div className="pr-date">
                ~1RM: {prs.pr1rm[l].v ? `${Math.round(prs.pr1rm[l].v)}kg` : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-label">ESTIMATED 1RM PROGRESS</div>
      <div className="chart-wrap">
        <div className="chart-title">1RM ESTIMATE OVER TIME (KG)</div>
        <Line data={oneRmChart} options={chartOpts('kg', true)} />
      </div>
    </>
  )
}
