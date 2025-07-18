// cmd/main.go - With Database and Kubernetes integration
package main

import (
	"log"
	"net"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"admin-service/internal/database"
	"admin-service/internal/k8s"
	"admin-service/internal/server"
	pb "admin-service/pkg/pb"
)

func main() {
	log.Println("🚀 Starting Admin gRPC Service...")

	// Initialize Database connection
	var dbClient *database.DBClient
	// Get PostgreSQL connection details from environment or use cluster defaults
	dbHost := os.Getenv("POSTGRES_HOST")
	if dbHost == "" {
		dbHost = "10.9.21.201" // Updated PostgreSQL cluster IP
		log.Printf("Using default PostgreSQL host: %s", dbHost)
	}

	dbUsername := os.Getenv("DB_USERNAME")
	if dbUsername == "" {
		dbUsername = "postgres" // Default
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres" // Default
	}

	log.Printf("Attempting to connect to database at: %s", dbHost)

	var err error
	dbClient, err = database.NewDBClient(dbHost, dbUsername, dbPassword)
	if err != nil {
		log.Printf("⚠️  Warning: Could not connect to database: %v", err)
		log.Println("Authentication will not be available")
		dbClient = nil
	} else {
		log.Println("✅ Successfully connected to database")

		// Initialize tables
		if err := dbClient.CreateTablesIfNotExist(); err != nil {
			log.Printf("⚠️  Warning: Could not initialize database tables: %v", err)
		}
	}

	// Initialize Kubernetes service
	k8sService, err := k8s.NewK8sService()
	if err != nil {
		log.Printf("⚠️  Warning: Could not connect to Kubernetes: %v", err)
		log.Println("Database creation will not be available")
		k8sService = nil
	} else {
		log.Println("✅ Successfully connected to Kubernetes cluster")
	}

	// Create gRPC server
	grpcServer := grpc.NewServer()

	// Create and register admin server with both services
	adminServer := server.NewAdminServer(k8sService, dbClient)
	pb.RegisterAdminServiceServer(grpcServer, adminServer)

	// Enable reflection for development (so we can test with grpcui)
	reflection.Register(grpcServer)

	// Start listening
	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("✅ Admin gRPC Service running on :%s", port)
	log.Printf("🔧 You can test it with: grpcui -plaintext localhost:%s", port)

	// Graceful shutdown handling
	defer func() {
		if dbClient != nil {
			dbClient.Close()
		}
	}()

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
