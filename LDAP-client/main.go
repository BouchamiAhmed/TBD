// Clean LDAP Microservice - ONLY handles LDAP authentication
// ldap-auth-service/main.go

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

// AuthRequest represents incoming auth request
type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthResponse represents auth response
type AuthResponse struct {
	Success bool      `json:"success"`
	User    *LDAPUser `json:"user,omitempty"`
	Message string    `json:"message"`
}

// HealthResponse for health checks
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	LDAP    string `json:"ldap"`
}

// Global LDAP client
var ldapClient *LDAPClient

func main() {
	fmt.Println("🚀 Starting LDAP Authentication Microservice...")

	// Initialize LDAP client
	ldapClient = NewLDAPClient()
	err := ldapClient.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to LDAP: %v", err)
	}
	defer ldapClient.Close()

	// Setup router
	r := mux.NewRouter()

	// Health check endpoint
	r.HandleFunc("/health", healthHandler).Methods("GET")

	// Authentication endpoints
	r.HandleFunc("/auth/verify", verifyHandler).Methods("POST")
	r.HandleFunc("/auth/user/{username}", getUserHandler).Methods("GET")

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("✅ LDAP Auth Service running on :%s\n", port)
	fmt.Println("📋 Available endpoints:")
	fmt.Println("   POST /auth/verify - Verify username/password")
	fmt.Println("   GET /auth/user/{username} - Get user info")
	fmt.Println("   GET /health - Health check")

	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}

// healthHandler provides service health status
func healthHandler(w http.ResponseWriter, r *http.Request) {
	// Test LDAP connectivity
	ldapStatus := "connected"
	if ldapClient == nil || ldapClient.conn == nil {
		ldapStatus = "disconnected"
	}

	response := HealthResponse{
		Status:  "healthy",
		Service: "ldap-auth-service",
		LDAP:    ldapStatus,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// verifyHandler handles authentication requests - ONLY checks LDAP
func verifyHandler(w http.ResponseWriter, r *http.Request) {
	var authReq AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&authReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if authReq.Username == "" || authReq.Password == "" {
		response := AuthResponse{
			Success: false,
			Message: "Username and password required",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	fmt.Printf("🔄 LDAP authentication request for: %s\n", authReq.Username)

	// Authenticate against LDAP ONLY
	user, err := ldapClient.AuthenticateUser(authReq.Username, authReq.Password)
	if err != nil {
		fmt.Printf("❌ LDAP authentication failed for %s: %v\n", authReq.Username, err)
		response := AuthResponse{
			Success: false,
			Message: "Invalid LDAP credentials",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Success response - return LDAP user info
	response := AuthResponse{
		Success: true,
		User:    user,
		Message: "LDAP authentication successful",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	fmt.Printf("✅ LDAP authentication successful: %s (%s)\n", user.UID, user.UserType)
}

// getUserHandler gets user info by username from LDAP (no auth required)
func getUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	if username == "" {
		http.Error(w, "Username required", http.StatusBadRequest)
		return
	}

	fmt.Printf("🔄 Looking up LDAP user: %s\n", username)

	user, err := ldapClient.GetUserByUID(username)
	if err != nil {
		fmt.Printf("❌ User not found in LDAP: %s\n", username)
		response := AuthResponse{
			Success: false,
			Message: "User not found in LDAP",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := AuthResponse{
		Success: true,
		User:    user,
		Message: "User found in LDAP",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	fmt.Printf("✅ LDAP user found: %s (%s)\n", user.UID, user.UserType)
}
