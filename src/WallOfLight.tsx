import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, Raycaster, Vector3 } from 'three';

interface WallOfLightProps {
  sliderPosition: number;
  onIntersect?: (side: 'left' | 'right', point: Vector3) => void;
}

const WallOfLight: React.FC<WallOfLightProps> = ({ sliderPosition, onIntersect }) => {
  const meshRef = useRef<Mesh>(null);
  const raycasterRef = useRef(new Raycaster());
  const { scene } = useThree();

  // Setup raycaster
  useEffect(() => {
    if (meshRef.current) {
      raycasterRef.current.far = 10;
      raycasterRef.current.near = 0.1;
    }
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      // Update wall position
      const wallX = sliderPosition * 10 - 5;
      const centerY = 0;
      const centerZ = 0;
      meshRef.current.position.set(wallX, centerY, centerZ);

      // Cast rays in both directions
      const origin = new Vector3(wallX, centerY, centerZ);
      
      // Cast ray to the right
      raycasterRef.current.set(origin, new Vector3(1, 0, 0));
      const rightIntersects = raycasterRef.current.intersectObjects(
        scene.children.filter(obj => obj !== meshRef.current)
      );

      // Cast ray to the left
      raycasterRef.current.set(origin, new Vector3(-1, 0, 0));
      const leftIntersects = raycasterRef.current.intersectObjects(
        scene.children.filter(obj => obj !== meshRef.current)
      );

      // Process intersections
      if (rightIntersects.length > 0) {
        onIntersect?.('right', rightIntersects[0].point);
      }
      if (leftIntersects.length > 0) {
        onIntersect?.('left', leftIntersects[0].point);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.05, 5, 10]} />
      <meshStandardMaterial 
        // color="yellow" 
        // emissive="yellow" 
        // emissiveIntensity={5}
        transparent
        opacity={0}
      />
    </mesh>
  );
};

export default WallOfLight;