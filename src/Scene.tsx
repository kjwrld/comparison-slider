import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';

const ShaderCube: React.FC = () => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
    // Leva controls
    const { color, frequency, intensity } = useControls({
      color: '#ffffff',
      frequency: { value: 10, min: 0, max: 50, step: 0.1 },
      intensity: { value: 0.5, min: 0, max: 1, step: 0.01 }
    });
  
    // Stable uniforms object
    const uniforms = useMemo(
      () => ({
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uFrequency: { value: frequency },
        uIntensity: { value: intensity }
      }),
      []
    );
  
    // Update uniforms dynamically in the render loop
    useFrame(({ clock }) => {
      if (shaderRef.current) {
        uniforms.uTime.value = clock.getElapsedTime(); // Update time
        uniforms.uColor.value.set(color); // Update color
        uniforms.uFrequency.value = frequency; // Update frequency
        uniforms.uIntensity.value = intensity; // Update intensity
      }
    });
  
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
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
          `}
          uniforms={uniforms} // Pass stable uniforms object
        />
      </mesh>
    );
  };

// Reusable Hook: Camera Offset Based on Mouse Movement
const useCameraOffset = () => {
  const { camera } = useThree();
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState({ x: 0, y: 0 });

  // Update target based on mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = -(e.clientX / innerWidth - 0.5) * 2; // Normalize [-1, 1]
      const y = (e.clientY / innerHeight - 0.5) * 2; // Normalize [-1, 1]
      setTarget({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smoothly interpolate camera offset
  useFrame(() => {
    setCurrent((prev) => ({
      x: prev.x + (target.x - prev.x) * 0.1, // Smooth lerp
      y: prev.y + (target.y - prev.y) * 0.1
    }));

    camera.position.x = current.x * 2; // Scale offset
    camera.position.y = current.y * 2;
    camera.lookAt(0, 0, 0); // Ensure camera always looks at the origin
  });
};

const Scene: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <ShaderCube />
        {/* Use the camera offset hook */}
        <CameraOffset />
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  );
};

// CameraOffset Component to Use the Hook
const CameraOffset: React.FC = () => {
  useCameraOffset();
  return null;
};

export default Scene;
