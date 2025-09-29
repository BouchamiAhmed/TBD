import { GitBranch, Cloud } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide16_CICD = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Intégration Continue & Livraison Continue" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <GitBranch className="h-8 w-8 mr-3" />
                Pipeline Jenkins
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Étapes du Pipeline</h4>
                  <div className="space-y-4">
                    {[
                      { stage: "1. Build", tasks: ["Compilation Go", "Tests unitaires", "Linting"], time: "2min" },
                      { stage: "2. Test", tasks: ["Tests d'intégration", "Scan sécurité", "Code coverage"], time: "5min" },
                      { stage: "3. Package", tasks: ["Build Docker image", "Tag & Push registry", "Scan vulnérabilités"], time: "3min" },
                      { stage: "4. Deploy", tasks: ["Update manifests", "ArgoCD sync", "Health checks"], time: "2min" }
                    ].map((stage, idx) => (
                      <div key={idx} className="p-4 bg-violet-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-violet-400 font-semibold">{stage.stage}</span>
                          <span className="bg-blue-500/20 px-2 py-1 rounded text-xs text-blue-400">
                            {stage.time}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {stage.tasks.map((task, tidx) => (
                            <li key={tidx} className="text-gray-300 text-xs flex items-center">
                              <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Métriques CI/CD</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { metric: "Build Success", value: "97.5%", status: "✅" },
                      { metric: "Deploy Frequency", value: "12/jour", status: "✅" },
                      { metric: "Lead Time", value: "15min", status: "✅" },
                      { metric: "MTTR", value: "8min", status: "✅" }
                    ].map((metric, idx) => (
                      <div key={idx} className="bg-blue-500/10 rounded-lg p-3 text-center">
                        <div className="text-blue-400 font-semibold text-sm">{metric.metric}</div>
                        <div className="text-white text-lg">{metric.value}</div>
                        <div className="text-xl">{metric.status}</div>
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
                <Cloud className="h-8 w-8 mr-3" />
                GitOps avec ArgoCD
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Architecture GitOps</h4>
                  <div className="space-y-4">
                    {[
                      {
                        component: "Git Repository",
                        role: "Source of truth",
                        content: "Manifests K8s + Helm charts"
                      },
                      {
                        component: "ArgoCD Controller",
                        role: "Synchronisation automatique",
                        content: "Watch Git → Apply K8s"
                      },
                      {
                        component: "Application Sets",
                        role: "Multi-tenant deployment",
                        content: "Templating dynamique"
                      },
                      {
                        component: "Rollback Automatique",
                        role: "Auto-healing",
                        content: "Detect drift → Restore"
                      }
                    ].map((comp, idx) => (
                      <div key={idx} className="p-4 bg-blue-500/10 rounded-lg">
                        <div className="text-blue-400 font-semibold mb-1">{comp.component}</div>
                        <div className="text-white text-sm">{comp.role}</div>
                        <div className="text-gray-400 text-xs">{comp.content}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Stratégies de Déploiement</h4>
                  <div className="space-y-3">
                    {[
                      { strategy: "Blue/Green", desc: "Bascule instantanée", risk: "Faible" },
                      { strategy: "Canary", desc: "Déploiement progressif", risk: "Très faible" },
                      { strategy: "Rolling Update", desc: "Mise à jour continue", risk: "Modéré" }
                    ].map((strat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                        <div>
                          <div className="text-cyan-400 font-semibold text-sm">{strat.strategy}</div>
                          <div className="text-gray-300 text-xs">{strat.desc}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          strat.risk === 'Très faible' ? 'bg-green-500/20 text-green-400' :
                          strat.risk === 'Faible' ? 'bg-blue-500/20 text-blue-400' : 
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {strat.risk}
                        </span>
                      </div>
                    ))}
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

export default Slide16_CICD;