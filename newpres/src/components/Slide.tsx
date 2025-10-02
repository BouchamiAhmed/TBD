import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide as SlideType } from '../types';
import { BarChart3, TrendingUp, Users, Target, Award, Clock, Sparkles, Zap } from 'lucide-react';

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

  useEffect(() => {
    if (!slideRef.current || !contentRef.current) return;

    const tl = gsap.timeline();

    if (isActive) {
      // Master page change animation - inspired by Amaterasu.ai
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

  const renderTitleSlide = () => (
    <div ref={contentRef} className="text-center max-w-6xl mx-auto px-8 relative">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div ref={addToRefs} className="mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl scale-150"></div>
        <Award className="w-24 h-24 mx-auto mb-8 text-cyan-400 relative z-10" />
        <Sparkles className="w-8 h-8 absolute top-0 right-1/3 text-yellow-400 animate-pulse" />
        <Zap className="w-6 h-6 absolute bottom-0 left-1/3 text-purple-400 animate-bounce" />
      </div>

      <div ref={addToRefs}>
        <h1 className="text-7xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-8 leading-tight" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
          {slide.title}
        </h1>
      </div>

      {slide.subtitle && (
        <div ref={addToRefs}>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed font-light max-w-4xl mx-auto" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
            {slide.subtitle}
          </p>
        </div>
      )}

      <div ref={addToRefs} className="flex justify-center space-x-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
            style={{
              animation: `pulse 2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderContentSlide = () => (
    <div ref={contentRef} className="max-w-7xl mx-auto px-8">
      <div ref={addToRefs}>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-12 text-center" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>

      {slide.content && (
        <div ref={addToRefs}>
          <p className="text-xl text-gray-300 mb-12 text-center leading-relaxed max-w-4xl mx-auto" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
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
              className="group relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-cyan-400/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                <p className="text-white text-lg leading-relaxed font-medium" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>{point}</p>
              </div>
              <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatsSlide = () => (
    <div ref={contentRef} className="max-w-7xl mx-auto px-8">
      <div ref={addToRefs}>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-16 text-center" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {slide.stats?.map((stat, index) => {
          const icons = [BarChart3, TrendingUp, Users, Target];
          const Icon = icons[index % icons.length];
          const gradients = [
            'from-cyan-500 to-blue-600',
            'from-purple-500 to-pink-600',
            'from-green-500 to-emerald-600'
          ];
          
          return (
            <div
              key={index}
              ref={addToRefs}
              className="group relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center hover:border-cyan-400/50 transition-all duration-700 transform hover:scale-110 hover:-translate-y-4"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${gradients[index % gradients.length]} rounded-2xl flex items-center justify-center shadow-2xl`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                
                <div className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
                  {stat.value}
                </div>
                
                <div className="text-gray-300 text-xl mb-4 font-medium" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>{stat.label}</div>
                
                {stat.change && (
                  <div className="text-green-400 text-sm font-bold bg-green-400/10 rounded-full px-4 py-2 inline-block" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
                    ↗ {stat.change}
                  </div>
                )}
              </div>

              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderImageSlide = () => (
    <div ref={contentRef} className="max-w-6xl mx-auto px-8 text-center">
      <div ref={addToRefs}>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-12" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>

      {slide.image && (
        <div ref={addToRefs} className="mb-12 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl scale-105 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
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
          <p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
            {slide.content}
          </p>
        </div>
      )}
    </div>
  );

  const renderClosingSlide = () => (
    <div ref={contentRef} className="text-center max-w-5xl mx-auto px-8 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div ref={addToRefs} className="mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl scale-150"></div>
        <Clock className="w-20 h-20 mx-auto mb-8 text-purple-400 relative z-10" />
      </div>

      <div ref={addToRefs}>
        <h2 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-8" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>

      {slide.subtitle && (
        <div ref={addToRefs}>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed font-light" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>
            {slide.subtitle}
          </p>
        </div>
      )}

      <div ref={addToRefs} className="flex justify-center items-center space-x-12 text-gray-400">
        <div className="flex items-center space-x-4 group cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
          <span className="text-lg font-medium group-hover:text-white transition-colors duration-300" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>Thank you</span>
        </div>
        <div className="flex items-center space-x-4 group cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
          <span className="text-lg font-medium group-hover:text-white transition-colors duration-300" style={{ fontFamily: 'Neo Sans Pro, Inter, sans-serif' }}>Questions?</span>
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
      <div className="w-full h-full flex items-center justify-center">
        {renderSlideContent()}
      </div>
    </div>
  );
};