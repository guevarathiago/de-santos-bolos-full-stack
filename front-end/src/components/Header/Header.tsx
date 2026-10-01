import {
  ArrowRightStartOnRectangleIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
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

const iconBaseClass =
  'flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-95';

const iconButtonClass = `${iconBaseClass} text-text hover:text-text-strong`;

const navIconClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${iconBaseClass} bg-surface-elevated text-brand-accent` : iconButtonClass;

const Header = () => {
  const { user, isLoading, logout } = useAuth();
  const { pathname } = useLocation();
  const [openModal, setOpenModal] = useState<'add' | 'cart' | null>(null);

  const closeModal = () => setOpenModal(null);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="De Santos Bolos" className="h-9 w-auto sm:h-15" />
        </Link>

        {user ? (
          <div className="flex items-center gap-1 md:gap-5">
            <div className="flex items-center gap-1 md:gap-2">
              <div className="hidden md:contents">
                <NavLink to="/cardapio" aria-label="Cardápio" title="Cardápio" className={navIconClass}>
                  <BookOpenIcon className="h-6 w-6" aria-hidden="true" />
                </NavLink>
                <button
                  type="button"
                  onClick={() => setOpenModal('add')}
                  aria-label="Adicionar"
                  title="Adicionar"
                  className={iconButtonClass}
                >
                  <PlusIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                <NavLink to="/pedidos" aria-label="Pedidos" title="Pedidos" className={navIconClass}>
                  <ClipboardDocumentListIcon className="h-6 w-6" aria-hidden="true" />
                </NavLink>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal('cart')}
                aria-label="Carrinho"
                title="Carrinho"
                className={iconButtonClass}
              >
                <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <span className="hidden text-sm text-text md:inline">
              Olá, <span className="font-semibold text-text-strong">{user.name.split(' ')[0]}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="hidden cursor-pointer items-center gap-1.5 rounded-md border border-surface-border px-4 py-1.5 text-sm font-medium text-text transition-colors hover:border-brand hover:bg-surface-elevated hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-95 md:flex"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              Sair
            </button>
            <MobileMenu onAdd={() => setOpenModal('add')} />
          </div>
        ) : isLoading ? null : (
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

      <Modal isOpen={openModal === 'add'} onClose={closeModal} title="Adicionar">
        <p className="text-sm text-text-muted">Conteúdo provisório.</p>
      </Modal>
      <Modal isOpen={openModal === 'cart'} onClose={closeModal} title="Carrinho">
        <p className="text-sm text-text-muted">Seu carrinho está vazio.</p>
      </Modal>
    </header>
  );
};

export default Header;
