import {create} from 'zustand'; // Corrected import statement
import { loginUser as apiLoginUser, registerUser as apiRegisterUser } from '../services/api';

// Helper function to get initial state from localStorage
const getInitialState = () => {
  let user = null;
  let token = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
    token = localStorage.getItem('token');
  } catch (error) {
    // If localStorage is corrupted or not valid JSON
    console.error("Error parsing localStorage data:", error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  return { user, token };
};

const initialStateData = getInitialState();

const useAuthStore = create((set, get) => ({
  user: initialStateData.user,
  token: initialStateData.token,
  isAuthenticated: !!initialStateData.token, // True if token exists
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiLoginUser(credentials); // response.data contains token and user
      const { token, user } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Store user object as string

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return user; // Return user data on successful login
    } catch (error) {
      console.error('Login error in store:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      set({ error: errorMessage, isLoading: false, isAuthenticated: false, user: null, token: null });
      throw new Error(errorMessage); // Re-throw for the component to handle
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRegisterUser(userData); // response.data contains token and user
      const { token, user } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return user; // Return user data on successful registration
    } catch (error) {
      console.error('Registration error in store:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      set({ error: errorMessage, isLoading: false, isAuthenticated: false, user: null, token: null });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    // Optional: Call an API logout endpoint if it exists
    // await api.logoutUser();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: () => {
    // This function is more about rehydrating from localStorage which is done at initialization.
    // If we need to verify token with backend, this would be different.
    // For now, it just ensures state matches localStorage if called explicitly.
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    if (token && user) {
      set({ user, token, isAuthenticated: true });
    } else {
      // Ensure state is cleared if localStorage is empty or corrupted
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

// Call checkAuth on load to initialize state from localStorage
// This is one way, or components can call it, or it can be part of app initialization logic.
// For simplicity, let's assume it's called when the app/store is loaded.
// However, direct call here might not be ideal in all scenarios (e.g., server-side rendering).
// A better place might be in App.jsx useEffect.
// useAuthStore.getState().checkAuth(); 
// For now, initial state from getInitialState handles this.

export default useAuthStore;
