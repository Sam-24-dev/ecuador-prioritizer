import { Menu } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center border-b border-border bg-background px-4 lg:hidden">
      <button
        type="button"
        onClick={onOpenMobileNav}
        data-testid="mobile-hamburger-button"
        className="inline-flex h-11 w-11 items-center justify-center border border-border bg-surface text-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Abrir navegación"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="ml-3 flex min-w-0 items-center gap-2 text-primary">
        <BrandMark decorative className="h-7 w-7" />
        <span className="truncate font-editorial text-lg font-semibold text-foreground" translate="no">Ecuador Prioritizer</span>
      </div>
    </header>
  );
}