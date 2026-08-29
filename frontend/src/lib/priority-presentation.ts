import type { PreliminaryClass } from '@/types';

export function getPriorityLabel(preliminaryClass: PreliminaryClass): string {
  return preliminaryClass === 'Falso'
    ? 'Posible desinformación'
    : 'Menor señal de desinformación';
}

