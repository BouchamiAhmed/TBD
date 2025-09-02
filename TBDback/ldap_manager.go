// Create TBDback/ldap_manager.go
// This handles LDAP operations from your main API

package main

import (
	"fmt"
	"time"

	"github.com/go-ldap/ldap/v3"
)

// LDAPManager handles LDAP operations for user management

// LDAPConfig for direct LDAP operations
type LDAPConfig struct {
	Host          string
	Port          int
	BaseDN        string
	AdminDN       string
	AdminPassword string
}

// NewLDAPManager creates a new LDAP manager for user operations

// Connect to LDAP with admin privileges

// Close LDAP connection


	// Generate unique uidNumber
	uidNumber := fmt.Sprintf("%d", time.Now().Unix()%100000+1000)

	// Create DN for new user
	userDN := fmt.Sprintf("uid=%s,%s", req.Username, baseDN)

	// Set defaults
	firstName := req.FirstName
	lastName := req.LastName
	if firstName == "" {
		firstName = req.Username
	}
	if lastName == "" {
		lastName = "User"
	}

	// Prepare LDAP add request
	addRequest := ldap.NewAddRequest(userDN, nil)

	// Add object classes
	addRequest.Attribute("objectClass", []string{"inetOrgPerson", "posixAccount", "top"})

	// Add user attributes
	addRequest.Attribute("uid", []string{req.Username})
	addRequest.Attribute("cn", []string{fmt.Sprintf("%s %s", firstName, lastName)})
	addRequest.Attribute("sn", []string{lastName})
	addRequest.Attribute("givenName", []string{firstName})
	addRequest.Attribute("mail", []string{req.Email})
	addRequest.Attribute("userPassword", []string{req.Password}) // LDAP will hash it
	addRequest.Attribute("uidNumber", []string{uidNumber})
	addRequest.Attribute("gidNumber", []string{gidNumber})
	addRequest.Attribute("homeDirectory", []string{fmt.Sprintf("/home/users/%s", req.Username)})

	// Execute the add operation
	err := lm.conn.Add(addRequest)
	if err != nil {
		return fmt.Errorf("failed to create LDAP user: %w", err)
	}

	fmt.Printf("✅ LDAP user created: %s in %s\n", req.Username, baseDN)
	return nil
}

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
