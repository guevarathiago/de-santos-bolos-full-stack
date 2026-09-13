import { UserPlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import LoginDropdown from './LoginDropdown';
import logo from '../../assets/logo.png';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="De Santos Bolos" className="h-9 w-auto sm:h-15" />
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <LoginDropdown />
          <Link
            to="/cadastrar"
            className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover sm:px-4"
          >
            <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
            Cadastrar
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
