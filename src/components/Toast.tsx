import { useStore } from '../state/store'

export function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 104,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 60,
        pointerEvents: 'none',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          background: 'oklch(0.25 0.012 250)',
          color: '#fff',
          font: '500 13.5px var(--font-ui)',
          padding: '12px 20px',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '84%',
          textAlign: 'center',
          animation: 'toastIn 0.18s ease',
        }}
      >
        {toast}
      </div>
    </div>
  )
}
