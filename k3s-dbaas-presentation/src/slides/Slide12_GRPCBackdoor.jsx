import { Code, Server, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide12_GRPCBackdoor = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-blue-900 to-violet-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-blue-400 via-violet-500 to-cyan-400">
              <TypingText text="Contrôle Total & Backdoor gRPC" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6 flex items-center">
                <Code className="h-8 w-8 mr-3" />
                gRPC Admin Interface
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Services gRPC Exposés</h4>
                  <div className="space-y-4">
                    {[
                      {
                        service: "ClusterManager",
                        methods: ["GetClusterStatus", "DrainNode", "CordonNode"],
                        auth: "Admin + Certificate"
                      },
                      {
                        service: "DatabaseOperator",
                        methods: ["CreateDB", "ScaleDB", "BackupDB", "RestoreDB"],
                        auth: "Operator + RBAC"
                      },
                      {
                        service: "TenantManager", 
                        methods: ["CreateTenant", "UpdateQuotas", "DeleteTenant"],
                        auth: "Super Admin"
                      },
                      {
                        service: "SystemHealth",
                        methods: ["GetMetrics", "TriggerAlert", "GetLogs"],
                        auth: "Read-Only"
                      }
                    ].map((svc, idx) => (
                      <div key={idx} className="p-4 bg-blue-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-400 font-semibold">{svc.service}</span>
                          <span className="bg-violet-500/20 px-2 py-1 rounded text-xs text-violet-400">
                            {svc.auth}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {svc.methods.map((method, midx) => (
                            <span key={midx} className="bg-black/30 px-2 py-1 rounded text-xs text-gray-300">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Client CLI Tool</h4>
                  <div className="bg-black/40 p-4 rounded-lg font-mono text-sm">
                    <div className="text-cyan-400"># Installation</div>
                    <div className="text-gray-300">curl -sSL install.sh | bash</div>
                    <div className="text-cyan-400 mt-2"># Configuration</div>
                    <div className="text-gray-300">k3s-admin config --server grpc.dbaas.local:443</div>
                    <div className="text-cyan-400 mt-2"># Usage</div>
                    <div className="text-gray-300">k3s-admin db create --type postgres --size 10Gi</div>
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Server className="h-8 w-8 mr-3" />
                Emergency Backdoor
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Accès d'Urgence</h4>
                  <div className="space-y-4">
                    {[
                      {
                        scenario: "Cluster Lock-out",
                        access: "Direct etcd manipulation",
                        method: "kubectl + service account bypass"
                      },
                      {
                        scenario: "Network Partition",
                        access: "Local Unix socket",
                        method: "gRPC over UDS"
                      },
                      {
                        scenario: "Auth System Down",
                        access: "Emergency token",
                        method: "Pre-shared key validation"
                      },
                      {
                        scenario: "Complete Outage",
                        access: "Rescue Pod",
                        method: "Privileged container + hostNetwork"
                      }
                    ].map((emergency, idx) => (
                      <div key={idx} className="p-4 bg-violet-500/10 rounded-lg">
                        <div className="text-violet-400 font-semibold mb-1">{emergency.scenario}</div>
                        <div className="text-white text-sm">{emergency.access}</div>
                        <div className="text-gray-400 text-xs">{emergency.method}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Security Measures</h4>
                  <ul className="space-y-3">
                    {[
                      "Backdoor activé uniquement en cas d'urgence",
                      "Audit logging de tous les accès emergency",
                      "Rotation automatique des clés d'urgence",
                      "Notification immédiate aux admins",
                      "Désactivation auto après résolution"
                    ].map((measure, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mr-3" />
                        {measure}
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

export default Slide12_GRPCBackdoor;