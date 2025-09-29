// Adminms/admin-service/cmd/admin_grpc.go
// gRPC service ONLY for admin functions (LDAP & Namespace management)
// Your existing REST API handles database operations

package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	pb "admin-service/pkg/pb"
)

// AdminGRPCServer - Only implements admin-specific operations
type AdminGRPCServer struct {
	pb.UnimplementedAdminServiceServer
}

func NewAdminGRPCServer() *AdminGRPCServer {
	return &AdminGRPCServer{}
}

// ============================================================================
// LDAP MANAGEMENT - Admin Operations
// ============================================================================

func (s *AdminGRPCServer) ListLDAPUsers(ctx context.Context, req *pb.ListLDAPUsersRequest) (*pb.ListLDAPUsersResponse, error) {
	log.Printf("👥 gRPC Admin: ListLDAPUsers (type=%s, page=%d, limit=%d)", req.GetUserType(), req.GetPage(), req.GetLimit())

	// Check if LDAP manager is available
	if ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	// Call your existing LDAP list function
	users, err := ldapManager.ListLDAPUsers(req.GetUserType())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to list LDAP users: %v", err)
	}

	// Convert to protobuf format
	var pbUsers []*pb.LDAPUser
	for _, user := range users {
		pbUsers = append(pbUsers, &pb.LDAPUser{
			Dn:        user.DN,
			Uid:       user.UID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			UserType:  user.UserType,
			Status:    "active",
		})
	}

	// Apply pagination
	page := int(req.GetPage())
	limit := int(req.GetLimit())
	if limit <= 0 {
		limit = 10
	}
	if page <= 0 {
		page = 1
	}

	start := (page - 1) * limit
	end := start + limit
	totalCount := len(pbUsers)

	if start >= len(pbUsers) {
		pbUsers = []*pb.LDAPUser{}
	} else if end > len(pbUsers) {
		pbUsers = pbUsers[start:]
	} else {
		pbUsers = pbUsers[start:end]
	}

	return &pb.ListLDAPUsersResponse{
		Success:    true,
		Message:    fmt.Sprintf("Found %d users", totalCount),
		Users:      pbUsers,
		TotalCount: int32(totalCount),
		Page:       int32(page),
		Limit:      int32(limit),
	}, nil
}

func (s *AdminGRPCServer) GetLDAPUser(ctx context.Context, req *pb.GetLDAPUserRequest) (*pb.GetLDAPUserResponse, error) {
	log.Printf("👤 gRPC Admin: GetLDAPUser (%s)", req.GetUsername())

	if ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	// Call your existing LDAP get user function
	user, err := ldapManager.GetUserDetails(req.GetUsername())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	return &pb.GetLDAPUserResponse{
		Success: true,
		Message: "User found",
		User: &pb.LDAPUser{
			Dn:        user.DN,
			Uid:       user.UID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			UserType:  user.UserType,
			Status:    "active",
		},
	}, nil
}

func (s *AdminGRPCServer) DeleteLDAPUser(ctx context.Context, req *pb.DeleteLDAPUserRequest) (*pb.DeleteLDAPUserResponse, error) {
	log.Printf("❌ gRPC Admin: DeleteLDAPUser (%s, force=%v)", req.GetUsername(), req.GetForce())

	if ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	var deletedResources []string

	// If force delete, clean up user resources first
	if req.GetForce() {
		namespaceName := GetUserNamespaceByUsername(req.GetUsername())

		// Delete namespace and all resources
		if clientset != nil && namespaceName != "" {
			err := clientset.CoreV1().Namespaces().Delete(ctx, namespaceName, metav1.DeleteOptions{})
			if err != nil {
				log.Printf("Warning: Failed to delete namespace %s: %v", namespaceName, err)
			} else {
				deletedResources = append(deletedResources, fmt.Sprintf("namespace:%s", namespaceName))
				log.Printf("✅ Deleted namespace: %s", namespaceName)
			}
		}

		// Delete databases from tracking
		if dbClient != nil {
			err := dbClient.DeleteUserDatabases(req.GetUsername())
			if err != nil {
				log.Printf("Warning: Failed to delete user databases: %v", err)
			} else {
				deletedResources = append(deletedResources, "databases")
			}
		}
	}

	// Delete LDAP user
	err := ldapManager.DeleteLDAPUser(req.GetUsername())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to delete LDAP user: %v", err)
	}

	return &pb.DeleteLDAPUserResponse{
		Success:          true,
		Message:          fmt.Sprintf("User '%s' deleted successfully", req.GetUsername()),
		Username:         req.GetUsername(),
		DeletedResources: deletedResources,
	}, nil
}

func (s *AdminGRPCServer) UpdateLDAPPassword(ctx context.Context, req *pb.UpdateLDAPPasswordRequest) (*pb.UpdateLDAPPasswordResponse, error) {
	log.Printf("🔑 gRPC Admin: UpdateLDAPPassword (%s)", req.GetUsername())

	if ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	err := ldapManager.UpdateLDAPUserPassword(req.GetUsername(), req.GetNewPassword())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to update password: %v", err)
	}

	return &pb.UpdateLDAPPasswordResponse{
		Success:  true,
		Message:  "Password updated successfully",
		Username: req.GetUsername(),
	}, nil
}

// ============================================================================
// NAMESPACE MANAGEMENT - Admin Operations
// ============================================================================

func (s *AdminGRPCServer) GetAllNamespaces(ctx context.Context, req *pb.GetAllNamespacesRequest) (*pb.GetAllNamespacesResponse, error) {
	log.Printf("🏗️  gRPC Admin: GetAllNamespaces")

	if clientset == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	// List all namespaces with db-saas label
	namespaces, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{
		LabelSelector: "db-saas/user-namespace=true",
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to list namespaces: %v", err)
	}

	var pbNamespaces []*pb.NamespaceInfo
	for _, ns := range namespaces.Items {
		// Count databases in this namespace
		databases, _ := listDatabasesInNamespace(ns.Name)

		pbNs := &pb.NamespaceInfo{
			Name:          ns.Name,
			CreatedAt:     timestamppb.New(ns.CreationTimestamp.Time),
			DatabaseCount: int32(len(databases)),
			Status:        string(ns.Status.Phase),
		}
		pbNamespaces = append(pbNamespaces, pbNs)
	}

	return &pb.GetAllNamespacesResponse{
		Success:    true,
		Message:    fmt.Sprintf("Found %d namespaces", len(pbNamespaces)),
		Namespaces: pbNamespaces,
	}, nil
}

func (s *AdminGRPCServer) GetNamespaceDetails(ctx context.Context, req *pb.GetNamespaceDetailsRequest) (*pb.GetNamespaceDetailsResponse, error) {
	log.Printf("🔍 gRPC Admin: GetNamespaceDetails (%s)", req.GetNamespace())

	if clientset == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	// Get namespace
	namespace, err := clientset.CoreV1().Namespaces().Get(ctx, req.GetNamespace(), metav1.GetOptions{})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "Namespace not found: %v", err)
	}

	// Get resources in namespace
	var resources []*pb.KubernetesResource

	// List deployments
	deployments, _ := clientset.AppsV1().Deployments(req.GetNamespace()).List(ctx, metav1.ListOptions{})
	for _, deploy := range deployments.Items {
		resources = append(resources, &pb.KubernetesResource{
			Name:      deploy.Name,
			Kind:      "Deployment",
			Namespace: deploy.Namespace,
			CreatedAt: timestamppb.New(deploy.CreationTimestamp.Time),
			Labels:    deploy.Labels,
			Status:    getDeploymentStatus(&deploy),
		})
	}

	// List services
	services, _ := clientset.CoreV1().Services(req.GetNamespace()).List(ctx, metav1.ListOptions{})
	for _, svc := range services.Items {
		if svc.Name == "kubernetes" {
			continue
		}
		resources = append(resources, &pb.KubernetesResource{
			Name:      svc.Name,
			Kind:      "Service",
			Namespace: svc.Namespace,
			CreatedAt: timestamppb.New(svc.CreationTimestamp.Time),
			Labels:    svc.Labels,
			Status:    string(svc.Spec.Type),
		})
	}

	// Count databases
	databases, _ := listDatabasesInNamespace(req.GetNamespace())

	// Extract owner from labels
	ownerUID := ""
	if uid, exists := namespace.Labels["user-uid"]; exists {
		ownerUID = uid
	}

	details := &pb.NamespaceDetails{
		Name:          namespace.Name,
		CreatedAt:     timestamppb.New(namespace.CreationTimestamp.Time),
		DatabaseCount: int32(len(databases)),
		Status:        string(namespace.Status.Phase),
		Resources:     resources,
		OwnerUid:      ownerUID,
		Labels:        namespace.Labels,
		Annotations:   namespace.Annotations,
	}

	return &pb.GetNamespaceDetailsResponse{
		Success: true,
		Message: "Namespace details retrieved",
		Details: details,
	}, nil
}

func (s *AdminGRPCServer) DeleteNamespace(ctx context.Context, req *pb.DeleteNamespaceRequest) (*pb.DeleteNamespaceResponse, error) {
	log.Printf("🗑️  gRPC Admin: DeleteNamespace (%s, force=%v)", req.GetNamespace(), req.GetForce())

	if clientset == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	var deletedResources []string

	if req.GetForce() {
		// Delete databases first
		databases, _ := listDatabasesInNamespace(req.GetNamespace())
		for _, db := range databases {
			dbName := getStringFromMap(db, "name")
			err := deleteDatabaseDeployment(dbName, req.GetNamespace())
			if err != nil {
				log.Printf("Warning: Failed to delete database %s: %v", dbName, err)
			} else {
				deletedResources = append(deletedResources, fmt.Sprintf("database:%s", dbName))
			}
		}

		// Delete from PostgreSQL tracking
		if dbClient != nil {
			err := dbClient.DeleteNamespaceDatabases(req.GetNamespace())
			if err != nil {
				log.Printf("Warning: Failed to delete namespace databases from tracking: %v", err)
			}
		}
	}

	// Delete the namespace
	err := clientset.CoreV1().Namespaces().Delete(ctx, req.GetNamespace(), metav1.DeleteOptions{})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to delete namespace: %v", err)
	}

	return &pb.DeleteNamespaceResponse{
		Success:          true,
		Message:          fmt.Sprintf("Namespace '%s' deleted successfully", req.GetNamespace()),
		Namespace:        req.GetNamespace(),
		DeletedResources: deletedResources,
	}, nil
}

func (s *AdminGRPCServer) ListNamespaceResources(ctx context.Context, req *pb.ListNamespaceResourcesRequest) (*pb.ListNamespaceResourcesResponse, error) {
	log.Printf("📦 gRPC Admin: ListNamespaceResources (%s, type=%s)", req.GetNamespace(), req.GetResourceType())

	if clientset == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	var resources []*pb.KubernetesResource
	resourceType := strings.ToLower(req.GetResourceType())

	// List specific resource type or all
	if resourceType == "" || resourceType == "deployments" {
		deployments, _ := clientset.AppsV1().Deployments(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		for _, deploy := range deployments.Items {
			resources = append(resources, &pb.KubernetesResource{
				Name:      deploy.Name,
				Kind:      "Deployment",
				Namespace: deploy.Namespace,
				CreatedAt: timestamppb.New(deploy.CreationTimestamp.Time),
				Labels:    deploy.Labels,
				Status:    getDeploymentStatus(&deploy),
			})
		}
	}

	if resourceType == "" || resourceType == "services" {
		services, _ := clientset.CoreV1().Services(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		for _, svc := range services.Items {
			if svc.Name == "kubernetes" {
				continue
			}
			resources = append(resources, &pb.KubernetesResource{
				Name:      svc.Name,
				Kind:      "Service",
				Namespace: svc.Namespace,
				CreatedAt: timestamppb.New(svc.CreationTimestamp.Time),
				Labels:    svc.Labels,
				Status:    string(svc.Spec.Type),
			})
		}
	}

	if resourceType == "" || resourceType == "pods" {
		pods, _ := clientset.CoreV1().Pods(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		for _, pod := range pods.Items {
			resources = append(resources, &pb.KubernetesResource{
				Name:      pod.Name,
				Kind:      "Pod",
				Namespace: pod.Namespace,
				CreatedAt: timestamppb.New(pod.CreationTimestamp.Time),
				Labels:    pod.Labels,
				Status:    string(pod.Status.Phase),
			})
		}
	}

	return &pb.ListNamespaceResourcesResponse{
		Success:   true,
		Message:   fmt.Sprintf("Found %d resources", len(resources)),
		Namespace: req.GetNamespace(),
		Resources: resources,
	}, nil
}

// ============================================================================
// ADMIN SYSTEM OPERATIONS
// ============================================================================

func (s *AdminGRPCServer) GetSystemHealth(ctx context.Context, req *pb.GetSystemHealthRequest) (*pb.GetSystemHealthResponse, error) {
	log.Printf("💚 gRPC Admin: GetSystemHealth")

	health := &pb.SystemHealth{
		Status:  "healthy",
		Metrics: make(map[string]string),
	}

	// Check Kubernetes
	if clientset != nil {
		_, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})
		if err != nil {
			health.Kubernetes = &pb.ServiceStatus{
				Status:    "error",
				Message:   err.Error(),
				LastCheck: timestamppb.Now(),
			}
			health.Status = "degraded"
		} else {
			health.Kubernetes = &pb.ServiceStatus{
				Status:    "connected",
				Message:   "OK",
				LastCheck: timestamppb.Now(),
			}
		}
	} else {
		health.Kubernetes = &pb.ServiceStatus{
			Status:    "disconnected",
			Message:   "Client not initialized",
			LastCheck: timestamppb.Now(),
		}
		health.Status = "degraded"
	}

	// Check LDAP
	if ldapManager != nil {
		health.Ldap = &pb.ServiceStatus{
			Status:    "connected",
			Message:   "OK",
			LastCheck: timestamppb.Now(),
		}
	} else {
		health.Ldap = &pb.ServiceStatus{
			Status:    "disconnected",
			Message:   "Connection not established",
			LastCheck: timestamppb.Now(),
		}
		health.Status = "degraded"
	}

	// Check Database
	if dbClient != nil {
		health.Database = &pb.ServiceStatus{
			Status:    "connected",
			Message:   "OK",
			LastCheck: timestamppb.Now(),
		}
	} else {
		health.Database = &pb.ServiceStatus{
			Status:    "disconnected",
			Message:   "Client not initialized",
			LastCheck: timestamppb.Now(),
		}
		health.Status = "degraded"
	}

	// Traefik (assume OK)
	health.Traefik = &pb.ServiceStatus{
		Status:    "connected",
		Message:   "Assumed healthy",
		LastCheck: timestamppb.Now(),
	}

	health.Metrics["version"] = "1.0.0"

	return &pb.GetSystemHealthResponse{
		Success: true,
		Message: "Health check completed",
		Health:  health,
	}, nil
}

func (s *AdminGRPCServer) GetAdminStats(ctx context.Context, req *pb.GetAdminStatsRequest) (*pb.GetAdminStatsResponse, error) {
	log.Printf("📊 gRPC Admin: GetAdminStats")

	stats := &pb.AdminStats{
		DatabaseTypes: make(map[string]int32),
		UserTypes:     make(map[string]int32),
		LastUpdated:   timestamppb.Now(),
	}

	// Count namespaces
	if clientset != nil {
		namespaces, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{
			LabelSelector: "db-saas/user-namespace=true",
		})
		if err == nil {
			stats.TotalNamespaces = int32(len(namespaces.Items))
		}
	}

	// Count databases and users from database
	if dbClient != nil {
		if totalDatabases, err := dbClient.CountDatabases(); err == nil {
			stats.TotalDatabases = int32(totalDatabases)
		}

		if totalUsers, err := dbClient.CountUsers(); err == nil {
			stats.TotalUsers = int32(totalUsers)
		}

		if dbTypes, err := dbClient.GetDatabaseTypeStats(); err == nil {
			for dbType, count := range dbTypes {
				stats.DatabaseTypes[dbType] = int32(count)
			}
		}
	}

	// Count LDAP users
	if ldapManager != nil {
		if internalUsers, err := ldapManager.ListLDAPUsers("internal"); err == nil {
			stats.UserTypes["internal"] = int32(len(internalUsers))
		}

		if externalUsers, err := ldapManager.ListLDAPUsers("external"); err == nil {
			stats.UserTypes["external"] = int32(len(externalUsers))
		}
	}

	return &pb.GetAdminStatsResponse{
		Success: true,
		Message: "Statistics retrieved",
		Stats:   stats,
	}, nil
}

// ============================================================================
// STUB METHODS - Not needed for admin operations
// ============================================================================

func (s *AdminGRPCServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Use REST API for login")
}

func (s *AdminGRPCServer) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Use REST API for register")
}

func (s *AdminGRPCServer) CreateDatabase(ctx context.Context, req *pb.CreateDatabaseRequest) (*pb.CreateDatabaseResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Use REST API for database creation")
}

func (s *AdminGRPCServer) GetUserDatabases(ctx context.Context, req *pb.GetUserDatabasesRequest) (*pb.GetUserDatabasesResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Use REST API for database listing")
}

func (s *AdminGRPCServer) DeleteDatabase(ctx context.Context, req *pb.DeleteDatabaseRequest) (*pb.DeleteDatabaseResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Use REST API for database deletion")
}

func (s *AdminGRPCServer) CreateLDAPUser(ctx context.Context, req *pb.CreateLDAPUserRequest) (*pb.CreateLDAPUserResponse, error) {
	return nil, status.Error(codes.Unimplemented, "LDAP user creation not yet implemented")
}

func (s *AdminGRPCServer) UpdateLDAPUser(ctx context.Context, req *pb.UpdateLDAPUserRequest) (*pb.UpdateLDAPUserResponse, error) {
	return nil, status.Error(codes.Unimplemented, "LDAP user update not yet implemented")
}

func (s *AdminGRPCServer) CleanupNamespaceResources(ctx context.Context, req *pb.CleanupNamespaceResourcesRequest) (*pb.CleanupNamespaceResourcesResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Resource cleanup not yet implemented")
}

func (s *AdminGRPCServer) DeleteNamespaceResource(ctx context.Context, req *pb.DeleteNamespaceResourceRequest) (*pb.DeleteNamespaceResourceResponse, error) {
	return nil, status.Error(codes.Unimplemented, "Individual resource deletion not yet implemented")
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func getDeploymentStatus(deployment *appsv1.Deployment) string {
	if deployment.Status.ReadyReplicas == *deployment.Spec.Replicas {
		return "Ready"
	}
	if deployment.Status.ReadyReplicas > 0 {
		return "Partial"
	}
	return "NotReady"
}

func getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}

func GetUserNamespaceByUsername(username string) string {
	// Try to find user in database
	if dbClient != nil {
		user, err := dbClient.GetUserByUsername(username)
		if err == nil {
			return GetUserNamespace(user.ID, user.Username)
		}
	}
	return ""
}
