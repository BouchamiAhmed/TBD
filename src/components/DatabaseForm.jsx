// src/components/DatabaseForm.jsx - Database configuration form
import React from 'react';

const DatabaseForm = ({ 
    selectedDbType, 
    databaseForm, 
    deployStatus,
    onFormChange, 
    onSubmit, 
    onCancel 
}) => {
    return (
        <div className="card sticky-top">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                    <i className="fas fa-database me-2"></i>
                    Configure {selectedDbType?.toUpperCase()}
                    <span className="badge bg-light text-dark ms-2">gRPC</span>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white float-end"
                        onClick={onCancel}
                    ></button>
                </h5>
            </div>
            <div className="card-body">
                <div className="alert alert-info" role="alert">
                    <i className="fas fa-rocket me-2"></i>
                    <small>Deploying via gRPC admin microservice</small>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit(selectedDbType);
                }}>
                    <div className="mb-3">
                        <label htmlFor="dbName" className="form-label">
                            <i className="fas fa-tag me-1"></i>Database Name
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="dbName"
                            value={databaseForm.name}
                            onChange={(e) => onFormChange('name', e.target.value)}
                            placeholder="e.g., myapp-db"
                            pattern="[a-z0-9-]+"
                            title="Only lowercase letters, numbers, and hyphens allowed"
                            required
                        />
                        <small className="form-text text-muted">
                            Only lowercase letters, numbers, and hyphens
                        </small>
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="dbUsername" className="form-label">
                            <i className="fas fa-user me-1"></i>Database Username
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="dbUsername"
                            value={databaseForm.username}
                            onChange={(e) => onFormChange('username', e.target.value)}
                            placeholder="Database user"
                            required
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="dbPassword" className="form-label">
                            <i className="fas fa-lock me-1"></i>Database Password
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="dbPassword"
                            value={databaseForm.password}
                            onChange={(e) => onFormChange('password', e.target.value)}
                            placeholder="Strong password"
                            minLength="6"
                            required
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="dbConfirmPassword" className="form-label">
                            <i className="fas fa-lock me-1"></i>Confirm Password
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="dbConfirmPassword"
                            value={databaseForm.confirmPassword}
                            onChange={(e) => onFormChange('confirmPassword', e.target.value)}
                            placeholder="Confirm password"
                            required
                        />
                    </div>
                    
                    <div className="d-grid gap-2">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={deployStatus.isLoading}
                        >
                            {deployStatus.isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Creating via gRPC...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-rocket me-2"></i>
                                    Create {selectedDbType?.toUpperCase()} Database
                                </>
                            )}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            <i className="fas fa-times me-2"></i>Cancel
                        </button>
                    </div>
                </form>
                
                <hr className="mt-4" />
                <div className="small text-muted">
                    <h6>gRPC Database Features:</h6>
                    <ul className="mb-0">
                        <li>Deployed via admin microservice</li>
                        <li>Resource limits: 256Mi-512Mi RAM</li>
                        <li>CPU limits: 100m-500m cores</li>
                        <li>Traefik routing for web access</li>
                        <li>User namespace isolation</li>
                        <li>Real-time status via gRPC</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DatabaseForm;