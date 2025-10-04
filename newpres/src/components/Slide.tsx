import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide as SlideType } from '../types';
import { Award, Clock, BarChart3, TrendingUp, Users, Target, Image as ImageIcon } from 'lucide-react';

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
      tl.set(slideRef.current, { opacity: 1, zIndex: 20 })
        .fromTo(slideRef.current, 
          { y: '100%' },
          { y: '0%', duration: 0.75, ease: "power3.out" }
        )
        .fromTo(contentRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.5"
        );
elementsRef.current.forEach((el, index) => {
  if (el) {
    tl.fromTo(el,
      { opacity: 0, scale: 0.8 },  // Start smaller
      { 
        opacity: 1, 
        scale: 1,                    // Pop to full size
        duration: 0.2,
        ease: "back.out(1.4)",       // Slight overshoot
        delay: index * 0.05
      },
      "-=0.4"
    );
  }
});

    } else if (isPrev) {
      tl.to(slideRef.current, { y: '-100%', opacity: 0, duration: 0.3, ease: "power3.in", zIndex: 10 });
    } else {
      tl.set(slideRef.current, { y: '100%', opacity: 0, zIndex: 0 });
    }

    return () => tl.kill();
  }, [isActive, isNext, isPrev]);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  // Add this import at the top if not already there

// Add these render functions
const renderImageSlide = () => (
  <>
    <div ref={addToRefs}>
      <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
        {slide.title}
      </h2>
    </div>
    {slide.subtitle && (
      <div ref={addToRefs}>
        <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.subtitle}
        </p>
      </div>
    )}
    {slide.image && (
      <div ref={addToRefs} className="flex justify-center max-w-5xl mx-auto mb-8">
        <img 
          src={slide.image} 
          alt={slide.title}
          className="max-w-full h-auto rounded-2xl shadow-2xl border border-white/20"
        />
      </div>
    )}
    {slide.points && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {slide.points.map((point, index) => (
          <div key={index} ref={addToRefs} className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-start space-x-4">
              <p className="text-white text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{point}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);

const renderDividerSlide = () => (
  <>
    <div ref={addToRefs} className="mb-8">
      <div className="text-8xl font-black text-white drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
        {slide.sectionNumber}
      </div>
    </div>
    <div ref={addToRefs}>
      <h2 className="text-6xl font-black text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
        {slide.title}
      </h2>
    </div>
    {slide.subtitle && (
      <div ref={addToRefs}>
        <p className="text-2xl text-white/90 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.subtitle}
        </p>
      </div>
    )}
  </>
);

  

  const renderTitleSlide = () => (
    <>
      <div ref={addToRefs} className="mb-12">
        <Award className="w-24 h-24 mx-auto mb-8 text-white drop-shadow-2xl" />
      </div>
      <div ref={addToRefs}>
        <h1 className="text-7xl font-black text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.title}
        </h1>
      </div>
      {slide.subtitle && (
        <div ref={addToRefs}>
          <p className="text-2xl text-white/90 mb-12 max-w-4xl mx-auto drop-shadow-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.subtitle}
          </p>
        </div>
      )}
    </>
  );

  const renderContentSlide = () => (
    <>
      <div ref={addToRefs}>
        <h2 className="text-5xl font-bold text-white mb-12 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>
      {slide.content && (
        <div ref={addToRefs}>
          <p className="text-xl text-white/90 mb-12 max-w-4xl mx-auto backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/10" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.content}
          </p>
        </div>
      )}
      {slide.points && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {slide.points.map((point, index) => (
            <div key={index} ref={addToRefs} className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-white text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{point}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderStatsSlide = () => (
    <>
      <div ref={addToRefs}>
        <h2 className="text-5xl font-bold text-white mb-16 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {slide.stats?.map((stat, index) => {
          const icons = [BarChart3, TrendingUp, Users, Target];
          const Icon = icons[index % icons.length];
          return (
            <div key={index} ref={addToRefs} className="backdrop-blur-xl bg-white/10 rounded-3xl p-10 border border-white/20 text-center hover:bg-white/15 transition-all">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stat.value}
              </div>
              <div className="text-white/90 text-xl mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stat.label}
              </div>
              {stat.change && (
                <div className="text-green-300 text-sm font-bold bg-green-400/20 rounded-full px-4 py-2 inline-block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ↗ {stat.change}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  const renderClosingSlide = () => (
    <>
      <div ref={addToRefs} className="mb-12">
        <Clock className="w-20 h-20 mx-auto mb-8 text-white drop-shadow-2xl" />
      </div>
      <div ref={addToRefs}>
        <h2 className="text-6xl font-black text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>
      {slide.subtitle && (
        <div ref={addToRefs}>
          <p className="text-2xl text-white/90 mb-12 backdrop-blur-md bg-black/20 p-6 rounded-2xl max-w-3xl mx-auto border border-white/10" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.subtitle}
          </p>
        </div>
      )}
    </>
  );

  const renderContent = () => {
    switch (slide.type) {
   case 'title': return renderTitleSlide();
    case 'image': return renderImageSlide();  // ✅ ADD THIS LINE
    case 'stats': return renderStatsSlide();
    case 'closing': return renderClosingSlide();
    default: return renderContentSlide();
    }
  };

  return (
    <div ref={slideRef} className="absolute inset-0 opacity-0">
      {/* Content Only - NO Background */}
      <div ref={contentRef} className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-8">
        {renderContent()}
      </div>
    </div>
  );
};