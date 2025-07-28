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
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Add global dynamic client for Traefik resources
var dynamicClient dynamic.Interface
var clientset *kubernetes.Clientset

func main() {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║                K3s Database SaaS API Server                ║")
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
		log.Println("Successfully connected to Kubernetes cluster")
	}

	// Initialize dynamic client for Traefik resources
	dynamicClient, err = getDynamicClient()
	if err != nil {
		log.Printf("Warning: Could not create dynamic client: %v", err)
		log.Println("Traefik functionality will not be available")
	} else {
		log.Println("Successfully initialized dynamic client for Traefik")
	}

	// Initialize database client with configurable host
	dbClient, err := NewDBClient(dbHost)
	if err != nil {
		log.Printf("Warning: Could not connect to PostgreSQL database: %v", err)
		log.Println("Database functionality will not be available")
		dbClient = nil
	} else {
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
		w.Write([]byte("K3s Database SaaS API is running"))
	}).Methods("GET")

	// Database creation endpoint - UPDATED TO MATCH ACTUAL INGRESSROUTE PATTERN
	r.HandleFunc("/api/databases", func(w http.ResponseWriter, r *http.Request) {
		var dbRequest DatabaseRequest
		if err := json.NewDecoder(r.Body).Decode(&dbRequest); err != nil {
			fmt.Println("Error parsing request:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		fmt.Println("Database request received:")
		fmt.Printf("  Type: %s\n", dbRequest.Type)
		fmt.Printf("  Name: %s\n", dbRequest.Name)
		fmt.Printf("  Username: %s\n", dbRequest.Username)
		fmt.Printf("  Password: %s\n", "********")

		if clientset == nil {
			http.Error(w, "Kubernetes client not available", http.StatusInternalServerError)
			return
		}

		var targetNamespace string
		if dbRequest.UserID > 0 && dbRequest.UserName != "" {
			targetNamespace = GetUserNamespace(dbRequest.UserID, dbRequest.UserName)
			fmt.Printf("  Target Namespace: %s (user: %s, ID: %d)\n", targetNamespace, dbRequest.UserName, dbRequest.UserID)

			if err := deployDatabaseToUserNamespace(dbRequest, clientset); err != nil {
				fmt.Printf("Error deploying database: %v\n", err)
				http.Error(w, "Failed to deploy database: "+err.Error(), http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "User information (UserID and UserName) is required", http.StatusBadRequest)
			return
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		if dbRequest.Type == "mysql" {
			port = "3306"
		}

		var host string
		var adminURL string
		var adminType string

		host = fmt.Sprintf("%s.%s.svc.cluster.local", dbRequest.Name, targetNamespace)

		// CORRECTED URL PATTERN TO MATCH ACTUAL INGRESSROUTE: /{namespace}/{dbname}-{admintype}
		if dbRequest.Type == "mysql" {
			adminURL = fmt.Sprintf("http://10.9.21.201/%s/%s-phpmyadmin", targetNamespace, dbRequest.Name)
			adminType = "phpMyAdmin"
		} else {
			adminURL = fmt.Sprintf("http://10.9.21.201/%s/%s-pgadmin/login?next=", targetNamespace, dbRequest.Name)
			adminType = "pgAdmin"
		}

		response := DatabaseResponse{
			Name:      dbRequest.Name,
			Host:      host,
			Port:      port,
			Username:  dbRequest.Username,
			Type:      dbRequest.Type,
			Status:    "creating",
			Message:   fmt.Sprintf("Database and %s dashboard deployment initiated in namespace '%s'", adminType, targetNamespace),
			Namespace: targetNamespace,
			AdminURL:  adminURL,
			AdminType: adminType,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(response)

		fmt.Println("Response sent to React frontend")
	}).Methods("POST")

	// Database deletion endpoint
	r.HandleFunc("/api/databases/{namespace}/{name}", func(w http.ResponseWriter, r *http.Request) {
		if clientset == nil || dynamicClient == nil {
			http.Error(w, "Kubernetes clients not available", http.StatusInternalServerError)
			return
		}

		// Get parameters from URL
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		dbName := vars["name"]

		fmt.Printf("🗑️ Received request to delete database '%s' from namespace '%s'\n", dbName, namespace)

		// Delete the database deployment
		if err := deleteDatabaseDeployment(dbName, namespace); err != nil {
			fmt.Printf("Error deleting database: %v\n", err)
			http.Error(w, "Failed to delete database: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Send success response
		response := map[string]interface{}{
			"success":   true,
			"message":   fmt.Sprintf("Database '%s' deleted successfully from namespace '%s'", dbName, namespace),
			"name":      dbName,
			"namespace": namespace,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		fmt.Printf("✅ Database '%s' deleted successfully\n", dbName)
	}).Methods("DELETE")

	// List databases for a namespace endpoint
	r.HandleFunc("/api/databases/{namespace}", func(w http.ResponseWriter, r *http.Request) {
		if clientset == nil {
			http.Error(w, "Kubernetes client not available", http.StatusInternalServerError)
			return
		}

		vars := mux.Vars(r)
		namespace := vars["namespace"]

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

	// Register other handlers...
	if clientset != nil {
		RegisterPodsHandler(r, clientset)
		fmt.Println("Pod viewing endpoints registered at /api/pods")
	}

	RegisterDeploymentHandler(r)
	fmt.Println("Deployment handler registered at /api/deploy")

	if dbClient != nil {
		RegisterAuthHandlers(r, dbClient)

		// User creation endpoints (keeping your existing logic)
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

			fmt.Printf("Creating user: %s %s\n", userRequest.FirstName, userRequest.LastName)

			user, err := dbClient.CreateUser(userRequest.LastName, userRequest.FirstName)
			if err != nil {
				fmt.Printf("Error creating user: %v\n", err)
				http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(user)
			fmt.Printf("User created with ID: %d\n", user.ID)
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

		fmt.Println("User API endpoints registered at /api/users")
	}

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Start server
	port := "8080"
	fmt.Printf("✅ Server starting on http://localhost:%s\n", port)
	fmt.Println("Waiting for requests from React...")
	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}

// deployDatabaseToUserNamespace deploys database resources using Go client with Traefik
func deployDatabaseToUserNamespace(dbRequest DatabaseRequest, clientset *kubernetes.Clientset) error {
	userNamespace := GetUserNamespace(dbRequest.UserID, dbRequest.UserName)

	fmt.Printf("🚀 Deploying %s database '%s' to namespace '%s'\n", dbRequest.Type, dbRequest.Name, userNamespace)

	ctx := context.Background()

	// Ensure namespace exists
	if err := ensureNamespace(ctx, clientset, userNamespace); err != nil {
		return fmt.Errorf("failed to ensure namespace: %w", err)
	}

	if dbRequest.Type == "mysql" {
		return deployMySQL(ctx, clientset, dbRequest, userNamespace)
	} else {
		return deployPostgreSQL(ctx, clientset, dbRequest, userNamespace)
	}
}

// ensureNamespace creates namespace if it doesn't exist

// getDynamicClient creates a dynamic client for Traefik resources
func getDynamicClient() (dynamic.Interface, error) {
	var config *rest.Config
	var err error

	// Try in-cluster configuration first
	config, err = rest.InClusterConfig()
	if err != nil {
		if os.Getenv("KUBERNETES_SERVICE_HOST") == "" {
			kubeconfig := "kubeconfig.yaml"
			if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
				kubeconfig = os.Getenv("KUBECONFIG")
				if kubeconfig == "" {
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
			fmt.Printf("Using kubeconfig file: %s\n", kubeconfig)
		} else {
			return nil, fmt.Errorf("failed to get in-cluster config: %w", err)
		}
	} else {
		fmt.Println("Using in-cluster configuration (ServiceAccount)")
	}
	config.UserAgent = "tbdback/1.0"
	return dynamic.NewForConfig(config)
}

// getKubernetesClient creates a Kubernetes client from in-cluster config or kubeconfig
func getKubernetesClient() (*kubernetes.Clientset, error) {
	var config *rest.Config
	var err error

	// Try in-cluster configuration first
	config, err = rest.InClusterConfig()
	if err != nil {
		if os.Getenv("KUBERNETES_SERVICE_HOST") == "" {
			kubeconfig := "kubeconfig.yaml"
			if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
				kubeconfig = os.Getenv("KUBECONFIG")
				if kubeconfig == "" {
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
			fmt.Printf("Using kubeconfig file: %s\n", kubeconfig)
		} else {
			return nil, fmt.Errorf("failed to get in-cluster config: %w", err)
		}
	} else {
		fmt.Println("Using in-cluster configuration (ServiceAccount)")
	}
	config.UserAgent = "tbdback/1.0"
	return kubernetes.NewForConfig(config)
}
