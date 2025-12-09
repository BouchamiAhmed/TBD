package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key-change-in-production")

type contextKey string

const userContextKey contextKey = "user"

// Claims represents JWT claims
type Claims struct {
	Username  string `json:"username"`
	UserType  string `json:"userType"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	jwt.RegisteredClaims
}

// UserInfo represents authenticated user info
type UserInfo struct {
	Username  string
	UserType  string
	Email     string
	FirstName string
	LastName  string
}

// GenerateToken generates a JWT token for a user
func GenerateToken(username, email, firstName, lastName, userType string) (string, error) {
	claims := &Claims{
		Username:  username,
		UserType:  userType,
		Email:     email,
		FirstName: firstName,
		LastName:  lastName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken validates a JWT token and returns claims
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ForContext finds the user from the context
func ForContext(ctx context.Context) *UserInfo {
	raw, _ := ctx.Value(userContextKey).(*UserInfo)
	return raw
}

// WithUser adds user to context
func WithUser(ctx context.Context, user *UserInfo) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}
