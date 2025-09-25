import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "../../src/components/LoginForm";
import { useUserStore } from "../../src/stores/user";

// Mock the user store
vi.mock("../../src/stores/user", () => ({
  useUserStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginForm", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUserStore as any).mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("renders form with email and password inputs", () => {
    renderWithRouter(<LoginForm />);

    expect(screen.getByLabelText("Email*")).toBeInTheDocument();
    expect(screen.getByLabelText("Password*")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows loading text when loading", () => {
    (useUserStore as any).mockReturnValue({
      login: mockLogin,
      loading: true,
      error: null,
    });

    renderWithRouter(<LoginForm />);

    expect(
      screen.getByRole("button", { name: "Signing in..." })
    ).toBeInTheDocument();
  });

  it("displays error message when error exists", () => {
    const errorMessage =
      "Authentication failed. Please check your credentials and try again.";
    (useUserStore as any).mockReturnValue({
      login: mockLogin,
      loading: false,
      error: errorMessage,
    });

    renderWithRouter(<LoginForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("validates email field as required", async () => {
    renderWithRouter(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText("Email*");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
  });

  it("validates password field as required", async () => {
    renderWithRouter(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("validates password minimum length", async () => {
    renderWithRouter(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password*");
    fireEvent.change(passwordInput, { target: { value: "123" } });

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters long")
      ).toBeInTheDocument();
    });
  });

  it("validates password complexity requirements", async () => {
    renderWithRouter(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password*");
    fireEvent.change(passwordInput, { target: { value: "password" } }); // Missing uppercase, number, special char

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        )
      ).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText("Email*");
    const passwordInput = screen.getByLabelText("Password*");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "test@example.com",
        "Password123!"
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("handles login error gracefully", async () => {
    const error = new Error("Login failed");
    mockLogin.mockRejectedValueOnce(error);

    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText("Email*");
    const passwordInput = screen.getByLabelText("Password*");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "test@example.com",
        "Password123!"
      );
    });

    // Error is handled in the store, so we don't navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("prevents form submission when loading", () => {
    (useUserStore as any).mockReturnValue({
      login: mockLogin,
      loading: true,
      error: null,
    });

    renderWithRouter(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Signing in..." });
    expect(submitButton).toBeDisabled();
  });

  it("applies correct form styling", () => {
    renderWithRouter(<LoginForm />);

    const form = screen.getByRole("form");
    expect(form).toHaveClass("space-y-6");
  });

  it("renders AuthInput components with correct props", () => {
    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText("Email*");
    const passwordInput = screen.getByLabelText("Password*");

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("placeholder", "Enter your email");
    expect(emailInput).toHaveAttribute("id", "email");
    expect(emailInput).toHaveAttribute("required");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("placeholder", "Enter your password");
    expect(passwordInput).toHaveAttribute("id", "password");
    expect(passwordInput).toHaveAttribute("required");
  });

  it("renders AuthButton with correct props", () => {
    renderWithRouter(<LoginForm />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
  });
});
