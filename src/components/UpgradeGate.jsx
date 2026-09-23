const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(5,5,6,0.85)',
  backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 70,
}
const box = {
  width: 400, background: '#141416', border: '1px solid #C9A24B', borderRadius: 6,
  padding: '28px 32px', color: '#F5F3EE', fontFamily: "'Inter', sans-serif",
  textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', lineHeight: 1.5,
}
const btn = {
  background: 'transparent', border: '1px solid #C9A24B', color: '#E8CE8C',
  padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 13, marginTop: 20,
}

export default function UpgradeGate({ step, onYes, onOkay }) {
  if (step === 0) return null
  return (
    <div style={overlay}>
      <div style={box}>
        {step === 1 && (
          <>
            <div>Wait — you seriously thought there was a paid version for this web app, my guy?</div>
            <button style={btn} onClick={onYes}>Yes</button>
          </>
        )}
        {step === 2 && (
          <>
            <div>Well, too bad. Demo over . Enter your own key and use it infinitely.</div>
            <button style={btn} onClick={onOkay}>Okay</button>
          </>
        )}
      </div>
    </div>
  )
}