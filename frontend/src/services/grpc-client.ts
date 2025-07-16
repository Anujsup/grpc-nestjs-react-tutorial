// Define the gRPC service interface
export interface AuthServiceClient {
  login(request: LoginRequest): Promise<LoginResponse>;
  getProfile(token: string): Promise<GetProfileResponse>;
  streamNotifications(request: StreamNotificationsRequest): AsyncGenerator<NotificationMessage, void, unknown>;
  sendMessages(messages: ClientMessage[]): Promise<ClientMessagesResponse>;
  chatStream(message: ChatMessage): Promise<ChatMessage>;
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

// New streaming message types
export interface StreamNotificationsRequest {
  access_token: string;
  duration_seconds: number;
}

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface ClientMessage {
  access_token: string;
  message: string;
  timestamp: string;
}

export interface ClientMessagesResponse {
  total_messages: number;
  status: string;
  processed_messages: string[];
}

export interface ChatMessage {
  access_token: string;
  username: string;
  message: string;
  timestamp: string;
  room: string;
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

function isNotificationMessage(obj: any): obj is NotificationMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.type === 'string'
  );
}

function isClientMessagesResponse(obj: any): obj is ClientMessagesResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.total_messages === 'number' &&
    typeof obj.status === 'string' &&
    Array.isArray(obj.processed_messages)
  );
}

function isChatMessage(obj: any): obj is ChatMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.access_token === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.room === 'string'
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

  // Server-side streaming - Server sends multiple messages to client
  async* streamNotifications(request: StreamNotificationsRequest): AsyncGenerator<NotificationMessage, void, unknown> {
    console.log('🔄 gRPC Stream: AuthService.StreamNotifications', request);
    
    try {
      const response = await fetch(
        `${this.baseUrl}/auth.AuthService/StreamNotifications?duration_seconds=${request.duration_seconds}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Authorization': `Bearer ${request.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new GrpcClientError(`Stream failed: ${response.status} - ${response.statusText}`, response.status);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new GrpcClientError('Unable to read stream', 500);
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ gRPC Stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'end') {
                  console.log('✅ gRPC Stream ended');
                  return;
                }
                if (isNotificationMessage(parsed)) {
                  console.log('📤 Received notification:', parsed);
                  yield parsed;
                }
              } catch (e) {
                console.error('❌ Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ gRPC Stream Error: StreamNotifications', error);
      
      if (error instanceof GrpcClientError) {
        throw error;
      }
      
      throw new GrpcClientError(
        error instanceof Error ? error.message : 'Unknown streaming error occurred',
        500
      );
    }
  }

  // Client-side streaming - Client sends multiple messages to server
  async sendMessages(messages: ClientMessage[]): Promise<ClientMessagesResponse> {
    console.log('📨 gRPC Stream: AuthService.SendMessages', messages);
    
    try {
      const response = await fetch(`${this.baseUrl}/auth.AuthService/SendMessages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+json',
          'X-Grpc-Web': '1',
        },
        body: JSON.stringify({ messages }),
      });

      const data: unknown = await response.json();
      console.log('✅ gRPC Response: SendMessages', data);

      if (!response.ok) {
        if (isGrpcError(data)) {
          throw new GrpcClientError(data.error, response.status, data.details);
        } else {
          throw new GrpcClientError(`gRPC Error: ${response.status} - ${response.statusText}`, response.status);
        }
      }
      
      if (!isClientMessagesResponse(data)) {
        throw new GrpcClientError('Invalid response format from server', 500);
      }

      return data;
    } catch (error) {
      console.error('❌ gRPC Error: SendMessages', error);
      
      if (error instanceof GrpcClientError) {
        throw error;
      }
      
      throw new GrpcClientError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500
      );
    }
  }

  // Bidirectional streaming - Both client and server send multiple messages
  async chatStream(message: ChatMessage): Promise<ChatMessage> {
    console.log('💬 gRPC Stream: AuthService.ChatStream', message);
    
    try {
      const response = await fetch(`${this.baseUrl}/auth.AuthService/ChatStream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+json',
          'X-Grpc-Web': '1',
        },
        body: JSON.stringify({ message }),
      });

      const data: unknown = await response.json();
      console.log('✅ gRPC Response: ChatStream', data);

      if (!response.ok) {
        if (isGrpcError(data)) {
          throw new GrpcClientError(data.error, response.status, data.details);
        } else {
          throw new GrpcClientError(`gRPC Error: ${response.status} - ${response.statusText}`, response.status);
        }
      }
      
      if (!isChatMessage(data)) {
        throw new GrpcClientError('Invalid response format from server', 500);
      }

      return data;
    } catch (error) {
      console.error('❌ gRPC Error: ChatStream', error);
      
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