# gRPC Learning Project

Welcome to this **gRPC learning project**! This is a complete full-stack application designed to teach you gRPC from scratch. If you're completely new to gRPC, this README will guide you through everything you need to know.

## 🤔 What is gRPC?

**gRPC** (Google Remote Procedure Call) is a high-performance, open-source framework for building distributed systems. Think of it as a way for different applications to talk to each other, similar to REST APIs, but with some key advantages:

### gRPC vs REST (What you might know)
| Feature | REST API | gRPC |
|---------|----------|------|
| **Data Format** | JSON (text) | Protocol Buffers (binary) |
| **Speed** | Slower | Faster (binary data) |
| **Type Safety** | No | Yes (strict schemas) |
| **Streaming** | Limited | Built-in support |
| **HTTP Version** | HTTP/1.1 | HTTP/2 |

### Key gRPC Concepts:
- **Protocol Buffers (.proto files)**: Define your API contract
- **Services**: Groups of related RPC methods
- **Messages**: Data structures sent between client and server
- **Streaming**: Real-time data flow support

## 🏗️ Project Architecture

This project demonstrates a **pure gRPC architecture** with no REST endpoints:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   React App     │────── │  gRPC-Web       │────── │  gRPC Server    │
│   (Frontend)    │       │  Server         │       │  (Backend)      │
│   Port: 5173    │       │  Port: 8080     │       │  Port: 50051    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                  │
                                  │
                          ┌─────────────────┐
                          │   MySQL DB      │
                          │   Port: 3306    │
                          └─────────────────┘
```

### Why Two gRPC Servers?

1. **Traditional gRPC Server (Port 50051)**: For server-to-server communication
2. **gRPC-Web Server (Port 8080)**: For browser clients (browsers can't directly connect to gRPC)

## 📁 Project Structure

```
grpc-learning-project/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── grpc/           # gRPC Implementation
│   │   │   ├── auth.proto  # API Contract Definition
│   │   │   ├── grpc.service.ts        # Traditional gRPC Server
│   │   │   └── grpc-web.service.ts    # gRPC-Web Server
│   │   ├── auth/           # Authentication Logic
│   │   │   ├── auth.service.ts        # Business Logic
│   │   │   └── auth.module.ts         # Auth Module
│   │   ├── entities/       # Database Models
│   │   │   └── user.entity.ts
│   │   ├── config/         # Database Configuration
│   │   └── main.ts         # Application Entry Point
│   ├── package.json
│   └── .env               # Environment Variables
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── services/      # gRPC Client
│   │   │   └── grpc-client.ts
│   │   ├── components/    # React Components
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   └── grpc/          # Protocol Buffer Files
│   │       └── auth.proto
│   ├── package.json
│   └── .env               # Environment Variables
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MySQL** (running on port 3306)
- **npm** or **yarn**

### 1. Database Setup
```bash
# Start MySQL and create database
mysql -u root -p
CREATE DATABASE simple_app;
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the backend (both gRPC servers)
npm run start:dev
```

You should see:
```
🚀 Starting gRPC application...
✅ gRPC application started successfully!
📡 gRPC server running on port 50051
🌐 gRPC-Web server running on port 8080
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

Visit: `http://localhost:5173`

## 🔧 How It Works

### 1. Protocol Buffer Definition (`auth.proto`)
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

message ChatMessage {
  string access_token = 1;
  string username = 2;
  string message = 3;
  string timestamp = 4;
  string room = 5;
}
```

This file defines:
- **Service**: `AuthService` with **5 methods** (2 unary + 3 streaming)
- **Messages**: Data structures for requests and responses
- **Streaming Types**: Server-side, client-side, and bidirectional streaming
- **Types**: Strongly typed fields with numbers (for binary encoding)

### 2. Backend gRPC Implementation

**Traditional gRPC Server** (`grpc.service.ts`):
```typescript
// Implements the AuthService from auth.proto
@Injectable()
export class GrpcService {
  // Unary RPC methods
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Business logic here
  }
  
  // Server-side streaming - Server sends multiple messages
  streamNotifications(call: any) {
    // Send notifications every second
    const interval = setInterval(() => {
      call.write(notification);
    }, 1000);
  }
  
  // Client-side streaming - Client sends multiple messages
  sendMessages(call: any, callback: any) {
    const messages = [];
    call.on('data', (message) => {
      messages.push(message);
    });
    call.on('end', () => {
      callback(null, { total_messages: messages.length });
    });
  }
  
  // Bidirectional streaming - Both send multiple messages
  chatStream(call: any) {
    call.on('data', (message) => {
      call.write(echoResponse);
    });
  }
}
```

**gRPC-Web Server** (`grpc-web.service.ts`):
```typescript
// Bridges browser requests to gRPC
@Injectable()
export class GrpcWebService {
  // Converts HTTP requests to gRPC calls
  // Handles CORS and browser compatibility
  // Uses Server-Sent Events for streaming
}
```

### 3. Frontend gRPC Client

**gRPC Client** (`grpc-client.ts`):
```typescript
export class GrpcAuthClient {
  // Unary RPC
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${baseUrl}/auth.AuthService/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+json',
        'X-Grpc-Web': '1',
      },
      body: JSON.stringify(request),
    });
    return response.json();
  }
  
  // Server-side streaming using async generators
  async* streamNotifications(request: StreamNotificationsRequest) {
    const response = await fetch(`${baseUrl}/auth.AuthService/StreamNotifications`, {
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' },
    });
    
    for await (const notification of streamReader) {
      yield notification;
    }
  }
  
  // Client-side streaming
  async sendMessages(messages: ClientMessage[]): Promise<ClientMessagesResponse> {
    return await fetch(`${baseUrl}/auth.AuthService/SendMessages`, {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }
  
  // Bidirectional streaming
  async chatStream(message: ChatMessage): Promise<ChatMessage> {
    return await fetch(`${baseUrl}/auth.AuthService/ChatStream`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}
```

## 🧪 Testing the Application

### 1. Default User
The application comes with a pre-created admin user:
- **Username**: `admin`
- **Password**: `admin`

### 2. Login Flow
1. Open `http://localhost:5173`
2. Enter credentials
3. Click "Login"
4. You'll be redirected to the Dashboard

### 3. Test gRPC Streaming Methods

#### **🔄 Server-side Streaming:**
1. **Login** to the dashboard
2. Find the **"Server-side Streaming"** section
3. Click **"Start Notifications Stream"**
4. Watch **5 notifications** appear automatically (one every second)

#### **📨 Client-side Streaming:**
1. Find the **"Client-side Streaming"** section
2. **Add multiple messages** in the text boxes
3. Click **"Send Messages"**
4. See the **summary** of processed messages

#### **💬 Bidirectional Streaming:**
1. Find the **"Bidirectional Streaming"** section
2. **Type a message** and click "Send"
3. See your message and the **server's echo response**
4. **Continue chatting** to see the conversation flow

### 4. Watch gRPC Calls
Check the backend console to see gRPC calls in real-time:
```
🔌 gRPC-Web Request: AuthService.Login { username: 'admin', password: 'admin' }
✅ gRPC-Web Response: AuthService.Login { access_token: 'jwt_token_here', user: {...} }
🔄 Server-side streaming started
📨 Client-side streaming: Processing 3 messages
💬 Bidirectional streaming: Echo response sent
```

## 📚 Learning Path

### Phase 1: Understanding the Basics
1. **Run the application** and see it work
2. **Examine the `.proto` file** - This is your API contract
3. **Look at the gRPC client** - How frontend makes gRPC calls
4. **Check the backend services** - How gRPC methods are implemented

### Phase 2: Making Changes
1. **Add a new field** to the User message in `auth.proto`
2. **Update the frontend** to display the new field
3. **Modify the backend** to return the new field
4. **Test your changes**

### Phase 3: Advanced Features
1. **Add streaming methods** for real-time updates
2. **Implement error handling** for gRPC calls
3. **Add authentication middleware** for gRPC methods
4. **Create new services** beyond authentication

## 🛠️ Development Commands

### Backend
```bash
npm run start:dev      # Start in development mode
npm run build          # Build for production
npm run start:prod     # Start in production mode
```

### Frontend
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
```

## 🔍 Key Files to Explore

1. **`backend/src/grpc/auth.proto`** - API contract definition
2. **`backend/src/grpc/grpc-web.service.ts`** - gRPC-Web server implementation
3. **`frontend/src/services/grpc-client.ts`** - gRPC client implementation
4. **`frontend/src/components/Login.tsx`** - How frontend uses gRPC
5. **`backend/src/auth/auth.service.ts`** - Business logic

## 🌟 What Makes This Different from REST?

### Type Safety
- **REST**: No guarantee that client and server agree on data structure
- **gRPC**: Compile-time checks ensure compatibility

### Performance
- **REST**: JSON parsing overhead
- **gRPC**: Binary protocol buffers are faster

### Streaming
- **REST**: Request-response only
- **gRPC**: Built-in support for streaming data

### Code Generation
- **REST**: Manual client code
- **gRPC**: Automatic client generation from .proto files

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to gRPC server"
**Solution**: Ensure MySQL is running and environment variables are correct

### Issue: "gRPC-Web server not responding"
**Solution**: Check if port 8080 is available and restart the backend

### Issue: "Frontend shows connection error"
**Solution**: Verify the backend is running and accessible on port 8080

## 📖 Next Steps

1. **Read the gRPC documentation**: https://grpc.io/docs/
2. **Learn Protocol Buffers**: https://developers.google.com/protocol-buffers
3. **Explore streaming**: Add server-streaming or bidirectional streaming
4. **Add more services**: Create new .proto files for different features
5. **Deploy to production**: Learn about gRPC deployment strategies

## 🎯 Project Goals

This project teaches you:
- ✅ How to define gRPC services with Protocol Buffers
- ✅ How to implement gRPC servers in NestJS
- ✅ How to create gRPC clients in React
- ✅ How to handle authentication with gRPC
- ✅ How to bridge gRPC to web browsers with gRPC-Web
- ✅ **How to implement all 4 types of gRPC methods:**
  - **Unary RPC**: Simple request-response (Login, GetProfile)
  - **Server-side streaming**: Server sends multiple messages (Notifications)
  - **Client-side streaming**: Client sends multiple messages (Bulk messages)
  - **Bidirectional streaming**: Both send multiple messages (Chat)
- ✅ How to build a complete full-stack application without REST
- ✅ How to handle real-time communication with gRPC streaming

## 🤝 Contributing

Feel free to:
- Add new gRPC methods
- Improve error handling
- Add streaming examples
- Enhance documentation
- Create more complex examples

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AnujSup">
        <img src="https://github.com/AnujSup.png" width="100px;" alt="Anuj Patil"/>
        <br />
        <sub><b>Anuj Patil</b></sub>
      </a>
      <br />
      <sub>Creator & Maintainer</sub>
    </td>
  </tr>
</table>



---

**Happy gRPC Learning!** 🎉

If you have questions, examine the code, run the application, and experiment with making changes. The best way to learn gRPC is by doing! 