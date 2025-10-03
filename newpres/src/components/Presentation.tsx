import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide } from './Slide';
import { IntroScreen } from './IntroScreen';
import { Navigation } from './Navigation';
import { ProgressBar } from './ProgressBar';
import { PresentationProps } from '../types';
import Plasma from './plasma';
import TinyLogo from './TinyLogo';

export const Presentation: React.FC<PresentationProps> = ({
  slides,
  autoAdvance = false,
  autoAdvanceTime = 8000,
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoAdvance);
  const [timeLeft, setTimeLeft] = useState(autoAdvanceTime);
  const [plasmaColor, setPlasmaColor] = useState('#0066ff');
  const containerRef = useRef<HTMLDivElement>(null);
  const colorAnimationRef = useRef<gsap.core.Tween | null>(null);

  // Get plasma color based on slide
  const getPlasmaColor = (slideIndex: number) => {
    const colors = [
      '#0066ff', // Blue
      '#6600ff', // Purple
      '#ff00ff', // Magenta
      '#00ffff', // Cyan
      '#ff6600', // Orange
      '#00ff88', // Green
      '#ff0088', // Pink
      '#8800ff', // Violet
    ];
    return colors[slideIndex % colors.length];
  };

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Helper to convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Smooth color transition when slide changes
  useEffect(() => {
    if (showIntro) return;

    // Kill previous animation if exists
    if (colorAnimationRef.current) {
      colorAnimationRef.current.kill();
    }

    const targetColor = getPlasmaColor(currentSlide);
    const startColor = hexToRgb(plasmaColor);
    const endColor = hexToRgb(targetColor);

    // Create object to animate
    const colorObj = { ...startColor };

    // Animate the RGB values smoothly
    colorAnimationRef.current = gsap.to(colorObj, {
      r: endColor.r,
      g: endColor.g,
      b: endColor.b,
      duration: 0.125,
      ease: "power2.inOut",
      onUpdate: () => {
        const newColor = rgbToHex(colorObj.r, colorObj.g, colorObj.b);
        setPlasmaColor(newColor);
      }
    });

    return () => {
      if (colorAnimationRef.current) {
        colorAnimationRef.current.kill();
      }
    };
  }, [currentSlide, showIntro]);

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
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Plasma Background */}
      <div className="absolute inset-0 z-0">
        <Plasma
          color={plasmaColor}
          speed={1}
          direction="forward"
          scale={1}
          opacity={0.75}
          mouseInteractive={true}
          timeOffset={currentSlide * 3}
          rotationOffset={currentSlide * 0.1}
        />
      </div>

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/30 z-1" />

      {/* TINY LOGO - Top Left on Every Slide */}
      {/* Change size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '1xl' | '2xl' | '3xl' */}
      <TinyLogo animated={true} size="1xl" />

      <ProgressBar progress={progress} isPlaying={isPlaying} />
      
      {isPlaying && currentSlide < slides.length - 1 && (
        <div className="fixed top-6 right-6 z-50">
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

      <div className="relative w-full h-full z-10" style={{ perspective: '1000px' }}>
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
    </div>
  );
};