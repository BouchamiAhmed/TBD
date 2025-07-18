// src/components/DeploymentStatus.jsx - Status display component
import React from 'react';

const DeploymentStatus = ({ deployStatus }) => {
    if (!deployStatus.message) return null;

    return (
        <div className={`alert ${
            deployStatus.success === true ? 'alert-success' : 
            deployStatus.success === false ? 'alert-danger' : 
            'alert-info'
        }`}>
            <div className="d-flex align-items-center">
                {deployStatus.isLoading && (
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Processing via gRPC...</span>
                    </div>
                )}
                <div className="flex-grow-1">
                    <strong>{deployStatus.message}</strong>
                    {deployStatus.deployment && (
                        <div className="mt-2">
                            <div><strong>Service:</strong> {deployStatus.deployment.name}</div>
                            <div><strong>Host:</strong> {deployStatus.deployment.host}</div>
                            <div><strong>Port:</strong> {deployStatus.deployment.port}</div>
                            <div><strong>Username:</strong> {deployStatus.deployment.username}</div>
                            <div><strong>Namespace:</strong> {deployStatus.deployment.namespace}</div>
                            <div><strong>Type:</strong> {deployStatus.deployment.type?.toUpperCase()}</div>
                            <div><strong>Source:</strong> gRPC Admin Microservice</div>
                            {deployStatus.deployment.adminUrl && (
                                <div>
                                    <strong>Admin URL:</strong> 
                                    <a href={deployStatus.deployment.adminUrl} target="_blank" rel="noopener noreferrer" className="ms-2">
                                        {deployStatus.deployment.adminUrl}
                                        <i className="fas fa-external-link-alt ms-1"></i>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeploymentStatus;