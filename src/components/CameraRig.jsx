import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function CameraRig() {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // idle autonomous drift — slow circular wander, always on
    const driftX = Math.sin(t * 0.15) * 0.25
    const driftY = Math.cos(t * 0.11) * 0.15

    // mouse parallax — shifts opposite cursor, layered on top of drift
    const parallaxX = -mouseRef.current.x * 0.3
    const parallaxY = mouseRef.current.y * 0.2

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, driftX + parallaxX, 0.1)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, driftY + parallaxY, 0.1)
    camera.position.z = 4
    camera.lookAt(0, 0, 0)
  })

  return null
}