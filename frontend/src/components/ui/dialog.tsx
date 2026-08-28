import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  onCloseAutoFocus?: (event: Event) => void;
}

export function Dialog({ isOpen, onClose, title, description, children, className, onCloseAutoFocus }: DialogProps) {
  return <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35" /><DialogPrimitive.Content onCloseAutoFocus={onCloseAutoFocus} className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-border bg-surface p-6 focus:outline-none', className)}><DialogPrimitive.Title className="font-editorial text-xl font-semibold">{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>}<DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center border border-border hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Cerrar diálogo</span></DialogPrimitive.Close><div className="mt-5">{children}</div></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;
}