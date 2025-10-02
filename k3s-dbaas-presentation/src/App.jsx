import React, { useState, useEffect, useRef } from 'react';
import { Database, Server, Globe, Shield, Activity, Code, Target } from 'lucide-react';
import { gsap } from 'gsap';
import TechnicalBackground from './components/TechnicalBackground';
import IntroScreen from './components/AmaterasuIntroScreen';
import TargetCursor from './components/TargetCursor';

// Import des slides
import Slide00_Menu from './slides/Slide00_Menu';
import Slide01_Contexte from './slides/Slide01_Contexte';
import Slide02_EtudeExistant from './slides/Slide02_EtudeExistant';
import Slide03_SolutionProposee from './slides/Slide03_SolutionProposee';
import Slide04_UseCases from './slides/Slide04_UseCases';
import Slide05_ArchitectureGlobale from './slides/Slide05_ArchitectureGlobale';
import Slide06_RealisationMetier from './slides/Slide06_RealisationMetier';
import Slide07_K3sEtcdHA from './slides/Slide07_K3sEtcdHA';
import Slide08_LDAP from './slides/Slide08_LDAP';
import Slide09_TraefikLB from './slides/Slide09_TraefikLB';
import Slide10_Middlewares from './slides/Slide10_Middlewares';
import Slide11_Isolation from './slides/Slide11_Isolation';
import Slide12_GRPCBackdoor from './slides/Slide12_GRPCBackdoor';
import Slide13_PlatformEngineering from './slides/Slide13_PlatformEngineering';
import Slide14_Surveillance from './slides/Slide14_Surveillance';
import Slide15_Longhorn from './slides/Slide15_Longhorn';
import Slide16_CICD from './slides/Slide16_CICD';
import Slide17_Conclusion from './slides/Slide17_Conclusion';

// Menu Button Component
const MenuButton = ({ icon: Icon, label, isActive, onClick, index }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!buttonRef.current) return;

    // Entrance animation
    gsap.fromTo(buttonRef.current,
      { 
        scale: 0, 
        opacity: 0,
        rotation: -180
      },
      { 
        scale: 1, 
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        delay: index * 0.1,
        ease: "back.out(2)"
      }
    );
  }, [index]);

  const handleMouseEnter = () => {
    gsap.to(buttonRef.current, {
      scale: 1.2,
      rotation: 360,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    gsap.to(buttonRef.current, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: "power2.inOut"
    });
  };

  const handleClick = () => {
    gsap.to(buttonRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: onClick
    });
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group cursor-target ${isActive ? 'z-20' : 'z-10'}`}
    >
      <div className={`
        w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/50' 
          : 'bg-gradient-to-br from-violet-500/30 to-blue-500/30 backdrop-blur-xl border-2 border-violet-400/30'
        }
      `}>
        <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-violet-300'}`} />
      </div>
      
      {/* Tooltip */}
      <div className={`
        absolute -bottom-12 left-1/2 transform -translate-x-1/2
        bg-black/80 backdrop-blur-xl px-3 py-1 rounded-lg
        text-xs text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        pointer-events-none
      `}>
        {label}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      )}
    </button>
  );
};

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    <Slide00_Menu key="slide-0" onNavigate={(index) => setCurrentSlide(index)} />,
    <Slide01_Contexte key="slide-1" />,
    <Slide02_EtudeExistant key="slide-2" />,
    <Slide03_SolutionProposee key="slide-3" />,
    <Slide04_UseCases key="slide-4" />,
    <Slide05_ArchitectureGlobale key="slide-5" />,
    <Slide06_RealisationMetier key="slide-6" />,
    <Slide07_K3sEtcdHA key="slide-7" />,
    <Slide08_LDAP key="slide-8" />,
    <Slide09_TraefikLB key="slide-9" />,
    <Slide10_Middlewares key="slide-10" />,
    <Slide11_Isolation key="slide-11" />,
    <Slide12_GRPCBackdoor key="slide-12" />,
    <Slide13_PlatformEngineering key="slide-13" />,
    <Slide14_Surveillance key="slide-14" />,
    <Slide15_Longhorn key="slide-15" />,
    <Slide16_CICD key="slide-16" />,
    <Slide17_Conclusion key="slide-17" />
  ];

  // Menu avec 7 catégories principales (regroupant vos 17 slides)
  const menuItems = [
    { icon: Target, label: "Contexte", slideIndex: 1 },
    { icon: Server, label: "Architecture", slideIndex: 5 },
    { icon: Shield, label: "Sécurité", slideIndex: 8 },
    { icon: Activity, label: "Monitoring", slideIndex: 14 },
    { icon: Database, label: "Stockage", slideIndex: 15 },
    { icon: Code, label: "CI/CD", slideIndex: 16 },
    { icon: Globe, label: "Conclusion", slideIndex: 17 }
  ];

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showIntro) return;
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showIntro, slides.length]);

  const handleMenuClick = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  // Déterminer quel bouton du menu doit être actif
  const getActiveMenuIndex = () => {
    // Le slide 0 est le menu, donc on n'affiche pas les boutons sur ce slide
    if (currentSlide === 0) return -1;
    
    for (let i = menuItems.length - 1; i >= 0; i--) {
      if (currentSlide >= menuItems[i].slideIndex) {
        return i;
      }
    }
    return 0;
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Intro Screen */}
      {showIntro && <IntroScreen onComplete={() => setShowIntro(false)} />}

      {/* Main Presentation */}
      {!showIntro && (
        <>
          <TargetCursor 
            targetSelector="button, .cursor-target" 
            spinDuration={3}
            hideDefaultCursor={true}
          />
          
          <TechnicalBackground />
          
          {/* Animated background blobs */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
          
          <div className="relative z-10">
            {slides[currentSlide]}
          </div>

          {/* Circular Menu */}
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50">
            <div className="relative flex items-center justify-center gap-4">
              {menuItems.map((item, index) => (
                <MenuButton
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  isActive={getActiveMenuIndex() === index}
                  onClick={() => handleMenuClick(item.slideIndex)}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>

          {/* Slide Indicator */}
          <div className="fixed top-8 right-8 z-50 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-violet-500/30">
            <span className="text-violet-400 font-semibold">Slide {currentSlide + 1}/{slides.length}</span>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="fixed bottom-8 right-8 z-50 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-lg border border-violet-500/30">
            <p className="text-gray-400 text-sm">
              <kbd className="px-2 py-1 bg-violet-500/20 rounded text-violet-400">←</kbd>
              {' '}
              <kbd className="px-2 py-1 bg-violet-500/20 rounded text-violet-400">→</kbd>
              {' '}ou{' '}
              <kbd className="px-2 py-1 bg-violet-500/20 rounded text-violet-400">Espace</kbd>
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default App;