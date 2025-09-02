// database_handler.go - Fixed database deployment functions

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"k8s.io/client-go/kubernetes"
)

// deployDatabaseToUserNamespace deploys database resources to a user's namespace
func deployDatabaseToUserNamespace(dbRequest DatabaseRequest, clientset *kubernetes.Clientset) (*DatabaseResponse, error) {
	// Get the user's namespace
	userNamespace := GetUserNamespace(dbRequest.UserID, dbRequest.UserName)

	fmt.Printf("🚀 Deploying %s database '%s' to namespace '%s'\n", dbRequest.Type, dbRequest.Name, userNamespace)

	ctx := context.Background()

	// Ensure namespace exists
	if err := ensureNamespace(ctx, clientset, userNamespace); err != nil {
		return nil, fmt.Errorf("failed to ensure namespace: %w", err)
	}

	// Deploy based on database type
	var err error
	if dbRequest.Type == "mysql" {
		err = deployMySQL(ctx, clientset, dbRequest, userNamespace)
	} else if dbRequest.Type == "postgres" || dbRequest.Type == "postgresql" {
		err = deployPostgreSQL(ctx, clientset, dbRequest, userNamespace)
	} else {
		return nil, fmt.Errorf("unsupported database type: %s", dbRequest.Type)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to deploy %s database: %w", dbRequest.Type, err)
	}

	// Prepare the response
	var port string
	var adminURL string
	var adminType string

	if dbRequest.Type == "mysql" {
		port = "3306"
		adminURL = fmt.Sprintf("http://10.9.21.201/%s/%s-phpmyadmin", userNamespace, dbRequest.Name)
		adminType = "phpMyAdmin"
	} else {
		port = "5432"
		adminURL = fmt.Sprintf("http://10.9.21.201/%s/%s-pgadmin", userNamespace, dbRequest.Name)
		adminType = "pgAdmin"
	}

	host := fmt.Sprintf("%s.%s.svc.cluster.local", dbRequest.Name, userNamespace)

	response := &DatabaseResponse{
		Name:      dbRequest.Name,
		Host:      host,
		Port:      port,
		Username:  dbRequest.Username,
		Type:      dbRequest.Type,
		Status:    "deployed",
		Message:   fmt.Sprintf("%s database and %s dashboard deployed successfully", dbRequest.Type, adminType),
		Namespace: userNamespace,
		AdminURL:  adminURL,
		AdminType: adminType,
	}

	fmt.Printf("✅ Database deployment completed: %s\n", dbRequest.Name)
	return response, nil
}

// RegisterDatabaseHandlers registers all database-related endpoints
func RegisterDatabaseHandlers(r *mux.Router, clientset *kubernetes.Clientset, dbClient *DBClient) {
	// Create database endpoint
	r.HandleFunc("/api/databases", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("📋 Database creation request received")

		var dbRequest DatabaseRequest
		if err := json.NewDecoder(r.Body).Decode(&dbRequest); err != nil {
			fmt.Printf("Error parsing database request: %v\n", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate request - Check for UserID OR (UserName for backward compatibility)
		if dbRequest.Name == "" || dbRequest.Type == "" {
			http.Error(w, "Name and type are required", http.StatusBadRequest)
			return
		}

		// If UserID is 0 but UserName is provided, try to get UserID from database
		if dbRequest.UserID == 0 && dbRequest.UserName != "" && dbClient != nil {
			user, err := dbClient.GetUserByUsername(dbRequest.UserName)
			if err == nil && user != nil {
				dbRequest.UserID = user.ID
				fmt.Printf("📝 Resolved UserID %d for username %s\n", dbRequest.UserID, dbRequest.UserName)
			}
		}

		// Final validation
		if dbRequest.UserID == 0 {
			http.Error(w, "UserID is required (or valid UserName for resolution)", http.StatusBadRequest)
			return
		}

		// Ensure UserName is set for namespace creation
		if dbRequest.UserName == "" {
			// If we have UserID but no UserName, we can still proceed
			// The namespace will just use the ID
			dbRequest.UserName = fmt.Sprintf("user%d", dbRequest.UserID)
		}

		fmt.Printf("📋 Creating %s database: %s for user %d (%s)\n",
			dbRequest.Type, dbRequest.Name, dbRequest.UserID, dbRequest.UserName)

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
				response.Name,
				response.Type,
				response.Host,
				response.Port,
				response.Username,
				response.Namespace,
				dbRequest.UserID,
				response.AdminURL,
				response.AdminType,
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

	// Delete database endpoint
	r.HandleFunc("/api/databases/{namespace}/{name}", func(w http.ResponseWriter, r *http.Request) {
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

		// Remove from PostgreSQL tracking if available
		if dbClient != nil {
			if err := dbClient.DeleteDatabase(dbName, namespace); err != nil {
				fmt.Printf("Warning: Failed to remove database from PostgreSQL tracking: %v\n", err)
			}
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

	// Get databases for a specific user
	r.HandleFunc("/api/users/{userId}/databases", func(w http.ResponseWriter, r *http.Request) {
		if dbClient == nil {
			http.Error(w, "Database client not available", http.StatusInternalServerError)
			return
		}

		vars := mux.Vars(r)
		userIDStr := vars["userId"]

		var userID int
		if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		fmt.Printf("📋 Getting databases for user ID: %d\n", userID)

		databases, err := dbClient.GetDatabasesByUserID(userID)
		if err != nil {
			fmt.Printf("Error getting user databases: %v\n", err)
			http.Error(w, "Failed to get user databases: "+err.Error(), http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"success":   true,
			"userId":    userID,
			"databases": databases,
			"count":     len(databases),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		fmt.Printf("📋 Returned %d databases for user ID %d\n", len(databases), userID)
	}).Methods("GET")

	fmt.Println("✅ Database management endpoints registered")
}
