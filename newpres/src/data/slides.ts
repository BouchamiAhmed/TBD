import { Slide } from '../types';

// Global font configuration - Using local Brockmann font from public/fonts
export const PRESENTATION_FONT = {
  primary: "'Brockmann', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  heading: "'Brockmann', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
};

export const presentationSlides: Slide[] = [
  {
    id: 1,
    type: 'title',
    title: 'Plateforme K3s DBaaS Enterprise',
    subtitle: 'Architecture Cloud-Native pour Gestion de Bases de Données à Grande Échelle',
  },
  {
    id: 2,
    type: 'content',
    title: 'Contexte & Problématique',
    content: 'Les infrastructures traditionnelles de bases de données présentent des limitations majeures en termes d\'automatisation, scalabilité et sécurité.',
    points: [
      'Gestion manuelle complexe avec provisioning de 2-5 heures',
      'Absence de scalabilité automatique et haute disponibilité',
      'Sécurité et isolation insuffisantes entre tenants',
      'Monitoring basique sans alerting proactif',
      'Manque de standardisation et reproductibilité',
      'Coûts opérationnels élevés et time-to-market lent'
    ]
  },
  {
    id: 3,
    type: 'content',
    title: 'Étude de l\'Existant',
    content: 'Analyse comparative des solutions d\'orchestration et limitations identifiées.',
    points: [
      'Docker Compose: Pas de haute disponibilité native (60% adapté)',
      'Docker Swarm: Écosystème limité et peu d\'évolution (70%)',
      'Kubernetes: Complexité élevée pour notre cas d\'usage (85%)',
      'K3s: Solution optimale - léger, HA native, production-ready (95%)',
      'Choix architectural: K3s + Traefik + Longhorn + Prometheus',
      'Réduction de 40% de la complexité vs Kubernetes standard'
    ]
  },
  {
    id: 4,
    type: 'content',
    title: 'Solution Proposée',
    content: 'Architecture cloud-native complète basée sur K3s avec haute disponibilité.',
    points: [
      'K3s Cluster HA: Multi-master avec etcd embarqué',
      'Traefik Edge Router: SSL automatique et load balancing intelligent',
      'Longhorn Storage: Stockage distribué avec réplication et snapshots',
      'Prometheus Stack: Monitoring complet et alerting proactif',
      'CERT-Manager: Gestion automatique des certificats SSL/TLS',
      'Architecture 100% déclarative avec GitOps'
    ]
  },
  {
    id: 5,
    type: 'content',
    title: 'Architecture Globale',
    content: 'Architecture en couches pour séparation des responsabilités et scalabilité.',
    points: [
      'Edge Layer: Traefik + CERT-Manager pour l\'accès externe sécurisé',
      'Control Plane: K3s Masters avec etcd embarqué pour l\'orchestration',
      'Data Plane: Worker nodes avec container runtime et CNI plugin',
      'Storage Layer: Longhorn CSI avec volumes distribués et snapshots',
      'Observability: Prometheus, Grafana, AlertManager pour le monitoring',
      'CI/CD: Jenkins + ArgoCD pour le déploiement automatisé'
    ]
  },
  {
    id: 6,
    type: 'stats',
    title: 'Résultats & Performance',
    stats: [
      { label: 'Provisioning Time', value: '< 60s', change: '-95% vs manuel' },
      { label: 'Disponibilité', value: '99.95%', change: '+4.95% SLA' },
      { label: 'Réduction Coûts', value: '35%', change: 'vs infra traditionnelle' },
    ]
  },
  {
    id: 7,
    type: 'content',
    title: 'K3s Embedded Etcd & Haute Disponibilité',
    content: 'Configuration multi-master avec consensus Raft pour la résilience.',
    points: [
      'Configuration 3 masters avec etcd embarqué (pas de dépendance externe)',
      'Élection automatique du leader en moins de 10 secondes',
      'Basculement automatique avec détection de panne < 30s',
      'Sauvegarde intégrée du cluster state avec snapshots automatiques',
      'Health checks continus: API Server (10s), Etcd (5s), Kubelet (10s)',
      'Recovery automatique avec auto-healing des composants'
    ]
  },
  {
    id: 8,
    type: 'content',
    title: 'Contrôle d\'Accès LDAP & RBAC',
    content: 'Intégration LDAP/Active Directory avec autorisation fine par namespace.',
    points: [
      'Authentification centralisée via LDAP/AD avec SSL (ldaps://)',
      'Mappage automatique groupes LDAP → rôles Kubernetes RBAC',
      'Isolation multi-tenant: K3s-Admins, K3s-DevOps, K3s-Developers',
      'Autorisation à 3 niveaux: Cluster, Namespace, Resource',
      'Audit logging complet de toutes les actions utilisateur',
      'Alertes automatiques sur activités suspectes'
    ]
  },
  {
    id: 9,
    type: 'content',
    title: 'Traefik Load Balancing & Edge Router',
    content: 'Proxy inverse cloud-native avec découverte automatique et SSL.',
    points: [
      'Points d\'entrée multiples: HTTP (80), HTTPS (443), gRPC (9090)',
      'Découverte automatique via annotations Kubernetes et CRDs',
      'Algorithmes LB: Round Robin, Weighted RR, Least Connections, IP Hash',
      'Circuit breaker avec états: CLOSED, OPEN, HALF-OPEN',
      'TLS 1.2/1.3 avec cipher suites modernes et HSTS',
      'Let\'s Encrypt intégré avec renouvellement automatique'
    ]
  },
  {
    id: 10,
    type: 'content',
    title: 'Middlewares & IngressRoutes',
    content: 'Pipeline de traitement des requêtes avec middlewares chaînés.',
    points: [
      'Rate Limiting: 100 req/min par IP avec burst à 200',
      'Authentication: Validation JWT/LDAP obligatoire sur API',
      'CORS: Headers cross-origin avec mode strict',
      'Compression: Gzip niveau 6 pour optimisation bande passante',
      'Security Headers: HSTS, CSP, X-Frame-Options, X-XSS-Protection',
      'Custom middlewares: db-auth, tenant-isolation, api-versioning'
    ]
  },
  {
    id: 11,
    type: 'content',
    title: 'Isolation & CERT-Manager',
    content: 'Isolation multi-tenant avec gestion automatique des certificats PKI.',
    points: [
      'Namespaces strategy: dbaas-{client}-{env} avec isolation réseau',
      'Resource quotas par tenant: CPU, Memory, Storage, Pods',
      'Certificate issuers: Let\'s Encrypt (ACME), CA interne, Vault PKI',
      'Lifecycle automatique: Request → Challenge → Issue → Deploy (45s)',
      'Network policies pour isolation L3/L4 entre namespaces',
      'Renouvellement automatique 30 jours avant expiration'
    ]
  },
  {
    id: 12,
    type: 'content',
    title: 'Backdoor gRPC & Contrôle Total',
    content: 'Interface d\'administration gRPC pour opérations avancées et urgences.',
    points: [
      'Services gRPC: ClusterManager, DatabaseOperator, TenantManager',
      'Méthodes exposées: CreateDB, ScaleDB, BackupDB, DrainNode, CordonNode',
      'CLI tool k3s-admin pour opérations depuis terminal',
      'Accès d\'urgence: Direct etcd, Unix socket local, Emergency token',
      'Security: Authentification certificate + RBAC + audit logging',
      'Désactivation automatique après résolution incident'
    ]
  },
  {
    id: 13,
    type: 'content',
    title: 'Platform Engineering & Stack',
    content: 'Microservices Go + Frontend React pour expérience développeur optimale.',
    points: [
      'Backend TBDback (Go): API REST, LDAP Auth, PostgreSQL, K8s Client',
      'Admin Microservice: gRPC Server, Namespace Management, Monitoring',
      'Client Microservice: Self-service API, User Isolation, Quotas',
      'Frontend React: Dashboard, Authentication LDAP, Database Manager',
      'Architecture en couches: UI → API Gateway → Business Logic → Infra',
      'Patterns: Event-driven, Circuit breaker, Multi-tenancy, GitOps'
    ]
  },
  {
    id: 14,
    type: 'content',
    title: 'Surveillance Prometheus & Alerting',
    content: 'Stack de monitoring complet avec métriques temps réel et SLA tracking.',
    points: [
      'Composants: Prometheus, Grafana, AlertManager, Node Exporter',
      'Métriques clés: CPU (65%), Memory (78%), Storage IOPS (2.3k)',
      'Règles d\'alerting: HighCPUUsage, PodCrashLooping, StorageLow',
      'SLA objectives: Availability 99.9%, Response < 100ms, Recovery < 5min',
      'Dashboards: Cluster overview, Application metrics, Node health',
      'Alerting proactif avec notifications Slack/Email/PagerDuty'
    ]
  },
  {
    id: 15,
    type: 'content',
    title: 'Longhorn Stockage Distribué',
    content: 'Solution de stockage cloud-native avec réplication et disaster recovery.',
    points: [
      'Architecture: Manager, Engine, UI Dashboard, CSI Driver DaemonSet',
      'Performances: 15k IOPS, 2ms latency, 500MB/s throughput',
      'Stratégies backup: Snapshots 6h (7j), S3 daily (30j), Incrémental',
      'Recovery: RTO < 5min snapshots, < 30min backup S3',
      'Disaster recovery: Point-in-time restore, Cross-region backup',
      'Encryption at rest et in transit avec rotation automatique'
    ]
  },
  {
    id: 16,
    type: 'content',
    title: 'CI/CD Pipeline Jenkins & ArgoCD',
    content: 'Pipeline automatisé avec GitOps pour déploiements zero-downtime.',
    points: [
      'Jenkins stages: Build (2min), Test (5min), Package (3min), Deploy (2min)',
      'Tests: Unitaires, Intégration, Sécurité scan, Code coverage 94%',
      'ArgoCD GitOps: Git = Source of truth, Sync automatique, Rollback auto',
      'Stratégies: Blue/Green, Canary, Rolling Update selon criticité',
      'Métriques DevOps: 97.5% success, 12 deploys/jour, Lead time 15min',
      'MTTR 8min avec détection automatique et rollback'
    ]
  },
  {
    id: 17,
    type: 'stats',
    title: 'Gains & Amélioration Continue',
    stats: [
      { label: 'Time to Market', value: '-92%', change: '2 semaines → 1 jour' },
      { label: 'Coûts Infra', value: '-35%', change: 'vs infrastructure traditionnelle' },
      { label: 'Deploy Frequency', value: '12/jour', change: 'vs 1/semaine avant' },
    ]
  },
  {
    id: 18,
    type: 'closing',
    title: 'Merci de votre attention',
    subtitle: 'Platform K3s DBaaS - Une révolution dans la gestion des bases de données',
  }
];