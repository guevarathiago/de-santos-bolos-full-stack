import { ArrowRightStartOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router';
import LoginDropdown from './LoginDropdown';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';

const Header = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="De Santos Bolos" className="h-9 w-auto sm:h-15" />
        </Link>

        {user ? (
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="text-sm text-text">
              Olá, <span className="font-semibold text-text-strong">{user.name.split(' ')[0]}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-brand hover:bg-surface-elevated hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-95 sm:px-4"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              Sair
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-5">
            {pathname !== '/entrar' && <LoginDropdown />}
            {pathname !== '/cadastrar' && (
              <Link
                to="/cadastrar"
                className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover sm:px-4"
              >
                <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                Cadastrar
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
