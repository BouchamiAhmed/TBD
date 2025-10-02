import { useEffect, useRef } from 'react';
import { Database, Server, Globe, Shield, Activity, Code, Target, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import DecryptedText from '../components/DecryptedText';

const Slide00_Menu = ({ onChapterClick }) => {
  const titleRef = useRef(null);
  const chaptersRef = useRef([]);

  useEffect(() => {
    // Title animation
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
    }

    // Chapters staggered animation
    chaptersRef.current.forEach((chapter, index) => {
      if (chapter) {
        gsap.fromTo(chapter,
          { 
            opacity: 0, 
            x: -100,
            rotationY: -45
          },
          { 
            opacity: 1, 
            x: 0,
            rotationY: 0,
            duration: 0.8,
            delay: 0.3 + (index * 0.15),
            ease: "back.out(1.2)"
          }
        );
      }
    });
  }, []);

  const chapters = [
    { 
      icon: Target, 
      title: "Contexte & Problématiques", 
      subtitle: "Introduction au projet DBaaS",
      slideIndex: 1,
      color: "from-cyan-400 to-blue-600"
    },
    { 
      icon: Server, 
      title: "Architecture K3s", 
      subtitle: "Infrastructure cloud-native",
      slideIndex: 5,
      color: "from-blue-500 to-indigo-600"
    },
    { 
      icon: Shield, 
      title: "Sécurité & Isolation", 
      subtitle: "LDAP, RBAC & Multi-tenant",
      slideIndex: 8,
      color: "from-violet-500 to-purple-600"
    },
    { 
      icon: Activity, 
      title: "Surveillance & Monitoring", 
      subtitle: "Stack Prometheus & Grafana",
      slideIndex: 14,
      color: "from-purple-500 to-pink-600"
    },
    { 
      icon: Database, 
      title: "Stockage Distribué", 
      subtitle: "Longhorn & Persistence",
      slideIndex: 15,
      color: "from-pink-500 to-rose-600"
    },
    { 
      icon: Code, 
      title: "CI/CD Pipeline", 
      subtitle: "Jenkins & ArgoCD GitOps",
      slideIndex: 16,
      color: "from-rose-500 to-red-600"
    },
    { 
      icon: Globe, 
      title: "Conclusion & Résultats", 
      subtitle: "Bilan & Perspectives",
      slideIndex: 17,
      color: "from-red-500 to-orange-600"
    }
  ];

  const handleChapterClick = (slideIndex) => {
    if (onChapterClick) {
      onChapterClick(slideIndex);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-16">
          <h1 className="text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
              <DecryptedText 
                text="Sommaire" 
                animateOn="mount"
                speed={30}
                maxIterations={15}
              />
            </span>
          </h1>
          <p className="text-2xl text-gray-300">
            <DecryptedText 
              text="Platform Engineering - Database as a Service" 
              animateOn="mount"
              speed={20}
              maxIterations={10}
            />
          </p>
          <p className="text-xl text-violet-400 mt-4">
            <DecryptedText 
              text="par Moetez Marzouki" 
              animateOn="mount"
              speed={15}
              maxIterations={8}
            />
          </p>
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon;
            return (
              <div
                key={index}
                ref={(el) => (chaptersRef.current[index] = el)}
                onClick={() => handleChapterClick(chapter.slideIndex)}
                className="group relative cursor-pointer"
                style={{ perspective: "1000px" }}
              >
                <div className="relative bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-xl rounded-2xl p-6 border border-violet-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
                  {/* Number badge */}
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chapter.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-xl">{index + 1}</span>
                    </div>
                  </div>

                  <div className="flex items-center ml-12">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${chapter.color} flex items-center justify-center mr-6 group-hover:rotate-12 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                        {chapter.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{chapter.subtitle}</p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-8 w-8 text-violet-400 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-300" />
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${chapter.color} opacity-10 blur-xl`}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer instruction */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Cliquez sur un chapitre pour commencer ou utilisez les flèches{' '}
            <kbd className="px-2 py-1 bg-violet-500/20 rounded text-violet-400 text-xs">→</kbd>
          </p>
        </div>
      </div>

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

export default Slide00_Menu;