// src/components/AdminDatabaseManager.jsx - Updated with gRPC diagnostics
import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import GrpcDiagnostics from './GrpcDiagnostics';

const AdminDatabaseManager = () => {
    const [namespaces, setNamespaces] = useState([]);
    const [selectedNamespace, setSelectedNamespace] = useState(null);
    const [databases, setDatabases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDatabases, setLoadingDatabases] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [error, setError] = useState('');
    const [grpcStatus, setGrpcStatus] = useState('unknown');
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [connectionInfo, setConnectionInfo] = useState(null);

    useEffect(() => {
        updateConnectionInfo();
        testGrpcConnection();
    }, []);

    const updateConnectionInfo = () => {
        const info = adminService.getConnectionInfo();
        setConnectionInfo(info);
    };

    const testGrpcConnection = async () => {
        console.log('🔍 Testing gRPC connection...');
        setGrpcStatus('testing');
        
        try {
            const isConnected = await adminService.testConnection();
            setGrpcStatus(isConnected ? 'connected' : 'disconnected');
            
            if (isConnected) {
                loadNamespaces();
            }
        } catch (error) {
            console.error('Connection test error:', error);
            setGrpcStatus('disconnected');
        }
    };

    const loadNamespaces = async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('🔄 Loading namespaces via gRPC...');
            const response = await adminService.getAllNamespaces();
            console.log('✅ Namespaces loaded:', response);
            
            setNamespaces(response.namespaces || []);
        } catch (err) {
            console.error('❌ Error loading namespaces:', err);
            setError(err.message);
            setNamespaces([]);
        } finally {
            setLoading(false);
        }
    };

    const loadNamespaceDatabases = async (namespace) => {
        setLoadingDatabases(true);
        setSelectedNamespace(namespace);
        
        try {
            console.log('🔄 Loading databases for namespace:', namespace.name);
            const response = await adminService.getUserDatabases(namespace.name);
            console.log('✅ Databases loaded for namespace:', response);
            
            setDatabases(response.databases || []);
        } catch (err) {
            console.error('❌ Error loading namespace databases:', err);
            setDatabases([]);
        } finally {
            setLoadingDatabases(false);
        }
    };

    const handleDeleteDatabase = async (database) => {
        const confirmDelete = window.confirm(
            `⚠️ ADMIN DELETE: "${database.name}"\n\n` +
            `Namespace: ${database.namespace}\n` +
            `Type: ${database.type}\n\n` +
            `This will permanently remove the database and all data.\n` +
            `This action CANNOT be undone!`
        );

        if (!confirmDelete) return;

        const deleteKey = `${database.namespace}-${database.name}`;
        setDeleteLoading(prev => ({ ...prev, [deleteKey]: true }));

        try {
            console.log('🗑️ Admin deleting database via gRPC:', database.name);
            const response = await adminService.deleteDatabase(database.namespace, database.name);
            console.log('✅ Database deleted via gRPC:', response);

            // Remove from local state
            setDatabases(prev => prev.filter(db => db.name !== database.name));
            
            // Update namespace count
            setNamespaces(prev => prev.map(ns => 
                ns.name === database.namespace 
                    ? { ...ns, databaseCount: Math.max(0, ns.databaseCount - 1) }
                    : ns
            ));

        } catch (error) {
            console.error('❌ Error deleting database:', error);
            alert(`Error deleting database: ${error.message}`);
        } finally {
            setDeleteLoading(prev => ({ ...prev, [deleteKey]: false }));
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'running': return 'badge bg-success';
            case 'creating': return 'badge bg-warning';
            case 'error': return 'badge bg-danger';
            case 'Active': return 'badge bg-success';
            case 'Terminating': return 'badge bg-warning';
            default: return 'badge bg-secondary';
        }
    };

    const getConnectionStatusCard = () => {
        switch (grpcStatus) {
            case 'connected':
                return (
                    <div className="alert alert-success" role="alert">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <i className="fas fa-check-circle me-2"></i>
                                <strong>gRPC Connected:</strong> Admin microservice is responding
                                {connectionInfo && (
                                    <div className="small mt-1">
                                        Mode: {connectionInfo.environment} | URL: {connectionInfo.url}
                                    </div>
                                )}
                            </div>
                            <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setShowDiagnostics(!showDiagnostics)}
                            >
                                <i className="fas fa-cog me-1"></i>
                                {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                            </button>
                        </div>
                    </div>
                );
            case 'disconnected':
                return (
                    <div className="alert alert-danger" role="alert">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                <strong>gRPC Disconnected:</strong> Cannot reach admin microservice
                                {connectionInfo && (
                                    <div className="small mt-1">
                                        Trying: {connectionInfo.environment} mode | URL: {connectionInfo.url}
                                    </div>
                                )}
                            </div>
                            <div>
                                <button 
                                    className="btn btn-outline-danger btn-sm ms-2"
                                    onClick={testGrpcConnection}
                                >
                                    Retry
                                </button>
                                <button 
                                    className="btn btn-outline-warning btn-sm ms-2"
                                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                                >
                                    <i className="fas fa-tools me-1"></i>
                                    Diagnostics
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'testing':
                return (
                    <div className="alert alert-info" role="alert">
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        <strong>Testing gRPC connection...</strong>
                        {connectionInfo && (
                            <div className="small mt-1">
                                Testing: {connectionInfo.environment} mode | URL: {connectionInfo.url}
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="alert alert-info" role="alert">
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        <strong>Initializing gRPC connection...</strong>
                    </div>
                );
        }
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2>
                        <i className="fas fa-users-cog me-2"></i>
                        Admin Database Manager
                        <span className="badge bg-danger ms-2">ADMIN ONLY</span>
                        <span className="badge bg-success ms-2">gRPC</span>
                    </h2>
                    <p className="text-muted">
                        Cluster-wide database management via gRPC admin microservice
                    </p>
                </div>
            </div>

            {/* Connection Status */}
            <div className="row mb-4">
                <div className="col-12">
                    {getConnectionStatusCard()}
                </div>
            </div>

            {/* Diagnostics Panel (collapsible) */}
            {showDiagnostics && (
                <div className="row mb-4">
                    <div className="col-12">
                        <GrpcDiagnostics />
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="row mb-4">
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-primary shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total Namespaces
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {namespaces.length}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-cube fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-success shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Total Databases
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {namespaces.reduce((sum, ns) => sum + ns.databaseCount, 0)}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-database fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-info shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Selected Namespace
                                    </div>
                                    <div className="h6 mb-0 font-weight-bold text-gray-800">
                                        {selectedNamespace ? selectedNamespace.name : 'None'}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-crosshairs fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-warning shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        gRPC Status
                                    </div>
                                    <div className="h6 mb-0 font-weight-bold text-gray-800">
                                        {grpcStatus === 'connected' ? 'Online' : 
                                         grpcStatus === 'disconnected' ? 'Offline' : 
                                         grpcStatus === 'testing' ? 'Testing...' : 'Initializing...'}
                                    </div>
                                    {connectionInfo && (
                                        <div className="small text-muted">
                                            {connectionInfo.environment} mode
                                        </div>
                                    )}
                                </div>
                                <div className="col-auto">
                                    <i className={`fas ${grpcStatus === 'connected' ? 'fa-rocket text-success' : 
                                                        grpcStatus === 'testing' ? 'fa-spinner fa-spin text-info' :
                                                        'fa-exclamation-triangle text-warning'} fa-2x`}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Namespaces Panel */}
                <div className="col-md-4">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h6 className="m-0 font-weight-bold">
                                <i className="fas fa-list me-2"></i>
                                Namespaces
                                <button 
                                    className="btn btn-sm btn-outline-light ms-2"
                                    onClick={loadNamespaces}
                                    disabled={loading || grpcStatus !== 'connected'}
                                >
                                    <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''} me-1`}></i>
                                </button>
                            </h6>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <div className="mt-2">Loading namespaces...</div>
                                </div>
                            ) : error ? (
                                <div className="alert alert-danger m-3" role="alert">
                                    <strong>Error:</strong> {error}
                                    <div className="mt-2">
                                        <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setShowDiagnostics(true)}
                                        >
                                            Show Diagnostics
                                        </button>
                                    </div>
                                </div>
                            ) : namespaces.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-cube fa-2x mb-2"></i>
                                    <div>No namespaces found</div>
                                    {grpcStatus !== 'connected' && (
                                        <div className="mt-2">
                                            <small>Check gRPC connection above</small>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {namespaces.map(namespace => (
                                        <button
                                            key={namespace.name}
                                            className={`list-group-item list-group-item-action ${
                                                selectedNamespace?.name === namespace.name ? 'active' : ''
                                            }`}
                                            onClick={() => loadNamespaceDatabases(namespace)}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1">{namespace.name}</h6>
                                                    <small>
                                                        {namespace.databaseCount} databases
                                                    </small>
                                                </div>
                                                <div>
                                                    <span className={getStatusBadgeClass(namespace.status)}>
                                                        {namespace.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Databases Panel */}
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-success text-white">
                            <h6 className="m-0 font-weight-bold">
                                <i className="fas fa-database me-2"></i>
                                Databases
                                {selectedNamespace && (
                                    <span className="badge bg-light text-dark ms-2">
                                        {selectedNamespace.name}
                                    </span>
                                )}
                                {selectedNamespace && (
                                    <button 
                                        className="btn btn-sm btn-outline-light ms-2"
                                        onClick={() => loadNamespaceDatabases(selectedNamespace)}
                                        disabled={loadingDatabases}
                                    >
                                        <i className={`fas fa-sync-alt ${loadingDatabases ? 'fa-spin' : ''} me-1`}></i>
                                    </button>
                                )}
                            </h6>
                        </div>
                        <div className="card-body">
                            {!selectedNamespace ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="fas fa-arrow-left fa-3x mb-3"></i>
                                    <h5>Select a namespace</h5>
                                    <p>Choose a namespace from the left panel to view its databases</p>
                                </div>
                            ) : loadingDatabases ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Loading databases...</span>
                                    </div>
                                    <div className="mt-2">Loading databases via gRPC...</div>
                                </div>
                            ) : databases.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-database fa-3x mb-3"></i>
                                    <h5>No databases found</h5>
                                    <p>This namespace doesn't contain any databases yet.</p>
                                </div>
                            ) : (
                                <div className="row">
                                    {databases.map(database => {
                                        const deleteKey = `${database.namespace}-${database.name}`;
                                        const isDeleting = deleteLoading[deleteKey];
                                        
                                        return (
                                            <div key={database.name} className="col-lg-6 mb-3">
                                                <div className="card border-start border-4 border-success">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="card-title mb-1">
                                                                <i className={`fas ${database.type === 'mysql' ? 'fa-leaf' : 'fa-elephant'} me-2`}></i>
                                                                {database.name}
                                                                <span className="badge bg-success ms-2">gRPC</span>
                                                            </h6>
                                                            <span className={getStatusBadgeClass(database.status)}>
                                                                {database.status}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="small text-muted mb-3">
                                                            <div><strong>Type:</strong> {database.type?.toUpperCase()}</div>
                                                            <div><strong>Admin:</strong> {database.adminType}</div>
                                                            <div><strong>Created:</strong> {new Date(database.createdAt).toLocaleDateString()}</div>
                                                            <div><strong>User ID:</strong> {database.userId}</div>
                                                        </div>

                                                        <div className="d-grid gap-2">
                                                            {database.adminUrl && (
                                                                <a 
                                                                    href={database.adminUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-outline-success btn-sm"
                                                                >
                                                                    <i className="fas fa-external-link-alt me-2"></i>
                                                                    Open {database.adminType}
                                                                </a>
                                                            )}
                                                            
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => handleDeleteDatabase(database)}
                                                                disabled={isDeleting}
                                                            >
                                                                {isDeleting ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                                        Admin Deleting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="fas fa-trash me-2"></i>
                                                                        Admin Delete
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDatabaseManager;