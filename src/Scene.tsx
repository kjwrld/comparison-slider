import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ComparisonShader from './ComparisonShader';
import AnimatedSliderButton from './AnimatedSliderButton';
import WallOfLight from './WallOfLight';
// import Book from './Book';

interface MaterialProps {
    color: string;
    roughness: number;
    metalness: number;
}
  
interface SceneState {
    sliderPosition: number;
    sliderScreenX: number;
    canvasWidth: number;
    material1: MaterialProps;
    material2: MaterialProps;
}

// DraggableSlider component remains the same
interface DraggableSliderProps {
    onSliderChange: (value: number) => void;
    onScreenXChange: (screenX: number) => void;
    value: number;
}

const DraggableSlider: React.FC<DraggableSliderProps> = ({ onSliderChange, onScreenXChange, value }) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
  
    const handleDrag = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSliderChange(x);
      onScreenXChange(e.clientX);
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
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 bottom-0 w-1 bg-white opacity-50"
            style={{ left: `${value * 100}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div
          ref={sliderRef}
          className="absolute top-1/2 left-0 w-full h-0 bg-transparent pointer-events-auto"
          onMouseDown={() => setIsDragging(true)}
        >
          <div
            className="absolute top-0 w-8 flex items-center justify-center pointer-events-auto"
            style={{ left: `${value * 100}%`, transform: 'translate(-50%, -50%)', cursor: 'ew-resize' }}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full shadow-lg" />
          </div>
        </div>
      </div>
    );
  };

// Camera control hook
const useCameraOffset = () => {
  const { camera } = useThree();
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = -(e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setTarget({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    setCurrent((prev) => ({
      x: prev.x + (target.x - prev.x) * 0.1,
      y: prev.y + (target.y - prev.y) * 0.1
    }));

    camera.position.x = current.x * 2;
    camera.position.y = current.y * 2;
    camera.lookAt(0, 0, 0);
  });
};

// Scene objects wrapper component
const SceneObjects: React.FC<{
    sliderPosition: number;
    material1: MaterialProps;
    material2: MaterialProps;
  }> = ({ sliderPosition, material1, material2 }) => {
    useCameraOffset();
    const handleWallIntersect = (side: 'left' | 'right', point: THREE.Vector3) => {
      // You can use this to trigger additional effects when the wall intersects objects
      console.log(`Wall intersected object on ${side} side at`, point);
    };
  
    return (
      <>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
  
        <mesh position={[0, 0, -2]} scale={[1, 1, 1]}>
          <ComparisonShader
            wallPosition={{ x: (sliderPosition * 10) - 5 }}
            material1={material1}
            material2={material2}
          />
        </mesh>
  
        <WallOfLight 
          sliderPosition={sliderPosition}
          onIntersect={handleWallIntersect}
        />
      </>
    );
};

// Main Scene component
const Scene: React.FC = () => {
  // Initialize state with TypeScript types
  const [state, setState] = useState<SceneState>({
    sliderPosition: 0.5,
    sliderScreenX: 0,
    canvasWidth: 0,
    material1: {
      color: '#ff4444',
      roughness: 0.2,
      metalness: 0.8,
    },
    material2: {
      color: '#4444ff',
      roughness: 0.8,
      metalness: 0.2,
    },
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);

  // Add these handlers for the animation button
  const handleAnimationStart = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = (newPosition: number) => {
    setState(prev => ({
      ...prev,
      sliderPosition: newPosition,
      sliderScreenX: canvasRef.current ? canvasRef.current.clientWidth * newPosition : prev.sliderScreenX
    }));
  };

  const handleSliderChange = (value: number) => {
    if (!isAnimating) {
      setState(prev => ({ ...prev, sliderPosition: value }));
    }
  };

  const handleScreenXChange = (screenX: number) => {
    if (!isAnimating) {
      setState(prev => ({ ...prev, sliderScreenX: screenX }));
    }
  };

  // Effect to reset animation state
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000); // Match this with the animation duration in the button component
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Initialize and update canvas width
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.clientWidth;
        setState(prev => ({
          ...prev,
          canvasWidth: width,
          sliderScreenX: width * prev.sliderPosition
        }));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="relative w-screen h-screen" ref={canvasRef}>
      {/* Canvas */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <SceneObjects
            sliderPosition={state.sliderPosition}
            sliderScreenX={state.sliderScreenX}
            canvasWidth={state.canvasWidth}
            material1={state.material1}
            material2={state.material2}
          />
        </Canvas>
      </div>

      {/* Draggable Slider */}
      <DraggableSlider
        onSliderChange={handleSliderChange}
        onScreenXChange={handleScreenXChange}
        value={state.sliderPosition}
      />

      {/* Text Overlay */}
      <div
        className="absolute left-4 text-left pointer-events-none"
        style={{
          bottom: '20%',
          userSelect: 'none',
        }}
      >
        <h1 className="text-6xl font-bold text-white leading-tight">
          Bring your world to life
        </h1>
        <p className="text-4xl text-white/70">3D without Limits</p>
      </div>

      {/* Animated Slider Button */}
      <AnimatedSliderButton
        sliderPosition={state.sliderPosition}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      />
    </div>
  );
};

export default Scene;