import { ArrowRight } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';
import ArchitectureDiagram from '../components/ArchitectureDiagram';

const Slide05_ArchitectureGlobale = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <FloatingCard>
          <h2 className="text-6xl font-bold mb-8 text-center">
            <GradientText gradient="from-violet-400 via-blue-500 to-cyan-400">
              <TypingText text="Architecture Globale" speed={60} />
            </GradientText>
          </h2>
        </FloatingCard>

        <FloatingCard delay={1500}>
          <ArchitectureDiagram />
        </FloatingCard>

        <FloatingCard delay={2000}>
          <div className="bg-black/20 backdrop-blur-xl rounded-3xl p-10 border border-violet-500/30 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {[
                {
                  layer: "Edge Layer",
                  components: ["Traefik Proxy", "CERT-Manager", "External DNS"],
                  color: "from-cyan-500 to-blue-600",
                  position: "Entrée"
                },
                {
                  layer: "Control Plane", 
                  components: ["K3s Masters", "Etcd Embedded", "API Server"],
                  color: "from-blue-500 to-indigo-600",
                  position: "Orchestration"
                },
                {
                  layer: "Data Plane",
                  components: ["Worker Nodes", "Container Runtime", "CNI Plugin"],
                  color: "from-violet-500 to-purple-600", 
                  position: "Compute"
                },
                {
                  layer: "Storage Layer",
                  components: ["Longhorn CSI", "Distributed Volumes", "Snapshots"],
                  color: "from-purple-500 to-pink-600",
                  position: "Persistance"
                }
              ].map((layer, index) => (
                <div key={index} className="text-center">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${layer.color} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{layer.layer}</h3>
                  <p className="text-sm text-gray-400 mb-3">{layer.position}</p>
                  <ul className="space-y-1">
                    {layer.components.map((comp, idx) => (
                      <li key={idx} className="text-xs text-gray-300">{comp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-violet-500/30 pt-8">
              <h3 className="text-2xl font-semibold text-center text-white mb-8">Flux de Communication</h3>
              <div className="flex justify-center items-center space-x-4 text-lg">
                <span className="text-cyan-400 font-semibold">Client</span>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <span className="text-blue-400 font-semibold">Traefik</span>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <span className="text-violet-400 font-semibold">K3s</span>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <span className="text-purple-400 font-semibold">Pods</span>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <span className="text-pink-400 font-semibold">Storage</span>
              </div>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Slide05_ArchitectureGlobale;