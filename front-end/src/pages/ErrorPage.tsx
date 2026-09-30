const ErrorPage = () => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <h1 className="text-3xl font-bold text-text-strong">Algo deu errado</h1>
      <p className="text-sm text-text-muted">Ocorreu um erro inesperado. Tente novamente.</p>
      <a
        href="/"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
      >
        Voltar para o início
      </a>
    </div>
  );
};

export default ErrorPage;
