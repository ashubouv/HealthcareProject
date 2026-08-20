import { useEffect, useState } from 'react'
import { Signal, Wifi, BatteryFull } from 'lucide-react'

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function StatusBar() {
  const [time, setTime] = useState(timeNow)

  // Tick on the minute so the clock is always current.
  useEffect(() => {
    const id = setInterval(() => setTime(timeNow()), 15_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="statusbar">
      <span>{time}</span>
      <div className="statusbar__right">
        <Signal size={15} strokeWidth={2.4} />
        <Wifi size={15} strokeWidth={2.4} />
        <BatteryFull size={17} strokeWidth={2} />
      </div>
    </div>
  )
}
