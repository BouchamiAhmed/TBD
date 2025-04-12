package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// PodInfo contains basic information about a pod
type PodInfo struct {
	Name       string    `json:"name"`
	Namespace  string    `json:"namespace"`
	Status     string    `json:"status"`
	IP         string    `json:"ip"`
	Node       string    `json:"node"`
	Age        string    `json:"age"`
	Containers int       `json:"containers"`
	CreatedAt  time.Time `json:"createdAt"`
}

// RegisterPodsHandler adds the pod-related routes to the router
func RegisterPodsHandler(r *mux.Router, clientset *kubernetes.Clientset) {
	// Endpoint to list all pods in the cluster
	r.HandleFunc("/api/pods", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Getting pods list from K3s...")

		// Get pods from all namespaces
		pods, err := clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			fmt.Printf("Error getting pods: %v\n", err)
			http.Error(w, "Failed to get pods: "+err.Error(), http.StatusInternalServerError)
			return
		}

		var podInfoList []PodInfo
		for _, pod := range pods.Items {
			// Calculate pod age
			age := calculateAge(pod.CreationTimestamp.Time)

			// Determine pod status
			status := string(pod.Status.Phase)
			if pod.DeletionTimestamp != nil {
				status = "Terminating"
			}

			podInfo := PodInfo{
				Name:       pod.Name,
				Namespace:  pod.Namespace,
				Status:     status,
				IP:         pod.Status.PodIP,
				Node:       pod.Spec.NodeName,
				Age:        age,
				Containers: len(pod.Spec.Containers),
				CreatedAt:  pod.CreationTimestamp.Time,
			}

			podInfoList = append(podInfoList, podInfo)
		}

		// Send JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"pods":  podInfoList,
			"count": len(podInfoList),
		})

		fmt.Printf("Returned %d pods\n", len(podInfoList))
	}).Methods("GET")

	// Endpoint to get details of a specific pod
	r.HandleFunc("/api/pods/{namespace}/{name}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		fmt.Printf("Getting details for pod %s in namespace %s\n", name, namespace)

		pod, err := clientset.CoreV1().Pods(namespace).Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			fmt.Printf("Error getting pod details: %v\n", err)
			http.Error(w, "Pod not found", http.StatusNotFound)
			return
		}

		// Build a more detailed response with containers, volumes, etc.
		containers := []map[string]interface{}{}
		for _, container := range pod.Spec.Containers {
			containerInfo := map[string]interface{}{
				"name":  container.Name,
				"image": container.Image,
				"ports": container.Ports,
			}
			containers = append(containers, containerInfo)
		}

		podDetails := map[string]interface{}{
			"name":       pod.Name,
			"namespace":  pod.Namespace,
			"status":     pod.Status.Phase,
			"ip":         pod.Status.PodIP,
			"node":       pod.Spec.NodeName,
			"createdAt":  pod.CreationTimestamp.Time,
			"containers": containers,
			"labels":     pod.Labels,
		}

		// Send JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(podDetails)
	}).Methods("GET")
}

// calculateAge returns a human-readable string representing time since the given time
func calculateAge(t time.Time) string {
	duration := time.Since(t)

	if duration.Hours() > 48 {
		days := int(duration.Hours() / 24)
		return fmt.Sprintf("%dd", days)
	} else if duration.Hours() > 1 {
		return fmt.Sprintf("%dh", int(duration.Hours()))
	} else if duration.Minutes() > 1 {
		return fmt.Sprintf("%dm", int(duration.Minutes()))
	} else {
		return fmt.Sprintf("%ds", int(duration.Seconds()))
	}
}
