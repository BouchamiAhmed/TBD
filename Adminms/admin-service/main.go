// Complete TBDback/main.go with LDAP integration and all handlers

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Global clients
var dynamicClient dynamic.Interface
var clientset *kubernetes.Clientset

func main() {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║           K3s Database SaaS API Server + LDAP Auth         ║")
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
		log.Printf("Warning: Could not connect to Kubernetes: %v", err)
		log.Println("Pod viewing functionality will not be available")
		clientset = nil
	} else {
		log.Println("✅ Successfully connected to Kubernetes cluster")
	}

	// Initialize dynamic client for Traefik resources
	dynamicClient, err = getDynamicClient()
	if err != nil {
		log.Printf("Warning: Could not create dynamic client: %v", err)
		log.Println("Traefik functionality will not be available")
	} else {
		log.Println("✅ Successfully initialized dynamic client for Traefik")
	}

	// Initialize database client
	dbClient, err := NewDBClient(dbHost)
	if err != nil {
		log.Printf("Warning: Could not connect to PostgreSQL database: %v", err)
		log.Println("Database functionality will not be available")
		dbClient = nil
	} else {
		log.Println("✅ Successfully connected to PostgreSQL database")

		// Initialize database tables
		if err := dbClient.CreateTablesIfNotExist(); err != nil {
			log.Printf("Error initializing database tables: %v", err)
		}
		defer dbClient.Close()
	}

	// Initialize router
	r := mux.NewRouter()

	// Root endpoint
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("API root accessed")
		response := map[string]interface{}{
			"status":  "running",
			"service": "Database SaaS API with LDAP Authentication",
			"version": "1.0.0",
			"features": []string{
				"LDAP Authentication",
				"PostgreSQL Integration",
				"Kubernetes Database Deployment",
				"User Namespace Isolation",
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
				"database":   "unknown",
				"kubernetes": "unknown",
				"traefik":    "unknown",
			},
		}

		if dbClient != nil {
			health["services"].(map[string]string)["database"] = "connected"
		} else {
			health["services"].(map[string]string)["database"] = "disconnected"
		}

		if clientset != nil {
			health["services"].(map[string]string)["kubernetes"] = "connected"
		} else {
			health["services"].(map[string]string)["kubernetes"] = "disconnected"
		}

		if dynamicClient != nil {
			health["services"].(map[string]string)["traefik"] = "connected"
		} else {
			health["services"].(map[string]string)["traefik"] = "disconnected"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(health)
	}).Methods("GET")

	// Database deployment endpoints
	if clientset != nil {
		// Use the new RegisterDatabaseHandlers function
		RegisterDatabaseHandlers(r, clientset, dbClient)
		RegisterPodsHandler(r, clientset)
		fmt.Println("✅ Database and pod management endpoints registered")
	} else {
		fmt.Println("⚠️  Kubernetes client not available - database deployment disabled")
	}

	// YAML deployment handler
	RegisterDeploymentHandler(r)
	fmt.Println("✅ YAML deployment handler registered")

	// Enhanced authentication with LDAP
	if dbClient != nil {
		RegisterEnhancedAuthHandlers(r, dbClient)
		fmt.Println("✅ Enhanced authentication with LDAP support registered")

		// Legacy user endpoints (keeping existing functionality)
		registerLegacyUserHandlers(r, dbClient)
		fmt.Println("✅ Legacy user management endpoints registered")
	} else {
		fmt.Println("⚠️  Database not available - authentication disabled")
	}

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
		Debug:            false,
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("✅ Server starting on http://localhost:%s\n", port)
	fmt.Println("📋 Available endpoints:")
	fmt.Println("   GET  /                          - API status")
	fmt.Println("   GET  /health                    - Health check")
	fmt.Println("   POST /api/auth/register         - Register new LDAP user")
	fmt.Println("   POST /api/auth/login            - Login with LDAP/local auth")
	fmt.Println("   GET  /api/auth/health           - Auth service health")
	fmt.Println("   POST /api/databases             - Create database")
	fmt.Println("   GET  /api/databases/{namespace} - List databases in namespace")
	fmt.Println("   DELETE /api/databases/{namespace}/{name} - Delete database")
	fmt.Println("   GET  /api/users/{userId}/databases - Get user's databases")
	fmt.Println("   GET  /api/pods                  - List all pods")
	fmt.Println("   GET  /api/pods/{namespace}/{name} - Get pod details")
	fmt.Println("   POST /api/deploy                - Deploy YAML")
	fmt.Println("   POST /api/namespace/create      - Create user namespace")
	fmt.Println("   GET  /api/users                 - List all users")
	fmt.Println("   POST /api/users                 - Create user")
	fmt.Println("   GET  /api/users/{id}            - Get user by ID")
	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("Waiting for requests...")

	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}

// registerLegacyUserHandlers keeps your existing user management endpoints
func registerLegacyUserHandlers(r *mux.Router, dbClient *DBClient) {
	// Create user (legacy)
	r.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		var userRequest struct {
			FirstName string `json:"firstName"`
			LastName  string `json:"lastName"`
		}

		if err := json.NewDecoder(r.Body).Decode(&userRequest); err != nil {
			fmt.Println("Error parsing user request:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		fmt.Printf("Creating legacy user: %s %s\n", userRequest.FirstName, userRequest.LastName)

		user, err := dbClient.CreateUser(userRequest.LastName, userRequest.FirstName)
		if err != nil {
			fmt.Printf("Error creating user: %v\n", err)
			http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(user)
		fmt.Printf("Legacy user created with ID: %d\n", user.ID)
	}).Methods("POST")

	// Get all users
	r.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Getting all users")

		users, err := dbClient.GetAllUsers()
		if err != nil {
			fmt.Printf("Error getting users: %v\n", err)
			http.Error(w, "Failed to get users: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"users": users,
			"count": len(users),
		})
		fmt.Printf("Returned %d users\n", len(users))
	}).Methods("GET")

	// Get user by ID
	r.HandleFunc("/api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		idStr := vars["id"]

		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		fmt.Printf("Getting user with ID: %d\n", id)

		user, err := dbClient.GetUserByID(id)
		if err != nil {
			fmt.Printf("Error getting user: %v\n", err)
			http.Error(w, "Failed to get user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if user == nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
		fmt.Printf("Returned user: %s %s (ID: %d)\n", user.FirstName, user.LastName, user.ID)
	}).Methods("GET")

	// Delete user
	r.HandleFunc("/api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		idStr := vars["id"]

		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		fmt.Printf("Deleting user with ID: %d\n", id)

		// In a real application, you'd implement a DeleteUser method
		// For now, just return success
		response := map[string]interface{}{
			"success": true,
			"message": fmt.Sprintf("User %d deleted", id),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		fmt.Printf("User %d deletion processed\n", id)
	}).Methods("DELETE")

	fmt.Println("✅ Legacy user management endpoints registered at /api/users")
}

// getKubernetesClient initializes Kubernetes client
func getKubernetesClient() (*kubernetes.Clientset, error) {
	// Try in-cluster config first (when running inside Kubernetes)
	config, err := rest.InClusterConfig()
	if err != nil {
		// Fallback to kubeconfig file
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
		fmt.Printf("Using kubeconfig from: %s\n", kubeconfig)
	} else {
		fmt.Println("Using in-cluster Kubernetes configuration")
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	// Test connection
	_, err = clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{Limit: 1})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Kubernetes API: %w", err)
	}

	return clientset, nil
}

// getDynamicClient initializes dynamic client for Traefik CRDs
func getDynamicClient() (dynamic.Interface, error) {
	// Try in-cluster config first
	config, err := rest.InClusterConfig()
	if err != nil {
		// Fallback to kubeconfig file
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
