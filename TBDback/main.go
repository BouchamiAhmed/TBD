package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

// Basic database request from React frontend
type DatabaseRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`
	Type     string `json:"type"` // mysql or postgres
}

// Response to send back to React
type DatabaseResponse struct {
	Name     string `json:"name"`
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Type     string `json:"type"`
	Status   string `json:"status"`
	Message  string `json:"message"`
}

func main() {
	// Initialize Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		log.Printf("Warning: Could not connect to Kubernetes: %v", err)
		log.Println("Pod viewing functionality will not be available")
		clientset = nil
	} else {
		log.Println("Successfully connected to Kubernetes cluster")
	}

	// Initialize router
	r := mux.NewRouter()

	// Root endpoint
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("API root accessed")
		w.Write([]byte("K3s Database SaaS API is running"))
	}).Methods("GET")

	// Database creation endpoint
	r.HandleFunc("/api/databases", func(w http.ResponseWriter, r *http.Request) {
		// Print Hello World to console
		fmt.Println("\n====================================")
		fmt.Println("HELLO WORLD: BUTTON CLICKED IN REACT!")
		fmt.Println("====================================\n")

		// Parse request body
		var dbRequest DatabaseRequest
		if err := json.NewDecoder(r.Body).Decode(&dbRequest); err != nil {
			fmt.Println("Error parsing request:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Log details about the request
		fmt.Println("Database request received:")
		fmt.Printf("  Type: %s\n", dbRequest.Type)
		fmt.Printf("  Name: %s\n", dbRequest.Name)
		fmt.Printf("  Username: %s\n", dbRequest.Username)
		fmt.Printf("  Password: %s\n", "********") // Don't log actual password

		// Create mock port based on database type
		port := "5432"
		if dbRequest.Type == "mysql" {
			port = "3306"
		}

		// Create mock response
		response := DatabaseResponse{
			Name:     dbRequest.Name,
			Host:     fmt.Sprintf("%s.default.svc.cluster.local", dbRequest.Name),
			Port:     port,
			Username: dbRequest.Username,
			Type:     dbRequest.Type,
			Status:   "creating",
			Message:  "Database is being created (simulation)",
		}

		// Send response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(response)

		fmt.Println("Response sent to React frontend")
	}).Methods("POST")

	// Register pod viewing handlers if we have Kubernetes access
	if clientset != nil {
		RegisterPodsHandler(r, clientset)
		fmt.Println("Pod viewing endpoints registered at /api/pods")
	}

	// Register deployment handler
	RegisterDeploymentHandler(r)
	fmt.Println("Deployment handler registered at /api/deploy")

	// CORS setup to allow requests from React
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allow all origins for testing
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Start server
	port := "8080"
	fmt.Printf("Server starting on http://localhost:%s\n", port)
	fmt.Println("Waiting for requests from React...")
	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}

// getKubernetesClient creates a Kubernetes client from kubeconfig
func getKubernetesClient() (*kubernetes.Clientset, error) {
	// First try the kubeconfig file in the current directory
	kubeconfig := "kubeconfig.yaml"
	if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
		// If not found, check environment variable
		kubeconfig = os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			// As last resort, try the default location
			homeDir, err := os.UserHomeDir()
			if err != nil {
				return nil, fmt.Errorf("failed to get home directory: %w", err)
			}
			kubeconfig = filepath.Join(homeDir, ".kube", "config")
		}
	}

	fmt.Printf("Using kubeconfig file: %s\n", kubeconfig)

	// Build config from kubeconfig file
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	// Create the clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %w", err)
	}

	return clientset, nil
}
