import { Monitor, Activity } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide14_Surveillance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Surveillance de l'Infrastructure" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Monitor className="h-8 w-8 mr-3" />
                Stack Prometheus
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Composants de Monitoring</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { component: "Prometheus", role: "Metrics Storage", status: "Active" },
                      { component: "Grafana", role: "Visualization", status: "Active" },
                      { component: "AlertManager", role: "Alert Routing", status: "Active" },
                      { component: "Node Exporter", role: "Host Metrics", status: "Active" },
                      { component: "kube-state-metrics", role: "K8s Metrics", status: "Active" },
                      { component: "Blackbox Exporter", role: "Endpoint Probing", status: "Active" }
                    ].map((comp, idx) => (
                      <div key={idx} className="bg-violet-500/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-violet-400 font-semibold text-sm">{comp.component}</span>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="text-white text-xs">{comp.role}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Métriques Clés</h4>
                  <div className="space-y-3">
                    {[
                      { metric: "Cluster CPU Usage", value: "65%", trend: "↗" },
                      { metric: "Memory Utilization", value: "78%", trend: "→" },
                      { metric: "Storage IOPS", value: "2.3k", trend: "↗" },
                      { metric: "Network Throughput", value: "1.2Gb/s", trend: "↘" },
                      { metric: "Pod Restart Rate", value: "0.02/min", trend: "↘" },
                      { metric: "API Response Time", value: "45ms", trend: "→" }
                    ].map((metric, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                        <span className="text-gray-300">{metric.metric}</span>
                        <div className="flex items-center">
                          <span className="text-white font-semibold mr-2">{metric.value}</span>
                          <span className={`text-lg ${
                            metric.trend === '↗' ? 'text-red-400' :
                            metric.trend === '↘' ? 'text-green-400' : 'text-gray-400'
                          }`}>{metric.trend}</span>
                        </div>
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
                <Activity className="h-8 w-8 mr-3" />
                Alerting & SLA
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Règles d'Alerting</h4>
                  <div className="space-y-4">
                    {[
                      {
                        alert: "HighCPUUsage",
                        condition: "CPU > 90% for 5m",
                        severity: "warning",
                        action: "Scale up nodes"
                      },
                      {
                        alert: "PodCrashLooping",
                        condition: "restarts > 5 in 10m",
                        severity: "critical", 
                        action: "Emergency rollback"
                      },
                      {
                        alert: "StorageLow",
                        condition: "Available < 10%",
                        severity: "warning",
                        action: "Expand volumes"
                      },
                      {
                        alert: "APIServerDown",
                        condition: "API unavailable > 30s",
                        severity: "critical",
                        action: "Failover master"
                      }
                    ].map((alert, idx) => (
                      <div key={idx} className="p-4 bg-blue-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-400 font-semibold">{alert.alert}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <div className="text-gray-300 text-sm mb-1">{alert.condition}</div>
                        <div className="text-cyan-400 text-xs">{alert.action}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">SLA Objectives</h4>
                  <div className="space-y-3">
                    {[
                      { sla: "Availability", target: "99.9%", current: "99.95%", status: "✅" },
                      { sla: "Response Time", target: "< 100ms", current: "45ms", status: "✅" },
                      { sla: "Throughput", target: "> 1000 req/s", current: "1250 req/s", status: "✅" },
                      { sla: "Recovery Time", target: "< 5min", current: "2.3min", status: "✅" }
                    ].map((sla, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                        <div>
                          <div className="text-white font-semibold text-sm">{sla.sla}</div>
                          <div className="text-gray-300 text-xs">Target: {sla.target}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-400 font-semibold text-sm">{sla.current}</div>
                          <div className="text-lg">{sla.status}</div>
                        </div>
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

export default Slide14_Surveillance;