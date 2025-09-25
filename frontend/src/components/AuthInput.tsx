import React, { forwardRef, useState } from "react";
import { FieldError } from "react-hook-form";
import DOMPurify from "dompurify";

interface AuthInputProps {
  type: string;
  placeholder: string;
  error?: FieldError;
  label: string;
  id: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      type,
      placeholder,
      error,
      label,
      id,
      required = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Sanitize input value to prevent XSS
      const sanitizedValue = DOMPurify.sanitize(e.target.value, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [], // No attributes allowed
      });

      // Create a new event with sanitized value
      const sanitizedEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue,
        },
      };

      // Call original onChange if provided
      if (onChange) {
        onChange(sanitizedEvent);
      }
    };

    return (
      <div className="mb-4">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          type={type}
          id={id}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          }`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p
            id={`${id}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;
