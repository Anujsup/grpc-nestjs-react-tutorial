// Define the gRPC service interface
export interface AuthServiceClient {
  login(request: LoginRequest): Promise<LoginResponse>;
  getProfile(token: string): Promise<GetProfileResponse>;
}

// Define message types (equivalent to proto messages)
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface GetProfileRequest {
  // Empty - token will be in Authorization header
}

export interface GetProfileResponse {
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

// Error response types
export interface GrpcError {
  error: string;
  details?: string;
}

// Custom error class for gRPC client errors
export class GrpcClientError extends Error {
  public status: number;
  public details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = 'GrpcClientError';
    this.status = status;
    this.details = details;
  }
}

// Type guards for runtime validation
function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.username === 'string' &&
    typeof obj.email === 'string'
  );
}

function isLoginResponse(obj: any): obj is LoginResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.access_token === 'string'
  );
}

function isGetProfileResponse(obj: any): obj is GetProfileResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    isUser(obj.user)
  );
}

function isGrpcError(obj: any): obj is GrpcError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.error === 'string'
  );
}

// gRPC-web client implementation
export class GrpcAuthClient implements AuthServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_GRPC_WEB_URL || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    console.log('🔌 gRPC Call: AuthService.Login', request);
    
    try {
      // Validate request
      if (!request.username || !request.password) {
        throw new GrpcClientError('Username and password are required', 400);
      }

      // Simulate gRPC call structure
      const response = await fetch(`${this.baseUrl}/auth.AuthService/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+json',
          'X-Grpc-Web': '1',
        },
        body: JSON.stringify(request),
      });

      const data: unknown = await response.json();
      console.log('✅ gRPC Response: AuthService.Login', data);

      if (!response.ok) {
        if (isGrpcError(data)) {
          throw new GrpcClientError(data.error, response.status, data.details);
        } else {
          throw new GrpcClientError(`gRPC Error: ${response.status} - ${response.statusText}`, response.status);
        }
      }
      
      // Validate response type at runtime
      if (!isLoginResponse(data)) {
        throw new GrpcClientError('Invalid response format from server', 500);
      }

      return data; // Now properly typed as LoginResponse
    } catch (error) {
      console.error('❌ gRPC Error: AuthService.Login', error);
      
      if (error instanceof GrpcClientError) {
        throw error;
      }
      
      throw new GrpcClientError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500
      );
    }
  }

  async getProfile(token: string): Promise<GetProfileResponse> {
    console.log('🔌 gRPC Call: AuthService.GetProfile');
    
    try {
      // Validate token
      if (!token) {
        throw new GrpcClientError('Token is required', 400);
      }

      const response = await fetch(`${this.baseUrl}/auth.AuthService/GetProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+json',
          'X-Grpc-Web': '1',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}), // Empty body since token is in header
      });

      const data: unknown = await response.json();
      console.log('✅ gRPC Response: AuthService.GetProfile', data);

      if (!response.ok) {
        if (isGrpcError(data)) {
          throw new GrpcClientError(data.error, response.status, data.details);
        } else {
          throw new GrpcClientError(`gRPC Error: ${response.status} - ${response.statusText}`, response.status);
        }
      }
      
      // Validate response type at runtime
      if (!isGetProfileResponse(data)) {
        throw new GrpcClientError('Invalid response format from server', 500);
      }

      return data; // Now properly typed as GetProfileResponse
    } catch (error) {
      console.error('❌ gRPC Error: AuthService.GetProfile', error);
      
      if (error instanceof GrpcClientError) {
        throw error;
      }
      
      throw new GrpcClientError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500
      );
    }
  }
}

// Export a singleton instance
export const grpcAuthClient = new GrpcAuthClient();
export default grpcAuthClient; 