import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      navigate("/dashboard");
      toast.success("Account created! Welcome to Unfazed 🎉");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed. Please try again.",
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
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-4xl">U</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Unfazed</h1>
          <p className="text-xl text-indigo-200 mb-10 font-light">
            Start your free trial today
          </p>

          <div className="space-y-4 text-left">
            {[
              { icon: "✦", text: "No credit card required to start" },
              { icon: "✦", text: "Set up your practice in minutes" },
              { icon: "✦", text: "Full-featured free plan available" },
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
            Create your account
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-7">
            Start your free trial — no credit card required
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="firstName"
                label="First name"
                required
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register("firstName", {
                  required: "First name is required",
                })}
              />
              <Input
                id="lastName"
                label="Last name"
                required
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register("lastName", { required: "Last name is required" })}
              />
            </div>

            <Input
              id="email"
              label="Email address"
              type="email"
              required
              autoComplete="email"
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />

            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              required
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (val) =>
                  val === watch("password") || "Passwords do not match",
              })}
            />

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
