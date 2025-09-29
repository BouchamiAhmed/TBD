import { Shield, Lock, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide11_Isolation = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Isolation des Ressources & CERT-Manager" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6 flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                Isolation Multi-Tenant
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Namespaces Strategy</h4>
                  <div className="space-y-4">
                    {[
                      {
                        tenant: "Client-A",
                        namespace: "dbaas-client-a-prod",
                        resources: ["PostgreSQL", "Redis", "Monitoring"],
                        isolation: "Network + Resource"
                      },
                      {
                        tenant: "Client-B", 
                        namespace: "dbaas-client-b-prod",
                        resources: ["MySQL", "MongoDB", "Backup"],
                        isolation: "Network + Resource"
                      },
                      {
                        tenant: "Internal",
                        namespace: "dbaas-system",
                        resources: ["Operators", "Controllers", "Metrics"],
                        isolation: "Admin Only"
                      }
                    ].map((tenant, idx) => (
                      <div key={idx} className="p-4 bg-violet-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-violet-400 font-semibold">{tenant.tenant}</span>
                          <span className="bg-cyan-500/20 px-2 py-1 rounded text-xs text-cyan-400">
                            {tenant.isolation}
                          </span>
                        </div>
                        <div className="text-white text-sm mb-2">{tenant.namespace}</div>
                        <div className="flex flex-wrap gap-2">
                          {tenant.resources.map((resource, ridx) => (
                            <span key={ridx} className="bg-black/30 px-2 py-1 rounded text-xs text-gray-300">
                              {resource}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Resource Quotas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { resource: "CPU", limit: "8 cores", usage: "5.2 cores" },
                      { resource: "Memory", limit: "32Gi", usage: "18Gi" },
                      { resource: "Storage", limit: "500Gi", usage: "340Gi" },
                      { resource: "Pods", limit: "50", usage: "32" }
                    ].map((quota, idx) => (
                      <div key={idx} className="bg-blue-500/10 rounded-lg p-3">
                        <div className="text-blue-400 font-semibold text-sm">{quota.resource}</div>
                        <div className="text-white text-xs">Limit: {quota.limit}</div>
                        <div className="text-gray-400 text-xs">Used: {quota.usage}</div>
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
                <Lock className="h-8 w-8 mr-3" />
                CERT-Manager & PKI
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Certificate Issuers</h4>
                  <div className="space-y-4">
                    {[
                      {
                        issuer: "letsencrypt-prod",
                        type: "ACME HTTP01",
                        domains: "*.dbaas.local",
                        status: "Ready"
                      },
                      {
                        issuer: "internal-ca",
                        type: "CA Internal",
                        domains: "*.cluster.local",
                        status: "Ready" 
                      },
                      {
                        issuer: "vault-pki",
                        type: "Vault PKI",
                        domains: "*.secure.local",
                        status: "Ready"
                      }
                    ].map((issuer, idx) => (
                      <div key={idx} className="p-4 bg-blue-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-400 font-semibold">{issuer.issuer}</span>
                          <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                            {issuer.status}
                          </span>
                        </div>
                        <div className="text-white text-sm">{issuer.type}</div>
                        <div className="text-gray-400 text-xs">{issuer.domains}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Auto-Certificate Lifecycle</h4>
                  <div className="space-y-3">
                    {[
                      { phase: "Request", action: "Certificate resource created", time: "0s" },
                      { phase: "Challenge", action: "ACME HTTP01 validation", time: "15s" },
                      { phase: "Issue", action: "Certificate generation", time: "30s" },
                      { phase: "Deploy", action: "Secret update & reload", time: "45s" },
                      { phase: "Monitor", action: "Renewal tracking", time: "ongoing" }
                    ].map((lifecycle, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                        <div>
                          <div className="text-cyan-400 font-semibold text-sm">{lifecycle.phase}</div>
                          <div className="text-gray-300 text-xs">{lifecycle.action}</div>
                        </div>
                        <span className="bg-violet-500/20 px-2 py-1 rounded text-xs text-violet-400">
                          {lifecycle.time}
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

export default Slide11_Isolation;