import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground">
      <a className="sr-only z-[60] rounded-sm bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4" href="#contenido-principal">
        Saltar al contenido principal
      </a>
      <Sidebar isOpenMobile={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main id="contenido-principal" tabIndex={-1} className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
