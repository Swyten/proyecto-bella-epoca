(() => {
  "use strict";

    // --- TRANSICIONES INSTANTÁNEAS DE ENTRADA ---
  
  // 1. Animación fluida al cargar la página (sin esperas previas)
  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("animacion-volver") === "true") {
      document.body.style.animation = "slide-in-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
      sessionStorage.removeItem("animacion-volver");
    } else {
      document.body.style.animation = "slide-in-right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
    }
  });

  // 2. Registrar hacia dónde vamos, pero sin bloquear el salto nativo
  document.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      const href = enlace.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      
      // Guardamos el aviso para que la siguiente página sepa de dónde viene
      if (href.includes("index.html")) {
        sessionStorage.setItem("animacion-volver", "true");
      }
    });
  });
  // -----------------------------------------------

  // Datos de ejemplo: sustituir por la programación real.
  // inicio / fin en formato "AAAA-MM-DDTHH:MM". Precios en euros.
  const EVENTOS = [
    { titulo: "Noche Années Folles", inicio: "2026-09-26T23:00", fin: "2026-09-27T06:00", artista: "DJ residente", img: "../img/bella-epoca-sala.jpg", descripcion: "Un homenaje a los años veinte con swing electrónico.", general: 15, vip: 45 },
    { titulo: "Velvet Room", inicio: "2026-10-10T23:00", fin: "2026-10-11T06:00", artista: "Por confirmar", img: "../img/bella-epoca-vip.jpg", descripcion: "Sesión íntima con cócteles de autor.", general: 18, vip: 50 },
    { titulo: "Especial musical", inicio: "2026-10-24T23:00", fin: "2026-10-25T06:00", artista: "Por confirmar", img: "../img/bella-epoca-dj.jpg", descripcion: "Una noche de música en directo bajo la lámpara central.", general: 20, vip: 60 },
    { titulo: "Fiebre de ritmo", inicio: "2026-11-07T23:00", fin: "2026-11-08T06:00", artista: "Por confirmar", img: "../img/bella-epoca-sala.jpg", descripcion: "Clásicos de pista para bailar hasta el cierre.", general: 15, vip: 45 },
    { titulo: "Gala de fin de año", inicio: "2026-12-31T23:30", fin: "2027-01-01T07:00", artista: "Por confirmar", img: "../img/bella-epoca-vip.jpg", descripcion: "Recibe el año en su época más bella.", general: 40, vip: 120 },
  ];

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

  function tarjeta(ev, i, tipo) {
    const pasado = tipo === "pasados";
    const enCurso = !pasado && new Date(ev.inicio).getTime() <= Date.now();
    const boton = (clase, nivel, texto) =>
      pasado
        ? `<button class="btn ${clase} btn--small" type="button" disabled>Finalizado</button>`
        : `<button class="btn ${clase} btn--small" type="button" data-buy="${i}" data-level="${nivel}">${texto}</button>`;
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
              <span class="ticket-option__price">${euros.format(ev.general)}</span>
              <p class="ticket-option__perks">${VENTAJAS.general}</p>
              ${boton("btn--outline", "general", "Comprar General")}
            </div>
            <div class="ticket-option ticket-option--vip">
              <span class="eyebrow">VIP</span>
              <span class="ticket-option__price">${euros.format(ev.vip)}</span>
              <p class="ticket-option__perks">${VENTAJAS.vip}</p>
              ${boton("btn--vip", "vip", "Comprar VIP")}
            </div>
          </div>
        </div>
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
    actual = { ev, nivel, precio: ev[nivel] };
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

  // Abre la pestaña indicada en la URL (eventos.html#proximos) o "Esta semana".
  const inicial = location.hash.slice(1);
  pintar(["actuales", "proximos", "pasados"].includes(inicial) ? inicial : "actuales");
})();
