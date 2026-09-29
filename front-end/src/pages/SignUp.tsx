import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import Input from '../components/Input/Input';
import logoRedondo from '../assets/logoRedondo.png';
import { formatCep, formatPhone, onlyDigits } from '../utils/masks';
import { useAuth } from '../hooks/useAuth';
import { getLoginErrorMessage, getRegisterErrorMessage } from '../utils/authErrors';

type Mode = 'cadastro' | 'login';

const SignUp = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('cadastro');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [celular, setCelular] = useState('');

  const handleCepChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(event.target.value));
  };

  const handleCelularChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCelular(formatPhone(event.target.value));
  };

  const handleSignUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));

    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setPasswordError('');
    setSubmitError('');
    setIsLoading(true);

    try {
      await register({
        name: String(formData.get('name')).trim(),
        email: String(formData.get('email')).trim(),
        password,
        celular: onlyDigits(celular),
        cep: onlyDigits(cep),
      });
      navigate('/');
    } catch (err) {
      setSubmitError(getRegisterErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setSubmitError('');
    setIsLoading(true);

    try {
      await login({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      });
      navigate('/');
    } catch (err) {
      setSubmitError(getLoginErrorMessage(err));
      setIsLoading(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setPasswordError('');
    setSubmitError('');
    setMode(nextMode);
  };

  const errorAlert = submitError && (
    <span role="alert" className="text-xs text-danger">
      {submitError}
    </span>
  );

  const submitButtonClass =
    'mt-2 w-full cursor-pointer rounded-md bg-brand py-2.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60';

  const textButtonClass =
    'cursor-pointer font-medium text-brand-accent transition-colors hover:text-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-2">
      <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-elevated p-8">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-surface-border">
          <img src={logoRedondo} alt="De Santos Bolos" className="h-full w-full scale-120 object-cover" />
        </div>

        {mode === 'cadastro' ? (
          <>
            <h1 className="mt-4 text-center text-2xl font-semibold text-text-strong">Criar conta</h1>
            <p className="mt-1 text-center text-sm text-text-muted">Preencha os dados abaixo para se cadastrar</p>

            <form onSubmit={handleSignUpSubmit} className="mt-6 flex flex-col gap-4">
              <Input id="signup-name" name="name" label="Nome completo" type="text" autoComplete="name" required disabled={isLoading} />

              <Input id="signup-email" name="email" label="E-mail" type="email" autoComplete="email" required disabled={isLoading} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="signup-celular"
                  name="celular"
                  label="Celular"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  value={celular}
                  onChange={handleCelularChange}
                  required
                  disabled={isLoading}
                />

                <Input
                  id="signup-cep"
                  name="cep"
                  label="CEP"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  maxLength={9}
                  value={cep}
                  onChange={handleCepChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Input
                id="signup-password"
                name="password"
                label="Senha"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
              />

              <Input
                id="signup-confirm-password"
                name="confirmPassword"
                label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                error={passwordError}
              />

              {errorAlert}

              <button type="submit" disabled={isLoading} className={submitButtonClass}>
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                disabled={isLoading}
                className={textButtonClass}
              >
                Entrar
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-center text-2xl font-semibold text-text-strong">Entrar</h1>
            <p className="mt-1 text-center text-sm text-text-muted">Acesse sua conta para continuar</p>

            <form onSubmit={handleLoginSubmit} className="mt-6 flex flex-col gap-4">
              <Input id="login-page-email" name="email" label="E-mail" type="email" autoComplete="email" required disabled={isLoading} />

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
                      className={`hover:text-text-strong ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
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

              {errorAlert}

              <button type="submit" disabled={isLoading} className={submitButtonClass}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchMode('cadastro')}
                disabled={isLoading}
                className={textButtonClass}
              >
                Cadastrar
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SignUp;
