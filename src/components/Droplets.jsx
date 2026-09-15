import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Droplets({ mode = 'listening' }) {
  const groupRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!groupRef.current) return
    groupRef.current.children.forEach((dot, i) => {
      if (mode === 'listening') {
        const phase = i * 0.22
        dot.position.y = Math.sin(t * 3 - phase * Math.PI * 2) * 0.12
        dot.position.x = (i - 1.5) * 0.32
        dot.position.z = 0
      } else if (mode === 'thinking') {
        const angle = t * 1.1 + i * (Math.PI * 2 / 4)
        dot.position.x = Math.cos(angle) * 0.45
        dot.position.z = Math.sin(angle) * 0.45
        dot.position.y = Math.sin(t * 2 + i) * 0.04
      }
    })
  })

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#8C6A28"
            emissive="#5A3F14"
            emissiveIntensity={0.5}
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}