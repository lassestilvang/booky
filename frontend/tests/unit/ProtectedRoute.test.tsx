import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { useUserStore } from "../../src/stores/user";

// Mock the user store
vi.mock("../../src/stores/user", () => ({
  useUserStore: vi.fn(),
}));

describe("ProtectedRoute", () => {
  const mockNavigate = vi.fn();
  const TestChild = () => (
    <div data-testid="protected-content">Protected Content</div>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  it("renders children when user is authenticated", () => {
    (useUserStore as any).mockReturnValue({
      user: { id: "1", name: "Test User", email: "test@example.com" },
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    (useUserStore as any).mockReturnValue({
      user: null,
    });

    // Mock Navigate component to capture the redirect
    const mockNavigateComponent = vi.fn();
    vi.doMock("react-router-dom", () => ({
      ...vi.importActual("react-router-dom"),
      Navigate: mockNavigateComponent,
    }));

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    // Since Navigate is mocked, we can't easily test the redirect
    // But we can test that the children are not rendered
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("handles null user correctly", () => {
    (useUserStore as any).mockReturnValue({
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    // Children should not be rendered when user is null
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("handles undefined user correctly", () => {
    (useUserStore as any).mockReturnValue({
      user: undefined,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    // Children should not be rendered when user is undefined
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders complex children correctly when authenticated", () => {
    (useUserStore as any).mockReturnValue({
      user: { id: "1", name: "Test User", email: "test@example.com" },
    });

    const ComplexChild = () => (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome back!</p>
        <button>Logout</button>
      </div>
    );

    renderWithRouter(
      <ProtectedRoute>
        <ComplexChild />
      </ProtectedRoute>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Welcome back!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("passes through children props correctly", () => {
    (useUserStore as any).mockReturnValue({
      user: { id: "1", name: "Test User", email: "test@example.com" },
    });

    const ChildWithProps = ({ message }: { message: string }) => (
      <div data-testid="child-with-props">{message}</div>
    );

    renderWithRouter(
      <ProtectedRoute>
        <ChildWithProps message="Hello from protected route" />
      </ProtectedRoute>
    );

    expect(screen.getByTestId("child-with-props")).toBeInTheDocument();
    expect(screen.getByText("Hello from protected route")).toBeInTheDocument();
  });

  it("works with different user object structures", () => {
    (useUserStore as any).mockReturnValue({
      user: {
        id: "123",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
      },
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("handles empty user object", () => {
    (useUserStore as any).mockReturnValue({
      user: {},
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    // Empty object is truthy, so children should render
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("is a functional component that accepts children prop", () => {
    (useUserStore as any).mockReturnValue({
      user: { id: "1", name: "Test User", email: "test@example.com" },
    });

    expect(ProtectedRoute).toBeInstanceOf(Function);

    renderWithRouter(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });
});
