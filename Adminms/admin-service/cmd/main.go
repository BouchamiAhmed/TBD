package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	pb "admin-service/pkg/pb"
)

// AdminServer implements the AdminService gRPC interface
type AdminServer struct {
	pb.UnimplementedAdminServiceServer
	kubeClient  *kubernetes.Clientset
	ldapManager *LDAPManager
	dbClient    *DatabaseClient
}

// NewAdminServer creates a new admin server instance
func NewAdminServer() (*AdminServer, error) {
	// Initialize Kubernetes client
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get in-cluster config: %w", err)
	}

	kubeClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	// Initialize LDAP manager
	ldapManager := NewLDAPManager()
	if err := ldapManager.Connect(); err != nil {
		log.Printf("Warning: LDAP connection failed: %v", err)
	}

	// Initialize database client
	dbClient, err := NewDatabaseClient()
	if err != nil {
		log.Printf("Warning: Database connection failed: %v", err)
	}

	return &AdminServer{
		kubeClient:  kubeClient,
		ldapManager: ldapManager,
		dbClient:    dbClient,
	}, nil
}

// LDAP Management Methods

func (s *AdminServer) ListLDAPUsers(ctx context.Context, req *pb.ListLDAPUsersRequest) (*pb.ListLDAPUsersResponse, error) {
	if s.ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	users, err := s.ldapManager.ListLDAPUsers(req.GetUserType())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to list LDAP users: %v", err)
	}

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
	if start >= len(pbUsers) {
		pbUsers = []*pb.LDAPUser{}
	} else if end > len(pbUsers) {
		pbUsers = pbUsers[start:]
	} else {
		pbUsers = pbUsers[start:end]
	}

	return &pb.ListLDAPUsersResponse{
		Success:    true,
		Message:    fmt.Sprintf("Found %d users", len(users)),
		Users:      pbUsers,
		TotalCount: int32(len(users)),
		Page:       int32(page),
		Limit:      int32(limit),
	}, nil
}

func (s *AdminServer) GetLDAPUser(ctx context.Context, req *pb.GetLDAPUserRequest) (*pb.GetLDAPUserResponse, error) {
	if s.ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	user, err := s.ldapManager.GetUserDetails(req.GetUsername())
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

func (s *AdminServer) CreateLDAPUser(ctx context.Context, req *pb.CreateLDAPUserRequest) (*pb.CreateLDAPUserResponse, error) {
	if s.ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	// Create LDAP user request
	ldapReq := EnhancedRegisterRequest{
		Username:  req.GetUsername(),
		Email:     req.GetEmail(),
		Password:  req.GetPassword(),
		FirstName: req.GetFirstName(),
		LastName:  req.GetLastName(),
		UserType:  req.GetUserType(),
	}

	if err := s.ldapManager.CreateLDAPUser(ldapReq); err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to create LDAP user: %v", err)
	}

	// Create namespace for the user if it's external
	if req.GetUserType() == "external" && s.kubeClient != nil {
		namespaceName := fmt.Sprintf("user-%s", req.GetUsername())
		if err := s.createUserNamespace(ctx, namespaceName, req.GetUsername()); err != nil {
			log.Printf("Warning: Failed to create namespace for user %s: %v", req.GetUsername(), err)
		}
	}

	return &pb.CreateLDAPUserResponse{
		Success: true,
		Message: "User created successfully",
		User: &pb.LDAPUser{
			Uid:       req.GetUsername(),
			Email:     req.GetEmail(),
			FirstName: req.GetFirstName(),
			LastName:  req.GetLastName(),
			UserType:  req.GetUserType(),
			Status:    "active",
		},
	}, nil
}

func (s *AdminServer) UpdateLDAPUser(ctx context.Context, req *pb.UpdateLDAPUserRequest) (*pb.UpdateLDAPUserResponse, error) {
	if s.ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	// Get current user details
	user, err := s.ldapManager.GetUserDetails(req.GetUsername())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	// TODO: Implement LDAP user update functionality
	// This would require additional LDAP manager methods for updating user attributes

	return &pb.UpdateLDAPUserResponse{
		Success: true,
		Message: "User update functionality not yet implemented",
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

func (s *AdminServer) DeleteLDAPUser(ctx context.Context, req *pb.DeleteLDAPUserRequest) (*pb.DeleteLDAPUserResponse, error) {
	if s.ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	var deletedResources []string

	// If force delete, clean up user resources first
	if req.GetForce() {
		namespaceName := fmt.Sprintf("user-%s", req.GetUsername())
		if s.kubeClient != nil {
			if err := s.deleteNamespaceWithResources(ctx, namespaceName); err != nil {
				log.Printf("Warning: Failed to delete namespace %s: %v", namespaceName, err)
			} else {
				deletedResources = append(deletedResources, fmt.Sprintf("namespace:%s", namespaceName))
			}
		}

		// Delete databases from tracking
		if s.dbClient != nil {
			if err := s.dbClient.DeleteUserDatabases(req.GetUsername()); err != nil {
				log.Printf("Warning: Failed to delete user databases: %v", err)
			} else {
				deletedResources = append(deletedResources, "databases")
			}
		}
	}

	// Delete LDAP user
	if err := s.ldapManager.DeleteLDAPUser(req.GetUsername()); err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to delete LDAP user: %v", err)
	}

	return &pb.DeleteLDAPUserResponse{
		Success:          true,
		Message:          "User deleted successfully",
		Username:         req.GetUsername(),
		DeletedResources: deletedResources,
	}, nil
}

func (s *AdminServer) UpdateLDAPPassword(ctx context.Context, req *pb.UpdateLDAPPasswordRequest) (*pb.UpdateLDAPPasswordResponse, error) {
	if s.ldapManager == nil {
		return nil, status.Error(codes.Unavailable, "LDAP service not available")
	}

	if err := s.ldapManager.UpdateLDAPUserPassword(req.GetUsername(), req.GetNewPassword()); err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to update password: %v", err)
	}

	return &pb.UpdateLDAPPasswordResponse{
		Success:  true,
		Message:  "Password updated successfully",
		Username: req.GetUsername(),
	}, nil
}

// Enhanced Namespace Management Methods

func (s *AdminServer) GetNamespaceDetails(ctx context.Context, req *pb.GetNamespaceDetailsRequest) (*pb.GetNamespaceDetailsResponse, error) {
	if s.kubeClient == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	namespace, err := s.kubeClient.CoreV1().Namespaces().Get(ctx, req.GetNamespace(), metav1.GetOptions{})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "Namespace not found: %v", err)
	}

	// Get resources in namespace
	resources, err := s.getNamespaceResources(ctx, req.GetNamespace())
	if err != nil {
		log.Printf("Warning: Failed to get namespace resources: %v", err)
		resources = []*pb.KubernetesResource{}
	}

	// Count databases
	databaseCount := 0
	if s.dbClient != nil {
		if databases, err := s.dbClient.GetDatabasesByNamespace(req.GetNamespace()); err == nil {
			databaseCount = len(databases)
		}
	}

	details := &pb.NamespaceDetails{
		Name:          namespace.Name,
		CreatedAt:     timestamppb.New(namespace.CreationTimestamp.Time),
		DatabaseCount: int32(databaseCount),
		Status:        string(namespace.Status.Phase),
		Resources:     resources,
		Labels:        namespace.Labels,
		Annotations:   namespace.Annotations,
	}

	// Extract owner from labels if available
	if ownerUID, exists := namespace.Labels["user-uid"]; exists {
		details.OwnerUid = ownerUID
	}

	return &pb.GetNamespaceDetailsResponse{
		Success: true,
		Message: "Namespace details retrieved",
		Details: details,
	}, nil
}

func (s *AdminServer) DeleteNamespace(ctx context.Context, req *pb.DeleteNamespaceRequest) (*pb.DeleteNamespaceResponse, error) {
	if s.kubeClient == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	var deletedResources []string

	if req.GetForce() {
		// Delete all resources first
		if resources, err := s.getNamespaceResources(ctx, req.GetNamespace()); err == nil {
			for _, resource := range resources {
				if err := s.deleteKubernetesResource(ctx, req.GetNamespace(), resource.Kind, resource.Name); err != nil {
					log.Printf("Warning: Failed to delete %s/%s: %v", resource.Kind, resource.Name, err)
				} else {
					deletedResources = append(deletedResources, fmt.Sprintf("%s:%s", resource.Kind, resource.Name))
				}
			}
		}

		// Delete databases from tracking
		if s.dbClient != nil {
			if err := s.dbClient.DeleteNamespaceDatabases(req.GetNamespace()); err != nil {
				log.Printf("Warning: Failed to delete namespace databases: %v", err)
			} else {
				deletedResources = append(deletedResources, "databases")
			}
		}
	}

	// Delete the namespace
	err := s.kubeClient.CoreV1().Namespaces().Delete(ctx, req.GetNamespace(), metav1.DeleteOptions{})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to delete namespace: %v", err)
	}

	return &pb.DeleteNamespaceResponse{
		Success:          true,
		Message:          "Namespace deleted successfully",
		Namespace:        req.GetNamespace(),
		DeletedResources: deletedResources,
	}, nil
}

func (s *AdminServer) CleanupNamespaceResources(ctx context.Context, req *pb.CleanupNamespaceResourcesRequest) (*pb.CleanupNamespaceResourcesResponse, error) {
	if s.kubeClient == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	var cleanupResults []*pb.ResourceCleanupResult

	for _, resourceType := range req.GetResourceTypes() {
		result := &pb.ResourceCleanupResult{
			ResourceType: resourceType,
		}

		switch strings.ToLower(resourceType) {
		case "deployments":
			deployments, err := s.kubeClient.AppsV1().Deployments(req.GetNamespace()).List(ctx, metav1.ListOptions{})
			if err != nil {
				result.ErrorMessage = err.Error()
			} else {
				for _, deployment := range deployments.Items {
					err := s.kubeClient.AppsV1().Deployments(req.GetNamespace()).Delete(ctx, deployment.Name, metav1.DeleteOptions{})
					deploymentResult := &pb.ResourceCleanupResult{
						ResourceType: "deployment",
						ResourceName: deployment.Name,
						Deleted:      err == nil,
					}
					if err != nil {
						deploymentResult.ErrorMessage = err.Error()
					}
					cleanupResults = append(cleanupResults, deploymentResult)
				}
			}

		case "services":
			services, err := s.kubeClient.CoreV1().Services(req.GetNamespace()).List(ctx, metav1.ListOptions{})
			if err != nil {
				result.ErrorMessage = err.Error()
			} else {
				for _, service := range services.Items {
					// Skip default kubernetes service
					if service.Name == "kubernetes" {
						continue
					}
					err := s.kubeClient.CoreV1().Services(req.GetNamespace()).Delete(ctx, service.Name, metav1.DeleteOptions{})
					serviceResult := &pb.ResourceCleanupResult{
						ResourceType: "service",
						ResourceName: service.Name,
						Deleted:      err == nil,
					}
					if err != nil {
						serviceResult.ErrorMessage = err.Error()
					}
					cleanupResults = append(cleanupResults, serviceResult)
				}
			}

		case "configmaps":
			configMaps, err := s.kubeClient.CoreV1().ConfigMaps(req.GetNamespace()).List(ctx, metav1.ListOptions{})
			if err != nil {
				result.ErrorMessage = err.Error()
			} else {
				for _, cm := range configMaps.Items {
					err := s.kubeClient.CoreV1().ConfigMaps(req.GetNamespace()).Delete(ctx, cm.Name, metav1.DeleteOptions{})
					cmResult := &pb.ResourceCleanupResult{
						ResourceType: "configmap",
						ResourceName: cm.Name,
						Deleted:      err == nil,
					}
					if err != nil {
						cmResult.ErrorMessage = err.Error()
					}
					cleanupResults = append(cleanupResults, cmResult)
				}
			}

		case "secrets":
			secrets, err := s.kubeClient.CoreV1().Secrets(req.GetNamespace()).List(ctx, metav1.ListOptions{})
			if err != nil {
				result.ErrorMessage = err.Error()
			} else {
				for _, secret := range secrets.Items {
					// Skip default service account tokens
					if strings.HasPrefix(secret.Name, "default-token-") {
						continue
					}
					err := s.kubeClient.CoreV1().Secrets(req.GetNamespace()).Delete(ctx, secret.Name, metav1.DeleteOptions{})
					secretResult := &pb.ResourceCleanupResult{
						ResourceType: "secret",
						ResourceName: secret.Name,
						Deleted:      err == nil,
					}
					if err != nil {
						secretResult.ErrorMessage = err.Error()
					}
					cleanupResults = append(cleanupResults, secretResult)
				}
			}

		default:
			result.ErrorMessage = fmt.Sprintf("Unsupported resource type: %s", resourceType)
		}

		if result.ErrorMessage != "" {
			cleanupResults = append(cleanupResults, result)
		}
	}

	return &pb.CleanupNamespaceResourcesResponse{
		Success:        true,
		Message:        fmt.Sprintf("Cleanup completed for %d resource types", len(req.GetResourceTypes())),
		Namespace:      req.GetNamespace(),
		CleanupResults: cleanupResults,
	}, nil
}

// Resource Management Methods

func (s *AdminServer) ListNamespaceResources(ctx context.Context, req *pb.ListNamespaceResourcesRequest) (*pb.ListNamespaceResourcesResponse, error) {
	if s.kubeClient == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	var resources []*pb.KubernetesResource

	switch strings.ToLower(req.GetResourceType()) {
	case "deployments", "":
		deployments, err := s.kubeClient.AppsV1().Deployments(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to list deployments: %v", err)
		}
		for _, deployment := range deployments.Items {
			resources = append(resources, &pb.KubernetesResource{
				Name:      deployment.Name,
				Kind:      "Deployment",
				Namespace: deployment.Namespace,
				CreatedAt: timestamppb.New(deployment.CreationTimestamp.Time),
				Labels:    deployment.Labels,
				Status:    getDeploymentStatus(&deployment),
			})
		}

	case "services":
		services, err := s.kubeClient.CoreV1().Services(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to list services: %v", err)
		}
		for _, service := range services.Items {
			if service.Name == "kubernetes" {
				continue // Skip default service
			}
			resources = append(resources, &pb.KubernetesResource{
				Name:      service.Name,
				Kind:      "Service",
				Namespace: service.Namespace,
				CreatedAt: timestamppb.New(service.CreationTimestamp.Time),
				Labels:    service.Labels,
				Status:    string(service.Spec.Type),
			})
		}

	case "configmaps":
		configMaps, err := s.kubeClient.CoreV1().ConfigMaps(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to list configmaps: %v", err)
		}
		for _, cm := range configMaps.Items {
			resources = append(resources, &pb.KubernetesResource{
				Name:      cm.Name,
				Kind:      "ConfigMap",
				Namespace: cm.Namespace,
				CreatedAt: timestamppb.New(cm.CreationTimestamp.Time),
				Labels:    cm.Labels,
				Status:    "Active",
			})
		}

	case "secrets":
		secrets, err := s.kubeClient.CoreV1().Secrets(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to list secrets: %v", err)
		}
		for _, secret := range secrets.Items {
			if strings.HasPrefix(secret.Name, "default-token-") {
				continue // Skip default tokens
			}
			resources = append(resources, &pb.KubernetesResource{
				Name:      secret.Name,
				Kind:      "Secret",
				Namespace: secret.Namespace,
				CreatedAt: timestamppb.New(secret.CreationTimestamp.Time),
				Labels:    secret.Labels,
				Status:    string(secret.Type),
			})
		}

	case "pods":
		pods, err := s.kubeClient.CoreV1().Pods(req.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to list pods: %v", err)
		}
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

	default:
		return nil, status.Errorf(codes.InvalidArgument, "Unsupported resource type: %s", req.GetResourceType())
	}

	return &pb.ListNamespaceResourcesResponse{
		Success:   true,
		Message:   fmt.Sprintf("Found %d resources", len(resources)),
		Namespace: req.GetNamespace(),
		Resources: resources,
	}, nil
}

func (s *AdminServer) DeleteNamespaceResource(ctx context.Context, req *pb.DeleteNamespaceResourceRequest) (*pb.DeleteNamespaceResourceResponse, error) {
	if s.kubeClient == nil {
		return nil, status.Error(codes.Unavailable, "Kubernetes client not available")
	}

	err := s.deleteKubernetesResource(ctx, req.GetNamespace(), req.GetResourceType(), req.GetResourceName())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to delete resource: %v", err)
	}

	return &pb.DeleteNamespaceResourceResponse{
		Success:      true,
		Message:      "Resource deleted successfully",
		Namespace:    req.GetNamespace(),
		ResourceType: req.GetResourceType(),
		ResourceName: req.GetResourceName(),
	}, nil
}

// Admin Operations Methods

func (s *AdminServer) GetSystemHealth(ctx context.Context, req *pb.GetSystemHealthRequest) (*pb.GetSystemHealthResponse, error) {
	health := &pb.SystemHealth{
		Status:  "healthy",
		Metrics: make(map[string]string),
	}

	// Check Kubernetes
	if s.kubeClient != nil {
		_, err := s.kubeClient.CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})
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
	if s.ldapManager != nil && s.ldapManager.conn != nil {
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
	if s.dbClient != nil {
		if err := s.dbClient.HealthCheck(); err != nil {
			health.Database = &pb.ServiceStatus{
				Status:    "error",
				Message:   err.Error(),
				LastCheck: timestamppb.Now(),
			}
			health.Status = "degraded"
		} else {
			health.Database = &pb.ServiceStatus{
				Status:    "connected",
				Message:   "OK",
				LastCheck: timestamppb.Now(),
			}
		}
	} else {
		health.Database = &pb.ServiceStatus{
			Status:    "disconnected",
			Message:   "Client not initialized",
			LastCheck: timestamppb.Now(),
		}
		health.Status = "degraded"
	}

	// Traefik check (simplified)
	health.Traefik = &pb.ServiceStatus{
		Status:    "connected",
		Message:   "Assumed healthy",
		LastCheck: timestamppb.Now(),
	}

	// Add some metrics
	health.Metrics["uptime"] = time.Since(time.Now().Add(-24 * time.Hour)).String() // Placeholder
	health.Metrics["version"] = "1.0.0"

	return &pb.GetSystemHealthResponse{
		Success: true,
		Message: "Health check completed",
		Health:  health,
	}, nil
}

func (s *AdminServer) GetAdminStats(ctx context.Context, req *pb.GetAdminStatsRequest) (*pb.GetAdminStatsResponse, error) {
	stats := &pb.AdminStats{
		DatabaseTypes: make(map[string]int32),
		UserTypes:     make(map[string]int32),
		LastUpdated:   timestamppb.Now(),
	}

	// Count namespaces
	if s.kubeClient != nil {
		namespaces, err := s.kubeClient.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
		if err == nil {
			stats.TotalNamespaces = int32(len(namespaces.Items))

			// Count active deployments across all namespaces
			for _, ns := range namespaces.Items {
				deployments, err := s.kubeClient.AppsV1().Deployments(ns.Name).List(ctx, metav1.ListOptions{})
				if err == nil {
					stats.ActiveDeployments += int32(len(deployments.Items))
				}
			}
		}
	}

	// Count databases and users from database
	if s.dbClient != nil {
		if totalDatabases, err := s.dbClient.CountDatabases(); err == nil {
			stats.TotalDatabases = int32(totalDatabases)
		}

		if totalUsers, err := s.dbClient.CountUsers(); err == nil {
			stats.TotalUsers = int32(totalUsers)
		}

		if dbTypes, err := s.dbClient.GetDatabaseTypeStats(); err == nil {
			for dbType, count := range dbTypes {
				stats.DatabaseTypes[dbType] = int32(count)
			}
		}
	}

	// Count LDAP users
	if s.ldapManager != nil {
		if internalUsers, err := s.ldapManager.ListLDAPUsers("internal"); err == nil {
			stats.UserTypes["internal"] = int32(len(internalUsers))
		}

		if externalUsers, err := s.ldapManager.ListLDAPUsers("external"); err == nil {
			stats.UserTypes["external"] = int32(len(externalUsers))
		}
	}

	return &pb.GetAdminStatsResponse{
		Success: true,
		Message: "Statistics retrieved",
		Stats:   stats,
	}, nil
}

// Helper methods

func (s *AdminServer) createUserNamespace(ctx context.Context, namespaceName, username string) error {
	namespace := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespaceName,
			Labels: map[string]string{
				"user-uid":   username,
				"managed-by": "admin-service",
			},
			Annotations: map[string]string{
				"created-by":   "admin-service",
				"created-for":  username,
				"created-time": time.Now().Format(time.RFC3339),
			},
		},
	}

	_, err := s.kubeClient.CoreV1().Namespaces().Create(ctx, namespace, metav1.CreateOptions{})
	return err
}

func (s *AdminServer) deleteNamespaceWithResources(ctx context.Context, namespaceName string) error {
	// First delete all resources in the namespace
	if err := s.kubeClient.CoreV1().Pods(namespaceName).DeleteCollection(ctx, metav1.DeleteOptions{}, metav1.ListOptions{}); err != nil {
		log.Printf("Warning: Failed to delete pods in namespace %s: %v", namespaceName, err)
	}

	if err := s.kubeClient.AppsV1().Deployments(namespaceName).DeleteCollection(ctx, metav1.DeleteOptions{}, metav1.ListOptions{}); err != nil {
		log.Printf("Warning: Failed to delete deployments in namespace %s: %v", namespaceName, err)
	}

	if err := s.kubeClient.CoreV1().Services(namespaceName).DeleteCollection(ctx, metav1.DeleteOptions{}, metav1.ListOptions{}); err != nil {
		log.Printf("Warning: Failed to delete services in namespace %s: %v", namespaceName, err)
	}

	// Then delete the namespace
	return s.kubeClient.CoreV1().Namespaces().Delete(ctx, namespaceName, metav1.DeleteOptions{})
}

func (s *AdminServer) getNamespaceResources(ctx context.Context, namespaceName string) ([]*pb.KubernetesResource, error) {
	var resources []*pb.KubernetesResource

	// Get deployments
	deployments, err := s.kubeClient.AppsV1().Deployments(namespaceName).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, deployment := range deployments.Items {
			resources = append(resources, &pb.KubernetesResource{
				Name:      deployment.Name,
				Kind:      "Deployment",
				Namespace: deployment.Namespace,
				CreatedAt: timestamppb.New(deployment.CreationTimestamp.Time),
				Labels:    deployment.Labels,
				Status:    getDeploymentStatus(&deployment),
			})
		}
	}

	// Get services
	services, err := s.kubeClient.CoreV1().Services(namespaceName).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, service := range services.Items {
			if service.Name == "kubernetes" {
				continue
			}
			resources = append(resources, &pb.KubernetesResource{
				Name:      service.Name,
				Kind:      "Service",
				Namespace: service.Namespace,
				CreatedAt: timestamppb.New(service.CreationTimestamp.Time),
				Labels:    service.Labels,
				Status:    string(service.Spec.Type),
			})
		}
	}

	// Get pods
	pods, err := s.kubeClient.CoreV1().Pods(namespaceName).List(ctx, metav1.ListOptions{})
	if err == nil {
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

	return resources, nil
}

func (s *AdminServer) deleteKubernetesResource(ctx context.Context, namespace, resourceType, resourceName string) error {
	switch strings.ToLower(resourceType) {
	case "deployment":
		return s.kubeClient.AppsV1().Deployments(namespace).Delete(ctx, resourceName, metav1.DeleteOptions{})
	case "service":
		return s.kubeClient.CoreV1().Services(namespace).Delete(ctx, resourceName, metav1.DeleteOptions{})
	case "configmap":
		return s.kubeClient.CoreV1().ConfigMaps(namespace).Delete(ctx, resourceName, metav1.DeleteOptions{})
	case "secret":
		return s.kubeClient.CoreV1().Secrets(namespace).Delete(ctx, resourceName, metav1.DeleteOptions{})
	case "pod":
		return s.kubeClient.CoreV1().Pods(namespace).Delete(ctx, resourceName, metav1.DeleteOptions{})
	default:
		return fmt.Errorf("unsupported resource type: %s", resourceType)
	}
}

func getDeploymentStatus(deployment *v1.Deployment) string {
	if deployment.Status.ReadyReplicas == *deployment.Spec.Replicas {
		return "Ready"
	}
	if deployment.Status.ReadyReplicas > 0 {
		return "Partial"
	}
	return "NotReady"
}

// Existing methods (Login, Register, CreateDatabase, etc.) would go here
// These are placeholders for the existing functionality

func (s *AdminServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	// Implement existing login logic
	return nil, status.Error(codes.Unimplemented, "Login not implemented in this example")
}

func (s *AdminServer) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	// Implement existing register logic
	return nil, status.Error(codes.Unimplemented, "Register not implemented in this example")
}

func (s *AdminServer) CreateDatabase(ctx context.Context, req *pb.CreateDatabaseRequest) (*pb.CreateDatabaseResponse, error) {
	// Implement existing database creation logic
	return nil, status.Error(codes.Unimplemented, "CreateDatabase not implemented in this example")
}

func (s *AdminServer) GetUserDatabases(ctx context.Context, req *pb.GetUserDatabasesRequest) (*pb.GetUserDatabasesResponse, error) {
	// Implement existing get user databases logic
	return nil, status.Error(codes.Unimplemented, "GetUserDatabases not implemented in this example")
}

func (s *AdminServer) DeleteDatabase(ctx context.Context, req *pb.DeleteDatabaseRequest) (*pb.DeleteDatabaseResponse, error) {
	// Implement existing database deletion logic
	return nil, status.Error(codes.Unimplemented, "DeleteDatabase not implemented in this example")
}

func (s *AdminServer) GetAllNamespaces(ctx context.Context, req *pb.GetAllNamespacesRequest) (*pb.GetAllNamespacesResponse, error) {
	// Implement existing get all namespaces logic
	return nil, status.Error(codes.Unimplemented, "GetAllNamespaces not implemented in this example")
}

// Main function to start the gRPC server
func main() {
	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	adminServer, err := NewAdminServer()
	if err != nil {
		log.Fatalf("Failed to create admin server: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterAdminServiceServer(grpcServer, adminServer)

	log.Printf("Enhanced Admin gRPC server listening on port %s", port)
	log.Println("📋 Available gRPC methods:")
	log.Println("   - LDAP Management: ListLDAPUsers, GetLDAPUser, CreateLDAPUser, UpdateLDAPUser, DeleteLDAPUser, UpdateLDAPPassword")
	log.Println("   - Namespace Management: GetNamespaceDetails, DeleteNamespace, CleanupNamespaceResources")
	log.Println("   - Resource Management: ListNamespaceResources, DeleteNamespaceResource")
	log.Println("   - Admin Operations: GetSystemHealth, GetAdminStats")

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
