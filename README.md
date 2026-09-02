# Ecuador Prioritizer

<div align="center">

**Prioriza noticias y afirmaciones para enfocar la revisión humana.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=061018)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.1-337AB7?style=for-the-badge)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Frontend-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Render](https://img.shields.io/badge/Render-API-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![License](https://img.shields.io/badge/Code-MIT-green?style=for-the-badge)

</div>

**Product:** Ecuador Prioritizer prioritizes public news items and claims for human review.

**Release target:** software version **v1.0.0**; this repository is preparing that target, not declaring a stable release.

**Operational status:** public pilot, best effort, no SLA, human-in-the-loop.

Ecuador Prioritizer ayuda a equipos de verificación a **ordenar noticias y afirmaciones para revisión humana**. Entrega señales preliminares de priorización; no reemplaza la verificación profesional.

## Demo en vivo

Prueba la aplicación en [ecuador-prioritizer.scaizapa.workers.dev](https://ecuador-prioritizer.scaizapa.workers.dev/).

El piloto es anónimo y funciona por sesión: puedes importar una URL pública o cargar hasta 10 textos, revisar la vista previa y analizar el lote. Cada ítem admite hasta 2.000 caracteres.

## Qué hace y qué no hace

**Hace**

- Ordena un lote para sugerir qué revisar primero.
- Permite importar una URL, editar la vista previa y conservar los resultados durante la sesión.
- Muestra el origen de cada ítem y permite exportar el lote de resultados en CSV.

**No hace**

- No verifica hechos ni emite veredictos de verdad o falsedad.
- No decide sobre personas, no sustituye el criterio editorial y no ofrece un SLA.
- No ofrece cuentas, historial persistente, colas, expedientes ni una API pública.

## Cómo funciona

1. **Prepara el lote.** Agrega textos o importa URLs de noticias públicas.
2. **Revisa la vista previa.** Confirma o edita el título, el contenido y la fuente antes de agregar cada ítem.
3. **Analiza.** La aplicación envía el lote al servicio de priorización administrado por el propietario en Render; es accesible desde la aplicación pública, pero no se ofrece como API pública ni para integraciones de terceros.
4. **Verifica por tu cuenta.** Contrasta las fuentes originales y aplica tu propio proceso editorial.

## Capturas del flujo

Las capturas se tomaron del Worker canónico en escritorio (1440 × 900), con dos URLs públicas de **El Universo**. El contenido fue reducido a frases breves para no redistribuir el cuerpo de los artículos.

![Vista previa de una noticia importada desde una URL pública; la fecha, el dominio y el contenido breve quedan listos para revisión humana, no para un veredicto.](docs/images/readme/url-import-review.png)

![Resultados priorizados de dos noticias; los puntajes son señales preliminares para revisión humana y no veredictos.](docs/images/readme/prioritized-results.png)

Fuentes usadas en la captura: [Yandel Sinfónico, Maroon 5 y Myke Towers se toman FTC live al Parque](https://www.eluniverso.com/entretenimiento/musica/yandel-sinfonico-maroon-5-y-myke-towers-se-toman-ftc-live-al-parque-nota/) y [Ecuador declara alerta roja en todo el país por el fenómeno del Niño](https://www.eluniverso.com/noticias/ecuador/ecuador-declara-alerta-roja-por-el-nino-que-implica-nota/). La aplicación mostró la fecha publicada extraída para ambas vistas previas; se usaron únicamente el título, la URL, el dominio y texto breve editado.

## Privacidad y límite del modelo

- El piloto no requiere cuenta y está diseñado para uso anónimo y por sesión.
- No envíes información personal, credenciales, material protegido ni contenido sensible.
- El bundle privado del modelo está autorizado para la inferencia del piloto, pero el bundle, los artefactos y el dataset ecuatoriano obtenido por scraping no se publican.
- Las señales dependen del texto y de los datos disponibles; siempre requieren revisión humana.

## Tecnología

- **Frontend:** React + Vite, desplegado en Cloudflare Workers.
- **Priorización:** FastAPI + Python en un servicio de Render administrado por el propietario; es accesible desde la aplicación pública, pero no es una API pública ni una integración para terceros.
- **Pipeline:** TF-IDF + FEDA + XGBoost.

La arquitectura completa está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). El límite de publicación de modelos y datos está en [docs/PUBLICATION_POLICY.md](docs/PUBLICATION_POLICY.md) y [docs/PHASE_3_ASSET_GATE.md](docs/PHASE_3_ASSET_GATE.md). La descripción pública del modelo está en [docs/MODEL_CARD.md](docs/MODEL_CARD.md).

## Desarrollo local

```bash
cd frontend
npm ci
npm run build
npm run lint
npm run typecheck
```

### Pruebas públicas del backend

```bash
cd backend
python -m pytest -m "not ml_integration"
```

Esta es la suite pública de contrato del backend; usa el código y los fixtures públicos y no requiere el bundle privado. La inferencia ML en vivo no se puede reproducir desde este repositorio porque el bundle y los datos de entrenamiento permanecen privados.

Para proponer cambios o reportar mejoras, use las [issues del proyecto](https://github.com/Sam-24-dev/ecuador-prioritizer/issues). Para operar o verificar el despliegue actual, consulte el [runbook de operaciones](docs/OPERATIONS_RUNBOOK.md). Los avisos de licencias del bundle público están en [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).

## Estado del piloto y limitaciones

Este es un piloto público sin garantía de disponibilidad ni SLA. La salida sirve para ordenar el trabajo de revisión, no para establecer la verdad de una afirmación ni para tomar decisiones sobre personas. El repositorio mantiene fuera del lanzamiento público el modelo privado, sus artefactos y los datos de entrenamiento.

## Licencia

El código se publica bajo [MIT](LICENSE). Para reportar una vulnerabilidad, consulte [SECURITY.md](SECURITY.md).

---

<div align="center">

### Autor

**Samir Caizapasto**<br />
*Desarrollador full-stack y propietario de Ecuador Prioritizer*

<a href="https://www.linkedin.com/in/samir-caizapasto/">
  <img src="https://img.shields.io/badge/LinkedIn-Conectar-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Perfil de Samir Caizapasto en LinkedIn" />
</a>
<a href="mailto:samir.leonardo.caizapasto04@gmail.com">
  <img src="https://img.shields.io/badge/Correo-Escribirme-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Enviar un correo a Samir Caizapasto" />
</a>

<br />
<br />

Si Ecuador Prioritizer te resulta útil para organizar la revisión de noticias, considera darle una estrella al repositorio.

</div>
