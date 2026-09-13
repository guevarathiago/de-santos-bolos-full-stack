import { useEffect, useRef, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import Input from '../Input/Input';

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
          className="fixed inset-x-4 top-20 z-50 rounded-lg border border-surface-border bg-surface-elevated p-4 shadow-lg sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-3 sm:w-72"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input id="login-email" label="E-mail" type="email" required autoComplete="email" />

            <Input
              id="login-password"
              label={
                <span className="flex items-center justify-between">
                  <span>Senha</span>
                  <Link to="/esqueci-senha" className="hover:text-text-strong">
                    Esqueci a senha
                  </Link>
                </span>
              }
              type="password"
              required
              autoComplete="current-password"
            />

            <button
              type="submit"
              className="mt-1 w-full rounded-md bg-brand py-2 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
            >
              Entrar
            </button>
          </form>

          <div className="mt-4 border-t border-surface-border pt-3 text-center text-sm text-text-muted">
            Não tem uma conta?{' '}
            <Link
              to="/cadastrar"
              onClick={() => setIsOpen(false)}
              className="font-medium text-brand-accent transition-colors hover:text-brand-accent-hover"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDropdown;
