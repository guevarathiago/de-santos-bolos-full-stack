import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <h1 className="text-3xl font-bold text-text-strong">
        {isAuthenticated ? 'Você está logado!' : 'Bem-vindo ao De Santos Bolos!'}
      </h1>
    </div>
  );
};

export default Home;
