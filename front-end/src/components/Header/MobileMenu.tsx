import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

type MobileMenuProps = {
  onAdd: () => void;
};

const itemBaseClass =
  'flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

const itemClass = `${itemBaseClass} text-text hover:text-text-strong`;

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${itemBaseClass} bg-surface text-brand-accent` : itemClass;

const MobileMenu = ({ onAdd }: MobileMenuProps) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        className="flex cursor-pointer items-center justify-center rounded-md p-2 text-text transition-colors hover:bg-surface-elevated hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <nav
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-surface-border bg-surface-elevated px-4 py-3 shadow-lg"
        >
          {user && (
            <p className="px-3 pb-3 text-sm text-text">
              Olá, <span className="font-semibold text-text-strong">{user.name.split(' ')[0]}</span>
            </p>
          )}
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/cardapio" onClick={close} className={navItemClass}>
                <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
                Cardápio
              </NavLink>
            </li>
            <li>
              <NavLink to="/pedidos" onClick={close} className={navItemClass}>
                <ClipboardDocumentListIcon className="h-5 w-5" aria-hidden="true" />
                Pedidos
              </NavLink>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  close();
                  onAdd();
                }}
                className={itemClass}
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                Adicionar
              </button>
            </li>
            <li className="mt-2 border-t border-surface-border pt-2">
              <button
                type="button"
                onClick={() => {
                  close();
                  logout();
                }}
                className={itemClass}
              >
                <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                Sair
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default MobileMenu;
