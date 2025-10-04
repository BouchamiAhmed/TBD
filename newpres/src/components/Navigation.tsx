import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import Counter from './Counter';

interface NavigationProps {
  currentSlide: number;
  totalSlides: number;
  isPlaying: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSlideSelect: (index: number) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentSlide,
  totalSlides,
  isPlaying,
  onPrevious,
  onNext,
  onTogglePlay,
  onReset,
  onSlideSelect,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!navRef.current) return;

    // Entrance animation
    gsap.fromTo(navRef.current,
      { y: 100, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)", delay: 0.5 }
    );

    // Button hover animations
    buttonsRef.current.forEach((button) => {
      if (button) {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, { scale: 1.1, duration: 0.3, ease: "back.out(1.7)" });
        });
        button.addEventListener('mouseleave', () => {
          gsap.to(button, { scale: 1, duration: 0.3, ease: "back.out(1.7)" });
        });
      }
    });
  }, []);

  const addToButtonRefs = (el: HTMLButtonElement | null) => {
    if (el && !buttonsRef.current.includes(el)) {
      buttonsRef.current.push(el);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={navRef}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30"
    >
      {/* Main navigation container with animated gradient border */}
      <div className="relative bg-black/30 backdrop-blur-2xl rounded-2xl px-8 py-4 shadow-2xl">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 animate-gradient-x opacity-40"></div>
        
        {/* Inner content */}
        <div className="relative flex items-center space-x-6">
          {/* Previous button */}
          <button
            ref={addToButtonRefs}
            onClick={onPrevious}
            disabled={currentSlide === 0}
            className="relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-cyan-500/20 hover:to-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-white/10 hover:border-cyan-400/30 group"
          >
            <ChevronLeft className="w-5 h-5 text-white group-hover:text-cyan-400 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-xl transition-all duration-300"></div>
          </button>

          {/* Play/Pause button */}
          <button
            ref={addToButtonRefs}
            onClick={onTogglePlay}
            className="relative p-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg border border-cyan-400/30 group"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-all duration-300"></div>
          </button>

          {/* Reset button */}
          <button
            ref={addToButtonRefs}
            onClick={onReset}
            className="relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 border border-white/10 hover:border-purple-400/30 group"
          >
            <RotateCcw className="w-5 h-5 text-white group-hover:text-purple-400 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-300"></div>
          </button>

          {/* Fullscreen button */}
          <button
            ref={addToButtonRefs}
            onClick={toggleFullscreen}
            className="relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 border border-white/10 hover:border-green-400/30 group"
          >
            <Maximize2 className="w-5 h-5 text-white group-hover:text-green-400 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 rounded-xl transition-all duration-300"></div>
          </button>

          {/* Next button */}
          <button
            ref={addToButtonRefs}
            onClick={onNext}
            disabled={currentSlide === totalSlides - 1}
            className="relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-cyan-500/20 hover:to-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-white/10 hover:border-cyan-400/30 group"
          >
            <ChevronRight className="w-5 h-5 text-white group-hover:text-cyan-400 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-xl transition-all duration-300"></div>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

          {/* Slide indicators */}
          <div className="flex space-x-3">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                ref={addToButtonRefs}
                onClick={() => onSlideSelect(index)}
                className={`relative h-2 rounded-full transition-all duration-500 ${
                  index === currentSlide
                    ? 'w-8 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg'
                    : 'w-2 bg-white/30 hover:bg-white/50 hover:scale-125'
                }`}
              >
                {index === currentSlide && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-sm opacity-50"></div>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

          {/* Counter Component */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 px-4 py-2 rounded-lg border border-white/10">
            <Counter
              value={currentSlide + 1}
              places={[10, 1]}
              fontSize={32}
              padding={2}
              gap={4}
              textColor="#22d3ee"
              fontWeight={900}
              gradientFrom="transparent"
              gradientTo="transparent"
            />
            <span className="text-white/60 text-lg mx-1">/</span>
            <span className="text-white/80 text-lg font-bold">{totalSlides}</span>
          </div>
        </div>
      </div>

      {/* Floating progress dots */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 bg-cyan-400 rounded-full opacity-60"
            style={{
              animation: `pulse 2s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
    </div>
  );
};