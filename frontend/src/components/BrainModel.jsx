import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function NeuralCloud({ count = 800 }) {
  const pointsRef = useRef()
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        // Generating points in an organic, dual-hemisphere layout
        const theta = Math.random() * 2 * Math.PI
        const phi = Math.acos(2 * Math.random() - 1)
        
        let x = Math.sin(phi) * Math.cos(theta) * 1.6
        const y = Math.sin(phi) * Math.sin(theta) * 1.2
        const z = Math.cos(phi) * 1.8

        // Introduce a slight longitudinal fissure (split between hemispheres)
        if (x > -0.1 && x < 0.1) {
            x += (x > 0 ? 0.2 : -0.2)
        }
        
        temp[i * 3]     = x + (Math.random() - 0.5) * 0.2
        temp[i * 3 + 1] = y + (Math.random() - 0.5) * 0.2
        temp[i * 3 + 2] = z + (Math.random() - 0.5) * 0.2
    }
    return temp
  }, [count])

  useFrame((state, delta) => {
    if (pointsRef.current) {
        pointsRef.current.rotation.y += delta * 0.15
        pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  return (
    <Points ref={pointsRef} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial 
        transparent 
        color="#63d2ff" 
        size={0.04} 
        sizeAttenuation={true} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
        opacity={0.7}
      />
    </Points>
  )
}

export default function BrainModel() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'transparent' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <NeuralCloud />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.0} enablePan={false} />
      </Canvas>
    </div>
  )
}
