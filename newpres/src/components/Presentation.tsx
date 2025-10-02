import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide } from './Slide';
import { IntroScreen } from './IntroScreen';
import { Navigation } from './Navigation';
import { ProgressBar } from './ProgressBar';
import { PresentationProps } from '../types';

export const Presentation: React.FC<PresentationProps> = ({
  slides,
  autoAdvance = false,
  autoAdvanceTime = 8000,
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoAdvance);
  const [timeLeft, setTimeLeft] = useState(autoAdvanceTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const handleEnterPresentation = () => {
    setShowIntro(false);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeLeft(autoAdvanceTime);
    }
  };

  const resetPresentation = () => {
    setCurrentSlide(0);
    setIsPlaying(false);
    setTimeLeft(autoAdvanceTime);
  };

  const selectSlide = (index: number) => {
    setCurrentSlide(index);
    setTimeLeft(autoAdvanceTime);
  };

  // Initialize GSAP animations
  useEffect(() => {
    if (!containerRef.current || !backgroundRef.current) return;

    // Initial container animation
    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }
    );

    // Animate background elements
    gsap.to(backgroundRef.current.children, {
      rotation: 360,
      duration: 20,
      ease: "none",
      repeat: -1,
      stagger: 2
    });
  }, []);

  // Background color transition based on slide
  useEffect(() => {
    if (!containerRef.current) return;

    const colors = [
      'from-gray-900 via-blue-900 to-purple-900',
      'from-slate-900 via-cyan-900 to-blue-900',
      'from-gray-900 via-purple-900 to-pink-900',
      'from-blue-900 via-indigo-900 to-purple-900',
      'from-purple-900 via-pink-900 to-red-900'
    ];

    const currentColor = colors[currentSlide % colors.length];
    
    gsap.to(containerRef.current, {
      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
      duration: 1.5,
      ease: "power2.out"
    });
  }, [currentSlide]);

  // Auto-advance logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentSlide < slides.length - 1) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            nextSlide();
            return autoAdvanceTime;
          }
          return prev - 100;
        });
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentSlide, slides.length, nextSlide, autoAdvanceTime]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          resetPresentation();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
          e.preventDefault();
          setIsPlaying(false);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  const progress = ((currentSlide + 1) / slides.length) * 100;
  const timeProgress = isPlaying && currentSlide < slides.length - 1 
    ? ((autoAdvanceTime - timeLeft) / autoAdvanceTime) * 100 
    : 0;

  if (showIntro) {
    return <IntroScreen onEnter={handleEnterPresentation} />;
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden"
    >
      {/* Animated background elements */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl"></div>
        
        {/* Medium floating elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/5 to-blue-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-400/5 to-pink-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Small particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <ProgressBar progress={progress} isPlaying={isPlaying} />
      
      {/* Auto-advance circular progress indicator */}
      {isPlaying && currentSlide < slides.length - 1 && (
        <div className="fixed top-6 right-6 z-40">
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${timeProgress}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Slide container */}
      <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
        {slides.map((slide, index) => (
          <Slide
            key={slide.id}
            slide={slide}
            isActive={index === currentSlide}
            isNext={index === currentSlide + 1}
            isPrev={index === currentSlide - 1}
          />
        ))}
      </div>

      <Navigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        isPlaying={isPlaying}
        onPrevious={prevSlide}
        onNext={nextSlide}
        onTogglePlay={togglePlay}
        onReset={resetPresentation}
        onSlideSelect={selectSlide}
      />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};