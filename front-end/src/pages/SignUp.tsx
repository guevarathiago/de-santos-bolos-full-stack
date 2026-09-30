import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import Input from '../components/Input/Input';
import AuthCard from '../components/AuthCard/AuthCard';
import { formatCep, formatPhone, onlyDigits } from '../utils/masks';
import { useAuth } from '../hooks/useAuth';
import { getRegisterErrorMessage } from '../utils/authErrors';

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(getRegisterErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Criar conta" subtitle="Preencha os dados abaixo para se cadastrar">
      <form onSubmit={handleSignUpSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          id="signup-name"
          name="name"
          label="Nome completo"
          type="text"
          autoComplete="name"
          required
          disabled={isLoading}
        />

        <Input
          id="signup-email"
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          disabled={isLoading}
        />

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
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Já tem uma conta?{' '}
        <Link
          to="/entrar"
          aria-disabled={isLoading}
          tabIndex={isLoading ? -1 : undefined}
          className={`font-medium text-brand-accent transition-colors hover:text-brand-accent-hover ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
};

export default SignUp;
