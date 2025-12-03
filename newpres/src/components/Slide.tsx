import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { Slide as SlideType } from '../types';
import { BarChart3, TrendingUp, Users, Target, Award, Clock } from 'lucide-react';
import { ZoomableImage } from './ZoomableImage';
import BounceCards from './BounceCards';
import PixelTransition from './PixelTransition';
import TiltedCard from './TiltedCard';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import RotatingText from './RotatingText';
import GradientText from './GradientText';

// Lazy load heavy components
const InfiniteMenu = lazy(() => import('./InfiniteMenu'));
const LetterGlitch = lazy(() => import('./Letterglitch'));

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
      {slide.id === 0 && (
        <div ref={addToRefs} className="mt-8">
          <div className="text-2xl font-semibold flex items-center justify-center gap-3">
            <RotatingText
              texts={[
                'Réalisé par :',
                'Encadrante technique:',
                'Encadrant technique:'
              ]}
              rotationInterval={3000}
              splitBy="words"
              mainClassName="inline-flex text-white"
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            />
            <RotatingText
              texts={[
                'Moetez Marzouki',
                'Hajer Bargaoui',
                'Jazil Guesmi'
              ]}
              rotationInterval={3000}
              splitBy="characters"
              staggerDuration={0.03}
              staggerFrom="first"
              mainClassName="inline-flex bg-gradient-to-r from-blue-600/50 to-purple-600/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white"
              initial={{ y: '100%', opacity: 0, delay: 0.2 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
            />
          </div>
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
        {slide.id === 5 ? (
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full max-w-2xl rounded-2xl"
          />
        ) : (
          <ZoomableImage
            src={slide.image}
            alt={slide.title}
            className="w-full"
          />
        )}
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
  gridSize={25}
  once={true}
  animationStepDuration={0.9}
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
  gridSize={22}
  once={true}
  animationStepDuration={0.6}
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
  gridSize={12}
  once={true}
  animationStepDuration={0.55}
  key={index}
  className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
  aspectRatio='9%'

/>


          ))}
        </div>
      )}
    </>
  };

  const renderFusedSection5Slide = () => {
    // Vibrant color palette
    const colors = [
      '#2d8f5f', // K3s - Deep Green
      '#61dca3', // LDAP - Bright Green
      '#61b3dc', // Traefik - Sky Blue
      '#7c86e0', // Security - Indigo
      '#a855f7', // Multi-Tenant - Purple
      '#f97316', // gRPC - Orange
      '#10b981', // Platform - Emerald
      '#0ea5e9', // Monitor - Cyan
      '#ef4444', // Longhorn - Red
      '#f59e0b'  // CI/CD - Amber
    ];

    // Menu items from slides 23-32 (no image needed - shader handles it!)
    const menuItems = [
      {
        link: '#k3s',
        title: 'K3s Embedded Etcd & HA',
        bubbleTitle: 'K3s HA',
        description: 'Configuration multi-master avec consensus Raft',
        color: colors[0],
        points: [
          'Configuration 3 masters avec etcd embarqué',
          'Élection automatique du leader < 10s',
          'Basculement automatique (panne < 30s)',
          'Snapshots automatiques du cluster state',
          'Health checks: API (10s), Etcd (5s), Kubelet (10s)',
          'Recovery automatique avec auto-healing'
        ]
      },
      {
        link: '#ldap',
        title: 'LDAP & Contrôle d\'Accès',
        bubbleTitle: 'LDAP',
        description: 'Authentification centralisée avec RBAC granulaire',
        color: colors[1],
        points: [
          'Authentification LDAP avec SSL/TLS',
          'Mapping groupes LDAP → Rôles K8s RBAC',
          'Isolation multi-tenant: Admin, DevOps, Developer',
          'Autorisation 3 niveaux: Cluster, Namespace, Resource',
          'Audit logging de toutes actions utilisateur',
          'Alertes automatiques sur activités suspectes'
        ]
      },
      {
        link: '#traefik',
        title: 'Traefik Load Balancing',
        bubbleTitle: 'Traefik',
        description: 'Proxy inverse cloud-native avec découverte auto',
        color: colors[2],
        points: [
          'Découverte automatique des services K8s',
          'SSL/TLS automatique avec Let\'s Encrypt',
          'Load balancing: Round-robin, Weighted',
          'Circuit breaker & rate limiting',
          'Headers middleware: CORS, Security headers',
          'Métriques Prometheus intégrées'
        ]
      },
      {
        link: '#middleware',
        title: 'Middlewares Traefik',
        bubbleTitle: 'Security',
        description: 'Couches de protection multi-niveaux',
        color: colors[3],
        points: [
          'Network Policies: Isolation trafic pod-to-pod',
          'PodSecurityPolicies: Contraintes runtime',
          'Rate Limiting: 100 req/s par IP',
          'Secret Management: Vault integration',
          'Séparation par URL/URI',
          'Regex Validation: Noms ressources K8s'
        ]
      },
      {
        link: '#isolation',
        title: 'Isolation Multi-Tenant',
        bubbleTitle: 'Multi-Tenant',
        description: 'Séparation forte entre clients et environnements',
        color: colors[4],
        points: [
          'Namespaces K8s: Isolation logique',
          'Resource Quotas: CPU, Memory, Storage limits',
          'Network Policies: Zero-trust networking',
          'RBAC: Permissions par namespace',
          'Pod Security: runAsNonRoot, readOnlyRootFS',
          'Audit: Logging séparé par tenant'
        ]
      },
      {
        link: '#grpc',
        title: 'GRPC Admin API',
        bubbleTitle: 'gRPC',
        description: 'API haute performance pour opérations critiques',
        color: colors[5],
        points: [
          'GRPC vs REST: 7x plus rapide',
          'Protobuf: Sérialisation binaire efficace',
          'Streaming bidirectionnel pour logs temps réel',
          'Network: HTTP/2 avec multiplexage isolée',
          'Opérations: CreateDB, DeleteDB, Backup, Restore',
          'Monitoring: Latence p50 < 10ms, p99 < 50ms'
        ]
      },
      {
        link: '#platform',
        title: 'Platform Engineering',
        bubbleTitle: 'Platform',
        description: 'Infrastructure as Code et self-service',
        color: colors[6],
        points: [
          'Backup.yaml: Provisioning infra cloud',
          'Helm Charts: Packaging applications K8s',
          'Operators: Automation logique métier',
          'GitOps: ArgoCD pour déploiements'
        ]
      },
      {
        link: '#monitoring',
        title: 'Surveillance & Monitoring',
        bubbleTitle: 'Monitor',
        description: 'Observabilité complète de la plateforme',
        color: colors[7],
        points: [
          'Prometheus: Collecte métriques (15s scrape)',
          'Grafana: 20+ dashboards temps réel',
          'AlertManager: Routing (email, Slack, PagerDuty)',
          'SLOs: Uptime 99.95%, Latency p99 < 100ms'
        ]
      },
      {
        link: '#storage',
        title: 'Longhorn Storage',
        bubbleTitle: 'Longhorn',
        description: 'Stockage distribué cloud-native avec HA',
        color: colors[8],
        points: [
          'Réplication 3 copies sur nodes différents',
          'Snapshots automatiques: Quotidien + Hebdo'
        ]
      },
      {
        link: '#cicd',
        title: 'CI/CD Pipeline',
        bubbleTitle: 'CI/CD',
        description: 'Automatisation complète du déploiement',
        color: colors[9],
        points: [
          'Jenkins: Build, Test, Package (< 5 min)',
          'ArgoCD: GitOps deployment automatique',
          'Helm: Versioning applications (semantic)'
        ]
      }
    ];

    // Only render heavy components when slide is active or adjacent
    if (!isActive && !isNext && !isPrev) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-white text-2xl opacity-50">Interactive Menu</div>
        </div>
      );
    }

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-white text-2xl">Chargement...</div>
        </div>
      }>
        <div className="absolute inset-0 w-full h-full">
          {/* Letterglitch Background - More transparent */}
          <div className="absolute inset-0 w-full h-full z-0 opacity-40">
            <LetterGlitch
              glitchColors={['#2b4539', '#61dca3', '#61b3dc']}
              glitchSpeed={50}
              centerVignette={false}
              outerVignette={true}
              smooth={true}
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
            />
          </div>
          {/* InfiniteMenu on top */}
          <div className="absolute inset-0 w-full h-full z-10 pointer-events-auto">
            <InfiniteMenu items={menuItems} />
          </div>
        </div>
      </Suspense>
    );
  };

  const renderK8sSlide = () => (
    <>
      <div ref={addToRefs} className="mb-8">
        <h2 className="text-6xl font-black text-white drop-shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {slide.title}
        </h2>
      </div>
      {slide.content && (
        <div ref={addToRefs} className="mb-12">
          <GradientText
            colors={['#ffffff', '#3b82f6', '#a855f7', '#ffffff']}
            animationSpeed={6}
            showBorder={false}
          >
            <p className="text-2xl font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              {slide.content}
            </p>
          </GradientText>
        </div>
      )}
      <div ref={addToRefs} className="mt-12">
        <img
          src="/images/k8s logo.svg"
          alt="Kubernetes Logo"
          className="w-64 h-64 mx-auto animate-spin-slow"
        />
      </div>
    </>
  );

  const renderContent = () => {
    switch (slide.type) {
      case 'title': return renderTitleSlide();
      case 'image': return renderImageSlide();
      case 'divider': return renderDividerSlide();
      case 'stats': return renderStatsSlide();
      case 'closing': return renderClosingSlide();
      default:
        if (slide.id === 22) return renderTechStackSlide();
        else if (slide.id === 23) return renderFusedSection5Slide();
        else if (slide.id === 24) return renderK8sSlide();
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