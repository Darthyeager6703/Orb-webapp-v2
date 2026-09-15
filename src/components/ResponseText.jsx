import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const styles = {
  wrap: {
    maxWidth: '60ch',
    color: '#F5F3EE',
    fontFamily: '"Neue Montreal", "Söhne", sans-serif',
    fontWeight: 300,
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  h: {
    fontFamily: '"Fraunces", "Canela", serif',
    fontWeight: 300,
    color: '#F5F3EE',
    letterSpacing: '0.02em',
    margin: '0.6em 0 0.3em',
  },
  strong: { color: '#E8CE8C', fontWeight: 500 },
  em: { color: '#F5F3EE', fontStyle: 'italic' },
  a: { color: '#C9A24B', textDecoration: 'underline', textUnderlineOffset: '3px' },
  code: {
    background: '#1C1C1F',
    color: '#E8CE8C',
    padding: '2px 6px',
    borderRadius: 3,
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.85em',
  },
  pre: {
    background: '#141416',
    border: '1px solid #2A2A2D',
    borderLeft: '2px solid #C9A24B',
    borderRadius: 4,
    padding: '14px 16px',
    overflowX: 'auto',
    margin: '0.8em 0',
  },
  blockquote: {
    borderLeft: '2px solid #C9A24B',
    margin: '0.8em 0',
    padding: '2px 0 2px 16px',
    color: '#8A8A8E',
    fontStyle: 'italic',
  },
  li: { marginBottom: '0.3em' },
  hr: { border: 'none', borderTop: '1px solid #2A2A2D', margin: '1em 0' },
  table: { borderCollapse: 'collapse', width: '100%', margin: '0.8em 0' },
  th: { textAlign: 'left', borderBottom: '1px solid #C9A24B', padding: '4px 10px', color: '#E8CE8C', fontWeight: 500 },
  td: { borderBottom: '1px solid #2A2A2D', padding: '4px 10px' },
}

export default function ResponseText({ text }) {
  if (!text) return null

  return (
    <div style={styles.wrap}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 style={{ ...styles.h, fontSize: '1.6em' }} {...p} />,
          h2: (p) => <h2 style={{ ...styles.h, fontSize: '1.35em' }} {...p} />,
          h3: (p) => <h3 style={{ ...styles.h, fontSize: '1.15em' }} {...p} />,
          strong: (p) => <strong style={styles.strong} {...p} />,
          em: (p) => <em style={styles.em} {...p} />,
          a: (p) => <a style={styles.a} target="_blank" rel="noreferrer" {...p} />,
          blockquote: (p) => <blockquote style={styles.blockquote} {...p} />,
          hr: () => <hr style={styles.hr} />,
          li: (p) => <li style={styles.li} {...p} />,
          table: (p) => <table style={styles.table} {...p} />,
          th: (p) => <th style={styles.th} {...p} />,
          td: (p) => <td style={styles.td} {...p} />,
          code({ inline, className, children, ...p }) {
            if (inline) {
              return (
                <code style={styles.code} {...p}>
                  {children}
                </code>
              )
            }
            const lang = /language-(\w+)/.exec(className || '')?.[1]
            return (
              <pre style={styles.pre}>
                {lang && (
                  <div style={{ color: '#8A8A8E', fontSize: '0.75em', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {lang}
                  </div>
                )}
                <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85em', color: '#F5F3EE' }} {...p}>
                  {children}
                </code>
              </pre>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}