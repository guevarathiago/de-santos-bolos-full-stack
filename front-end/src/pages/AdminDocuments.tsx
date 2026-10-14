import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Modal from '../components/Modal/Modal';
import { deleteDocument, listDocuments, uploadDocument } from '../services/documents';
import type { DocumentStatus, KnowledgeDocument } from '../services/documents';
import { getDocumentsErrorMessage, getUploadErrorMessage } from '../utils/documentErrors';

const POLL_INTERVAL_MS = 2000;

const statusBadges: Record<DocumentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Na fila', className: 'border-surface-border text-text-muted' },
  PROCESSING: { label: 'Processando', className: 'border-brand text-brand-accent' },
  READY: { label: 'Pronto', className: 'border-success/40 text-success' },
  FAILED: { label: 'Falhou', className: 'border-danger/40 text-danger' },
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const isInProgress = (document: KnowledgeDocument) =>
  document.status === 'PENDING' || document.status === 'PROCESSING';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<KnowledgeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      setError(getDocumentsErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    listDocuments()
      .then((loaded) => {
        if (!ignore) setDocuments(loaded);
      })
      .catch((err) => {
        if (!ignore) setError(getDocumentsErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const hasDocumentsInProgress = documents.some(isInProgress);

  useEffect(() => {
    if (!hasDocumentsInProgress) {
      return;
    }

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [hasDocumentsInProgress, refresh]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const document = await uploadDocument(file);
      setDocuments((current) => [document, ...current]);
      toast.success(`"${document.filename}" enviado. O processamento começou.`);
    } catch (err) {
      setError(getUploadErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) {
      return;
    }

    setError('');
    setIsDeleting(true);

    try {
      await deleteDocument(toDelete.id);
      setDocuments((current) => current.filter((document) => document.id !== toDelete.id));
      toast.success(`"${toDelete.filename}" excluído.`);
    } catch (err) {
      setError(getDocumentsErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-strong">Base de conhecimento</h1>
          <p className="mt-1 text-sm text-text-muted">
            Documentos que o assistente usa para responder os clientes. PDF ou TXT, até 10 MB.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-text-strong transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowUpTrayIcon className="h-5 w-5" aria-hidden="true" />
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-danger/40 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Carregando documentos...</p>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-border px-4 py-16 text-center">
            <DocumentTextIcon className="h-10 w-10 text-text-muted" aria-hidden="true" />
            <p className="font-medium text-text-strong">Nenhum documento enviado</p>
            <p className="text-sm text-text-muted">
              Envie políticas, perguntas frequentes e outras informações da loja.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {documents.map((document) => {
              const badge = statusBadges[document.status];

              return (
                <li
                  key={document.id}
                  className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface-elevated p-4"
                >
                  <DocumentTextIcon className="mt-0.5 h-6 w-6 shrink-0 text-text-muted" aria-hidden="true" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-text-strong">{document.filename}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                      {document.status === 'READY' && ` · ${document.chunkCount} trechos`}
                    </p>
                    {document.status === 'FAILED' && document.errorMessage && (
                      <p className="mt-2 text-xs text-danger">{document.errorMessage}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setToDelete(document)}
                    disabled={isInProgress(document)}
                    aria-label={`Excluir ${document.filename}`}
                    title="Excluir"
                    className="cursor-pointer rounded-md p-2 text-text-muted transition-colors hover:bg-surface hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal isOpen={toDelete !== null} onClose={() => setToDelete(null)} title="Excluir documento">
        <p className="text-sm text-text">
          Excluir <span className="font-semibold text-text-strong">{toDelete?.filename}</span>? O assistente
          deixará de usar as informações deste documento.
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

export default AdminDocuments;
