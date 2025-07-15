# gRPC Frontend - React + TypeScript + Vite

This is the frontend application for the gRPC learning project, built with React, TypeScript, and Vite. It demonstrates how to implement a gRPC client in a web browser using gRPC-Web.

## 🏗️ Architecture

This frontend provides:
- **React Application** - Modern UI with TypeScript
- **gRPC-Web Client** - Direct gRPC calls to backend
- **JWT Authentication** - Token-based authentication
- **Responsive Design** - Mobile-friendly interface

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/              # React Components
│   │   ├── Login.tsx           # Login Page
│   │   ├── Dashboard.tsx       # Dashboard Page
│   │   └── ProtectedRoute.tsx  # Route Protection
│   ├── services/               # gRPC Services
│   │   └── grpc-client.ts      # gRPC Client Implementation
│   ├── utils/                  # Utilities
│   │   └── auth.ts            # Authentication Helpers
│   ├── grpc/                   # Protocol Buffers
│   │   └── auth.proto         # gRPC Service Definition
│   ├── assets/                 # Static Assets
│   ├── App.tsx                # Main App Component
│   ├── main.tsx               # Application Entry Point
│   └── index.css              # Global Styles
├── public/                     # Public Assets
│   └── grpc-favicon.svg       # gRPC-themed favicon
├── package.json
├── .env                       # Environment Variables
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
# Create .env file (if not exists)
cp .env.example .env
```

Environment variables:
```env
VITE_GRPC_WEB_URL=http://localhost:8080
```

3. **Start Development Server**
```bash
npm run dev
```

Visit: `http://localhost:5173`

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run preview          # Preview production build

# Production
npm run build           # Build for production
npm run build:analyze   # Build with bundle analyzer

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler check
```

## 🌐 gRPC-Web Implementation

### gRPC Client (`grpc-client.ts`)

The frontend uses a custom gRPC-Web client that communicates with the backend gRPC-Web server:

```typescript
export class GrpcAuthClient {
  private baseUrl = 'http://localhost:8080';

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth.AuthService/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+json',
        'X-Grpc-Web': '1',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProfile(token: string): Promise<GetProfileResponse> {
    const response = await fetch(`${this.baseUrl}/auth.AuthService/GetProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+json',
        'X-Grpc-Web': '1',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ access_token: token }),
    });

    if (!response.ok) {
      throw new Error(`Get profile failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
```

### Protocol Buffer Types

The application uses TypeScript interfaces that match the Protocol Buffer definitions:

```typescript
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}
```

## 🔐 Authentication Flow

### Login Process
1. User enters credentials in Login component
2. Frontend calls gRPC Login method
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. User is redirected to Dashboard

### Protected Routes
The `ProtectedRoute` component ensures only authenticated users can access certain pages:

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

## 🎨 User Interface

### Login Page (`Login.tsx`)
- **Clean, modern design** with gRPC branding
- **Form validation** with real-time feedback
- **Loading states** during authentication
- **Error handling** with user-friendly messages
- **Demo credentials** displayed for easy testing

### Dashboard Page (`Dashboard.tsx`)
- **User profile display** with gRPC-fetched data
- **Logout functionality** with token cleanup
- **Responsive layout** for mobile devices
- **System status** indicators

### Design Features
- **Modern CSS** with clean typography
- **Responsive design** that works on all devices
- **Loading spinners** for better user experience
- **Color-coded status** indicators
- **Smooth transitions** and hover effects

## 🔧 Development

### Adding New gRPC Methods

1. **Update Protocol Buffer** (`auth.proto`):
```protobuf
service AuthService {
  rpc NewMethod (NewMethodRequest) returns (NewMethodResponse);
}
```

2. **Add to gRPC Client**:
```typescript
async newMethod(request: NewMethodRequest): Promise<NewMethodResponse> {
  const response = await fetch(`${this.baseUrl}/auth.AuthService/NewMethod`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/grpc-web+json',
      'X-Grpc-Web': '1',
    },
    body: JSON.stringify(request),
  });
  
  return await response.json();
}
```

3. **Use in Components**:
```typescript
const handleNewMethod = async () => {
  try {
    const response = await grpcClient.newMethod(requestData);
    // Handle response
  } catch (error) {
    // Handle error
  }
};
```

### Error Handling

The application includes comprehensive error handling:
- **Network errors**: Connection issues, timeout
- **Authentication errors**: Invalid credentials, expired tokens
- **gRPC errors**: Method not found, invalid parameters
- **Validation errors**: Form validation feedback

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

Key responsive features:
- Flexible grid layouts
- Scalable typography
- Touch-friendly buttons
- Optimized form controls

## 🚨 Common Issues

### CORS Issues
```bash
# Error: CORS policy blocking requests
# Solution: Backend gRPC-Web server handles CORS automatically
```

### Environment Variables
```bash
# Error: Cannot connect to backend
# Solution: Check VITE_GRPC_WEB_URL in .env file
```

### TypeScript Errors
```bash
# Error: Type mismatch in gRPC responses
# Solution: Update interface definitions to match .proto file
```

## 🔧 Configuration

### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### Environment Variables
```env
# Backend gRPC-Web server URL
VITE_GRPC_WEB_URL=http://localhost:8080

# Development settings
VITE_DEV_MODE=true
```

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [gRPC-Web Documentation](https://github.com/grpc/grpc-web)

## 🤝 Contributing

When contributing to the frontend:
1. Follow React best practices
2. Use TypeScript for type safety
3. Add proper error handling
4. Test gRPC client functionality
5. Ensure responsive design
6. Update documentation

## 🎯 Demo Credentials

For testing the application:
- **Username**: `admin`
- **Password**: `admin`

These credentials are displayed on the login page and created by the backend seeding script.

---

**Frontend Ready!** 🚀

The frontend provides a modern, responsive interface for interacting with the gRPC backend services directly from the browser.
