/* Bella Época — Agenda de eventos dinámica */
(() => {
  "use strict";

  // =========================================================================
  // 1. GESTIÓN DE SESIÓN, PERFIL DE USUARIO Y ACCESO DE ADMINISTRACIÓN
  // =========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const userWrapper = document.getElementById("user-profile-wrapper");
    const btnUserProfile = document.getElementById("btn-user-profile");
    const userNameLabel = document.getElementById("user-name-label");
    const userEmailInfo = document.getElementById("user-email-info");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const btnLogout = document.getElementById("btn-logout");
    const nav = document.getElementById("site-nav");

    const sesionGuardada = sessionStorage.getItem("usuario");

    if (sesionGuardada && userWrapper) {
      const usuario = JSON.parse(sesionGuardada);
      if (btnOpenLogin) btnOpenLogin.hidden = true;
      userWrapper.hidden = false;

      if (userNameLabel) userNameLabel.textContent = usuario.email.split('@')[0];
      if (userEmailInfo) userEmailInfo.textContent = usuario.email;

      // Si es administrador o empleado, añade el enlace de "Gestión de Mesas" heredando estilos de .site-nav
      if (usuario.rol === 'empleado' || usuario.rol === 'administrador') {
        const enlaceGestion = document.createElement("a");
        enlaceGestion.href = "gestion-mesas.html";
        enlaceGestion.textContent = "Gestión de Mesas";
        nav.insertBefore(enlaceGestion, userWrapper);
      }

      // Alterna visibilidad del menú desplegable del perfil
      btnUserProfile?.addEventListener("click", (e) => {
        e.stopPropagation();
        const estaAbierto = !userDropdownMenu.hidden;
        userDropdownMenu.hidden = estaAbierto;
        btnUserProfile.setAttribute("aria-expanded", String(!estaAbierto));
      });

      // Cierra el desplegable al pulsar fuera del contenedor
      document.addEventListener("click", (e) => {
        if (userWrapper && !userWrapper.contains(e.target)) {
          if (userDropdownMenu) userDropdownMenu.hidden = true;
          btnUserProfile?.setAttribute("aria-expanded", "false");
        }
      });

      // Cierra la sesión y redirige a la portada
      btnLogout?.addEventListener("click", () => {
        sessionStorage.removeItem("usuario");
        window.location.href = "../index.html";
      });
    } else {
      if (btnOpenLogin) {
        btnOpenLogin.hidden = false;
        btnOpenLogin.addEventListener("click", () => {
          window.location.href = "../index.html";
        });
      }
      if (userWrapper) userWrapper.hidden = true;
    }
  });

  // =========================================================================
  // 2. CONSTANTES, FORMATEADORES Y CLASIFICACIÓN TEMPORAL DE EVENTOS
  // =========================================================================

  /** Listado de eventos cargados desde la API */
  let EVENTOS = [];

  /** Descripción de beneficios incluidos según modalidad de entrada */
  const VENTAJAS = {
    general: "Acceso a la sala principal.",
    vip: "Acceso prioritario, zona reservada y copa de bienvenida.",
  };

  /** Duración de 7 días en milisegundos para delimitar la pestaña "Esta semana" */
  const SEMANA = 7 * 24 * 60 * 60 * 1000;

  /** Formateadores locales para moneda (EUR) y fecha/hora en español */
  const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const fecha = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  /**
   * Clasifica un evento según su fecha de inicio y fin respecto al momento actual.
   * @param {{inicio: string, fin: string}} ev - Objeto del evento.
   * @param {number} [ahora=Date.now()] - Marca temporal de referencia en milisegundos.
   * @returns {"pasados"|"actuales"|"proximos"} Categoría temporal del evento.
   */
  function estado(ev, ahora = Date.now()) {
    const ini = new Date(ev.inicio).getTime();
    const fin = new Date(ev.fin).getTime();
    if (fin < ahora) return "pasados";
    if (ini - ahora <= SEMANA) return "actuales";
    return "proximos";
  }

  // =========================================================================
  // 3. RENDERIZADO DE TARJETAS Y FILTRADO DE LA AGENDA
  // =========================================================================
  const panel = document.getElementById("agenda-panel");
  const count = document.getElementById("agenda-count");
  const tabs = document.querySelectorAll("[data-filter]");
  if (!panel) return;

  const sesion = JSON.parse(sessionStorage.getItem("usuario") || "{}");
  /** Indica si el usuario autenticado posee permisos de gestión de eventos */
  const esAdmin = sesion.rol === 'empleado' || sesion.rol === 'administrador';

  /**
   * Genera el marcado HTML de una tarjeta de evento con opciones de compra
   * y controles de administración si corresponde.
   * @param {Object} ev - Datos del evento.
   * @param {number} i - Índice del evento en el array `EVENTOS`.
   * @param {string} tipo - Filtro activo ("actuales", "proximos", "pasados").
   * @returns {string} HTML de la tarjeta `<article class="agenda-card">`.
   */
  function tarjeta(ev, i, tipo) {
    const pasado = tipo === "pasados";
    const enCurso = !pasado && new Date(ev.inicio).getTime() <= Date.now();
    const boton = (clase, nivel, texto) =>
      pasado
        ? `<button class="btn ${clase} btn--small" type="button" disabled>Finalizado</button>`
        : `<button class="btn ${clase} btn--small" type="button" data-buy="${i}" data-level="${nivel}">${texto}</button>`;
    
    const precioGeneral = Number(ev.general);
    const precioVip = Number(ev.vip);

    const controlesAdmin = esAdmin ? `
      <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border);">
        <button class="btn btn--outline btn--small" onclick="editarEvento(${ev.id})">Editar</button>
        <button class="btn btn--outline btn--small" onclick="borrarEvento(${ev.id})">Eliminar</button>
      </div>
    ` : '';

    return `
      <article class="agenda-card${pasado ? " agenda-card--past" : ""}">
        <div class="agenda-card__media">
          <img src="${ev.img}" alt="" loading="lazy" decoding="async" width="1536" height="1024" />
        </div>
        <div class="agenda-card__body">
          <p class="eyebrow">${pasado ? "Evento pasado" : enCurso ? "Ahora en curso" : tipo === "actuales" ? "Esta semana" : "Próximamente"}</p>
          <h2>${ev.titulo}</h2>
          <p class="body-copy">${ev.descripcion}</p>
          <dl class="agenda-card__meta">
            <div><dt>Fecha</dt><dd>${fecha.format(new Date(ev.inicio))}</dd></div>
            <div><dt>Artista</dt><dd>${ev.artista}</dd></div>
          </dl>
          <div class="ticket-options">
            <div class="ticket-option">
              <span class="eyebrow">General</span>
              <span class="ticket-option__price">${euros.format(precioGeneral)}</span>
              <p class="ticket-option__perks">${VENTAJAS.general}</p>
              ${boton("btn--outline", "general", "Comprar General")}
            </div>
            <div class="ticket-option ticket-option--vip">
              <span class="eyebrow">VIP</span>
              <span class="ticket-option__price">${euros.format(precioVip)}</span>
              <p class="ticket-option__perks">${VENTAJAS.vip}</p>
              ${boton("btn--vip", "vip", "Comprar VIP")}
            </div>
          </div>
        </div>
        ${controlesAdmin}
      </article>`;
  }

  /**
   * Filtra los eventos según la pestaña elegida, actualiza el panel principal,
   * el contador de eventos y los atributos ARIA de accesibilidad.
   * @param {string} filtro - Pestaña seleccionada ("actuales", "proximos", "pasados").
   */
  function pintar(filtro) {
    const lista = EVENTOS.map((ev, i) => ({ ev, i })).filter(({ ev }) => estado(ev) === filtro);
    if (filtro === "pasados") lista.reverse();
    panel.innerHTML = lista.length
      ? lista.map(({ ev, i }) => tarjeta(ev, i, filtro)).join("")
      : `<p class="agenda-empty">No hay eventos en esta sección.</p>`;
    count.textContent = `${lista.length} ${lista.length === 1 ? "evento" : "eventos"}`;
    tabs.forEach((t) => {
      const activo = t.dataset.filter === filtro;
      t.setAttribute("aria-selected", String(activo));
      if (activo) panel.setAttribute("aria-labelledby", t.id);
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => pintar(t.dataset.filter)));

  // =========================================================================
  // 4. MODAL INTERACTIVO DE COMPRA DE ENTRADAS
  // =========================================================================
  const dialog = document.getElementById("ticket-dialog");
  const form = document.getElementById("ticket-form");
  const $ = (id) => document.getElementById(id);

  /** Límite máximo de entradas por operación */
  const MAX = 10;
  /** Datos del evento y tarifa seleccionados para la compra en curso */
  let actual = null;
  /** Cantidad de entradas seleccionada */
  let cantidad = 1;
  /** Botón que abrió el diálogo para restaurar el foco al cerrar */
  let opener = null;

  /**
   * Alterna entre el paso 1 (selección y formulario) y el paso 2 (confirmación) del modal.
   * @param {number} n - Número de paso visible (1 o 2).
   */
  function paso(n) {
    form.querySelectorAll("[data-ticket-step]").forEach((p) => (p.hidden = p.dataset.ticketStep !== String(n)));
  }
  
  /**
   * Recalcula el importe total según la cantidad y habilita el envío solo
   * cuando el nombre y el correo electrónico son válidos.
   */
  function actualizar() {
    $("ticket-qty").textContent = cantidad;
    $("ticket-total").textContent = euros.format(cantidad * actual.precio);
    const valido = $("ticket-name").value.trim().length > 1 && $("ticket-email").checkValidity() && $("ticket-email").value;
    $("ticket-submit").disabled = !valido;
  }

  // Abre el modal de compra precargando los datos del evento y modalidad elegidos
  panel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-buy]");
    if (!btn || !(dialog instanceof HTMLDialogElement)) return;
    const ev = EVENTOS[Number(btn.dataset.buy)];
    const nivel = btn.dataset.level;
    actual = { ev, nivel, precio: Number(ev[nivel]) };
    cantidad = 1;
    opener = btn;
    form.reset();
    $("ticket-error").hidden = true;
    $("ticket-type").textContent = nivel === "vip" ? "Entrada VIP" : "Entrada General";
    $("ticket-title").textContent = ev.titulo;
    $("ticket-date").textContent = fecha.format(new Date(ev.inicio));
    $("ticket-price").textContent = euros.format(actual.precio);
    paso(1);
    actualizar();
    dialog.showModal();
  });

  // Controles de incremento/decremento de cantidad de entradas (entre 1 y MAX)
  form.querySelectorAll("[data-qty]").forEach((b) =>
    b.addEventListener("click", () => {
      cantidad = Math.min(MAX, Math.max(1, cantidad + Number(b.dataset.qty)));
      actualizar();
    })
  );

  // Revalidación continua al escribir nombre o correo
  ["ticket-name", "ticket-email"].forEach((id) => $(id).addEventListener("input", actualizar));

  // Procesa el envío del formulario de compra y muestra el resumen de confirmación
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("ticket-submit").disabled) {
      $("ticket-error").hidden = false;
      return;
    }
    const nombre = $("ticket-name").value.trim();
    const tipo = actual.nivel === "vip" ? "VIP" : "General";
    $("ticket-confirm").textContent =
      `${nombre}, has reservado ${cantidad} ${cantidad === 1 ? "entrada" : "entradas"} ${tipo} para «${actual.ev.titulo}». Total: ${euros.format(cantidad * actual.precio)}. Te escribiremos a ${$("ticket-email").value}.`;
    paso(2);
  });

  // Cierre del diálogo de entradas y restauración de foco
  form.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
  dialog?.addEventListener("close", () => opener?.focus());

  // =========================================================================
  // 5. CARGA INICIAL DE EVENTOS DESDE LA API
  // =========================================================================

  /**
   * Descarga la programación de eventos desde `/api/eventos` y renderiza
   * la categoría indicada en el hash de la URL o "actuales" por defecto.
   * @returns {Promise<void>}
   */
  async function cargarEventos() {
    panel.innerHTML = '<p class="agenda-empty">Cargando agenda de eventos...</p>';
    try {
      const respuesta = await fetch('/api/eventos');
      EVENTOS = await respuesta.json();
      const inicial = location.hash.slice(1);
      pintar(["actuales", "proximos", "pasados"].includes(inicial) ? inicial : "actuales");
    } catch (error) {
      panel.innerHTML = '<p class="agenda-empty form-error">No se ha podido conectar con la agenda.</p>';
      count.textContent = "0 eventos";
    }
  }

  cargarEventos();
})();