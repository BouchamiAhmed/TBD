import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ProgressBarProps {
  progress: number;
  isPlaying: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isPlaying }) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;

    gsap.to(progressRef.current, {
      width: `${progress}%`,
      duration: 0.8,
      ease: "power2.out"
    });

    // Animate glow effect
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: isPlaying ? 1 : 0.3,
        scale: isPlaying ? 1 : 0.8,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, [progress, isPlaying]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-black/30 backdrop-blur-sm relative overflow-hidden">
        {/* Glow effect */}
        <div
          ref={glowRef}
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 blur-sm"
          style={{ width: `${progress}%` }}
        />
        
        {/* Main progress bar */}
        <div 
          ref={progressRef}
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 relative overflow-hidden"
          style={{ width: '0%' }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse"></div>
          
          {/* Particle trail */}
          <div className="absolute right-0 top-0 w-4 h-full bg-gradient-to-l from-white/50 to-transparent blur-sm"></div>
        </div>

        {/* Floating particles */}
        {isPlaying && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-80"
                style={{
                  left: `${(progress - 10) + Math.random() * 20}%`,
                  top: '50%',
                  animation: `float 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};