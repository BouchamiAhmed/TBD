import { HardDrive, Database, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide15_Longhorn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-blue-900 to-violet-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-blue-400 via-violet-500 to-cyan-400">
              <TypingText text="Longhorn pour Job de Stockage" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6 flex items-center">
                <HardDrive className="h-8 w-8 mr-3" />
                Stockage Distribué
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Architecture Longhorn</h4>
                  <div className="space-y-4">
                    {[
                      {
                        component: "Manager",
                        role: "Orchestration des volumes",
                        replicas: "1 per node"
                      },
                      {
                        component: "Engine",
                        role: "I/O et réplication",
                        replicas: "1 per volume"
                      },
                      {
                        component: "UI Dashboard",
                        role: "Gestion graphique",
                        replicas: "HA deployment"
                      },
                      {
                        component: "CSI Driver",
                        role: "Interface Kubernetes",
                        replicas: "DaemonSet"
                      }
                    ].map((comp, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                        <div>
                          <div className="text-blue-400 font-semibold">{comp.component}</div>
                          <div className="text-gray-300 text-sm">{comp.role}</div>
                        </div>
                        <span className="text-cyan-400 text-xs">{comp.replicas}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Performances</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { metric: "IOPS", value: "15k", type: "Sequential" },
                      { metric: "Latency", value: "2ms", type: "Average" },
                      { metric: "Throughput", value: "500MB/s", type: "Sustained" },
                      { metric: "Recovery", value: "30s", type: "Node failure" }
                    ].map((perf, idx) => (
                      <div key={idx} className="bg-violet-500/10 rounded-lg p-3 text-center">
                        <div className="text-violet-400 font-semibold">{perf.metric}</div>
                        <div className="text-white text-lg">{perf.value}</div>
                        <div className="text-gray-400 text-xs">{perf.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Database className="h-8 w-8 mr-3" />
                Snapshots & Backup
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Stratégie de Backup</h4>
                  <div className="space-y-4">
                    {[
                      {
                        type: "Snapshots Locaux",
                        frequency: "Toutes les 6h",
                        retention: "7 jours",
                        rto: "< 5min"
                      },
                      {
                        type: "Backup S3",
                        frequency: "Quotidien",
                        retention: "30 jours",
                        rto: "< 30min"
                      },
                      {
                        type: "Backup Incrémental",
                        frequency: "Continu",
                        retention: "14 jours",
                        rto: "< 15min"
                      }
                    ].map((backup, idx) => (
                      <div key={idx} className="p-4 bg-violet-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-violet-400 font-semibold">{backup.type}</span>
                          <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                            RTO: {backup.rto}
                          </span>
                        </div>
                        <div className="text-white text-sm">Fréquence: {backup.frequency}</div>
                        <div className="text-gray-400 text-xs">Rétention: {backup.retention}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Disaster Recovery</h4>
                  <ul className="space-y-3">
                    {[
                      "Restauration point-in-time",
                      "Backup cross-region automatique",
                      "Test de restauration hebdomadaire",
                      "Encryption at rest et in transit"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mr-3" />
                        {feature}
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

export default Slide15_Longhorn;