// src/components/GrpcDiagnostics.jsx - Component for testing gRPC connections
import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';

const GrpcDiagnostics = () => {
    const [connectionInfo, setConnectionInfo] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [testing, setTesting] = useState(false);
    const [diagnosing, setDiagnosing] = useState(false);

    useEffect(() => {
        updateConnectionInfo();
    }, []);

    const updateConnectionInfo = () => {
        setConnectionInfo(adminService.getConnectionInfo());
    };

    const testCurrentConnection = async () => {
        setTesting(true);
        try {
            const result = await adminService.testConnection();
            setTestResults({
                type: 'single',
                current: {
                    mode: connectionInfo.environment,
                    success: result,
                    url: connectionInfo.url
                }
            });
        } catch (error) {
            setTestResults({
                type: 'single',
                current: {
                    mode: connectionInfo.environment,
                    success: false,
                    error: error.message,
                    url: connectionInfo.url
                }
            });
        } finally {
            setTesting(false);
        }
    };

    const runFullDiagnostics = async () => {
        setDiagnosing(true);
        try {
            const results = await adminService.diagnoseConnections();
            setTestResults({
                type: 'full',
                results
            });
            updateConnectionInfo(); // Update after diagnostics
        } catch (error) {
            console.error('Diagnostics error:', error);
        } finally {
            setDiagnosing(false);
        }
    };

    const switchToDirectMode = () => {
        adminService.switchToDirectMode();
        updateConnectionInfo();
        setTestResults(null);
    };

    const switchToProxyMode = () => {
        adminService.switchToProxyMode();
        updateConnectionInfo();
        setTestResults(null);
    };

    const getStatusBadge = (success) => {
        return success ? 
            <span className="badge bg-success">Connected</span> : 
            <span className="badge bg-danger">Failed</span>;
    };

    return (
        <div className="card">
            <div className="card-header bg-info text-white">
                <h6 className="mb-0">
                    <i className="fas fa-network-wired me-2"></i>
                    gRPC Connection Diagnostics
                </h6>
            </div>
            <div className="card-body">
                {/* Current Connection Info */}
                <div className="mb-4">
                    <h6>Current Connection</h6>
                    {connectionInfo && (
                        <div className="alert alert-info">
                            <div><strong>Mode:</strong> {connectionInfo.environment}</div>
                            <div><strong>URL:</strong> {connectionInfo.url}</div>
                            <div><strong>Via Proxy:</strong> {connectionInfo.useProxy ? 'Yes' : 'No'}</div>
                        </div>
                    )}
                </div>

                {/* Control Buttons */}
                <div className="mb-4">
                    <h6>Connection Mode</h6>
                    <div className="btn-group" role="group">
                        <button 
                            className={`btn ${connectionInfo?.environment === 'local' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={switchToDirectMode}
                        >
                            <i className="fas fa-direct-hit me-2"></i>
                            Direct gRPC (Port 50051)
                        </button>
                        <button 
                            className={`btn ${connectionInfo?.environment === 'production' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            onClick={switchToProxyMode}
                        >
                            <i className="fas fa-exchange-alt me-2"></i>
                            Via Proxy (Port 8080)
                        </button>
                    </div>
                </div>

                {/* Test Buttons */}
                <div className="mb-4">
                    <h6>Connection Tests</h6>
                    <div className="d-grid gap-2 d-md-flex">
                        <button 
                            className="btn btn-success"
                            onClick={testCurrentConnection}
                            disabled={testing}
                        >
                            {testing ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : (
                                <i className="fas fa-check-circle me-2"></i>
                            )}
                            Test Current Connection
                        </button>
                        <button 
                            className="btn btn-warning"
                            onClick={runFullDiagnostics}
                            disabled={diagnosing}
                        >
                            {diagnosing ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : (
                                <i className="fas fa-search me-2"></i>
                            )}
                            Run Full Diagnostics
                        </button>
                    </div>
                </div>

                {/* Test Results */}
                {testResults && (
                    <div className="mb-4">
                        <h6>Test Results</h6>
                        {testResults.type === 'single' ? (
                            <div className="alert alert-light">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{testResults.current.mode} mode</strong>
                                        <br />
                                        <small className="text-muted">{testResults.current.url}</small>
                                    </div>
                                    {getStatusBadge(testResults.current.success)}
                                </div>
                                {testResults.current.error && (
                                    <div className="mt-2">
                                        <small className="text-danger">
                                            <strong>Error:</strong> {testResults.current.error}
                                        </small>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6 className="card-title">
                                                    Direct Connection
                                                    {getStatusBadge(testResults.results.direct.success)}
                                                </h6>
                                                <p className="card-text">
                                                    <small>Port 50051 (localhost)</small>
                                                </p>
                                                {testResults.results.direct.success ? (
                                                    <div className="text-success">
                                                        <i className="fas fa-check-circle me-1"></i>
                                                        Connected in {testResults.results.direct.duration}ms
                                                    </div>
                                                ) : (
                                                    <div className="text-danger">
                                                        <i className="fas fa-times-circle me-1"></i>
                                                        {testResults.results.direct.error}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6 className="card-title">
                                                    Proxy Connection
                                                    {getStatusBadge(testResults.results.proxy.success)}
                                                </h6>
                                                <p className="card-text">
                                                    <small>Port 8080 (via Envoy)</small>
                                                </p>
                                                {testResults.results.proxy.success ? (
                                                    <div className="text-success">
                                                        <i className="fas fa-check-circle me-1"></i>
                                                        Connected in {testResults.results.proxy.duration}ms
                                                    </div>
                                                ) : (
                                                    <div className="text-danger">
                                                        <i className="fas fa-times-circle me-1"></i>
                                                        {testResults.results.proxy.error}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Troubleshooting Info */}
                <div className="mt-4">
                    <h6>Troubleshooting</h6>
                    <div className="accordion" id="troubleshootingAccordion">
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="directHeading">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#directCollapse">
                                    Direct gRPC Connection Issues
                                </button>
                            </h2>
                            <div id="directCollapse" className="accordion-collapse collapse" data-bs-parent="#troubleshootingAccordion">
                                <div className="accordion-body">
                                    <h6>If direct connection fails:</h6>
                                    <ol>
                                        <li>Make sure your Go admin service is running:
                                            <br /><code>cd Adminms/admin-service && go run cmd/main.go</code>
                                        </li>
                                        <li>Verify the service is listening on port 50051</li>
                                        <li>Check if gRPC reflection is enabled</li>
                                        <li>Test with grpcui: <code>grpcui -plaintext localhost:50051</code></li>
                                        <li>Ensure no firewall is blocking the connection</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="proxyHeading">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#proxyCollapse">
                                    Proxy Connection Issues
                                </button>
                            </h2>
                            <div id="proxyCollapse" className="accordion-collapse collapse" data-bs-parent="#troubleshootingAccordion">
                                <div className="accordion-body">
                                    <h6>If proxy connection fails:</h6>
                                    <ol>
                                        <li>Ensure Envoy proxy is running and configured for gRPC-Web</li>
                                        <li>Check the proxy is listening on port 8080</li>
                                        <li>Verify the proxy can reach your gRPC service</li>
                                        <li>Check CORS configuration in Envoy</li>
                                        <li>Ensure gRPC-Web transcoding is working</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrpcDiagnostics;