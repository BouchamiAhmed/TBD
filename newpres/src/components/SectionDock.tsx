import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { BookOpen, Target, FileCheck, Layers, Code, Flag } from 'lucide-react';

interface SectionDockProps {
  currentSlide: number;
  onSectionChange: (slideIndex: number) => void;
}

const SectionButton = ({ 
  icon: Icon, 
  label, 
  number, 
  gradient, 
  onClick, 
  index 
}: {
  icon: any;
  label: string;
  number: number;
  gradient: string;
  onClick: () => void;
  index: number;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;
    
    // Entrance animation
    gsap.fromTo(buttonRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, delay: index * 0.1, ease: "back.out(1.7)" }
    );
  }, [index]);

  const handleMouseEnter = () => {
    if (!buttonRef.current) return;
    
    gsap.to(buttonRef.current, {
      scale: 1.1,
      duration: 0.3,
      ease: "back.out(1.7)"
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    
    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "back.out(1.7)"
    });
  };

  const handleClick = () => {
    if (!buttonRef.current) return;
    
    gsap.to(buttonRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: onClick
    });
  };

  return (
    <div className="relative group">
      {/* Button - Much darker with low opacity gradient */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative w-16 h-16 rounded-2xl flex items-center justify-center
          transition-all duration-300 border-2
          bg-black/60 backdrop-blur-xl border-white/10 hover:border-white/20
          shadow-xl hover:shadow-2xl
        `}
      >
        {/* Very subtle gradient overlay on hover */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
        
        <Icon className="relative z-10 w-7 h-7 text-gray-400 group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
        
        {/* Number badge - darker */}
        <div className={`
          absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
          text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700
          group-hover:bg-gradient-to-br group-hover:${gradient} group-hover:text-white group-hover:border-transparent
          transition-all duration-300
        `}>
          {number}
        </div>
      </button>

      {/* Tooltip - darker theme */}
      <div className={`
        absolute left-20 top-1/2 transform -translate-y-1/2
        bg-black/95 backdrop-blur-xl px-4 py-2 rounded-lg
        text-sm text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-300
        border border-white/5
      `}>
        <div className="font-semibold text-gray-200">{label}</div>
        <div className={`text-xs bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-semibold`}>
          Section {number}
        </div>
        
        {/* Arrow */}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2">
          <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-black/95"></div>
        </div>
      </div>
    </div>
  );
};

const SectionDock: React.FC<SectionDockProps> = ({ onSectionChange }) => {
  const dockRef = useRef<HTMLDivElement>(null);

  // TODO: Update slideStart values when slides.ts is finalized
  const sections = [
    { 
      number: 1, 
      label: 'Introduction', 
      icon: BookOpen, 
      gradient: 'from-purple-500 to-indigo-600',
      slideStart: 1  // TODO: Set correct slide index
    },
    { 
      number: 2, 
      label: 'Cadre du Projet', 
      icon: Target, 
      gradient: 'from-pink-500 to-rose-600',
      slideStart: 1  // TODO: Set correct slide index
    },
    { 
      number: 3, 
      label: 'Spécification', 
      icon: FileCheck, 
      gradient: 'from-red-500 to-orange-600',
      slideStart: 1  // TODO: Set correct slide index
    },
    { 
      number: 4, 
      label: 'Conception', 
      icon: Layers, 
      gradient: 'from-orange-500 to-yellow-600',
      slideStart: 1  // TODO: Set correct slide index
    },
    { 
      number: 5, 
      label: 'Implémentation', 
      icon: Code, 
      gradient: 'from-yellow-500 to-amber-600',
      slideStart: 1  // TODO: Set correct slide index
    },
    { 
      number: 6, 
      label: 'Conclusion', 
      icon: Flag, 
      gradient: 'from-cyan-500 to-blue-600',
      slideStart: 1  // TODO: Set correct slide index
    }
  ];

  useEffect(() => {
    // Dock entrance animation
    if (dockRef.current) {
      gsap.fromTo(dockRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div
      ref={dockRef}
      className="fixed left-8 top-1/2 transform -translate-y-1/2 z-50"
    >
      {/* Dock container - VERTICAL layout on LEFT side with animated gradient border */}
      <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl p-3 shadow-2xl">
        {/* Animated gradient border - very subtle */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-blue-500/20 animate-gradient-xy opacity-30"></div>
        
        {/* Inner content */}
        <div className="relative flex flex-col space-y-4">
          {sections.map((section, index) => (
            <SectionButton
              key={section.number}
              icon={section.icon}
              label={section.label}
              number={section.number}
              gradient={section.gradient}
              index={index}
              onClick={() => onSectionChange(section.slideStart)}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gradient-xy {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-gradient-xy {
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default SectionDock;