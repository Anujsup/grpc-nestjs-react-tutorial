import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class GrpcService {
  private server: grpc.Server;

  constructor(private authService: AuthService) {
    this.server = new grpc.Server();
    this.setupGrpcServer();
  }

  private setupGrpcServer() {
    // Find the proto file - works in both development and production
    const possiblePaths = [
      join(__dirname, './auth.proto'),                    // If copied to dist
      join(__dirname, '../../src/grpc/auth.proto'),       // From dist/grpc to src/grpc
      join(process.cwd(), 'src/grpc/auth.proto'),         // From project root
    ];
    
    let protoPath = '';
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        protoPath = path;
        break;
      }
    }
    
    if (!protoPath) {
      throw new Error('Could not find auth.proto file');
    }
    
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const authProto = grpc.loadPackageDefinition(packageDefinition) as any;

    this.server.addService(authProto.auth.AuthService.service, {
      login: this.login.bind(this),
      getProfile: this.getProfile.bind(this),
      streamNotifications: this.streamNotifications.bind(this),
      sendMessages: this.sendMessages.bind(this),
      chatStream: this.chatStream.bind(this),
    });
  }

  public async login(call: any, callback: any) {
    try {
      const { username, password } = call.request;
      console.log('Login request received:', { username, password });   
      const user = await this.authService.validateUser(username, password);
      
      if (!user) {
        callback({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
        return;
      }

      const result = await this.authService.login(user);
      callback(null, result);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  }

  public async getProfile(call: any, callback: any) {
    try {
      // This would need JWT token validation
      callback(null, { user: { id: 1, username: 'test', email: 'test@test.com' } });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  }

  // Server-side streaming - Server sends multiple messages to client
  public streamNotifications(call: any) {
    const { access_token, duration_seconds } = call.request;
    console.log('🔄 Server-side streaming started:', { access_token, duration_seconds });
    
    const notifications = [
      { id: '1', title: 'Welcome!', message: 'Welcome to gRPC streaming', type: 'success' },
      { id: '2', title: 'System Update', message: 'System is running smoothly', type: 'info' },
      { id: '3', title: 'New Feature', message: 'gRPC streaming is now available', type: 'info' },
      { id: '4', title: 'Performance', message: 'All services are optimal', type: 'success' },
      { id: '5', title: 'Tutorial', message: 'Learn more about Protocol Buffers', type: 'info' },
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < notifications.length && index < duration_seconds) {
        const notification = {
          ...notifications[index],
          timestamp: new Date().toISOString(),
        };
        
        console.log('📤 Sending notification:', notification);
        call.write(notification);
        index++;
      } else {
        clearInterval(interval);
        call.end();
        console.log('✅ Server-side streaming completed');
      }
    }, 1000);
    
    // Handle client disconnect
    call.on('cancelled', () => {
      clearInterval(interval);
      console.log('❌ Client disconnected from server stream');
    });
  }

  // Client-side streaming - Client sends multiple messages to server
  public sendMessages(call: any, callback: any) {
    console.log('📨 Client-side streaming started');
    const receivedMessages: string[] = [];
    
    call.on('data', (message: any) => {
      console.log('📥 Received message from client:', message);
      receivedMessages.push(message.message);
    });
    
    call.on('end', () => {
      console.log('✅ Client-side streaming completed');
      const response = {
        total_messages: receivedMessages.length,
        status: 'success',
        processed_messages: receivedMessages,
      };
      callback(null, response);
    });
    
    call.on('error', (error: any) => {
      console.error('❌ Error in client-side streaming:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error processing messages',
      });
    });
  }

  // Bidirectional streaming - Both client and server send multiple messages
  public chatStream(call: any) {
    console.log('💬 Bidirectional streaming (chat) started');
    
    call.on('data', (message: any) => {
      console.log('📥 Received chat message:', message);
      
      // Echo the message back to the client
      const response = {
        access_token: message.access_token,
        username: `Server (echoing ${message.username})`,
        message: `Echo: ${message.message}`,
        timestamp: new Date().toISOString(),
        room: message.room,
      };
      
      console.log('📤 Sending chat response:', response);
      call.write(response);
    });
    
    call.on('end', () => {
      console.log('✅ Bidirectional streaming completed');
      call.end();
    });
    
    call.on('error', (error: any) => {
      console.error('❌ Error in bidirectional streaming:', error);
      call.end();
    });
  }

  startServer() {
    const port = process.env.GRPC_PORT || '50051';
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error('Failed to start gRPC server:', error);
          return;
        }
        console.log(`gRPC server started on port ${port}`);
        this.server.start();
      },
    );
  }
} 