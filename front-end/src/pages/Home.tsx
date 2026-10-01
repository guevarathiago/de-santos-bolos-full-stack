import {
  BookOpenIcon,
  CakeIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import logoRedondo from '../assets/logoRedondo.png';
import { WHATSAPP_DISPLAY } from '../constants/contact';

const highlights = [
  {
    name: 'Bolo Matilda',
    description: 'Chocolate intenso e úmido, coberto com uma ganache cremosa.',
    price: 'R$ 00,00',
  },
  {
    name: 'Bolo Churros',
    description: 'Massa com canela e açúcar, recheada com doce de leite.',
    price: 'R$ 00,00',
  },
  {
    name: 'Bolo de Coco Queimado',
    description: 'Massa fofinha com cobertura de coco caramelizado.',
    price: 'R$ 00,00',
  },
];

const steps = [
  {
    icon: BookOpenIcon,
    title: 'Escolha no cardápio',
    description: 'Veja os sabores disponíveis e escolha o seu favorito.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Faça seu pedido',
    description: 'Adicione ao carrinho e finalize em poucos cliques.',
  },
  {
    icon: TruckIcon,
    title: 'Retire ou receba',
    description: 'Busque na loja ou receba no conforto da sua casa.',
  },
];

const contacts = [
  { icon: MapPinIcon, label: 'Endereço', value: 'Rua Exemplo, 123 - Santos/SP' },
  { icon: PhoneIcon, label: 'WhatsApp', value: WHATSAPP_DISPLAY },
  { icon: ClockIcon, label: 'Horário', value: 'Seg a Sáb, das 9h às 18h' },
];

const primaryButtonClass =
  'rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent';

const secondaryButtonClass =
  'rounded-md border border-surface-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-brand hover:bg-surface-elevated hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

const Home = () => {
  return (
    <div className="flex flex-col">
      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-accent">
            Bolos caseiros em Santos
          </span>
          <h1 className="text-4xl font-bold leading-tight text-text-strong sm:text-5xl">
            Feitos com carinho, do jeito que bolo tem que ser.
          </h1>
          <p className="max-w-md text-text-muted">
            Receitas tradicionais, ingredientes selecionados e aquele sabor de casa de vó. Escolha o seu e
            peça agora mesmo.
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            <Link to="/cardapio" className={primaryButtonClass}>
              Ver cardápio
            </Link>
            <a href="#como-funciona" className={secondaryButtonClass}>
              Como funciona
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <img
            src={logoRedondo}
            alt=""
            className="w-56 drop-shadow-[0_0_60px_rgba(163,92,54,0.35)] sm:w-72 lg:w-80"
          />
        </div>
      </section>

      <section className="border-t border-surface-border bg-surface-elevated/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-text-strong">Destaques</h2>
            <p className="mt-2 text-text-muted">Os queridinhos da casa.</p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <li
                key={item.name}
                className="flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-elevated"
              >
                <div className="flex aspect-4/3 items-center justify-center bg-surface">
                  <CakeIcon className="h-16 w-16 text-brand" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="text-lg font-semibold text-text-strong">{item.name}</h3>
                  <p className="flex-1 text-sm text-text-muted">{item.description}</p>
                  <span className="font-semibold text-brand-accent">{item.price}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex justify-center">
            <Link to="/cardapio" className={secondaryButtonClass}>
              Ver cardápio completo
            </Link>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-16 border-t border-surface-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold text-text-strong">Como funciona</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand-accent">
                  <step.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-text-strong">
                  {index + 1}. {step.title}
                </h3>
                <p className="max-w-xs text-sm text-text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-surface-border bg-surface-elevated/40">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-strong">Sobre nós</h2>
          <p className="text-text-muted">
            A De Santos Bolos nasceu da paixão por receitas de família. Aqui vai um texto contando a história da
            confeitaria, quem faz os bolos e o que torna cada um especial.
          </p>
        </div>
      </section>

      <section className="border-t border-surface-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold text-text-strong">Contato</h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {contacts.map((contact) => (
              <li key={contact.label} className="flex flex-col items-center gap-2 text-center">
                <contact.icon className="h-6 w-6 text-brand-accent" aria-hidden="true" />
                <span className="text-sm font-semibold text-text-strong">{contact.label}</span>
                <span className="text-sm text-text-muted">{contact.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-surface-border py-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} De Santos Bolos. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Home;
