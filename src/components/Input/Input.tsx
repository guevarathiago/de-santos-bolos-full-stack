import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: ReactNode;
  id: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

const Input = ({ label, id, error, className, ref, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-text-muted">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-text-strong placeholder-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${className ?? ''}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
};

export default Input;
