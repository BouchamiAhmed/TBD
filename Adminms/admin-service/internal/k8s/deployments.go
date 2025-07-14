// internal/k8s/deployments.go - Your existing deployment creation logic
package k8s

import (
	"context"
	"fmt"
	"strconv"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// PostgreSQL resource creation functions
func (k *K8sService) createPostgreSQLDeployment(req *DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Name,
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          req.Name,
				"app.kubernetes.io/component":  "database",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "postgresql",
				"db-saas/user-id":              strconv.Itoa(req.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": req.Name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": req.Name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "postgres",
							Image: "postgres:14",
							Ports: []corev1.ContainerPort{
								{ContainerPort: 5432},
							},
							Env: []corev1.EnvVar{
								{Name: "POSTGRES_DB", Value: req.Name},
								{Name: "POSTGRES_USER", Value: req.Username},
								{Name: "POSTGRES_PASSWORD", Value: req.Password},
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

func (k *K8sService) createPostgreSQLService(req *DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
			Labels: map[string]string{
				"app": req.Name,
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
				"app": req.Name,
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

func (k *K8sService) createPgAdminDeployment(req *DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Name + "-pgadmin",
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          req.Name + "-pgadmin",
				"app.kubernetes.io/component":  "admin-dashboard",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "pgadmin",
				"db-saas/user-id":              strconv.Itoa(req.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": req.Name + "-pgadmin",
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": req.Name + "-pgadmin",
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "pgadmin",
							Image: "dpage/pgadmin4:latest",
							Ports: []corev1.ContainerPort{
								{ContainerPort: 80},
							},
							Env: []corev1.EnvVar{
								{Name: "PGADMIN_DEFAULT_EMAIL", Value: fmt.Sprintf("admin%s@gmail.com", req.Name)},
								{Name: "PGADMIN_DEFAULT_PASSWORD", Value: req.Password},
								{Name: "PGADMIN_CONFIG_SERVER_MODE", Value: "False"},
								{Name: "PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED", Value: "False"},
								// Removed SCRIPT_NAME - let it work at root path after StripPrefix
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("256Mi"),
									corev1.ResourceCPU:    mustParseQuantity("100m"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: mustParseQuantity("512Mi"),
									corev1.ResourceCPU:    mustParseQuantity("300m"),
								},
							},
						},
					},
				},
			},
		},
	}
}

func (k *K8sService) createPgAdminService(req *DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name + "-pgadmin",
			Labels: map[string]string{
				"app":                          req.Name + "-pgadmin",
				"app.kubernetes.io/component":  "admin-dashboard",
				"app.kubernetes.io/managed-by": "db-saas",
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Port:       80,
					TargetPort: intstr.FromInt(80),
					Protocol:   corev1.ProtocolTCP,
					Name:       "http",
				},
			},
			Selector: map[string]string{
				"app": req.Name + "-pgadmin",
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

// MySQL resource creation functions
func (k *K8sService) createMySQLDeployment(req *DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Name,
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          req.Name,
				"app.kubernetes.io/component":  "database",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "mysql",
				"db-saas/user-id":              strconv.Itoa(req.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": req.Name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": req.Name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "mysql",
							Image: "mysql:8.0",
							Ports: []corev1.ContainerPort{
								{ContainerPort: 3306},
							},
							Env: []corev1.EnvVar{
								{Name: "MYSQL_ROOT_PASSWORD", Value: req.Password},
								{Name: "MYSQL_DATABASE", Value: req.Name},
								{Name: "MYSQL_USER", Value: req.Username},
								{Name: "MYSQL_PASSWORD", Value: req.Password},
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

func (k *K8sService) createMySQLService(req *DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
			Labels: map[string]string{
				"app": req.Name,
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
				"app": req.Name,
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

func (k *K8sService) createPhpMyAdminDeployment(req *DatabaseRequest, namespace string) *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      req.Name + "-phpmyadmin",
			Namespace: namespace,
			Labels: map[string]string{
				"app":                          req.Name + "-phpmyadmin",
				"app.kubernetes.io/component":  "admin-dashboard",
				"app.kubernetes.io/managed-by": "db-saas",
				"db-saas/type":                 "phpmyadmin",
				"db-saas/user-id":              strconv.Itoa(req.UserID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": req.Name + "-phpmyadmin",
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": req.Name + "-phpmyadmin",
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "phpmyadmin",
							Image: "phpmyadmin:5.2",
							Ports: []corev1.ContainerPort{
								{ContainerPort: 80},
							},
							Env: []corev1.EnvVar{
								{Name: "PMA_HOST", Value: req.Name},
								{Name: "PMA_PORT", Value: "3306"},
								{Name: "PMA_USER", Value: req.Username},
								{Name: "PMA_PASSWORD", Value: req.Password},
								{Name: "MYSQL_ROOT_PASSWORD", Value: req.Password},
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

func (k *K8sService) createPhpMyAdminService(req *DatabaseRequest) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name + "-phpmyadmin",
			Labels: map[string]string{
				"app":                          req.Name + "-phpmyadmin",
				"app.kubernetes.io/component":  "admin-dashboard",
				"app.kubernetes.io/managed-by": "db-saas",
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Port:       80,
					TargetPort: intstr.FromInt(80),
					Protocol:   corev1.ProtocolTCP,
					Name:       "http",
				},
			},
			Selector: map[string]string{
				"app": req.Name + "-phpmyadmin",
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}
}

// createTraefikResources creates Traefik middleware and ingress (simplified version)
func (k *K8sService) createTraefikResources(ctx context.Context, req *DatabaseRequest, namespace, adminType string) error {
	if k.dynamicClient == nil {
		return fmt.Errorf("dynamic client not available")
	}

	pathPrefix := fmt.Sprintf("/%s/%s-%s", namespace, req.Name, adminType)

	// Create StripPrefix middleware
	stripMiddleware := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "traefik.io/v1alpha1",
			"kind":       "Middleware",
			"metadata": map[string]interface{}{
				"name":      fmt.Sprintf("%s-%s-stripprefix", req.Name, adminType),
				"namespace": namespace,
			},
			"spec": map[string]interface{}{
				"stripPrefix": map[string]interface{}{
					"prefixes": []interface{}{pathPrefix},
				},
			},
		},
	}

	middlewareGVR := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "middlewares",
	}

	_, err := k.dynamicClient.Resource(middlewareGVR).Namespace(namespace).Create(ctx, stripMiddleware, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create middleware: %w", err)
	}

	// Create IngressRoute
	ingressRoute := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "traefik.io/v1alpha1",
			"kind":       "IngressRoute",
			"metadata": map[string]interface{}{
				"name":      fmt.Sprintf("%s-%s-ingress", req.Name, adminType),
				"namespace": namespace,
			},
			"spec": map[string]interface{}{
				"entryPoints": []interface{}{"web"},
				"routes": []interface{}{
					map[string]interface{}{
						"match": fmt.Sprintf(`Host("10.9.21.201") && PathPrefix("%s")`, pathPrefix),
						"kind":  "Rule",
						"middlewares": []interface{}{
							map[string]interface{}{
								"name": fmt.Sprintf("%s-%s-stripprefix", req.Name, adminType),
							},
						},
						"services": []interface{}{
							map[string]interface{}{
								"name": fmt.Sprintf("%s-%s", req.Name, adminType),
								"port": 80,
							},
						},
					},
				},
			},
		},
	}

	ingressGVR := schema.GroupVersionResource{
		Group:    "traefik.io",
		Version:  "v1alpha1",
		Resource: "ingressroutes",
	}

	_, err = k.dynamicClient.Resource(ingressGVR).Namespace(namespace).Create(ctx, ingressRoute, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create ingress route: %w", err)
	}

	return nil
}
