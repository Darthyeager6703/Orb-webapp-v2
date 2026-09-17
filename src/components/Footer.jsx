import { GithubLogoIcon } from '@phosphor-icons/react'

export default function Footer() {
  return (
    <div style={{
      position: 'absolute', bottom: 10, width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontSize: 11, color: '#8A8A8E', fontFamily: "'Inter', sans-serif",
      letterSpacing: '0.05em', zIndex: 5,
    }}>
      <span>Made with intent</span>
      <a href="https://github.com/yourusername/yourrepo" target="_blank" rel="noreferrer" style={{ display: 'flex' }}>
        <GithubLogoIcon size={16} weight="duotone" color="#C9A24B" />
      </a>
    </div>
  )
}