import Spinner from "./Spinner";

const variants = {
  primary:
    "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-[var(--shadow-sm)]",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  outline:
    "border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-slate-700 bg-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)]
      transition-all duration-150
      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]} ${className}
    `}
    {...props}
  >
    {loading && <Spinner size="sm" />}
    {children}
  </button>
);

export default Button;
