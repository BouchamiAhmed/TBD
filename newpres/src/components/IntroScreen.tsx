import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import GradientText from './GradientText';
import Plasma from './plasma';
import TiltedCard from './TiltedCard';

interface IntroScreenProps {
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const clickTextRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    gsap.set(containerRef.current, { opacity: 0 });
    gsap.set(textRef.current, { opacity: 0, scale: 0.8 });
    gsap.set(clickTextRef.current, { opacity: 0 });

    tl.to(containerRef.current, { opacity: 1, duration: 0.5 })
      .to(textRef.current, {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "back.out(1.7)"
      }, "+=0.3")
      .to(clickTextRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      }, "+=0.5");

    gsap.to(clickTextRef.current, {
      opacity: 0.6,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2
    });

    return () => {
      tl.kill();
    };
  }, []);

  const handleEnter = () => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: onEnter
    });

    tl.to(textRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      ease: "power2.in"
    })
    .to(clickTextRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in"
    }, "-=0.5")
    .to(containerRef.current, {
      opacity: 0,
      scale: 1.1,
      duration: 0.5,
      ease: "power2.in"
    }, "-=0.3");
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleEnter}
    >
      <div className="absolute inset-0">
        <Plasma
          color="#0066ff"
          speed={1}
          direction="forward"
          scale={1}
          opacity={0.8}
          mouseInteractive={true}
        />
      </div>

      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 text-center">
        <div 
          ref={textRef} 
          className="mb-16 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <GradientText
            colors={['#ffffff', '#3b82f6', '#ff0066', '#8b5cf6', '#ffffff']}
            animationSpeed={8}
            showBorder={false}
          >
            <span 
              className="text-9xl font-black"
              style={{ fontFamily: 'Brockmann, sans-serif' }}
            >
              T.B.D
            </span>
          </GradientText>
          
          {isHovered && (
            <>
              <div 
                className="absolute inset-0 top-0 left-0 pointer-events-none animate-pulse"
                style={{
                  textShadow: '-3px 0 rgba(255, 0, 100, 0.8)',
                  mixBlendMode: 'screen'
                }}
              >
                <span className="text-9xl font-black text-transparent" style={{ fontFamily: 'Brockmann, sans-serif' }}>
                  T.B.D
                </span>
              </div>
              <div 
                className="absolute inset-0 top-0 left-0 pointer-events-none animate-pulse"
                style={{
                  textShadow: '3px 0 rgba(0, 255, 255, 0.8)',
                  mixBlendMode: 'screen',
                  animationDelay: '0.1s'
                }}
              >
                <span className="text-9xl font-black text-transparent" style={{ fontFamily: 'Brockmann, sans-serif' }}>
                  T.B.D
                </span>
              </div>
            </>
          )}
        </div>

        <div ref={clickTextRef} className="opacity-0">
          <div className="text-white text-sm font-medium tracking-[0.3em] uppercase backdrop-blur-sm bg-white/10 px-6 py-3 rounded-full border border-white/20 inline-block">
            CLICK TO ENTER
          </div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      <div className="absolute top-8 left-8 z-50">
{/* ESPRIT Logo - Top Left with animated gradient ESP */}
<div className="absolute top-8 left-8 z-50">
  <div className="bg-white/99 backdrop-blur-md px-6 py-4 rounded-lg shadow-2xl">
    <div className="flex items-center gap-0 font-black text-4xl tracking-tight">
      {/* ESP - Animated Gradient like TBD */}
      <span 
        className="relative inline-block"
        style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900 }}
      >
        <span className="bg-gradient-to-r from-white via-red-300 to-white bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
          Esp
        </span>
      </span>
      {/* RI - Grey */}
      <span className="text-gray-400" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900 }}>
        ri
      </span>
      {/* T - Grey with Red arrow */}
      <span className="relative" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900 }}>
        <span className="text-gray-400">t</span>
        <span className="absolute -right-4 top-0 text-red-600 text-2xl">▶</span>
      </span>
    </div>
  </div>
  
  {/* Gradient animation styles */}
  <style jsx>{`
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient {
      animation: gradient 8s linear infinite;
    }
  `}</style>
</div>
</div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-20px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};