package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"
)

// AuthUser represents a user with authentication information
type AuthUser struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	CreatedAt time.Time `json:"createdAt"`
	// Password is omitted from JSON responses
}

// RegisterRequest represents user registration data
type RegisterRequest struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

// LoginRequest represents login data
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse is sent back after successful login
type LoginResponse struct {
	User  AuthUser `json:"user"`
	Token string   `json:"token"`
}

// Create auth-related tables
func (c *DBClient) CreateAuthTablesIfNotExist() error {
	// Create auth_users table if it doesn't exist
	query := `
	CREATE TABLE IF NOT EXISTS auth_users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) NOT NULL UNIQUE,
		email VARCHAR(100) NOT NULL UNIQUE,
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		password_hash VARCHAR(64) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	_, err := c.db.Exec(query)
	if err != nil {
		return fmt.Errorf("error creating auth_users table: %w", err)
	}

	fmt.Println("✅ Authentication tables initialized successfully!")
	return nil
}

// HashPassword creates a SHA-256 hash of the password
func HashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// RegisterUser adds a new user to the database
func (c *DBClient) RegisterUser(req RegisterRequest) (*AuthUser, error) {
	fmt.Printf("🔄 Registering new user: %s (%s)\n", req.Username, req.Email)

	// Hash the password
	passwordHash := HashPassword(req.Password)

	query := `
	INSERT INTO auth_users (username, email, first_name, last_name, password_hash)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id, username, email, first_name, last_name, created_at`

	var user AuthUser
	err := c.db.QueryRow(
		query,
		req.Username,
		req.Email,
		req.FirstName,
		req.LastName,
		passwordHash,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
	)

	if err != nil {
		fmt.Println("❌ Failed to register user")
		return nil, fmt.Errorf("error registering user: %w", err)
	}

	fmt.Printf("✅ User registered successfully with ID: %d\n", user.ID)
	return &user, nil
}

// AuthenticateUser verifies login credentials and returns user information
func (c *DBClient) AuthenticateUser(req LoginRequest) (*AuthUser, error) {
	fmt.Printf("🔄 Authenticating user: %s\n", req.Username)

	// Hash the password for comparison
	passwordHash := HashPassword(req.Password)

	query := `
	SELECT id, username, email, first_name, last_name, created_at
	FROM auth_users
	WHERE username = $1 AND password_hash = $2`

	var user AuthUser
	err := c.db.QueryRow(query, req.Username, passwordHash).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("❌ Authentication failed: Invalid credentials")
			return nil, nil // Invalid credentials
		}
		fmt.Println("❌ Authentication error")
		return nil, fmt.Errorf("error during authentication: %w", err)
	}

	fmt.Printf("✅ User authenticated successfully: %s (ID: %d)\n", user.Username, user.ID)
	return &user, nil
}

// GenerateToken creates a simple token (in a real app, use JWT)
func GenerateToken(userID int) string {
	// In a real application, use JWT with proper signing
	// This is a simplified version for demonstration
	token := fmt.Sprintf("user_%d_%d", userID, time.Now().Unix())
	return hex.EncodeToString([]byte(token))
}
