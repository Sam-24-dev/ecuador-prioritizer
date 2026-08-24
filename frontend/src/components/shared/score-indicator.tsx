import { AlertCircle } from 'lucide-react';
import { formatScorePercentage, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PreliminaryClass } from '@/types';

export interface ScoreIndicatorProps {
  scoreFalse: number;
  preliminaryClass: PreliminaryClass;
  compact?: boolean;
  showDisclaimer?: boolean;
  className?: string;
}

export function ScoreIndicator({ scoreFalse, preliminaryClass, compact = false, showDisclaimer = true, className }: ScoreIndicatorProps) {
  const scoreValue = formatScorePercentage(scoreFalse);
  const isSignalFalse = preliminaryClass === 'Falso';
  const accent = isSignalFalse ? 'bg-signal-false' : 'bg-signal-true';

  if (compact) {
    return <Badge variant={isSignalFalse ? 'signal-false' : 'signal-true'} className={cn('font-mono', className)}>{preliminaryClass} ({scoreValue}/100)</Badge>;
  }

  return (
    <section className={cn('border-y border-border py-4', className)} aria-label="Señal de priorización">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Señal de priorización</p>
          <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-3xl font-semibold text-foreground">{scoreValue}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
        <Badge variant={isSignalFalse ? 'signal-false' : 'signal-true'}>Clasificación preliminar: {preliminaryClass}</Badge>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Menor prioridad</span><span>Mayor prioridad</span></div>
        <div className="h-2 w-full overflow-hidden bg-muted" aria-hidden="true"><div className={cn('h-full', accent)} style={{ width: `${scoreValue}%` }} /></div>
      </div>
      {showDisclaimer && <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" /><span><strong>Nota de priorización:</strong> esta señal solo ayuda a ordenar la revisión humana; no es una comprobación de hechos ni un veredicto definitivo.</span></p>}
    </section>
  );
}