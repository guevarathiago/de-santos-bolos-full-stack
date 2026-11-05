import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { CakeIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import Input from '../Input/Input';
import { categoryLabels, centsToPriceInput, dietaryTagLabels, parsePriceToCents } from '../../constants/products';
import { createProduct, IMAGE_TYPES, updateProduct, uploadProductImage } from '../../services/products';
import type { DietaryTag, Product, ProductCategory, ProductInput } from '../../services/products';
import { getProductsErrorMessage } from '../../utils/productErrors';

type ProductFormProps = {
  product: Product | null;
  onSaved: (product: Product) => void;
  onCancel: () => void;
};

const fieldClass =
  'w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-text-strong placeholder-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60';

const labelClass = 'text-xs font-medium text-text-muted';

const checkboxClass = 'h-4 w-4 cursor-pointer accent-brand';

const optionalNumber = (value: string) => (value.trim() === '' ? null : Number(value));

const ProductForm = ({ product, onSaved, onCancel }: ProductFormProps) => {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'CAKE');
  const [price, setPrice] = useState(product ? centsToPriceInput(product.priceCents) : '');
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ?? null);
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>(product?.dietaryTags ?? []);
  const [servings, setServings] = useState(product?.servings?.toString() ?? '');
  const [weightGrams, setWeightGrams] = useState(product?.weightGrams?.toString() ?? '');
  const [leadTimeDays, setLeadTimeDays] = useState(product?.leadTimeDays.toString() ?? '1');
  const [sortOrder, setSortOrder] = useState(product?.sortOrder.toString() ?? '0');
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: DietaryTag) =>
    setDietaryTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      setImageUrl(await uploadProductImage(file));
    } catch (err) {
      setError(getProductsErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const priceCents = parsePriceToCents(price);

    if (!name.trim()) {
      setError('Informe o nome do produto.');
      return;
    }

    if (!priceCents) {
      setError('Informe um preço válido, por exemplo 65,00.');
      return;
    }

    const input: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      category,
      priceCents,
      imageUrl,
      dietaryTags,
      servings: optionalNumber(servings),
      weightGrams: optionalNumber(weightGrams),
      leadTimeDays: Number(leadTimeDays),
      sortOrder: Number(sortOrder),
      available,
      featured,
    };

    setError('');
    setIsSaving(true);

    try {
      onSaved(product ? await updateProduct(product.id, input) : await createProduct(input));
    } catch (err) {
      setError(getProductsErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isUploading || isSaving;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-surface-border bg-surface">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <CakeIcon className="h-10 w-10 text-text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-surface-border px-3 py-2 text-sm text-text transition-colors hover:bg-surface hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PhotoIcon className="h-5 w-5" aria-hidden="true" />
            {isUploading ? 'Enviando foto...' : imageUrl ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              disabled={isBusy}
              className="flex cursor-pointer items-center gap-2 text-xs text-text-muted transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Remover foto
            </button>
          )}
          <p className="text-xs text-text-muted">JPG, PNG ou WebP, até 5 MB.</p>
        </div>
      </div>

      <Input id="product-name" label="Nome" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />

      <div className="flex flex-col gap-1">
        <label htmlFor="product-description" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="product-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={3}
          className={`${fieldClass} resize-y`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="product-category" className={labelClass}>
            Categoria
          </label>
          <select
            id="product-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProductCategory)}
            className={fieldClass}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="product-price"
          label="Preço (R$)"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="decimal"
          placeholder="65,00"
        />

        <Input
          id="product-servings"
          label="Serve (pessoas)"
          type="number"
          min={1}
          value={servings}
          onChange={(event) => setServings(event.target.value)}
        />

        <Input
          id="product-weight"
          label="Peso (gramas)"
          type="number"
          min={1}
          value={weightGrams}
          onChange={(event) => setWeightGrams(event.target.value)}
        />

        <Input
          id="product-lead-time"
          label="Antecedência (dias)"
          type="number"
          min={1}
          max={60}
          value={leadTimeDays}
          onChange={(event) => setLeadTimeDays(event.target.value)}
        />

        <Input
          id="product-sort-order"
          label="Ordem no cardápio"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Restrições alimentares</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(dietaryTagLabels).map(([tag, label]) => (
            <label key={tag} className="flex cursor-pointer items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={dietaryTags.includes(tag as DietaryTag)}
                onChange={() => toggleTag(tag as DietaryTag)}
                className={checkboxClass}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} className={checkboxClass} />
          Disponível no cardápio
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className={checkboxClass} />
          Destaque
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-danger/40 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="cursor-pointer rounded-md border border-surface-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isBusy}
          className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Salvando...' : product ? 'Salvar alterações' : 'Criar produto'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
