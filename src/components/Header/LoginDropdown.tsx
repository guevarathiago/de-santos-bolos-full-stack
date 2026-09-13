import { useEffect, useRef, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

const LoginDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 text-sm font-medium text-text transition-colors hover:text-text-strong"
      >
        <UserIcon className="h-5 w-5" aria-hidden="true" />
        Entrar
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 mt-3 w-72 rounded-lg border border-surface-border bg-surface-elevated p-4 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-xs font-medium text-text-muted">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-text-strong placeholder-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-medium text-text-muted">
                  Senha
                </label>
                <a href="/esqueci-senha" className="text-xs text-text-muted transition-colors hover:text-text-strong">
                  Esqueci a senha
                </a>
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-text-strong placeholder-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-md bg-brand py-2 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
            >
              Entrar
            </button>
          </form>

          <div className="mt-4 border-t border-surface-border pt-3 text-center text-sm text-text-muted">
            Não tem uma conta?{' '}
            <a href="/cadastrar" className="font-medium text-brand-accent transition-colors hover:text-brand-accent-hover">
              Cadastrar
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDropdown;
