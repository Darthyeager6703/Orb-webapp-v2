export default function VoicePicker({ voice, setVoice, voices }) {
  return (
    <select
      value={voice}
      onChange={(e) => setVoice(e.target.value)}
      style={{ background: '#141416', color: '#F5F3EE', border: '1px solid #C9A24B', padding: '4px 8px' }}
    >
      {voices.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  )
}