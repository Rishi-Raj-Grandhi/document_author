import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

const LoginPage = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let data;
      if (isSignup) {
        data = await authAPI.signup(email, password);
        console.log('Signup response:', data); // Debug log
      } else {
        data = await authAPI.login(email, password);
      }
      
      // Store token and user data
      // Supabase signup may not return access_token if email confirmation is required
      // Login always returns access_token
      if (isSignup) {
        // For signup, check if we have user data
        // Supabase signup can return user at root level or in user field
        const userData = data.user || (data.id ? {
          id: data.id,
          email: data.email || email,
          user_metadata: data.user_metadata || {}
        } : null);
        
        if (userData) {
          // If access_token exists, user can login immediately
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            onLogin({ user: userData, token: data.access_token });
          } else {
            // Email confirmation required
            // alert('Account created! Please check your email to confirm your account before signing in.');
            // Switch to login mode
            setIsSignup(false);
            setEmail('');
            setPassword('');
          }
        } else {
          console.error('Signup response missing user data:', data);
          // alert('Signup failed: Invalid response format. Please try again.');
        }
      } else {
        // Login - always has access_token
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user || data));
          onLogin({ user: data.user || data, token: data.access_token });
        } else {
          // alert('Authentication failed: Invalid response format');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'An error occurred. Please try again.';
      // alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0F172A' }}>
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#F1F5F9' }}>
            AI Document Studio
          </h1>
          <p style={{ color: '#CBD5E1' }}>
            Create professional documents with AI assistance
          </p>
        </div>

        {/* Auth Card */}
        <div 
          className="rounded-lg p-8 shadow-xl"
          style={{ backgroundColor: '#1E293B' }}
        >
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsSignup(false)}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: !isSignup ? '#A78BFA' : 'transparent',
                color: !isSignup ? '#0F172A' : '#CBD5E1',
                border: !isSignup ? 'none' : '1px solid #334155'
              }}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: isSignup ? '#A78BFA' : 'transparent',
                color: isSignup ? '#0F172A' : '#CBD5E1',
                border: isSignup ? 'none' : '1px solid #334155'
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: '#F1F5F9' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F1F5F9',
                  border: '1px solid #334155'
                }}
                placeholder="you@example.com"
                onFocus={(e) => e.target.style.borderColor = '#A78BFA'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: '#F1F5F9' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg outline-none transition-all pr-12"
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#F1F5F9',
                    border: '1px solid #334155'
                  }}
                  placeholder="••••••••"
                  onFocus={(e) => e.target.style.borderColor = '#A78BFA'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: '#CBD5E1' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium transition-all mt-6"
              style={{
                backgroundColor: '#A78BFA',
                color: '#0F172A'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#9333EA'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#A78BFA'}
            >
              {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6" style={{ color: '#CBD5E1' }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="font-medium"
            style={{ color: '#A78BFA' }}
          >
            {isSignup ? 'Login' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;