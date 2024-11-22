// AnimatedSliderButton.tsx
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';

interface AnimatedSliderButtonProps {
  sliderPosition: number;
  onAnimationStart: () => void;
  onAnimationComplete: (newPosition: number) => void;
}

const AnimatedSliderButton: React.FC<AnimatedSliderButtonProps> = ({
  sliderPosition,
  onAnimationStart,
  onAnimationComplete,
}) => {
  const handleClick = useCallback(() => {
    onAnimationStart();
    // Calculate target position (if slider is in left half, move to right, and vice versa)
    const targetPosition = sliderPosition < 0.5 ? 1 : 0;
    
    // Start the animation using requestAnimationFrame for smooth movement
    let startTime: number | null = null;
    const duration = 1000; // Animation duration in milliseconds

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const currentPosition = sliderPosition + 
        (targetPosition - sliderPosition) * easeInOutCubic(progress);

      if (progress < 1) {
        onAnimationComplete(currentPosition);
        requestAnimationFrame(animate);
      } else {
        onAnimationComplete(targetPosition);
      }
    };

    requestAnimationFrame(animate);
  }, [sliderPosition, onAnimationStart, onAnimationComplete]);

  return (
    <motion.button
      className="absolute right-4 bottom-[20%] bg-blue-500 hover:bg-blue-600 
                 text-white rounded-full p-4 shadow-lg transition-colors duration-200
                 flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ArrowLeftRight size={24} />
      <span className="font-medium">Switch View</span>
    </motion.button>
  );
};

export default AnimatedSliderButton;