import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AuthButton from "../../src/components/AuthButton";

describe("AuthButton", () => {
  const defaultProps = {
    children: "Click me",
  };

  it("renders with correct text and default attributes", () => {
    render(<AuthButton {...defaultProps} />);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toBeDisabled();
  });

  it("handles different button types", () => {
    const { rerender } = render(<AuthButton {...defaultProps} type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");

    rerender(<AuthButton {...defaultProps} type="reset" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "reset");
  });

  it("shows loading spinner when loading is true", () => {
    render(<AuthButton {...defaultProps} loading />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");

    // Check for spinner SVG
    const spinner = button.querySelector("svg");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("disables button when loading is true", () => {
    render(<AuthButton {...defaultProps} loading />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-wait");
  });

  it("disables button when disabled prop is true", () => {
    render(<AuthButton {...defaultProps} disabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50");
  });

  it("applies disabled styles when both loading and disabled are true", () => {
    render(<AuthButton {...defaultProps} loading disabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50");
    expect(button).toHaveClass("cursor-wait");
  });

  it("calls onClick when button is clicked and not disabled", () => {
    const mockOnClick = vi.fn();
    render(<AuthButton {...defaultProps} onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when button is disabled", () => {
    const mockOnClick = vi.fn();
    render(<AuthButton {...defaultProps} onClick={mockOnClick} disabled />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when button is loading", () => {
    const mockOnClick = vi.fn();
    render(<AuthButton {...defaultProps} onClick={mockOnClick} loading />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("applies correct CSS classes for default state", () => {
    render(<AuthButton {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "w-full",
      "flex",
      "justify-center",
      "items-center",
      "px-4",
      "py-2",
      "border",
      "border-transparent",
      "rounded-md",
      "shadow-sm",
      "text-sm",
      "font-medium",
      "text-white",
      "bg-blue-600",
      "hover:bg-blue-700",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2",
      "focus:ring-blue-500"
    );
  });

  it("applies loading cursor class when loading", () => {
    render(<AuthButton {...defaultProps} loading />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("cursor-wait");
  });

  it("renders children correctly", () => {
    render(
      <AuthButton>
        <span data-testid="child">Custom Child</span>
      </AuthButton>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Custom Child")).toBeInTheDocument();
  });

  it("positions spinner correctly with text", () => {
    render(<AuthButton loading>Sign In</AuthButton>);

    const button = screen.getByRole("button");
    const spinner = button.querySelector("svg");
    const text = screen.getByText("Sign In");

    expect(spinner).toBeInTheDocument();
    expect(text).toBeInTheDocument();

    // Check that spinner has correct classes for positioning
    expect(spinner).toHaveClass("-ml-1", "mr-3", "h-5", "w-5");
  });

  it("is accessible with proper focus styles", () => {
    render(<AuthButton {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("focus:ring-2", "focus:ring-blue-500");
  });
});
