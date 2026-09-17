import { useState, useEffect } from 'react'
import { getTokenTotals, setTokenTotals, getRates, setRates, getCostBreakdown } from '../lib/costTracker'

const boxStyle = {
  background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE',
  padding: '4px 6px', borderRadius: 3, fontSize: 12, width: 90,
}
const resultStyle = {
  ...boxStyle, border: '1px solid rgba(201,162,75,0.35)', color: '#E8CE8C',
  background: 'rgba(201,162,75,0.06)',
}
const rowStyle = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }
const labelStyle = { width: 90, color: '#8A8A8E', fontSize: 11 }

export default function CostBreakdown() {
  const [tokens, setTokens] = useState(getTokenTotals())
  const [rates, setRatesState] = useState(getRates())

  useEffect(() => {
    const id = setInterval(() => setTokens(getTokenTotals()), 1000)
    return () => clearInterval(id)
  }, [])

  const { inputCost, outputCost, totalCost } = getCostBreakdown()

  const handleTokenEdit = (field, value) => {
    const n = parseInt(value) || 0
    const next = { ...tokens, [field]: n }
    setTokens(next)
    setTokenTotals(next.input, next.output)
  }

  const handleRateEdit = (field, value) => {
    const n = parseFloat(value) || 0
    const next = { ...rates, [field]: n }
    setRatesState(next)
    setRates(next.input, next.output)
  }

  return (
    <div style={{
      background: '#141416', border: '1px solid #C9A24B', borderRadius: 4,
      padding: '16px 18px', color: '#F5F3EE', fontFamily: "'Inter', sans-serif",
      fontSize: 12, minWidth: 340,
    }}>
      <div style={{ color: '#8A8A8E', fontSize: 10.5, lineHeight: 1.5, marginBottom: 14 }}>
        Keep in mind that this is essentially just a generalized cost — adjust rates to match your provider.
        Adjust the output token rate for any reasoning and other intermediate token costs accordingly.
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Input tokens</span>
        <input type="number" style={boxStyle} value={tokens.input}
          onChange={(e) => handleTokenEdit('input', e.target.value)} />
        <span style={{ color: '#8A8A8E' }}>×</span>
        <input type="number" step="0.01" style={boxStyle} value={rates.input}
          onChange={(e) => handleRateEdit('input', e.target.value)} />
        <span style={{ color: '#8A8A8E' }}>=</span>
        <input type="text" readOnly style={resultStyle} value={`$${inputCost.toFixed(4)}`} />
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Output tokens</span>
        <input type="number" style={boxStyle} value={tokens.output}
          onChange={(e) => handleTokenEdit('output', e.target.value)} />
        <span style={{ color: '#8A8A8E' }}>×</span>
        <input type="number" step="0.01" style={boxStyle} value={rates.output}
          onChange={(e) => handleRateEdit('output', e.target.value)} />
        <span style={{ color: '#8A8A8E' }}>=</span>
        <input type="text" readOnly style={resultStyle} value={`$${outputCost.toFixed(4)}`} />
      </div>

      <div style={{ borderTop: '1px solid rgba(201,162,75,0.2)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#8A8A8E', fontSize: 11 }}>Total estimate</span>
        <input type="text" readOnly style={{ ...resultStyle, width: 110, fontSize: 13, fontWeight: 500 }} value={`$${totalCost.toFixed(4)}`} />
      </div>
    </div>
  )
}