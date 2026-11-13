# Informe Técnico de Implementación: Sistema de Reseñas — Discoteca Bella Época

Este documento detalla la arquitectura, el diseño de interfaz, la lógica de cliente y la integración con base de datos desarrollados para el **sistema de gestión y publicación de reseñas** de **Discoteca Bella Época**.

---

## 1. Arquitectura General (Full-Stack)

El módulo de reseñas sigue una arquitectura **cliente-servidor desacoplada** desplegada en Vercel y respaldada por una base de datos relacional en la nube:

1. **Capa de Presentación (`index.html`):** Estructura semántica HTML5 para la visualización de opiniones, filtros por valoración y formulario modal nativo para la creación de nuevas reseñas.
2. **Capa de Lógica de Cliente (`js/index.js`):** Gestión de estado en memoria, control de acceso mediante sesión de usuario, filtrado dinámico, interactividad de puntuación por estrellas y comunicación asíncrona (`fetch`) con la API.
3. **Capa de Backend y Persistencia (`api/resenas.js` + Neon PostgreSQL):** Función *serverless* que expone una API RESTful (`GET` y `POST`) conectada mediante consultas SQL parametrizadas a una base de datos PostgreSQL en Neon.

---

## 2. Interfaz de Usuario y Accesibilidad (`index.html`)

### 2.1. Sección de Reseñas y Sistema de Filtrado (`#resenas`)
* **Contenedor semántico:** Se ha habilitado la sección `<section class="section section--surface" id="resenas">` con encabezado descriptivo y un botón de acción principal (`#btn-open-review`, *"Añadir reseña"*).
* **Barra de pestañas accesible:** Se ha implementado un selector de filtros (`role="tablist"`) con atributos ARIA (`role="tab"`, `aria-selected`) que permite segmentar las opiniones en tres categorías:
  * **Todas** (`data-filter-review="todas"`).
  * **Positivas (4-5 ★)** (`data-filter-review="positivas"`).
  * **Críticas (1-3 ★)** (`data-filter-review="negativas"`).
* **Rejilla dinámica:** El contenedor `<div class="reviews-grid" id="reviews-container">` actúa como punto de montaje para renderizar las tarjetas de opinión obtenidas desde el servidor.

### 2.2. Modal Nativo de Publicación (`#review-modal`)
* **Elemento `<dialog id="review-modal">`:** Se utiliza el elemento nativo de HTML5 `<dialog>` para ofrecer una ventana modal accesible, con cierre mediante botón (`data-dialog-close`), tecla `Escape` o clic fuera del contenedor.
* **Selector visual de estrellas:** Incluye cinco elementos interactivos (`<span data-value="1..5">★</span>`) dentro de `#star-rating`, vinculados a un campo oculto `<input type="hidden" id="review-rating" required>` para capturar la puntuación numérica.
* **Formulario validado:** Incorpora un campo `<textarea id="review-text" required>` para el comentario del cliente y un contenedor de alertas (`#review-error`) para mostrar mensajes de validación sin recargar la página.

---

## 3. Lógica de Cliente e Interactividad (`js/index.js`)

### 3.1. Control de Acceso y Autenticación
* **Publicación restringida a usuarios registrados:** Al pulsar el botón *"Añadir reseña"* (`#btn-open-review`), el script verifica la existencia de una sesión activa en `sessionStorage.getItem("usuario")`.
* **Flujo de redirección:** Si el visitante no ha iniciado sesión, se le informa mediante un aviso y se abre automáticamente el modal de autenticación (`#login-modal`). Si está autenticado, se reinicia el formulario y se despliega `#review-modal`.
* **Identificación automática del autor:** Al enviar una reseña, el sistema extrae el nombre de usuario a partir del correo electrónico almacenado en la sesión (`usuario.email.split('@')[0]`), utilizando `"Anónimo"` como valor de respaldo.

### 3.2. Carga Asíncrona, Filtrado y Renderizado
* **Petición `GET /api/resenas` (`cargarReseñas()`):** Al inicializar la página, se solicita el listado completo de reseñas al servidor mostrando un estado de carga (*"Cargando opiniones..."*) y gestionando posibles fallos de red.
* **Filtrado y ordenación cronológica (`pintarReseñas()`):**
  * Filtra el arreglo `reseñasData` según la pestaña activa (`>= 4` estrellas para positivas, `<= 3` estrellas para críticas).
  * Ordena los resultados de forma descendente por fecha (`new Date(b.fecha) - new Date(a.fecha)`) para mostrar primero las experiencias más recientes.
  * Formatea las fechas al estándar local español (`es-ES`: día, mes abreviado y año).
* **Generación dinámica de estrellas (`generarEstrellas()`):** Construye visualmente las 5 estrellas aplicando las variables CSS del sistema de diseño (`var(--primary)` para estrellas activas y `var(--muted)` para inactivas) y renderiza cada opinión dentro de una tarjeta semántica `<figure class="review">`.

### 3.3. Envío de Nuevas Reseñas (`POST /api/resenas`)
* **Validación en cliente:** Antes de enviar la petición, comprueba que el usuario haya seleccionado una puntuación en estrellas (`#review-rating`); en caso contrario, muestra un mensaje en `#review-error`.
* **Actualización en tiempo real:** Envía el objeto JSON (`{ nombre, estrellas, comentario }`) mediante `fetch` con método `POST`. Tras recibir confirmación exitosa (`res.ok`), cierra el modal, notifica al usuario y ejecuta `await cargarReseñas()` para reflejar la nueva opinión al instante en pantalla.

---

## 4. API Serverless y Persistencia en Base de Datos (`api/resenas.js`)

### 4.1. Infraestructura y Seguridad
* **Entorno Serverless y conexión a Neon:** El endpoint está implementado como función *serverless* en Vercel utilizando el cliente `@neondatabase/serverless` conectado a través de la variable de entorno `process.env.DATABASE_URL`.
* **Configuración CORS:** Define cabeceras `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` (`GET, POST, OPTIONS`) y `Access-Control-Allow-Headers` (`Content-Type`), respondiendo con estado `200` a las peticiones *preflight* `OPTIONS`.
* **Prevención de Inyección SQL:** Todas las consultas emplean *tagged template literals* del driver de Neon (`sql\`...\``), garantizando la parametrización automática de los datos introducidos por los usuarios.

### 4.2. Operaciones Implementadas
* **Consulta de opiniones (`GET`):** Ejecuta `SELECT * FROM resenas ORDER BY fecha DESC` y devuelve el listado en formato JSON con código HTTP `200`.
* **Registro de opiniones (`POST`):**
  1. Valida la presencia de los campos obligatorios (`nombre`, `estrellas`, `comentario`), devolviendo `400 Bad Request` si falta alguno.
  2. Inserta el registro en la tabla `resenas` (`INSERT INTO resenas (nombre, estrellas, comentario) VALUES (...) RETURNING *`) y retorna el objeto creado con código HTTP `201 Created`.
* **Control de errores:** Gestiona métodos HTTP no soportados (`405 Method Not Allowed`) y excepciones de conexión o consulta en base de datos (`500 Internal Server Error`).

---

## 5. Resumen Técnico por Capa

| Capa | Archivo | Tecnologías / APIs | Función principal |
| :--- | :--- | :--- | :--- |
| **Estructura UI** | `index.html` | HTML5, `<dialog>`, ARIA Tabs | Sección `#resenas`, filtros por puntuación y modal de valoración. |
| **Lógica Frontend** | `js/index.js` | Fetch API, `sessionStorage`, DOM | Control de sesión, selector interactivo de estrellas, filtrado y renderizado. |
| **Backend API** | `api/resenas.js` | Vercel Functions, Node.js, CORS | Endpoints REST `GET` y `POST` con validación de entrada y control de errores. |
| **Base de Datos** | PostgreSQL (Neon) | `@neondatabase/serverless`, SQL | Almacenamiento persistente de autores, puntuaciones, comentarios y fechas. |