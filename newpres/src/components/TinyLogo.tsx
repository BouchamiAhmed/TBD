import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import GradientText from './GradientText';

interface TinyLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '1xl' | '2xl' | '3xl';
}

const TinyLogo: React.FC<TinyLogoProps> = ({ 
  className = '', 
  animated = true,
  size = '1xl'
}) => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && logoRef.current) {
      // Animate logo entrance with GSAP
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

  // Get the appropriate text size class
  const getSizeClass = () => {
    if (size === '1xl') return 'text-[32px]'; // Custom size between xl and 2xl
    return `text-${size}`;
  };

  const sizeClass = getSizeClass();

  return (
    <div 
      ref={logoRef} 
      className={`fixed top-6 left-6 z-50 ${className}`}
      style={{ opacity: animated ? 0 : 1 }}
    >
      <GradientText
        colors={['#056d80ff', '#3b82f6', '#ffffffff' , '#8b5cf6', '#ffffffff'  ,'#f80000ff', '#06b6d4' , '#ffffffff'  ]} // Cyan -> Blue -> Purple -> Pink -> Cyan
        animationSpeed={17}
        showBorder={false}
        className="p-0 m-0"
      >
        <span 
          className={`${sizeClass} font-black`}
          style={{ fontFamily: 'Brockmann, sans-serif' }}
        >
          T.B.D
        </span>
      </GradientText>
    </div>
  );
};

export default TinyLogo;