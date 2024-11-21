import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';

interface ShaderCubeProps {
  sliderContext: React.Context<number>;
}

const ShaderCube: React.FC<ShaderCubeProps> = ({ sliderContext }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const sliderPosition = React.useContext(sliderContext);

  const { color1, color2, frequency, intensity } = useControls({
    color1: '#ff0000',
    color2: '#0000ff',
    frequency: { value: 10, min: 0, max: 50, step: 0.1 },
    intensity: { value: 0.5, min: 0, max: 1, step: 0.01 },
  });

  const uniforms = useMemo(
    () => ({
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uTime: { value: 0 },
      uFrequency: { value: frequency },
      uIntensity: { value: intensity },
      uSlider: { value: sliderPosition },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uColor1.value.set(color1);
      uniforms.uColor2.value.set(color2);
      uniforms.uFrequency.value = frequency;
      uniforms.uIntensity.value = intensity;
      uniforms.uSlider.value = sliderPosition;
    }
  });

  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;

          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform float uTime;
          uniform float uFrequency;
          uniform float uIntensity;
          uniform float uSlider;

          varying vec2 vUv;
          varying vec3 vPosition;

          void main() {
            // Use position.x for comparison split
            float split = step(vPosition.x, mix(-1.0, 1.0, uSlider));
            vec3 baseColor = mix(uColor1, uColor2, split);
            float strength = sin(vUv.x * uFrequency + uTime) * uIntensity;
            gl_FragColor = vec4(baseColor * (strength + 1.0), 1.0);
          }
        `}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default ShaderCube;
