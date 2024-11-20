import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';

// Shared context for slider position
const SliderContext = React.createContext<number>(0);

interface DraggableSliderProps {
    onSliderChange: (value: number) => void;
    value: number;
  }
  
  const DraggableSlider: React.FC<DraggableSliderProps> = ({ onSliderChange, value }) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
  
    const handleDrag = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
  
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSliderChange(x);
    };
  
    useEffect(() => {
      const handleMouseUp = () => setIsDragging(false);
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
  
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
  
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging]);
  
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* Full-height vertical line container */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical Line (Track) that spans full height */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white opacity-50"
            style={{
              left: `${value * 100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
  
        {/* Invisible Horizontal Line (for drag functionality) */}
        <div
          ref={sliderRef}
          className="absolute top-1/2 left-0 w-full h-0 bg-transparent pointer-events-auto"
          onMouseDown={() => setIsDragging(true)}
        >
          {/* Slider Button */}
          <div
            className="absolute top-0 w-8 flex items-center justify-center pointer-events-auto"
            style={{
              left: `${value * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'ew-resize'
            }}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full shadow-lg" />
          </div>
        </div>
      </div>
    );
  };
  
  

const ShaderCube: React.FC = () => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);
    const sliderPosition = React.useContext(SliderContext);
    
    const { color1, color2, frequency, intensity } = useControls({
      color1: '#ff0000',
      color2: '#0000ff',
      frequency: { value: 10, min: 0, max: 50, step: 0.1 },
      intensity: { value: 0.5, min: 0, max: 1, step: 0.01 }
    });
  
    const uniforms = useMemo(
      () => ({
        uColor1: { value: new THREE.Color(color1) },
        uColor2: { value: new THREE.Color(color2) },
        uTime: { value: 0 },
        uFrequency: { value: frequency },
        uIntensity: { value: intensity },
        uSlider: { value: sliderPosition }
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
  const [sliderPosition, setSliderPosition] = useState(0.5);

  return (
    <div className="relative w-screen h-screen">
      <SliderContext.Provider value={sliderPosition}>
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <ShaderCube />
            <CameraOffset />
            <OrbitControls enabled={false} />
          </Canvas>
        </div>
        <DraggableSlider 
          onSliderChange={setSliderPosition}
          value={sliderPosition}
        />
      </SliderContext.Provider>
    </div>
  );
};

// CameraOffset Component to Use the Hook
const CameraOffset: React.FC = () => {
  useCameraOffset();
  return null;
};

export default Scene;
