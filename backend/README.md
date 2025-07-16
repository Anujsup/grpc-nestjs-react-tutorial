# gRPC Backend - NestJS Implementation

This is the backend service for the gRPC learning project, built with NestJS and implementing both traditional gRPC and gRPC-Web servers.

## 🏗️ Architecture

This backend provides:
- **Traditional gRPC Server** (Port 50051) - For server-to-server communication
- **gRPC-Web Server** (Port 8080) - For browser clients
- **MySQL Database** - User data storage with TypeORM
- **JWT Authentication** - Token-based authentication

## 📁 Project Structure

```
backend/
├── src/
│   ├── grpc/                    # gRPC Implementation
│   │   ├── auth.proto          # Protocol Buffer Definition
│   │   ├── grpc.service.ts     # Traditional gRPC Server
│   │   └── grpc-web.service.ts # gRPC-Web Server
│   ├── auth/                   # Authentication Module
│   │   ├── auth.service.ts     # Business Logic
│   │   ├── auth.module.ts      # Module Definition
│   │   ├── jwt-auth.guard.ts   # JWT Guard
│   │   ├── jwt.strategy.ts     # JWT Strategy
│   │   ├── local-auth.guard.ts # Local Auth Guard
│   │   └── local.strategy.ts   # Local Strategy
│   ├── entities/               # Database Models
│   │   └── user.entity.ts      # User Entity
│   ├── config/                 # Configuration
│   │   └── database.config.ts  # Database Config
│   ├── scripts/                # Utility Scripts
│   │   └── seed.ts            # Database Seeding
│   └── main.ts                # Application Entry Point
├── package.json
├── .env                       # Environment Variables
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (running on port 3306)
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
# Create .env file with your database credentials
cp .env.example .env
```

Required environment variables:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=simple_app
JWT_SECRET=your_jwt_secret
```

3. **Database Setup**
```bash
# Create database in MySQL
mysql -u root -p
CREATE DATABASE simple_app;
```

4. **Start the Application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

You should see:
```
🚀 Starting gRPC application...
✅ gRPC application started successfully!
📡 gRPC server running on port 50051
🌐 gRPC-Web server running on port 8080
```

## 🔧 Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debug mode

# Production
npm run build             # Build the application
npm run start:prod        # Start production server

# Database
npm run seed:admin        # Create admin user
npm run seed:users        # Create test users

# Testing
npm run test              # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Run test coverage
```

## 🗄️ Database Management

### Seeding Users
```bash
# Create admin user (username: admin, password: admin)
npm run seed:admin

# Create multiple test users
npm run seed:users
```

### Database Schema
The application uses TypeORM with automatic synchronization. The database schema is automatically created based on the entities.

**User Entity** (`user.entity.ts`):
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

## 🔐 Authentication

### JWT Implementation
- **Login**: Returns JWT token on successful authentication
- **Protected Routes**: Use JWT for authorization
- **Token Validation**: Automatic token validation on gRPC calls

### Default Users
After running `npm run seed:admin`:
- **Username**: `admin`
- **Password**: `admin`

## 📡 gRPC Services

### Protocol Buffer Definition (`auth.proto`)
```protobuf
syntax = "proto3";

package auth;

service AuthService {
  // Unary RPC (request-response)
  rpc Login (LoginRequest) returns (LoginResponse);
  rpc GetProfile (GetProfileRequest) returns (GetProfileResponse);
  
  // Server-side streaming (server sends multiple messages)
  rpc StreamNotifications (StreamNotificationsRequest) returns (stream NotificationMessage);
  
  // Client-side streaming (client sends multiple messages)
  rpc SendMessages (stream ClientMessage) returns (ClientMessagesResponse);
  
  // Bidirectional streaming (both send multiple messages)
  rpc ChatStream (stream ChatMessage) returns (stream ChatMessage);
}

message LoginRequest {
  string username = 1;
  string password = 2;
}

message LoginResponse {
  string access_token = 1;
  User user = 2;
}

message User {
  int32 id = 1;
  string username = 2;
  string email = 3;
  string created_at = 4;
  string updated_at = 5;
}

message StreamNotificationsRequest {
  string access_token = 1;
  int32 duration_seconds = 2;
}

message NotificationMessage {
  string id = 1;
  string title = 2;
  string message = 3;
  string timestamp = 4;
  string type = 5; // "info", "warning", "success", "error"
}

message ClientMessage {
  string access_token = 1;
  string message = 2;
  string timestamp = 3;
}

message ClientMessagesResponse {
  total_messages = 1;
  string status = 2;
  repeated string processed_messages = 3;
}

message ChatMessage {
  string access_token = 1;
  string username = 2;
  string message = 3;
  string timestamp = 4;
  string room = 5;
}
```

### gRPC Server Implementation

**Traditional gRPC Server** (`grpc.service.ts`):
- Implements the AuthService interface with **5 methods**
- **Unary RPC**: Login, GetProfile (request-response)
- **Server-side streaming**: StreamNotifications (server sends multiple messages)
- **Client-side streaming**: SendMessages (client sends multiple messages)
- **Bidirectional streaming**: ChatStream (both send multiple messages)
- Runs on port 50051

**gRPC-Web Server** (`grpc-web.service.ts`):
- Bridges HTTP requests to gRPC calls
- Handles CORS for browser clients
- **Streaming Support**: Uses Server-Sent Events for real-time streaming
- Runs on port 8080

## 🛠️ Development

### Adding New gRPC Methods

1. **Update Protocol Buffer** (`auth.proto`):
```protobuf
service AuthService {
  rpc NewMethod (NewMethodRequest) returns (NewMethodResponse);
}
```

2. **Implement in gRPC Service**:
```typescript
async newMethod(data: NewMethodRequest): Promise<NewMethodResponse> {
  // Implementation here
}
```

3. **Add to gRPC-Web Service**:
```typescript
// Add HTTP endpoint mapping
```

### Error Handling
The application includes comprehensive error handling:
- **Database errors**: Connection and query errors
- **Authentication errors**: Invalid credentials, expired tokens
- **gRPC errors**: Method not found, invalid parameters

## 🔍 Monitoring & Debugging

### Logs
The application provides detailed logging:
- **gRPC calls**: Request/response logging for all methods
- **Streaming operations**: Real-time streaming logs
- **Database operations**: Query logging
- **Authentication**: Login attempts and token validation

**Streaming Logs:**
```bash
🔄 Server-side streaming started
📤 Sending notification: {title: "Welcome!", message: "Welcome to gRPC streaming"}
📨 Client-side streaming started
📥 Received message from client: {message: "Hello"}
💬 Bidirectional streaming (chat) started
📤 Sending chat response: {username: "Server", message: "Echo: Hello"}
```

### Health Checks
Basic health check endpoint to verify service status.

## 🚨 Common Issues

### Database Connection
```bash
# Error: Cannot connect to database
# Solution: Check MySQL is running and credentials are correct
```

### Port Conflicts
```bash
# Error: Port 50051 already in use
# Solution: Kill existing processes or change port
```

### TypeORM Synchronization
```bash
# Error: Database schema issues
# Solution: Set synchronize: true in development
```

## 🔧 Configuration

### Database Configuration (`database.config.ts`)
```typescript
export const databaseConfig = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'simple_app',
  synchronize: true, // Auto-create schema
  logging: true,     // Enable SQL logging
};
```

## 📚 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [TypeORM Documentation](https://typeorm.io/)

## 🤝 Contributing

When contributing to the backend:
1. Follow the existing code structure
2. Add proper error handling
3. Update protocol buffers if needed
4. Test both gRPC and gRPC-Web endpoints
5. Update documentation

---

**Backend Service Ready!** 🚀

The backend provides a robust gRPC implementation with JWT authentication, database persistence, and browser compatibility through gRPC-Web.
