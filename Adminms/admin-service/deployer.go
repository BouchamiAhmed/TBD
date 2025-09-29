package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer/yaml"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// DeploymentRequest represents a request to deploy a YAML file
type DeploymentRequest struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
	UserID    int    `json:"userId,omitempty"`
	Username  string `json:"username,omitempty"`
}

// DeploymentResponse contains the result of a deployment operation
type DeploymentResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Name    string `json:"name,omitempty"`
}

// DatabaseRequest represents a request to create a database
type DatabaseRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`
	Type     string `json:"type"`               // mysql or postgres
	UserID   int    `json:"userId,omitempty"`   // User ID for namespace targeting
	UserName string `json:"userName,omitempty"` // Username for namespace targeting
}

// DatabaseResponse contains the result of a database creation operation
type DatabaseResponse struct {
	Name      string `json:"name"`
	Host      string `json:"host"`
	Port      string `json:"port"`
	Username  string `json:"username"`
	Type      string `json:"type"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Namespace string `json:"namespace,omitempty"` // Include namespace in response
	AdminURL  string `json:"adminUrl,omitempty"`  // Admin dashboard URL
	AdminType string `json:"adminType,omitempty"` // Type of admin dashboard (pgadmin/phpmyadmin)
}

// NamespaceRequest represents a request to create a namespace for a user
type NamespaceRequest struct {
	UserID   int    `json:"userId"`
	Username string `json:"username"`
}

// NamespaceResponse contains the result of a namespace creation operation
type NamespaceResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	Namespace string `json:"namespace,omitempty"`
}

// kubeClients holds the various Kubernetes clients
type kubeClients struct {
	clientset     *kubernetes.Clientset
	dynamicClient dynamic.Interface
	restConfig    *rest.Config
}

// global clients that will be initialized in RegisterDeploymentHandler
var clients *kubeClients

// GetUserNamespace returns the namespace name for a given user
func GetUserNamespace(userID int, username string) string {
	namespaceName := fmt.Sprintf("%d%s", userID, username)
	if len(namespaceName) > 63 {
		namespaceName = namespaceName[:63]
	}
	return namespaceName
}

// CreateNamespaceForUser creates a namespace for a new user (used during registration)
func CreateNamespaceForUser(userID int, username string) error {
	if clients == nil || clients.clientset == nil {
		return fmt.Errorf("kubernetes client not available")
	}

	namespaceName := GetUserNamespace(userID, username)
	return ensureNamespaceExists(namespaceName, userID, username)
}

// RegisterDeploymentHandler adds the deployment route to the router
func RegisterDeploymentHandler(r *mux.Router) {
	// Initialize Kubernetes clients for YAML deployment (separate from main clientset)
	var err error
	clients, err = createKubeClients()
	if err != nil {
		fmt.Printf("Warning: Could not initialize deployment Kubernetes clients: %v\n", err)
		fmt.Println("YAML deployment functionality will be limited")
	} else {
		fmt.Println("Successfully connected to Kubernetes cluster for deployments")
	}

	r.HandleFunc("/api/deploy", handleDeployYAML).Methods("POST")
	r.HandleFunc("/api/namespace/create", handleCreateUserNamespace).Methods("POST")
	fmt.Println("Deployment endpoint registered at /api/deploy")
	fmt.Println("Namespace creation endpoint registered at /api/namespace/create")
}

// handleCreateUserNamespace handles requests to create a namespace for a new user
func handleCreateUserNamespace(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Received request to create user namespace")

	if clients == nil || clients.clientset == nil {
		sendNamespaceErrorResponse(w, "Kubernetes client not available")
		return
	}

	var nsRequest NamespaceRequest
	if err := json.NewDecoder(r.Body).Decode(&nsRequest); err != nil {
		fmt.Printf("Error parsing namespace request: %v\n", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if nsRequest.UserID <= 0 || nsRequest.Username == "" {
		fmt.Println("Invalid user ID or username")
		sendNamespaceErrorResponse(w, "User ID and username are required")
		return
	}

	namespaceName := GetUserNamespace(nsRequest.UserID, nsRequest.Username)
	fmt.Printf("Creating namespace '%s' for user ID %d (%s)\n", namespaceName, nsRequest.UserID, nsRequest.Username)

	err := ensureNamespaceExists(namespaceName, nsRequest.UserID, nsRequest.Username)
	if err != nil {
		errMsg := fmt.Sprintf("Error creating namespace: %v", err)
		fmt.Println(errMsg)
		sendNamespaceErrorResponse(w, errMsg)
		return
	}

	fmt.Printf("Namespace '%s' created successfully\n", namespaceName)
	sendNamespaceSuccessResponse(w, namespaceName)
}

// handleDeployYAML handles requests to deploy the deployment.yaml file
func handleDeployYAML(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Received request to deploy YAML file")

	if clients == nil || clients.clientset == nil {
		sendErrorResponse(w, "Kubernetes client not available")
		return
	}

	var deployRequest DeploymentRequest
	if err := json.NewDecoder(r.Body).Decode(&deployRequest); err != nil {
		fmt.Printf("Error parsing request: %v\n", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var targetNamespace string

	// If UserID and Username are provided, use the user's dedicated namespace
	if deployRequest.UserID > 0 && deployRequest.Username != "" {
		targetNamespace = GetUserNamespace(deployRequest.UserID, deployRequest.Username)
		fmt.Printf("🎯 Deploying to user's dedicated namespace: %s\n", targetNamespace)

		// Ensure the user's namespace exists before deploying
		if err := ensureNamespaceExists(targetNamespace, deployRequest.UserID, deployRequest.Username); err != nil {
			errMsg := fmt.Sprintf("Error ensuring user namespace exists: %v", err)
			fmt.Println(errMsg)
			sendErrorResponse(w, errMsg)
			return
		}
	} else {
		targetNamespace = deployRequest.Namespace
		if targetNamespace == "" {
			targetNamespace = "default"
		}
	}

	fmt.Printf("Deploying '%s' to namespace '%s'\n", deployRequest.Name, targetNamespace)

	// Read and deploy the YAML file
	yamlContent, err := os.ReadFile("deployment.yaml")
	if err != nil {
		errMsg := fmt.Sprintf("Error reading deployment.yaml file: %v", err)
		fmt.Println(errMsg)
		sendErrorResponse(w, errMsg)
		return
	}

	err = deployYAMLContent(string(yamlContent), targetNamespace)
	if err != nil {
		errMsg := fmt.Sprintf("Error deploying YAML: %v", err)
		fmt.Println(errMsg)
		sendErrorResponse(w, errMsg)
		return
	}

	fmt.Println("Deployment successful")
	sendSuccessResponse(w, deployRequest.Name)
}

// ensureNamespaceExists checks if a namespace exists and creates it if it doesn't
func ensureNamespaceExists(namespaceName string, userID int, username string) error {
	// Check if namespace already exists
	_, err := clients.clientset.CoreV1().Namespaces().Get(context.TODO(), namespaceName, metav1.GetOptions{})
	if err == nil {
		fmt.Printf("✅ Namespace '%s' already exists\n", namespaceName)
		return nil
	}

	if !errors.IsNotFound(err) {
		return fmt.Errorf("error checking if namespace exists: %w", err)
	}

	// Namespace doesn't exist, create it
	fmt.Printf("🔄 Creating namespace '%s'\n", namespaceName)
	return createUserNamespace(namespaceName, userID, username)
}

// createUserNamespace creates a Kubernetes namespace for a user
func createUserNamespace(namespaceName string, userID int, username string) error {
	namespace := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespaceName,
			Labels: map[string]string{
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/user-id":              fmt.Sprintf("%d", userID),
				"db-saas/username":             username,
				"db-saas/type":                 "user-namespace",
			},
			Annotations: map[string]string{
				"db-saas/created-for": fmt.Sprintf("User %s (ID: %d)", username, userID),
				"db-saas/description": "Dedicated namespace for user databases and resources",
			},
		},
	}

	_, err := clients.clientset.CoreV1().Namespaces().Create(context.TODO(), namespace, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("error creating namespace: %w", err)
	}

	fmt.Printf("✅ Namespace '%s' created successfully for user %s (ID: %d)\n", namespaceName, username, userID)
	return nil
}

// createKubeClients creates Kubernetes client instances for YAML deployment
func createKubeClients() (*kubeClients, error) {
	kubeconfig := "kubeconfig.yaml"

	// Try different kubeconfig locations
	if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
		kubeconfig = os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			homeDir, err := os.UserHomeDir()
			if err != nil {
				return nil, fmt.Errorf("failed to get home directory: %w", err)
			}
			kubeconfig = homeDir + "/.kube/config"
		}
	}

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes clientset: %w", err)
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes dynamic client: %w", err)
	}

	return &kubeClients{
		clientset:     clientset,
		dynamicClient: dynamicClient,
		restConfig:    config,
	}, nil
}

// deployYAMLContent deploys Kubernetes resources from YAML content string
func deployYAMLContent(yamlContent string, namespace string) error {
	yamlDocs := strings.Split(yamlContent, "---")

	for i, yamlDoc := range yamlDocs {
		yamlDoc = strings.TrimSpace(yamlDoc)
		if yamlDoc == "" {
			continue
		}

		fmt.Printf("📄 Processing YAML document %d/%d\n", i+1, len(yamlDocs))

		decoder := yaml.NewDecodingSerializer(unstructured.UnstructuredJSONScheme)
		obj := &unstructured.Unstructured{}

		_, gvk, err := decoder.Decode([]byte(yamlDoc), nil, obj)
		if err != nil {
			return fmt.Errorf("error decoding YAML document %d: %w", i+1, err)
		}

		if namespace != "" {
			obj.SetNamespace(namespace)
		}

		gvr := schema.GroupVersionResource{
			Group:    gvk.Group,
			Version:  gvk.Version,
			Resource: getPlural(gvk.Kind),
		}

		dr := clients.dynamicClient.Resource(gvr)

		_, err = dr.Namespace(obj.GetNamespace()).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
		if err != nil {
			if errors.IsNotFound(err) {
				fmt.Printf("Creating %s '%s' in namespace '%s'\n", gvk.Kind, obj.GetName(), obj.GetNamespace())
				_, err = dr.Namespace(obj.GetNamespace()).Create(context.TODO(), obj, metav1.CreateOptions{})
				if err != nil {
					return fmt.Errorf("error creating resource %s '%s': %w", gvk.Kind, obj.GetName(), err)
				}
			} else {
				return fmt.Errorf("error checking if resource exists: %w", err)
			}
		} else {
			fmt.Printf("Updating %s '%s' in namespace '%s'\n", gvk.Kind, obj.GetName(), obj.GetNamespace())
			_, err = dr.Namespace(obj.GetNamespace()).Update(context.TODO(), obj, metav1.UpdateOptions{})
			if err != nil {
				return fmt.Errorf("error updating resource %s '%s': %w", gvk.Kind, obj.GetName(), err)
			}
		}
	}

	return nil
}

// getPlural returns the plural form of common Kubernetes resources
func getPlural(kind string) string {
	switch kind {
	case "Deployment":
		return "deployments"
	case "Service":
		return "services"
	case "Pod":
		return "pods"
	case "ConfigMap":
		return "configmaps"
	case "Secret":
		return "secrets"
	case "PersistentVolumeClaim":
		return "persistentvolumeclaims"
	case "StatefulSet":
		return "statefulsets"
	case "DaemonSet":
		return "daemonsets"
	case "Ingress":
		return "ingresses"
	case "IngressRoute":
		return "ingressroutes"
	case "Middleware":
		return "middlewares"
	default:
		return strings.ToLower(kind) + "s"
	}
}

// sendErrorResponse sends an error response to the client
func sendErrorResponse(w http.ResponseWriter, errorMessage string) {
	response := DeploymentResponse{
		Success: false,
		Message: errorMessage,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(response)
}

// sendSuccessResponse sends a success response to the client
func sendSuccessResponse(w http.ResponseWriter, name string) {
	response := DeploymentResponse{
		Success: true,
		Message: "Deployment successful",
		Name:    name,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// sendNamespaceErrorResponse sends an error response for namespace operations
func sendNamespaceErrorResponse(w http.ResponseWriter, errorMessage string) {
	response := NamespaceResponse{
		Success: false,
		Message: errorMessage,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(response)
}

// sendNamespaceSuccessResponse sends a success response for namespace operations
func sendNamespaceSuccessResponse(w http.ResponseWriter, namespaceName string) {
	response := NamespaceResponse{
		Success:   true,
		Message:   "Namespace created successfully",
		Namespace: namespaceName,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
