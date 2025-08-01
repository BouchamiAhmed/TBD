package main

import (
	"context"
	"fmt"
	"strconv"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
)

func ensureNamespace(ctx context.Context, clientset *kubernetes.Clientset, namespace string) error {
	_, err := clientset.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
	if err != nil {
		ns := &corev1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespace,
				Labels: map[string]string{
					"app.kubernetes.io/managed-by": "db-saas",
					"db-saas/user-namespace":       "true",
				},
			},
		}
		_, err = clientset.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
		if err != nil {
			return err
		}
		fmt.Printf("✅ Created namespace: %s\n", namespace)
	}
	return nil
}

// deployPostgreSQL deploys PostgreSQL database with pgAdmin and Traefik routing
func deployPostgreSQL(ctx context.Context, clientset *kubernetes.Clientset, dbRequest DatabaseRequest, namespace string) error {
	// Create PostgreSQL deployment
	postgresDeployment := createPostgreSQLDeployment(dbRequest, namespace)
	_, err := clientset.AppsV1().Deployments(namespace).Create(ctx, postgresDeployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create PostgreSQL deployment: %w", err)
	}
	fmt.Printf("✅ Created PostgreSQL deployment: %s\n", dbRequest.Name)

	// Create PostgreSQL service
	postgresService := createPostgreSQLService(dbRequest)
	_, err = clientset.CoreV1().Services(namespace).Create(ctx, postgresService, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create PostgreSQL service: %w", err)
	}
	fmt.Printf("✅ Created PostgreSQL service: %s\n", dbRequest.Name)

	// Create pgAdmin deployment
	pgAdminDeployment := createPgAdminDeployment(dbRequest, namespace)
	_, err = clientset.AppsV1().Deployments(namespace).Create(ctx, pgAdminDeployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create pgAdmin deployment: %w", err)
	}
	fmt.Printf("✅ Created pgAdmin deployment: %s-pgadmin\n", dbRequest.Name)

	// Create pgAdmin service (ClusterIP)
	pgAdminService := createPgAdminService(dbRequest)
	_, err = clientset.CoreV1().Services(namespace).Create(ctx, pgAdminService, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create pgAdmin service: %w", err)
	}
	fmt.Printf("✅ Created pgAdmin ClusterIP service: %s-pgadmin\n", dbRequest.Name)

	// Create ONLY headers middleware for pgAdmin (NO stripPrefix)
	if err := createPgAdminMiddleware(ctx, dbRequest, namespace); err != nil {
		return fmt.Errorf("failed to create pgAdmin middleware: %w", err)
	}
	fmt.Printf("✅ Created pgAdmin headers middleware (NO strip prefix)\n")

	// Create Traefik IngressRoute for pgAdmin (NO stripPrefix)
	if err := createPgAdminIngressRoute(ctx, dbRequest, namespace, 80); err != nil {
		return fmt.Errorf("failed to create pgAdmin IngressRoute: %w", err)
	}
	fmt.Printf("✅ Created pgAdmin IngressRoute (NO strip prefix)\n")

	return nil
}

// createPgAdminMiddleware creates ONLY headers middleware for pgAdmin
func createPgAdminMiddleware(ctx context.Context, dbRequest DatabaseRequest, namespace string) error {
	if dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	// ONLY headers middleware - NO stripPrefix
	headersMiddleware := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "traefik.io/v1alpha1",
			"kind":       "Middleware",
			"metadata": map[string]interface{}{
				"name":      fmt.Sprintf("%s-pgadmin-headers", dbRequest.Name),
				"namespace": namespace,
			},
			"spec": map[string]interface{}{
				"headers": map[string]interface{}{
					"customRequestHeaders": map[string]interface{}{
						"X-User-ID":   strconv.Itoa(dbRequest.UserID),
						"X-Username":  dbRequest.Username,
						"X-Namespace": namespace,
					},
				},
			},
		},
	}

	headersGVR := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "middlewares",
	}

	_, err := dynamicClient.Resource(headersGVR).Namespace(namespace).Create(ctx, headersMiddleware, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create headers middleware: %w", err)
	}

	fmt.Printf("✅ Created ONLY headers middleware for pgAdmin (no stripPrefix)\n")
	return nil
}

// createPgAdminIngressRoute creates IngressRoute for pgAdmin WITHOUT stripPrefix
func createPgAdminIngressRoute(ctx context.Context, dbRequest DatabaseRequest, namespace string, port int) error {
	if dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	ingressName := fmt.Sprintf("%s-pgadmin-ingress", dbRequest.Name)
	serviceName := fmt.Sprintf("%s-pgadmin", dbRequest.Name)
	headersMW := fmt.Sprintf("%s-pgadmin-headers", dbRequest.Name)
	pathPrefix := fmt.Sprintf("/%s/%s-pgadmin", namespace, dbRequest.Name)

	fmt.Printf("🔍 Creating pgAdmin IngressRoute:\n")
	fmt.Printf("   - Service: %s (port %d)\n", serviceName, port)
	fmt.Printf("   - Path: %s\n", pathPrefix)
	fmt.Printf("   - Middleware: %s (headers ONLY, NO stripPrefix)\n", headersMW)

	ingressRoute := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "traefik.io/v1alpha1",
			"kind":       "IngressRoute",
			"metadata": map[string]interface{}{
				"name":      ingressName,
				"namespace": namespace,
				"labels": map[string]interface{}{
					"app":                          serviceName,
					"app.kubernetes.io/managed-by": "db-saas",
				},
			},
			"spec": map[string]interface{}{
				"entryPoints": []interface{}{"web"},
				"routes": []interface{}{
					map[string]interface{}{
						"match": fmt.Sprintf(`Host("10.9.21.201") && PathPrefix("%s")`, pathPrefix),
						"kind":  "Rule",
						// CRITICAL: ONLY headers middleware, NO stripPrefix
						"middlewares": []interface{}{
							map[string]interface{}{"name": headersMW},
						},
						"services": []interface{}{
							map[string]interface{}{
								"name": serviceName,
								"port": port,
							},
						},
					},
				},
			},
		},
	}

	gvr := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "ingressroutes",
	}

	_, err := dynamicClient.Resource(gvr).Namespace(namespace).Create(ctx, ingressRoute, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create IngressRoute: %w", err)
	}

	fmt.Printf("✅ Created pgAdmin IngressRoute: %s (NO stripPrefix)\n", ingressName)
	return nil
}

// Simplified pgAdmin deployment
func createPgAdminDeployment(dbRequest DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	scriptName := fmt.Sprintf("/%s/%s-pgadmin", namespace, dbRequest.Name)

	fmt.Printf("🔍 pgAdmin SCRIPT_NAME: %s\n", scriptName)
	fmt.Printf("🔍 pgAdmin should receive full paths like: %s/login\n", scriptName)

	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      dbRequest.Name + "-pgadmin",
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          dbRequest.Name + "-pgadmin",
				"app.kubernetes.io/managed-by": "db-saas",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": dbRequest.Name + "-pgadmin",
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": dbRequest.Name + "-pgadmin",
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "pgadmin",
							Image: "dpage/pgadmin4:latest",
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 80,
								},
							},
							Env: []corev1.EnvVar{
								{Name: "PGADMIN_DEFAULT_EMAIL", Value: fmt.Sprintf("%s@gmail.com", dbRequest.Username)},
								{Name: "PGADMIN_DEFAULT_PASSWORD", Value: dbRequest.Password},
								// CRITICAL: Tell pgAdmin its subdirectory
								{Name: "SCRIPT_NAME", Value: scriptName},
								// Disable problematic features
								{Name: "PGADMIN_CONFIG_WTF_CSRF_ENABLED", Value: "False"},
								{Name: "PGADMIN_CONFIG_SESSION_COOKIE_SECURE", Value: "False"},
								// Ensure it binds to all interfaces
								{Name: "PGADMIN_LISTEN_ADDRESS", Value: "0.0.0.0"},
								{Name: "PGADMIN_LISTEN_PORT", Value: "80"},
							},
						},
					},
				},
			},
		},
	}
}

// Simple pgAdmin service
func createPgAdminService(dbRequest DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: dbRequest.Name + "-pgadmin",
			Labels: map[string]string{
				"app": dbRequest.Name + "-pgadmin",
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Port:       80,
					TargetPort: intstr.FromInt(80),
				},
			},
			Selector: map[string]string{
				"app": dbRequest.Name + "-pgadmin",
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

// CORRECT SOLUTION: Use ReplacePathRegex instead of StripPrefix for phpMyAdmin
func createTraefikMiddleware(ctx context.Context, dbRequest DatabaseRequest, namespace, adminType string) error {
	if dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	// === Create HEADERS middleware (for both) ===
	headersMiddleware := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "traefik.io/v1alpha1",
			"kind":       "Middleware",
			"metadata": map[string]interface{}{
				"name":      fmt.Sprintf("%s-%s-headers", dbRequest.Name, adminType),
				"namespace": namespace,
			},
			"spec": map[string]interface{}{
				"headers": map[string]interface{}{
					"customRequestHeaders": map[string]interface{}{
						"X-User-ID":   strconv.Itoa(dbRequest.UserID),
						"X-Username":  dbRequest.Username,
						"X-Namespace": namespace,
					},
				},
			},
		},
	}

	headersGVR := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "middlewares",
	}

	if _, err := dynamicClient.Resource(headersGVR).Namespace(namespace).Create(ctx, headersMiddleware, metav1.CreateOptions{}); err != nil {
		return fmt.Errorf("failed to create headers middleware: %w", err)
	}

	// === Create REPLACEPATHREGEX middleware ONLY for phpMyAdmin ===
	if adminType == "phpmyadmin" {
		pathPrefix := fmt.Sprintf("/%s/%s-%s", namespace, dbRequest.Name, adminType)
		// This regex replaces /namespace/dbname-phpmyadmin/(.*) with /$1
		replacePathMiddleware := &unstructured.Unstructured{
			Object: map[string]interface{}{
				"apiVersion": "traefik.io/v1alpha1",
				"kind":       "Middleware",
				"metadata": map[string]interface{}{
					"name":      fmt.Sprintf("%s-%s-replacepath", dbRequest.Name, adminType),
					"namespace": namespace,
				},
				"spec": map[string]interface{}{
					"replacePathRegex": map[string]interface{}{
						"regex":       fmt.Sprintf(`^%s/(.*)`, pathPrefix),
						"replacement": "/$1",
					},
				},
			},
		}

		if _, err := dynamicClient.Resource(headersGVR).Namespace(namespace).Create(ctx, replacePathMiddleware, metav1.CreateOptions{}); err != nil {
			return fmt.Errorf("failed to create replacePathRegex middleware: %w", err)
		}

		fmt.Printf("✅ Created headers and replacePathRegex middlewares for %s-%s\n", dbRequest.Name, adminType)
		fmt.Printf("💡 phpMyAdmin: path %s will be rewritten using regex\n", pathPrefix)
	} else if adminType == "pgadmin" {
		fmt.Printf("✅ Created headers middleware for %s-%s (NO path rewriting for pgAdmin)\n", dbRequest.Name, adminType)
	}

	return nil
}

// Update the IngressRoute to use replacePathRegex instead of stripPrefix
func createTraefikIngressRoute(ctx context.Context, dbRequest DatabaseRequest, namespace, adminType string, port int) error {
	if dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	ingressName := fmt.Sprintf("%s-%s-ingress", dbRequest.Name, adminType)
	serviceName := fmt.Sprintf("%s-%s", dbRequest.Name, adminType)
	headersMW := fmt.Sprintf("%s-%s-headers", dbRequest.Name, adminType)
	pathPrefix := fmt.Sprintf("/%s/%s-%s", namespace, dbRequest.Name, adminType)

	var middlewares []interface{}
	middlewares = append(middlewares, map[string]interface{}{"name": headersMW})

	// ONLY add replacePathRegex for phpMyAdmin, NOT for pgAdmin
	if adminType == "phpmyadmin" {
		replacePathMW := fmt.Sprintf("%s-%s-replacepath", dbRequest.Name, adminType)
		middlewares = append(middlewares, map[string]interface{}{"name": replacePathMW})
		fmt.Printf("🔍 phpMyAdmin IngressRoute: PathPrefix=%s WITH ReplacePathRegex\n", pathPrefix)
	} else if adminType == "pgadmin" {
		fmt.Printf("🔍 pgAdmin IngressRoute: PathPrefix=%s WITHOUT path rewriting\n", pathPrefix)
	}

	ingressRoute := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "traefik.io/v1alpha1",
			"kind":       "IngressRoute",
			"metadata": map[string]interface{}{
				"name":      ingressName,
				"namespace": namespace,
				"labels": map[string]interface{}{
					"app":                          serviceName,
					"app.kubernetes.io/managed-by": "db-saas",
				},
			},
			"spec": map[string]interface{}{
				"entryPoints": []interface{}{"web"},
				"routes": []interface{}{
					map[string]interface{}{
						"match":       fmt.Sprintf(`Host("10.9.21.201") && PathPrefix("%s")`, pathPrefix),
						"kind":        "Rule",
						"middlewares": middlewares,
						"services": []interface{}{
							map[string]interface{}{
								"name": serviceName,
								"port": port,
							},
						},
					},
				},
			},
		},
	}

	gvr := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "ingressroutes",
	}

	_, err := dynamicClient.Resource(gvr).Namespace(namespace).Create(ctx, ingressRoute, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create IngressRoute: %w", err)
	}

	fmt.Printf("✅ Created IngressRoute: %s\n", ingressName)
	return nil
}

// Simplified phpMyAdmin deployment - remove the complex config since we're fixing it at Traefik level
func createPhpMyAdminDeployment(dbRequest DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)

	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      dbRequest.Name + "-phpmyadmin",
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          dbRequest.Name + "-phpmyadmin",
				"app.kubernetes.io/component":  "admin-dashboard",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "phpmyadmin",
				"db-saas/user-id":              strconv.Itoa(dbRequest.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": dbRequest.Name + "-phpmyadmin",
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": dbRequest.Name + "-phpmyadmin",
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "phpmyadmin",
							Image: "phpmyadmin:5.2",
							Ports: []corev1.ContainerPort{{ContainerPort: 80}},
							Env: []corev1.EnvVar{
								{Name: "PMA_HOST", Value: dbRequest.Name},
								{Name: "PMA_PORT", Value: "3306"},
								{Name: "PMA_USER", Value: dbRequest.Username},
								{Name: "PMA_PASSWORD", Value: dbRequest.Password},
								{Name: "MYSQL_ROOT_PASSWORD", Value: dbRequest.Password},
								// NO PMA_ABSOLUTE_URI needed with ReplacePathRegex approach!
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("128Mi"),
									corev1.ResourceCPU:    mustParseQuantity("50m"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("256Mi"),
									corev1.ResourceCPU:    mustParseQuantity("200m"),
								},
							},
						},
					},
				},
			},
		},
	}
}

// MySQL resource creation functions
func createMySQLDeployment(dbRequest DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      dbRequest.Name,
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          dbRequest.Name,
				"app.kubernetes.io/component":  "database",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "mysql",
				"db-saas/user-id":              strconv.Itoa(dbRequest.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": dbRequest.Name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": dbRequest.Name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "mysql",
							Image: "mysql:latest",
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 3306,
								},
							},
							Env: []corev1.EnvVar{
								{Name: "MYSQL_ROOT_PASSWORD", Value: dbRequest.Password},
								{Name: "MYSQL_DATABASE", Value: dbRequest.Name},
								{Name: "MYSQL_USER", Value: dbRequest.Username},
								{Name: "MYSQL_PASSWORD", Value: dbRequest.Password},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("256Mi"),
									corev1.ResourceCPU:    mustParseQuantity("100m"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("512Mi"),
									corev1.ResourceCPU:    mustParseQuantity("500m"),
								},
							},
						},
					},
				},
			},
		},
	}
}

func createMySQLService(dbRequest DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: dbRequest.Name,
			Labels: map[string]string{
				"app": dbRequest.Name,
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Port:       3306,
					TargetPort: intstr.FromInt(3306),
					Protocol:   corev1.ProtocolTCP,
					Name:       "mysql",
				},
			},
			Selector: map[string]string{
				"app": dbRequest.Name,
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

/*
	func createPhpMyAdminDeployment(dbRequest DatabaseRequest, namespace string) *appsv1.Deployment {
		replicas := int32(1)
		// Calculate the absolute URI for phpMyAdmin
		absoluteURI := fmt.Sprintf("http://10.9.21.201/%s/%s-phpmyadmin", namespace, dbRequest.Name)
		fmt.Printf("🔍 This is the URI %s", absoluteURI)

		return &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:      dbRequest.Name + "-phpmyadmin",
				Namespace: namespace,
				Labels: map[string]string{
					"app":                          dbRequest.Name + "-phpmyadmin",
					"app.kubernetes.io/component":  "admin-dashboard",
					"app.kubernetes.io/managed-by": "db-saas",
					"db-saas/type":                 "phpmyadmin",
					"db-saas/user-id":              strconv.Itoa(dbRequest.UserID),
				},
			},
			Spec: appsv1.DeploymentSpec{
				Replicas: &replicas,
				Selector: &metav1.LabelSelector{
					MatchLabels: map[string]string{
						"app": dbRequest.Name + "-phpmyadmin",
					},
				},
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{
						Labels: map[string]string{
							"app": dbRequest.Name + "-phpmyadmin",
						},
					},
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{
								Name:  "phpmyadmin",
								Image: "phpmyadmin:5.2",
								Ports: []corev1.ContainerPort{{ContainerPort: 80}},
								Env: []corev1.EnvVar{
									{Name: "PMA_HOST", Value: dbRequest.Name},
									{Name: "PMA_PORT", Value: "3306"},
									{Name: "PMA_USER", Value: dbRequest.Username},
									{Name: "PMA_PASSWORD", Value: dbRequest.Password},
									{Name: "MYSQL_ROOT_PASSWORD", Value: dbRequest.Password},
									// NO PMA_ABSOLUTE_URI needed with ReplacePathRegex approach!
								},
								Resources: corev1.ResourceRequirements{
									Requests: corev1.ResourceList{
										corev1.ResourceMemory: mustParseQuantity("128Mi"),
										corev1.ResourceCPU:    mustParseQuantity("50m"),
									},
									Limits: corev1.ResourceList{
										corev1.ResourceMemory: mustParseQuantity("256Mi"),
										corev1.ResourceCPU:    mustParseQuantity("200m"),
									},
								},
							},
						},
					},
				},
			},
		}
	}
*/
func createPhpMyAdminService(dbRequest DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: dbRequest.Name + "-phpmyadmin",
			Labels: map[string]string{
				"app":                          dbRequest.Name + "-phpmyadmin",
				"app.kubernetes.io/component":  "admin-dashboard",
				"app.kubernetes.io/managed-by": "db-saas",
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Port:       80, // Internal cluster port
					TargetPort: intstr.FromInt(80),
					Protocol:   corev1.ProtocolTCP,
					Name:       "http",
				},
			},
			Selector: map[string]string{
				"app": dbRequest.Name + "-phpmyadmin",
			},
			Type: corev1.ServiceTypeClusterIP, // Changed from LoadBalancer
		},
	}
}

// PostgreSQL resource creation functions
func createPostgreSQLDeployment(dbRequest DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      dbRequest.Name,
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          dbRequest.Name,
				"app.kubernetes.io/component":  "database",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "postgresql",
				"db-saas/user-id":              strconv.Itoa(dbRequest.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": dbRequest.Name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": dbRequest.Name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "postgres",
							Image: "postgres:latest",
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 5432,
								},
							},
							Env: []corev1.EnvVar{
								{Name: "POSTGRES_DB", Value: dbRequest.Name},
								{Name: "POSTGRES_USER", Value: dbRequest.Username},
								{Name: "POSTGRES_PASSWORD", Value: dbRequest.Password},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("256Mi"),
									corev1.ResourceCPU:    mustParseQuantity("100m"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("512Mi"),
									corev1.ResourceCPU:    mustParseQuantity("500m"),
								},
							},
						},
					},
				},
			},
		},
	}
}

func createPostgreSQLService(dbRequest DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: dbRequest.Name,
			Labels: map[string]string{
				"app": dbRequest.Name,
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Port:       5432,
					TargetPort: intstr.FromInt(5432),
					Protocol:   corev1.ProtocolTCP,
					Name:       "postgres",
				},
			},
			Selector: map[string]string{
				"app": dbRequest.Name,
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

// deleteDatabaseDeployment removes all resources for a database
func deleteDatabaseDeployment(dbName, namespace string) error {
	ctx := context.Background()

	fmt.Printf("🗑️ Starting deletion of database '%s' in namespace '%s'\n", dbName, namespace)

	// First, determine the database type by checking existing deployments
	dbType, err := getDatabaseType(dbName, namespace)
	if err != nil {
		return fmt.Errorf("failed to determine database type: %w", err)
	}

	fmt.Printf("📝 Detected database type: %s\n", dbType)

	// Delete based on database type
	if dbType == "mysql" {
		return deleteMySQLResources(ctx, dbName, namespace)
	} else if dbType == "postgresql" {
		return deletePostgreSQLResources(ctx, dbName, namespace)
	}

	return fmt.Errorf("unknown database type: %s", dbType)
}

// getDatabaseType determines if database is MySQL or PostgreSQL
func getDatabaseType(dbName, namespace string) (string, error) {
	ctx := context.Background()

	// Check deployment labels to determine type
	deployment, err := clientset.AppsV1().Deployments(namespace).Get(ctx, dbName, metav1.GetOptions{})
	if err != nil {
		return "", err
	}

	if dbType, exists := deployment.Labels["db-saas/type"]; exists {
		return dbType, nil
	}

	return "", fmt.Errorf("database type not found in labels")
}

// deleteMySQLResources removes all MySQL-related resources
func deleteMySQLResources(ctx context.Context, dbName, namespace string) error {
	fmt.Printf("🗑️ Deleting MySQL resources for '%s'\n", dbName)

	// Delete Traefik IngressRoute
	if err := deleteTraefikIngressRoute(ctx, dbName, namespace, "phpmyadmin"); err != nil {
		fmt.Printf("Warning: Failed to delete IngressRoute: %v\n", err)
	}

	// Delete Traefik Middleware
	if err := deleteTraefikMiddleware(ctx, dbName, namespace, "phpmyadmin"); err != nil {
		fmt.Printf("Warning: Failed to delete Middleware: %v\n", err)
	}

	// Delete phpMyAdmin service
	if err := clientset.CoreV1().Services(namespace).Delete(ctx, dbName+"-phpmyadmin", metav1.DeleteOptions{}); err != nil {
		fmt.Printf("Warning: Failed to delete phpMyAdmin service: %v\n", err)
	} else {
		fmt.Printf("✅ Deleted phpMyAdmin service\n")
	}

	// Delete phpMyAdmin deployment
	if err := clientset.AppsV1().Deployments(namespace).Delete(ctx, dbName+"-phpmyadmin", metav1.DeleteOptions{}); err != nil {
		fmt.Printf("Warning: Failed to delete phpMyAdmin deployment: %v\n", err)
	} else {
		fmt.Printf("✅ Deleted phpMyAdmin deployment\n")
	}

	// Delete MySQL service
	if err := clientset.CoreV1().Services(namespace).Delete(ctx, dbName, metav1.DeleteOptions{}); err != nil {
		fmt.Printf("Warning: Failed to delete MySQL service: %v\n", err)
	} else {
		fmt.Printf("✅ Deleted MySQL service\n")
	}

	// Delete MySQL deployment
	if err := clientset.AppsV1().Deployments(namespace).Delete(ctx, dbName, metav1.DeleteOptions{}); err != nil {
		return fmt.Errorf("failed to delete MySQL deployment: %w", err)
	}
	fmt.Printf("✅ Deleted MySQL deployment\n")

	return nil
}

// deletePostgreSQLResources removes all PostgreSQL-related resources
func deletePostgreSQLResources(ctx context.Context, dbName, namespace string) error {
	fmt.Printf("🗑️ Deleting PostgreSQL resources for '%s'\n", dbName)

	// Delete Traefik IngressRoute
	if err := deleteTraefikIngressRoute(ctx, dbName, namespace, "pgadmin"); err != nil {
		fmt.Printf("Warning: Failed to delete IngressRoute: %v\n", err)
	}

	// Delete Traefik Middleware
	if err := deleteTraefikMiddleware(ctx, dbName, namespace, "pgadmin"); err != nil {
		fmt.Printf("Warning: Failed to delete Middleware: %v\n", err)
	}

	// Delete pgAdmin service
	if err := clientset.CoreV1().Services(namespace).Delete(ctx, dbName+"-pgadmin", metav1.DeleteOptions{}); err != nil {
		fmt.Printf("Warning: Failed to delete pgAdmin service: %v\n", err)
	} else {
		fmt.Printf("✅ Deleted pgAdmin service\n")
	}

	// Delete pgAdmin deployment
	if err := clientset.AppsV1().Deployments(namespace).Delete(ctx, dbName+"-pgadmin", metav1.DeleteOptions{}); err != nil {
		fmt.Printf("Warning: Failed to delete pgAdmin deployment: %v\n", err)
	} else {
		fmt.Printf("✅ Deleted pgAdmin deployment\n")
	}

	// Delete PostgreSQL service
	if err := clientset.CoreV1().Services(namespace).Delete(ctx, dbName, metav1.DeleteOptions{}); err != nil {
		fmt.Printf("Warning: Failed to delete PostgreSQL service: %v\n", err)
	} else {
		fmt.Printf("✅ Deleted PostgreSQL service\n")
	}

	// Delete PostgreSQL deployment
	if err := clientset.AppsV1().Deployments(namespace).Delete(ctx, dbName, metav1.DeleteOptions{}); err != nil {
		return fmt.Errorf("failed to delete PostgreSQL deployment: %w", err)
	}
	fmt.Printf("✅ Deleted PostgreSQL deployment\n")

	return nil
}

// deleteTraefikIngressRoute removes a Traefik IngressRoute
func deleteTraefikIngressRoute(ctx context.Context, dbName, namespace, adminType string) error {
	if dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	ingressName := fmt.Sprintf("%s-%s-ingress", dbName, adminType)

	gvr := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "ingressroutes",
	}

	err := dynamicClient.Resource(gvr).Namespace(namespace).Delete(ctx, ingressName, metav1.DeleteOptions{})
	if err != nil {
		return err
	}

	fmt.Printf("✅ Deleted Traefik IngressRoute: %s\n", ingressName)
	return nil
}

// deleteTraefikMiddleware removes a Traefik Middleware
func deleteTraefikMiddleware(ctx context.Context, dbName, namespace, adminType string) error {
	if dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	middlewareName := fmt.Sprintf("%s-%s-stripprefix", dbName, adminType)

	gvr := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "middlewares",
	}

	err := dynamicClient.Resource(gvr).Namespace(namespace).Delete(ctx, middlewareName, metav1.DeleteOptions{})
	if err != nil {
		return err
	}

	fmt.Printf("✅ Deleted Traefik Middleware: %s\n", middlewareName)
	return nil
}

// listDatabasesInNamespace returns all databases in a namespace
// listDatabasesInNamespace returns all databases in a namespace with STABLE URLs
func listDatabasesInNamespace(namespace string) ([]map[string]interface{}, error) {
	ctx := context.Background()

	// Get all deployments with db-saas labels
	deployments, err := clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: "app.kubernetes.io/managed-by=db-saas,app.kubernetes.io/component=database",
	})
	if err != nil {
		return nil, err
	}

	var databases []map[string]interface{}

	for _, deployment := range deployments.Items {
		dbType := deployment.Labels["db-saas/type"]
		userID := deployment.Labels["db-saas/user-id"]

		// Get service to check if it's running
		_, err := clientset.CoreV1().Services(namespace).Get(ctx, deployment.Name, metav1.GetOptions{})
		status := "running"
		if err != nil {
			status = "error"
		}

		// STABLE URL PATTERN: /{namespace}/admin/{adminType}/{dbname}
		adminURL := ""
		adminType := ""
		if dbType == "mysql" {
			adminURL = fmt.Sprintf("http://10.9.21.201/%s/admin/phpmyadmin/%s", namespace, deployment.Name)
			adminType = "phpMyAdmin"
		} else if dbType == "postgresql" {
			adminURL = fmt.Sprintf("http://10.9.21.201/%s/admin/pgadmin/%s", namespace, deployment.Name)
			adminType = "pgAdmin"
		}

		database := map[string]interface{}{
			"name":      deployment.Name,
			"type":      dbType,
			"status":    status,
			"namespace": namespace,
			"userId":    userID,
			"adminUrl":  adminURL,
			"adminType": adminType,
			"createdAt": deployment.CreationTimestamp.Time,
		}

		databases = append(databases, database)
	}

	return databases, nil
}

// Helper function to parse resource quantities
func mustParseQuantity(str string) resource.Quantity {
	q, err := resource.ParseQuantity(str)
	if err != nil {
		panic(err)
	}
	return q
}

// deployMySQL deploys MySQL database with phpMyAdmin and Traefik routing
func deployMySQL(ctx context.Context, clientset *kubernetes.Clientset, dbRequest DatabaseRequest, namespace string) error {
	// Create MySQL deployment
	mysqlDeployment := createMySQLDeployment(dbRequest, namespace)
	_, err := clientset.AppsV1().Deployments(namespace).Create(ctx, mysqlDeployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create MySQL deployment: %w", err)
	}
	fmt.Printf("✅ Created MySQL deployment: %s\n", dbRequest.Name)

	// Create MySQL service
	mysqlService := createMySQLService(dbRequest)
	_, err = clientset.CoreV1().Services(namespace).Create(ctx, mysqlService, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create MySQL service: %w", err)
	}
	fmt.Printf("✅ Created MySQL service: %s\n", dbRequest.Name)

	// Create phpMyAdmin deployment
	phpMyAdminDeployment := createPhpMyAdminDeployment(dbRequest, namespace)
	_, err = clientset.AppsV1().Deployments(namespace).Create(ctx, phpMyAdminDeployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create phpMyAdmin deployment: %w", err)
	}
	fmt.Printf("✅ Created phpMyAdmin deployment: %s-phpmyadmin\n", dbRequest.Name)

	// Create phpMyAdmin service (ClusterIP)
	phpMyAdminService := createPhpMyAdminService(dbRequest)
	_, err = clientset.CoreV1().Services(namespace).Create(ctx, phpMyAdminService, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create phpMyAdmin service: %w", err)
	}
	fmt.Printf("✅ Created phpMyAdmin ClusterIP service: %s-phpmyadmin\n", dbRequest.Name)

	// Create Traefik Middleware for path stripping
	if err := createTraefikMiddleware(ctx, dbRequest, namespace, "phpmyadmin"); err != nil {
		return fmt.Errorf("failed to create Traefik middleware: %w", err)
	}
	fmt.Printf("✅ Created Traefik middleware for phpMyAdmin\n")

	// Create Traefik IngressRoute (port 80 since it's ClusterIP)
	if err := createTraefikIngressRoute(ctx, dbRequest, namespace, "phpmyadmin", 80); err != nil {
		return fmt.Errorf("failed to create Traefik IngressRoute: %w", err)
	}
	fmt.Printf("✅ Created Traefik IngressRoute for phpMyAdmin\n")

	return nil
}
