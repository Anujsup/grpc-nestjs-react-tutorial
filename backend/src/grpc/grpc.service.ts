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