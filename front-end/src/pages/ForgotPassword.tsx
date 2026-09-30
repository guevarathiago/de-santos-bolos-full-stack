import { Link } from 'react-router';
import AuthCard from '../components/AuthCard/AuthCard';

const ForgotPassword = () => {
  return (
    <AuthCard title="Esqueci a senha" subtitle="A recuperação de senha estará disponível em breve">
      <p className="mt-6 text-center text-sm text-text-muted">
        Lembrou a senha?{' '}
        <Link
          to="/entrar"
          className="font-medium text-brand-accent transition-colors hover:text-brand-accent-hover"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
};

export default ForgotPassword;
