Bismi allah
# Database SaaS Platform

A microservice-based Database-as-a-Service platform built with Go, Kubernetes, and gRPC.

## 🏗️ Architecture

- **Admin Microservice**: gRPC-based service for user and database management
- **Kubernetes Integration**: Automated deployment of MySQL/PostgreSQL instances
- **Web Frontend**: React-based admin interface
- **Database Client**: Go client for connecting to deployed databases

## 🚀 Features

- ✅ User authentication and management
- ✅ Automated database deployment (MySQL/PostgreSQL)
- ✅ Web-based database administration (phpMyAdmin/pgAdmin)
- ✅ Multi-tenant namespace isolation
- ✅ Kubernetes-native architecture
- ✅ gRPC API with Protocol Buffers

## 📦 Components

### Admin Service
Located in `admin-service/`
- gRPC server for database operations
- Kubernetes client for resource management
- PostgreSQL integration for user data

### Client
Located in `client/`
- Example client for connecting to deployed databases
- Demonstrates database connectivity

### Frontend
Located in `frontend/`
- Web interface for database management
- Admin dashboard for monitoring

## 🛠️ Deployment

### Prerequisites
- Kubernetes cluster (K3s recommended)
- kubectl configured
- Docker for building images