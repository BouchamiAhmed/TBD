import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import GlitchText from './GlitchText';

interface TinyLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '1xl' | '2xl' | '3xl';
}

export const TinyLogo: React.FC<TinyLogoProps> = ({ 
  className = '', 
  animated = true,
  size = 'sm'
}) => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && logoRef.current) {
      // Animate logo entrance
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, x: -50, scale: 0 },
        { 
          opacity: 1, 
          x: 0, 
          scale: 1, 
          duration: 1, 
          ease: 'back.out(2)', 
          delay: 0.5 
        }
      );
    }
  }, [animated]);

  // SIZE OPTIONS:
  // 'xs'   -> 12px  - TINY
  // 'sm'   -> 14px  - SMALL
  // 'base' -> 16px  - NORMAL
  // 'lg'   -> 18px  - MEDIUM
  // 'xl'   -> 20px  - LARGE
  // '1xl'  -> 22px  - IN BETWEEN (custom) ✨
  // '2xl'  -> 24px  - EXTRA LARGE
  // '3xl'  -> 30px  - HUGE

  const getSizeClass = () => {
    if (size === '1xl') return 'text-[22px]'; // Custom size between xl and 2xl
    return `text-${size}`;
  };

  const sizeClass = getSizeClass();

  return (
    <div 
      ref={logoRef} 
      className={`fixed top-6 left-6 z-50 ${className}`}
      style={{ opacity: animated ? 0 : 1 }}
    >
      <GlitchText
        speed={8}
        enableShadows={true}
        enableOnHover={false}
        className={`${sizeClass} bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg`}
        style={{ 
          fontFamily: 'Brockmann, sans-serif', 
          fontWeight: 700,
          // Smaller glitch offsets for tiny logo
          '--after-shadow': '-10px 0 rgba(255, 0, 100, 0.8)',
          '--before-shadow': '2px 0 rgba(0, 255, 255, 0.8)',
          '--after-duration': '24s',  // Slower for subtle effect
          '--before-duration': '16s'
        } as React.CSSProperties}
      >
        T.B.D
      </GlitchText>
    </div>
  );
};

export default TinyLogo;