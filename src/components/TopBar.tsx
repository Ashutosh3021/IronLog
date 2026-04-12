import { useIronLog } from '../context/IronLogContext'

export function TopBar() {
  const { state } = useIronLog()
  return (
    <div className="topbar">
      <div>
        <div className="logo">
          IRON LOG<span>5/3/1 TRACKER</span>
        </div>
      </div>
      <div className="cycle-info">
        CYCLE <strong>{state.cycle}</strong>
        <br />
        WEEK <strong>{state.week}</strong>
      </div>
    </div>
  )
}
