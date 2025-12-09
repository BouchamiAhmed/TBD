package ldap

import (
	"crypto/tls"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-ldap/ldap/v3"
)

// Config holds LDAP connection configuration
type Config struct {
	Host               string
	Port               int
	BaseDN             string
	BindDN             string
	BindPassword       string
	UserSearchFilter   string
	TLSEnabled         bool
	InsecureSkipVerify bool
}

// Client represents an LDAP client connection
type Client struct {
	config *Config
	conn   *ldap.Conn
}

// User represents a user from LDAP
type User struct {
	DN        string
	UID       string
	Email     string
	FirstName string
	LastName  string
	UserType  string // "internal" or "external"
}

// NewClient creates a new LDAP client
func NewClient() *Client {
	ldapHost := os.Getenv("LDAP_HOST")
	if ldapHost == "" {
		ldapHost = "localhost"
	}

	config := &Config{
		Host:               ldapHost,
		Port:               389,
		BaseDN:             "dc=dbsaas,dc=local",
		BindDN:             "cn=admin,dc=dbsaas,dc=local",
		BindPassword:       "admin123",
		UserSearchFilter:   "(uid=%s)",
		TLSEnabled:         false,
		InsecureSkipVerify: true,
	}

	return &Client{config: config}
}

// Connect establishes connection to LDAP server
func (c *Client) Connect() error {
	var err error

	if c.config.TLSEnabled {
		c.conn, err = ldap.DialTLS("tcp",
			fmt.Sprintf("%s:%d", c.config.Host, c.config.Port),
			&tls.Config{InsecureSkipVerify: c.config.InsecureSkipVerify})
	} else {
		c.conn, err = ldap.Dial("tcp",
			fmt.Sprintf("%s:%d", c.config.Host, c.config.Port))
	}

	if err != nil {
		return fmt.Errorf("failed to connect to LDAP: %w", err)
	}

	// Bind with admin account
	err = c.conn.Bind(c.config.BindDN, c.config.BindPassword)
	if err != nil {
		return fmt.Errorf("failed to bind to LDAP: %w", err)
	}

	fmt.Println("✅ Connected to LDAP server successfully")
	return nil
}

// Close closes the LDAP connection
func (c *Client) Close() {
	if c.conn != nil {
		c.conn.Close()
	}
}

// AuthenticateUser authenticates a user against LDAP
func (c *Client) AuthenticateUser(username, password string) (*User, error) {
	if c.conn == nil {
		return nil, fmt.Errorf("LDAP connection not established")
	}

	// Search for user in both internal and external OUs
	searchBases := []string{
		"ou=users,ou=internal,dc=dbsaas,dc=local",
		"ou=users,ou=external,dc=dbsaas,dc=local",
	}

	var foundUser *User
	var userDN string

	for _, baseDN := range searchBases {
		searchRequest := ldap.NewSearchRequest(
			baseDN,
			ldap.ScopeWholeSubtree,
			ldap.NeverDerefAliases,
			0, 0, false,
			fmt.Sprintf(c.config.UserSearchFilter, username),
			[]string{"dn", "uid", "mail", "givenName", "sn", "cn"},
			nil,
		)

		searchResult, err := c.conn.Search(searchRequest)
		if err != nil {
			continue
		}

		if len(searchResult.Entries) > 0 {
			entry := searchResult.Entries[0]
			userDN = entry.DN

			userType := "external"
			if strings.Contains(userDN, "ou=internal") {
				userType = "internal"
			}

			foundUser = &User{
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

	// Try to bind with user credentials
	err := c.conn.Bind(userDN, password)
	if err != nil {
		return nil, fmt.Errorf("invalid LDAP credentials")
	}

	// Re-bind with admin account
	c.conn.Bind(c.config.BindDN, c.config.BindPassword)

	fmt.Printf("✅ LDAP authentication successful for user: %s (%s)\n", foundUser.UID, foundUser.UserType)
	return foundUser, nil
}

// GetUserByUID searches for a user by UID in LDAP
func (c *Client) GetUserByUID(uid string) (*User, error) {
	if c.conn == nil {
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

		searchResult, err := c.conn.Search(searchRequest)
		if err != nil {
			continue
		}

		if len(searchResult.Entries) > 0 {
			entry := searchResult.Entries[0]
			userType := "external"
			if strings.Contains(entry.DN, "ou=internal") {
				userType = "internal"
			}

			return &User{
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

// CreateUser creates a new user in LDAP
func (c *Client) CreateUser(username, password, email, firstName, lastName, userType string) (*User, error) {
	if c.conn == nil {
		return nil, fmt.Errorf("LDAP connection not established")
	}

	// Determine organizational unit
	baseDN := "ou=users,ou=external,dc=dbsaas,dc=local"
	gidNumber := "2001"
	if userType == "internal" {
		baseDN = "ou=users,ou=internal,dc=dbsaas,dc=local"
		gidNumber = "1001"
	}

	// Generate unique uidNumber
	uidNumber := fmt.Sprintf("%d", time.Now().Unix()%100000+1000)

	// Create DN
	userDN := fmt.Sprintf("uid=%s,%s", username, baseDN)

	// Prepare add request
	addRequest := ldap.NewAddRequest(userDN, nil)
	addRequest.Attribute("objectClass", []string{"inetOrgPerson", "posixAccount", "top"})
	addRequest.Attribute("uid", []string{username})
	addRequest.Attribute("cn", []string{fmt.Sprintf("%s %s", firstName, lastName)})
	addRequest.Attribute("sn", []string{lastName})
	addRequest.Attribute("givenName", []string{firstName})
	addRequest.Attribute("mail", []string{email})
	addRequest.Attribute("userPassword", []string{password})
	addRequest.Attribute("uidNumber", []string{uidNumber})
	addRequest.Attribute("gidNumber", []string{gidNumber})
	addRequest.Attribute("homeDirectory", []string{fmt.Sprintf("/home/users/%s", username)})

	// Create user
	err := c.conn.Add(addRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to create LDAP user: %w", err)
	}

	fmt.Printf("✅ Created LDAP user: %s (%s)\n", username, userType)

	return &User{
		DN:        userDN,
		UID:       username,
		Email:     email,
		FirstName: firstName,
		LastName:  lastName,
		UserType:  userType,
	}, nil
}
