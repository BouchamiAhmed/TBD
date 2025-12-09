package middleware

import (
	"ldaptest/auth"
	"net/http"
	"strings"
)

// AuthMiddleware adds authentication to the context
func AuthMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get token from Authorization header
			authHeader := r.Header.Get("Authorization")

			if authHeader != "" {
				// Expected format: "Bearer <token>"
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token := parts[1]

					// Validate token
					claims, err := auth.ValidateToken(token)
					if err == nil {
						// Add user to context
						userInfo := &auth.UserInfo{
							Username:  claims.Username,
							UserType:  claims.UserType,
							Email:     claims.Email,
							FirstName: claims.FirstName,
							LastName:  claims.LastName,
						}
						ctx := auth.WithUser(r.Context(), userInfo)
						r = r.WithContext(ctx)
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
