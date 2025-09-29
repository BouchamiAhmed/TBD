import { Globe, Network, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide09_TraefikLB = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Accès Externe & Load Balancing Traefik" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Globe className="h-8 w-8 mr-3" />
                Edge Router Configuration
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Points d'Entrée</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "web", port: "80", proto: "HTTP", redirect: "→ HTTPS" },
                      { name: "websecure", port: "443", proto: "HTTPS", redirect: "TLS Term" },
                      { name: "grpc", port: "9090", proto: "gRPC", redirect: "Backend" },
                      { name: "metrics", port: "8080", proto: "HTTP", redirect: "Monitoring" }
                    ].map((entry, idx) => (
                      <div key={idx} className="bg-violet-500/10 rounded-lg p-4">
                        <div className="text-violet-400 font-semibold">{entry.name}</div>
                        <div className="text-white text-sm">:{entry.port}</div>
                        <div className="text-gray-400 text-xs">{entry.proto}</div>
                        <div className="text-cyan-400 text-xs mt-1">{entry.redirect}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Découverte Automatique</h4>
                  <ul className="space-y-3">
                    {[
                      "Annotations Kubernetes natives",
                      "CRDs IngressRoute pour config avancée", 
                      "Watch des services en temps réel",
                      "Health checks automatiques"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-violet-400 mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6 flex items-center">
                <Network className="h-8 w-8 mr-3" />
                Algorithmes de Load Balancing
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Stratégies de Répartition</h4>
                  <div className="space-y-4">
                    {[
                      { 
                        algorithm: "Round Robin",
                        description: "Distribution séquentielle équitable",
                        useCase: "Trafic uniforme",
                        efficiency: "85%"
                      },
                      {
                        algorithm: "Weighted Round Robin", 
                        description: "Distribution basée sur les poids",
                        useCase: "Nœuds hétérogènes",
                        efficiency: "92%"
                      },
                      {
                        algorithm: "Least Connections",
                        description: "Vers le serveur le moins chargé",
                        useCase: "Sessions longues",
                        efficiency: "89%"
                      },
                      {
                        algorithm: "IP Hash",
                        description: "Affinity basée sur IP client",
                        useCase: "Session stickiness",
                        efficiency: "78%"
                      }
                    ].map((algo, idx) => (
                      <div key={idx} className="p-4 bg-blue-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-400 font-semibold">{algo.algorithm}</span>
                          <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                            {algo.efficiency}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{algo.description}</p>
                        <div className="text-cyan-400 text-xs">{algo.useCase}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Circuit Breaker</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-500/20 rounded-lg">
                      <div className="text-green-400 font-semibold">CLOSED</div>
                      <div className="text-xs text-gray-300 mt-1">Trafic normal</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                      <div className="text-yellow-400 font-semibold">OPEN</div>
                      <div className="text-xs text-gray-300 mt-1">Échecs détectés</div>
                    </div>
                    <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                      <div className="text-blue-400 font-semibold">HALF-OPEN</div>
                      <div className="text-xs text-gray-300 mt-1">Test de récupération</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default Slide09_TraefikLB;