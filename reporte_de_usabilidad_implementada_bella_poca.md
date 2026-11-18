# Informe de Usabilidad Implementada — Discoteca Bella Época

Este documento recoge de forma exhaustiva **todas las funcionalidades, mecanismos de interacción, controles de prevención de errores, pautas de accesibilidad y decisiones visuales de usabilidad que ya se encuentran implementadas** en el código actual de **Discoteca Bella Época** (`eventos_2.js`, `reserva_2.js`, `index_3.js`, `galeria_2.js` y el sistema de diseño *Lujo Nocturno*).

---

## 1. Resumen Ejecutivo por Módulos

| Módulo / Archivo | Funcionalidades de usabilidad ya implementadas | Principios / Leyes cubiertos |
| :--- | :--- | :--- |
| **Agenda y Entradas** (`eventos_2.js`) | Clasificación temporal automática (`Esta semana`, `Próximamente`, `Pasados`), contador de eventos, deep-linking por hash, tarjetas comparativas `General` vs. `VIP`, modal de compra en 2 pasos, selector de cantidad acotado (`1` a `10`), recálculo en tiempo real, validación continua y adaptación para administradores. | Ley de Hick, Ley de Proximidad, Prevención de errores, Reconocimiento vs. recuerdo, Visibilidad del estado. |
| **Reservas de Mesas** (`reserva_2.js`) | Asistente paso a paso (*Wizard* de 3 pasos con barra de progreso), acotación de fechas (`hoy` a `+1 mes`), bloqueo de días cerrados (L–X), selección por fila completa en tabla, deshabilitación de mesas ocupadas, revelación progresiva para cumpleaños, resumen contextual y vista operativa para empleados. | Ley de Fitts, Simplicidad, Prevención de errores, Flexibilidad y eficiencia de uso. |
| **Portada, Auth y Reseñas** (`index_3.js`) | Menú móvil accesible (`aria-expanded`, `Escape`, clic exterior), pestañas ARIA con navegación por teclado (`ArrowLeft`/`Right`, `Home`/`End`), login/registro en 2 pasos con verificación OTP, Google OAuth, guardia de sesión para reservas y sistema de reseñas con filtro por estrellas y valoración visual interactiva. | Control y libertad del usuario, Consistencia y estándares, Retroalimentación inmediata. |
| **Galería Fotográfica** (`galeria_2.js`) | Filtrado instantáneo por categorías (`Todas`, `Sala`, `Reservados`, `Música`), contador de resultados, visor modal `<dialog>` con navegación circular por botones y flechas de teclado, cierre multimodal y restauración de foco. | Control y libertad del usuario, Minimalismo, Rendimiento visual (prevención de CLS). |
| **Sistema Visual y CSS** (*Guía de Estilos*) | Contraste WCAG 2.1 **AAA**, objetivos táctiles de `$44 \times 44\text{ px}$`, foco visible de alto contraste (`#D4A843`), ancho de lectura controlado (`65ch`), enlace `skip-link` y soporte `prefers-reduced-motion`. | Ley de Fitts, Jerarquía visual, Accesibilidad universal. |

---

## 2. Desglose Detallado de Implementaciones por Área

### 2.1. Agenda de Eventos y Compra de Entradas (`eventos_2.js`)

En el módulo de agenda y venta de entradas ya tienes implementadas las siguientes soluciones de usabilidad:

1. **Clasificación temporal automática y carga cognitiva reducida (`estado()` y `pintar()`):**
   * El sistema clasifica automáticamente cada evento respecto a `Date.now()` en tres pestañas claras: **Esta semana** (`actuales`, inicio $\le 7$ días), **Próximamente** (`proximos`) y **Pasados** (`pasados`), ordenando los pasados de forma inversa (`lista.reverse()`) para mostrar primero los más recientes.
   * **Sincronización con la URL (`location.hash`):** Permite enlazar directamente a una pestaña concreta (por ejemplo, `#proximos` o `#pasados`) manteniendo coherencia con el historial de navegación.
   * **Visibilidad de resultados:** Actualiza dinámicamente el contador (`#agenda-count`: *"1 evento"* / *"X eventos"*) y muestra un estado vacío claro (*"No hay eventos en esta sección."*) cuando una categoría no tiene programación.

2. **Claridad informativa y comparación directa (`tarjeta()`):**
   * **Localización de datos:** Usa `Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })` e `Intl.DateTimeFormat("es-ES", ...)` para presentar precios y fechas en el formato natural del usuario.
   * **Reconocimiento en lugar de recuerdo:** Cada tarjeta muestra lado a lado las modalidades **General** y **VIP** con sus ventajas explícitas (`VENTAJAS.general` y `VENTAJAS.vip`), evitando que el usuario tenga que buscar qué incluye cada entrada.
   * **Estados visuales inequívocos:** Distingue mediante etiquetas (`eyebrow`) y estilos si un evento es *"Evento pasado"* (con clase `.agenda-card--past` y botón deshabilitado *"Finalizado"*), *"Ahora en curso"* o futuro.

3. **Modal de compra guiado en 2 pasos (`#ticket-dialog`):**
   * **Paso 1 (Configuración y datos):** Precarga automáticamente el tipo de entrada, título del evento, fecha y precio unitario.
   * **Control de cantidad seguro:** Los botones `[data-qty]` acotan la selección mediante `Math.min(MAX, Math.max(1, cantidad + ...))` entre `$1$` y `$10$` entradas, recalculando el importe total (`#ticket-total`) en cada pulsación.
   * **Prevención de errores en formulario (`actualizar()`):** El botón `#ticket-submit` permanece deshabilitado (`disabled`) hasta que el nombre tiene más de 1 carácter y el correo electrónico supera `checkValidity()`.
   * **Paso 2 (Confirmación y retorno de foco):** Muestra un resumen completo con nombre del comprador, número de entradas, tipo, evento, importe total y correo de envío. Al cerrar el `<dialog>`, devuelve el foco al botón que inició la compra (`dialog.addEventListener("close", () => opener?.focus())`).

4. **Feedback de red (`cargarEventos()`):**
   * Muestra *"Cargando agenda de eventos..."* mientras se resuelve `fetch('/api/eventos')` y captura errores de red mostrando *"No se ha podido conectar con la agenda."* junto con el contador a `0 eventos`.

---

### 2.2. Asistente de Reserva de Mesas (`reserva_2.js`)

1. **Asistente secuencial (*Wizard*) con orientación constante (`goTo(step)`):**
   * Divide la reserva en **3 pasos claros**: *1. Fecha y Mesa*, *2. Tus datos* y *3. Confirmación*.
   * Actualiza los indicadores visuales y semánticos del progreso (`aria-current="step"` en el paso activo y clase `.is-done` en los pasos completados) y traslada automáticamente el foco al campo principal del nuevo paso (`focusable?.focus()`).

2. **Prevención de errores y reglas de negocio integradas:**
   * **Acotación de calendario:** Configura `fechaInput.min` al día actual y `fechaInput.max` a un mes vista, impidiendo seleccionar fechas pasadas o fuera de ventana de reserva.
   * **Validación de días de apertura:** Bloquea los lunes, martes y miércoles (`diaSemana === 1 || 2 || 3`), informando de que la sala abre de jueves a domingo.
   * **Protección frente a doble reserva:** Las mesas no disponibles se renderizan con atributo `disabled` en su `<input type="radio">`, clase `.is-disabled` y etiqueta de estado `Ocupada`.

3. **Ergonomía en la selección de tabla (`configurarEventosTabla()`):**
   * **Área clicable ampliada (Ley de Fitts):** Al pulsar en cualquier punto de la fila `<tr>` de una mesa disponible, se marca su radio button asociado, se aplica la clase visual `.is-selected` y se habilita el botón `#btn-next`.
   * **Revelación progresiva:** El bloque `#capa-cumpleanero` y su obligatoriedad (`nombreCumpleanero.required = true`) permanecen ocultos y solo se despliegan si el usuario elige *"Cumpleaños"* en `#tipo-reserva`.

4. **Continuidad de contexto y validación en tiempo real:**
   * En el paso 2 se recuerda la elección previa mediante `#summary-mesa` (*"Mesa X (para el YYYY-MM-DD)"*).
   * El campo `#nombre` se valida en tiempo real (`validName()`), gestionando `aria-invalid="true"` y `#nombre-error` y manteniendo `#btn-submit` bloqueado hasta que el nombre es válido.

5. **Adaptación de interfaz según rol (`esEmpleado`):**
   * Si el usuario autenticado es `empleado` o `administrador`, la misma ruta adapta su título, oculta los pasos de compra de cliente y despliega una tabla operativa en tiempo real con columnas de **Estado** y **Detalles Reserva** (titular, tipo de evento y nombre del homenajeado).

---

### 2.3. Navegación, Autenticación y Reseñas (`index_3.js` y `galeria_2.js`)

1. **Navegación principal responsive y accesible:**
   * **Menú móvil (`menu-toggle`):** Gestiona `aria-expanded`, se cierra automáticamente al pulsar un enlace, al presionar la tecla `Escape` (devolviendo el foco al botón hamburguesa), al hacer clic fuera de `.site-header` o al redimensionar la ventana a escritorio (`matchMedia("(min-width: 769px)")`).
   * **Menú de perfil de usuario (`#user-profile-wrapper`):** Muestra el alias extraído del correo, despliega el email completo y el botón de cierre de sesión con `aria-expanded`, y se cierra al pulsar fuera del contenedor.
   * **Acceso contextual por rol:** En `eventos_2.js` y `galeria_2.js`, se inyecta dinámicamente el enlace **Gestión de Mesas** en la barra de navegación únicamente cuando el usuario tiene rol `empleado` o `administrador`.

2. **Sistema de pestañas ARIA con navegación por teclado (`activateTab()`):**
   * Implementa el patrón oficial WAI-ARIA Tabs: sincroniza `aria-selected`, gestiona el *roving tabindex* (`tabIndex = 0` en la pestaña activa y `-1` en las inactivas) y permite desplazarse entre pestañas con `ArrowRight`, `ArrowLeft`, `Home` y `End`.

3. **Autenticación fluida en 2 pasos (`#login-modal`):**
   * Permite alternar entre inicio de sesión tradicional, inicio con **Google OAuth 2.0** y registro de nueva cuenta.
   * Tras registrar un usuario, transiciona sin recargar la página del paso 1 (`#auth-step-1`) al paso 2 de verificación por código OTP de 6 dígitos (`#auth-step-2`), mostrando el correo destino (`#verify-email-target`), enfocando automáticamente `#verify-code` y ofreciendo un botón para volver atrás (`#btn-back-to-login`).

4. **Galería fotográfica y visor modal (`galeria_2.js` e `index_3.js`):**
   * **Visor Lightbox nativo (`<dialog id="gallery-dialog">`):** Soporta navegación circular infinita (`(index + length) % length`) mediante botones anterior/siguiente y teclas `ArrowLeft` / `ArrowRight`, muestra contador de posición (*"Pie de foto — 2 / 12"*) y se cierra con botón `[data-dialog-close]`, tecla `Escape` o clic fuera de la caja del diálogo (`getBoundingClientRect()`).
   * **Rendimiento y estabilidad visual:** Todas las imágenes declaran `width="1536" height="1024"`, `loading="lazy"` y `decoding="async"`, evitando desplazamientos de diseño (*CLS*) durante la carga.

5. **Sistema de reseñas verificadas (`#resenas`):**
   * Carga asíncrona con indicador (*"Cargando opiniones..."*), filtrado por valoración (*Todas*, *Positivas 4–5*, *Críticas 1–3*), ordenación cronológica descendente, selector visual interactivo de 5 estrellas (`#star-rating`) y recarga automática tras publicar una nueva opinión.

---

### 2.4. Sistema de Diseño, Contraste y Accesibilidad Global (CSS / UI)

A nivel transversal, toda la interfaz aplica las siguientes garantías de usabilidad y accesibilidad:

* **Contraste cromático WCAG 2.1 Nivel AAA:**
  * Blanco puro (`#FFFFFF`) sobre negro (`#000000`): ratio `$21:1$`.
  * Blanco hueso (`#F5F5F5`) sobre negro (`#000000`): ratio `$19.26:1$` (y `$17.18:1$` sobre ónix `#141414`).
  * Dorado de marca (`#D4A843`) sobre negro (`#000000`): ratio `$9.48:1$`.
  * Gris neutro (`#A3A3A3`) sobre negro (`#000000`): ratio `$8.33:1$`.
  * Amatista VIP (`#6B2FA0`) con texto blanco (`#FFFFFF`): ratio `$8.27:1$`.
* **Objetivos táctiles ergonómicos (Ley de Fitts):** Todos los botones, campos de formulario, pestañas de filtro y botones icono (`.btn--icon`) respetan una dimensión mínima de `$44 \times 44\text{ px}$`.
* **Legibilidad y jerarquía:** Cuerpo de texto a `$15\text{ px}$` con interlineado `1.7` y ancho máximo de `65ch`, complementado con encabezados en *Instrument Serif* (`50px` en escritorio / `40px` en móvil).
* **Navegación asistiva:** Enlace de salto al contenido principal (`.skip-link`), contorno de foco visible de alto contraste (`2px solid #D4A843` con `outline-offset: 4px`) y respeto a la preferencia del sistema `prefers-reduced-motion`.