import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide02_EtudeExistant = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-blue-900 to-violet-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-12 text-center">
            <GradientText gradient="from-blue-400 via-violet-500 to-cyan-400">
              <TypingText text="Étude de l'Existant" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FloatingCard delay={1500}>
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30">
              <h3 className="text-3xl font-semibold text-red-300 mb-6 flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                Limites des Solutions Actuelles
              </h3>
              <div className="space-y-6">
                {[
                  {
                    title: "Gestion Manuelle",
                    issues: ["Provisioning lent (2-5 heures)", "Configuration manuelle sujette aux erreurs", "Pas de standardisation"]
                  },
                  {
                    title: "Scalabilité Limitée", 
                    issues: ["Montée en charge complexe", "Pas d'auto-scaling", "Ressources statiques"]
                  },
                  {
                    title: "Sécurité Basique",
                    issues: ["Authentification simple", "Pas d'isolation réseau", "Audit limité"]
                  },
                  {
                    title: "Monitoring Insuffisant",
                    issues: ["Métriques basiques", "Pas d'alerting proactif", "Logs dispersés"]
                  }
                ].map((category, index) => (
                  <div key={index} className="bg-black/20 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">{category.title}</h4>
                    <ul className="space-y-2">
                      {category.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-center text-gray-300 text-sm">
                          <div className="w-1 h-1 bg-red-400 rounded-full mr-2"></div>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1800}>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
              <h3 className="text-3xl font-semibold text-blue-300 mb-6 flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                Analyse Technique
              </h3>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-cyan-400 mb-4">Technologies Étudiées</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { tech: "Docker Compose", score: "60%", issues: "Pas de HA native" },
                      { tech: "Docker Swarm", score: "70%", issues: "Écosystème limité" },
                      { tech: "Kubernetes", score: "85%", issues: "Complexité élevée" },
                      { tech: "K3s", score: "95%", issues: "Parfait pour notre cas" }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-violet-500/10 rounded-lg p-3">
                        <div className="text-white font-semibold">{item.tech}</div>
                        <div className="text-cyan-400 text-sm">{item.score}</div>
                        <div className="text-gray-400 text-xs mt-1">{item.issues}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-violet-400 mb-4">Choix Architectural</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Orchestration</span>
                      <span className="text-cyan-400 font-semibold">K3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Proxy/LB</span>
                      <span className="text-violet-400 font-semibold">Traefik</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Stockage</span>
                      <span className="text-blue-400 font-semibold">Longhorn</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Monitoring</span>
                      <span className="text-green-400 font-semibold">Prometheus</span>
                    </div>
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

export default Slide02_EtudeExistant;