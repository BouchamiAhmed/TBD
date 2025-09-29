const UseCaseDiagram = () => {
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-300">
      <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">Diagramme de Cas d'Usage</h4>
      <svg viewBox="0 0 600 400" className="w-full h-64">
        {/* Acteurs */}
        <g>
          <circle cx="50" cy="80" r="15" fill="#3b82f6" />
          <line x1="50" y1="95" x2="50" y2="130" stroke="#3b82f6" strokeWidth="2" />
          <line x1="35" y1="110" x2="65" y2="110" stroke="#3b82f6" strokeWidth="2" />
          <line x1="50" y1="130" x2="35" y2="155" stroke="#3b82f6" strokeWidth="2" />
          <line x1="50" y1="130" x2="65" y2="155" stroke="#3b82f6" strokeWidth="2" />
          <text x="15" y="175" fontSize="12" fill="#3b82f6" fontWeight="bold">Client interne</text>
        </g>
        
        <g>
          <circle cx="50" cy="220" r="15" fill="#10b981" />
          <line x1="50" y1="235" x2="50" y2="270" stroke="#10b981" strokeWidth="2" />
          <line x1="35" y1="250" x2="65" y2="250" stroke="#10b981" strokeWidth="2" />
          <line x1="50" y1="270" x2="35" y2="295" stroke="#10b981" strokeWidth="2" />
          <line x1="50" y1="270" x2="65" y2="295" stroke="#10b981" strokeWidth="2" />
          <text x="15" y="315" fontSize="12" fill="#10b981" fontWeight="bold">Client externe</text>
        </g>

        <g>
          <circle cx="50" cy="350" r="15" fill="#f59e0b" />
          <line x1="50" y1="365" x2="50" y2="400" stroke="#f59e0b" strokeWidth="2" />
          <line x1="35" y1="380" x2="65" y2="380" stroke="#f59e0b" strokeWidth="2" />
          <text x="5" y="420" fontSize="12" fill="#f59e0b" fontWeight="bold">Administrateur</text>
        </g>

        {/* Use Cases */}
        <ellipse cx="200" cy="60" rx="60" ry="25" fill="#e0f2fe" stroke="#0891b2" strokeWidth="2" />
        <text x="180" y="55" fontSize="10" fill="#0891b2">Créer un</text>
        <text x="185" y="68" fontSize="10" fill="#0891b2">compte</text>

        <ellipse cx="200" cy="120" rx="60" ry="25" fill="#e0f2fe" stroke="#0891b2" strokeWidth="2" />
        <text x="170" y="115" fontSize="10" fill="#0891b2">Gérer base de</text>
        <text x="180" y="128" fontSize="10" fill="#0891b2">données</text>

        <ellipse cx="200" cy="180" rx="60" ry="25" fill="#e0f2fe" stroke="#0891b2" strokeWidth="2" />
        <text x="165" y="175" fontSize="10" fill="#0891b2">Surveiller base de</text>
        <text x="180" y="188" fontSize="10" fill="#0891b2">données</text>

        <ellipse cx="200" cy="240" rx="60" ry="25" fill="#e0f2fe" stroke="#0891b2" strokeWidth="2" />
        <text x="165" y="235" fontSize="10" fill="#0891b2">Facturer ses</text>
        <text x="185" y="248" fontSize="10" fill="#0891b2">bases</text>

        <ellipse cx="200" cy="300" rx="60" ry="25" fill="#e0f2fe" stroke="#0891b2" strokeWidth="2" />
        <text x="175" y="295" fontSize="10" fill="#0891b2">Gérer les</text>
        <text x="185" y="308" fontSize="10" fill="#0891b2">bases</text>

        <ellipse cx="200" cy="360" rx="60" ry="25" fill="#e0f2fe" stroke="#0891b2" strokeWidth="2" />
        <text x="175" y="355" fontSize="10" fill="#0891b2">Gérer les</text>
        <text x="180" y="368" fontSize="10" fill="#0891b2">comptes</text>

        {/* S'authentifier */}
        <ellipse cx="430" cy="200" rx="70" ry="30" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <text x="410" y="205" fontSize="12" fill="#f59e0b" fontWeight="bold">S'authentifier</text>

        {/* Relations */}
        <line x1="110" y1="80" x2="140" y2="60" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="110" y1="120" x2="140" y2="120" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="110" y1="140" x2="140" y2="180" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
        
        <line x1="110" y1="240" x2="140" y2="240" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
        
        <line x1="110" y1="360" x2="140" y2="300" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="110" y1="370" x2="140" y2="360" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />

        {/* Include relations vers s'authentifier */}
        <line x1="260" y1="120" x2="360" y2="190" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="260" y1="180" x2="360" y2="200" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="260" y1="240" x2="360" y2="210" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="260" y1="300" x2="360" y2="215" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />

        {/* Labels include */}
        <text x="300" y="150" fontSize="8" fill="#ef4444">include</text>
        <text x="300" y="190" fontSize="8" fill="#ef4444">include</text>
        <text x="300" y="225" fontSize="8" fill="#ef4444">include</text>
        <text x="300" y="260" fontSize="8" fill="#ef4444">include</text>
      </svg>
    </div>
  );
};

export default UseCaseDiagram;