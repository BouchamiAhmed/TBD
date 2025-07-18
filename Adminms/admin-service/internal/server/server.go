// internal/server/admin_server.go - Updated with database integration
package server

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/protobuf/types/known/timestamppb"

	"admin-service/internal/database" // Add this line
	"admin-service/internal/k8s"
	pb "admin-service/pkg/pb"
)

type AdminServer struct {
	pb.UnimplementedAdminServiceServer
	k8sService *k8s.K8sService
	dbClient   *database.DBClient // Add this line
}

func NewAdminServer(k8sService *k8s.K8sService, dbClient *database.DBClient) *AdminServer {
	return &AdminServer{
		k8sService: k8sService,
		dbClient:   dbClient, // Add this line
	}
}

// Login - mock implementation (we'll add real auth later)
func (s *AdminServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	log.Printf("📞 Login request for user: %s", req.Username)

	if req.Username == "" || req.Password == "" {
		return nil, fmt.Errorf("username and password required")
	}

	// Mock user data
	user := &pb.User{
		Id:        1,
		Username:  req.Username,
		Email:     req.Username + "@example.com",
		FirstName: "Test",
		LastName:  "User",
		CreatedAt: timestamppb.New(time.Now()),
	}

	// Mock token
	token := "mock-jwt-token-" + req.Username

	log.Printf("✅ Login successful for user: %s", req.Username)

	return &pb.LoginResponse{
		User:  user,
		Token: token,
	}, nil
}

// Register - mock implementation
func (s *AdminServer) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	log.Printf("📞 Register request for user: %s", req.Username)

	if req.Username == "" || req.Email == "" || req.Password == "" {
		return nil, fmt.Errorf("username, email and password required")
	}

	// Mock user creation
	user := &pb.User{
		Id:        2, // Mock ID
		Username:  req.Username,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		CreatedAt: timestamppb.New(time.Now()),
	}

	token := "mock-jwt-token-" + req.Username

	log.Printf("✅ Registration successful for user: %s", req.Username)

	return &pb.RegisterResponse{
		User:  user,
		Token: token,
	}, nil
}

// CreateDatabase - real Kubernetes implementation
func (s *AdminServer) CreateDatabase(ctx context.Context, req *pb.CreateDatabaseRequest) (*pb.CreateDatabaseResponse, error) {
	log.Printf("📞 CreateDatabase request: %s (%s) for user %d", req.Name, req.Type, req.UserId)

	if req.Name == "" || req.Type == "" {
		return nil, fmt.Errorf("database name and type required")
	}

	if s.k8sService == nil {
		return nil, fmt.Errorf("kubernetes service not available")
	}

	// Mock username from user ID (in real implementation, you'd look this up from database)
	mockUsername := fmt.Sprintf("user%d", req.UserId)

	// Convert to internal request format
	k8sReq := &k8s.DatabaseRequest{
		Name:     req.Name,
		Username: req.Username,
		Password: req.Password,
		Type:     req.Type,
		UserID:   int(req.UserId),
		UserName: mockUsername,
	}

	// Create database in Kubernetes
	dbResp, err := s.k8sService.CreateDatabase(ctx, k8sReq)
	if err != nil {
		log.Printf("❌ Failed to create database %s: %v", req.Name, err)
		return nil, fmt.Errorf("failed to create database: %v", err)
	}

	log.Printf("✅ Database creation initiated: %s", req.Name)

	// Convert response to protobuf format
	return &pb.CreateDatabaseResponse{
		Name:      dbResp.Name,
		Host:      dbResp.Host,
		Port:      dbResp.Port,
		Username:  dbResp.Username,
		Type:      dbResp.Type,
		Status:    dbResp.Status,
		Message:   dbResp.Message,
		Namespace: dbResp.Namespace,
		AdminUrl:  dbResp.AdminURL,
		AdminType: dbResp.AdminType,
	}, nil
}

// GetUserDatabases - mock implementation (update later with real k8s calls)
func (s *AdminServer) GetUserDatabases(ctx context.Context, req *pb.GetUserDatabasesRequest) (*pb.GetUserDatabasesResponse, error) {
	log.Printf("📞 GetUserDatabases request for namespace: %s", req.Namespace)

	// Mock database list
	databases := []*pb.Database{
		{
			Name:      "postgres-quick-123",
			Type:      "postgresql",
			Status:    "running",
			Namespace: req.Namespace,
			UserId:    "1",
			AdminUrl:  fmt.Sprintf("http://10.9.21.201/%s/admin/pgadmin/postgres-quick-123", req.Namespace),
			AdminType: "pgAdmin",
			CreatedAt: timestamppb.New(time.Now().Add(-1 * time.Hour)),
		},
		{
			Name:      "mysql-quick-456",
			Type:      "mysql",
			Status:    "running",
			Namespace: req.Namespace,
			UserId:    "1",
			AdminUrl:  fmt.Sprintf("http://10.9.21.201/%s/admin/phpmyadmin/mysql-quick-456", req.Namespace),
			AdminType: "phpMyAdmin",
			CreatedAt: timestamppb.New(time.Now().Add(-2 * time.Hour)),
		},
	}

	log.Printf("✅ Returning %d databases for namespace: %s", len(databases), req.Namespace)

	return &pb.GetUserDatabasesResponse{
		Success:   true,
		Namespace: req.Namespace,
		Databases: databases,
		Count:     int32(len(databases)),
	}, nil
}

// DeleteDatabase - mock implementation (update later with real k8s calls)
func (s *AdminServer) DeleteDatabase(ctx context.Context, req *pb.DeleteDatabaseRequest) (*pb.DeleteDatabaseResponse, error) {
	log.Printf("📞 DeleteDatabase request: %s from namespace: %s", req.Name, req.Namespace)

	// Mock deletion (always succeeds for now)
	log.Printf("✅ Database deletion successful: %s", req.Name)

	return &pb.DeleteDatabaseResponse{
		Success:   true,
		Message:   fmt.Sprintf("Database '%s' deleted successfully from namespace '%s'", req.Name, req.Namespace),
		Name:      req.Name,
		Namespace: req.Namespace,
	}, nil
}

// GetAllNamespaces - returns all db-saas managed namespaces
func (s *AdminServer) GetAllNamespaces(ctx context.Context, req *pb.GetAllNamespacesRequest) (*pb.GetAllNamespacesResponse, error) {
	log.Printf("📞 GetAllNamespaces request")

	if s.k8sService == nil {
		return &pb.GetAllNamespacesResponse{
			Success: false,
			Message: "Kubernetes service not available",
		}, nil
	}

	// Get namespaces from Kubernetes
	namespaces, err := s.k8sService.GetAllNamespaces(ctx)
	if err != nil {
		log.Printf("❌ Failed to get namespaces: %v", err)
		return &pb.GetAllNamespacesResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to get namespaces: %v", err),
		}, nil
	}

	// Convert to protobuf format
	var protoNamespaces []*pb.NamespaceInfo
	for _, ns := range namespaces {
		protoNs := &pb.NamespaceInfo{
			Name:          ns.Name,
			CreatedAt:     timestamppb.New(ns.CreatedAt),
			DatabaseCount: ns.DatabaseCount,
			Status:        ns.Status,
		}
		protoNamespaces = append(protoNamespaces, protoNs)
	}

	log.Printf("✅ Returning %d namespaces", len(protoNamespaces))

	return &pb.GetAllNamespacesResponse{
		Success:    true,
		Message:    fmt.Sprintf("Found %d namespaces", len(protoNamespaces)),
		Namespaces: protoNamespaces,
	}, nil
}
