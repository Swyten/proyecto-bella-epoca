/* Bella Época — Asistente de reserva (sin envío de datos a ningún servidor). */
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
  
  const form = document.getElementById("booking-form");
  if (!form) return;

  const panels = form.querySelectorAll("[data-step]");
  const labels = form.querySelectorAll("[data-step-label]");
  const radios = form.querySelectorAll('input[name="mesa"]');
  const next = document.getElementById("btn-next");
  const back = document.getElementById("btn-back");
  const submit = document.getElementById("btn-submit");
  const nombre = document.getElementById("nombre");
  const nombreError = document.getElementById("nombre-error");
  const mesaError = document.getElementById("mesa-error");

  const selected = () => form.querySelector('input[name="mesa"]:checked');
  const validName = () => nombre.value.trim().length >= 2;

  function goTo(step) {
    panels.forEach((p) => (p.hidden = p.dataset.step !== String(step)));
    labels.forEach((l) => {
      const n = Number(l.dataset.stepLabel);
      if (n === step) l.setAttribute("aria-current", "step");
      else l.removeAttribute("aria-current");
      l.classList.toggle("is-done", n < step);
    });
    const panel = form.querySelector(`[data-step="${step}"]`);
    const focusable = step === 2 ? nombre : panel;
    focusable?.focus();
  }

  // Selección de mesa: toda la fila es clicable.
  radios.forEach((radio) => {
    const row = radio.closest("tr");
    row.classList.add(radio.disabled ? "is-disabled" : "is-selectable");
    row.addEventListener("click", () => {
      if (radio.disabled) return;
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    });
    radio.addEventListener("change", () => {
      radios.forEach((r) => r.closest("tr").classList.toggle("is-selected", r.checked));
      next.disabled = !selected();
      mesaError.hidden = true;
    });
  });

  next.addEventListener("click", () => {
    const mesa = selected();
    if (!mesa) {
      mesaError.hidden = false;
      return;
    }
    document.getElementById("summary-mesa").textContent = mesa.value;
    goTo(2);
  });

  back.addEventListener("click", () => goTo(1));

  // Sin nombre no se puede reservar.
  nombre.addEventListener("input", () => {
    submit.disabled = !validName();
    if (validName()) {
      nombre.removeAttribute("aria-invalid");
      nombreError.hidden = true;
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selected()) return goTo(1);
    if (!validName()) {
      nombre.setAttribute("aria-invalid", "true");
      nombreError.hidden = false;
      nombre.focus();
      return;
    }
    document.getElementById("confirm-text").textContent =
      `${nombre.value.trim()}, hemos registrado tu solicitud para ${selected().value}. ` +
      "Esta es una demostración: la reserva aún no se envía a Bella Época.";
    goTo(3);
  });
})();
