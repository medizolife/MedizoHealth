'use client';
import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
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
  dobVerified: false,
  needsDobVerification: false,
  markDobVerified: () => {},
  login: async () => {},
  loginMobile: async () => {},
  loginEmailOtp: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  googleCompleteRegistration: () => {},
  logout: () => {},
  refreshUser: async () => null,
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
  const [dobVerified, setDobVerified] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dobVerified') === 'true';
    }
    return false;
  });

  const markDobVerified = () => {
    setDobVerified(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dobVerified', 'true');
    }
  };

  const isPatientUnverifiedEmail = state.isAuthenticated && state.user?.role === 'patient' && state.user?.email?.endsWith('@patient.medizo.life');
  const needsDobVerification = Boolean(state.isAuthenticated && state.user?.role === 'patient' && isPatientUnverifiedEmail && !dobVerified);

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
        email = credentialsOrEmail.trim().toLowerCase();
        pwd = password || '';
      } else {
        email = credentialsOrEmail.email.trim().toLowerCase();
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

  // Mobile Login function
  const loginMobile = async (mobileNumber: string, dateOfBirth: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await api.authAPI.loginMobile(mobileNumber, dateOfBirth, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Mobile login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  // Email OTP Login function
  const loginEmailOtp = async (email: string, otp: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await api.authAPI.loginEmailOtp(email, otp);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const cleanData = {
        ...data,
        firstName: data.firstName ? data.firstName.trim() : '',
        lastName: data.lastName ? data.lastName.trim() : '',
        email: data.email ? data.email.trim().toLowerCase() : ''
      };
      const response = await api.register(cleanData);
      if (response && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: response.user, token: response.token } });
      } else {
        dispatch({ type: 'REGISTER_SUCCESS', payload: response });
      }
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  // Google login function
  const googleLogin = async (credential: string, role?: string) => {
    try {
      const data = await api.googleLogin(credential, role);
      
      if (data.requiresRoleSelection || (data.isNewUser && !data.token)) {
        return { isNewUser: true, requiresRoleSelection: true, googleUserInfo: data.googleUserInfo };
      }
      
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
      }
      return { isNewUser: data.isNewUser, user: data.user, token: data.token };
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
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dobVerified');
    }
    setDobVerified(false);
    dispatch({ type: 'LOGOUT' });
  };

  // Refresh user data from backend (e.g. after DigiLocker verification)
  const refreshUser = async (): Promise<User | null> => {
    try {
      const response = await api.authAPI.getMe();
      if (response && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        dispatch({ type: 'USER_LOADED', payload: response.user });
        return response.user;
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
    return null;
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
      dobVerified,
      needsDobVerification,
      markDobVerified,
      login, 
      loginMobile,
      loginEmailOtp,
      register, 
      googleLogin, 
      googleCompleteRegistration,
      logout,
      refreshUser,
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
