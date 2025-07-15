import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import grpcAuthClient, { GrpcClientError, type LoginResponse } from '../services/grpc-client';
import '../App.css';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Use gRPC client for authentication - now properly typed!
      const response: LoginResponse = await grpcAuthClient.login(credentials);
      
      // Store only the JWT token - user data will be fetched when needed
      localStorage.setItem('token', response.access_token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof GrpcClientError) {
        // Handle gRPC-specific errors with status codes
        setError(`${error.message}${error.details ? `: ${error.details}` : ''}`);
      } else {
        // Handle other errors
        setError('Login failed: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-content fade-in">
        <div className="card">
          <div className="card-header">
            <div className="grpc-brand">
              gRPC Learning App
            </div>
            <h1>Sign In</h1>
            <p>Welcome back! Please sign in to your account.</p>
          </div>
          
          <div className="card-body">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`btn-primary w-full ${loading ? 'loading' : ''}`}
              >
                {loading && <div className="spinner"></div>}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
          
          <div className="card-footer">
            <div className="alert alert-info">
              <strong>Demo Credentials:</strong><br />
              Username: <code>admin</code><br />
              Password: <code>admin</code>
            </div>
            
            <div className="status-grid">
              <div className="status-item">
                <div className="icon success">✓</div>
                <div className="text">gRPC-Web Server Ready</div>
              </div>
              <div className="status-item">
                <div className="icon info">⚡</div>
                <div className="text">Type-Safe gRPC Client</div>
              </div>
              <div className="status-item">
                <div className="icon success">🔐</div>
                <div className="text">JWT Authentication</div>
              </div>
              <div className="status-item">
                <div className="icon info">📡</div>
                <div className="text">Real-time Protocol Buffers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 