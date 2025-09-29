import { Code, Layers, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide13_PlatformEngineering = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Réalisation Platform Engineering" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Code className="h-8 w-8 mr-3" />
                Stack Technique Implémenté
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Backend Microservices</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { 
                        service: "TBDback (Go)", 
                        features: ["API REST", "LDAP Auth", "PostgreSQL", "K8s Client"],
                        status: "Production"
                      },
                      { 
                        service: "Admin Microservice", 
                        features: ["gRPC Server", "Namespace Management", "DB Operations", "Monitoring"],
                        status: "Production"
                      },
                      { 
                        service: "Client Microservice", 
                        features: ["Self-service API", "User Isolation", "Resource Quotas", "Billing"],
                        status: "Production"
                      }
                    ].map((svc, idx) => (
                      <div key={idx} className="bg-violet-500/10 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-violet-400 font-semibold">{svc.service}</span>
                          <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                            {svc.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {svc.features.map((feature, fidx) => (
                            <span key={fidx} className="bg-black/30 px-2 py-1 rounded text-xs text-gray-300">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Frontend React</h4>
                  <div className="space-y-3">
                    {[
                      { component: "Dashboard", tech: "React + Bootstrap", desc: "Interface principale" },
                      { component: "Authentication", tech: "LDAP Integration", desc: "Connexion sécurisée" },
                      { component: "Database Manager", tech: "gRPC-Web", desc: "Gestion des BDs" },
                      { component: "Monitoring", tech: "Grafana Embed", desc: "Métriques temps réel" }
                    ].map((comp, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                        <div>
                          <div className="text-white font-semibold text-sm">{comp.component}</div>
                          <div className="text-gray-300 text-xs">{comp.desc}</div>
                        </div>
                        <span className="text-cyan-400 text-xs">{comp.tech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6 flex items-center">
                <Layers className="h-8 w-8 mr-3" />
                Architecture Platform
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Couches d'Abstraction</h4>
                  <div className="space-y-4">
                    {[
                      {
                        layer: "Interface Utilisateur",
                        tech: "React Dashboard + CLI Tools",
                        purpose: "Self-service & Admin"
                      },
                      {
                        layer: "API Gateway",
                        tech: "Traefik + Middlewares",
                        purpose: "Routage & Sécurité"
                      },
                      {
                        layer: "Business Logic",
                        tech: "Microservices Go",
                        purpose: "Orchestration DB"
                      },
                      {
                        layer: "Infrastructure",
                        tech: "K3s + Longhorn",
                        purpose: "Compute & Storage"
                      }
                    ].map((layer, idx) => (
                      <div key={idx} className="p-4 bg-blue-500/10 rounded-lg">
                        <div className="text-blue-400 font-semibold mb-1">{layer.layer}</div>
                        <div className="text-white text-sm">{layer.tech}</div>
                        <div className="text-gray-400 text-xs">{layer.purpose}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Patterns Implémentés</h4>
                  <ul className="space-y-3">
                    {[
                      "Event-driven architecture avec Kubernetes Events",
                      "Circuit breaker pattern pour la résilience",
                      "Multi-tenancy avec isolation namespace",
                      "GitOps pour les déploiements automatisés"
                    ].map((pattern, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mr-3" />
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default Slide13_PlatformEngineering;