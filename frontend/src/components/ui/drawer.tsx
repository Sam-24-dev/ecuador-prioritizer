import * as React from 'react';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: 'right' | 'left';
  className?: string;
}

export function Drawer({ isOpen, onClose, title, description, children, side = 'right', className }: DrawerProps) {
  const sideStyles = {
    right: 'right-0 top-0 bottom-0 h-full border-l',
    left: 'left-0 top-0 bottom-0 h-full border-r',
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
        <DialogPrimitive.Content
          aria-modal="true"
          data-testid="mobile-drawer-content"
          onCloseAutoFocus={(event) => {
            const trigger = document.querySelector<HTMLButtonElement>('[data-testid="mobile-hamburger-button"]');
            if (trigger) {
              event.preventDefault();
              trigger.focus();
            }
          }}
          className={cn('fixed z-50 flex h-full flex-col bg-surface p-5 overscroll-contain focus:outline-none', sideStyles[side], className)}
        >
          <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
            <div>
              <DialogPrimitive.Title className="font-editorial text-lg font-semibold text-foreground">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="inline-flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Cerrar navegación</span>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
