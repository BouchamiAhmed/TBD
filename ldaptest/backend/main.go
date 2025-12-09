package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"ldaptest/graph"
	ldapClient "ldaptest/ldap"
	"ldaptest/middleware"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/rs/cors"
)

const defaultPort = "8090"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	fmt.Println("🚀 Starting GraphQL LDAP Server...")

	// Initialize LDAP client
	ldap := ldapClient.NewClient()
	err := ldap.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to LDAP: %v", err)
	}
	defer ldap.Close()

	// Create resolver with LDAP client
	resolver := &graph.Resolver{
		LDAPClient: ldap,
	}

	// Create GraphQL server
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Setup routes
	http.Handle("/", playground.Handler("GraphQL Playground", "/query"))
	http.Handle("/query", c.Handler(middleware.AuthMiddleware()(srv)))

	fmt.Printf("✅ GraphQL Server running on http://localhost:%s\n", port)
	fmt.Printf("🎮 GraphQL Playground: http://localhost:%s\n", port)
	fmt.Printf("📊 GraphQL Endpoint: http://localhost:%s/query\n", port)
	fmt.Println("\n📋 Available Operations:")
	fmt.Println("   Mutation: login(username, password)")
	fmt.Println("   Mutation: register(username, password, email, firstName, lastName, userType)")
	fmt.Println("   Query: me (requires auth)")
	fmt.Println("   Query: user(username) (requires auth)")
	fmt.Println("   Query: health")

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
