import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import grpcAuthClient, { 
  GrpcClientError, 
  type User, 
  type NotificationMessage, 
  type ClientMessage, 
  type ChatMessage 
} from '../services/grpc-client';
import '../App.css';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  // Streaming states
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [clientMessages, setClientMessages] = useState<string[]>(['']);
  const [clientStreamResult, setClientStreamResult] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isClientStreaming, setIsClientStreaming] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user data from backend using JWT token
        const response = await grpcAuthClient.getProfile(token);
        setUser(response.user);
        setError('');
      } catch (error) {
        console.error('Error fetching user profile:', error);
        
        if (error instanceof GrpcClientError) {
          // If token is invalid or expired, redirect to login
          if (error.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          setError(`Failed to load profile: ${error.message}`);
        } else {
          setError('Failed to load profile: Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Server-side streaming handler
  const handleServerStreaming = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsStreaming(true);
    setNotifications([]);

    try {
      const stream = grpcAuthClient.streamNotifications({
        access_token: token,
        duration_seconds: 5,
      });

      for await (const notification of stream) {
        setNotifications(prev => [...prev, notification]);
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setError('Failed to stream notifications');
    } finally {
      setIsStreaming(false);
    }
  };

  // Client-side streaming handler
  const handleClientStreaming = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsClientStreaming(true);
    setClientStreamResult('');

    try {
      const messages: ClientMessage[] = clientMessages
        .filter(msg => msg.trim())
        .map(msg => ({
          access_token: token,
          message: msg,
          timestamp: new Date().toISOString(),
        }));

      const result = await grpcAuthClient.sendMessages(messages);
      setClientStreamResult(
        `Sent ${result.total_messages} messages. Status: ${result.status}. Processed: ${result.processed_messages.join(', ')}`
      );
    } catch (error) {
      console.error('Client streaming error:', error);
      setError('Failed to send messages');
    } finally {
      setIsClientStreaming(false);
    }
  };

  // Bidirectional streaming handler
  const handleChatStream = async () => {
    const token = localStorage.getItem('token');
    if (!token || !chatMessage.trim()) return;

    try {
      const message: ChatMessage = {
        access_token: token,
        username: user?.username || 'Unknown',
        message: chatMessage,
        timestamp: new Date().toISOString(),
        room: 'general',
      };

      // Add user message to chat history
      setChatHistory(prev => [...prev, message]);

      const response = await grpcAuthClient.chatStream(message);
      
      // Add server response to chat history
      setChatHistory(prev => [...prev, response]);
      setChatMessage('');
    } catch (error) {
      console.error('Chat streaming error:', error);
      setError('Failed to send chat message');
    }
  };

  const addClientMessage = () => {
    setClientMessages(prev => [...prev, '']);
  };

  const updateClientMessage = (index: number, value: string) => {
    setClientMessages(prev => 
      prev.map((msg, i) => i === index ? value : msg)
    );
  };

  const removeClientMessage = (index: number) => {
    setClientMessages(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card">
            <div className="card-body text-center">
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p>Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card">
            <div className="card-body">
              <div className="alert alert-error">
                <h2>Error</h2>
                <p>{error}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-primary"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card">
            <div className="card-body">
              <div className="alert alert-error">
                <h2>Error</h2>
                <p>User data not found. Please log in again.</p>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-primary"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = user.username.charAt(0).toUpperCase();

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <div className="container">
          <div className="grpc-brand">
            gRPC Learning Dashboard
          </div>
          <button 
            onClick={handleLogout}
            className="btn-danger"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-grid">
            {/* User Profile Card */}
            <div className="card slide-in">
              <div className="card-header">
                <h2>Welcome Back!</h2>
              </div>
              <div className="card-body">
                <div className="user-profile">
                  <div className="user-avatar">
                    {userInitials}
                  </div>
                  <div className="user-info">
                    <h3>{user.username}</h3>
                    <p>{user.email}</p>
                    <p><strong>User ID:</strong> {user.id}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Status Card */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>System Status</h3>
              </div>
              <div className="card-body">
                <div className="status-grid">
                  <div className="status-item">
                    <div className="icon success">✅</div>
                    <div className="text">JWT token validated</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">✅</div>
                    <div className="text">User profile loaded</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">✅</div>
                    <div className="text">gRPC authentication active</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">✅</div>
                    <div className="text">Streaming methods ready</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Server-side Streaming Card */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>🔄 Server-side Streaming</h3>
              </div>
              <div className="card-body">
                <p>Server sends multiple messages to client in real-time.</p>
                <button 
                  onClick={handleServerStreaming}
                  disabled={isStreaming}
                  className="btn-primary"
                  style={{ marginBottom: '16px' }}
                >
                  {isStreaming ? 'Streaming...' : 'Start Notifications Stream'}
                </button>
                
                <div className="notifications-container" style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '8px',
                  backgroundColor: '#f9f9f9'
                }}>
                  {notifications.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No notifications yet. Click the button to start streaming!</p>
                  ) : (
                    notifications.map((notification, index) => (
                      <div key={index} style={{ 
                        padding: '8px', 
                        marginBottom: '4px',
                        backgroundColor: notification.type === 'success' ? '#d4edda' : '#d1ecf1',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}>
                        <strong>{notification.title}</strong><br />
                        {notification.message}<br />
                        <small>{new Date(notification.timestamp).toLocaleTimeString()}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Client-side Streaming Card */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>📨 Client-side Streaming</h3>
              </div>
              <div className="card-body">
                <p>Client sends multiple messages to server in a single request.</p>
                
                <div style={{ marginBottom: '16px' }}>
                  {clientMessages.map((msg, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) => updateClientMessage(index, e.target.value)}
                        placeholder={`Message ${index + 1}`}
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <button 
                        onClick={() => removeClientMessage(index)}
                        disabled={clientMessages.length === 1}
                        className="btn-danger"
                        style={{ padding: '8px 12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button onClick={addClientMessage} className="btn-secondary">
                    Add Message
                  </button>
                  <button 
                    onClick={handleClientStreaming}
                    disabled={isClientStreaming}
                    className="btn-primary"
                  >
                    {isClientStreaming ? 'Sending...' : 'Send Messages'}
                  </button>
                </div>
                
                {clientStreamResult && (
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {clientStreamResult}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bidirectional Streaming Card */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>💬 Bidirectional Streaming</h3>
              </div>
              <div className="card-body">
                <p>Both client and server send messages in real-time.</p>
                
                <div className="chat-container" style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '8px',
                  backgroundColor: '#f9f9f9',
                  marginBottom: '16px'
                }}>
                  {chatHistory.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No messages yet. Start a conversation!</p>
                  ) : (
                    chatHistory.map((msg, index) => (
                      <div key={index} style={{ 
                        padding: '8px', 
                        marginBottom: '4px',
                        backgroundColor: msg.username.includes('Server') ? '#d1ecf1' : '#fff3cd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}>
                        <strong>{msg.username}:</strong> {msg.message}<br />
                        <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatStream()}
                  />
                  <button 
                    onClick={handleChatStream}
                    disabled={!chatMessage.trim()}
                    className="btn-primary"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
            
            {/* API Information */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>gRPC Services</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <strong>Available gRPC Methods:</strong>
                </div>
                <div className="status-grid">
                  <div className="status-item">
                    <div className="icon success">📝</div>
                    <div className="text">AuthService.Login (Unary)</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">👤</div>
                    <div className="text">AuthService.GetProfile (Unary)</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">🔄</div>
                    <div className="text">AuthService.StreamNotifications (Server-side)</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">📨</div>
                    <div className="text">AuthService.SendMessages (Client-side)</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">💬</div>
                    <div className="text">AuthService.ChatStream (Bidirectional)</div>
                  </div>
                </div>
                <div className="alert alert-success mt-4">
                  <strong>🎉 Complete gRPC Implementation!</strong><br />
                  All four types of gRPC methods are now implemented: Unary, Server-side streaming, Client-side streaming, and Bidirectional streaming.
                </div>
              </div>
            </div>
            
            {/* Technology Stack */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>Technology Stack</h3>
              </div>
              <div className="card-body">
                <div className="status-grid">
                  <div className="status-item">
                    <div className="icon info">⚛️</div>
                    <div className="text">React 18 + TypeScript</div>
                  </div>
                  <div className="status-item">
                    <div className="icon info">⚡</div>
                    <div className="text">gRPC-Web Client</div>
                  </div>
                  <div className="status-item">
                    <div className="icon info">🏗️</div>
                    <div className="text">NestJS Backend</div>
                  </div>
                  <div className="status-item">
                    <div className="icon info">🗄️</div>
                    <div className="text">MySQL Database</div>
                  </div>
                  <div className="status-item">
                    <div className="icon info">🔐</div>
                    <div className="text">JWT Authentication</div>
                  </div>
                  <div className="status-item">
                    <div className="icon info">📡</div>
                    <div className="text">Protocol Buffers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 