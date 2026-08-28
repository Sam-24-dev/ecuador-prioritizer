import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardPaste, FileText, Link2, Plus, Trash2, Upload } from 'lucide-react';
import { UrlImportDialog } from '@/components/analysis/url-import-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MAX_NEWS_ITEMS,
  MAX_NEWS_LENGTH,
  MAX_SOURCE_LENGTH,
  NEWS_SEPARATOR,
  getNewsPreviewBlocks,
  newsLengthError,
  validateNewsBlocks,
} from '@/lib/news-ingestion';
import { useAnalyzeBatch } from '@/hooks/useApiHooks';
import { getSupportReferenceIdFromError } from '@/services/api/support-reference-id';
import { type BatchDraftItem, useBatchSession } from '@/session/batch-session';
import type { BatchAnalysisResponse } from '@/types/api';

const MAX_FILE_BYTES = MAX_NEWS_ITEMS * MAX_NEWS_LENGTH * 4;

interface PreviewItem extends BatchDraftItem {
  fileName?: string;
}

function createDraft(): BatchDraftItem {
  return { id: globalThis.crypto?.randomUUID?.() ?? `batch-${Date.now()}-${Math.random().toString(16).slice(2)}`, text: '', source: '' };
}

function sourceError(source: string): string | null {
  return source.trim().length > MAX_SOURCE_LENGTH ? `La fuente supera el límite por ${source.trim().length - MAX_SOURCE_LENGTH} caracteres.` : null;
}

function hasCompleteResponse(response: BatchAnalysisResponse, drafts: BatchDraftItem[]): boolean {
  if (response.total !== drafts.length || response.items.length !== drafts.length) return false;
  const expectedIds = new Set(drafts.map((draft) => draft.id));
  const receivedIds = response.items.map((item) => item.client_id);
  return receivedIds.every((id): id is string => typeof id === 'string' && expectedIds.has(id))
    && new Set(receivedIds).size === expectedIds.size;
}

function downloadTemplate() {
  const content = `Primera noticia de ejemplo. Incluye el contenido completo de una noticia.\n${NEWS_SEPARATOR}\nSegunda noticia de ejemplo. Incluye el contenido completo de otra noticia.`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  link.download = 'plantilla-noticias.txt';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function AnalizarPage() {
  const navigate = useNavigate();
  const { saveResults } = useBatchSession();
  const [items, setItems] = useState<BatchDraftItem[]>([]);
  const [feedback, setFeedback] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState('');
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [previewFeedback, setPreviewFeedback] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [urlImportOpen, setUrlImportOpen] = useState(false);
  const urlImportTriggerRef = useRef<HTMLButtonElement>(null);
  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
  const analyzeMutation = useAnalyzeBatch();
  const supportReferenceId = getSupportReferenceIdFromError(analyzeMutation.error);

  const updateItem = (id: string, update: Partial<BatchDraftItem>) => {
    analyzeMutation.reset();
    setDuplicateIds([]);
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  };
  const addDraft = () => {
    if (items.length >= MAX_NEWS_ITEMS) { setFeedback('Ya alcanzaste el máximo de 10 noticias.'); return; }
    setFeedback('');
    setItems((current) => [...current, createDraft()]);
  };
  const removeDraft = (id: string) => {
    setDuplicateIds((current) => current.filter((duplicateId) => duplicateId !== id));
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updatePreview = (id: string, update: Partial<PreviewItem>) => setPreview((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  const removePreview = (id: string) => setPreview((current) => current.filter((item) => item.id !== id));

  const handleUrlPreviewConfirmed = (draft: { text: string; source: string; displaySource: string }): boolean => {
    if (items.length >= MAX_NEWS_ITEMS) {
      setFeedback('Ya alcanzaste el máximo de 10 noticias. Quita una noticia antes de importar desde URL.');
      return false;
    }
    const mappedItem: BatchDraftItem = { ...createDraft(), text: draft.text, source: draft.source, displaySource: draft.displaySource };
    setItems((current) => {
      if (current.length >= MAX_NEWS_ITEMS) return current;
      return [...current, mappedItem];
    });
    setFeedback('La noticia importada se agregó y sigue disponible para editar.');
    return true;
  };

  const reviewPastedNews = () => {
    const parsed = getNewsPreviewBlocks(pasteText);
    if (parsed.error) {
      setPasteFeedback(parsed.error);
      return;
    }
    setPasteFeedback('');
    setPreview(parsed.blocks.map((text) => ({ ...createDraft(), text })));
    setPreviewFeedback(`Se encontraron ${parsed.blocks.length} noticias. Revísalas antes de agregarlas.`);
    setPreviewTitle('Revisa las noticias pegadas');
    setPreviewOpen(true);
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    const imported: PreviewItem[] = [];
    const messages: string[] = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.txt')) { messages.push(`${file.name}: solo se aceptan archivos .txt.`); continue; }
      if (file.size > MAX_FILE_BYTES) { messages.push(`${file.name}: supera el límite de ${MAX_FILE_BYTES / 1000} KB.`); continue; }
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
        const parsed = getNewsPreviewBlocks(text);
        if (parsed.error) {
          messages.push(`${file.name}: ${parsed.error}`);
          continue;
        }
        imported.push(...parsed.blocks.map((block) => ({ ...createDraft(), text: block, source: '', fileName: file.name })));
      } catch {
        messages.push(`${file.name}: no se pudo leer. Guárdalo como un archivo .txt UTF-8 e intenta nuevamente.`);
      }
    }

    if (!imported.length) { setFeedback(messages.join(' ') || 'No se pudo preparar ningún archivo para revisar.'); return; }
    setPreview(imported);
    setPreviewFeedback([`Se encontraron ${imported.length} noticia${imported.length === 1 ? '' : 's'} para revisar antes de agregarlas.`, ...messages].join(' '));
    setPreviewTitle('Revisa los archivos importados');
    setPreviewOpen(true);
  };

  const confirmPreview = () => {
    const blockValidation = validateNewsBlocks(preview.map((item) => item.text));
    const hasInvalidItem = preview.some((item) => Boolean(newsLengthError(item.text) || sourceError(item.source)));
    if (!preview.length) { setPreviewFeedback('Agrega al menos una noticia a la vista previa antes de continuar.'); return; }
    if (blockValidation.emptyIndexes.length || hasInvalidItem) { setPreviewFeedback('Corrige o quita las noticias marcadas antes de agregarlas.'); return; }
    if (items.length + preview.length > MAX_NEWS_ITEMS) { setPreviewFeedback(`Hay ${items.length + preview.length} noticias en total. Quita noticias de la vista previa hasta llegar a 10 o menos.`); return; }
    setItems((current) => [...current, ...preview.map(({ fileName: _fileName, ...item }) => item)]);
    setPreview([]);
    setPreviewOpen(false);
    setFeedback('Las noticias se agregaron y siguen disponibles para editar.');
  };

  const validatePrepared = (): BatchDraftItem[] | null => {
    const prepared = items.map((item) => ({ ...item, source: item.source.trim() }));
    if (!prepared.length) { setFeedback('Agrega al menos una noticia antes de analizar.'); return null; }
    const invalid = prepared.find((item) => newsLengthError(item.text) || sourceError(item.source));
    if (invalid) { setFeedback('Corrige las noticias marcadas antes de analizar. El contenido no fue modificado.'); return null; }
    return prepared;
  };

  const requestAnalysis = (prepared: BatchDraftItem[]) => {
    setFeedback('');
    setDuplicateIds([]);
    analyzeMutation.mutate(
      { items: prepared.map((item) => ({ client_id: item.id, text: item.text, source: item.source || undefined })) },
      {
        onSuccess: (response) => {
          if (!hasCompleteResponse(response, prepared)) {
            setFeedback('La respuesta del análisis quedó incompleta. Tus noticias siguen preparadas; revisa la conexión e intenta nuevamente.');
            return;
          }
          saveResults(response, prepared);
          navigate('/resultados');
        },
      },
    );
  };

  const handleAnalyze = () => {
    if (analyzeMutation.isPending) return;
    const prepared = validatePrepared();
    if (!prepared) return;
    const seen = new Set<string>();
    const duplicates = prepared.filter((item) => {
      const key = item.text.trim();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    }).map((item) => item.id);
    if (duplicates.length) {
      setDuplicateIds(duplicates);
      setFeedback('Hay noticias con contenido duplicado. Elige si deseas quitarlas o conservarlas antes de analizar.');
      return;
    }
    requestAnalysis(prepared);
  };

  const keepDuplicatesAndAnalyze = () => {
    const prepared = validatePrepared();
    if (prepared) requestAnalysis(prepared);
  };
  const removeDuplicates = () => {
    setItems((current) => current.filter((item) => !duplicateIds.includes(item.id)));
    setDuplicateIds([]);
    setFeedback('Se quitaron las noticias duplicadas. Puedes seguir editando o analizar el lote.');
  };

  const previewValidation = validateNewsBlocks(preview.map((item) => item.text));
  const previewOverCapacity = items.length + preview.length > MAX_NEWS_ITEMS;

  return (
    <div className="mx-auto max-w-5xl">
      <section className="max-w-3xl border-l-2 border-terracotta py-2 pl-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Análisis de noticias</p>
        <h1 className="mt-3 text-balance font-editorial text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">Organiza la revisión de tus noticias</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Agrega de 1 a 10 noticias y analízalas juntas para recibir un orden de prioridad para la revisión humana.</p>
      </section>

      <Card className="mt-10">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex flex-wrap items-baseline justify-between gap-3"><span>Noticias para analizar · {items.length} de 10</span></CardTitle>
          <CardDescription>Pega una noticia por tarjeta o usa un separador explícito para revisar varias antes de agregarlas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5 sm:pt-7">
          <div className="flex flex-wrap items-center gap-3 border-b border-border pb-5">
            <Button type="button" variant="outline" onClick={addDraft} disabled={items.length >= MAX_NEWS_ITEMS}><Plus className="h-4 w-4" aria-hidden="true" />Agregar una noticia</Button>
            <Button type="button" variant="outline" onClick={() => { setPasteFeedback(''); setPreview([]); setPreviewTitle('Pega varias noticias'); setPreviewOpen(true); }}><ClipboardPaste className="h-4 w-4" aria-hidden="true" />Pegar varias noticias</Button>
            <Button ref={urlImportTriggerRef} type="button" variant="outline" onClick={() => setUrlImportOpen(true)}><Link2 className="h-4 w-4" aria-hidden="true" />Importar desde URL</Button>
            <label htmlFor="news-file-import" className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
              <Upload className="h-4 w-4" aria-hidden="true" />Importar archivos .txt
            </label>
            <input id="news-file-import" className="sr-only" type="file" accept=".txt,text/plain" multiple onChange={handleFiles} />
            <button type="button" className="min-h-11 text-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={downloadTemplate}>Descargar plantilla .txt</button>
            <p className="basis-full text-xs leading-relaxed text-muted-foreground">Cada noticia admite hasta 2000 caracteres.</p>
          </div>
          {feedback && <p role="status" aria-live="polite" className="border-l-2 border-terracotta bg-muted px-3 py-2 text-sm leading-relaxed text-foreground">{feedback}</p>}
          {duplicateIds.length > 0 && <div role="alert" className="flex flex-wrap items-center gap-3 border-l-2 border-terracotta bg-muted p-4 text-sm"><p className="basis-full">Elige qué hacer con las noticias duplicadas.</p><Button type="button" variant="outline" size="sm" onClick={removeDuplicates}>Quitar noticias duplicadas</Button><Button type="button" size="sm" onClick={keepDuplicatesAndAnalyze} disabled={analyzeMutation.isPending}>Mantener duplicadas y analizar</Button></div>}
          {analyzeMutation.isError && <div role="alert" className="flex gap-3 border-l-2 border-destructive bg-destructive/10 p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" /><div><p>No fue posible analizar las noticias en este momento. Tus noticias siguen disponibles para editar e intentar de nuevo.</p>{supportReferenceId && <p className="mt-2">ID de referencia: <code className="font-mono select-all">{supportReferenceId}</code></p>}</div></div>}
          {!items.length ? <div className="border border-dashed border-border px-5 py-12 text-center"><FileText className="mx-auto mb-4 h-7 w-7 text-primary" aria-hidden="true" /><p className="font-editorial text-xl font-semibold">Todavía no agregaste noticias</p><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Agrega una noticia para comenzar la revisión.</p></div> : (
            <div className="space-y-5">
              {items.map((item, index) => {
                const textError = newsLengthError(item.text);
                const itemSourceError = sourceError(item.source);
                return <article key={item.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-editorial text-xl font-semibold">Noticia {index + 1}</h2><Button type="button" size="sm" variant="ghost" onClick={() => removeDraft(item.id)} aria-label={`Quitar noticia ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" />Quitar</Button></div>
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"><div><Textarea id={`batch-text-${item.id}`} label="Contenido de la noticia" value={item.text} onChange={(event) => updateItem(item.id, { text: event.target.value })} error={textError ?? undefined} className="min-h-40" placeholder="Pega aquí el contenido completo de una noticia." /><p className="mt-1 text-right font-mono text-[11px] text-muted-foreground">{item.text.length} / {MAX_NEWS_LENGTH}</p></div><Input id={`batch-source-${item.id}`} label="Fuente (opcional)" value={item.source} onChange={(event) => updateItem(item.id, { source: event.target.value })} error={itemSourceError ?? undefined} placeholder="Medio, archivo o URL…" /></div>
                </article>;
              })}
            </div>
          )}
          {items.length > 0 && <p className="text-sm text-muted-foreground">Puedes agregar otra noticia o analizar las noticias ya agregadas.</p>}
          {items.length > 0 && <p className="border-l-2 border-terracotta bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">Los resultados del lote anterior siguen disponibles en Resultados priorizados. Al analizar este lote, se mostrarán los resultados del nuevo lote.</p>}
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center"><Button type="button" variant="ghost" onClick={() => { setItems([]); setFeedback(''); setDuplicateIds([]); }} disabled={!items.length || analyzeMutation.isPending}>Quitar todas las noticias</Button><Button type="button" onClick={handleAnalyze} isLoading={analyzeMutation.isPending} disabled={!items.length || analyzeMutation.isPending}>{analyzeMutation.isPending ? 'Analizando noticias…' : items.length === 1 ? 'Analizar 1 noticia' : `Analizar ${items.length} noticias`}</Button></div>
          {analyzeMutation.isPending && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Analizando las noticias preparadas…<span className="block">Puede tardar; tus noticias se conservan si falla.</span></p>}
        </CardContent>
      </Card>

      <p className="mt-5 border-l-2 border-terracotta bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">Antes de enviar: esta herramienta envía el texto de la noticia, la fuente opcional y la URL opcional a la API para producir una priorización para revisión humana. No verifica los hechos ni toma decisiones sobre personas. <a className="font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/transparencia">Ver transparencia y privacidad</a>.</p>

      <Dialog isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} className="max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        {previewTitle === 'Pega varias noticias' && !preview.length ? <div className="space-y-4"><p className="text-sm leading-relaxed text-muted-foreground">Separa cada noticia con <code className="font-mono text-foreground">{NEWS_SEPARATOR}</code> sola en una línea. No vamos a dividir el texto por párrafos ni titulares.</p><Textarea id="multi-news-paste" label="Noticias para revisar" value={pasteText} onChange={(event) => setPasteText(event.target.value)} error={pasteFeedback || undefined} className="min-h-56" placeholder={`Primera noticia completa\n${NEWS_SEPARATOR}\nSegunda noticia completa`} /><Button type="button" onClick={reviewPastedNews}>Revisar noticias</Button></div> : <div className="space-y-5"><div role="status" aria-live="polite" className="border-l-2 border-terracotta bg-muted px-3 py-2 text-sm leading-relaxed">{previewFeedback}</div>{previewOverCapacity && <p role="alert" className="text-sm text-destructive">Hay {items.length + preview.length} noticias en total. Quita las necesarias de esta vista previa hasta llegar a 10 o menos.</p>}{previewValidation.emptyIndexes.length > 0 && <p role="alert" className="text-sm text-destructive">Hay noticias vacías. Corrige o quita las noticias vacías antes de agregarlas.</p>}<div className="space-y-5">{preview.map((item, index) => <article key={item.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-editorial text-lg font-semibold">Noticia detectada {index + 1}</h3>{item.fileName && <p className="text-xs text-muted-foreground break-all">Archivo: {item.fileName}</p>}</div><Button type="button" size="sm" variant="ghost" onClick={() => removePreview(item.id)} aria-label={`Quitar noticia detectada ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" />Quitar</Button></div><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]"><div><Textarea id={`preview-text-${item.id}`} label="Contenido de la noticia" value={item.text} onChange={(event) => updatePreview(item.id, { text: event.target.value })} error={newsLengthError(item.text) ?? undefined} className="min-h-36" placeholder="Pega aquí el contenido completo de una noticia." /><p className="mt-1 text-right font-mono text-[11px] text-muted-foreground">{item.text.length} / {MAX_NEWS_LENGTH}</p></div><Input id={`preview-source-${item.id}`} label="Fuente (opcional)" value={item.source} onChange={(event) => updatePreview(item.id, { source: event.target.value })} error={sourceError(item.source) ?? undefined} placeholder="Medio, archivo o URL…" /></div></article>)}</div><div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>Seguir corrigiendo después</Button><Button type="button" onClick={confirmPreview} disabled={!preview.length}>Confirmar y agregar noticias</Button></div></div>}
      </Dialog>
      <UrlImportDialog isOpen={urlImportOpen} isLotFull={items.length >= MAX_NEWS_ITEMS} onCloseAutoFocus={(event) => { if (urlImportTriggerRef.current) { event.preventDefault(); urlImportTriggerRef.current.focus(); } }} onClose={() => setUrlImportOpen(false)} onConfirm={handleUrlPreviewConfirmed} />
    </div>
  );
}
