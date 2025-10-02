import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide } from './Slide';
import { IntroScreen } from './IntroScreen';
import { Navigation } from './Navigation';
import { ProgressBar } from './ProgressBar';
import { AnimatedBackground } from './AnimatedBackground';
import { PresentationProps } from '../types';

type TransitionStyle = 'slide' | 'fade' | 'zoom' | 'flip' | 'curtain' | 'diagonal';

export const Presentation: React.FC<PresentationProps> = ({
  slides,
  autoAdvance = false,
  autoAdvanceTime = 8000,
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoAdvance);
  const [timeLeft, setTimeLeft] = useState(autoAdvanceTime);
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>('slide');
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!containerRef.current) return;

    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }
    );
  }, []);

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
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      <AnimatedBackground currentSlide={currentSlide} totalSlides={slides.length} />

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

      <div className="fixed top-20 right-8 z-50 bg-black/30 backdrop-blur-xl rounded-xl p-3 border border-white/10">
        <div className="text-xs text-gray-400 mb-2 text-center">Transition</div>
        <div className="grid grid-cols-2 gap-2">
          {(['slide', 'fade', 'zoom', 'flip', 'curtain', 'diagonal'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setTransitionStyle(style)}
              className={`px-3 py-1 rounded-lg text-xs transition-all duration-300 ${
                transitionStyle === style
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-full z-10" style={{ perspective: '1000px' }}>
        {slides.map((slide, index) => (
          <Slide
            key={slide.id}
            slide={slide}
            isActive={index === currentSlide}
            isNext={index === currentSlide + 1}
            isPrev={index === currentSlide - 1}
            transitionStyle={transitionStyle}
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

      <style>{`
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