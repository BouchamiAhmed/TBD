import { CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide06_RealisationMetier = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-blue-900 to-violet-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-blue-400 via-violet-500 to-cyan-400">
              <TypingText text="Réalisation Métier" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FloatingCard delay={1500}>
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30 h-full">
              <h3 className="text-3xl font-semibold text-blue-400 mb-6">Interface Utilisateur & API</h3>
              <div className="space-y-6">
                <div className="bg-blue-500/10 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Dashboard Client React</h4>
                  <ul className="space-y-3">
                    {[
                      "Provisioning self-service de bases de données",
                      "Monitoring temps réel des ressources",
                      "Gestion des backups et restaurations", 
                      "Configuration des alertes personnalisées"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-blue-400 mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-violet-500/10 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">API REST + gRPC</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { method: "POST", endpoint: "/api/databases", desc: "Créer DB" },
                      { method: "GET", endpoint: "/api/databases/{id}", desc: "Status DB" },
                      { method: "PUT", endpoint: "/api/databases/{id}/scale", desc: "Scale DB" },
                      { method: "DELETE", endpoint: "/api/databases/{id}", desc: "Supprimer" }
                    ].map((api, idx) => (
                      <div key={idx} className="bg-black/20 rounded-lg p-3">
                        <div className={`text-xs font-bold mb-1 ${
                          api.method === 'GET' ? 'text-green-400' :
                          api.method === 'POST' ? 'text-blue-400' :
                          api.method === 'PUT' ? 'text-yellow-400' : 'text-red-400'
                        }`}>{api.method}</div>
                        <div className="text-xs text-gray-300 mb-1">{api.endpoint}</div>
                        <div className="text-xs text-gray-400">{api.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/30 h-full">
              <h3 className="text-3xl font-semibold text-cyan-400 mb-6">Automatisations Métier</h3>
              <div className="space-y-6">
                <div className="bg-cyan-500/10 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Templates de Bases de Données</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { db: "PostgreSQL", config: "HA + Replication", icon: "🐘" },
                      { db: "MySQL", config: "Cluster InnoDB", icon: "🐬" },
                      { db: "MongoDB", config: "Replica Set", icon: "🍃" },
                      { db: "Redis", config: "Sentinel + Cluster", icon: "🔴" }
                    ].map((template, idx) => (
                      <div key={idx} className="bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">{template.icon}</div>
                        <div className="text-white font-semibold text-sm">{template.db}</div>
                        <div className="text-gray-400 text-xs mt-1">{template.config}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-violet-500/10 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-white mb-4">Workflow Automatisé</h4>
                  <div className="space-y-4">
                    {[
                      {
                        trigger: "Demande DB",
                        steps: "Validation → Provisioning → Configuration → Tests → Livraison",
                        time: "45s"
                      },
                      {
                        trigger: "Pic de charge",
                        steps: "Détection → Analyse → Scale → Vérification → Notification",
                        time: "20s"
                      }
                    ].map((workflow, idx) => (
                      <div key={idx} className="bg-black/20 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">{workflow.trigger}</span>
                          <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                            {workflow.time}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{workflow.steps}</p>
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

export default Slide06_RealisationMetier;