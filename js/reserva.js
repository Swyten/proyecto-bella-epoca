/* Bella Época — Asistente de reserva (sin envío de datos a ningún servidor). */
(() => {
  "use strict";

    // Control de dirección de la transición entre páginas
  if (sessionStorage.getItem("animacion-volver") === "true") {
    document.documentElement.classList.add("is-back-transition");
    sessionStorage.removeItem("animacion-volver");
  }

  document.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      // Si el enlace apunta al index, activa la animación de regreso
      if (enlace.getAttribute("href")?.includes("index.html")) {
        document.documentElement.classList.add("is-back-transition");
        sessionStorage.setItem("animacion-volver", "true");
      } else {
        document.documentElement.classList.remove("is-back-transition");
      }
    });
  });
  
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
