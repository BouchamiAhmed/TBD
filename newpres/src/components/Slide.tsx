import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide as SlideType } from '../types';
import { BarChart3, TrendingUp, Users, Target, Award, Clock, Sparkles, Zap } from 'lucide-react';
import Plasma from './plasma';

interface SlideProps {
  slide: SlideType;
  isActive: boolean;
  isNext: boolean;
  isPrev: boolean;
}

export const Slide: React.FC<SlideProps> = ({ slide, isActive, isNext, isPrev }) => {
  const slideRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLDivElement[]>([]);
  const plasmaColorRef = useRef<string>('#0066ff');
  const plasmaSpeedRef = useRef<number>(1);

  useEffect(() => {
    if (!slideRef.current || !contentRef.current) return;

    const tl = gsap.timeline();

    if (isActive) {
      // Animate plasma color change
      const newColor = getPlasmaColor();
      const newSpeed = getPlasmaSpeed();
      
      gsap.to(plasmaColorRef, {
        current: newColor,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      gsap.to(plasmaSpeedRef, {
        current: newSpeed,
        duration: 1.5,
        ease: "power2.inOut"
      });

      // Master page change animation
      tl.set(slideRef.current, { opacity: 1, zIndex: 20 })
        .fromTo(slideRef.current, 
          { 
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            y: '100%',
            rotationX: 15,
            scale: 0.9
          },
          { 
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            y: '0%',
            rotationX: 0,
            scale: 1,
            duration: 1.4,
            ease: "power3.out"
          }
        )
        .fromTo(contentRef.current,
          { opacity: 0, y: 80, rotationX: 10 },
          { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: "power2.out" },
          "-=0.8"
        );

      // Animate individual elements
      elementsRef.current.forEach((el, index) => {
        if (el) {
          tl.fromTo(el,
            { opacity: 0, y: 50, rotationX: -10, scale: 0.95 },
            { 
              opacity: 1, 
              y: 0, 
              rotationX: 0, 
              scale: 1,
              duration: 0.8, 
              ease: "power2.out",
              delay: index * 0.15
            },
            "-=0.6"
          );
        }
      });

    } else if (isPrev) {
      tl.to(slideRef.current, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        y: '-100%',
        rotationX: -15,
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: "power3.in",
        zIndex: 10
      });
    } else if (isNext) {
      tl.set(slideRef.current, { 
        clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        y: '100%',
        opacity: 0, 
        zIndex: 10 
      });
    } else {
      tl.set(slideRef.current, { 
        clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        y: '100%',
        opacity: 0, 
        zIndex: 0 
      });
    }

    return () => {
      tl.kill();
    };
  }, [isActive, isNext, isPrev]);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  // Get plasma color based on slide type and id
  const getPlasmaColor = () => {
    const colors = [
      '#0066ff', // Blue
      '#6600ff', // Purple
      '#ff00ff', // Magenta
      '#00ffff', // Cyan
      '#ff6600', // Orange
      '#00ff88', // Green-Cyan
      '#ff0088', // Pink
      '#8800ff', // Violet
    ];
    return colors[slide.id % colors.length];
  };

  // Get plasma speed based on slide type
  const getPlasmaSpeed = () => {
    switch (slide.type) {
      case 'title':
        return 0.8;
      case 'stats':
        return 1.5;
      case 'closing':
        return 1.2;
      default:
        return 1.0;
    }
  };

  const renderTitleSlide = () => (
    <div className="relative w-full h-full overflow-hidden">
      {/* Plasma Background - NO other backgrounds! */}
      <div className="absolute inset-0">
        <Plasma
          color={getPlasmaColor()}
          speed={getPlasmaSpeed()}
          direction="forward"
          scale={1}
          opacity={0.85}
          mouseInteractive={true}
        />
      </div>

      {/* Minimal dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center max-w-6xl mx-auto px-8 h-full flex flex-col justify-center">
        <div ref={addToRefs} className="mb-12 relative">
          <Award className="w-24 h-24 mx-auto mb-8 text-white drop-shadow-2xl" />
          <Sparkles className="w-8 h-8 absolute top-0 right-1/3 text-yellow-300 animate-pulse drop-shadow-lg" />
          <Zap className="w-6 h-6 absolute bottom-0 left-1/3 text-cyan-300 animate-bounce drop-shadow-lg" />
        </div>

        <div ref={addToRefs}>
          <h1 className="text-7xl font-black text-white mb-8 leading-tight drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h1>
        </div>

        {slide.subtitle && (
          <div ref={addToRefs}>
            <p className="text-2xl text-white/90 mb-12 leading-relaxed font-light max-w-4xl mx-auto drop-shadow-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
              {slide.subtitle}
            </p>
          </div>
        )}

        <div ref={addToRefs} className="flex justify-center space-x-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-white rounded-full shadow-lg"
              style={{
                animation: `pulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderContentSlide = () => (
    <div className="relative w-full h-full overflow-hidden">
      {/* Plasma Background */}
      <div className="absolute inset-0">
        <Plasma
          color={getPlasmaColor()}
          speed={getPlasmaSpeed()}
          direction="forward"
          scale={1}
          opacity={0.7}
          mouseInteractive={false}
        />
      </div>

      {/* Minimal dark overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-8 h-full flex flex-col justify-center">
        <div ref={addToRefs}>
          <h2 className="text-5xl font-bold text-white mb-12 text-center drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>

        {slide.content && (
          <div ref={addToRefs}>
            <p className="text-xl text-white/90 mb-12 text-center leading-relaxed max-w-4xl mx-auto backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-white/10 drop-shadow-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
              {slide.content}
            </p>
          </div>
        )}

        {slide.points && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {slide.points.map((point, index) => (
              <div
                key={index}
                ref={addToRefs}
                className="group relative backdrop-blur-md bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
              >
                <div className="relative z-10 flex items-start space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20">
                    {index + 1}
                  </div>
                  <p className="text-white text-lg leading-relaxed font-medium drop-shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{point}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStatsSlide = () => (
    <div className="relative w-full h-full overflow-hidden">
      {/* Plasma Background */}
      <div className="absolute inset-0">
        <Plasma
          color={getPlasmaColor()}
          speed={getPlasmaSpeed()}
          direction="forward"
          scale={1}
          opacity={0.8}
          mouseInteractive={true}
        />
      </div>

      {/* Minimal dark overlay */}
      <div className="absolute inset-0 bg-black/25"></div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-8 h-full flex flex-col justify-center">
        <div ref={addToRefs}>
          <h2 className="text-5xl font-bold text-white mb-16 text-center drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {slide.stats?.map((stat, index) => {
            const icons = [BarChart3, TrendingUp, Users, Target];
            const Icon = icons[index % icons.length];
            
            return (
              <div
                key={index}
                ref={addToRefs}
                className="group relative backdrop-blur-xl bg-white/10 rounded-3xl p-10 border border-white/20 text-center hover:border-white/40 hover:bg-white/15 transition-all duration-700 transform hover:scale-110 hover:-translate-y-4"
              >
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="text-5xl font-black text-white mb-4 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {stat.value}
                  </div>
                  
                  <div className="text-white/90 text-xl mb-4 font-medium drop-shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.label}</div>
                  
                  {stat.change && (
                    <div className="text-green-300 text-sm font-bold bg-green-400/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block border border-green-300/30" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ↗ {stat.change}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderImageSlide = () => (
    <div className="relative w-full h-full overflow-hidden">
      {/* Plasma Background */}
      <div className="absolute inset-0">
        <Plasma
          color={getPlasmaColor()}
          speed={getPlasmaSpeed()}
          direction="forward"
          scale={1}
          opacity={0.6}
          mouseInteractive={false}
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-6xl mx-auto px-8 text-center h-full flex flex-col justify-center">
        <div ref={addToRefs}>
          <h2 className="text-5xl font-bold text-white mb-12 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>

        {slide.image && (
          <div ref={addToRefs} className="mb-12 relative group">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </div>
        )}

        {slide.content && (
          <div ref={addToRefs}>
            <p className="text-xl text-white/90 leading-relaxed max-w-4xl mx-auto backdrop-blur-md bg-black/30 p-6 rounded-2xl border border-white/10 drop-shadow-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
              {slide.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderClosingSlide = () => (
    <div className="relative w-full h-full overflow-hidden">
      {/* Plasma Background */}
      <div className="absolute inset-0">
        <Plasma
          color={getPlasmaColor()}
          speed={getPlasmaSpeed()}
          direction="forward"
          scale={1}
          opacity={0.9}
          mouseInteractive={true}
        />
      </div>

      {/* Minimal overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center max-w-5xl mx-auto px-8 h-full flex flex-col justify-center">
        <div ref={addToRefs} className="mb-12 relative">
          <Clock className="w-20 h-20 mx-auto mb-8 text-white drop-shadow-2xl" />
        </div>

        <div ref={addToRefs}>
          <h2 className="text-6xl font-black text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>

        {slide.subtitle && (
          <div ref={addToRefs}>
            <p className="text-2xl text-white/90 mb-12 leading-relaxed font-light backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-white/10 drop-shadow-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
              {slide.subtitle}
            </p>
          </div>
        )}

        <div ref={addToRefs} className="flex justify-center items-center space-x-12 text-white">
          <div className="flex items-center space-x-4 group cursor-pointer backdrop-blur-md bg-white/10 px-6 py-3 rounded-full hover:bg-white/20 transition-all border border-white/20">
            <div className="w-4 h-4 bg-white rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-lg font-medium drop-shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Thank you</span>
          </div>
          <div className="flex items-center space-x-4 group cursor-pointer backdrop-blur-md bg-white/10 px-6 py-3 rounded-full hover:bg-white/20 transition-all border border-white/20">
            <div className="w-4 h-4 bg-white rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-lg font-medium drop-shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Questions?</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'title':
        return renderTitleSlide();
      case 'content':
        return renderContentSlide();
      case 'stats':
        return renderStatsSlide();
      case 'image':
        return renderImageSlide();
      case 'closing':
        return renderClosingSlide();
      default:
        return renderContentSlide();
    }
  };

  return (
    <div
      ref={slideRef}
      className="absolute inset-0 flex items-center justify-center opacity-0"
      style={{ perspective: '1000px' }}
    >
      <div className="w-full h-full">
        {renderSlideContent()}
      </div>
    </div>
  );
};