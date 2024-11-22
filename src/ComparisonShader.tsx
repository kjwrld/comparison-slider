import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ComparisonShaderProps {
  wallPosition: {
    x: number;
  };
  material1: {
    color: string;
    roughness: number;
    metalness: number;
  };
  material2: {
    color: string;
    roughness: number;
    metalness: number;
  };
}

const ComparisonShader: React.FC<ComparisonShaderProps> = ({ 
  wallPosition, 
  material1, 
  material2 
}) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uWallPosition: { value: 0 },
    uColor1: { value: new THREE.Color(material1.color) },
    uColor2: { value: new THREE.Color(material2.color) },
    uRoughness1: { value: material1.roughness },
    uRoughness2: { value: material2.roughness },
    uMetalness1: { value: material1.metalness },
    uMetalness2: { value: material2.metalness },
    uTime: { value: 0 },
    uTransitionWidth: { value: 0.2 },
    uSide: { value: 0 } // 0 for left, 1 for right
  }), [material1, material2]);

  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uColor1.value.set(material1.color);
      shaderRef.current.uniforms.uColor2.value.set(material2.color);
      shaderRef.current.uniforms.uRoughness1.value = material1.roughness;
      shaderRef.current.uniforms.uRoughness2.value = material2.roughness;
      shaderRef.current.uniforms.uMetalness1.value = material1.metalness;
      shaderRef.current.uniforms.uMetalness2.value = material2.metalness;
    }
  }, [material1, material2]);

  useFrame((state) => {
    if (shaderRef.current && meshRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const localWallPos = wallPosition.x / 5;
      shaderRef.current.uniforms.uWallPosition.value = localWallPos;
      
      // Determine which side of the wall the mesh is on
      const meshPosition = meshRef.current.position.x;
      shaderRef.current.uniforms.uSide.value = meshPosition > wallPosition.x ? 1 : 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          uniform float uTime;

          void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normal;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            
            float wave = sin(position.x * 2.0 + uTime) * 0.02;
            vec3 pos = position + normal * wave;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uWallPosition;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform float uRoughness1;
          uniform float uRoughness2;
          uniform float uMetalness1;
          uniform float uMetalness2;
          uniform float uTransitionWidth;
          uniform float uTime;
          uniform float uSide;

          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;

          float smoothTransition(float edge0, float edge1, float x) {
            float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            return t * t * (3.0 - 2.0 * t);
          }

          void main() {
            // Use world position for position-based effects
            float worldX = vWorldPosition.x;
            
            // Determine material based on wall position
            vec3 baseColor = uSide > 0.5 ? uColor2 : uColor1;
            float roughness = uSide > 0.5 ? uRoughness2 : uRoughness1;
            float metalness = uSide > 0.5 ? uMetalness2 : uMetalness1;
            
            // Add transition effect near the wall
            float distToWall = abs(worldX - uWallPosition);
            float transitionFactor = smoothTransition(0.0, uTransitionWidth, distToWall);
            
            // Enhanced material effects
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            vec3 reflection = mix(baseColor, vec3(1.0), fresnel * metalness);
            
            // Add dynamic effects
            float sparkle = sin(vUv.x * 10.0 + uTime) * sin(vUv.y * 10.0 + uTime) * 0.1;
            float pulse = sin(distToWall * 5.0 - uTime) * 0.1;
            
            // Final color
            vec3 finalColor = mix(baseColor, reflection, roughness) + sparkle + pulse;
            
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

export default ComparisonShader;