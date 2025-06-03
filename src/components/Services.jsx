import React, { useState, useEffect } from 'react';
import image from '../assets/img/image.png';

const Services = (props) => {
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

    // NEW: State for managing existing databases
    const [databases, setDatabases] = useState([]);
    const [loadingDatabases, setLoadingDatabases] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [showDatabasesList, setShowDatabasesList] = useState(false);

    // Get current user from localStorage on component mount
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

    // NEW: Load databases when user changes
    useEffect(() => {
        if (currentUser && showDatabasesList) {
            loadUserDatabases();
        }
    }, [currentUser, showDatabasesList]);

    // NEW: Function to load user's databases
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

    // NEW: Function to delete a database
    const handleDeleteDatabase = async (database) => {
        const confirmDelete = window.confirm(
            `⚠️ DELETE DATABASE: "${database.name}"\n\n` +
            `This action will permanently remove:\n` +
            `• The ${database.type} database\n` +
            `• The ${database.adminType} admin interface\n` +
            `• All data and configurations\n` +
            `• All associated Kubernetes resources\n\n` +
            `This action CANNOT be undone!\n\n` +
            `Type the database name to confirm: "${database.name}"`
        );

        if (!confirmDelete) return;

        // Additional confirmation by asking user to type database name
        const userInput = window.prompt(
            `To confirm deletion, please type the database name exactly:\n"${database.name}"`
        );

        if (userInput !== database.name) {
            alert('Database name does not match. Deletion cancelled.');
            return;
        }

        const deleteKey = `${database.namespace}-${database.name}`;
        setDeleteLoading(prev => ({ ...prev, [deleteKey]: true }));

        try {
            const response = await fetch(
                `http://localhost:8080/api/databases/${database.namespace}/${database.name}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
                    }
                }
            );

            if (response.ok) {
                // Remove from local state
                setDatabases(prev => prev.filter(db => db.name !== database.name));
                
                setDeployStatus({
                    isLoading: false,
                    success: true,
                    message: `Database "${database.name}" deleted successfully!`,
                    deployment: null
                });

                console.log(`Database ${database.name} deleted successfully`);
            } else {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to delete database');
            }
        } catch (error) {
            console.error('Error deleting database:', error);
            setDeployStatus({
                isLoading: false,
                success: false,
                message: `Error deleting database: ${error.message}`,
                deployment: null
            });
        } finally {
            setDeleteLoading(prev => ({ ...prev, [deleteKey]: false }));
        }
    };

    // Function to deploy a database
    const handleDatabaseDeploy = async (dbType) => {
        if (!currentUser) {
            alert('Please log in first to deploy databases');
            return;
        }

        if (!databaseForm.name || !databaseForm.username || !databaseForm.password) {
            alert('Please fill in all database details');
            return;
        }

        if (databaseForm.password !== databaseForm.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setDeployStatus({
            isLoading: true,
            success: null,
            message: `Creating ${dbType} database...`,
            deployment: null
        });

        try {
            const requestData = {
                name: databaseForm.name,
                username: databaseForm.username,
                password: databaseForm.password,
                type: dbType,
                userId: currentUser.id,
                userName: currentUser.username
            };

            console.log('Creating database:', requestData);

            const response = await fetch('http://localhost:8080/api/databases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();
            
            if (response.ok) {
                setDeployStatus({
                    isLoading: false,
                    success: true,
                    message: `${dbType.toUpperCase()} database created successfully!`,
                    deployment: result
                });

                // Reset form
                setDatabaseForm({
                    name: '',
                    username: '',
                    password: '',
                    confirmPassword: ''
                });
                setShowDatabaseForm(false);
                setSelectedDbType('');

                // Refresh databases list if it's open
                if (showDatabasesList) {
                    setTimeout(() => loadUserDatabases(), 2000);
                }

            } else {
                throw new Error(result.message || 'Database creation failed');
            }
        } catch (error) {
            console.error('Error creating database:', error);
            setDeployStatus({
                isLoading: false,
                success: false,
                message: `Error creating database: ${error.message}`,
                deployment: null
            });
        }
    };

    const handleShowDatabaseForm = (dbType) => {
        if (!currentUser) {
            alert('Please log in first to deploy databases');
            return;
        }
        setSelectedDbType(dbType);
        setShowDatabaseForm(true);
        setDeployStatus({ isLoading: false, success: null, message: '', deployment: null });
    };

    const handleFormChange = (field, value) => {
        setDatabaseForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Original button functionality preserved for compatibility
    const handleOriginalDeploy = async (dbType) => {
        if (!currentUser) {
            alert('Please log in first');
            return;
        }

        // Quick deploy with default values for testing
        const quickDbConfig = {
            name: `${dbType}-quick-${Date.now()}`,
            username: 'testuser',
            password: 'testpass123',
            type: dbType,
            userId: currentUser.id,
            userName: currentUser.username
        };

        setDeployStatus({
            isLoading: true,
            success: null,
            message: `Quick deploying ${dbType}...`,
            deployment: null
        });

        try {
            const response = await fetch('http://localhost:8080/api/databases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
                },
                body: JSON.stringify(quickDbConfig),
            });

            const result = await response.json();
            
            setDeployStatus({
                isLoading: false,
                success: response.ok,
                message: response.ok ? 
                    `${dbType.toUpperCase()} database deployed successfully!` : 
                    `Error: ${result.message}`,
                deployment: response.ok ? result : null
            });

            // Refresh databases list if it's open
            if (showDatabasesList && response.ok) {
                setTimeout(() => loadUserDatabases(), 2000);
            }
        } catch (error) {
            setDeployStatus({
                isLoading: false,
                success: false,
                message: `Error: ${error.message}`,
                deployment: null
            });
        }
    };

    // NEW: Function to get status badge color
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'running': return 'badge bg-success';
            case 'creating': return 'badge bg-warning';
            case 'error': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <h2>Database Services</h2>
                        {/* NEW: Database Management Toggle */}
                        {currentUser && (
                            <button
                                className={`btn ${showDatabasesList ? 'btn-outline-primary' : 'btn-primary'}`}
                                onClick={() => {
                                    setShowDatabasesList(!showDatabasesList);
                                    if (!showDatabasesList) {
                                        loadUserDatabases();
                                    }
                                }}
                            >
                                <i className={`fas ${showDatabasesList ? 'fa-plus' : 'fa-list'} me-2`}></i>
                                {showDatabasesList ? 'Create New Database' : 'Manage My Databases'}
                            </button>
                        )}
                    </div>
                    
                    {currentUser ? (
                        <div className="alert alert-info">
                            <i className="fas fa-user me-2"></i>
                            <strong>Logged in as:</strong> {currentUser.firstName} {currentUser.lastName} (@{currentUser.username})
                            <br />
                            <i className="fas fa-cube me-2"></i>
                            <strong>Your namespace:</strong> {currentUser.id}{currentUser.username}
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <strong>Please log in</strong> to deploy databases to your personal namespace.
                        </div>
                    )}
                </div>
            </div>

            <div className="row">
                {/* NEW: Existing Databases Management Panel */}
                {showDatabasesList && currentUser && (
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-header bg-warning text-dark">
                                <h5 className="mb-0">
                                    <i className="fas fa-database me-2"></i>
                                    My Databases
                                    <button 
                                        className="btn btn-sm btn-outline-dark ms-2"
                                        onClick={loadUserDatabases}
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
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="mt-2">Loading your databases...</div>
                                    </div>
                                ) : databases.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <i className="fas fa-database fa-3x mb-3"></i>
                                        <h5>No databases found</h5>
                                        <p>Create your first database using the options below.</p>
                                    </div>
                                ) : (
                                    <div className="row">
                                        {databases.map(database => {
                                            const deleteKey = `${database.namespace}-${database.name}`;
                                            const isDeleting = deleteLoading[deleteKey];
                                            
                                            return (
                                                <div key={database.name} className="col-md-6 col-lg-4 mb-3">
                                                    <div className="card h-100 border-start border-4 border-primary">
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <h6 className="card-title mb-1">
                                                                    <i className={`fas ${database.type === 'mysql' ? 'fa-leaf' : 'fa-elephant'} me-2`}></i>
                                                                    {database.name}
                                                                </h6>
                                                                <span className={getStatusBadgeClass(database.status)}>
                                                                    {database.status}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="small text-muted mb-3">
                                                                <div><strong>Type:</strong> {database.type?.toUpperCase()}</div>
                                                                <div><strong>Admin:</strong> {database.adminType}</div>
                                                                <div><strong>Created:</strong> {new Date(database.createdAt).toLocaleDateString()}</div>
                                                            </div>

                                                            <div className="d-grid gap-2">
                                                                {database.adminUrl && (
                                                                    <a 
                                                                        href={database.adminUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="btn btn-outline-primary btn-sm"
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
                                                                            Deleting...
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
                    </div>
                )}

                {/* Main Content - Only show when not in databases list mode */}
                <div className={showDatabaseForm ? "col-md-8" : (!showDatabasesList ? "col-12" : "col-12")}>
                    {!showDatabasesList && (
                        <>
                            {/* Quick Deploy Buttons (Original Style) */}
                            <div className="card mb-4">
                                <div className="card-header bg-success text-white">
                                    <h5 className="mb-0">
                                        <i className="fas fa-rocket me-2"></i>
                                        Quick Deploy (Test Databases)
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <p>Deploy databases quickly with default test credentials for rapid prototyping.</p>
                                    <div className="d-flex flex-wrap gap-3 mb-3">
                                        <button 
                                            className="btn btn-primary btn-icon-split"
                                            onClick={() => handleOriginalDeploy('mysql')}
                                            disabled={deployStatus.isLoading}
                                        >
                                            <span className="icon text-white-50">
                                                <img src={image} width={15} height={16} alt="MySQL icon" />
                                            </span>
                                            <span className="text">MySQL</span>
                                        </button>
                                        
                                        <button 
                                            className="btn btn-secondary btn-icon-split"
                                            onClick={() => handleOriginalDeploy('postgres')}
                                            disabled={deployStatus.isLoading}
                                        >
                                            <span className="icon text-white-50">
                                                <img src={image} width={15} height={16} alt="PostgreSQL icon" />
                                            </span>
                                            <span className="text">PostgreSQL</span>
                                        </button>
                                    </div>
                                    <small className="text-muted">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Default credentials: username 'testuser', password 'testpass123'
                                    </small>
                                </div>
                            </div>

                            {/* Custom Deploy Buttons */}
                            <div className="card mb-4">
                                <div className="card-header bg-primary text-white">
                                    <h5 className="mb-0">
                                        <i className="fas fa-cogs me-2"></i>
                                        Custom Database Configuration
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <p>Create databases with custom names, users, and passwords for production use.</p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <button 
                                            className="btn btn-success btn-icon-split"
                                            onClick={() => handleShowDatabaseForm('mysql')}
                                            disabled={deployStatus.isLoading}
                                        >
                                            <span className="icon text-white-50">
                                                <i className="fas fa-plus"></i>
                                            </span>
                                            <span className="text">Configure MySQL</span>
                                        </button>
                                        
                                        <button 
                                            className="btn btn-info btn-icon-split"
                                            onClick={() => handleShowDatabaseForm('postgres')}
                                            disabled={deployStatus.isLoading}
                                        >
                                            <span className="icon text-white-50">
                                                <i className="fas fa-plus"></i>
                                            </span>
                                            <span className="text">Configure PostgreSQL</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Status Display */}
                    {deployStatus.message && (
                        <div className={`alert ${
                            deployStatus.success === true ? 'alert-success' : 
                            deployStatus.success === false ? 'alert-danger' : 
                            'alert-info'
                        }`}>
                            <div className="d-flex align-items-center">
                                {deployStatus.isLoading && (
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
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
                    )}

                    {/* Information - Only show when not in databases list mode */}
                    {!showDatabasesList && (
                        <div className="card">
                            <div className="card-header">
                                <h5>
                                    <i className="fas fa-info-circle me-2"></i>
                                    Deployment Information
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>What gets deployed:</h6>
                                        <ul>
                                            <li>Dedicated database pod in your namespace</li>
                                            <li>Admin interface (phpMyAdmin/pgAdmin)</li>
                                            <li>LoadBalancer services for external access</li>
                                            <li>Traefik routing for path-based access</li>
                                            <li>Configured authentication credentials</li>
                                            <li>Resource limits for performance optimization</li>
                                        </ul>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Connection format:</h6>
                                        <ul>
                                            <li><strong>Host:</strong> {`{db-name}.{namespace}.svc.cluster.local`}</li>
                                            <li><strong>MySQL Port:</strong> 3306</li>
                                            <li><strong>PostgreSQL Port:</strong> 5432</li>
                                            <li><strong>Your Namespace:</strong> {currentUser ? `${currentUser.id}${currentUser.username}` : 'Please log in'}</li>
                                            <li><strong>Admin Access:</strong> http://10.9.21.40/{`{namespace}/{service}`}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Database Configuration Form */}
                {showDatabaseForm && (
                    <div className="col-md-4">
                        <div className="card sticky-top">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">
                                    <i className="fas fa-database me-2"></i>
                                    Configure {selectedDbType?.toUpperCase()} Database
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white float-end"
                                        onClick={() => setShowDatabaseForm(false)}
                                    ></button>
                                </h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleDatabaseDeploy(selectedDbType);
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
                                            onChange={(e) => handleFormChange('name', e.target.value)}
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
                                            onChange={(e) => handleFormChange('username', e.target.value)}
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
                                            onChange={(e) => handleFormChange('password', e.target.value)}
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
                                            onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
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
                                                    Creating...
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
                                            onClick={() => setShowDatabaseForm(false)}
                                        >
                                            <i className="fas fa-times me-2"></i>Cancel
                                        </button>
                                    </div>
                                </form>
                                
                                <hr className="mt-4" />
                                <div className="small text-muted">
                                    <h6>Database will be created with:</h6>
                                    <ul className="mb-0">
                                        <li>Resource limits: 256Mi-512Mi RAM</li>
                                        <li>CPU limits: 100m-500m cores</li>
                                        <li>LoadBalancer service on ports 8080/8081</li>
                                        <li>Traefik routing for web access</li>
                                        <li>Persistent storage (future feature)</li>
                                        <li>Automatic backup (future feature)</li>
                                    </ul>
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