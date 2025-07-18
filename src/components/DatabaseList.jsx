// src/components/DatabaseList.jsx - Database listing component
import React from 'react';

const DatabaseList = ({ 
    databases, 
    loadingDatabases, 
    deleteLoading, 
    onDeleteDatabase, 
    onRefresh 
}) => {
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'running': return 'badge bg-success';
            case 'creating': return 'badge bg-warning';
            case 'error': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    return (
        <div className="card">
            <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                    <i className="fas fa-database me-2"></i>
                    My Databases (via gRPC)
                    <button 
                        className="btn btn-sm btn-outline-light ms-2"
                        onClick={onRefresh}
                        disabled={loadingDatabases}
                    >
                        <i className={`fas fa-sync-alt ${loadingDatabases ? 'fa-spin' : ''}`}></i>
                        {loadingDatabases ? ' Loading...' : ' Refresh'}
                    </button>
                </h5>
            </div>
            <div className="card-body">
                {loadingDatabases ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-info" role="status">
                            <span className="visually-hidden">Loading via gRPC...</span>
                        </div>
                        <div className="mt-2">Loading your databases via gRPC...</div>
                    </div>
                ) : databases.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="fas fa-database fa-3x mb-3"></i>
                        <h5>No databases found</h5>
                        <p>Create your first database using the gRPC service below.</p>
                    </div>
                ) : (
                    <div className="row">
                        {databases.map(database => {
                            const deleteKey = `${database.namespace}-${database.name}`;
                            const isDeleting = deleteLoading[deleteKey];
                            
                            return (
                                <div key={database.name} className="col-md-6 col-lg-4 mb-3">
                                    <div className="card h-100 border-start border-4 border-info">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="card-title mb-1">
                                                    <i className={`fas ${database.type === 'mysql' ? 'fa-leaf' : 'fa-elephant'} me-2`}></i>
                                                    {database.name}
                                                    <span className="badge bg-info ms-2">gRPC</span>
                                                </h6>
                                                <span className={getStatusBadgeClass(database.status)}>
                                                    {database.status}
                                                </span>
                                            </div>
                                            
                                            <div className="small text-muted mb-3">
                                                <div><strong>Type:</strong> {database.type?.toUpperCase()}</div>
                                                <div><strong>Admin:</strong> {database.adminType}</div>
                                                <div><strong>Created:</strong> {new Date(database.createdAt).toLocaleDateString()}</div>
                                                <div><strong>Source:</strong> gRPC Service</div>
                                            </div>

                                            <div className="d-grid gap-2">
                                                {database.adminUrl && (
                                                    <a 
                                                        href={database.adminUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline-info btn-sm"
                                                    >
                                                        <i className="fas fa-external-link-alt me-2"></i>
                                                        Open {database.adminType}
                                                    </a>
                                                )}
                                                
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => onDeleteDatabase(database)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            Deleting via gRPC...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-trash me-2"></i>
                                                            Delete Database
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
    );
};

export default DatabaseList;