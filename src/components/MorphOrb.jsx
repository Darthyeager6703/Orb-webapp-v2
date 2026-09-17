import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const noiseGLSL = `
  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`

const vertexShader = `
  uniform float uTime;
  uniform float uDeform;
  varying float vFlow;
  varying vec3 vPos;
  ${noiseGLSL}
  void main() {
    float flow = snoise(position * 1.6 + vec3(uTime * 0.12, uTime * 0.08, -uTime * 0.10));
    vFlow = flow;
    float dispNoise = snoise(position * 2.0 + uTime * 0.18);
    vec3 displaced = position + normal * dispNoise * uDeform;
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vPos = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying float vFlow;
  varying vec3 vPos;

  void main() {
    vec3 faceNormal = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 viewDir = normalize(-vPos);

    vec3 keyLight = normalize(vec3(0.6, 0.8, 0.5));
    vec3 fillLight = normalize(vec3(-0.5, -0.3, 0.6));

    float keyDiffuse = dot(faceNormal, keyLight) * 0.5 + 0.5;
    float fillDiffuse = dot(faceNormal, fillLight) * 0.5 + 0.5;
    float diffuse = keyDiffuse * 0.75 + fillDiffuse * 0.25;

    vec3 halfDir = normalize(keyLight + viewDir);
    float spec = pow(max(dot(faceNormal, halfDir), 0.0), 24.0);

    // curvature-based self-occlusion — darkens tight folds in the flow field, free (reuses derivatives)
    float curvature = abs(dFdx(vFlow)) + abs(dFdy(vFlow));
    float ao = 1.0 - smoothstep(0.0, 0.35, curvature) * 0.65;

    // fresnel — liquid metal reflects hardest at grazing angles, sees through at direct angles
    float fresnel = pow(1.0 - max(dot(faceNormal, viewDir), 0.0), 3.0);

    // fake environment: dark above, warm gold glow toward the key light side
    vec3 reflectDir = reflect(-viewDir, faceNormal);
    float envMix = reflectDir.y * 0.5 + 0.5;
    vec3 envDark = vec3(0.02, 0.015, 0.01);
    vec3 envWarm = vec3(0.95, 0.72, 0.32);
    float lightSide = max(dot(reflectDir, keyLight), 0.0);
    vec3 envColor = mix(envDark, envWarm, envMix * lightSide);

    float swirl = smoothstep(-0.5, 0.8, vFlow);
    vec3 darkGold = vec3(0.10, 0.065, 0.02);
    vec3 midGold  = vec3(0.60, 0.40, 0.11);
    vec3 richGold = vec3(0.85, 0.58, 0.17);
    vec3 base = mix(darkGold, midGold, swirl);
    base = mix(base, richGold, swirl * 0.4);

    vec3 lit = base * (0.65 + diffuse * 0.4) * ao;
    lit += vec3(1, 0.92, 0.7) * spec * 0.9;
    lit = mix(lit, envColor, fresnel * 0.55);

    gl_FragColor = vec4(clamp(lit, 0.0, 0.95), 1.0);
  }
`

function makeMat() {
  return {
    uniforms: { uTime: { value: 0 }, uDeform: { value: 0 } },
    vertexShader,
    fragmentShader,
  }
}

export default function MorphOrb({ deform = 0, split = 0, mode = 'listening', radius = 0.6 }) {
  const introRef = useRef(0)
  const bigRef = useRef()
  const bigMatRef = useRef()
  const dropRefs = [useRef(), useRef(), useRef(), useRef()]
  const dropMatRefs = [useRef(), useRef(), useRef(), useRef()]
  const thinkBlend = useRef(0)

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
  const bigGeo = useMemo(() => new THREE.IcosahedronGeometry(radius, isMobile ? 5 : 7), [radius])
  const dropGeo = useMemo(() => new THREE.IcosahedronGeometry(radius * 0.28, isMobile ? 3 : 5), [radius])

  const bigMat = useMemo(() => makeMat(), [])
  const dropMats = useMemo(() => [makeMat(), makeMat(), makeMat(), makeMat()], [])

  useFrame((state, delta) => {
  const t = state.clock.elapsedTime

  introRef.current = Math.min(introRef.current + delta / 1.4, 1) // delta from useFrame's second arg
  

  if (bigMatRef.current) {
    bigMatRef.current.uniforms.uTime.value = t
    bigMatRef.current.uniforms.uDeform.value = THREE.MathUtils.lerp(
      bigMatRef.current.uniforms.uDeform.value, deform, 0.04
    )
  }
  dropMatRefs.forEach((r) => { if (r.current) r.current.uniforms.uTime.value = t })

  const bigScale = THREE.MathUtils.lerp(bigRef.current?.scale.x ?? 1, 1 - split, 0.06)
  if (bigRef.current) {
  const introScale = THREE.MathUtils.smoothstep ? THREE.MathUtils.smoothstep(introRef.current, 0, 1) : introRef.current
  bigRef.current.scale.setScalar(bigScale * introScale)
  bigRef.current.visible = bigScale > 0.01
  bigRef.current.rotation.y += 0.0008
}

  const targetThink = mode === 'thinking' ? 1 : 0
  thinkBlend.current = THREE.MathUtils.lerp(thinkBlend.current, targetThink, 0.05)
  const tb = thinkBlend.current

  for (let i = 0; i < 4; i++) {
    const mesh = dropRefs[i].current
    if (!mesh) continue
    const s = THREE.MathUtils.lerp(mesh.scale.x, split, 0.06)
    mesh.scale.setScalar(s)
    mesh.visible = s > 0.01

    const phase = i * 0.22
    const lx = (i - 1.5) * 0.32
    const ly = Math.sin(t * 3 - phase * Math.PI * 2) * 0.12
    const lz = 0

    const angle = t * 1.1 + i * (Math.PI * 2 / 4)
    const tx = Math.cos(angle) * 0.45
    const tz = Math.sin(angle) * 0.45
    const ty = Math.sin(t * 2 + i) * 0.04

    const x = THREE.MathUtils.lerp(lx, tx, tb)
    const y = THREE.MathUtils.lerp(ly, ty, tb)
    const z = THREE.MathUtils.lerp(lz, tz, tb)

    mesh.position.set(x, y, z)
  }
})

  return (
    <group>
      <mesh ref={bigRef} geometry={bigGeo}>
        <shaderMaterial ref={bigMatRef} args={[bigMat]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={dropRefs[i]} geometry={dropGeo} scale={0}>
          <shaderMaterial ref={dropMatRefs[i]} args={[dropMats[i]]} />
        </mesh>
      ))}
    </group>
  )
}