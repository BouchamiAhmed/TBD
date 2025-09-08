// src/components/Services.jsx - Enhanced with purple theme
import React, { useState, useEffect } from 'react';

const Services = () => {
    const [deployStatus, setDeployStatus] = useState({
        isLoading: false,
        success: null,
        message: '',
        deployment: null
    });

    const [currentUser, setCurrentUser] = useState(null);
    const [showDatabaseForm, setShowDatabaseForm] = useState(false);
    const [selectedDbType, setSelectedDbType] = useState('');
    const [databaseForm, setDatabaseForm] = useState({
        name: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const [databases, setDatabases] = useState([]);
    const [loadingDatabases, setLoadingDatabases] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [showDatabasesList, setShowDatabasesList] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setCurrentUser(user);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (currentUser && showDatabasesList) {
            loadUserDatabases();
        }
    }, [currentUser, showDatabasesList]);

    const loadUserDatabases = async () => {
        if (!currentUser) return;

        setLoadingDatabases(true);
        try {
            const namespace = `${currentUser.id}${currentUser.username}`;
            const response = await fetch(`http://localhost:8080/api/databases/${namespace}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDatabases(data.databases || []);
            } else {
                console.error('Failed to load databases');
                setDatabases([]);
            }
        } catch (error) {
            console.error('Error loading databases:', error);
            setDatabases([]);
        } finally {
            setLoadingDatabases(false);
        }
    };

    const handleCreateDatabase = () => {
        setShowDatabaseForm(true);
        setShowDatabasesList(false);
    };

    const handleManageDatabases = () => {
        setShowDatabasesList(true);
        setShowDatabaseForm(false);
        loadUserDatabases();
    };

    const handleDatabaseTypeSelect = (type) => {
        setSelectedDbType(type);
        setDatabaseForm({
            name: '',
            username: '',
            password: '',
            confirmPassword: ''
        });
    };

    const handleFormChange = (e) => {
        setDatabaseForm({
            ...databaseForm,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (databaseForm.password !== databaseForm.confirmPassword) {
            setDeployStatus({
                isLoading: false,
                success: false,
                message: 'Passwords do not match',
                deployment: null
            });
            return;
        }

        setDeployStatus({ isLoading: true, success: null, message: '', deployment: null });

        try {
            const response = await fetch('http://localhost:8080/api/databases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
                },
                body: JSON.stringify({
                    type: selectedDbType,
                    name: databaseForm.name,
                    username: databaseForm.username,
                    password: databaseForm.password,
                    namespace: `${currentUser.id}${currentUser.username}`
                })
            });

            if (response.ok) {
                const result = await response.json();
                setDeployStatus({
                    isLoading: false,
                    success: true,
                    message: `${selectedDbType} database "${databaseForm.name}" created successfully!`,
                    deployment: result
                });
                
                setDatabaseForm({
                    name: '',
                    username: '',
                    password: '',
                    confirmPassword: ''
                });
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create database');
            }
        } catch (error) {
            setDeployStatus({
                isLoading: false,
                success: false,
                message: error.message,
                deployment: null
            });
        }
    };

    const handleDeleteDatabase = async (namespace, dbName) => {
        if (!window.confirm(`Are you sure you want to delete "${dbName}"?`)) {
            return;
        }

        setDeleteLoading({ ...deleteLoading, [dbName]: true });

        try {
            const response = await fetch(`http://localhost:8080/api/databases/${namespace}/${dbName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
                }
            });

            if (response.ok) {
                loadUserDatabases();
            } else {
                alert('Failed to delete database');
            }
        } catch (error) {
            console.error('Error deleting database:', error);
            alert('Error deleting database');
        } finally {
            setDeleteLoading({ ...deleteLoading, [dbName]: false });
        }
    };

    const clearStatus = () => {
        setDeployStatus({ isLoading: false, success: null, message: '', deployment: null });
    };

    const getDatabaseIcon = (type) => {
        switch(type?.toLowerCase()) {
            case 'mysql':
                return 'fas fa-database text-warning';
            case 'postgresql':
                return 'fas fa-elephant text-info';
            default:
                return 'fas fa-database text-secondary';
        }
    };

    const getStatusBadge = (status) => {
        switch(status?.toLowerCase()) {
            case 'running':
                return 'bg-success';
            case 'pending':
                return 'bg-warning';
            case 'failed':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="container py-5">
                
                {/* Header */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="text-center">
                            <div className="d-inline-flex align-items-center justify-content-center mb-4" 
                                 style={{
                                     width: '80px', 
                                     height: '80px', 
                                     background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                     borderRadius: '20px'
                                 }}>
                                <i className="fas fa-cogs fa-2x text-white"></i>
                            </div>
                            <h1 className="display-5 fw-bold text-dark mb-3">Database Services</h1>
                            <p className="lead text-muted">Create and manage your database instances</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                            <button
                                onClick={handleCreateDatabase}
                                className={`btn btn-lg px-5 py-3 fw-medium ${!showDatabaseForm ? 'text-white' : 'btn-outline-primary'}`}
                                style={!showDatabaseForm ? {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                    border: 'none',
                                    borderRadius: '15px'
                                } : {
                                    borderColor: '#764ba2',
                                    color: '#764ba2',
                                    borderRadius: '15px'
                                }}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Create New Database
                            </button>
                            <button
                                onClick={handleManageDatabases}
                                className={`btn btn-lg px-5 py-3 fw-medium ${!showDatabasesList ? 'text-white' : 'btn-outline-success'}`}
                                style={!showDatabasesList ? {
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    border: 'none',
                                    borderRadius: '15px'
                                } : {
                                    borderColor: '#11998e',
                                    color: '#11998e',
                                    borderRadius: '15px'
                                }}
                            >
                                <i className="fas fa-list me-2"></i>
                                Manage Existing Databases
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {deployStatus.message && (
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className={`alert ${deployStatus.success ? 'alert-success' : 'alert-danger'} border-0 d-flex justify-content-between align-items-center`}
                                 style={{ borderRadius: '15px' }}>
                                <div className="d-flex align-items-center">
                                    <i className={`fas ${deployStatus.success ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                                    {deployStatus.message}
                                </div>
                                <button onClick={clearStatus} className="btn-close" aria-label="Close"></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Database Form */}
                {showDatabaseForm && (
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                                <div className="card-header text-white py-4 border-0"
                                     style={{
                                         background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                         borderRadius: '20px 20px 0 0'
                                     }}>
                                    <h3 className="mb-0 text-center">
                                        <i className="fas fa-plus-circle me-2"></i>
                                        Create New Database
                                    </h3>
                                </div>
                                <div className="card-body p-5">
                                    
                                    {!selectedDbType ? (
                                        <div>
                                            <h5 className="mb-4 text-center">Select Database Type</h5>
                                            <div className="row g-4">
                                                <div className="col-md-6">
                                                    <div 
                                                        className="card h-100 border-0 shadow-sm cursor-pointer"
                                                        style={{ borderRadius: '15px', cursor: 'pointer' }}
                                                        onClick={() => handleDatabaseTypeSelect('mysql')}
                                                    >
                                                        <div className="card-body text-center p-4">
                                                            <div className="mb-3">
                                                                <i className="fas fa-database fa-3x text-warning"></i>
                                                            </div>
                                                            <h5 className="card-title">MySQL</h5>
                                                            <p className="card-text text-muted">
                                                                Popular open-source relational database
                                                            </p>
                                                            <div className="mt-3">
                                                                <span className="badge bg-warning bg-opacity-10 text-warning me-2">Relational</span>
                                                                <span className="badge bg-info bg-opacity-10 text-info">SQL</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div 
                                                        className="card h-100 border-0 shadow-sm cursor-pointer"
                                                        style={{ borderRadius: '15px', cursor: 'pointer' }}
                                                        onClick={() => handleDatabaseTypeSelect('postgresql')}
                                                    >
                                                        <div className="card-body text-center p-4">
                                                            <div className="mb-3">
                                                                <i className="fas fa-elephant fa-3x text-info"></i>
                                                            </div>
                                                            <h5 className="card-title">PostgreSQL</h5>
                                                            <p className="card-text text-muted">
                                                                Advanced open-source relational database
                                                            </p>
                                                            <div className="mt-3">
                                                                <span className="badge bg-info bg-opacity-10 text-info me-2">Relational</span>
                                                                <span className="badge bg-success bg-opacity-10 text-success">Advanced</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <h5 className="mb-0">
                                                    <i className={getDatabaseIcon(selectedDbType)} me-2></i>
                                                    Configure {selectedDbType.toUpperCase()} Database
                                                </h5>
                                                <button 
                                                    onClick={() => setSelectedDbType('')}
                                                    className="btn btn-outline-secondary btn-sm"
                                                    style={{ borderRadius: '10px' }}
                                                >
                                                    <i className="fas fa-arrow-left me-1"></i>
                                                    Back
                                                </button>
                                            </div>

                                            <form onSubmit={handleFormSubmit}>
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Database Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control py-3"
                                                            style={{ borderRadius: '12px' }}
                                                            name="name"
                                                            value={databaseForm.name}
                                                            onChange={handleFormChange}
                                                            placeholder="my-database"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Username</label>
                                                        <input
                                                            type="text"
                                                            className="form-control py-3"
                                                            style={{ borderRadius: '12px' }}
                                                            name="username"
                                                            value={databaseForm.username}
                                                            onChange={handleFormChange}
                                                            placeholder="dbuser"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Password</label>
                                                        <input
                                                            type="password"
                                                            className="form-control py-3"
                                                            style={{ borderRadius: '12px' }}
                                                            name="password"
                                                            value={databaseForm.password}
                                                            onChange={handleFormChange}
                                                            placeholder="••••••••"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Confirm Password</label>
                                                        <input
                                                            type="password"
                                                            className="form-control py-3"
                                                            style={{ borderRadius: '12px' }}
                                                            name="confirmPassword"
                                                            value={databaseForm.confirmPassword}
                                                            onChange={handleFormChange}
                                                            placeholder="••••••••"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 d-flex gap-3">
                                                    <button
                                                        type="submit"
                                                        disabled={deployStatus.isLoading}
                                                        className="btn text-white px-4 py-3 fw-medium flex-grow-1"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                            border: 'none',
                                                            borderRadius: '12px'
                                                        }}
                                                    >
                                                        {deployStatus.isLoading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-rocket me-2"></i>
                                                                Create Database
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Databases List */}
                {showDatabasesList && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                                <div className="card-header text-white py-4 border-0"
                                     style={{
                                         background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                         borderRadius: '20px 20px 0 0'
                                     }}>
                                    <h3 className="mb-0 text-center">
                                        <i className="fas fa-list me-2"></i>
                                        Your Databases
                                    </h3>
                                </div>
                                <div className="card-body p-4">
                                    {loadingDatabases ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-3 text-muted">Loading your databases...</p>
                                        </div>
                                    ) : databases.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="mb-4">
                                                <i className="fas fa-database fa-4x text-muted opacity-50"></i>
                                            </div>
                                            <h5 className="text-muted">No databases found</h5>
                                            <p className="text-muted">Create your first database to get started.</p>
                                            <button
                                                onClick={handleCreateDatabase}
                                                className="btn text-white px-4 py-2"
                                                style={{
                                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                    border: 'none',
                                                    borderRadius: '12px'
                                                }}
                                            >
                                                <i className="fas fa-plus me-2"></i>
                                                Create Database
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="row g-4">
                                            {databases.map((db, index) => (
                                                <div key={index} className="col-lg-6 col-xl-4">
                                                    <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                                                        <div className="card-body p-4">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="me-3">
                                                                        <i className={getDatabaseIcon(db.type)} style={{ fontSize: '1.5rem' }}></i>
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="mb-1 fw-bold">{db.name}</h6>
                                                                        <small className="text-muted">{db.type?.toUpperCase()}</small>
                                                                    </div>
                                                                </div>
                                                                <span className={`badge ${getStatusBadge(db.status)} px-2 py-1`}>
                                                                    {db.status || 'Unknown'}
                                                                </span>
                                                            </div>

                                                            <div className="mb-3">
                                                                <small className="text-muted d-block">Namespace: {db.namespace}</small>
                                                                <small className="text-muted d-block">Created: {new Date(db.createdAt).toLocaleDateString()}</small>
                                                            </div>

                                                            <div className="d-flex gap-2">
                                                                {db.adminUrl && (
                                                                    <a
                                                                        href={db.adminUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="btn btn-outline-primary btn-sm flex-grow-1"
                                                                        style={{ borderRadius: '8px' }}
                                                                    >
                                                                        <i className="fas fa-external-link-alt me-1"></i>
                                                                        Manage
                                                                    </a>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteDatabase(db.namespace, db.name)}
                                                                    disabled={deleteLoading[db.name]}
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    style={{ borderRadius: '8px' }}
                                                                >
                                                                    {deleteLoading[db.name] ? (
                                                                        <span className="spinner-border spinner-border-sm"></span>
                                                                    ) : (
                                                                        <i className="fas fa-trash"></i>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome Message */}
                {!showDatabaseForm && !showDatabasesList && (
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                                <div className="card-body text-center p-5">
                                    <div className="mb-4">
                                        <i className="fas fa-rocket fa-4x text-primary opacity-75"></i>
                                    </div>
                                    <h3 className="mb-3">Ready to Deploy?</h3>
                                    <p className="text-muted mb-4">
                                        Choose an option above to create a new database or manage your existing ones.
                                        Our platform supports MySQL and PostgreSQL with automated deployment and management.
                                    </p>
                                    <div className="row g-3 text-start">
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-start">
                                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                                <div>
                                                    <strong>Auto Deployment</strong>
                                                    <br />
                                                    <small className="text-muted">Automatic Kubernetes deployment</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-start">
                                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                                <div>
                                                    <strong>Admin Tools</strong>
                                                    <br />
                                                    <small className="text-muted">phpMyAdmin & pgAdmin included</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-start">
                                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                                <div>
                                                    <strong>Isolated Namespaces</strong>
                                                    <br />
                                                    <small className="text-muted">Secure multi-tenant architecture</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-start">
                                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                                <div>
                                                    <strong>Easy Management</strong>
                                                    <br />
                                                    <small className="text-muted">Simple web-based interface</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Services;