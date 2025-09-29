import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserTelemetryInterface = () => {
    const [metrics, setMetrics] = useState({
        // User Database Metrics
        totalDatabases: 4,
        activeDatabases: 3,
        inactiveDatabases: 1,
        
        // Request Metrics
        totalRequests: 12847,
        requestsToday: 234,
        requestsThisMonth: 8932,
        
        // Cost Metrics (0.05 DT per request)
        costPerRequest: 0.05,
        costToday: 0,
        costThisMonth: 0,
        totalCost: 0,
        
        // Storage Metrics
        totalStorage: 2.4, // GB
        storageUsed: 1.8,
        storageAvailable: 0.6,
        
        // Performance Metrics
        avgResponseTime: 145,
        successRate: 99.2,
        lastBackup: '2025-01-18 14:30:00'
    });

    const [currentUser] = useState({
        username: 'foufou',
        plan: 'Interne',
        joinDate: '2024-06-15'
    });

    // Calculate costs based on requests
    useEffect(() => {
        setMetrics(prev => ({
            ...prev,
            costToday: (prev.requestsToday * prev.costPerRequest).toFixed(3),
            costThisMonth: (prev.requestsThisMonth * prev.costPerRequest).toFixed(2),
            totalCost: (prev.totalRequests * prev.costPerRequest).toFixed(2)
        }));
    }, []);

    // Simulate real-time updates (less frequent for user view)
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => {
                const newRequestsToday = prev.requestsToday + Math.floor(Math.random() * 3);
                const newRequestsThisMonth = prev.requestsThisMonth + Math.floor(Math.random() * 3);
                const newTotalRequests = prev.totalRequests + Math.floor(Math.random() * 3);
                
                return {
                    ...prev,
                    totalRequests: newTotalRequests,
                    requestsToday: newRequestsToday,
                    requestsThisMonth: newRequestsThisMonth,
                    costToday: (newRequestsToday * prev.costPerRequest).toFixed(3),
                    costThisMonth: (newRequestsThisMonth * prev.costPerRequest).toFixed(2),
                    totalCost: (newTotalRequests * prev.costPerRequest).toFixed(2),
                    avgResponseTime: Math.floor(120 + Math.random() * 50),
                    successRate: (98.5 + Math.random() * 1.5).toFixed(1),
                    storageUsed: (1.5 + Math.random() * 0.6).toFixed(1)
                };
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const UserMetricCard = ({ title, value, unit, icon, color, subtitle, trend }) => (
        <div className="col-lg-3 col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid var(--bs-${color})` }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h6 className="text-muted mb-2 fw-semibold">{title}</h6>
                            <h2 className={`fw-bold mb-1 text-${color}`}>
                                {value}
                                {unit && <small className="text-muted ms-1 fs-6">{unit}</small>}
                            </h2>
                            {subtitle && <small className="text-muted">{subtitle}</small>}
                        </div>
                        <div className={`text-${color} opacity-75`}>
                            <i className={`fas ${icon} fa-2x`}></i>
                        </div>
                    </div>
                    {trend && (
                        <div className="d-flex align-items-center mt-2">
                            <i className={`fas fa-arrow-${trend.direction} me-2 text-${trend.color} small`}></i>
                            <small className={`text-${trend.color} fw-bold`}>
                                {trend.value} {trend.text}
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-light min-vh-100">
            <div className="container-fluid p-4">
                
                {/* Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <div className="card-body text-white p-4">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <h1 className="h2 fw-bold mb-2">
                                            <i className="fas fa-chart-bar me-3"></i>
                                            Mon Dashboard
                                        </h1>
                                        <p className="mb-0 opacity-90">
                                            <i className="fas fa-user me-2"></i>
                                            Bienvenue {currentUser.username} • Plan {currentUser.plan} • Membre depuis {new Date(currentUser.joinDate).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div className="col-md-4 text-md-end">
                                        <div className="d-flex align-items-center justify-content-md-end">
                                            <div 
                                                className="bg-white rounded-circle me-2" 
                                                style={{ 
                                                    width: '12px', 
                                                    height: '12px', 
                                                    animation: 'pulse 2s infinite'
                                                }}
                                            ></div>
                                            <span className="fw-bold">Données en temps réel</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Overview */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h3 className="h4 fw-bold text-dark mb-3">
                            <i className="fas fa-database me-2 text-primary"></i>
                            Mes Bases de Données
                        </h3>
                    </div>
                    <UserMetricCard
                        title="Total Databases"
                        value={metrics.totalDatabases}
                        icon="fa-database"
                        color="primary"
                        subtitle="Créées au total"
                    />
                    <UserMetricCard
                        title="Databases Actives"
                        value={metrics.activeDatabases}
                        icon="fa-play-circle"
                        color="success"
                        subtitle="En cours d'utilisation"
                    />
                    <UserMetricCard
                        title="Databases Inactives"
                        value={metrics.inactiveDatabases}
                        icon="fa-pause-circle"
                        color="warning"
                        subtitle="Temporairement arrêtées"
                    />
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid var(--bs-info)' }}>
                            <div className="card-body p-4">
                                <h6 className="text-muted mb-3 fw-semibold">Stockage Utilisé</h6>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="h4 fw-bold text-info mb-0">{metrics.storageUsed} GB</span>
                                    <i className="fas fa-hdd fa-2x text-info opacity-75"></i>
                                </div>
                                <div className="progress mb-2" style={{ height: '8px' }}>
                                    <div 
                                        className="progress-bar bg-info" 
                                        style={{ width: `${(parseFloat(metrics.storageUsed) / metrics.totalStorage) * 100}%` }}
                                    ></div>
                                </div>
                                <small className="text-muted">
                                    {metrics.storageAvailable.toFixed(1)} GB disponible sur {metrics.totalStorage} GB
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Request & Cost Metrics */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h3 className="h4 fw-bold text-dark mb-3">
                            <i className="fas fa-exchange-alt me-2 text-success"></i>
                            Requêtes & Coûts
                            <small className="text-muted ms-3 fs-6">0.05 DT par requête</small>
                        </h3>
                    </div>
                    <UserMetricCard
                        title="Requêtes Totales"
                        value={metrics.totalRequests.toLocaleString()}
                        icon="fa-server"
                        color="primary"
                        subtitle="Depuis le début"
                        trend={{ direction: 'up', value: '+2.3%', color: 'success', text: 'vs hier' }}
                    />
                    <UserMetricCard
                        title="Requêtes Aujourd'hui"
                        value={metrics.requestsToday}
                        icon="fa-calendar-day"
                        color="info"
                        subtitle="Mises à jour en temps réel"
                        trend={{ direction: 'up', value: '+12', color: 'success', text: 'dernière heure' }}
                    />
                    <UserMetricCard
                        title="Requêtes ce Mois"
                        value={metrics.requestsThisMonth.toLocaleString()}
                        icon="fa-calendar-alt"
                        color="warning"
                        subtitle="Janvier 2025"
                    />
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid var(--bs-success)' }}>
                            <div className="card-body p-4">
                                <h6 className="text-muted mb-2 fw-semibold">Coût Total</h6>
                                <h2 className="fw-bold mb-1 text-success">
                                    {metrics.totalCost} <small className="text-muted ms-1 fs-6">DT</small>
                                </h2>
                                <small className="text-muted mb-3 d-block">Depuis le début</small>
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="border-end">
                                            <div className="fw-bold text-success">{metrics.costToday} DT</div>
                                            <small className="text-muted">Aujourd'hui</small>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="fw-bold text-success">{metrics.costThisMonth} DT</div>
                                        <small className="text-muted">Ce mois</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h3 className="h4 fw-bold text-dark mb-3">
                            <i className="fas fa-tachometer-alt me-2 text-warning"></i>
                            Performance & Fiabilité
                        </h3>
                    </div>
                    <UserMetricCard
                        title="Temps de Réponse"
                        value={metrics.avgResponseTime}
                        unit="ms"
                        icon="fa-clock"
                        color="warning"
                        subtitle="Moyenne des requêtes"
                    />
                    <UserMetricCard
                        title="Taux de Succès"
                        value={`${metrics.successRate}%`}
                        icon="fa-check-circle"
                        color="success"
                        subtitle="Requêtes réussies"
                    />
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid var(--bs-info)' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h6 className="text-muted mb-2 fw-semibold">Dernière Sauvegarde</h6>
                                        <div className="text-info fw-bold">
                                            {new Date(metrics.lastBackup).toLocaleString('fr-FR')}
                                        </div>
                                    </div>
                                    <i className="fas fa-shield-alt fa-2x text-info opacity-75"></i>
                                </div>
                                <small className="text-success">
                                    <i className="fas fa-check me-1"></i>
                                    Toutes les données sont sauvegardées
                                </small>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid var(--bs-primary)' }}>
                            <div className="card-body p-4 text-center">
                                <i className="fas fa-award fa-3x text-primary mb-3 opacity-75"></i>
                                <h5 className="fw-bold text-primary mb-2">Plan {currentUser.plan}</h5>
                                <p className="text-muted mb-3 small">
                                    Profitez de toutes les fonctionnalités avancées
                                </p>
                                <button className="btn btn-outline-primary btn-sm">
                                    <i className="fas fa-arrow-up me-2"></i>
                                    Upgrade
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h3 className="h4 fw-bold text-dark mb-3">
                            <i className="fas fa-bolt me-2 text-danger"></i>
                            Actions Rapides
                        </h3>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center p-4">
                                <i className="fas fa-plus-circle fa-3x text-success mb-3"></i>
                                <h5 className="fw-bold mb-2">Créer une Database</h5>
                                <p className="text-muted small mb-3">
                                    Déployez une nouvelle base de données en quelques clics
                                </p>
                                <button className="btn btn-success">
                                    <i className="fas fa-plus me-2"></i>
                                    Nouvelle DB
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center p-4">
                                <i className="fas fa-download fa-3x text-info mb-3"></i>
                                <h5 className="fw-bold mb-2">Télécharger Backup</h5>
                                <p className="text-muted small mb-3">
                                    Exportez une sauvegarde de vos données
                                </p>
                                <button className="btn btn-info">
                                    <i className="fas fa-download me-2"></i>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center p-4">
                                <i className="fas fa-cog fa-3x text-warning mb-3"></i>
                                <h5 className="fw-bold mb-2">Paramètres</h5>
                                <p className="text-muted small mb-3">
                                    Configurez vos préférences et notifications
                                </p>
                                <button className="btn btn-warning">
                                    <i className="fas fa-cog me-2"></i>
                                    Configurer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Info */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-light border-0">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-calculator me-2 text-success"></i>
                                    Tarification Transparente
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <h6 className="text-muted mb-2">Modèle de facturation simple et transparent :</h6>
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '60px', height: '60px' }}>
                                                <span className="fw-bold">0.05</span>
                                            </div>
                                            <div>
                                                <h4 className="fw-bold text-success mb-1">0.05 Dinar TN</h4>
                                                <p className="text-muted mb-0">par requête vers vos bases de données</p>
                                            </div>
                                        </div>
                                        <small className="text-muted">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Payez uniquement pour ce que vous utilisez • Pas de frais cachés • Facturation mensuelle
                                        </small>
                                    </div>
                                    <div className="col-md-4 text-md-end">
                                        <div className="text-center">
                                            <div className="h2 fw-bold text-primary mb-1">{metrics.costThisMonth} DT</div>
                                            <p className="text-muted mb-3">Facture ce mois</p>
                                            <button className="btn btn-outline-primary">
                                                <i className="fas fa-file-invoice me-2"></i>
                                                Voir Factures
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                .card:hover {
                    transform: translateY(-2px);
                    transition: all 0.3s ease;
                }
                
                .progress-bar {
                    transition: width 0.6s ease;
                }
            `}</style>
        </div>
    );
};

export default UserTelemetryInterface;