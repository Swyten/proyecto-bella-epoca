# Informe de Implementación de Estrategias SEO y GEO — Discoteca Bella Época

Este documento recoge las medidas técnicas, semánticas y de arquitectura de contenidos aplicadas en la web de **Discoteca Bella Época** (`https://proyecto-bella-epoca.vercel.app/`) para optimizar tanto su posicionamiento en buscadores tradicionales (**SEO**) como su visibilidad y capacidad de citación en motores de respuesta basados en inteligencia artificial generativa (**GEO**).

---

## 1. Estrategias de SEO (Search Engine Optimization)

### 1.1. SEO Técnico, Rastreo e Indexación

* **Control del rastreo mediante `robots.txt`:** Se ha configurado un archivo `robots.txt` en la raíz del proyecto que permite el acceso general de los motores de búsqueda (`Allow: /`) y restringe el rastreo de rutas privadas, paneles internos y endpoints de servidor (`Disallow: /admin/`, `Disallow: /api/` y `Disallow: /html/gestion-mesas.html`). De este modo se optimiza el presupuesto de rastreo (*crawl budget*) y se evita indexar vistas de administración.
* **Mapa del sitio (`sitemap.xml`):** Se ha creado el archivo `sitemap.xml` en la raíz pública —y declarado explícitamente mediante la directiva `Sitemap:` dentro de `robots.txt`— incluyendo las cuatro vistas públicas principales (`/`, `/html/eventos.html`, `/html/reserva.html` y `/html/galeria.html`) con sus etiquetas `<lastmod>`, `<changefreq>` y `<priority>`.
* **Optimización de rendimiento y Core Web Vitals:**
  * **Estabilidad visual (CLS):** Todas las etiquetas `<img>` incorporan sus dimensiones intrínsecas (`width="1536" height="1024"`) para reservar el espacio en pantalla antes de la descarga y evitar saltos de diseño.
  * **Velocidad de carga (LCP):** La imagen principal de portada (*hero*) utiliza `fetchpriority="high"` para priorizar su descarga inmediata, mientras que las imágenes secundarias y el mapa embebido emplean `loading="lazy"` y `decoding="async"` para diferir la carga de elementos fuera de pantalla.

### 1.2. SEO On-Page y Arquitectura Semántica

* **Metadatos y etiquetas sociales:** Cada documento HTML declara el idioma del contenido (`<html lang="es">`) y define etiquetas `<title>` y `<meta name="description">` únicas. Además, se han implementado metadatos Open Graph (`og:title`, `og:description`, `og:type`) y Twitter Cards (`twitter:card`) para enriquecer las previsualizaciones al compartir enlaces en redes sociales y mensajería.
* **Estructura semántica HTML5 y accesibilidad:** El marcado se organiza mediante etiquetas semánticas (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<figure>`, `<dl>`, `<footer>` y `<noscript>`) acompañadas de una jerarquía estricta de encabezados (un único `<h1>` principal por página seguido de niveles `<h2>` y `<h3>`), facilitando la comprensión temática por parte de los rastreadores y lectores de pantalla.

### 1.3. SEO Local y Consistencia de Datos (NAP)

* **Datos de identificación local (NAP):** La web presenta de forma visible y estructurada el nombre comercial (**Discoteca Bella Época**), su ubicación física exacta (**Calle Vitoria, 25, 26005 Logroño, La Rioja**), su correo de contacto (`info@bellaepoca.es`), un mapa interactivo de Google Maps y enlaces directos a sus perfiles oficiales en TikTok, Instagram y Facebook.
* **Coherencia horaria transversal:** Se ha unificado el calendario de apertura (**jueves a domingo de 23:30 a 06:00**) en todas las capas de la plataforma: en la sección de contacto (`#contacto`), en el bloque de preguntas frecuentes (`#faq`), en los datos estructurados del `<head>` y en la validación lógica del selector de fechas de reservas (`reserva.html` y `reserva.js`), eliminando cualquier inconsistencia interna.

---

## 2. Estrategias de GEO (Generative Engine Optimization)

### 2.1. Acceso Explícito a Rastreadores de Modelos de Lenguaje

* **Autorización de bots de IA en `robots.txt`:** Se han definido reglas específicas (`Allow: /`) para los principales agentes de rastreo y recuperación de información utilizados por sistemas de inteligencia artificial: **`GPTBot`** (OpenAI), **`Google-Extended`** (Google / Gemini) y **`CCBot`** (Common Crawl), asegurando que la información pública del local pueda ser indexada, procesada y citada en respuestas conversacionales.

### 2.2. Datos Estructurados con Schema.org (JSON-LD)

* **Definición de entidad comercial (`NightClub`):** En el `<head>` de `index.html` se ha integrado un bloque `<script type="application/ld+json">` bajo el esquema `@type: "NightClub"` que identifica formalmente el establecimiento ante buscadores y LLMs mediante:
  * Dirección postal normalizada (`PostalAddress`: Calle Vitoria 25, Logroño, La Rioja, ES).
  * Horario comercial estructurado (`OpeningHoursSpecification` para `Thursday`, `Friday`, `Saturday` y `Sunday` de `23:30` a `06:00`).
  * Valoración agregada (`AggregateRating` con `ratingValue: "4.8"` sobre `reviewCount: "125"`).
* **Estructuración de conocimiento (`FAQPage`):** Se ha añadido un segundo bloque JSON-LD independiente bajo el tipo `@type: "FAQPage"` que recoge las preguntas frecuentes del establecimiento en formato estructurado pregunta-respuesta.

### 2.3. Contenido Citable y Extracción Directa sin Dependencia de JavaScript

* **Bloque visible de Preguntas Frecuentes (`#faq`):** Dado que muchos rastreadores de IA leen únicamente el HTML inicial sin ejecutar peticiones asíncronas en JavaScript, se ha incorporado una sección `#faq` renderizada directamente en el DOM inicial con respuestas claras y directas sobre:
  1. Ubicación exacta en Logroño y horario de apertura (jueves a domingo, 23:30 a 06:00).
  2. Funcionamiento de la reserva online de mesas y zonas VIP (incluyendo celebraciones de cumpleaños).
  3. Diferencias entre la entrada General y la entrada VIP.
  4. Edad mínima legal (+18 años con documento físico original) y código de vestimenta.
* **Sincronización estricta HTML / JSON-LD:** El texto visible de las preguntas y respuestas de la sección `#faq` coincide de forma literal con el contenido declarado en el esquema `FAQPage` del `<head>`, cumpliendo las directrices de calidad de Google y maximizando la fiabilidad de los fragmentos extraídos por asistentes generativos.

---

## 3. Resumen Técnico por Archivo

| Área | Implementación realizada | Archivos implicados | Impacto SEO / GEO |
| :--- | :--- | :--- | :--- |
| **Rastreo e Indexación** | Bloqueo de rutas internas, permisos a bots de IA (`GPTBot`, `Google-Extended`, `CCBot`) y enlace al sitemap. | `robots.txt`, `sitemap.xml` | Indexación limpia de vistas públicas y acceso directo a LLMs. |
| **Datos Estructurados** | Marcado JSON-LD `NightClub` (con dirección, horarios y valoraciones) y `FAQPage`. | `index.html` | Resultados enriquecidos en Google y comprensión de entidad en IA. |
| **Contenido GEO** | Sección `#faq` visible en el HTML inicial sincronizada con el esquema `FAQPage`. | `index.html` | Extracción directa de respuestas sin necesidad de ejecutar JS. |
| **SEO Local y Coherencia** | Dirección exacta en Logroño, mapa embebido y unificación horaria (jueves a domingo). | `index.html`, `reserva.html`, `reserva.js` | Consistencia de datos operativos y relevancia geográfica local. |
| **Rendimiento Web** | Dimensiones explícitas en imágenes, `fetchpriority="high"` y `loading="lazy"`. | `index.html` y vistas HTML | Mejora de métricas Core Web Vitals (LCP y CLS). |