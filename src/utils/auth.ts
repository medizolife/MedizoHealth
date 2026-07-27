import jwt_decode from 'jwt-decode';
import { User } from '../types/auth';

/**
 * Utility to find a user by ID from localStorage
 * In a real app, this would be an API call
 */
export const findUserById = (id: string): User | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  
  const user = JSON.parse(storedUser) as User;
  if (user.id === id) return user;
  
  return null;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwt_decode(token);
    if (decoded.exp < Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (error) {
    return true;
  }
};

/**
 * Get user from localStorage
 */
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  return JSON.parse(storedUser);
};
