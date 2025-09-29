import { CheckCircle } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import TypingText from '../components/TypingText';
import GradientText from '../components/GradientText';

const Slide01_Contexte = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-violet-900 to-blue-900">
      <div className="max-w-7xl w-full relative z-10">
        <div className="text-center relative">
          <FloatingCard>
            <h1 className="text-7xl font-bold mb-8">
              <GradientText gradient="from-cyan-400 via-blue-500 to-violet-600">
                <TypingText text="Plateforme K3s DBaaS Enterprise" speed={80} />
              </GradientText>
            </h1>
          </FloatingCard>
          
          <FloatingCard delay={2500}>
            <p className="text-3xl text-gray-300 mb-12">
              <TypingText 
                text="Architecture Cloud-Native pour Gestion de Bases de Données à Grande Échelle" 
                speed={50} 
                delay={3000}
              />
            </p>
          </FloatingCard>
          
          <FloatingCard delay={6000}>
            <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-10 border border-violet-500/30">
              <h2 className="text-2xl font-semibold text-white mb-6">Contexte du Projet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h3 className="text-xl font-semibold text-cyan-400 mb-4">Problématique</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      Gestion manuelle complexe des bases de données
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      Manque de scalabilité et haute disponibilité
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      Sécurité et isolation insuffisantes
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-violet-400 mb-4">Objectifs</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                      Automatisation complète du provisioning
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                      Architecture hautement disponible
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                      Sécurité multicouche enterprise
                    </li>
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

export default Slide01_Contexte;