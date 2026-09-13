import { UserPlusIcon } from '@heroicons/react/24/outline';
import LoginDropdown from './LoginDropdown';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center">
          <img alt="De Santos Bolos" className="h-12 w-auto" />
        </a>

        <div className="flex items-center gap-5">
          <LoginDropdown />
          <a
            href="/cadastrar"
            className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover"
          >
            <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
            Cadastrar
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
