import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router';
import Input from '../components/Input/Input';
import logoRedondo from '../assets/logoRedondo.png';
import { formatCep, formatPhone } from '../utils/masks';

type Mode = 'cadastro' | 'login';

const SignUp = () => {
  const [mode, setMode] = useState<Mode>('cadastro');
  const [passwordError, setPasswordError] = useState('');
  const [cep, setCep] = useState('');
  const [celular, setCelular] = useState('');

  const handleCepChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(event.target.value));
  };

  const handleCelularChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCelular(formatPhone(event.target.value));
  };

  const handleSignUpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setPasswordError('');
  };

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const switchMode = (nextMode: Mode) => {
    setPasswordError('');
    setMode(nextMode);
  };

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
              <Input id="signup-name" name="name" label="Nome completo" type="text" autoComplete="name" required />

              <Input id="signup-email" name="email" label="E-mail" type="email" autoComplete="email" required />

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
                />
              </div>

              <Input
                id="signup-password"
                name="password"
                label="Senha"
                type="password"
                autoComplete="new-password"
                required
              />

              <Input
                id="signup-confirm-password"
                name="confirmPassword"
                label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                required
                error={passwordError}
              />

              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
              >
                Criar conta
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-medium text-brand-accent transition-colors hover:text-brand-accent-hover"
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
              <Input id="login-page-email" name="email" label="E-mail" type="email" autoComplete="email" required />

              <Input
                id="login-page-password"
                name="password"
                label={
                  <span className="flex items-center justify-between">
                    <span>Senha</span>
                    <Link to="/esqueci-senha" className="hover:text-text-strong">
                      Esqueci a senha
                    </Link>
                  </span>
                }
                type="password"
                autoComplete="current-password"
                required
              />

              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
              >
                Entrar
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchMode('cadastro')}
                className="font-medium text-brand-accent transition-colors hover:text-brand-accent-hover"
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
