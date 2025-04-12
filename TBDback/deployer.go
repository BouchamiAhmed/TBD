package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/gorilla/mux"
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
}

// DeploymentResponse contains the result of a deployment operation
type DeploymentResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Name    string `json:"name,omitempty"`
}

// kubeClients holds the various Kubernetes clients
type kubeClients struct {
	clientset     *kubernetes.Clientset
	dynamicClient dynamic.Interface
	restConfig    *rest.Config
}

// global clients that will be initialized in RegisterDeploymentHandler
var clients *kubeClients

// RegisterDeploymentHandler adds the deployment route to the router
func RegisterDeploymentHandler(r *mux.Router) {
	// Initialize Kubernetes clients
	var err error
	clients, err = createKubeClients()
	if err != nil {
		fmt.Printf("Warning: Could not initialize Kubernetes clients: %v\n", err)
		fmt.Println("Deployment functionality will be limited")
	} else {
		fmt.Println("Successfully connected to Kubernetes cluster")
	}

	r.HandleFunc("/api/deploy", handleDeployYAML).Methods("POST")
	fmt.Println("Deployment endpoint registered at /api/deploy")
}

// handleDeployYAML handles requests to deploy the deployment.yaml file
func handleDeployYAML(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Received request to deploy YAML file")

	// Check if K8s clients are available
	if clients == nil || clients.clientset == nil {
		sendErrorResponse(w, "Kubernetes client not available")
		return
	}

	// Parse request body
	var deployRequest DeploymentRequest
	if err := json.NewDecoder(r.Body).Decode(&deployRequest); err != nil {
		fmt.Printf("Error parsing request: %v\n", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set default namespace if not provided
	if deployRequest.Namespace == "" {
		deployRequest.Namespace = "default"
	}

	// Log the deployment request
	fmt.Printf("Deploying '%s' to namespace '%s'\n", deployRequest.Name, deployRequest.Namespace)

	// Deploy the YAML file
	err := deployYAMLFile("deployment.yaml", deployRequest.Namespace)
	if err != nil {
		errMsg := fmt.Sprintf("Error deploying YAML: %v", err)
		fmt.Println(errMsg)
		sendErrorResponse(w, errMsg)
		return
	}

	// Send success response
	fmt.Println("Deployment successful")
	sendSuccessResponse(w, deployRequest.Name)
}

// createKubeClients creates Kubernetes client instances
func createKubeClients() (*kubeClients, error) {
	// First try the kubeconfig file in the current directory
	kubeconfig := "kubeconfig.yaml"

	// Build config from kubeconfig file
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	// Create the clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes clientset: %w", err)
	}

	// Create the dynamic client
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

// deployYAMLFile deploys a Kubernetes resource from a YAML file
func deployYAMLFile(filePath string, namespace string) error {
	// Read YAML file
	yamlFile, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("error reading YAML file: %w", err)
	}

	// Decode YAML to unstructured object
	decoder := yaml.NewDecodingSerializer(unstructured.UnstructuredJSONScheme)
	obj := &unstructured.Unstructured{}

	// Extract GVK and content
	_, gvk, err := decoder.Decode(yamlFile, nil, obj)
	if err != nil {
		return fmt.Errorf("error decoding YAML: %w", err)
	}

	// Override namespace if provided
	if namespace != "" {
		obj.SetNamespace(namespace)
	}

	// Create GVR from GVK
	gvr := schema.GroupVersionResource{
		Group:    gvk.Group,
		Version:  gvk.Version,
		Resource: getPlural(gvk.Kind),
	}

	// Get the dynamic resource interface
	dr := clients.dynamicClient.Resource(gvr)

	// Check if resource already exists
	_, err = dr.Namespace(obj.GetNamespace()).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// Resource doesn't exist, create it
			fmt.Printf("Creating %s '%s' in namespace '%s'\n", gvk.Kind, obj.GetName(), obj.GetNamespace())
			_, err = dr.Namespace(obj.GetNamespace()).Create(context.TODO(), obj, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("error creating resource: %w", err)
			}
		} else {
			return fmt.Errorf("error checking if resource exists: %w", err)
		}
	} else {
		// Resource exists, update it
		fmt.Printf("Updating %s '%s' in namespace '%s'\n", gvk.Kind, obj.GetName(), obj.GetNamespace())
		_, err = dr.Namespace(obj.GetNamespace()).Update(context.TODO(), obj, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("error updating resource: %w", err)
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
	default:
		// Simple pluralization for unknown kinds
		return fmt.Sprintf("%ss", kind)
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
	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
	}
}

// sendSuccessResponse sends a success response to the client
func sendSuccessResponse(w http.ResponseWriter, name string) {
	response := DeploymentResponse{
		Success: true,
		Message: "Deployment successful",
		Name:    name,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
	}
}
