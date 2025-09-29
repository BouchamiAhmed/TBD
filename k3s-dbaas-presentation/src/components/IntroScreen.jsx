import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import SplitText from './SplitText';
import SilkPlane from './SilkPlane';
import { gsap } from 'gsap';

const IntroScreen = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timeline = gsap.timeline();

    // Stage 1: Titre principal après 500ms
    timeline.add(() => setStage(1), 0.5);
    
    // Stage 2: Sous-titre après 3s
    timeline.add(() => setStage(2), 3);
    
    // Stage 3: Fade out et callback après 5.5s
    timeline.add(() => {
      gsap.to('.intro-screen', {
        opacity: 0,
        duration: 1,
        ease: 'power2.inOut',
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });
    }, 5.5);

    return () => timeline.kill();
  }, [onComplete]);

  return (
    <div className="intro-screen fixed inset-0 z-[100] flex items-center justify-center">
      {/* Silk Background */}
      <div className="absolute inset-0">
        <Canvas dpr={[1, 2]} frameloop="always">
          <SilkPlane 
            speed={3}
            scale={2}
            color="#1e1b4b"
            noiseIntensity={1.2}
            rotation={0.3}
          />
        </Canvas>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-900/40 via-blue-900/30 to-black/60" />

      {/* Content */}
      <div className="relative z-10 text-center px-8 max-w-6xl">
        {stage >= 1 && (
          <div className="mb-8">
            <SplitText
              text="Plateforme K3s DBaaS"
              className="text-7xl font-bold"
              delay={50}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 80, rotationX: -90 }}
              to={{ opacity: 1, y: 0, rotationX: 0 }}
              textAlign="center"
              style={{
                background: 'linear-gradient(to right, #22d3ee, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            />
          </div>
        )}

        {stage >= 2 && (
          <div>
            <SplitText
              text="Architecture Cloud-Native Enterprise"
              className="text-3xl font-light text-gray-300"
              delay={30}
              duration={0.6}
              ease="power2.out"
              splitType="words"
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="center"
            />
          </div>
        )}

        {/* Animated Line */}
        {stage >= 2 && (
          <div className="mt-12 flex justify-center">
            <div 
              className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{
                width: '0%',
                animation: 'expandLine 1.5s ease-out forwards',
                animationDelay: '0.5s'
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes expandLine {
          to {
            width: 60%;
          }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;