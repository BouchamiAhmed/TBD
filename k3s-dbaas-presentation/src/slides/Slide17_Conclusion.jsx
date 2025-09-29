import { Target, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide17_Conclusion = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Conclusion & Implémentation" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Target className="h-8 w-8 mr-3" />
                Objectifs Atteints
              </h3>
              <div className="space-y-4">
                {[
                  { achievement: "Cluster K3s HA", detail: "4 nodes + etcd embarqué" },
                  { achievement: "Authentification LDAP", detail: "Intégration complète AD" },
                  { achievement: "Load Balancing Traefik", detail: "Middlewares avancés" },
                  { achievement: "Stockage Longhorn", detail: "Réplication + Snapshots" },
                  { achievement: "Monitoring Prometheus", detail: "Grafana + AlertManager" },
                  { achievement: "CI/CD Jenkins/ArgoCD", detail: "Pipeline complet GitOps" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-violet-500/10 rounded-lg">
                    <span className="text-2xl mr-3">✅</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{item.achievement}</div>
                      <div className="text-gray-400 text-xs">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6 flex items-center">
                <Zap className="h-8 w-8 mr-3" />
                Résultats Métier
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { metric: "Provisioning", before: "2-5h", after: "< 60s" },
                  { metric: "Disponibilité", before: "95%", after: "99.95%" },
                  { metric: "Coûts", before: "100%", after: "65%" },
                  { metric: "Time to Market", before: "2 sem", after: "1 jour" }
                ].map((gain, idx) => (
                  <div key={idx} className="bg-blue-500/10 rounded-lg p-4">
                    <div className="text-blue-400 font-semibold mb-2">{gain.metric}</div>
                    <div className="text-red-400 text-sm">Avant: {gain.before}</div>
                    <div className="text-green-400 text-sm">Après: {gain.after}</div>
                  </div>
                ))}
              </div>
              <div className="bg-black/20 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Impact Utilisateurs</h4>
                <ul className="space-y-2">
                  {[
                    "Self-service complet",
                    "Isolation multi-tenant",
                    "Scaling automatique",
                    "Backups automatiques"
                  ].map((impact, idx) => (
                    <li key={idx} className="flex items-center text-gray-300 text-sm">
                      <CheckCircle className="h-4 w-4 text-cyan-400 mr-2" />
                      {impact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FloatingCard>
        </div>

        <FloatingCard delay={2200}>
          <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-10 border border-violet-500/30">
            <h3 className="text-3xl font-semibold text-center mb-8">
              <GradientText gradient="from-violet-400 to-cyan-400">
                Perspectives & Évolutions Futures
              </GradientText>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  phase: "Court Terme (3 mois)",
                  items: ["Support MongoDB & Redis", "Interface mobile", "API GraphQL", "Multi-cloud backup"]
                },
                {
                  phase: "Moyen Terme (6 mois)",
                  items: ["Machine Learning sizing", "Auto-tuning DB", "Service Mesh Istio", "Edge computing"]
                },
                {
                  phase: "Long Terme (12 mois)",
                  items: ["Multi-cluster federation", "AI-powered monitoring", "Serverless DB", "Quantum encryption"]
                }
              ].map((roadmap, index) => (
                <div key={index} className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4 text-center">{roadmap.phase}</h4>
                  <ul className="space-y-2">
                    {roadmap.items.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-300 text-sm">
                        <ArrowRight className="h-4 w-4 text-cyan-400 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <h4 className="text-4xl font-bold text-white mb-4">Merci de votre attention !</h4>
              <p className="text-gray-300 text-xl">Questions & Discussion</p>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Slide17_Conclusion;