import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CurvedLogoProps {
  topText?: string;
  bottomText?: string;
  radius?: number;
  className?: string;
  animated?: boolean;
}

export const CurvedLogo: React.FC<CurvedLogoProps> = ({
  topText = 'T.B.D',
  bottomText = 'SOLUTION',
  radius = 120,
  className = '',
  animated = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && containerRef.current) {
      const chars = containerRef.current.querySelectorAll('.char');
      
      gsap.fromTo(
        chars,
        {
          opacity: 0,
          scale: 0,
          y: 20
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'back.out(2)',
          delay: 0.5
        }
      );
    }
  }, [animated]);

  const renderCurvedText = (text: string, startAngle: number, endAngle: number, gradientClass: string) => {
    const characters = text.split('');
    const angleRange = endAngle - startAngle;
    const angleStep = angleRange / (characters.length - 1);

    return characters.map((char, index) => {
      const angle = startAngle + (angleStep * index);
      const rotation = angle + 90;
      
      return (
        <span
          key={index}
          className={`char absolute font-figtree font-black tracking-widest ${gradientClass}`}
          style={{
            left: '50%',
            top: '50%',
            fontSize: '22px',
            transform: `rotate(${angle}deg) translate(${radius}px) rotate(${rotation}deg)`,
            transformOrigin: '0 0',
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        width: `${radius * 2.5}px`, 
        height: `${radius * 2.5}px` 
      }}
    >
      {/* Top curved text - T.B.D */}
      {renderCurvedText(topText, -110, -70, 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent')}
      
      {/* Bottom curved text - SOLUTION */}
      {renderCurvedText(bottomText, 70, 110, 'bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 bg-clip-text text-transparent')}
      
      {/* Center logo */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Outer glow ring - animated */}
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500/40 to-purple-600/40 blur-2xl animate-pulse"></div>
          
          {/* Second glow ring */}
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/30 to-pink-500/30 blur-xl"></div>
          
          {/* Main circle */}
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-white/30">
            {/* Inner circle with gradient */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
              <div className="text-center">
                <div className="font-figtree font-black text-3xl bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent tracking-tight">
                  TBD
                </div>
                <div className="font-figtree font-light italic text-xs bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent -mt-1">
                  solution
                </div>
              </div>
            </div>
          </div>
          
          {/* Rotating ring decoration */}
          <div className="absolute inset-0 w-28 h-28 rounded-full border-2 border-dashed border-cyan-400/30 animate-spin" style={{ animationDuration: '20s' }}></div>
        </div>
      </div>
    </div>
  );
};