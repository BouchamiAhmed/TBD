package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

// Database connection parameters
const (
	port     = 5432
	user     = "postgres"
	password = "postgres"
	dbname   = "testdb"
)

// DBClient represents a PostgreSQL database client
type DBClient struct {
	db *sql.DB
}

// NewDBClient creates a new database client with configurable host
func NewDBClient(host string) (*DBClient, error) {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║                K3s Database Connection                     ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")

	fmt.Printf("⏳ Attempting to connect to PostgreSQL on %s:%d...\n", host, port)

	// Connection string
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

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

	// Create users table if it doesn't exist
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		last_name VARCHAR(100) NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	_, err := c.db.Exec(query)
	if err != nil {
		fmt.Println("❌ Failed to create users table")
		return fmt.Errorf("error creating users table: %w", err)
	}

	// Create databases table for tracking deployed databases
	fmt.Println("🔄 Creating databases table if it doesn't exist...")
	dbQuery := `
	CREATE TABLE IF NOT EXISTS databases (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		type VARCHAR(50) NOT NULL,
		host VARCHAR(255) NOT NULL,
		port VARCHAR(10) NOT NULL,
		username VARCHAR(100) NOT NULL,
		namespace VARCHAR(100) NOT NULL,
		user_id INTEGER NOT NULL,
		admin_url VARCHAR(500),
		admin_type VARCHAR(50),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(name, namespace)
	)`

	_, err = c.db.Exec(dbQuery)
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
	ID        int       `json:"id"`
	LastName  string    `json:"lastName"`
	FirstName string    `json:"firstName"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateUser adds a new user to the database
func (c *DBClient) CreateUser(lastName, firstName string) (*User, error) {
	fmt.Printf("🔄 Creating new user: %s %s...\n", firstName, lastName)

	query := `
	INSERT INTO users (last_name, first_name)
	VALUES ($1, $2)
	RETURNING id, last_name, first_name, created_at`

	var user User
	err := c.db.QueryRow(query, lastName, firstName).Scan(
		&user.ID,
		&user.LastName,
		&user.FirstName,
		&user.CreatedAt,
	)

	if err != nil {
		fmt.Println("❌ Failed to create user")
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	fmt.Printf("✅ User created successfully with ID: %d\n", user.ID)
	return &user, nil
}

// GetAllUsers retrieves all users from the database
func (c *DBClient) GetAllUsers() ([]User, error) {
	fmt.Println("🔄 Retrieving all users from database...")

	query := `
	SELECT id, last_name, first_name, created_at
	FROM users
	ORDER BY id`

	rows, err := c.db.Query(query)
	if err != nil {
		fmt.Println("❌ Failed to query users")
		return nil, fmt.Errorf("error querying users: %w", err)
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.LastName, &user.FirstName, &user.CreatedAt); err != nil {
			fmt.Println("❌ Error scanning user row")
			return nil, fmt.Errorf("error scanning user row: %w", err)
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user rows: %w", err)
	}

	fmt.Printf("✅ Retrieved %d users successfully\n", len(users))
	return users, nil
}

// GetUserByID retrieves a specific user by ID
func (c *DBClient) GetUserByID(id int) (*User, error) {
	fmt.Printf("🔄 Looking up user with ID: %d...\n", id)

	query := `
	SELECT id, last_name, first_name, created_at
	FROM users
	WHERE id = $1`

	var user User
	err := c.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.LastName,
		&user.FirstName,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("ℹ️ No user found with ID: %d\n", id)
			return nil, nil // User not found
		}
		fmt.Println("❌ Error retrieving user")
		return nil, fmt.Errorf("error getting user by ID: %w", err)
	}

	fmt.Printf("✅ Found user: %s %s (ID: %d)\n", user.FirstName, user.LastName, user.ID)
	return &user, nil
}

// GetUserByUsername retrieves user by username
func (c *DBClient) GetUserByUsername(username string) (*AuthUser, error) {
	fmt.Printf("🔄 Looking up user: %s\n", username)

	query := `
	SELECT id, username, email, first_name, last_name, created_at
	FROM auth_users
	WHERE username = $1`

	var user AuthUser
	err := c.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found: %s", username)
		}
		return nil, fmt.Errorf("error getting user: %w", err)
	}

	fmt.Printf("✅ Found user: %s (ID: %d)\n", user.Username, user.ID)
	return &user, nil
}

// CreateUserFromLDAP creates a user from LDAP information
func (c *DBClient) CreateUserFromLDAP(ldapUser *struct {
	DN        string `json:"dn"`
	UID       string `json:"uid"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	UserType  string `json:"userType"`
}) (*AuthUser, error) {
	fmt.Printf("🔄 Creating user from LDAP: %s (%s)\n", ldapUser.UID, ldapUser.UserType)

	// Use LDAP info to create user
	email := ldapUser.Email
	if email == "" {
		// Generate email if not provided
		domain := "dbsaas.local"
		if ldapUser.UserType == "external" {
			domain = "external.com"
		}
		email = fmt.Sprintf("%s@%s", ldapUser.UID, domain)
	}

	firstName := ldapUser.FirstName
	lastName := ldapUser.LastName
	if firstName == "" {
		firstName = ldapUser.UID
	}
	if lastName == "" {
		lastName = "User"
	}

	query := `
	INSERT INTO auth_users (username, email, first_name, last_name, password_hash)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id, username, email, first_name, last_name, created_at`

	var user AuthUser
	err := c.db.QueryRow(
		query,
		ldapUser.UID,
		email,
		firstName,
		lastName,
		"ldap-managed", // Password placeholder for LDAP users
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
	)

	if err != nil {
		// Handle duplicate user gracefully
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			fmt.Printf("ℹ️  User already exists, fetching: %s\n", ldapUser.UID)
			return c.GetUserByUsername(ldapUser.UID)
		}
		return nil, fmt.Errorf("error creating LDAP user: %w", err)
	}

	fmt.Printf("✅ LDAP user created: %s (ID: %d)\n", user.Username, user.ID)
	return &user, nil
}

// Database tracking struct
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
	CreatedAt time.Time `json:"createdAt"`
}

// CreateDatabase records a database deployment in PostgreSQL
func (c *DBClient) CreateDatabase(name, dbType, host, port, username, namespace string, userID int, adminURL, adminType string) (*Database, error) {
	fmt.Printf("🔄 Recording database deployment: %s (type: %s) in namespace: %s\n", name, dbType, namespace)

	query := `
	INSERT INTO databases (name, type, host, port, username, namespace, user_id, admin_url, admin_type)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	RETURNING id, name, type, host, port, username, namespace, user_id, admin_url, admin_type, created_at`

	var database Database
	err := c.db.QueryRow(
		query,
		name, dbType, host, port, username, namespace, userID, adminURL, adminType,
	).Scan(
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
		&database.CreatedAt,
	)

	if err != nil {
		fmt.Printf("❌ Failed to record database deployment: %v\n", err)
		return nil, fmt.Errorf("error recording database: %w", err)
	}

	fmt.Printf("✅ Database deployment recorded: %s (ID: %d)\n", database.Name, database.ID)
	return &database, nil
}

// GetDatabasesByUserID retrieves all databases for a specific user
func (c *DBClient) GetDatabasesByUserID(userID int) ([]Database, error) {
	fmt.Printf("🔄 Retrieving databases for user ID: %d\n", userID)

	query := `
	SELECT id, name, type, host, port, username, namespace, user_id, admin_url, admin_type, created_at
	FROM databases
	WHERE user_id = $1
	ORDER BY created_at DESC`

	rows, err := c.db.Query(query, userID)
	if err != nil {
		fmt.Printf("❌ Failed to query databases: %v\n", err)
		return nil, fmt.Errorf("error querying databases: %w", err)
	}
	defer rows.Close()

	var databases []Database
	for rows.Next() {
		var db Database
		if err := rows.Scan(
			&db.ID, &db.Name, &db.Type, &db.Host, &db.Port,
			&db.Username, &db.Namespace, &db.UserID,
			&db.AdminURL, &db.AdminType, &db.CreatedAt,
		); err != nil {
			fmt.Printf("❌ Error scanning database row: %v\n", err)
			return nil, fmt.Errorf("error scanning database row: %w", err)
		}
		databases = append(databases, db)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating database rows: %w", err)
	}

	fmt.Printf("✅ Retrieved %d databases for user ID %d\n", len(databases), userID)
	return databases, nil
}

// DeleteDatabase removes a database record from PostgreSQL
func (c *DBClient) DeleteDatabase(name, namespace string) error {
	fmt.Printf("🔄 Deleting database record: %s in namespace %s\n", name, namespace)

	query := `DELETE FROM databases WHERE name = $1 AND namespace = $2`

	result, err := c.db.Exec(query, name, namespace)
	if err != nil {
		fmt.Printf("❌ Failed to delete database record: %v\n", err)
		return fmt.Errorf("error deleting database: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		fmt.Printf("ℹ️  No database record found to delete\n")
	} else {
		fmt.Printf("✅ Database record deleted: %s\n", name)
	}

	return nil
}

// Add these methods to your Adminms/admin-service/connectdb.go file
// Place them after the existing DeleteDatabase method

// DeleteUserDatabases removes all databases for a specific username
func (c *DBClient) DeleteUserDatabases(username string) error {
	fmt.Printf("🔄 Deleting all databases for user: %s\n", username)

	// First get user ID from username
	var userID int
	err := c.db.QueryRow("SELECT id FROM users WHERE username = $1", username).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("ℹ️  No user found with username: %s\n", username)
			return nil // No error if user doesn't exist
		}
		return fmt.Errorf("error finding user: %w", err)
	}

	// Delete all databases for this user
	query := `DELETE FROM databases WHERE user_id = $1`
	result, err := c.db.Exec(query, userID)
	if err != nil {
		fmt.Printf("❌ Failed to delete user databases: %v\n", err)
		return fmt.Errorf("error deleting user databases: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("✅ Deleted %d database records for user %s\n", rowsAffected, username)
	return nil
}

// DeleteNamespaceDatabases removes all databases in a specific namespace
func (c *DBClient) DeleteNamespaceDatabases(namespace string) error {
	fmt.Printf("🔄 Deleting all databases in namespace: %s\n", namespace)

	query := `DELETE FROM databases WHERE namespace = $1`
	result, err := c.db.Exec(query, namespace)
	if err != nil {
		fmt.Printf("❌ Failed to delete namespace databases: %v\n", err)
		return fmt.Errorf("error deleting namespace databases: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("✅ Deleted %d database records from namespace %s\n", rowsAffected, namespace)
	return nil
}

// GetUserByUsername retrieves a user by their username
/*func (c *DBClient) GetUserByUsername(username string) (*AuthUser, error) {
	query := `SELECT id, username, email, first_name, last_name, created_at FROM users WHERE username = $1`

	var user AuthUser
	err := c.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found: %s", username)
		}
		return nil, fmt.Errorf("error querying user: %w", err)
	}

	return &user, nil
}*/

// CountDatabases returns the total number of databases
func (c *DBClient) CountDatabases() (int, error) {
	var count int
	err := c.db.QueryRow("SELECT COUNT(*) FROM databases").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting databases: %w", err)
	}
	return count, nil
}

// CountUsers returns the total number of users
func (c *DBClient) CountUsers() (int, error) {
	var count int
	err := c.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting users: %w", err)
	}
	return count, nil
}

// GetDatabaseTypeStats returns statistics about database types
func (c *DBClient) GetDatabaseTypeStats() (map[string]int, error) {
	query := `SELECT type, COUNT(*) as count FROM databases GROUP BY type`

	rows, err := c.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying database type stats: %w", err)
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var dbType string
		var count int
		if err := rows.Scan(&dbType, &count); err != nil {
			return nil, fmt.Errorf("error scanning database type stats: %w", err)
		}
		stats[dbType] = count
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating database type stats: %w", err)
	}

	return stats, nil
}
