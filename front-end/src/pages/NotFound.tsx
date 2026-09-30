import { Link } from 'react-router';

const NotFound = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-text-strong">Página não encontrada</h1>
      <p className="text-sm text-text-muted">O endereço que você acessou não existe.</p>
      <Link
        to="/"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
      >
        Voltar para o início
      </Link>
    </div>
  );
};

export default NotFound;
