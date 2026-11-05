import { useEffect, useState } from 'react';
import { CakeIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import { categoryLabels, dietaryTagLabels, formatPrice, formatWeight } from '../constants/products';
import { listMenu } from '../services/products';
import type { Product, ProductCategory } from '../services/products';
import { getMenuErrorMessage } from '../utils/productErrors';

const chipClass = (isActive: boolean) =>
  `cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
    isActive
      ? 'border-brand bg-brand text-on-brand'
      : 'border-surface-border text-text hover:border-brand hover:text-text-strong'
  }`;

const Menu = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<ProductCategory | null>(null);

  useEffect(() => {
    let ignore = false;

    listMenu()
      .then((loaded) => {
        if (!ignore) setProducts(loaded);
      })
      .catch((err) => {
        if (!ignore) setError(getMenuErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Only the categories that have products become filters, in the order they first appear.
  const categories = [...new Set(products.map((product) => product.category))];
  const visible = category ? products.filter((product) => product.category === category) : products;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-text-strong">Cardápio</h1>
      <p className="mt-2 text-sm text-text-muted">
        Bolos e doces feitos sob encomenda. Os preços podem variar em pedidos personalizados.
      </p>

      {categories.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
          <button type="button" onClick={() => setCategory(null)} className={chipClass(category === null)}>
            Todos
          </button>
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={chipClass(category === item)}>
              {categoryLabels[item]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-text-muted">Carregando cardápio...</p>
        ) : error ? (
          <p role="alert" className="rounded-md border border-danger/40 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-border px-4 py-16 text-center">
            <CakeIcon className="h-10 w-10 text-text-muted" aria-hidden="true" />
            <p className="font-medium text-text-strong">Nenhum produto disponível no momento</p>
            <p className="text-sm text-text-muted">Volte em breve ou fale com a gente pelo WhatsApp.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <li
                key={product.id}
                className="flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-elevated"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-surface">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <CakeIcon className="h-14 w-14 text-text-muted" aria-hidden="true" />
                  )}
                  {product.featured && (
                    <span className="absolute top-3 left-3 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-on-brand">
                      Destaque
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-text-strong">{product.name}</h2>
                    <p className="shrink-0 font-semibold text-brand-accent">{formatPrice(product.priceCents)}</p>
                  </div>

                  {product.description && <p className="text-sm text-text-muted">{product.description}</p>}

                  {product.dietaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {product.dietaryTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-success/40 px-2 py-0.5 text-xs font-medium text-success"
                        >
                          {dietaryTagLabels[tag]}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-text-muted">
                    {(product.servings || product.weightGrams) && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" aria-hidden="true" />
                        {[product.servings && `Serve ${product.servings}`, product.weightGrams && formatWeight(product.weightGrams)]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                    {product.leadTimeDays > 1 && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" aria-hidden="true" />
                        Encomende com {product.leadTimeDays} dias de antecedência
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Menu;
