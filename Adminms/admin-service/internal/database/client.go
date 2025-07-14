// internal/database/client.go - Database client for admin service
package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
	"golang.org/x/crypto/bcrypt"
)

// Database connection parameters
const (
	port   = 5432
	dbname = "testdb"
)

// DBClient represents a PostgreSQL database client
type DBClient struct {
	db *sql.DB
}

// NewDBClient creates a new database client with configurable host
func NewDBClient(host, username, password string) (*DBClient, error) {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║                Admin Service Database Connection           ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")

	fmt.Printf("⏳ Attempting to connect to PostgreSQL on %s:%d...\n", host, port)

	// Connection string
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, username, password, dbname)

	// Open doesn't actually connect, it just validates the args
	fmt.Println("🔄 Initializing database driver...")
	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		fmt.Println("❌ Failed to initialize database driver")
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	// Set connection pool settings
	fmt.Println("🔄 Configuring connection pool...")
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verify connection works
	fmt.Println("🔄 Testing connection to PostgreSQL...")
	if err = db.Ping(); err != nil {
		fmt.Println("❌ Failed to connect to PostgreSQL database")
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	fmt.Println("✅ Successfully connected to PostgreSQL database!")
	log.Println("Successfully connected to PostgreSQL database")
	return &DBClient{db: db}, nil
}

// Close closes the database connection
func (c *DBClient) Close() error {
	fmt.Println("👋 Closing database connection...")
	return c.db.Close()
}

// CreateTablesIfNotExist creates necessary tables if they don't exist
func (c *DBClient) CreateTablesIfNotExist() error {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║                Table Initialization                        ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")

	fmt.Println("🔄 Creating users table if it doesn't exist...")

	// Create users table with authentication fields
	usersQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(100) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	_, err := c.db.Exec(usersQuery)
	if err != nil {
		fmt.Println("❌ Failed to create users table")
		return fmt.Errorf("error creating users table: %w", err)
	}

	fmt.Println("🔄 Creating databases table if it doesn't exist...")

	// Create databases table to track created databases
	databasesQuery := `
	CREATE TABLE IF NOT EXISTS databases (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		type VARCHAR(50) NOT NULL,
		host VARCHAR(255) NOT NULL,
		port VARCHAR(10) NOT NULL,
		username VARCHAR(100) NOT NULL,
		namespace VARCHAR(100) NOT NULL,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		admin_url VARCHAR(500),
		admin_type VARCHAR(50),
		status VARCHAR(50) DEFAULT 'creating',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	_, err = c.db.Exec(databasesQuery)
	if err != nil {
		fmt.Println("❌ Failed to create databases table")
		return fmt.Errorf("error creating databases table: %w", err)
	}

	fmt.Println("✅ Database tables initialized successfully!")
	log.Println("Database tables initialized")
	return nil
}

// User represents a user in the database
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Don't include in JSON
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Database represents a database entry
type Database struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Host      string    `json:"host"`
	Port      string    `json:"port"`
	Username  string    `json:"username"`
	Namespace string    `json:"namespace"`
	UserID    int       `json:"userId"`
	AdminURL  string    `json:"adminUrl"`
	AdminType string    `json:"adminType"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateUser adds a new user to the database
func (c *DBClient) CreateUser(username, email, password, firstName, lastName string) (*User, error) {
	fmt.Printf("🔄 Creating new user: %s (%s)...\n", username, email)

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error hashing password: %w", err)
	}

	query := `
	INSERT INTO users (username, email, password_hash, first_name, last_name)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id, username, email, password_hash, first_name, last_name, created_at, updated_at`

	var user User
	err = c.db.QueryRow(query, username, email, string(hashedPassword), firstName, lastName).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		fmt.Println("❌ Failed to create user")
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	fmt.Printf("✅ User created successfully with ID: %d\n", user.ID)
	return &user, nil
}

// AuthenticateUser verifies username/password and returns user if valid
func (c *DBClient) AuthenticateUser(username, password string) (*User, error) {
	fmt.Printf("🔄 Authenticating user: %s...\n", username)

	query := `
	SELECT id, username, email, password_hash, first_name, last_name, created_at, updated_at
	FROM users
	WHERE username = $1`

	var user User
	err := c.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("ℹ️ No user found with username: %s\n", username)
			return nil, fmt.Errorf("invalid credentials")
		}
		fmt.Println("❌ Error retrieving user")
		return nil, fmt.Errorf("error getting user: %w", err)
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		fmt.Printf("❌ Invalid password for user: %s\n", username)
		return nil, fmt.Errorf("invalid credentials")
	}

	fmt.Printf("✅ User authenticated successfully: %s\n", username)
	return &user, nil
}

// GetUserByID retrieves a specific user by ID
func (c *DBClient) GetUserByID(id int) (*User, error) {
	fmt.Printf("🔄 Looking up user with ID: %d...\n", id)

	query := `
	SELECT id, username, email, password_hash, first_name, last_name, created_at, updated_at
	FROM users
	WHERE id = $1`

	var user User
	err := c.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("ℹ️ No user found with ID: %d\n", id)
			return nil, nil
		}
		fmt.Println("❌ Error retrieving user")
		return nil, fmt.Errorf("error getting user by ID: %w", err)
	}

	fmt.Printf("✅ Found user: %s %s (ID: %d)\n", user.FirstName, user.LastName, user.ID)
	return &user, nil
}

// CreateDatabase records a database creation in the database
func (c *DBClient) CreateDatabase(name, dbType, host, port, username, namespace string, userID int, adminURL, adminType string) (*Database, error) {
	fmt.Printf("🔄 Recording database creation: %s...\n", name)

	query := `
	INSERT INTO databases (name, type, host, port, username, namespace, user_id, admin_url, admin_type, status)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	RETURNING id, name, type, host, port, username, namespace, user_id, admin_url, admin_type, status, created_at, updated_at`

	var database Database
	err := c.db.QueryRow(query, name, dbType, host, port, username, namespace, userID, adminURL, adminType, "creating").Scan(
		&database.ID,
		&database.Name,
		&database.Type,
		&database.Host,
		&database.Port,
		&database.Username,
		&database.Namespace,
		&database.UserID,
		&database.AdminURL,
		&database.AdminType,
		&database.Status,
		&database.CreatedAt,
		&database.UpdatedAt,
	)

	if err != nil {
		fmt.Println("❌ Failed to record database")
		return nil, fmt.Errorf("error recording database: %w", err)
	}

	fmt.Printf("✅ Database recorded successfully with ID: %d\n", database.ID)
	return &database, nil
}

// GetUserDatabases retrieves all databases for a specific user
func (c *DBClient) GetUserDatabases(userID int) ([]Database, error) {
	fmt.Printf("🔄 Retrieving databases for user ID: %d...\n", userID)

	query := `
	SELECT id, name, type, host, port, username, namespace, user_id, admin_url, admin_type, status, created_at, updated_at
	FROM databases
	WHERE user_id = $1
	ORDER BY created_at DESC`

	rows, err := c.db.Query(query, userID)
	if err != nil {
		fmt.Println("❌ Failed to query databases")
		return nil, fmt.Errorf("error querying databases: %w", err)
	}
	defer rows.Close()

	var databases []Database
	for rows.Next() {
		var database Database
		if err := rows.Scan(&database.ID, &database.Name, &database.Type, &database.Host, &database.Port,
			&database.Username, &database.Namespace, &database.UserID, &database.AdminURL, &database.AdminType,
			&database.Status, &database.CreatedAt, &database.UpdatedAt); err != nil {
			fmt.Println("❌ Error scanning database row")
			return nil, fmt.Errorf("error scanning database row: %w", err)
		}
		databases = append(databases, database)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating database rows: %w", err)
	}

	fmt.Printf("✅ Retrieved %d databases successfully\n", len(databases))
	return databases, nil
}

// UpdateDatabaseStatus updates the status of a database
func (c *DBClient) UpdateDatabaseStatus(name, namespace, status string) error {
	fmt.Printf("🔄 Updating database status: %s -> %s...\n", name, status)

	query := `
	UPDATE databases 
	SET status = $1, updated_at = CURRENT_TIMESTAMP
	WHERE name = $2 AND namespace = $3`

	result, err := c.db.Exec(query, status, name, namespace)
	if err != nil {
		fmt.Println("❌ Failed to update database status")
		return fmt.Errorf("error updating database status: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no database found with name %s in namespace %s", name, namespace)
	}

	fmt.Printf("✅ Database status updated successfully\n")
	return nil
}

// DeleteDatabase removes a database record
func (c *DBClient) DeleteDatabase(name, namespace string) error {
	fmt.Printf("🔄 Deleting database record: %s...\n", name)

	query := `DELETE FROM databases WHERE name = $1 AND namespace = $2`

	result, err := c.db.Exec(query, name, namespace)
	if err != nil {
		fmt.Println("❌ Failed to delete database record")
		return fmt.Errorf("error deleting database: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no database found with name %s in namespace %s", name, namespace)
	}

	fmt.Printf("✅ Database record deleted successfully\n")
	return nil
}
