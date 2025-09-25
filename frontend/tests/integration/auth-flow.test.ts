import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useUserStore } from "../../src/stores/user";
import LoginForm from "../../src/components/LoginForm";
import ProtectedRoute from "../../src/components/ProtectedRoute";

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

describe("Authentication Flow Integration", () => {
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

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe("Complete login flow", () => {
    it("successfully completes login flow from form submission to authentication", async () => {
      // Mock successful API responses
      const mockLoginResponse = {
        data: {
          user: { id: "1", name: "John Doe", email: "john.doe@example.com" },
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNjQ5ODI1NjAwLCJleHAiOjE2NDk4MjkyMDB9.valid",
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh",
        },
      };

      const mockUserResponse = {
        data: { id: "1", name: "John Doe", email: "john.doe@example.com" },
      };

      // Mock axios calls
      const { default: apiClient } = await import("../../src/api/client");
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockLoginResponse);
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockUserResponse);

      renderWithRouter(<LoginForm />);

      // Fill out the form
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailInput, {
        target: { value: "john.doe@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "Password123!" } });

      // Submit the form
      fireEvent.click(submitButton);

      // Wait for loading state
      expect(
        screen.getByRole("button", { name: "Signing in..." })
      ).toBeInTheDocument();

      // Wait for successful login
      await waitFor(() => {
        expect(useUserStore.getState().user).toEqual({
          id: "1",
          name: "John Doe",
          email: "john.doe@example.com",
        });
      });

      // Check that tokens were stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "accessToken",
        mockLoginResponse.data.token
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "refreshToken",
        mockLoginResponse.data.refreshToken
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tokenExpiry",
        expect.any(String)
      );

      // Check store state
      const storeState = useUserStore.getState();
      expect(storeState.isAuthenticated).toBe(true);
      expect(storeState.loading).toBe(false);
      expect(storeState.error).toBe(null);
    });
  });
});
