export default function Field({ label, error, className = '', as = 'input', children, ...props }) {
  const Control = as;
  return (
    <label className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label}
      {as === 'select' ? <select {...props}>{children}</select> : <Control {...props} />}
      {error && <span className="field__err">{error}</span>}
    </label>
  );
}
