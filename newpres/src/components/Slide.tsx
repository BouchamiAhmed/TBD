import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Slide as SlideType } from '../types';
import { BarChart3, TrendingUp, Users, Target, Award, Clock } from 'lucide-react';
import { ZoomableImage } from './ZoomableImage';
import BounceCards from './BounceCards';
import PixelTransition from './PixelTransition';
import TiltedCard from './TiltedCard';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

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
          { y: '0%', duration: 0.6, ease: "power2.out" }
        )
        .fromTo(contentRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power1.out" },
          "-=0.3"
        );

      elementsRef.current.forEach((el, index) => {
        if (el) {
          tl.fromTo(el,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)", delay: 0 },
            "-=0.4"
          );
        }
      });

    } else if (isPrev) {
      tl.to(slideRef.current, { y: '-100%', opacity: 0, duration: 0.8, ease: "power3.in", zIndex: 10 });
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

const renderImageSlide = () => (
  <>
    <div ref={addToRefs}>
      <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
        {slide.title}
      </h2>
    </div>
    {slide.content && (
      <div ref={addToRefs}>
        <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.content}
        </p>
      </div>
    )}
    {slide.image && (
      <div ref={addToRefs} className="flex justify-center max-w-6xl mx-auto mb-8">
        <ZoomableImage 
          src={slide.image} 
          alt={slide.title}
          className="w-full"
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
            <div key={index} ref={addToRefs} className="backdrop-blur-xl bg-white/10 rounded-3xl p-10 border border-white/20 text-center hover:bg-white/15 transition-all cursor-target">
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
  const renderScrollStack = () =>{
    const points= [
      {title: 'Sprint 0', subtitle: 'Planification générale (2 semaines)', image: ''},
      {title: 'Sprint 1', subtitle: 'Infrastructure K3s HA (2 semaines)', image: ''},
      {title: 'Sprint 2', subtitle: 'Stockage Longhorn + Backup (2 semaines)', image: ''},
      {title: 'Sprint 3', subtitle: 'LDAP & Sécurité (2 semaines)', image: ''},
      {title: 'Sprint 4', subtitle: 'Monitoring & Alerting (2 semaines)', image: ''},
      {title: 'Sprint 5', subtitle: 'CI/CD Pipeline (2 semaines)', imaxge: ''}
    ]
return <><div ref={addToRefs} style={{paddingTop: '5rem'}}>
          <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>
           <div ref={addToRefs} style={{marginBottom: '1rem'}}>
          <p className="text-xl text-white/90 max-w-4xl mx-auto backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/10" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.content}
          </p>
        </div><ScrollStack>
  {points.map((point, index) => (
  <ScrollStackItem itemClassName={`ssc-demo-${index+1} scroll-stack-card-demo`}>
    <div>
      <h2>{point.title}</h2>
      <p>{point.subtitle}</p>
    </div>
    <div className="stack-img-container">
      <img src={point.image} />
    </div>
  </ScrollStackItem>
  ))}
</ScrollStack>
</>
  }
  const renderTitledCards = () => {
    const points = [
      {overlayContent: 'Client Externe - Pack offer', captionText: 'Namespace Permission Level', imageUrl: '/images/external.svg'},
      {overlayContent: 'Client Interne - Pay as you go', captionText: 'Namespace Permission Level', imageUrl: '/images/internal.svg'},
      {overlayContent: 'Administrateur - Intervantion + UI', captionText: 'Cluster Permission Level', imageUrl: '/images/admin.svg'},
    ]
    return<> <div ref={addToRefs}>
          <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>
           <div ref={addToRefs} style={{marginBottom: '1rem'}}>
          <p className="text-xl text-white/90 max-w-4xl mx-auto backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/10" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.content}
          </p>
        </div> <div className='flex gap-8'> {points.map((point, index) => ( <TiltedCard
  imageSrc={point.imageUrl}
  altText={point.overlayContent+" Image"}
  captionText={point.captionText}
  containerHeight="300px"
  containerWidth="300px"
  imageHeight="300px"
  imageWidth="300px"
  rotateAmplitude={12}
  scaleOnHover={1.2}
  showMobileWarning={false}
  showTooltip={true}
  displayOverlayContent={true}
  overlayContent={
    <p className="tilted-card-demo-text">
      {point.overlayContent}
    </p>
  }
/>
  ))}
  </div>
  </>
  }

  const renderTechStackSlide = () => {
    const names = [
      'K3s',
      'Traefik',
      'PostgreSQL',
      'Longhorn',
      'Prometheus',
      'Grafana',
      'Go',
      'React',
      'Jenkins',
      'ArgoCD'
    ];


const images = [
  "/images/k3slogo.png",
  "https://doc.traefik.io/traefik/assets/img/traefik.logo.png",
  "https://www.postgresql.org/media/img/about/press/elephant.png",
  "https://raw.githubusercontent.com/cncf/artwork/master/projects/longhorn/icon/color/longhorn-icon-color.svg",
  "https://raw.githubusercontent.com/cncf/artwork/master/projects/prometheus/icon/color/prometheus-icon-color.svg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a1/Grafana_logo.svg",
  "https://go.dev/blog/go-brand/Go-Logo/SVG/Go-Logo_Blue.svg",
  "https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg",
  "https://www.jenkins.io/images/logos/jenkins/jenkins.svg",
  "https://raw.githubusercontent.com/cncf/artwork/master/projects/argo/icon/color/argo-icon-color.svg"
];

const transformStyles = [ "rotate(10deg) translate(-420px)", "rotate(7deg) translate(-340px)", "rotate(4deg) translate(-260px)", "rotate(2deg) translate(-180px)", "rotate(0deg) translate(-100px)", "rotate(-2deg) translate(-20px)", "rotate(-4deg) translate(60px)", "rotate(-7deg) translate(140px)", "rotate(-10deg) translate(220px)", "rotate(-13deg) translate(300px)" ];




return <> 
 <div ref={addToRefs}>
          <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {slide.title}
          </h2>
        </div>
<BounceCards
  className="translate-x-[65px]"
  images={images}
  names={names}
  containerWidth={1200}
  containerHeight={350}
  animationDelay={1}
  animationStagger={0.08}
  easeType="elastic.out(1, 0.5)"
  transformStyles={transformStyles}
  enableHover={true}
  
/>
</>
  };
  const renderPixelTrans = (title1: string, subtitle1: string, array1:string[], title2: string, subtitle2: string, array2:string[]) => {
 

return  <>
        <PixelTransition
  firstContent={
          <div ref={addToRefs}>

    <h2 className="text-5xl font-bold text-white mb-12 drop-shadow-2xl  cursor-target" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title1}
        </h2>
        </div>
  }
  secondContent={
          <div ref={addToRefs}>

      <h2 className="text-5xl font-bold text-white mb-12 drop-shadow-2xl  cursor-target" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title2}
        </h2>
        </div>
  }
  gridSize={4}
  pixelColor='#ffffff'
  once={true}
  animationStepDuration={0.4}
  className="custom-pixel-card"
  aspectRatio='10%'
  style={{marginBottom: '1rem'}}
/>
    
    
      {subtitle1 && (
              <PixelTransition
  firstContent={
        <div ref={addToRefs} style={{marginBottom: '1rem'}}>
          <p className="text-xl text-white/90 max-w-4xl mx-auto backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/10 cursor-target" style={{ fontFamily: 'Inter, sans-serif' }}>
            {subtitle1}
          </p>
        </div>
  }
  secondContent={
         <div ref={addToRefs} style={{marginBottom: '1rem'}}>
          <p className="text-xl text-white/90 max-w-4xl mx-auto backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/10  cursor-target" style={{ fontFamily: 'Inter, sans-serif' }}>
            {subtitle2}
          </p>
        </div>
  }
  gridSize={4}
  pixelColor='#ffffff'
  once={true}
  animationStepDuration={0.4}
  className="custom-pixel-card"
  style={{marginBottom: '2rem',}}
  aspectRatio='20%'
/>
      
      )}
      {slide.points && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {slide.points.map((point, index) => (
<PixelTransition
  firstContent={
              <div className="flex items-start space-x-4 cursor-target"   style={{textAlign: 'center', padding: '24px'}}>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-white text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{array1[index]}</p>
              </div>
  }
  secondContent={
              <div className="flex items-start space-x-4 cursor-target"   style={{textAlign: 'center', padding: '24px'}}>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-white text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{array2[index]}</p>
              </div>
  }
  gridSize={6}
  pixelColor='#ffffff'
  once={true}
  animationStepDuration={0.4}
  key={index} 
  className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"  
  aspectRatio='9%'

/>
            
         
          ))}
        </div>
      )}
    </>
  };

  const renderContent = () => {
    switch (slide.type) {
      case 'title': return renderTitleSlide();
      case 'image': return renderImageSlide();
      case 'divider': return renderDividerSlide();
      case 'stats': return renderStatsSlide();
      case 'closing': return renderClosingSlide();
      default: 
        if (slide.id === 22) return renderTechStackSlide();
        else if (slide.id === 7 ) return renderPixelTrans("Contexte du Projet",'Infrastructure traditionnelle de bases de données avec limitations critiques.',[
      'Provisioning manuel: 2-5 heures par instance',
      'Pas de haute disponibilité native',
      'Sécurité et isolation insuffisantes',
      'Monitoring basique sans alerting proactif',
      'Pas de standardisation des déploiements',
      'Coûts opérationnels élevés (DevOps overhead)'
    ],'Solution Proposée','Plateforme DBaaS cloud-native avec automatisation complète.', [
      'K3s Cluster HA: Multi-master avec etcd embarqué',
      'Traefik: SSL auto + load balancing intelligent',
      'Longhorn: Stockage distribué + réplication',
      'Prometheus Stack: Monitoring + alerting',
      'LDAP/RBAC/SSL: Authentification centralisée',
      'CI/CD: Jenkins + ArgoCD GitOps'
    ]);
    else if (slide.id === 12) return renderTitledCards();
    else if (slide.id === 14) return renderScrollStack();
        return renderContentSlide();
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