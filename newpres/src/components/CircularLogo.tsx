import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CircularLogoProps {
  text?: string;
  radius?: number;
  className?: string;
  animated?: boolean;
  direction?: 'clockwise' | 'counterclockwise';
  fontSize?: number;
}

export const CircularLogo: React.FC<CircularLogoProps> = ({
  text = 'T.B.D • SOLUTION • MOETEZ MARZOUKI •',
  radius = 120,
  className = '',
  animated = true,
  direction = 'clockwise',
  fontSize = 16
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const characters = text.split('');
  const angleStep = 360 / characters.length;

  useEffect(() => {
    if (animated && textRef.current) {
      const chars = textRef.current.querySelectorAll('.char');
      
      gsap.fromTo(
        chars,
        {
          opacity: 0,
          scale: 0,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.05,
          stagger: 0.03,
          ease: 'back.out(1.7)',
          delay: 0.5
        }
      );

      // Subtle rotation animation
      gsap.to(textRef.current, {
        rotation: direction === 'clockwise' ? 360 : -360,
        duration: 60,
        ease: 'none',
        repeat: -1
      });
    }
  }, [animated, direction]);

  return (
    <div 
      ref={textRef}
      className={`relative ${className}`}
      style={{ 
        width: `${radius * 2}px`, 
        height: `${radius * 2}px` 
      }}
    >
      {characters.map((char, index) => {
        const angle = angleStep * index - 90;
        const rotation = direction === 'clockwise' ? angle + 90 : -angle - 90;
        
        // Calculate gradient based on position for rainbow effect
        const hue = (index / characters.length) * 360;
        
        return (
          <span
            key={index}
            className="char absolute font-figtree font-bold tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
            style={{
              left: '50%',
              top: '50%',
              fontSize: `${fontSize}px`,
              transform: `rotate(${angle}deg) translate(${radius}px) rotate(${rotation}deg)`,
              transformOrigin: '0 0',
              filter: `hue-rotate(${hue}deg)`,
            }}
          >
            {char}
          </span>
        );
      })}
      
      {/* Center decoration with gradient */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* Outer glow */}
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500/40 to-purple-600/40 blur-xl animate-pulse"></div>
        
        {/* Main circle */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-2xl border-2 border-white/30">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
            <span className="font-figtree font-black text-xl bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              TBD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};