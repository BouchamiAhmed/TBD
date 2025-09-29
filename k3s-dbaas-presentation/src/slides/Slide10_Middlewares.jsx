import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide10_Middlewares = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-blue-900 to-violet-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-blue-400 via-violet-500 to-cyan-400">
              <TypingText text="Middlewares & IngressRoutes Traefik" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6">Middlewares Chain</h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Pipeline de Traitement</h4>
                  <div className="space-y-4">
                    {[
                      { order: 1, middleware: "RateLimiter", function: "100 req/min par IP", config: "burst: 200" },
                      { order: 2, middleware: "Auth", function: "JWT/LDAP validation", config: "mandatory" },
                      { order: 3, middleware: "CORS", function: "Cross-origin headers", config: "strict mode" },
                      { order: 4, middleware: "Compress", function: "Gzip compression", config: "level: 6" },
                      { order: 5, middleware: "Headers", function: "Security headers", config: "HSTS, CSP" }
                    ].map((mw, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-blue-500/10 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">
                          {mw.order}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{mw.middleware}</div>
                          <div className="text-gray-300 text-sm">{mw.function}</div>
                          <div className="text-cyan-400 text-xs">{mw.config}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Custom Middlewares</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { name: "db-auth", desc: "Authentification spécifique DBaaS" },
                      { name: "tenant-isolation", desc: "Isolation multi-tenant" },
                      { name: "api-versioning", desc: "Gestion versions API" },
                      { name: "audit-log", desc: "Logging des accès sensibles" }
                    ].map((custom, idx) => (
                      <div key={idx} className="p-3 bg-violet-500/10 rounded-lg">
                        <div className="text-violet-400 font-semibold text-sm">{custom.name}</div>
                        <div className="text-gray-300 text-xs">{custom.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-violet-500/30">
              <h3 className="text-3xl font-semibold text-violet-400 mb-6">IngressRoutes Configuration</h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Routing Rules</h4>
                  <div className="space-y-4">
                    <div className="bg-violet-500/10 p-4 rounded-lg">
                      <div className="text-violet-400 font-semibold mb-2">Host-based Routing</div>
                      <div className="text-gray-300 text-sm font-mono">
                        Host(`api.dbaas.local`) && PathPrefix(`/v1/`)
                      </div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-lg">
                      <div className="text-blue-400 font-semibold mb-2">Path-based Routing</div>
                      <div className="text-gray-300 text-sm font-mono">
                        PathPrefix(`/admin/`) || PathPrefix(`/metrics`)
                      </div>
                    </div>
                    <div className="bg-cyan-500/10 p-4 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">Header-based Routing</div>
                      <div className="text-gray-300 text-sm font-mono">
                        Headers(`X-API-Version`, `v2`)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">TLS Configuration</h4>
                  <div className="space-y-3">
                    {[
                      { setting: "TLS Version", value: "1.2, 1.3", status: "Enforced" },
                      { setting: "Cipher Suites", value: "ECDHE-RSA-AES256", status: "Modern" },
                      { setting: "HSTS", value: "max-age=31536000", status: "Active" },
                      { setting: "Cert Rotation", value: "Let's Encrypt", status: "Auto" }
                    ].map((tls, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                        <div>
                          <div className="text-white font-semibold text-sm">{tls.setting}</div>
                          <div className="text-gray-300 text-xs">{tls.value}</div>
                        </div>
                        <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                          {tls.status}
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

export default Slide10_Middlewares;