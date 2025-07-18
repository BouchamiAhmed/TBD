// src/components/QuickDeploy.jsx - Quick deployment component
import React from 'react';
import image from '../assets/img/image.png';

const QuickDeploy = ({ deployStatus, onQuickDeploy }) => {
    return (
        <div className="card mb-4">
            <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                    <i className="fas fa-rocket me-2"></i>
                    Quick Deploy via gRPC
                    <span className="badge bg-light text-dark ms-2">Admin Microservice</span>
                </h5>
            </div>
            <div className="card-body">
                <p>Deploy databases quickly via gRPC admin microservice with default test credentials.</p>
                <div className="d-flex flex-wrap gap-3 mb-3">
                    <button 
                        className="btn btn-primary btn-icon-split"
                        onClick={() => onQuickDeploy('mysql')}
                        disabled={deployStatus.isLoading}
                    >
                        <span className="icon text-white-50">
                            <img src={image} width={15} height={16} alt="MySQL icon" />
                        </span>
                        <span className="text">MySQL via gRPC</span>
                    </button>
                    
                    <button 
                        className="btn btn-secondary btn-icon-split"
                        onClick={() => onQuickDeploy('postgres')}
                        disabled={deployStatus.isLoading}
                    >
                        <span className="icon text-white-50">
                            <img src={image} width={15} height={16} alt="PostgreSQL icon" />
                        </span>
                        <span className="text">PostgreSQL via gRPC</span>
                    </button>
                </div>
                <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Connects to admin microservice via Envoy proxy (gRPC-Web)
                </small>
            </div>
        </div>
    );
};

export default QuickDeploy;