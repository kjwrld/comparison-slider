import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';

// Define shader materials
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uFrequency;
  uniform float uIntensity;
  
  varying vec2 vUv;
  
  void main() {
    vec3 color = uColor;
    float strength = sin(vUv.x * uFrequency + uTime) * uIntensity;
    gl_FragColor = vec4(color * (strength + 1.0), 1.0);
  }
`;

const ShaderCube: React.FC = () => {
  // Create shader material with uniforms
  const shaderRef = React.useRef<THREE.ShaderMaterial>(null);

  // Leva controls
  const { color, frequency, intensity } = useControls({
    color: '#ffffff',
    frequency: {
      value: 10,
      min: 0,
      max: 50,
      step: 0.1
    },
    intensity: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01
    }
  });

  React.useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uColor.value = new THREE.Color(color);
      shaderRef.current.uniforms.uFrequency.value = frequency;
      shaderRef.current.uniforms.uIntensity.value = intensity;
    }
  }, [color, frequency, intensity]);

  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uColor: { value: new THREE.Color(color) },
          uTime: { value: 0 },
          uFrequency: { value: frequency },
          uIntensity: { value: intensity }
        }}
      />
    </mesh>
  );
};

const Scene: React.FC = () => {
  return (
    <div className="h-screen w-full bg-black">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <ShaderCube />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Scene;