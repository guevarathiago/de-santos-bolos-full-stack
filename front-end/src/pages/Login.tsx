import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import Input from '../components/Input/Input';
import AuthCard from '../components/AuthCard/AuthCard';
import { useAuth } from '../hooks/useAuth';
import { getLoginErrorMessage } from '../utils/authErrors';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setSubmitError('');
    setIsLoading(true);

    try {
      await login({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(getLoginErrorMessage(err));
      setIsLoading(false);
    }
  };

  const linkDisabledClass = isLoading ? 'pointer-events-none opacity-60' : '';

  return (
    <AuthCard title="Entrar" subtitle="Acesse sua conta para continuar">
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          id="login-page-email"
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          disabled={isLoading}
        />

        <Input
          id="login-page-password"
          name="password"
          label={
            <span className="flex items-center justify-between">
              <span>Senha</span>
              <Link
                to="/esqueci-senha"
                aria-disabled={isLoading}
                tabIndex={isLoading ? -1 : undefined}
                className={`hover:text-text-strong ${linkDisabledClass}`}
              >
                Esqueci a senha
              </Link>
            </span>
          }
          type="password"
          autoComplete="current-password"
          required
          disabled={isLoading}
        />

        {submitError && (
          <span role="alert" className="text-xs text-danger">
            {submitError}
          </span>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full cursor-pointer rounded-md bg-brand py-2.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Não tem uma conta?{' '}
        <Link
          to="/cadastrar"
          aria-disabled={isLoading}
          tabIndex={isLoading ? -1 : undefined}
          className={`font-medium text-brand-accent transition-colors hover:text-brand-accent-hover ${linkDisabledClass}`}
        >
          Cadastrar
        </Link>
      </p>
    </AuthCard>
  );
};

export default Login;
