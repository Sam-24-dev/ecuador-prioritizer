import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TransparenciaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="max-w-2xl border-l-2 border-terracotta py-2 pl-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Información pública</p>
        <h1 className="mt-3 font-editorial text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">Transparencia y privacidad</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">Información clara sobre el uso de la herramienta y sus límites.</p>
      </section>

      <Card className="mt-10">
        <CardHeader className="border-b border-border">
          <CardTitle>Antes de usar la herramienta</CardTitle>
          <CardDescription>Responsable: Samir Caizapasto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5 text-sm leading-relaxed sm:pt-7">
          <section>
            <h2 className="font-editorial text-xl font-semibold">¿Cómo funciona?</h2>
            <p className="mt-2 text-muted-foreground">Para ordenar las noticias, la herramienta usa el texto que envías y, si los agregas, la fuente o el enlace.</p>
          </section>

          <section>
            <h2 className="font-editorial text-xl font-semibold">Tu información</h2>
            <p className="mt-2 text-muted-foreground">No necesitas crear una cuenta. El texto y los resultados quedan disponibles mientras mantienes abierta esta pestaña. No envíes información sensible o confidencial.</p>
          </section>

          <section>
            <h2 className="font-editorial text-xl font-semibold">Qué no hace</h2>
            <p className="mt-2 text-muted-foreground">La herramienta no verifica hechos ni toma decisiones sobre personas.</p>
          </section>

          <section>
            <h2 className="font-editorial text-xl font-semibold">¿Encontraste un error?</h2>
            <p className="mt-2 text-muted-foreground">Para soporte, privacidad o reportar un problema: <a className="font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="mailto:ecuadorprioritizer.contacto@gmail.com">ecuadorprioritizer.contacto@gmail.com</a></p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
