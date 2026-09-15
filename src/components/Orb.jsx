import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  uniform float uTime;
  uniform float uDeform;
  varying float vFlow;
  varying vec3 vNormal;
  varying vec3 vViewDir;

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

  void main() {
    // slow-moving internal flow — drives color swirl only, NOT geometry
    float flow = snoise(position * 1.6 + vec3(uTime * 0.12, uTime * 0.08, -uTime * 0.10));
    vFlow = flow;

    // deformation — zero at idle (perfectly smooth surface), scaled up when speaking
    float dispNoise = snoise(position * 2.0 + uTime * 0.18);
    vec3 displaced = position + normal * dispNoise * uDeform;

    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying float vFlow;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);
    float swirl = smoothstep(-0.3, 0.6, vFlow);

    vec3 darkGold = vec3(0.09, 0.06, 0.02);
    vec3 midGold  = vec3(0.55, 0.38, 0.12);
    vec3 richGold = vec3(0.82, 0.58, 0.20); // capped hard under 1.0, no white creep

    vec3 color = mix(darkGold, midGold, swirl);
    color = mix(color, richGold, fresnel * 0.35 + swirl * 0.25);

    float alpha = 0.55 + swirl * 0.25 + fresnel * 0.2;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.9));
  }
`

export default function Orb({ deform = 0, radius = 0.6 }) {
  const meshRef = useRef()
  const materialRef = useRef()

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(radius, isMobile ? 16 : 32),
    [radius]
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uDeform.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uDeform.value,
        deform,
        0.04 // slow settle, matches slowed-down feel overall
      )
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0008 // slowed rotation too
      meshRef.current.rotation.x += 0.0003
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 }, uDeform: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}