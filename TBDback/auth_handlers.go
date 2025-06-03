package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// RegisterAuthHandlers adds the authentication routes to the router
func RegisterAuthHandlers(r *mux.Router, dbClient *DBClient) {
	// Create auth tables
	if err := dbClient.CreateAuthTablesIfNotExist(); err != nil {
		fmt.Printf("Error initializing auth tables: %v\n", err)
	}

	// Register user
	r.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		// Parse request body
		var registerRequest RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&registerRequest); err != nil {
			fmt.Println("Error parsing registration request:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate request
		if registerRequest.Username == "" || registerRequest.Password == "" ||
			registerRequest.Email == "" || registerRequest.FirstName == "" ||
			registerRequest.LastName == "" {
			http.Error(w, "All fields are required", http.StatusBadRequest)
			return
		}

		// Register the user
		user, err := dbClient.RegisterUser(registerRequest)
		if err != nil {
			// Check for duplicate username/email
			if err.Error() == "error registering user: pq: duplicate key value violates unique constraint \"auth_users_username_key\"" {
				http.Error(w, "Username already exists", http.StatusConflict)
				return
			}
			if err.Error() == "error registering user: pq: duplicate key value violates unique constraint \"auth_users_email_key\"" {
				http.Error(w, "Email already exists", http.StatusConflict)
				return
			}

			fmt.Printf("Error registering user: %v\n", err)
			http.Error(w, "Failed to register user", http.StatusInternalServerError)
			return
		}

		// Create Kubernetes namespace for the new user
		fmt.Printf("🔄 Creating Kubernetes namespace for user %s (ID: %d)\n", user.Username, user.ID)
		if err := CreateNamespaceForUser(user.ID, user.Username); err != nil {
			fmt.Printf("⚠️  Warning: Failed to create namespace for user %s: %v\n", user.Username, err)
			// Note: We don't fail the registration if namespace creation fails
			// The user can still be registered, but they won't have their own namespace
		} else {
			fmt.Printf("✅ Namespace created successfully for user %s\n", user.Username)
		}

		// Generate token for the new user
		token := GenerateToken(user.ID)

		// Send success response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(LoginResponse{
			User:  *user,
			Token: token,
		})
	}).Methods("POST")

	// Login user
	r.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		// Parse request body
		var loginRequest LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
			fmt.Println("Error parsing login request:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate request
		if loginRequest.Username == "" || loginRequest.Password == "" {
			http.Error(w, "Username and password are required", http.StatusBadRequest)
			return
		}

		// Authenticate the user
		user, err := dbClient.AuthenticateUser(loginRequest)
		if err != nil {
			fmt.Printf("Error during authentication: %v\n", err)
			http.Error(w, "Authentication error", http.StatusInternalServerError)
			return
		}

		if user == nil {
			// Invalid credentials
			http.Error(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}

		// Generate token
		token := GenerateToken(user.ID)

		// Send success response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(LoginResponse{
			User:  *user,
			Token: token,
		})
	}).Methods("POST")

	fmt.Println("Authentication endpoints registered at /api/auth")
}
