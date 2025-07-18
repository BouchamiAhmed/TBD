// src/components/ServiceInfo.jsx - Information panel component
import React from 'react';

const ServiceInfo = ({ currentUser }) => {
    return (
        <div className="card">
            <div className="card-header bg-info text-white">
                <h5>
                    <i className="fas fa-info-circle me-2"></i>
                    gRPC Deployment Information
                </h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6">
                        <h6>gRPC Service Features:</h6>
                        <ul>
                            <li>Direct communication with admin microservice</li>
                            <li>Type-safe Protocol Buffer messages</li>
                            <li>Automatic Kubernetes namespace creation</li>
                            <li>Integrated database user management</li>
                            <li>Real-time deployment status</li>
                            <li>Envoy proxy for browser compatibility</li>
                        </ul>
                    </div>
                    <div className="col-md-6">
                        <h6>Architecture:</h6>
                        <ul>
                            <li><strong>Frontend:</strong> React + gRPC-Web</li>
                            <li><strong>Proxy:</strong> Envoy (gRPC-Web bridge)</li>
                            <li><strong>Microservice:</strong> Go gRPC server</li>
                            <li><strong>Database:</strong> PostgreSQL (user data)</li>
                            <li><strong>Orchestration:</strong> Kubernetes</li>
                            <li><strong>Your Namespace:</strong> {currentUser ? `${currentUser.id}${currentUser.username}` : 'Please log in'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceInfo;