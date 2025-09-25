import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AuthInput from "../../src/components/AuthInput";
import { FieldError } from "react-hook-form";

describe("AuthInput", () => {
  const defaultProps = {
    type: "text",
    placeholder: "Enter value",
    label: "Test Label",
    id: "test-input",
  };

  it("renders with correct label and input attributes", () => {
    render(<AuthInput {...defaultProps} />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("placeholder", "Enter value");
    expect(input).toHaveAttribute("id", "test-input");
  });

  it("shows required asterisk when required prop is true", () => {
    render(<AuthInput {...defaultProps} required />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays error message when error is provided", () => {
    const error: FieldError = {
      type: "required",
      message: "This field is required",
    };

    render(<AuthInput {...defaultProps} error={error} />);

    expect(screen.getByText("This field is required")).toBeInTheDocument();
    const input = screen.getByLabelText("Test Label");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "test-input-error");
  });

  it("applies error styling when error is present", () => {
    const error: FieldError = {
      type: "required",
      message: "This field is required",
    };

    render(<AuthInput {...defaultProps} error={error} />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toHaveClass("border-red-500");
  });

  it("sanitizes input value using DOMPurify", () => {
    const mockOnChange = vi.fn();
    render(<AuthInput {...defaultProps} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Test Label");

    // Test with potentially malicious input
    fireEvent.change(input, {
      target: { value: "<script>alert('xss')</script>test" },
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "test", // Should be sanitized
        }),
      })
    );
  });

  it("calls onChange with sanitized value", () => {
    const mockOnChange = vi.fn();
    render(<AuthInput {...defaultProps} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Test Label");
    fireEvent.change(input, { target: { value: "normal text" } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "normal text",
        }),
      })
    );
  });

  it("handles email input type correctly", () => {
    render(<AuthInput {...defaultProps} type="email" />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toHaveAttribute("type", "email");
  });

  it("handles password input type correctly", () => {
    render(<AuthInput {...defaultProps} type="password" />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toHaveAttribute("type", "password");
  });

  it("is accessible with proper ARIA attributes", () => {
    render(<AuthInput {...defaultProps} />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("supports forwardRef correctly", () => {
    const ref = vi.fn();
    render(<AuthInput {...defaultProps} ref={ref} />);

    // The ref should be called with the input element
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("passes through additional props to input element", () => {
    render(<AuthInput {...defaultProps} data-testid="custom-input" />);

    expect(screen.getByTestId("custom-input")).toBeInTheDocument();
  });
});
