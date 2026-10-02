import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

const LoginPage = () => {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Show a banner if redirected here due to session expiry
  const sessionExpired = location.state?.reason === "session_expired";

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary)] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-0 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-4xl">U</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Unfazed</h1>
          <p className="text-xl text-indigo-200 mb-10 font-light">
            Calm. Professional. Present.
          </p>

          <div className="space-y-4 text-left">
            {[
              { icon: "✦", text: "Manage your therapy practice with ease" },
              { icon: "✦", text: "Secure session notes and client records" },
              { icon: "✦", text: "Integrated billing and invoicing" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span className="text-indigo-300 mt-0.5 flex-shrink-0">
                  {item.icon}
                </span>
                <span className="text-indigo-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] w-full max-w-[400px] p-8 lg:p-10">
          {/* Logo (visible on mobile) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-[var(--radius)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                Unfazed
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Therapy practice management
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-7">
            Sign in to your account
          </p>

          {/* Session expired banner */}
          {sessionExpired && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius)] bg-[var(--warning-light)] border border-amber-300 text-sm text-amber-800">
              Your session expired. Please sign in again.
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            <Input
              id="email"
              label="Email address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Invalid email address",
                },
              })}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
