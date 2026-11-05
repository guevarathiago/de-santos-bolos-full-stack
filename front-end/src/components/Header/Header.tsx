import {
  ArrowRightStartOnRectangleIcon,
  BookOpenIcon,
  CakeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import LoginDropdown from './LoginDropdown';
import MobileMenu from './MobileMenu';
import Modal from '../Modal/Modal';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';

// The header sits on the brand color, so icons and text use the light on-brand color.
const iconBaseClass =
  'flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-brand active:scale-95';

const iconButtonClass = `${iconBaseClass} text-on-brand/85 hover:text-on-brand`;

const navIconClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${iconBaseClass} bg-brand-hover text-on-brand` : iconButtonClass;

const Header = () => {
  const { user, isLoading, logout } = useAuth();
  const { pathname } = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-hover bg-brand backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          {/* The logo file is brown; the filter turns it white for the brown header. */}
          <img src={logo} alt="De Santos Bolos" className="h-8 w-auto brightness-0 invert sm:h-11" />
        </Link>

        {user ? (
          <div className="flex items-center gap-1 md:gap-5">
            <div className="flex items-center gap-1 md:gap-2">
              <div className="hidden md:contents">
                <NavLink to="/cardapio" aria-label="Cardápio" title="Cardápio" className={navIconClass}>
                  <BookOpenIcon className="h-6 w-6" aria-hidden="true" />
                </NavLink>
                <NavLink to="/pedidos" aria-label="Pedidos" title="Pedidos" className={navIconClass}>
                  <ClipboardDocumentListIcon className="h-6 w-6" aria-hidden="true" />
                </NavLink>
                {user.role === 'ADMIN' && (
                  <NavLink
                    to="/admin/documentos"
                    aria-label="Base de conhecimento"
                    title="Base de conhecimento"
                    className={navIconClass}
                  >
                    <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
                  </NavLink>
                )}
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin/produtos" aria-label="Produtos" title="Produtos" className={navIconClass}>
                    <CakeIcon className="h-6 w-6" aria-hidden="true" />
                  </NavLink>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label="Carrinho"
                title="Carrinho"
                className={iconButtonClass}
              >
                <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <span className="hidden text-sm text-on-brand/85 md:inline">
              Olá, <span className="font-semibold text-on-brand">{user.name.split(' ')[0]}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="hidden cursor-pointer items-center gap-1.5 rounded-md border border-on-brand/40 px-4 py-1.5 text-sm font-medium text-on-brand transition-colors hover:border-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-brand active:scale-95 md:flex"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              Sair
            </button>
            <MobileMenu />
          </div>
        ) : isLoading ? null : (
          <div className="flex items-center gap-3 sm:gap-5">
            {pathname !== '/entrar' && <LoginDropdown />}
            {pathname !== '/cadastrar' && (
              <Link
                to="/cadastrar"
                className="flex items-center gap-1.5 rounded-md bg-on-brand px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-surface sm:px-4"
              >
                <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                Cadastrar
              </Link>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Carrinho">
        <p className="text-sm text-text-muted">Seu carrinho está vazio.</p>
      </Modal>
    </header>
  );
};

export default Header;
