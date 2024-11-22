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
    uTransitionWidth: { value: 0.02 }, // Made smaller for sharper split
    uPlaneNormal: { value: new THREE.Vector3(1, 0, 0) }, // Wall normal direction
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
      const localWallPos = wallPosition.x;
      shaderRef.current.uniforms.uWallPosition.value = localWallPos;
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
          uniform vec3 uPlaneNormal;

          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;

          float smoothTransition(float edge0, float edge1, float x) {
            float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            return t * t * (3.0 - 2.0 * t);
          }

          void main() {
            // Calculate signed distance from the splitting plane
            float signedDistance = dot(vWorldPosition - vec3(uWallPosition, 0.0, 0.0), uPlaneNormal);
            
            // Create a sharp transition with a small smooth edge
            float blend = smoothstep(-uTransitionWidth, uTransitionWidth, signedDistance);
            
            // Determine material properties based on signed distance
            vec3 baseColor = mix(uColor1, uColor2, blend);
            float roughness = mix(uRoughness1, uRoughness2, blend);
            float metalness = mix(uMetalness1, uMetalness2, blend);
            
            // Enhanced material effects
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            vec3 reflection = mix(baseColor, vec3(1.0), fresnel * metalness);
            
            // Add dynamic effects
            float sparkle = sin(vUv.x * 10.0 + uTime) * sin(vUv.y * 10.0 + uTime) * 0.1;
            
            // Add transition highlight
            float transitionGlow = (1.0 - abs(signedDistance)) * 0.5 * 
                                 (sin(uTime * 2.0) * 0.5 + 0.5);
            
            // Final color
            vec3 finalColor = mix(baseColor, reflection, roughness) + sparkle;
            finalColor += vec3(transitionGlow * 0.2); // Add subtle glow at transition
            
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