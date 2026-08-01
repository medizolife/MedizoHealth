'use client';
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthState, LoginCredentials, RegisterData, User } from '../types/auth';
import * as api from '../services/api';

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Auth reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'USER_LOADED'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null
      };
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Create auth context
const AuthContext = createContext<AuthContextType>({
  authState: initialState,
  isAuthenticated: false,
  user: null,
  login: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  googleCompleteRegistration: () => {},
  logout: () => {},
  loading: false,
  error: null,
  clearError: () => {}
});

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      
      try {
        const response = await api.authAPI.getMe();
        dispatch({ type: 'USER_LOADED', payload: response.user });
      } catch (error) {
        dispatch({ type: 'LOGOUT' });
      }
    };
    
    loadUser();
  }, []);

  // Login function
  const login = async (credentialsOrEmail: LoginCredentials | string, password?: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      let email: string;
      let pwd: string;

      if (typeof credentialsOrEmail === 'string') {
        email = credentialsOrEmail;
        pwd = password || '';
      } else {
        email = credentialsOrEmail.email;
        pwd = credentialsOrEmail.password;
      }

      const data = await api.authAPI.login(email, pwd);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await api.register(data);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
    }
  };

  // Google login function
  const googleLogin = async (credential: string, role: string = 'patient') => {
    try {
      const data = await api.googleLogin(credential, role);
      
      if (data.isNewUser) {
        return { isNewUser: true, user: data.user, token: data.token };
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  // Complete Google registration - called from Register page after new user selects role
  const googleCompleteRegistration = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ 
      authState: state, 
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      login, 
      register, 
      googleLogin, 
      googleCompleteRegistration,
      logout,
      loading: state.loading,
      error: state.error,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth hook
export const useAuth = () => useContext(AuthContext);
