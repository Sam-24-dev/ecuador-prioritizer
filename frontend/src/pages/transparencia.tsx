import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TransparenciaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="max-w-2xl border-l-2 border-terracotta py-2 pl-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Información pública</p>
        <h1 className="mt-3 font-editorial text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">Transparencia y privacidad</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">Una explicación breve de qué se envía, qué se conserva en tu sesión y cómo contactarnos.</p>
      </section>

      <Card className="mt-10">
        <CardHeader className="border-b border-border">
          <CardTitle>Antes de usar la herramienta</CardTitle>
          <CardDescription>Responsable: Samir Caizapasto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5 text-sm leading-relaxed sm:pt-7">
          <section>
            <h2 className="font-editorial text-xl font-semibold">Qué se envía y para qué</h2>
            <p className="mt-2 text-muted-foreground">La interfaz envía el texto de la noticia, la fuente opcional y la URL opcional a la API para producir una priorización destinada a revisión humana.</p>
          </section>

          <section>
            <h2 className="font-editorial text-xl font-semibold">Qué no hace</h2>
            <p className="mt-2 text-muted-foreground">La herramienta no verifica los hechos ni toma decisiones sobre personas.</p>
          </section>

          <section>
            <h2 className="font-editorial text-xl font-semibold">Sesión y registros técnicos</h2>
            <p className="mt-2 text-muted-foreground">Los textos y resultados de la sesión usan <code className="font-mono text-foreground">sessionStorage</code> en la pestaña actual. El logger verificado del backend registra metadatos técnicos de la solicitud, pero excluye cuerpos, textos, consultas y encabezados sensibles.</p>
            <p className="mt-2 text-muted-foreground">Los máximos actuales de los registros de plataforma son: Workers Free, hasta 3 días; Render Hobby, registros de aplicación por 7 días.</p>
          </section>

          <section>
            <h2 className="font-editorial text-xl font-semibold">Contacto</h2>
            <p className="mt-2 text-muted-foreground">Para soporte, privacidad o incidentes: <a className="font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="mailto:ecuadorprioritizer.contacto@gmail.com">ecuadorprioritizer.contacto@gmail.com</a>.</p>
            <p className="mt-2 text-muted-foreground">No envíes contenido sensible o confidencial ni el texto analizado por email. Las 48 horas son solo un objetivo de acuse y clasificación.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
