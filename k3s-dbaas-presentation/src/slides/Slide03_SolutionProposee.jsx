import { Server, Globe, HardDrive } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide03_SolutionProposee = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Solution Proposée" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30 h-full">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                <Server className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 text-center">K3s Cluster HA</h3>
              <p className="text-gray-300 leading-relaxed mb-4 text-center">Cluster Kubernetes léger avec haute disponibilité native, etcd embarqué et gestion automatique des nœuds</p>
              <div className="border-t border-violet-500/30 pt-4">
                <h4 className="text-sm font-semibold text-violet-300 mb-3">Spécifications techniques:</h4>
                <ul className="space-y-2">
                  {["Etcd embarqué", "Multi-master setup", "Auto-healing des pods", "Service discovery natif"].map((spec, index) => (
                    <li key={index} className="flex items-center text-xs text-gray-400">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1700}>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/30 h-full">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                <Globe className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 text-center">Traefik Edge Router</h3>
              <p className="text-gray-300 leading-relaxed mb-4 text-center">Proxy inverse cloud-native avec découverte automatique des services, SSL/TLS et middlewares avancés</p>
              <div className="border-t border-violet-500/30 pt-4">
                <h4 className="text-sm font-semibold text-violet-300 mb-3">Spécifications techniques:</h4>
                <ul className="space-y-2">
                  {["Let's Encrypt intégré", "Load balancing intelligent", "Middleware chains", "Circuit breaker"].map((spec, index) => (
                    <li key={index} className="flex items-center text-xs text-gray-400">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1900}>
            <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30 h-full">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                <HardDrive className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 text-center">Longhorn Storage</h3>
              <p className="text-gray-300 leading-relaxed mb-4 text-center">Solution de stockage distribuée cloud-native avec réplication, snapshots et backup automatique</p>
              <div className="border-t border-violet-500/30 pt-4">
                <h4 className="text-sm font-semibold text-violet-300 mb-3">Spécifications techniques:</h4>
                <ul className="space-y-2">
                  {["Réplication cross-node", "Snapshots incrémentaux", "Backup vers S3", "Volume encryption"].map((spec, index) => (
                    <li key={index} className="flex items-center text-xs text-gray-400">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FloatingCard>
        </div>

        <FloatingCard delay={2200}>
          <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
            <h3 className="text-3xl font-semibold mb-8 text-center">
              <GradientText gradient="from-violet-400 to-cyan-400">
                Architecture Cloud-Native Complète
              </GradientText>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  layer: "Accès", 
                  tech: "Traefik + CERT-Manager", 
                  benefits: ["SSL automatique", "Routage intelligent"],
                  color: "bg-cyan-500/20 border-cyan-500/30"
                },
                { 
                  layer: "Orchestration", 
                  tech: "K3s Multi-Master", 
                  benefits: ["HA native", "Auto-scaling"],
                  color: "bg-blue-500/20 border-blue-500/30"
                },
                { 
                  layer: "Stockage", 
                  tech: "Longhorn Distributed", 
                  benefits: ["Haute disponibilité", "Backups automatiques"],
                  color: "bg-violet-500/20 border-violet-500/30"
                },
                { 
                  layer: "Observabilité", 
                  tech: "Prometheus Stack", 
                  benefits: ["Monitoring complet", "Alerting proactif"],
                  color: "bg-purple-500/20 border-purple-500/30"
                }
              ].map((item, index) => (
                <div key={index} className={`${item.color} rounded-xl p-6 backdrop-blur-lg border`}>
                  <h4 className="text-white font-semibold text-lg mb-2">{item.layer}</h4>
                  <p className="text-gray-300 text-sm mb-3">{item.tech}</p>
                  <ul className="space-y-1">
                    {item.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-center">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Slide03_SolutionProposee;