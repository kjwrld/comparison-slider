import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// import { useControls } from 'leva';
import Book from './Book';
// import ShaderCube from './ShaderCube';

// Shared context for slider position
const SliderContext = React.createContext<number>(0);

interface DraggableSliderProps {
    onSliderChange: (value: number) => void;
    onScreenXChange: (screenX: number) => void;
    value: number;
  }
  
  const DraggableSlider: React.FC<DraggableSliderProps> = ({ onSliderChange, onScreenXChange, value  }) => {
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
  const [sliderScreenX, setSliderScreenX] = useState(window.innerWidth * 0.5);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (value: number) => {
    setSliderPosition(value);
  };

  const handleScreenXChange = (screenX: number) => {
    setSliderScreenX(screenX);
  };

  return (
    <div className="relative w-screen h-screen" ref={canvasRef}>
      <SliderContext.Provider value={sliderPosition}>
        {/* Canvas */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            {/* <ShaderCube sliderContext={SliderContext} /> */}
            <Book sliderPosition={sliderPosition} sliderScreenX={sliderScreenX} canvasWidth={window.innerWidth} />

            <CameraOffset />
            <OrbitControls enabled={false} />
          </Canvas>
        </div>

        {/* Draggable Slider */}
        <DraggableSlider onSliderChange={handleSliderChange} onScreenXChange={handleScreenXChange} value={sliderPosition} />
      </SliderContext.Provider>

      {/* Text Overlay */}
      <div
        className="absolute left-4 text-left pointer-events-none"
        style={{
          bottom: '20%', // Position between middle and bottom
          userSelect: 'none', // Make text non-selectable
        }}
      >
        <h1 className="text-6xl font-bold text-white leading-tight">Bring your world to life</h1>
        <p className="text-4xl text-white/70">3D without Limits</p>
      </div>
    </div>
  );
};

// CameraOffset Component to Use the Hook
const CameraOffset: React.FC = () => {
  useCameraOffset();
  return null;
};

export default Scene;
