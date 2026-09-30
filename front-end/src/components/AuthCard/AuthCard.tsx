import type { ReactNode } from 'react';
import logoRedondo from '../../assets/logoRedondo.png';

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const AuthCard = ({ title, subtitle, children }: AuthCardProps) => {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-elevated p-8">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-surface-border">
          <img src={logoRedondo} alt="De Santos Bolos" className="h-full w-full scale-120 object-cover" />
        </div>

        <h1 className="mt-4 text-center text-2xl font-semibold text-text-strong">{title}</h1>
        <p className="mt-1 text-center text-sm text-text-muted">{subtitle}</p>

        {children}
      </div>
    </div>
  );
};

export default AuthCard;
