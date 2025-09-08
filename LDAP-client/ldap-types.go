// Add this to your TBDback/auth_handlers.go at the top
// Or create a new file: TBDback/ldap_types.go

package main

import (
	"crypto/tls"
	"fmt"
	"os"
	"strings"

	"github.com/go-ldap/ldap/v3"
)

// LDAPConfig holds LDAP connection configuration
type LDAPConfig struct {
	Host               string
	Port               int
	BaseDN             string
	BindDN             string
	BindPassword       string
	UserSearchFilter   string
	TLSEnabled         bool
	InsecureSkipVerify bool
}

// LDAPClient represents an LDAP client connection
type LDAPClient struct {
	config *LDAPConfig
	conn   *ldap.Conn
}

// LDAPUser represents a user from LDAP
type LDAPUser struct {
	DN        string `json:"dn"`
	UID       string `json:"uid"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	UserType  string `json:"userType"` // "internal" or "external"
}

// NewLDAPClient creates a new LDAP client
func NewLDAPClient() *LDAPClient {
	// Detect if running in Kubernetes or locally
	ldapHost := os.Getenv("LDAP_HOST")
	if ldapHost == "" {
		// Default for local development (with port-forward)
		ldapHost = "localhost"
	}

	config := &LDAPConfig{
		Host:               ldapHost, // localhost for dev, k8s service for prod
		Port:               389,
		BaseDN:             "dc=dbsaas,dc=local",
		BindDN:             "cn=readonly,dc=dbsaas,dc=local", // Service account for searches
		BindPassword:       "readonly123",
		UserSearchFilter:   "(uid=%s)",
		TLSEnabled:         false, // Set to true for production
		InsecureSkipVerify: true,
	}

	return &LDAPClient{config: config}
}

// Connect establishes connection to LDAP server
func (l *LDAPClient) Connect() error {
	var err error

	if l.config.TLSEnabled {
		l.conn, err = ldap.DialTLS("tcp",
			fmt.Sprintf("%s:%d", l.config.Host, l.config.Port),
			&tls.Config{InsecureSkipVerify: l.config.InsecureSkipVerify})
	} else {
		l.conn, err = ldap.Dial("tcp",
			fmt.Sprintf("%s:%d", l.config.Host, l.config.Port))
	}

	if err != nil {
		return fmt.Errorf("failed to connect to LDAP: %w", err)
	}

	// Bind with service account for searches
	err = l.conn.Bind(l.config.BindDN, l.config.BindPassword)
	if err != nil {
		return fmt.Errorf("failed to bind to LDAP: %w", err)
	}

	fmt.Println("✅ Connected to LDAP server successfully")
	return nil
}

// Close closes the LDAP connection
func (l *LDAPClient) Close() {
	if l.conn != nil {
		l.conn.Close()
	}
}

// AuthenticateUser authenticates a user against LDAP
func (l *LDAPClient) AuthenticateUser(username, password string) (*LDAPUser, error) {
	if l.conn == nil {
		return nil, fmt.Errorf("LDAP connection not established")
	}

	// Search for user in both internal and external OUs
	searchBases := []string{
		"ou=users,ou=internal,dc=dbsaas,dc=local",
		"ou=users,ou=external,dc=dbsaas,dc=local",
	}

	var foundUser *LDAPUser
	var userDN string

	for _, baseDN := range searchBases {
		searchRequest := ldap.NewSearchRequest(
			baseDN,
			ldap.ScopeWholeSubtree,
			ldap.NeverDerefAliases,
			0, 0, false,
			fmt.Sprintf(l.config.UserSearchFilter, username),
			[]string{"dn", "uid", "mail", "givenName", "sn", "cn"},
			nil,
		)

		searchResult, err := l.conn.Search(searchRequest)
		if err != nil {
			continue // Try next search base
		}

		if len(searchResult.Entries) > 0 {
			entry := searchResult.Entries[0]
			userDN = entry.DN

			// Determine user type based on DN
			userType := "external"
			if strings.Contains(userDN, "ou=internal") {
				userType = "internal"
			}

			foundUser = &LDAPUser{
				DN:        userDN,
				UID:       entry.GetAttributeValue("uid"),
				Email:     entry.GetAttributeValue("mail"),
				FirstName: entry.GetAttributeValue("givenName"),
				LastName:  entry.GetAttributeValue("sn"),
				UserType:  userType,
			}
			break
		}
	}

	if foundUser == nil {
		return nil, fmt.Errorf("user not found in LDAP")
	}

	// Try to bind with user credentials to verify password
	err := l.conn.Bind(userDN, password)
	if err != nil {
		return nil, fmt.Errorf("invalid LDAP credentials")
	}

	// Re-bind with service account for future operations
	l.conn.Bind(l.config.BindDN, l.config.BindPassword)

	fmt.Printf("✅ LDAP authentication successful for user: %s (%s)\n", foundUser.UID, foundUser.UserType)
	return foundUser, nil
}

// GetUserByUID searches for a user by UID in LDAP
func (l *LDAPClient) GetUserByUID(uid string) (*LDAPUser, error) {
	if l.conn == nil {
		return nil, fmt.Errorf("LDAP connection not established")
	}

	searchBases := []string{
		"ou=users,ou=internal,dc=dbsaas,dc=local",
		"ou=users,ou=external,dc=dbsaas,dc=local",
	}

	for _, baseDN := range searchBases {
		searchRequest := ldap.NewSearchRequest(
			baseDN,
			ldap.ScopeWholeSubtree,
			ldap.NeverDerefAliases,
			0, 0, false,
			fmt.Sprintf("(uid=%s)", uid),
			[]string{"dn", "uid", "mail", "givenName", "sn", "cn"},
			nil,
		)

		searchResult, err := l.conn.Search(searchRequest)
		if err != nil {
			continue
		}

		if len(searchResult.Entries) > 0 {
			entry := searchResult.Entries[0]
			userType := "external"
			if strings.Contains(entry.DN, "ou=internal") {
				userType = "internal"
			}

			return &LDAPUser{
				DN:        entry.DN,
				UID:       entry.GetAttributeValue("uid"),
				Email:     entry.GetAttributeValue("mail"),
				FirstName: entry.GetAttributeValue("givenName"),
				LastName:  entry.GetAttributeValue("sn"),
				UserType:  userType,
			}, nil
		}
	}

	return nil, fmt.Errorf("user not found")
}
