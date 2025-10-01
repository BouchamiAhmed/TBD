// Adminms/admin-service/main.go
// Unified service: REST API (port 8080) + gRPC Admin (port 50051)

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"google.golang.org/grpc"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	pb "admin-service/pkg/pb"
)

// Global clients (used by both REST and gRPC)
var dynamicClient dynamic.Interface
var clientset *kubernetes.Clientset
var dbClient *DBClient
var ldapManager *LDAPManager

func main() {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║    Unified Service: REST API + gRPC Admin                  ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")

	// Get database host from environment or use default
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "10.9.21.201"
	}
	fmt.Printf("🔄 Using database host: %s\n", dbHost)

	// Initialize Kubernetes client
	var err error
	clientset, err = getKubernetesClient()
	if err != nil {
		log.Printf("⚠️  Could not connect to Kubernetes: %v", err)
		clientset = nil
	} else {
		log.Println("✅ Kubernetes client connected")
	}

	// Initialize dynamic client for Traefik resources
	dynamicClient, err = getDynamicClient()
	if err != nil {
		log.Printf("⚠️  Could not create dynamic client: %v", err)
		dynamicClient = nil
	} else {
		log.Println("✅ Dynamic client initialized")
	}

	// Initialize database client
	dbClient, err = NewDBClient(dbHost)
	if err != nil {
		log.Printf("⚠️  Could not connect to PostgreSQL: %v", err)
		dbClient = nil
	} else {
		log.Println("✅ PostgreSQL connected")
		if err := dbClient.CreateTablesIfNotExist(); err != nil {
			log.Printf("⚠️  Error initializing database tables: %v", err)
		}
		defer dbClient.Close()
	}

	// Initialize LDAP Manager
	ldapHost := os.Getenv("LDAP_HOST")
	if ldapHost == "" {
		ldapHost = "10.9.21.201"
	}
	ldapManager = &LDAPManager{
		Host:          ldapHost,
		Port:          389,
		AdminDN:       os.Getenv("LDAP_BIND_DN"),
		AdminPassword: os.Getenv("LDAP_BIND_PASSWORD"),
		BaseDN:        os.Getenv("LDAP_BASE_DN"),
	}
	if err := ldapManager.Connect(); err != nil {
		log.Printf("⚠️  LDAP connection failed: %v", err)
		ldapManager = nil
	}
	if err := ldapManager.Connect(); err != nil {
		log.Printf("⚠️  LDAP connection failed: %v", err)
		ldapManager = nil
	} else {
		log.Println("✅ LDAP connected")
	}

	// Start gRPC server in a goroutine
	go startGRPCServer()

	// Start REST API server
	startRESTServer()
}

// ============================================================================
// gRPC SERVER
// ============================================================================

func startGRPCServer() {
	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("❌ Failed to listen on gRPC port: %v", err)
	}

	grpcServer := grpc.NewServer()
	adminServer := &AdminGRPCServer{}
	pb.RegisterAdminServiceServer(grpcServer, adminServer)

	log.Printf("✅ gRPC Admin Server listening on port %s", port)
	log.Println("📋 Admin gRPC methods available:")
	log.Println("   - ListLDAPUsers, GetLDAPUser, DeleteLDAPUser, UpdateLDAPPassword")
	log.Println("   - GetAllNamespaces, GetNamespaceDetails, DeleteNamespace")
	log.Println("   - ListNamespaceResources, GetSystemHealth, GetAdminStats")

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("❌ Failed to serve gRPC: %v", err)
	}
}

// ============================================================================
// REST API SERVER
// ============================================================================

func startRESTServer() {
	r := mux.NewRouter()

	// Root endpoint
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		response := map[string]interface{}{
			"status":  "running",
			"service": "Database SaaS API with LDAP + gRPC Admin",
			"version": "2.0.0",
			"apis": map[string]string{
				"rest": "http://localhost:8080",
				"grpc": "localhost:50051",
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}).Methods("GET")

	// Health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		health := map[string]interface{}{
			"status": "healthy",
			"services": map[string]string{
				"database":   getServiceStatus(dbClient != nil),
				"kubernetes": getServiceStatus(clientset != nil),
				"traefik":    getServiceStatus(dynamicClient != nil),
				"ldap":       getServiceStatus(ldapManager != nil),
				"grpc":       "running",
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(health)
	}).Methods("GET")

	// Register all your existing REST handlers
	if clientset != nil {
		RegisterDatabaseHandlers(r, clientset, dbClient)
		RegisterPodsHandler(r, clientset)
		log.Println("✅ Database and pod management endpoints registered")
	}

	RegisterDeploymentHandler(r)
	log.Println("✅ YAML deployment handler registered")

	if dbClient != nil {
		RegisterEnhancedAuthHandlers(r, dbClient)
		log.Println("✅ Enhanced authentication registered")
		registerLegacyUserHandlers(r, dbClient)
		log.Println("✅ Legacy user management registered")
	}

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
	})

	// Start REST server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("✅ REST API Server listening on port %s", port)
	log.Println("📋 REST API endpoints:")
	log.Println("   - POST /api/databases - Create database")
	log.Println("   - GET  /api/databases/{namespace} - List databases")
	log.Println("   - DELETE /api/databases/{namespace}/{name} - Delete database")
	log.Println("   - POST /api/auth/register - Register user")
	log.Println("   - POST /api/auth/login - Login")

	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func getServiceStatus(available bool) string {
	if available {
		return "connected"
	}
	return "disconnected"
}

func getKubernetesClient() (*kubernetes.Clientset, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := "kubeconfig.yaml"
		if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
			kubeconfig = os.Getenv("KUBECONFIG")
			if kubeconfig == "" {
				homeDir, err := os.UserHomeDir()
				if err != nil {
					return nil, fmt.Errorf("failed to get home directory: %w", err)
				}
				kubeconfig = filepath.Join(homeDir, ".kube", "config")
			}
		}

		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to build config: %w", err)
		}
		fmt.Printf("📁 Using kubeconfig from: %s\n", kubeconfig)
	} else {
		fmt.Println("☸️  Using in-cluster Kubernetes configuration")
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	_, err = clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{Limit: 1})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Kubernetes API: %w", err)
	}

	return clientset, nil
}

func getDynamicClient() (dynamic.Interface, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := "kubeconfig.yaml"
		if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
			kubeconfig = os.Getenv("KUBECONFIG")
			if kubeconfig == "" {
				homeDir, err := os.UserHomeDir()
				if err != nil {
					return nil, fmt.Errorf("failed to get home directory: %w", err)
				}
				kubeconfig = filepath.Join(homeDir, ".kube", "config")
			}
		}

		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to build config: %w", err)
		}
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	return dynamicClient, nil
}

func registerLegacyUserHandlers(r *mux.Router, dbClient *DBClient) {
	r.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		users, err := dbClient.GetAllUsers()
		if err != nil {
			http.Error(w, "Failed to get users: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"users": users,
			"count": len(users),
		})
	}).Methods("GET")

	r.HandleFunc("/api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
		user, err := dbClient.GetUserByID(id)
		if err != nil {
			http.Error(w, "Failed to get user: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}).Methods("GET")
}

// ============================================================================
// Import the AdminGRPCServer from admin_grpc.go
// NOTE: Move all the AdminGRPCServer type and methods here, or keep them
// in a separate file without a main() function
// ============================================================================
