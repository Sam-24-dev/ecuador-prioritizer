import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Link2 } from 'lucide-react';
import { useExtractUrl } from '@/hooks/useApiHooks';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getSupportReferenceIdFromError } from '@/services/api/support-reference-id';
import type { UrlExtractionResponse } from '@/types/api';

interface UrlImportDialogProps {
  isOpen: boolean;
  isLotFull: boolean;
  onCloseAutoFocus?: (event: Event) => void;
  onClose: () => void;
  onConfirm: (draft: { text: string; source: string; displaySource: string }) => boolean;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function urlExtractionErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;

  switch (code) {
    case 'invalid_url':
    case 'extracted_text_too_short':
    case 'unsupported_media_type':
      return 'No fue posible extraer esta URL. Edita la dirección o prueba con otro artículo público.';
    case 'response_too_large':
      return 'No fue posible extraer esta URL. Prueba con otro artículo público.';
    case 'rate_limited':
    case 'client_timeout':
    case 'upstream_timeout':
    case 'upstream_unavailable':
    case 'service_unavailable':
      return 'No fue posible extraer esta URL. Intenta de nuevo más tarde.';
    default:
      return 'No fue posible extraer esta URL. Verifica que sea un enlace público de una noticia e inténtalo de nuevo.';
  }
}

function safeHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function UrlImportDialog({ isOpen, isLotFull, onCloseAutoFocus, onClose, onConfirm }: UrlImportDialogProps) {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [preview, setPreview] = useState<UrlExtractionResponse | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  const extraction = useExtractUrl();
  const { isError, isPending, mutate, reset } = extraction;
  const extractionError = extraction.error;

  const resetImportState = (nextUrl = '') => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    reset();
    setUrl(nextUrl);
    setUrlError('');
    setPreview(null);
    setTitle('');
    setAuthor('');
    setPublishedAt('');
    setText('');
    setStatus('');
  };

  useEffect(() => {
    if (!isOpen) {
      controllerRef.current?.abort();
      controllerRef.current = null;
      reset();
      setUrl('');
      setUrlError('');
      setPreview(null);
      setTitle('');
      setAuthor('');
      setPublishedAt('');
      setText('');
      setStatus('');
    }
  }, [isOpen, reset]); // Closing an import always discards its local draft.

  const updateDraft = (update: () => void) => {
    update();
    setStatus('');
  };

  const startAnotherImport = (nextUrl = '') => {
    resetImportState(nextUrl);
  };

  const requestExtraction = () => {
    if (isLotFull) {
      setUrlError('Este lote ya tiene 10 noticias. Quita una noticia antes de importar desde URL.');
      return;
    }
    const requestedUrl = url.trim();
    if (!requestedUrl) {
      setUrlError('Ingresa una URL para extraer una vista previa.');
      return;
    }

    resetImportState(requestedUrl);
    const controller = new AbortController();
    controllerRef.current = controller;
    mutate(
      { request: { url: requestedUrl }, signal: controller.signal },
      {
        onSuccess: (response) => {
          if (controller.signal.aborted) return;
          controllerRef.current = null;
          setPreview(response);
          setTitle(response.title ?? '');
          setAuthor(response.author ?? '');
          setPublishedAt(response.published_at ?? '');
          setText(response.text);
          setStatus('Vista previa lista para revisar y editar.');
        },
        onError: (error) => {
          controllerRef.current = null;
          if (controller.signal.aborted || isAbortError(error)) reset();
        },
      },
    );
  };

  const cancelExtraction = () => {
    resetImportState(url);
    setStatus('La extracción se canceló.');
  };

  const handleClose = () => {
    resetImportState();
    onClose();
  };

  const finalUrl = preview ? safeHttpUrl(preview.final_url) : null;
  const supportReferenceId = getSupportReferenceIdFromError(extractionError);

  const confirmPreview = () => {
    if (!preview) return;
    if (onConfirm({ text, source: preview.domain.trim(), displaySource: url })) {
      startAnotherImport();
      setStatus('Noticia agregada al lote. Puedes importar otra URL.');
      return;
    }
    setStatus('No se pudo agregar la vista previa. Revisa la capacidad disponible del lote.');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      onCloseAutoFocus={onCloseAutoFocus}
      title="Importar desde URL"
      description="Extrae una noticia para revisarla aquí y agregarla al lote cuando la confirmes."
      className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-y-auto"
    >
      <div className="space-y-5">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isPending) requestExtraction();
          }}
        >
          <Input
            id="url-import-input"
            type="url"
            label="URL de la noticia"
            value={url}
            onChange={(event) => startAnotherImport(event.target.value)}
            error={urlError}
            placeholder="https://ejemplo.com/noticia"
            autoComplete="url"
            disabled={isPending}
            startIcon={<Link2 className="h-4 w-4" aria-hidden="true" />}
          />
          {isLotFull && <p role="alert" className="border-l-2 border-terracotta bg-muted px-3 py-2 text-sm leading-relaxed">Este lote ya tiene 10 noticias. Quita una noticia antes de importar desde URL.</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isPending} disabled={isPending || isLotFull}>
              {isPending ? 'Extrayendo vista previa…' : 'Extraer vista previa'}
            </Button>
            {isPending && <Button type="button" variant="outline" onClick={cancelExtraction}>Cancelar</Button>}
          </div>
        </form>

        {isPending && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Puede tardar; tus noticias se conservan si falla.</p>}

        {isError && !isPending && (
          <div role="alert" className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="space-y-2">
              <p>{urlExtractionErrorMessage(extractionError)}</p>
              {supportReferenceId && (
                <p>ID de referencia: <code className="font-mono select-all">{supportReferenceId}</code></p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={requestExtraction}>Reintentar extracción</Button>
            </div>
          </div>
        )}

        {status && !isError && <p role="status" aria-live="polite" className="border-l-2 border-terracotta bg-muted px-3 py-2 text-sm leading-relaxed">{status}</p>}

        {preview && (
          <section aria-labelledby="url-preview-heading" className="space-y-5 border-t border-border pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="url-preview-heading" className="font-editorial text-xl font-semibold">Vista previa extraída</h2>
                <p className="mt-1 text-sm text-muted-foreground">Edita el contenido antes de decidir qué hacer con él.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="url-preview-title" label="Título extraído" value={title} onChange={(event) => updateDraft(() => setTitle(event.target.value))} />
              <Input id="url-preview-author" label="Autor extraído" value={author} onChange={(event) => updateDraft(() => setAuthor(event.target.value))} />
              <Input id="url-preview-date" label="Fecha publicada" value={publishedAt} onChange={(event) => updateDraft(() => setPublishedAt(event.target.value))} />
              <div className="space-y-1.5 text-sm"><span className="block text-xs font-semibold text-foreground">Dominio</span><p className="min-h-11 border border-border bg-muted px-3 py-2 text-muted-foreground">{preview.domain}</p></div>
            </div>

            <div className="space-y-2 text-sm">
              <span className="block text-xs font-semibold text-foreground">URL final</span>
              {finalUrl ? <a className="flex items-start gap-2 break-all text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={finalUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{preview.final_url}
              </a> : <span className="block break-all text-muted-foreground">{preview.final_url}</span>}
            </div>

            <div>
              <Textarea id="url-preview-text" label="Contenido extraído" value={text} onChange={(event) => updateDraft(() => setText(event.target.value))} showCharCount maxLength={2000} className="min-h-52" />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Longitud original: {preview.original_length} caracteres.{preview.truncated ? ' El contenido fue truncado para respetar el límite de análisis.' : ''}</p>
            </div>

            {preview.warnings.length > 0 && <div role="note" className="border-l-2 border-terracotta bg-muted p-4 text-sm"><p className="font-semibold">Advertencias de extracción</p><ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}

            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
              <Button type="button" variant="outline" onClick={() => startAnotherImport()}>Importar otra URL</Button>
              <Button type="button" variant="ghost" onClick={handleClose}>Cerrar importación</Button>
              <Button type="button" onClick={confirmPreview}>Confirmar vista previa y agregar al lote</Button>
            </div>
          </section>
        )}
      </div>
    </Dialog>
  );
}
