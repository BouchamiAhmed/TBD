package main

import (
	"database/sql"
	"fmt"
	"log"
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
