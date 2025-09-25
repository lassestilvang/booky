import { create } from "zustand";
import apiClient from "../api/client";

interface User {
  id: string;
  name: string;
  email: string;
  // Add other fields
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  loading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";

// Helper function to validate JWT token structure
const isValidToken = (token: string): boolean => {
  if (!token || typeof token !== "string") return false;

  // Basic JWT structure validation (header.payload.signature)
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    // Decode payload to check expiry
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to check if session is expired
const isSessionExpired = (): boolean => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;

  const expiryTime = parseInt(expiry, 10);
  const currentTime = Date.now();

  return currentTime > expiryTime;
};

// Helper function for secure token cleanup
const secureTokenCleanup = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);

  // Clear any potential session storage as well
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  loading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: true }),

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      const { user, token, refreshToken } = response.data;

      // Validate tokens before storage
      if (!isValidToken(token) || !isValidToken(refreshToken)) {
        throw new Error("Invalid token received from server");
      }

      // Store tokens securely in localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

      // Set session expiry to match JWT expiry (1 hour from now)
      const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hour
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

      // Set user in store
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      // Generic error message to prevent information leakage
      const message =
        "Authentication failed. Please check your credentials and try again.";
      set({ error: message, loading: false });
      throw error;
    }
  },

  logout: () => {
    // Secure token cleanup
    secureTokenCleanup();

    // Clear user from store
    set({ user: null, isAuthenticated: false, error: null });
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await apiClient.post<{ token: string }>(
        "/auth/refresh",
        {
          refreshToken,
        }
      );

      const { token } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      // If refresh fails, logout
      get().logout();
      throw error;
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Check if tokens exist and session is not expired
    if (!token || !refreshToken || isSessionExpired()) {
      if (isSessionExpired()) {
        // Session expired, perform secure cleanup
        secureTokenCleanup();
      }
      set({ isInitializing: false });
      return;
    }

    // Validate token structure
    if (!isValidToken(token) || !isValidToken(refreshToken)) {
      secureTokenCleanup();
      set({ isInitializing: false });
      return;
    }

    try {
      // Try to get user info to validate token
      const response = await apiClient.get("/auth/user");
      const user = response.data;
      set({ user, isAuthenticated: true, isInitializing: false });
    } catch (error) {
      // If token is invalid, try refresh
      try {
        await get().refreshToken();
        // After refresh, try again
        const response = await apiClient.get("/auth/user");
        const user = response.data;
        set({ user, isAuthenticated: true, isInitializing: false });
      } catch (refreshError) {
        // If refresh fails, perform secure cleanup
        secureTokenCleanup();
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    }
  },
}));
