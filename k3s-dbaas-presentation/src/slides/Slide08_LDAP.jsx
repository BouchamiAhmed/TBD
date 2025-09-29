import { Users, Lock, CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide08_LDAP = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-blue-900 to-violet-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-blue-400 via-violet-500 to-cyan-400">
              <TypingText text="Contrôle d'Accès Utilisateur avec LDAP" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6 flex items-center">
                <Users className="h-8 w-8 mr-3" />
                Intégration LDAP/AD
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Configuration LDAP</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                      <span className="text-gray-300">Server</span>
                      <span className="text-blue-400 font-semibold">ldaps://corp.domain.com:636</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-violet-500/10 rounded-lg">
                      <span className="text-gray-300">Base DN</span>
                      <span className="text-violet-400 font-semibold">dc=corp,dc=domain,dc=com</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                      <span className="text-gray-300">Filter</span>
                      <span className="text-cyan-400 font-semibold text-xs">(memberOf=CN=K3s-Users,OU=Groups)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Mappage des Groupes</h4>
                  <div className="space-y-3">
                    {[
                      { ldapGroup: "K3s-Admins", k8sRole: "cluster-admin", permissions: "Tous droits" },
                      { ldapGroup: "K3s-DevOps", k8sRole: "namespace-admin", permissions: "Gestion NS" },
                      { ldapGroup: "K3s-Developers", k8sRole: "pod-reader", permissions: "Lecture pods" },
                      { ldapGroup: "K3s-Users", k8sRole: "self-service", permissions: "DBaaS uniquement" }
                    ].map((mapping, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-400 font-semibold">{mapping.ldapGroup}</span>
                          <span className="text-violet-400">{mapping.k8sRole}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">{mapping.permissions}</div>
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
                <Lock className="h-8 w-8 mr-3" />
                RBAC & Sécurité
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Niveaux d'Autorisation</h4>
                  <div className="space-y-4">
                    {[
                      {
                        level: "Cluster Level",
                        resources: ["Nodes", "Namespaces", "PVs", "StorageClasses"],
                        access: "Admin uniquement"
                      },
                      {
                        level: "Namespace Level", 
                        resources: ["Deployments", "Services", "ConfigMaps", "Secrets"],
                        access: "Owners + DevOps"
                      },
                      {
                        level: "Resource Level",
                        resources: ["Pods", "Logs", "Metrics", "Events"],
                        access: "Lecture étendue"
                      }
                    ].map((level, idx) => (
                      <div key={idx} className="p-4 bg-violet-500/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-violet-400 font-semibold">{level.level}</span>
                          <span className="text-cyan-400 text-sm">{level.access}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {level.resources.map((resource, ridx) => (
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
                  <h4 className="text-xl font-semibold text-white mb-4">Audit & Compliance</h4>
                  <ul className="space-y-3">
                    {[
                      "Logging de toutes les actions utilisateur",
                      "Traçabilité des accès aux ressources sensibles",
                      "Rapports d'audit automatisés",
                      "Alertes sur activités suspectes"
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

export default Slide08_LDAP;