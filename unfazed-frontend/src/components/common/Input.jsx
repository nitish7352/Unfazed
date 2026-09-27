const Input = ({
  label, error, id, className = '', required, ...props
}) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
    )}
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`
        w-full px-3 py-2 rounded-lg border text-sm transition-colors
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
        ${className}
      `}
      {...props}
    />
    {error && (
      <p id={`${id}-error`} role="alert" className="text-xs text-red-500 mt-0.5">{error}</p>
    )}
  </div>
);

export default Input;
