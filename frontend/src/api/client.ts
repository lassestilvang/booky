import axios from "axios";
import { useUserStore } from "../stores/user";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/v1", // Adjust base URL as needed
  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_KEY = "accessToken";

// Add request interceptor to include Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await axios.post(
          "http://localhost:3000/v1/auth/refresh",
          { refreshToken }
        );

        const { token } = refreshResponse.data;
        localStorage.setItem(TOKEN_KEY, token);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        const { logout } = useUserStore.getState();
        logout();
        // Return a generic error to prevent information leakage
        const genericError = new Error(
          "Authentication session expired. Please log in again."
        );
        return Promise.reject(genericError);
      }
    }

    // Sanitize error messages to prevent information leakage
    if (error.response) {
      const status = error.response.status;
      let genericMessage = "An error occurred while processing your request.";

      // Provide specific but safe messages for common scenarios
      if (status === 400) {
        genericMessage =
          "Invalid request. Please check your input and try again.";
      } else if (status === 403) {
        genericMessage =
          "Access denied. You don't have permission to perform this action.";
      } else if (status === 404) {
        genericMessage = "The requested resource was not found.";
      } else if (status === 429) {
        genericMessage =
          "Too many requests. Please wait a moment and try again.";
      } else if (status >= 500) {
        genericMessage = "Server error. Please try again later.";
      }

      // Create a sanitized error object
      const sanitizedError = new Error(genericMessage);
      sanitizedError.name = "APIError";
      return Promise.reject(sanitizedError);
    }

    // For network errors or other issues
    const networkError = new Error(
      "Network error. Please check your connection and try again."
    );
    networkError.name = "NetworkError";
    return Promise.reject(networkError);
  }
);

export default apiClient;
