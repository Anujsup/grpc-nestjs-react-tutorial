import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GrpcService } from './grpc/grpc.service';
import { GrpcWebService } from './grpc/grpc-web.service';

async function bootstrap() {
  console.log('🚀 Starting gRPC application...');
  
  const app = await NestFactory.create(AppModule);
  
  // Start GRPC server (traditional gRPC)
  const grpcService = app.get(GrpcService);
  grpcService.startServer();
  
  // Start gRPC-Web server (for browser clients)
  const grpcWebService = app.get(GrpcWebService);
  grpcWebService.startServer(8080);
  
  console.log('✅ gRPC application started successfully!');
  console.log('📡 gRPC server running on port 50051');
  console.log('🌐 gRPC-Web server running on port 8080');
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gRPC servers...');
    process.exit(0);
  });
}
bootstrap();
