// TBDback/ldap_manager.go
// This handles LDAP operations from your main API

package main

import (
	"fmt"
	"time"

	"github.com/go-ldap/ldap/v3"
)

// LDAPConfig for direct LDAP operations
type LDAPConfig struct {
	Host          string
	Port          int
	BaseDN        string
	AdminDN       string
	AdminPassword string
}

// CreateLDAPUser creates user in LDAP (implementation already exists in auth_handlers.go)
// This function is redundant as it's already implemented in auth_handlers.go
// Keeping it here for reference but it should use the LDAPManager from auth_handlers.go

// CheckUserExists checks if user already exists in LDAP
func (lm *LDAPManager) CheckUserExists(username string) (bool, error) {
	if lm.conn == nil {
		return false, fmt.Errorf("LDAP connection not established")
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
			fmt.Sprintf("(uid=%s)", username),
			[]string{"dn"},
			nil,
		)

		searchResult, err := lm.conn.Search(searchRequest)
		if err != nil {
			continue
		}

		if len(searchResult.Entries) > 0 {
			return true, nil
		}
	}

	return false, nil
}

// GetUserDetails retrieves user details from LDAP
func (lm *LDAPManager) GetUserDetails(username string) (*LDAPUser, error) {
	if lm.conn == nil {
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
			fmt.Sprintf("(uid=%s)", username),
			[]string{"dn", "uid", "mail", "givenName", "sn", "cn"},
			nil,
		)

		searchResult, err := lm.conn.Search(searchRequest)
		if err != nil {
			continue
		}

		if len(searchResult.Entries) > 0 {
			entry := searchResult.Entries[0]

			// Determine user type based on DN
			userType := "external"
			if contains(entry.DN, "ou=internal") {
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

	return nil, fmt.Errorf("user not found: %s", username)
}

// LDAPUser represents a user from LDAP
type LDAPUser struct {
	DN        string
	UID       string
	Email     string
	FirstName string
	LastName  string
	UserType  string
}

// DeleteLDAPUser removes a user from LDAP
func (lm *LDAPManager) DeleteLDAPUser(username string) error {
	if lm.conn == nil {
		return fmt.Errorf("LDAP connection not established")
	}

	// First find the user
	user, err := lm.GetUserDetails(username)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Delete the user
	delRequest := ldap.NewDelRequest(user.DN, nil)
	err = lm.conn.Del(delRequest)
	if err != nil {
		return fmt.Errorf("failed to delete LDAP user: %w", err)
	}

	fmt.Printf("✅ Deleted LDAP user: %s\n", username)
	return nil
}

// UpdateLDAPUserPassword updates a user's password in LDAP
func (lm *LDAPManager) UpdateLDAPUserPassword(username, newPassword string) error {
	if lm.conn == nil {
		return fmt.Errorf("LDAP connection not established")
	}

	// First find the user
	user, err := lm.GetUserDetails(username)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Modify the password
	modifyRequest := ldap.NewModifyRequest(user.DN, nil)
	modifyRequest.Replace("userPassword", []string{newPassword})

	err = lm.conn.Modify(modifyRequest)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	fmt.Printf("✅ Updated password for LDAP user: %s\n", username)
	return nil
}

// ListLDAPUsers lists all users in LDAP
func (lm *LDAPManager) ListLDAPUsers(userType string) ([]*LDAPUser, error) {
	if lm.conn == nil {
		return nil, fmt.Errorf("LDAP connection not established")
	}

	var searchBases []string
	if userType == "internal" {
		searchBases = []string{"ou=users,ou=internal,dc=dbsaas,dc=local"}
	} else if userType == "external" {
		searchBases = []string{"ou=users,ou=external,dc=dbsaas,dc=local"}
	} else {
		searchBases = []string{
			"ou=users,ou=internal,dc=dbsaas,dc=local",
			"ou=users,ou=external,dc=dbsaas,dc=local",
		}
	}

	var users []*LDAPUser

	for _, baseDN := range searchBases {
		searchRequest := ldap.NewSearchRequest(
			baseDN,
			ldap.ScopeWholeSubtree,
			ldap.NeverDerefAliases,
			0, 0, false,
			"(objectClass=inetOrgPerson)",
			[]string{"dn", "uid", "mail", "givenName", "sn", "cn"},
			nil,
		)

		searchResult, err := lm.conn.Search(searchRequest)
		if err != nil {
			fmt.Printf("Warning: Failed to search %s: %v\n", baseDN, err)
			continue
		}

		for _, entry := range searchResult.Entries {
			// Determine user type based on DN
			uType := "external"
			if contains(entry.DN, "ou=internal") {
				uType = "internal"
			}

			users = append(users, &LDAPUser{
				DN:        entry.DN,
				UID:       entry.GetAttributeValue("uid"),
				Email:     entry.GetAttributeValue("mail"),
				FirstName: entry.GetAttributeValue("givenName"),
				LastName:  entry.GetAttributeValue("sn"),
				UserType:  uType,
			})
		}
	}

	return users, nil
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[0:len(substr)] == substr || len(s) > len(substr) && contains(s[1:], substr)
}

// ValidateLDAPCredentials validates user credentials against LDAP
func (lm *LDAPManager) ValidateLDAPCredentials(username, password string) (*LDAPUser, error) {
	if lm.conn == nil {
		return nil, fmt.Errorf("LDAP connection not established")
	}

	// First find the user
	user, err := lm.GetUserDetails(username)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Try to bind with the user's credentials
	err = lm.conn.Bind(user.DN, password)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials: %w", err)
	}

	// Re-bind as admin for future operations
	err = lm.conn.Bind(lm.AdminDN, lm.AdminPassword)
	if err != nil {
		return nil, fmt.Errorf("failed to re-bind as admin: %w", err)
	}

	return user, nil
}

// CreateLDAPGroup creates a new group in LDAP
func (lm *LDAPManager) CreateLDAPGroup(groupName, description string, userType string) error {
	if lm.conn == nil {
		return fmt.Errorf("LDAP connection not established")
	}

	// Determine the base DN for the group
	baseDN := "ou=groups,dc=dbsaas,dc=local"
	gidNumber := "3000" // Default group ID

	if userType == "internal" {
		gidNumber = "3001"
	} else if userType == "external" {
		gidNumber = "3002"
	}

	// Generate unique gidNumber based on timestamp
	gidNumber = fmt.Sprintf("%d", time.Now().Unix()%100000+3000)

	// Create DN for new group
	groupDN := fmt.Sprintf("cn=%s,%s", groupName, baseDN)

	// Prepare add request
	addRequest := ldap.NewAddRequest(groupDN, nil)

	// Add object classes
	addRequest.Attribute("objectClass", []string{"posixGroup", "top"})

	// Add attributes
	addRequest.Attribute("cn", []string{groupName})
	addRequest.Attribute("gidNumber", []string{gidNumber})
	if description != "" {
		addRequest.Attribute("description", []string{description})
	}

	// Create group
	err := lm.conn.Add(addRequest)
	if err != nil {
		return fmt.Errorf("failed to create LDAP group: %w", err)
	}

	fmt.Printf("✅ Created LDAP group: %s (GID: %s)\n", groupName, gidNumber)
	return nil
}

// AddUserToGroup adds a user to an LDAP group
func (lm *LDAPManager) AddUserToGroup(username, groupName string) error {
	if lm.conn == nil {
		return fmt.Errorf("LDAP connection not established")
	}

	// Find the user first
	user, err := lm.GetUserDetails(username)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Group DN
	groupDN := fmt.Sprintf("cn=%s,ou=groups,dc=dbsaas,dc=local", groupName)

	// Modify request to add member
	modifyRequest := ldap.NewModifyRequest(groupDN, nil)
	modifyRequest.Add("memberUid", []string{user.UID})

	err = lm.conn.Modify(modifyRequest)
	if err != nil {
		return fmt.Errorf("failed to add user to group: %w", err)
	}

	fmt.Printf("✅ Added user %s to group %s\n", username, groupName)
	return nil
}
