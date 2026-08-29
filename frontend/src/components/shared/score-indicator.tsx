import { formatScorePercentage, cn } from '@/lib/utils';
import { getPriorityLabel } from '@/lib/priority-presentation';
import { PreliminaryClass } from '@/types';

export interface ScoreIndicatorProps {
  scoreFalse: number;
  preliminaryClass: PreliminaryClass;
  className?: string;
}

export function ScoreIndicator({ scoreFalse, preliminaryClass, className }: ScoreIndicatorProps) {
  const scoreValue = formatScorePercentage(scoreFalse);
  const isSignalFalse = preliminaryClass === 'Falso';
  const accent = isSignalFalse ? 'bg-signal-false' : 'bg-signal-true';

  return (
    <section className={cn('border-y border-border py-4', className)} aria-label="Señal de priorización">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getPriorityLabel(preliminaryClass)}</p>
          <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-sm text-muted-foreground">Puntaje</span>
            <span className="text-3xl font-semibold text-foreground">{scoreValue} / 100</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Revisar después</span><span>Revisar primero</span></div>
        <div className="h-2 w-full overflow-hidden bg-muted" aria-hidden="true"><div className={cn('h-full', accent)} style={{ width: `${scoreValue}%` }} /></div>
      </div>
    </section>
  );
}
