import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import AuthInput from "./AuthInput";
import AuthButton from "./AuthButton";
import { useUserStore } from "../stores/user";

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      // Error is handled in the store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      <AuthInput
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: "Please enter a valid email address",
          },
        })}
        type="email"
        placeholder="Enter your email"
        label="Email"
        id="email"
        error={errors.email}
        required
      />
      <AuthInput
        {...register("password", {
          required: "Password is required",
          minLength: {
            value: 8,
            message: "Password must be at least 8 characters long",
          },
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          },
        })}
        type="password"
        placeholder="Enter your password"
        label="Password"
        id="password"
        error={errors.password}
        required
      />
      <AuthButton type="submit" loading={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </AuthButton>
    </form>
  );
};

export default LoginForm;
