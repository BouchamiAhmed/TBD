// internal/k8s/service.go - Kubernetes service with your existing logic
package k8s

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time" // Add this import  // Add this import

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// K8sService handles all Kubernetes operations
type K8sService struct {
	clientset     *kubernetes.Clientset
	dynamicClient dynamic.Interface
}

// DatabaseRequest matches your existing structure
type DatabaseRequest struct {
	Name     string
	Username string
	Password string
	Type     string // "mysql" or "postgres"
	UserID   int
	UserName string
}

// DatabaseResponse matches your existing structure
type DatabaseResponse struct {
	Name      string
	Host      string
	Port      string
	Username  string
	Type      string
	Status    string
	Message   string
	Namespace string
	AdminURL  string
	AdminType string
}

// NewK8sService creates a new Kubernetes service client
func NewK8sService() (*K8sService, error) {
	var config *rest.Config
	var err error

	// Try in-cluster configuration first
	config, err = rest.InClusterConfig()
	if err != nil {
		fmt.Printf("⚠️  In-cluster config failed: %v\n", err)
		fmt.Println("🔄 Falling back to local development config...")

		// Only fall back to kubeconfig for local development
		if os.Getenv("KUBERNETES_SERVICE_HOST") == "" {
			kubeconfig := "kubeconfig.yaml"
			if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
				kubeconfig = os.Getenv("KUBECONFIG")
				if kubeconfig == "" {
					// Try default location
					homeDir, herr := os.UserHomeDir()
					if herr != nil {
						return nil, fmt.Errorf("failed to get home directory: %w", herr)
					}
					kubeconfig = filepath.Join(homeDir, ".kube", "config")
				}
			}
			config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
			if err != nil {
				return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
			}
			fmt.Printf("📁 Using kubeconfig: %s (development mode)\n", kubeconfig)
		} else {
			return nil, fmt.Errorf("failed to get in-cluster config: %w", err)
		}
	} else {
		fmt.Println("✅ Using in-cluster configuration (ServiceAccount)")
	}

	fmt.Printf("🔗 Kubernetes API Server: %s\n", config.Host)

	// Set a proper User-Agent to match kubectl
	config.UserAgent = "admin-service/1.0"
	// Increase timeout for better reliability
	config.Timeout = 30 * time.Second

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %w", err)
	}
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	return &K8sService{
		clientset:     clientset,
		dynamicClient: dynamicClient,
	}, nil
}

// NamespaceInfo represents namespace information
type NamespaceInfo struct {
	Name          string
	CreatedAt     time.Time
	DatabaseCount int32
	Status        string
}

// GetAllNamespaces returns all db-saas managed namespaces
func (k *K8sService) GetAllNamespaces(ctx context.Context) ([]*NamespaceInfo, error) {
	fmt.Printf("🔍 Getting all db-saas namespaces\n")

	// Get all namespaces managed by db-saas
	namespaces, err := k.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{
		LabelSelector: "app.kubernetes.io/managed-by=db-saas",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}

	var result []*NamespaceInfo
	for _, ns := range namespaces.Items {
		// Count databases in this namespace
		deployments, err := k.clientset.AppsV1().Deployments(ns.Name).List(ctx, metav1.ListOptions{
			LabelSelector: "app.kubernetes.io/managed-by=db-saas,app.kubernetes.io/component=database",
		})
		dbCount := 0
		if err == nil {
			dbCount = len(deployments.Items)
		}

		// Determine namespace status
		status := "Active"
		if ns.Status.Phase != corev1.NamespaceActive {
			status = string(ns.Status.Phase)
		}

		nsInfo := &NamespaceInfo{
			Name:          ns.Name,
			CreatedAt:     ns.CreationTimestamp.Time,
			DatabaseCount: int32(dbCount),
			Status:        status,
		}

		result = append(result, nsInfo)
	}

	fmt.Printf("✅ Found %d total db-saas namespaces\n", len(result))
	return result, nil
}

// GetUserNamespace returns the namespace name for a given user (same as your existing logic)
func (k *K8sService) GetUserNamespace(userID int, username string) string {
	namespaceName := fmt.Sprintf("%d%s", userID, username)
	if len(namespaceName) > 63 {
		namespaceName = namespaceName[:63]
	}
	return namespaceName
}

// CreateDatabase deploys a database using your existing logic
func (k *K8sService) CreateDatabase(ctx context.Context, req *DatabaseRequest) (*DatabaseResponse, error) {
	userNamespace := k.GetUserNamespace(req.UserID, req.UserName)

	fmt.Printf("🚀 Deploying %s database '%s' to namespace '%s'\n", req.Type, req.Name, userNamespace)

	// Ensure namespace exists
	if err := k.ensureNamespace(ctx, userNamespace); err != nil {
		return nil, fmt.Errorf("failed to ensure namespace: %w", err)
	}

	// Deploy based on database type
	if req.Type == "mysql" {
		return k.deployMySQL(ctx, req, userNamespace)
	} else {
		return k.deployPostgreSQL(ctx, req, userNamespace)
	}
}

// ensureNamespace creates namespace if it doesn't exist
func (k *K8sService) ensureNamespace(ctx context.Context, namespace string) error {
	_, err := k.clientset.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			ns := &corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Name: namespace,
					Labels: map[string]string{
						"app.kubernetes.io/managed-by": "db-saas",
						"db-saas/user-namespace":       "true",
					},
				},
			}
			_, err = k.clientset.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
			if err != nil {
				return err
			}
			fmt.Printf("✅ Created namespace: %s\n", namespace)
		} else {
			return err
		}
	}
	return nil
}

// deployPostgreSQL deploys PostgreSQL database with pgAdmin
func (k *K8sService) deployPostgreSQL(ctx context.Context, req *DatabaseRequest, namespace string) (*DatabaseResponse, error) {
	// Create PostgreSQL deployment
	postgresDeployment := k.createPostgreSQLDeployment(req, namespace)
	_, err := k.clientset.AppsV1().Deployments(namespace).Create(ctx, postgresDeployment, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create PostgreSQL deployment: %w", err)
	}
	fmt.Printf("✅ Created PostgreSQL deployment: %s\n", req.Name)

	// Create PostgreSQL service
	postgresService := k.createPostgreSQLService(req)
	_, err = k.clientset.CoreV1().Services(namespace).Create(ctx, postgresService, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create PostgreSQL service: %w", err)
	}
	fmt.Printf("✅ Created PostgreSQL service: %s\n", req.Name)

	// Create pgAdmin deployment
	pgAdminDeployment := k.createPgAdminDeployment(req, namespace)
	_, err = k.clientset.AppsV1().Deployments(namespace).Create(ctx, pgAdminDeployment, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create pgAdmin deployment: %w", err)
	}
	fmt.Printf("✅ Created pgAdmin deployment: %s-pgadmin\n", req.Name)

	// Create pgAdmin service
	pgAdminService := k.createPgAdminService(req)
	_, err = k.clientset.CoreV1().Services(namespace).Create(ctx, pgAdminService, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create pgAdmin service: %w", err)
	}
	fmt.Printf("✅ Created pgAdmin service: %s-pgadmin\n", req.Name)

	// Create Traefik middleware and ingress
	if err := k.createTraefikResources(ctx, req, namespace, "pgadmin"); err != nil {
		fmt.Printf("⚠️ Warning: Failed to create Traefik resources: %v\n", err)
	}

	// Build response
	host := fmt.Sprintf("%s.%s.svc.cluster.local", req.Name, namespace)
	adminURL := fmt.Sprintf("http://10.9.21.201/%s/%s-pgadmin", namespace, req.Name)

	return &DatabaseResponse{
		Name:      req.Name,
		Host:      host,
		Port:      "5432",
		Username:  req.Username,
		Type:      req.Type,
		Status:    "creating",
		Message:   fmt.Sprintf("PostgreSQL database and pgAdmin dashboard deployment initiated in namespace '%s'", namespace),
		Namespace: namespace,
		AdminURL:  adminURL,
		AdminType: "pgAdmin",
	}, nil
}

// deployMySQL deploys MySQL database with phpMyAdmin
func (k *K8sService) deployMySQL(ctx context.Context, req *DatabaseRequest, namespace string) (*DatabaseResponse, error) {
	// Create MySQL deployment
	mysqlDeployment := k.createMySQLDeployment(req, namespace)
	_, err := k.clientset.AppsV1().Deployments(namespace).Create(ctx, mysqlDeployment, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create MySQL deployment: %w", err)
	}
	fmt.Printf("✅ Created MySQL deployment: %s\n", req.Name)

	// Create MySQL service
	mysqlService := k.createMySQLService(req)
	_, err = k.clientset.CoreV1().Services(namespace).Create(ctx, mysqlService, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create MySQL service: %w", err)
	}
	fmt.Printf("✅ Created MySQL service: %s\n", req.Name)

	// Create phpMyAdmin deployment
	phpMyAdminDeployment := k.createPhpMyAdminDeployment(req, namespace)
	_, err = k.clientset.AppsV1().Deployments(namespace).Create(ctx, phpMyAdminDeployment, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create phpMyAdmin deployment: %w", err)
	}
	fmt.Printf("✅ Created phpMyAdmin deployment: %s-phpmyadmin\n", req.Name)

	// Create phpMyAdmin service
	phpMyAdminService := k.createPhpMyAdminService(req)
	_, err = k.clientset.CoreV1().Services(namespace).Create(ctx, phpMyAdminService, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create phpMyAdmin service: %w", err)
	}
	fmt.Printf("✅ Created phpMyAdmin service: %s-phpmyadmin\n", req.Name)

	// Create Traefik middleware and ingress
	if err := k.createTraefikResources(ctx, req, namespace, "phpmyadmin"); err != nil {
		fmt.Printf("⚠️ Warning: Failed to create Traefik resources: %v\n", err)
	}

	// Build response
	host := fmt.Sprintf("%s.%s.svc.cluster.local", req.Name, namespace)
	adminURL := fmt.Sprintf("http://10.9.21.201/%s/%s-phpmyadmin", namespace, req.Name)

	return &DatabaseResponse{
		Name:      req.Name,
		Host:      host,
		Port:      "3306",
		Username:  req.Username,
		Type:      req.Type,
		Status:    "creating",
		Message:   fmt.Sprintf("MySQL database and phpMyAdmin dashboard deployment initiated in namespace '%s'", namespace),
		Namespace: namespace,
		AdminURL:  adminURL,
		AdminType: "phpMyAdmin",
	}, nil
}

// Helper function to parse resource quantities
func mustParseQuantity(str string) resource.Quantity {
	q, err := resource.ParseQuantity(str)
	if err != nil {
		panic(err)
	}
	return q
}
