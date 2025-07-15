import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import grpcAuthClient, { GrpcClientError, type User } from '../services/grpc-client';
import '../App.css';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

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
                    <div className="text">Secure token-based auth</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Security Improvements */}
            <div className="card slide-in">
              <div className="learning-notes">
                <h4>Security Improvements</h4>
                <ul>
                  <li>No user data stored in localStorage</li>
                  <li>JWT token validated on each request</li>
                  <li>User data fetched from secure backend</li>
                  <li>Automatic logout on token expiry</li>
                  <li>Proper error handling for auth failures</li>
                </ul>
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
                    <div className="text">AuthService.Login</div>
                  </div>
                  <div className="status-item">
                    <div className="icon success">👤</div>
                    <div className="text">AuthService.GetProfile</div>
                  </div>
                </div>
                <div className="alert alert-success mt-4">
                  <strong>🔒 Security Enhancement!</strong><br />
                  Your profile data is now securely fetched from the backend using JWT token validation.
                </div>
              </div>
            </div>
            
            {/* Next Steps */}
            <div className="card slide-in">
              <div className="card-header">
                <h3>Next Steps</h3>
              </div>
              <div className="card-body">
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--primary-600)' }}>🚀</span>
                    <span>Add streaming gRPC methods</span>
                  </li>
                  <li style={{ marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--primary-600)' }}>📊</span>
                    <span>Implement server-side streaming</span>
                  </li>
                  <li style={{ marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--primary-600)' }}>🔄</span>
                    <span>Add bidirectional streaming</span>
                  </li>
                  <li style={{ marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--primary-600)' }}>🧪</span>
                    <span>Create more gRPC services</span>
                  </li>
                  <li style={{ marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--primary-600)' }}>🚢</span>
                    <span>Deploy to production</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 