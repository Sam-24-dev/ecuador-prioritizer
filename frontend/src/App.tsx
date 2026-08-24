import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/app-shell';
import { AnalizarPage } from '@/pages/analizar';
import { ResultadosPage } from '@/pages/resultados';
import { BatchSessionProvider } from '@/session/batch-session';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BatchSessionProvider>
          <Routes>
            <Route path="/" element={<AppShell><AnalizarPage /></AppShell>} />
            <Route path="/resultados" element={<AppShell><ResultadosPage /></AppShell>} />
            <Route path="/analizar" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BatchSessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;