import Spinner from './Spinner';

const variants = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  danger:    'bg-red-600   hover:bg-red-700   text-white',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-700',
  outline:   'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2 font-medium rounded-lg
      transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
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
