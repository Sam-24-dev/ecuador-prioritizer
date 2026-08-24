import { NavLink } from 'react-router-dom';
import { ClipboardList, FilePlus2 } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { BrandMark } from '@/components/brand/brand-mark';
import { cn } from '@/lib/utils';
import { useBatchSession } from '@/session/batch-session';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile = false, onCloseMobile }: SidebarProps) {
  const { session } = useBatchSession();
  const resultsAvailable = Boolean(session?.results.length);
  const navItems = [
    { label: 'Analizar noticias', path: '/', icon: FilePlus2, enabled: true },
    { label: 'Resultados priorizados', path: '/resultados', icon: ClipboardList, enabled: resultsAvailable },
  ];

  const renderLinks = (descriptionId: string, onItemClick?: () => void) => (
    <nav className="space-y-1" aria-label="Navegación principal">
      {navItems.map((item) => item.enabled ? (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={({ isActive }) => cn(
            'flex min-h-11 items-center gap-3 border-l-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isActive ? 'border-primary bg-muted text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground',
          )}
        >
          <item.icon className="h-4 w-4" aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ) : (
        <div key={item.path} className="border-l-2 border-transparent px-3 py-2 text-muted-foreground">
          <button
            type="button"
            aria-disabled="true"
            aria-describedby={descriptionId}
            className="flex min-h-11 w-full cursor-not-allowed items-center gap-3 text-left text-sm font-semibold opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
          <p id={descriptionId} className="mt-1 pl-7 text-xs leading-relaxed">Disponible después de analizar noticias.</p>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-start gap-3 border-b border-border pb-6">
      <BrandMark decorative className="mt-0.5 h-9 w-9 text-primary" />
      <div className="min-w-0">
        <h1 className="font-editorial text-xl font-semibold leading-tight text-foreground" translate="no">Ecuador Prioritizer</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Análisis y priorización de noticias</p>
      </div>
    </div>
  );

  const desktopContent = <div className="flex h-full w-72 flex-col gap-8 border-r border-border bg-surface px-5 py-7">{brand}{renderLinks('resultados-no-disponibles-desktop')}</div>;
  const mobileContent = <div className="flex min-h-full flex-col gap-7 pt-1">{brand}{renderLinks('resultados-no-disponibles-mobile', onCloseMobile)}</div>;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">{desktopContent}</aside>
      <Drawer isOpen={isOpenMobile} onClose={onCloseMobile ?? (() => {})} title="Navegación" description="Ecuador Prioritizer" side="left" className="w-[min(21rem,calc(100vw-2rem))]">
        {mobileContent}
      </Drawer>
    </>
  );
}
