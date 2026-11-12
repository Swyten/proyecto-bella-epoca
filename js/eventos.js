/* Bella Época — Agenda de eventos dinámica */
(() => {
  "use strict";

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

      // Si es administrador o empleado, añadimos el enlace de "Gestión de Reservas" heredando estilos de .site-nav
      if (usuario.rol === 'empleado' || usuario.rol === 'administrador') {
        const enlaceGestion = document.createElement("a");
        enlaceGestion.href = "gestion-mesas.html";
        enlaceGestion.textContent = "Gestión de Mesas";
        nav.insertBefore(enlaceGestion, userWrapper);
      }

      btnUserProfile?.addEventListener("click", (e) => {
        e.stopPropagation();
        const estaAbierto = !userDropdownMenu.hidden;
        userDropdownMenu.hidden = estaAbierto;
        btnUserProfile.setAttribute("aria-expanded", String(!estaAbierto));
      });

      document.addEventListener("click", (e) => {
        if (userWrapper && !userWrapper.contains(e.target)) {
          if (userDropdownMenu) userDropdownMenu.hidden = true;
          btnUserProfile?.setAttribute("aria-expanded", "false");
        }
      });

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

  // --- TRANSICIONES INSTANTÁNEAS DE ENTRADA ---
  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("animacion-volver") === "true") {
      document.body.style.animation = "slide-in-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
      sessionStorage.removeItem("animacion-volver");
    } else {
      document.body.style.animation = "slide-in-right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
    }
  });

  document.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      const href = enlace.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      
      if (href.includes("index.html")) {
        sessionStorage.setItem("animacion-volver", "true");
      }
    });
  });
  // -----------------------------------------------

  let EVENTOS = [];

  const VENTAJAS = {
    general: "Acceso a la sala principal.",
    vip: "Acceso prioritario, zona reservada y copa de bienvenida.",
  };

  const SEMANA = 7 * 24 * 60 * 60 * 1000;
  const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const fecha = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  function estado(ev, ahora = Date.now()) {
    const ini = new Date(ev.inicio).getTime();
    const fin = new Date(ev.fin).getTime();
    if (fin < ahora) return "pasados";
    if (ini - ahora <= SEMANA) return "actuales";
    return "proximos";
  }

  const panel = document.getElementById("agenda-panel");
  const count = document.getElementById("agenda-count");
  const tabs = document.querySelectorAll("[data-filter]");
  if (!panel) return;

  const sesion = JSON.parse(sessionStorage.getItem("usuario") || "{}");
  const esAdmin = sesion.rol === 'empleado' || sesion.rol === 'administrador';

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

  // ---- Compra de entradas ----
  const dialog = document.getElementById("ticket-dialog");
  const form = document.getElementById("ticket-form");
  const $ = (id) => document.getElementById(id);
  const MAX = 10;
  let actual = null;
  let cantidad = 1;
  let opener = null;

  function paso(n) {
    form.querySelectorAll("[data-ticket-step]").forEach((p) => (p.hidden = p.dataset.ticketStep !== String(n)));
  }
  
  function actualizar() {
    $("ticket-qty").textContent = cantidad;
    $("ticket-total").textContent = euros.format(cantidad * actual.precio);
    const valido = $("ticket-name").value.trim().length > 1 && $("ticket-email").checkValidity() && $("ticket-email").value;
    $("ticket-submit").disabled = !valido;
  }

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

  form.querySelectorAll("[data-qty]").forEach((b) =>
    b.addEventListener("click", () => {
      cantidad = Math.min(MAX, Math.max(1, cantidad + Number(b.dataset.qty)));
      actualizar();
    })
  );
  ["ticket-name", "ticket-email"].forEach((id) => $(id).addEventListener("input", actualizar));

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

  form.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
  dialog?.addEventListener("close", () => opener?.focus());

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