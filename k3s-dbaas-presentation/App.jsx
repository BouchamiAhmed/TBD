import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TechnicalBackground from './components/TechnicalBackground';

// Import des slides
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

const App = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <TechnicalBackground />
      
      <div className="relative z-10">
        {slides[currentSlide]}
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-6 bg-black/50 backdrop-blur-xl px-8 py-4 rounded-full border border-violet-500/30">
        <button
          onClick={previousSlide}
          disabled={currentSlide === 0}
          className="p-3 rounded-full bg-violet-500/20 hover:bg-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 group"
        >
          <ChevronLeft className="h-6 w-6 text-violet-400 group-hover:text-violet-300" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-violet-400 font-semibold text-lg">{currentSlide + 1}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{slides.length}</span>
        </div>
        
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="p-3 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 group"
        >
          <ChevronRight className="h-6 w-6 text-cyan-400 group-hover:text-cyan-300" />
        </button>
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
    </div>
  );
};

export default App;