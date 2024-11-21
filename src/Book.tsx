import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, ShaderMaterial } from "three";

interface BookProps {
  sliderPosition: number;
  sliderScreenX: number;
  canvasWidth: number;
}

const Book: React.FC<BookProps> = ({ sliderPosition, sliderScreenX, canvasWidth }) => {
  const bookRef = useRef<Mesh>(null);

  const shaderMaterial = useRef(
    new ShaderMaterial({
      uniforms: {
        uSliderValue: { value: sliderPosition },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uSliderValue;
        varying vec2 vUv;
        void main() {
          vec3 baseColor = vec3(1.0, 1.0, 1.0);
          vec3 holographicColor = vec3(0.0, 1.0, 1.0);
          float threshold = vUv.x - uSliderValue;
          vec3 color = mix(baseColor, holographicColor, step(0.0, threshold));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
    })
  ).current;

  useFrame(() => {
    if (canvasWidth > 0) {
      // Convert slider's screen X position to shader space (normalized between 0 and 1)
      const normalizedSliderValue = sliderScreenX / canvasWidth;
      shaderMaterial.uniforms.uSliderValue.value = normalizedSliderValue;
    }
  });

  return (
    <mesh ref={bookRef} material={shaderMaterial}>
      <boxGeometry args={[1.28, 1.71, 0.05]} />
    </mesh>
  );
};

export default Book;