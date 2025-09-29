import { Server, Activity, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide07_K3sEtcdHA = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="K3s Embedded Etcd & Haute Disponibilité" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Server className="h-8 w-8 mr-3" />
                Architecture Etcd Embarqué
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Configuration Multi-Master</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3].map((node) => (
                      <div key={node} className="bg-violet-500/20 rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">{node}</span>
                        </div>
                        <div className="text-white text-sm font-semibold">Master {node}</div>
                        <div className="text-gray-400 text-xs">Etcd + API</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="text-cyan-400 font-semibold mb-2">Consensus Raft</div>
                    <div className="text-gray-300 text-sm">Élection automatique du leader</div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Avantages Techniques</h4>
                  <ul className="space-y-3">
                    {[
                      "Pas de dépendance etcd externe",
                      "Réduction de la complexité opérationnelle", 
                      "Basculement automatique < 10s",
                      "Sauvegarde intégrée du cluster state"
                    ].map((advantage, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                        {advantage}
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
                <Activity className="h-8 w-8 mr-3" />
                Stratégies Haute Disponibilité
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Node Failure Handling</h4>
                  <div className="space-y-4">
                    {[
                      { scenario: "Panne Worker Node", action: "Rescheduling automatique des pods", time: "30s" },
                      { scenario: "Panne Master Node", action: "Élection nouveau leader + Sync", time: "10s" },
                      { scenario: "Split Brain", action: "Quorum Raft + Isolation", time: "5s" }
                    ].map((scenario, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                        <div>
                          <div className="text-white font-semibold text-sm">{scenario.scenario}</div>
                          <div className="text-gray-300 text-xs">{scenario.action}</div>
                        </div>
                        <div className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                          {scenario.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Health Checks</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { component: "API Server", check: "HTTP /healthz", interval: "10s" },
                      { component: "Etcd", check: "Cluster Health", interval: "5s" },
                      { component: "Kubelet", check: "Node Ready", interval: "10s" },
                      { component: "Pods", check: "Liveness/Readiness", interval: "30s" }
                    ].map((health, idx) => (
                      <div key={idx} className="bg-cyan-500/10 rounded-lg p-3">
                        <div className="text-cyan-400 font-semibold text-sm">{health.component}</div>
                        <div className="text-gray-300 text-xs">{health.check}</div>
                        <div className="text-gray-400 text-xs mt-1">{health.interval}</div>
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

export default Slide07_K3sEtcdHA;