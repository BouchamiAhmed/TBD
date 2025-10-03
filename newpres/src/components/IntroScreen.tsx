import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CurvedLogo } from './CurvedLogo';
import Plasma from './plasma';

interface IntroScreenProps {
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<HTMLDivElement[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    // Initial setup
    gsap.set(containerRef.current, { opacity: 0 });
    gsap.set(circlesRef.current, { scale: 0, opacity: 0 });
    gsap.set(logoRef.current, { opacity: 0, scale: 0.5, rotation: -180 });
    gsap.set(textRef.current, { opacity: 0, y: 20 });

    // Entrance animation
    tl.to(containerRef.current, { opacity: 1, duration: 0.5 })
      .to(circlesRef.current, {
        scale: 1,
        opacity: 0.6,
        duration: 1.5,
        ease: "back.out(1.7)",
        stagger: {
          amount: 0.8,
          from: "center"
        }
      })
      .to(logoRef.current, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)"
      }, "-=1")
      .to(textRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5");

    // Continuous floating animation for circles
    circlesRef.current.forEach((circle, index) => {
      if (circle) {
        gsap.to(circle, {
          rotation: 360,
          duration: 20 + (index * 2),
          ease: "none",
          repeat: -1
        });

        gsap.to(circle, {
          scale: 1.1,
          duration: 3 + (index * 0.5),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  const addToCircleRefs = (el: HTMLDivElement | null) => {
    if (el && !circlesRef.current.includes(el)) {
      circlesRef.current.push(el);
    }
  };

  const handleEnter = () => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: onEnter
    });

    // Exit animation
    tl.to(circlesRef.current, {
      scale: 1.5,
      opacity: 0,
      duration: 0.8,
      ease: "power2.in",
      stagger: {
        amount: 0.3,
        from: "center"
      }
    })
    .to(logoRef.current, {
      scale: 0,
      opacity: 0,
      rotation: 180,
      duration: 0.8,
      ease: "power2.in"
    }, "-=0.6")
    .to(textRef.current, {
      opacity: 0,
      y: -20,
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

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Geometric Circle Pattern */}
      <div className="relative w-96 h-96 z-10">
        {/* Outer circles */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) * (Math.PI / 180);
          const radius = 120;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <div
              key={`outer-${i}`}
              ref={addToCircleRefs}
              className="absolute w-24 h-24 border border-white/30 rounded-full backdrop-blur-sm"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
              }}
            />
          );
        })}

        {/* Inner circles */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const radius = 80;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <div
              key={`inner-${i}`}
              ref={addToCircleRefs}
              className="absolute w-16 h-16 border border-white/40 rounded-full backdrop-blur-sm"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
              }}
            />
          );
        })}

        {/* Center circle */}
        <div
          ref={addToCircleRefs}
          className="absolute w-32 h-32 border-2 border-white/60 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm"
        />

        {/* Circular Logo */}
        <div 
          ref={logoRef}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <CurvedLogo
            topText="T.B.D"
            bottomText="SOLUTION"
            radius={100}
            animated={false}
          />
        </div>

        {/* Click to Enter Text */}
        <div 
          ref={textRef}
          className="absolute left-1/2 top-[calc(50%+160px)] transform -translate-x-1/2 pointer-events-none"
        >
          <div className="text-white text-sm font-medium tracking-[0.2em] uppercase backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full">
            CLICK TO ENTER
          </div>
        </div>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(20)].map((_, i) => (
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
    </div>
  );
};