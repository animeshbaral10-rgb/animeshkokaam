import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { getBackendApiUrl } from '@/lib/backend-url';

const API_URL = getBackendApiUrl();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
        setUser(parsedUser);
        // Verify token is still valid (non-blocking)
      verifyToken(storedToken);
      } catch (error) {
        // Invalid stored user data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setLoading(false);
      }
    } else {
      // No stored auth, set loading to false immediately
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(tokenToVerify);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else if (response.status === 401) {
        // Token is truly invalid/expired — clear auth
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      } else {
        // Other server errors (500, 503, etc.) — keep stored session
        console.warn(`Token verification returned ${response.status}, keeping stored session`);
      }
    } catch (error: any) {
      // Network error or timeout — keep stored session instead of logging out
      if (error.name === 'AbortError') {
        console.warn('Token verification timed out, keeping stored session');
      } else {
        console.warn('Token verification failed (network error), keeping stored session');
      }
      // Don't clear auth — user stays logged in with stored data
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Registration failed' }));
        return { error: new Error(data.message || `Registration failed: ${response.status}`) };
      }

      const data = await response.json();

      // Auto-login after registration
      return await signIn(email, password);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: new Error('Cannot connect to server. Please check if backend is running on ' + API_URL) };
      }
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Login failed' }));
        return { error: new Error(data.message || `Login failed: ${response.status}`) };
      }

      const data = await response.json();

      // Store token and user
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      return { error: null };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: new Error('Cannot connect to server. Please check if backend is running on ' + API_URL) };
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
