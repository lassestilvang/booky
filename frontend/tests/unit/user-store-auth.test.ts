import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import apiClient from "../../src/api/client";

// Import the actual store after mocking
import { useUserStore } from "../../src/stores/user";

// Mock the isValidToken function to return true for tests
vi.mock(
  "../../src/stores/user",
  async () => {
    const actual = await vi.importActual("../../src/stores/user");
    return {
      ...actual,
      isValidToken: vi.fn(() => true),
    };
  },
  { virtual: true }
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock apiClient
vi.mock("../../src/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("useUserStore - Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("successfully logs in user with valid credentials", async () => {
      const mockResponse = {
        data: {
          user: { id: "1", name: "Test User", email: "test@example.com" },
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NDk4MjU2MDAsImV4cCI6MTY0OTgyOTIwMH0.signature",
          refreshToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0OTgyNTYwMCwiZXhwIjoxNjUwNDMwNDAwfQ.signature",
        },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.login("test@example.com", "Password123!");
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "Password123!",
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "accessToken",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NDk4MjU2MDAsImV4cCI6MTY0OTgyOTIwMH0.signature"
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "refreshToken",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0OTgyNTYwMCwiZXhwIjoxNjUwNDMwNDAwfQ.signature"
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tokenExpiry",
        expect.any(String)
      );

      expect(result.current.user).toEqual({
        id: "1",
        name: "Test User",
        email: "test@example.com",
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("handles login failure with invalid credentials", async () => {
      const mockError = new Error("Invalid credentials");
      (apiClient.post as any).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await expect(
          result.current.login("invalid@example.com", "wrongpassword")
        ).rejects.toThrow(mockError);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        "Authentication failed. Please check your credentials and try again."
      );
    });

    it("validates tokens before storing them", async () => {
      const mockResponse = {
        data: {
          user: { id: "1", name: "Test User", email: "test@example.com" },
          token: "invalid-token",
          refreshToken: "invalid-refresh-token",
        },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await expect(
          result.current.login("test@example.com", "Password123!")
        ).rejects.toThrow("Invalid token received from server");
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("sets loading state during login", async () => {
      const mockResponse = {
        data: {
          user: { id: "1", name: "Test User", email: "test@example.com" },
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NDk4MjU2MDAsImV4cCI6MTY0OTgyOTIwMH0.signature",
          refreshToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0OTgyNTYwMCwiZXhwIjoxNjUwNDMwNDAwfQ.signature",
        },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.login("test@example.com", "Password123!");
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        // Wait for login to complete
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears user data and tokens", () => {
      const { result } = renderHook(() => useUserStore());

      // Set initial state
      act(() => {
        useUserStore.setState({
          user: { id: "1", name: "Test User", email: "test@example.com" },
          isAuthenticated: true,
          error: "Some error",
        });
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("refreshToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("tokenExpiry");
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "refreshToken"
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("tokenExpiry");

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("refreshToken", () => {
    it("successfully refreshes token", async () => {
      localStorageMock.getItem.mockReturnValue("valid-refresh-token");

      const mockResponse = {
        data: { token: "new-jwt-token" },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken: "valid-refresh-token",
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "accessToken",
        "new-jwt-token"
      );
    });

    it("throws error when no refresh token available", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await expect(result.current.refreshToken()).rejects.toThrow(
          "No refresh token available"
        );
      });
    });

    it("handles refresh token failure", async () => {
      localStorageMock.getItem.mockReturnValue("invalid-refresh-token");

      const mockError = new Error("Invalid refresh token");
      (apiClient.post as any).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await expect(result.current.refreshToken()).rejects.toThrow(mockError);
      });
    });
  });

  describe("initializeAuth", () => {
    it("initializes auth with valid stored tokens", async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case "accessToken":
            return "valid-jwt-token";
          case "refreshToken":
            return "valid-refresh-token";
          case "tokenExpiry":
            return (Date.now() + 3600000).toString(); // Future expiry
          default:
            return null;
        }
      });

      const mockUserResponse = {
        data: { id: "1", name: "Test User", email: "test@example.com" },
      };

      (apiClient.get as any).mockResolvedValueOnce(mockUserResponse);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(apiClient.get).toHaveBeenCalledWith("/auth/user");
      expect(result.current.user).toEqual({
        id: "1",
        name: "Test User",
        email: "test@example.com",
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("handles expired session", async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case "accessToken":
            return "valid-jwt-token";
          case "refreshToken":
            return "valid-refresh-token";
          case "tokenExpiry":
            return (Date.now() - 3600000).toString(); // Past expiry
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("refreshToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("tokenExpiry");

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("handles invalid tokens", async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case "accessToken":
            return "invalid-token";
          case "refreshToken":
            return "invalid-refresh-token";
          case "tokenExpiry":
            return (Date.now() + 3600000).toString();
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("refreshToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("tokenExpiry");

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("attempts token refresh when user fetch fails", async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case "accessToken":
            return "expired-jwt-token";
          case "refreshToken":
            return "valid-refresh-token";
          case "tokenExpiry":
            return (Date.now() + 3600000).toString();
          default:
            return null;
        }
      });

      const mockRefreshResponse = {
        data: { token: "new-jwt-token" },
      };

      const mockUserResponse = {
        data: { id: "1", name: "Test User", email: "test@example.com" },
      };

      (apiClient.get as any).mockRejectedValueOnce(new Error("Token expired"));
      (apiClient.post as any).mockResolvedValueOnce(mockRefreshResponse);
      (apiClient.get as any).mockResolvedValueOnce(mockUserResponse);

      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken: "valid-refresh-token",
      });

      expect(result.current.user).toEqual({
        id: "1",
        name: "Test User",
        email: "test@example.com",
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("setUser", () => {
    it("sets user and authentication state", () => {
      const { result } = renderHook(() => useUserStore());

      const testUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
