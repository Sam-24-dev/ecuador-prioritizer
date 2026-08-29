import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clipboard, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreIndicator } from '@/components/shared/score-indicator';
import { type SessionResultItem, useBatchSession } from '@/session/batch-session';
import { escapeCsvCell } from '@/lib/csv';
import { getPriorityLabel } from '@/lib/priority-presentation';

function exportCsv(session: { results: SessionResultItem[] }) {
  const header = ['orden_de_revision', 'resultado_de_priorizacion', 'puntaje_de_posible_desinformacion_0_a_100', 'fuente', 'texto'];
  const lines = session.results.map((item, index) => [escapeCsvCell(index + 1, { trustedGeneratedNumber: true }), escapeCsvCell(getPriorityLabel(item.preliminary_class)), escapeCsvCell(Math.round(item.score_false * 100), { trustedGeneratedNumber: true }), escapeCsvCell(item.source), escapeCsvCell(item.text)].join(','));
  const blob = new Blob([`\uFEFF${[header.map((value) => escapeCsvCell(value)).join(','), ...lines].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ecuador-prioritizer-resultados.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function HttpSource({ source }: { source: string }) {
  const [copyNotice, setCopyNotice] = useState('');
  let href: string | null = null;
  try { const parsed = new URL(source); href = parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null; } catch { /* A source can be a media name or filename. */ }
  const copy = async () => {
    try { await navigator.clipboard.writeText(source); setCopyNotice('Fuente copiada.'); } catch { setCopyNotice('No se pudo copiar la fuente.'); }
  };
  return <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">{href ? <a className="inline-flex min-h-11 min-w-11 max-w-full items-center rounded px-2 py-2 break-all text-primary underline underline-offset-4 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={href} target="_blank" rel="noreferrer">{source}</a> : <span className="min-w-0 break-all">{source}</span>}<Button type="button" variant="ghost" size="sm" onClick={copy} aria-label="Copiar fuente"><Clipboard className="h-3.5 w-3.5" aria-hidden="true" />Copiar</Button>{copyNotice && <span role="status" aria-live="polite" className="text-xs text-muted-foreground">{copyNotice}</span>}</div>;
}

export function ResultadosPage() {
  const navigate = useNavigate();
  const { session, clearResults } = useBatchSession();
  const [csvExportStatus, setCsvExportStatus] = useState('');
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (!session?.results.length) recoveryHeadingRef.current?.focus(); }, [session]);

  if (!session?.results.length) {
    return <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center"><section className="w-full border-y border-border py-10 sm:py-14"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resultados priorizados</p><h1 ref={recoveryHeadingRef} tabIndex={-1} className="mt-3 font-editorial text-4xl font-semibold leading-tight outline-none sm:text-5xl">Todavía no hay resultados disponibles.</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">Primero analiza noticias para establecer un orden de atención. Los resultados aparecerán aquí al terminar el análisis.</p><Button className="mt-7" onClick={() => navigate('/')}>Analizar noticias</Button></section></div>;
  }

  const analyzedAt = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.analyzedAt));
  const reset = () => { clearResults(); navigate('/'); };
  const handleCsvExport = () => { exportCsv(session); setCsvExportStatus('La exportación CSV se inició.'); };

  return (
    <div className="mx-auto max-w-5xl">
      <section className="max-w-3xl border-l-2 border-terracotta py-2 pl-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resultados priorizados</p><h1 className="mt-3 text-balance font-editorial text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">Orden de atención para este lote.</h1><p className="mt-4 text-base leading-relaxed text-muted-foreground"><span className="font-mono tabular-nums">{session.results.length}</span> publicaciones ordenadas para revisión · analizado el {analyzedAt}.</p></section>
      <Card className="mt-10"><CardHeader className="gap-5 border-b border-border sm:flex-row sm:items-end sm:justify-between"><div><CardTitle>Prioridad de revisión</CardTitle><CardDescription className="mt-2 max-w-2xl">Las noticias se ordenan para ayudarte a decidir cuál revisar primero.</CardDescription></div><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={handleCsvExport}><Download className="h-4 w-4" aria-hidden="true" />Descargar todos los resultados (CSV)</Button><Button type="button" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden="true" />Borrar resultados</Button>{csvExportStatus && <p role="status" aria-live="polite" className="basis-full text-sm text-muted-foreground">{csvExportStatus}</p>}</div></CardHeader>
        <CardContent className="space-y-0 pt-2 sm:pt-3">{session.results.map((item, index) => <article key={item.id} className="grid gap-5 border-b border-border py-6 last:border-b-0 lg:grid-cols-[4rem_minmax(0,1fr)]"><div className="font-mono text-xl font-semibold tabular-nums text-primary">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0 space-y-5"><ScoreIndicator scoreFalse={item.score_false} preliminaryClass={item.preliminary_class} /><div><p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fuente</p>{(item.displaySource ?? item.source) ? <HttpSource source={item.displaySource ?? item.source ?? ''} /> : <p className="text-sm text-muted-foreground">Sin fuente indicada</p>}</div><details className="border border-border bg-muted/40 p-4 text-sm"><summary className="min-h-11 cursor-pointer rounded px-2 py-2.5 font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver texto analizado</summary><p className="mt-4 whitespace-pre-wrap break-words leading-relaxed">{item.text}</p></details></div></article>)}</CardContent>
      </Card>
    </div>
  );
}
