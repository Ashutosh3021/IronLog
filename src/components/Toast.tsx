import { useIronLog } from '../context/IronLogContext'

export function Toast() {
  const { toast } = useIronLog()
  return <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
}
