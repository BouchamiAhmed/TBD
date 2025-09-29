// File: TBDback/config.go
package main

import (
	"fmt"
	"os"
)

type Config struct {
	AdminHost      string
	DBHost         string
	LDAPHost       string
	LDAPServiceURL string // For LDAP microservice
}

var config *Config

func init() {
	config = &Config{
		AdminHost:      getEnv("ADMIN_HOST", "10.9.21.201"),                   // Will be overridden by ConfigMap
		DBHost:         getEnv("DB_HOST", "10.9.21.201"),                      // Will be overridden by ConfigMap
		LDAPHost:       getEnv("LDAP_HOST", "10.9.21.200"),                    // Will be overridden by ConfigMap
		LDAPServiceURL: getEnv("LDAP_SERVICE_URL", "http://10.9.21.201:8098"), // Will be overridden by ConfigMap
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetAdminURL generates admin panel URLs
func GetAdminURL(namespace, dbName, dbType string) string {
	if dbType == "mysql" {
		return fmt.Sprintf("http://%s/%s/%s-phpmyadmin", config.AdminHost, namespace, dbName)
	} else {
		return fmt.Sprintf("http://%s/%s/%s-pgadmin", config.AdminHost, namespace, dbName)
	}
}

// GetLDAPManager creates LDAP manager with config
func GetLDAPManager() *LDAPManager {
	return &LDAPManager{
		Host:          config.LDAPHost,
		Port:          389,
		AdminDN:       "cn=admin,dc=dbsaas,dc=local",
		AdminPassword: "admin123",
		BaseDN:        "dc=dbsaas,dc=local",
	}
}

// GetLDAPAuthService creates LDAP service client with config
func GetLDAPAuthService() *LDAPAuthService {
	return &LDAPAuthService{
		BaseURL: config.LDAPServiceURL,
	}
}
