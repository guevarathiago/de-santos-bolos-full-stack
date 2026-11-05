import { useEffect, useState } from 'react';
import { CakeIcon, PencilSquareIcon, PlusIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Modal from '../components/Modal/Modal';
import ProductForm from '../components/ProductForm/ProductForm';
import { categoryLabels, dietaryTagLabels, formatPrice } from '../constants/products';
import { deleteProduct, listAdminProducts, updateProduct } from '../services/products';
import type { Product } from '../services/products';
import { getProductsErrorMessage } from '../utils/productErrors';

type Editing = { mode: 'create' } | { mode: 'edit'; product: Product } | null;

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    listAdminProducts()
      .then((loaded) => {
        if (!ignore) setProducts(loaded);
      })
      .catch((err) => {
        if (!ignore) setError(getProductsErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSaved = (saved: Product) => {
    setProducts((current) =>
      current.some((product) => product.id === saved.id)
        ? current.map((product) => (product.id === saved.id ? saved : product))
        : [saved, ...current],
    );
    toast.success(editing?.mode === 'edit' ? `"${saved.name}" atualizado.` : `"${saved.name}" criado.`);
    setEditing(null);
  };

  const toggleAvailable = async (product: Product) => {
    setError('');
    setTogglingId(product.id);

    try {
      const saved = await updateProduct(product.id, { available: !product.available });
      setProducts((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      toast.success(saved.available ? `"${saved.name}" voltou ao cardápio.` : `"${saved.name}" saiu do cardápio.`);
    } catch (err) {
      setError(getProductsErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) {
      return;
    }

    setError('');
    setIsDeleting(true);

    try {
      await deleteProduct(toDelete.id);
      setProducts((current) => current.filter((product) => product.id !== toDelete.id));
      toast.success(`"${toDelete.name}" excluído.`);
    } catch (err) {
      setError(getProductsErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-strong">Produtos</h1>
          <p className="mt-1 text-sm text-text-muted">
            O cardápio da loja. Produtos indisponíveis ficam ocultos para os clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ mode: 'create' })}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          Novo produto
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-danger/40 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-border px-4 py-16 text-center">
            <CakeIcon className="h-10 w-10 text-text-muted" aria-hidden="true" />
            <p className="font-medium text-text-strong">Nenhum produto cadastrado</p>
            <p className="text-sm text-text-muted">Cadastre os bolos e doces do cardápio.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((product) => (
              <li
                key={product.id}
                className={`flex items-center gap-4 rounded-lg border border-surface-border bg-surface-elevated p-3 ${product.available ? '' : 'opacity-60'}`}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CakeIcon className="h-7 w-7 text-text-muted" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.featured && (
                      <StarIcon className="h-4 w-4 shrink-0 fill-brand-accent text-brand-accent" aria-label="Destaque" />
                    )}
                    <p className="truncate font-medium text-text-strong">{product.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {categoryLabels[product.category]} · {formatPrice(product.priceCents)}
                    {product.leadTimeDays > 1 && ` · ${product.leadTimeDays} dias de antecedência`}
                    {product.dietaryTags.length > 0 &&
                      ` · ${product.dietaryTags.map((tag) => dietaryTagLabels[tag]).join(', ')}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAvailable(product)}
                  disabled={togglingId === product.id}
                  title={product.available ? 'Tirar do cardápio' : 'Voltar ao cardápio'}
                  className={`shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    product.available
                      ? 'border-success/40 text-success hover:bg-success/10'
                      : 'border-surface-border text-text-muted hover:bg-surface'
                  }`}
                >
                  {product.available ? 'Disponível' : 'Indisponível'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing({ mode: 'edit', product })}
                  aria-label={`Editar ${product.name}`}
                  title="Editar"
                  className="shrink-0 cursor-pointer rounded-md p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setToDelete(product)}
                  aria-label={`Excluir ${product.name}`}
                  title="Excluir"
                  className="shrink-0 cursor-pointer rounded-md p-2 text-text-muted transition-colors hover:bg-surface hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Editar produto' : 'Novo produto'}
        size="lg"
      >
        {editing && (
          <ProductForm
            key={editing.mode === 'edit' ? editing.product.id : 'new'}
            product={editing.mode === 'edit' ? editing.product : null}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal isOpen={toDelete !== null} onClose={() => setToDelete(null)} title="Excluir produto">
        <p className="text-sm text-text">
          Excluir <span className="font-semibold text-text-strong">{toDelete?.name}</span>? Ele sai do cardápio e
          desta lista. Pedidos já feitos com este produto continuam registrados.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Se quiser só pausar as vendas, use o botão Disponível em vez de excluir.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setToDelete(null)}
            disabled={isDeleting}
            className="cursor-pointer rounded-md border border-surface-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="cursor-pointer rounded-md bg-danger px-4 py-2 text-sm font-semibold text-surface transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;
