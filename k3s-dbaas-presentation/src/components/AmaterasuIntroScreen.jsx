import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronDown, Database, Server, Shield, Activity, Code, Target, Globe } from 'lucide-react';

// Intro avec cercles Amaterasu
const IntroSection = ({ onComplete }) => {
  const [clicked, setClicked] = useState(false);
  const containerRef = useRef(null);
  const circlesRef = useRef([]);
  const textRef = useRef(null);
  const clickTextRef = useRef(null);
  const bottomTextRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      circlesRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
    );

    gsap.fromTo(textRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 1 });
    gsap.fromTo(clickTextRef.current, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out', delay: 1.5 });
    
    gsap.to(clickTextRef.current, {
      opacity: 0.6,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2
    });

    gsap.fromTo(bottomTextRef.current, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out', delay: 2 });
  }, []);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);

    const tl = gsap.timeline({ onComplete: () => { if (onComplete) onComplete(); } });
    
    tl.to(circlesRef.current, { scale: 3, opacity: 0, duration: 1.2, stagger: 0.08, ease: 'power3.in' });
    tl.to([textRef.current, clickTextRef.current, bottomTextRef.current], { opacity: 0, duration: 0.8, ease: 'power2.in' }, 0);
    tl.to(containerRef.current, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.8);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer bg-gradient-to-br from-[#0a1929] via-[#1a237e] to-[#006064]"
    >
      {/* Cercles */}
      <div className="relative w-[600px] h-[600px]">
        <div ref={(el) => (circlesRef.current[0] = el)} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-cyan-400/30" style={{ opacity: 0 }} />
        
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
          const radius = 180;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <div
              key={index}
              ref={(el) => (circlesRef.current[index + 1] = el)}
              className="absolute w-48 h-48 rounded-full border border-cyan-400/30"
              style={{ top: '50%', left: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, opacity: 0 }}
            />
          );
        })}

        {/* Click to Start au centre */}
        <div ref={clickTextRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center" style={{ opacity: 0 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Click to Start</p>
        </div>
      </div>

      {/* Texte principal */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={textRef} className="text-center" style={{ opacity: 0, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
          <h1 className="text-6xl font-bold text-white tracking-tight uppercase">Marzouki Moetez</h1>
          <p className="text-2xl text-cyan-400/80 tracking-widest uppercase mt-2">Présente</p>
        </div>
      </div>

      {/* Texte en bas */}
      <div ref={bottomTextRef} className="absolute bottom-12 left-0 right-0 text-center" style={{ opacity: 0 }}>
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-400/50" style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
          Moetez Présente
        </p>
      </div>
    </div>
  );
};

// Hero section
const HeroSection = () => {
  const titleRef = useRef(null);

  useEffect(() => {
    const chars = titleRef.current?.querySelectorAll('.char');
    gsap.fromTo(chars, { opacity: 0, y: 100 }, { opacity: 1, y: 0, duration: 1, stagger: 0.05, ease: 'power3.out', delay: 0.3 });
  }, []);

  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="char inline-block" style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-start px-8 md:px-20 lg:px-32 relative bg-black">
      <div className="max-w-7xl w-full">
        <p className="text-gray-500 text-sm uppercase tracking-[0.3em] mb-4">Présentation PFE 2025</p>
        <h1 ref={titleRef} className="text-[8vw] md:text-[7vw] leading-[0.9] font-light text-white mb-12">
          {splitText('Database as a Service')}
        </h1>
        <p className="text-2xl md:text-3xl text-gray-400 font-light">
          Platform Engineering Solution
        </p>
        <p className="text-xl text-gray-600 mt-4">par Moetez Marzouki</p>
      </div>
      
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-gray-600 text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </div>
    </section>
  );
};

// Section numérotée
const NumberedSection = ({ number, title, description, details, alignment = 'left' }) => {
  const sectionRef = useRef(null);
  const numberRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(numberRef.current, { opacity: 0, y: 100 }, { opacity: 0.1, y: 0, duration: 1.2, ease: 'power3.out' });
            gsap.fromTo(contentRef.current?.querySelectorAll('.content-item'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out', delay: 0.3 });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`min-h-screen flex items-center px-8 md:px-20 lg:px-32 py-32 relative bg-black ${alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div ref={numberRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[25vw] font-bold text-white pointer-events-none select-none" style={{ opacity: 0 }}>
        {number}
      </div>
      
      <div ref={contentRef} className="max-w-2xl relative z-10">
        <div className="content-item mb-8">
          <span className="text-gray-600 text-sm uppercase tracking-[0.3em] mb-4 block">{number.padStart(2, '0')}</span>
          <h2 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">{title}</h2>
          <p className="text-xl text-gray-400 leading-relaxed">{description}</p>
        </div>
        
        {details && (
          <div className="space-y-6 mt-12">
            {details.map((detail, index) => (
              <div key={index} className="content-item border-l-2 border-gray-800 pl-6 py-2">
                <h3 className="text-white font-medium mb-2">{detail.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{detail.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// Main App
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (showIntro) {
    return <IntroSection onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="bg-black text-white overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-50">
        <div className="h-full bg-white transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <nav className="fixed top-8 right-8 md:right-20 z-40 flex items-center gap-6">
        <span className="text-xs text-gray-600 uppercase tracking-widest">DBaaS</span>
        <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-xs text-gray-600">25</div>
      </nav>

      <HeroSection />
      
      <NumberedSection
        number="1"
        title="Contexte & Problématique"
        description="Les infrastructures traditionnelles de bases de données présentent des limitations majeures."
        details={[
          { title: 'Provisioning manuel', content: 'Déploiement lent nécessitant 2 à 5 heures' },
          { title: 'Scalabilité limitée', content: 'Absence de mécanismes d\'auto-scaling' }
        ]}
      />

      <NumberedSection
        number="2"
        title="Architecture K3s"
        description="Cluster Kubernetes léger avec etcd embarqué."
        details={[
          { title: 'Multi-master setup', content: '3 nœuds masters avec élection automatique' },
          { title: 'Auto-healing', content: 'Détection et récupération automatique' }
        ]}
        alignment="right"
      />
    </div>
  );
}