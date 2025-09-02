// Complete TBDback/main.go with LDAP integration

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
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

	// Database deployment endpoints
	if clientset != nil {
		registerDatabaseHandlers(r, clientset, dbClient)
		RegisterPodsHandler(r, clientset)
		fmt.Println("✅ Database and pod management endpoints registered")
	}

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
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("✅ Server starting on http://localhost:%s\n", port)
	fmt.Println("📋 Available endpoints:")
	fmt.Println("   POST /api/auth/register - Register new LDAP user")
	fmt.Println("   POST /api/auth/login - Login with LDAP/local auth")
	fmt.Println("   GET  /api/auth/health - Health check")
	fmt.Println("   POST /api/databases - Create database")
	fmt.Println("   GET  /api/databases/{namespace} - List databases")
	fmt.Println("   GET  /api/pods - List pods")
	fmt.Println("Waiting for requests...")

	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}

// registerDatabaseHandlers handles database-related endpoints
func registerDatabaseHandlers(r *mux.Router, clientset *kubernetes.Clientset, dbClient *DBClient) {
	// Create database endpoint
	r.HandleFunc("/api/databases", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("📋 Database creation request received")

		var dbRequest DatabaseRequest
		if err := json.NewDecoder(r.Body).Decode(&dbRequest); err != nil {
			fmt.Printf("Error parsing database request: %v\n", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate request
		if dbRequest.Name == "" || dbRequest.Type == "" || dbRequest.UserID == 0 {
			http.Error(w, "Name, type, and userID are required", http.StatusBadRequest)
			return
		}

		fmt.Printf("📋 Creating %s database: %s for user %d\n", dbRequest.Type, dbRequest.Name, dbRequest.UserID)

		// Deploy database to user namespace
		response, err := deployDatabaseToUserNamespace(dbRequest, clientset)
		if err != nil {
			fmt.Printf("Error deploying database: %v\n", err)
			http.Error(w, "Failed to deploy database: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Record in PostgreSQL if available
		if dbClient != nil {
			_, err = dbClient.CreateDatabase(
				response.Name, response.Type, response.Host, response.Port,
				response.Username, response.Namespace, dbRequest.UserID,
				response.AdminURL, response.AdminType,
			)
			if err != nil {
				fmt.Printf("Warning: Failed to record database in PostgreSQL: %v\n", err)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)
		fmt.Printf("✅ Database created successfully: %s\n", response.Name)
	}).Methods("POST")

	// List databases in namespace
	r.HandleFunc("/api/databases/{namespace}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]

		if namespace == "" {
			http.Error(w, "Namespace is required", http.StatusBadRequest)
			return
		}

		fmt.Printf("📋 Getting databases for namespace: %s\n", namespace)

		databases, err := listDatabasesInNamespace(namespace)
		if err != nil {
			fmt.Printf("Error listing databases: %v\n", err)
			http.Error(w, "Failed to list databases: "+err.Error(), http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"success":   true,
			"namespace": namespace,
			"databases": databases,
			"count":     len(databases),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		fmt.Printf("📋 Returned %d databases for namespace %s\n", len(databases), namespace)
	}).Methods("GET")
}

// registerLegacyUserHandlers keeps your existing user management
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
	}).Methods("GET")
}

// getKubernetesClient initializes Kubernetes client
func getKubernetesClient() (*kubernetes.Clientset, error) {
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

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	return clientset, nil
}

// getDynamicClient initializes dynamic client for Traefik
func getDynamicClient() (dynamic.Interface, error) {
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

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config: %w", err)
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	return dynamicClient, nil
}
