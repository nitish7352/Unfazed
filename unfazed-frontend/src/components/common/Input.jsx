const Input = ({ label, error, id, className = "", required, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label
        htmlFor={id}
        className="text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
        {required && (
          <span className="text-[var(--error)] ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`
        w-full px-3.5 py-2.5 rounded-[var(--radius)] border text-sm transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]
        hover:border-slate-400
        ${
          error
            ? "border-[var(--error)] bg-red-50 focus:ring-[var(--error)]/20 focus:border-[var(--error)]"
            : "border-[var(--border)] bg-white"
        }
        disabled:bg-slate-50 disabled:text-[var(--text-muted)] disabled:cursor-not-allowed
        placeholder:text-[var(--text-muted)]
        ${className}
      `}
      {...props}
    />
    {error && (
      <p
        id={`${id}-error`}
        role="alert"
        className="text-xs text-[var(--error)] mt-0.5"
      >
        {error}
      </p>
    )}
  </div>
);

export default Input;
