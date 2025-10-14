import { Slide } from '../types';

export const PRESENTATION_FONT = {
  primary: "'Brockmann', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  heading: "'Brockmann', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
};

export const presentationSlides: Slide[] = [
  // ==================== INTRO ====================
  {
    id: 0,
    type: 'title',
    title: 'Plateforme K3s DBaaS Enterprise',
    subtitle: 'Database as a Service - Cloud-Native & Kubernetes',
  },

  // ==================== SECTION 1: INTRODUCTION ====================
  {
    id: 1,
    type: 'title',
    title: '1️⃣ INTRODUCTION',
    subtitle: 'Contexte général & Cadre du projet',
  },
  {
    id: 2,
    type: 'content',
    title: 'Contexte Général',
    content: 'La transformation digitale impose de nouvelles exigences pour les infrastructures de données.',
    points: [
      'Explosion des volumes de données et besoins de scalabilité',
      'Migration vers le cloud et architectures hybrides',
      'Besoin d\'automatisation et de self-service',
      'Exigences accrues de sécurité et conformité',
      'Réduction des coûts opérationnels',
      'Time-to-market réduit pour les nouveaux services'
    ]
  },
  {
    id: 3,
    type: 'content',
    title: 'Plan de Présentation',
    points: [
      '📌 Section 1: Introduction & Contexte',
      '🎯 Section 2: Cadre du Projet & Problématique',
      '📋 Section 3: Spécification des Besoins',
      '🏗️ Section 4: Conception & Architecture',
      '⚙️ Section 5: Implémentation Technique',
      '🏁 Section 6: Conclusion & Perspectives'
    ]
  },

  // ==================== SECTION 2: CADRE DU PROJET ====================
  {
    id: 4,
    type: 'title',
    title: '2️⃣ CADRE DU PROJET',
    subtitle: 'Contexte, Problématique & Solution',
  },
  {
    id: 5,
    type: 'image',
    title: 'Présentation NEXTSTEP',
    subtitle: 'Leader tunisien en solutions IT depuis 2012',
    image: '/images/nextstep-logo.png',
    points: [
      '🏢 Fondée en 2012, +1800 projets réalisés',
      '🌍 Secteurs: Banque, Santé, Télécom, Pétrole',
      '🏆 Certifications ISO-9001 & ISO-27001',
      '👥 Équipe d\'experts certifiés Cloud & DevOps',
      '💡 Innovation: IA, Cloud-Native, Automatisation',
      '📍 Bureaux: Tunis, Paris (expansion EMEA)'
    ]
  },
  {
    id: 6,
    type: 'content',
    title: 'Contexte du Projet',
    content: 'Infrastructure traditionnelle de bases de données avec limitations critiques.',
    points: [
      'Provisioning manuel: 2-5 heures par instance',
      'Pas de haute disponibilité native',
      'Sécurité et isolation insuffisantes',
      'Monitoring basique sans alerting proactif',
      'Pas de standardisation des déploiements',
      'Coûts opérationnels élevés (DevOps overhead)'
    ]
  },
  {
    id: 7,
    type: 'content',
    title: 'Étude de l\'Existant',
    content: 'Analyse comparative des solutions d\'orchestration.',
    points: [
      '🔵 Amazon RDS: service pour bases relationnelles',
      '🔵 Google Cloud SQL: solution managée pour MySQL/PostgreSQL/SQL Server',
      '⚠️ Coûts élevés pour usage intensif ',
      '⚠️ Vendor lock-in',
      '⚠️ Manque de flexibilité de configuration',
    ]
  },
  {
    id: 8,
    type: 'content',
    title: 'Solution Proposée',
    content: 'Plateforme DBaaS cloud-native avec automatisation complète.',
    points: [
      'K3s Cluster HA: Multi-master avec etcd embarqué',
      'Traefik: SSL auto + load balancing intelligent',
      'Longhorn: Stockage distribué + réplication',
      'Prometheus Stack: Monitoring + alerting',
      'LDAP/RBAC/SSL: Authentification centralisée',
      'CI/CD: Jenkins + ArgoCD GitOps'
    ]
  },

  // ==================== SECTION 3: SPÉCIFICATION ====================
  {
    id: 9,
    type: 'title',
    title: '3️⃣ SPÉCIFICATION DES BESOINS',
    subtitle: 'Besoins fonctionnels & Use Cases',
  },
  {
    id: 10,
    type: 'content',
    title: 'Besoins Fonctionnels',
    content: 'Fonctionnalités clés de la plateforme DBaaS.',
    points: [
      '✅ Provisioning automatique de BDD (PostgreSQL, MySQL)',
      '✅ Gestion du cycle de vie: Create, Update, Delete, Scale',
      '✅ Backup automatique et restauration point-in-time',
      '✅ Monitoring temps réel et alerting',
      '✅ Multi-tenancy avec isolation forte',
      '✅ Self-service portal pour développeurs'
    ]
  },
  {
    id: 11,
    type: 'content',
    title: 'Besoins Non-Fonctionnels',
    content: 'Exigences de performance, sécurité et disponibilité.',
    points: [
      '⚡ Performance: Provisioning < 60s',
      '🔒 Sécurité: LDAP, RBAC, Network Policies',
      '📈 Scalabilité: Support 100+ instances',
      '🛡️ Disponibilité: SLA 99.95% uptime',
      '🔍 Observabilité: Logs, Metrics, Traces',
      '💰 Coûts: Réduction 35% vs infra classique'
    ]
  },
  {
    id: 12,
    type: 'content',
    title: 'Acteurs du Système',
    content: 'Trois types d\'utilisateurs avec permissions distinctes.',
    points: [
      '👤 Client Externe: Consommateur de BDD (packOffer)',
      '👨‍💼 Client Interne:  Consommateur de BDD (pay as you go)',
      '👨‍💻 Administrateur: Gestion plateforme (Intervantion + UI)',
      'Permissions: Cluster Admin > Namespace Admin',
    ]
  },

  {
    id: 14,
    type: 'content',
    title: 'Méthodologie SCRUM',
    content: 'Approche agile avec sprints de 2 semaines.',
    points: [
      'Sprint 0: Planification générale (2 semaines)',
      'Sprint 1: Infrastructure K3s HA (2 semaines)',
      'Sprint 2: Stockage Longhorn + Backup (2 semaines)',
      'Sprint 3: LDAP & Sécurité (2 semaines)',
      'Sprint 4: Monitoring & Alerting (2 semaines)',
      'Sprint 5: CI/CD Pipeline (2 semaines)'
    ]
  },

  // ==================== SECTION 4: CONCEPTION ====================
  {
    id: 15,
    type: 'title',
    title: '4️⃣ CONCEPTION',
    subtitle: 'Architecture & Modélisation',
  },
    {
    id: 90,
    type: 'image',
    title: '3.1. Diagramme de cas d\'utilisation globale',
    content: 'Vue d\'ensemble des interactions utilisateur-système',
    image: '/diagrams/use-case-diagram.png',
    points: [
    ]
  },
  {
    id: 16,
    type: 'image',
    title: 'Architecture Physique & Logique',
    subtitle: 'Cluster K3s HA avec monitoring et microservices',
    image: '/diagrams/physical-architecture.png',
    content: 'Architecture en haute disponibilité avec 3 masters et 2 workers pour garantir la résilience.',
  },
  {
    id: 17,
    type: 'image',
    title: 'Architecture Logique Complète',
    subtitle: 'DBaaS sur K3S avec services de plateforme',
    image: '/diagrams/logical-architecture.png',
    content: 'Architecture complète montrant l\'intégration des services: Cluster K3s, Monitoring, CI/CD, et Application DBaaS.',
  },
  {
    id: 18,
    type: 'image',
    title: 'Diagramme d\'Artefacts & Déploiement',
    subtitle: 'Organisation des composants et déploiement',
    image: '/diagrams/artifact-diagram.png',
    content: 'Vue des artefacts logiciels et leur déploiement sur l\'infrastructure Kubernetes.',
  },
  {
    id: 19,
    type: 'image',
    title: 'Diagramme de Séquence: Authentification',
    subtitle: 'Flux d\'authentification utilisateur avec LDAP',
    image: '/diagrams/sequence-auth.png',
    content: 'Processus complet d\'authentification: validation, vérification LDAP, et provisioning namespace.',
  },
  {
    id: 20,
    type: 'image',
    title: 'Diagramme de Séquence: Création BDD',
    subtitle: 'Flux de provisioning automatique de base de données',
    image: '/diagrams/sequence-create-db.png',
    content: 'Workflow automatisé: validation, déploiement K8s, configuration, et exposition via Traefik.',
  },

  // ==================== SECTION 5: IMPLÉMENTATION ====================
  {
    id: 21,
    type: 'title',
    title: '5️⃣ IMPLÉMENTATION',
    subtitle: 'Technologies & Réalisation technique',
  },

    {
  id: 22,
  type: 'content',
  title: 'Stack Technologique',
  content: 'Technologies cloud-native utilisées pour la plateforme DBaaS Enterprise',
  points: []
   },
  {
    id: 23,
    type: 'content',
    title: 'K3s Embedded Etcd & HA',
    content: 'Configuration multi-master avec consensus Raft.',
    points: [
      'Configuration 3 masters avec etcd embarqué',
      'Élection automatique du leader < 10s',
      'Basculement automatique (panne < 30s)',
      'Snapshots automatiques du cluster state',
      'Health checks: API (10s), Etcd (5s), Kubelet (10s)',
      'Recovery automatique avec auto-healing'
    ]
  },
  {
    id: 24,
    type: 'content',
    title: 'LDAP & Contrôle d\'Accès',
    content: 'Authentification centralisée avec RBAC granulaire.',
    points: [
      'Authentification LDAP avec SSl/TLS',
      'Mapping groupes LDAP → Rôles K8s RBAC',
      'Isolation multi-tenant: Admin, DevOps, Developer',
      'Autorisation 3 niveaux: Cluster, Namespace, Resource',
      'Audit logging de toutes actions utilisateur',
      'Alertes automatiques sur activités suspectes'
    ]
  },
  {
    id: 25,
    type: 'content',
    title: 'Traefik Load Balancing',
    content: 'Proxy inverse cloud-native avec découverte auto.',
    points: [
      'Découverte automatique des services K8s',
      'SSL/TLS automatique avec Let\'s Encrypt',
      'Load balancing: Round-robin, Weighted',
      'Circuit breaker & rate limiting',
      'Headers middleware: CORS, Security headers',
      'Métriques Prometheus intégrées'
    ]
  },
  {
    id: 26,
    type: 'content',
    title: 'Middlewares Traefik de Sécurité',
    content: 'Couches de protection multi-niveaux.',
    points: [
      'Network Policies: Isolation trafic pod-to-pod',
      'PodSecurityPolicies: Contraintes runtime',
      'Rate Limiting: 100 req/s par IP',
      'Secret Management: Vault integration',
      'Séparation par URL/URI',
      'Regex Validation: Noms ressources K8s'
    ]
  },
  {
    id: 27,
    type: 'content',
    title: 'Isolation Multi-Tenant',
    content: 'Séparation forte entre clients et environnements.',
    points: [
      'Namespaces K8s: Isolation logique',
      'Resource Quotas: CPU, Memory, Storage limits',
      'Network Policies: Zero-trust networking',
      'RBAC: Permissions par namespace',
      'Pod Security: runAsNonRoot, readOnlyRootFS',
      'Audit: Logging séparé par tenant'
    ]
  },
  {
    id: 28,
    type: 'content',
    title: 'GRPC Admin/servicetoservice API',
    content: 'API haute performance pour opérations critiques.',
    points: [
      'GRPC vs REST: 7x plus rapide',
      'Protobuf: Sérialisation binaire efficace',
      'Streaming bidirectionnel pour logs temps réel',
      'Network: HTTP/2 avec multiplexage isolée',
      'Opérations: CreateDB, DeleteDB, Backup, Restore',
      'Monitoring: Latence p50 < 10ms, p99 < 50ms'
    ]
  },
  {
    id: 29,
    type: 'content',
    title: 'Platform Engineering',
    content: 'Infrastructure as Code et self-service.',
    points: [
      'Backup.yaml: Provisioning infra cloud',
      'Helm Charts: Packaging applications K8s',
      'Operators: Automation logique métier',
      'GitOps: ArgoCD pour déploiements',
    ]
  },
  {
    id: 30,
    type: 'content',
    title: 'Surveillance & Monitoring',
    content: 'Observabilité complète de la plateforme.',
    points: [
      'Prometheus: Collecte métriques (15s scrape)',
      'Grafana: 20+ dashboards temps réel',
      'AlertManager: Routing (email, Slack, PagerDuty)',
      'SLOs: Uptime 99.95%, Latency p99 < 100ms'
    ]
  },
  {
    id: 31,
    type: 'content',
    title: 'Longhorn Storage',
    content: 'Stockage distribué cloud-native avec HA.',
    points: [
      'Réplication 3 copies sur nodes différents',
      'Snapshots automatiques: Quotidien + Hebdo',
    ]
  },
  {
    id: 32,
    type: 'content',
    title: 'CI/CD Pipeline',
    content: 'Automatisation complète du déploiement.',
    points: [
      'Jenkins: Build, Test, Package (< 5 min)',
      'ArgoCD: GitOps deployment automatique',
      'Helm: Versioning applications (semantic)'
    ]
  },

  // ==================== SECTION 6: CONCLUSION ====================
  {
    id: 33,
    type: 'title',
    title: '6️⃣ CONCLUSION',
    subtitle: 'Résultats & Perspectives',
  },
  {
    id: 34,
    type: 'stats',
    title: 'Résultats & Métriques',
    stats: [
      { label: 'Provisioning', value: '< 60s', change: '-95% vs manuel' },
      { label: 'Disponibilité', value: '99.95%', change: '+4.95% SLA' },
      { label: 'Réduction Coûts', value: '35%', change: 'vs infra classique' },
    ]
  },
  {
    id: 35,
    type: 'content',
    title: 'Conclusion',
    content: 'Objectifs atteints et valeur apportée.',
    points: [
      '✅ Plateforme DBaaS production-ready',
      '✅ Automatisation complète du provisioning',
      '✅ Architecture HA et résiliente',
      '✅ Sécurité multi-couche enterprise',
      '✅ Monitoring et observabilité avancés',
      '✅ ROI positif en 6 mois'
    ]
  },
  {
    id: 36,
    type: 'content',
    title: 'Perspectives d\'Évolution',
    content: 'Roadmap et améliorations futures.',
    points: [
      '🔜 Court terme: Support MongoDB, Redis',
      '📱 Moyen terme: Application mobile',
      '🤖 Long terme: ML pour sizing automatique',
      '🌍 Multi-cloud: AWS, Azure, GCP',
      '🔗 Service Mesh: Istio pour mTLS',
      '📊 FinOps: Cost optimization ML-driven'
    ]
  },
  {
    id: 37,
    type: 'closing',
    title: 'Merci de votre attention',
    subtitle: 'Questions & Discussion',
  },
];