// TBDback/auth_handlers_ldap.go - Clean version without redeclarations

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-ldap/ldap/v3"
	"github.com/gorilla/mux"
)

// LDAP Manager for user creation operations
type LDAPManager struct {
	Host          string
	Port          int
	AdminDN       string
	AdminPassword string
	BaseDN        string
	conn          *ldap.Conn
}

// LDAP Auth Service client
type LDAPAuthService struct {
	BaseURL string
}

// LDAP response structures
type LDAPAuthResponse struct {
	Success bool `json:"success"`
	User    *struct {
		DN        string `json:"dn"`
		UID       string `json:"uid"`
		Email     string `json:"email"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		UserType  string `json:"userType"`
	} `json:"user,omitempty"`
	Message string `json:"message"`
}

// Enhanced register request with user type
type EnhancedRegisterRequest struct {
	RegisterRequest
	UserType string `json:"userType"` // "internal" or "external"
}

// NewLDAPManager creates LDAP manager for user operations
func NewLDAPManager() *LDAPManager {
	return &LDAPManager{
		Host:          config.LDAPHost,
		Port:          389,
		AdminDN:       "cn=admin,dc=dbsaas,dc=local",
		AdminPassword: "admin123",
		BaseDN:        "dc=dbsaas,dc=local",
	}
}

// Connect to LDAP with admin privileges
func (lm *LDAPManager) Connect() error {
	var err error

	lm.conn, err = ldap.Dial("tcp", fmt.Sprintf("%s:%d", lm.Host, lm.Port))
	if err != nil {
		return fmt.Errorf("failed to connect to LDAP: %w", err)
	}

	err = lm.conn.Bind(lm.AdminDN, lm.AdminPassword)
	if err != nil {
		return fmt.Errorf("failed to bind as admin: %w", err)
	}

	return nil
}

// Close LDAP connection
func (lm *LDAPManager) Close() {
	if lm.conn != nil {
		lm.conn.Close()
	}
}

// CreateLDAPUser creates user in LDAP
func (lm *LDAPManager) CreateLDAPUser(req EnhancedRegisterRequest) error {
	if lm.conn == nil {
		return fmt.Errorf("LDAP connection not established")
	}

	// Determine organizational unit and group
	baseDN := "ou=users,ou=external,dc=dbsaas,dc=local"
	gidNumber := "2001" // clients group
	if req.UserType == "internal" {
		baseDN = "ou=users,ou=internal,dc=dbsaas,dc=local"
		gidNumber = "1001" // admins group
	}

	// Generate unique uidNumber
	uidNumber := fmt.Sprintf("%d", time.Now().Unix()%100000+1000)

	// Create DN
	userDN := fmt.Sprintf("uid=%s,%s", req.Username, baseDN)

	// Prepare add request
	addRequest := ldap.NewAddRequest(userDN, nil)

	// Add object classes
	addRequest.Attribute("objectClass", []string{"inetOrgPerson", "posixAccount", "top"})

	// Add attributes
	addRequest.Attribute("uid", []string{req.Username})
	addRequest.Attribute("cn", []string{fmt.Sprintf("%s %s", req.FirstName, req.LastName)})
	addRequest.Attribute("sn", []string{req.LastName})
	addRequest.Attribute("givenName", []string{req.FirstName})
	addRequest.Attribute("mail", []string{req.Email})
	addRequest.Attribute("userPassword", []string{req.Password})
	addRequest.Attribute("uidNumber", []string{uidNumber})
	addRequest.Attribute("gidNumber", []string{gidNumber})
	addRequest.Attribute("homeDirectory", []string{fmt.Sprintf("/home/users/%s", req.Username)})

	// Create user
	err := lm.conn.Add(addRequest)
	if err != nil {
		return fmt.Errorf("failed to create LDAP user: %w", err)
	}

	return nil
}

func (las *LDAPAuthService) VerifyLDAPCredentials(username, password string) (*LDAPAuthResponse, error) {
	authReq := map[string]string{
		"username": username,
		"password": password,
	}

	jsonData, err := json.Marshal(authReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := http.Post(las.BaseURL+"/auth/verify", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("LDAP service unavailable: %w", err)
	}
	defer resp.Body.Close()

	var authResp LDAPAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return nil, fmt.Errorf("failed to decode LDAP response: %w", err)
	}

	return &authResp, nil
}

// RegisterEnhancedAuthHandlers with LDAP integration - NO database method redeclarations
func RegisterEnhancedAuthHandlers(r *mux.Router, dbClient *DBClient) {
	ldapService := GetLDAPAuthService()

	// Create auth tables
	if err := dbClient.CreateAuthTablesIfNotExist(); err != nil {
		fmt.Printf("Error initializing auth tables: %v\n", err)
	}

	// Enhanced registration - creates LDAP users
	r.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		var registerRequest EnhancedRegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&registerRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if registerRequest.Username == "" || registerRequest.Password == "" ||
			registerRequest.Email == "" || registerRequest.FirstName == "" ||
			registerRequest.LastName == "" {
			http.Error(w, "All fields are required", http.StatusBadRequest)
			return
		}

		// Default to external
		if registerRequest.UserType == "" {
			registerRequest.UserType = "external"
		}

		fmt.Printf("🔄 Registering new LDAP user: %s (%s)\n", registerRequest.Username, registerRequest.UserType)

		// Create LDAP manager and connect
		ldapManager := GetLDAPManager()
		err := ldapManager.Connect()
		if err != nil {
			fmt.Printf("❌ LDAP connection failed: %v\n", err)
			http.Error(w, "LDAP service unavailable", http.StatusServiceUnavailable)
			return
		}
		defer ldapManager.Close()

		// Create user in LDAP
		err = ldapManager.CreateLDAPUser(registerRequest)
		if err != nil {
			fmt.Printf("❌ Failed to create LDAP user: %v\n", err)
			if strings.Contains(err.Error(), "already exists") {
				http.Error(w, "Username already exists", http.StatusConflict)
			} else {
				http.Error(w, "Failed to create user account", http.StatusInternalServerError)
			}
			return
		}

		response := struct {
			Success  bool   `json:"success"`
			Message  string `json:"message"`
			Username string `json:"username"`
			UserType string `json:"userType"`
		}{
			Success:  true,
			Message:  "User created successfully in LDAP. You can now login.",
			Username: registerRequest.Username,
			UserType: registerRequest.UserType,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)

		fmt.Printf("✅ LDAP user registered: %s (%s)\n", registerRequest.Username, registerRequest.UserType)

	}).Methods("POST")

	// Enhanced login with LDAP → PostgreSQL flow
	r.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		var loginRequest LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if loginRequest.Username == "" || loginRequest.Password == "" {
			http.Error(w, "Username and password required", http.StatusBadRequest)
			return
		}

		fmt.Printf("🔄 Processing login for: %s\n", loginRequest.Username)

		// Try LDAP authentication first
		ldapResp, err := ldapService.VerifyLDAPCredentials(loginRequest.Username, loginRequest.Password)
		if err != nil {
			fmt.Printf("⚠️  LDAP service error: %v\n", err)
			// Fallback to local auth
			handleLocalAuth(w, dbClient, loginRequest)
			return
		}

		if !ldapResp.Success {
			fmt.Printf("❌ LDAP authentication failed for: %s\n", loginRequest.Username)
			// Fallback to local auth
			handleLocalAuth(w, dbClient, loginRequest)
			return
		}

		fmt.Printf("✅ LDAP authentication successful: %s (%s)\n",
			ldapResp.User.UID, ldapResp.User.UserType)

		// Check if user exists in PostgreSQL
		user, err := dbClient.GetUserByUsername(ldapResp.User.UID)
		if err != nil {
			// Create user from LDAP info
			fmt.Printf("🔄 Creating PostgreSQL user from LDAP: %s\n", ldapResp.User.UID)

			user, err = dbClient.CreateUserFromLDAP(ldapResp.User)
			if err != nil {
				fmt.Printf("❌ Failed to create user: %v\n", err)
				http.Error(w, "Failed to create user account", http.StatusInternalServerError)
				return
			}

			// Create Kubernetes namespace
			if err := CreateNamespaceForUser(user.ID, user.Username); err != nil {
				fmt.Printf("⚠️  Warning: Failed to create namespace: %v\n", err)
			} else {
				fmt.Printf("✅ Namespace created: %s\n", GetUserNamespace(user.ID, user.Username))
			}
		}

		// Generate token
		token := GenerateToken(user.ID)

		response := struct {
			User     AuthUser `json:"user"`
			Token    string   `json:"token"`
			UserType string   `json:"userType"`
			LDAPAuth bool     `json:"ldapAuth"`
		}{
			User:     *user,
			Token:    token,
			UserType: ldapResp.User.UserType,
			LDAPAuth: true,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)

		fmt.Printf("✅ LDAP login complete: %s (ID:%d, Type:%s)\n",
			user.Username, user.ID, ldapResp.User.UserType)

	}).Methods("POST")

	// Health check
	r.HandleFunc("/api/auth/health", func(w http.ResponseWriter, r *http.Request) {
		ldapHealthy := "unhealthy"
		if resp, err := http.Get(ldapService.BaseURL + "/health"); err == nil && resp.StatusCode == 200 {
			ldapHealthy = "healthy"
		}

		health := map[string]interface{}{
			"status":       "healthy",
			"database":     "connected",
			"ldap_service": ldapHealthy,
			"timestamp":    time.Now(),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(health)
	}).Methods("GET")
}

// Helper: Handle local authentication fallback
func handleLocalAuth(w http.ResponseWriter, dbClient *DBClient, loginRequest LoginRequest) {
	fmt.Printf("🔄 Trying local authentication: %s\n", loginRequest.Username)

	user, err := dbClient.AuthenticateUser(loginRequest)
	if err != nil {
		fmt.Printf("❌ Local authentication failed: %v\n", err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token := GenerateToken(user.ID)

	response := struct {
		User     AuthUser `json:"user"`
		Token    string   `json:"token"`
		UserType string   `json:"userType"`
		LDAPAuth bool     `json:"ldapAuth"`
	}{
		User:     *user,
		Token:    token,
		UserType: "local",
		LDAPAuth: false,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	fmt.Printf("✅ Local login successful: %s (ID:%d)\n", user.Username, user.ID)
}
