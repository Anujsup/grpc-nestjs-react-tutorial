import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import * as express from 'express';
import * as cors from 'cors';

@Injectable()
export class GrpcWebService {
  private app: express.Application;

  constructor(private authService: AuthService) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Enable CORS for gRPC-web
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    }));

    // Parse JSON requests with proper error handling
    // Handle both application/json and application/grpc-web+json content types
    this.app.use(express.json({
      type: ['application/json', 'application/grpc-web+json']
    }));

    // Add request logging middleware
    this.app.use((req, res, next) => {
      console.log(`📥 Request: ${req.method} ${req.url}`);
      console.log('📦 Headers:', req.headers);
      console.log('📄 Body:', req.body);
      next();
    });

    // Add gRPC-web headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,X-Grpc-Web,Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  private setupRoutes() {
    // gRPC-web endpoint for AuthService.Login
    this.app.post('/auth.AuthService/Login', async (req, res) => {
      try {
        console.log('🔌 gRPC-Web Request: AuthService.Login', req.body);
        
        // Check if body exists and has the required fields
        if (!req.body) {
          console.error('❌ Request body is missing');
          return res.status(400).json({ 
            error: 'Request body is required' 
          });
        }

        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
          console.error('❌ Missing username or password:', { username, password });
          return res.status(400).json({ 
            error: 'Username and password are required' 
          });
        }

        // Call the AuthService (simulating gRPC call)
        const user = await this.authService.validateUser(username, password);
        
        if (!user) {
          console.error('❌ Invalid credentials for user:', username);
          return res.status(401).json({ 
            error: 'Invalid credentials' 
          });
        }

        const result = await this.authService.login(user);
        
        console.log('✅ gRPC-Web Response: AuthService.Login', result);
        
        res.json(result);
      } catch (error) {
        console.error('❌ gRPC-Web Error: AuthService.Login', error);
        res.status(500).json({ 
          error: 'Internal server error',
          details: error.message
        });
      }
    });

    // gRPC-web endpoint for AuthService.GetProfile
    this.app.post('/auth.AuthService/GetProfile', async (req, res) => {
      try {
        console.log('🔌 gRPC-Web Request: AuthService.GetProfile');
        console.log('📦 Headers:', req.headers);
        
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.error('❌ Missing or invalid Authorization header');
          return res.status(401).json({ 
            error: 'Authorization header with Bearer token is required' 
          });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        if (!token) {
          console.error('❌ Empty token in Authorization header');
          return res.status(401).json({ 
            error: 'Valid Bearer token is required' 
          });
        }

        // Use AuthService to validate JWT and get user data
        const user = await this.authService.getProfile(token);
        
        const result = { user };
        
        console.log('✅ gRPC-Web Response: AuthService.GetProfile', result);
        
        res.json(result);
      } catch (error) {
        console.error('❌ gRPC-Web Error: AuthService.GetProfile', error);
        
        // Handle JWT validation errors
        if (error.message === 'Invalid token' || error.message === 'User not found') {
          return res.status(401).json({ 
            error: 'Invalid or expired token' 
          });
        }
        
        res.status(500).json({ 
          error: 'Internal server error',
          details: error.message
        });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok',
        service: 'gRPC-Web Server',
        timestamp: new Date().toISOString()
      });
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('❌ Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        details: err.message
      });
    });
  }

  startServer(port: number = 8080) {
    this.app.listen(port, () => {
      console.log(`🌐 gRPC-Web server started on port ${port}`);
      console.log(`📡 Available endpoints:`);
      console.log(`   POST http://localhost:${port}/auth.AuthService/Login`);
      console.log(`   POST http://localhost:${port}/auth.AuthService/GetProfile`);
      console.log(`   GET  http://localhost:${port}/health`);
    });
  }
} 