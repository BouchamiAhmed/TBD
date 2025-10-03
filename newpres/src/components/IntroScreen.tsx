import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import GlitchText from './GlitchText';
import Plasma from './plasma';

interface IntroScreenProps {
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const clickTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    // Initial setup
    gsap.set(containerRef.current, { opacity: 0 });
    gsap.set(textRef.current, { opacity: 0, scale: 0.8 });
    gsap.set(clickTextRef.current, { opacity: 0 });

    // Entrance animation
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

    // Pulse animation for click text
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

    // Exit animation
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
      {/* Plasma Background */}
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

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Main Text with Glitch Effect */}
        <div ref={textRef} className="mb-16">
          <div className="text-9xl font-black">
            <GlitchText
              speed={3}
              enableShadows={true}
              enableOnHover={false}
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
            >
              T.B.D
            </GlitchText>
          </div>
        </div>

        {/* Click to Enter */}
        <div ref={clickTextRef} className="opacity-0">
          <div className="text-white text-sm font-medium tracking-[0.3em] uppercase backdrop-blur-sm bg-white/10 px-6 py-3 rounded-full border border-white/20 inline-block">
            CLICK TO ENTER
          </div>
        </div>
      </div>

      {/* Minimal floating particles */}
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

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-20px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};