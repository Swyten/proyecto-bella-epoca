/* Bella Época — Asistente de reserva. */
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

  const tbody = document.getElementById("tabla-mesas");
  const panels = form.querySelectorAll("[data-step]");
  const labels = form.querySelectorAll("[data-step-label]");
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

  // --- CARGA DINÁMICA DE BASE DE DATOS NEON ---
  async function cargarMesas() {
    if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Buscando mesas disponibles...</td></tr>';
    try {
      const respuesta = await fetch('/api/reservasMesas');
      const mesas = await respuesta.json();
      tbody.innerHTML = ""; // Limpia cualquier estado previo

      mesas.forEach((mesa) => {
        const disabledAttr = mesa.disponible ? "" : "disabled";
        
        let claseEstado = "status--available";
        if (!mesa.disponible) claseEstado = "status--reserved";
        else if (mesa.estado.toLowerCase().includes("últimas")) claseEstado = "status--limited";

        const tr = document.createElement("tr");
        tr.className = mesa.disponible ? "is-selectable" : "is-disabled";
        tr.innerHTML = `
          <td><input type="radio" name="mesa" value="${mesa.nombre}" id="m${mesa.id}" data-zona="${mesa.zona}" ${disabledAttr} /></td>
          <td><label for="m${mesa.id}">${mesa.nombre}</label></td>
          <td>${mesa.zona}</td>
          <td>${mesa.capacidad}</td>
          <td class="data-table__price">${mesa.consumo_minimo}</td>
          <td><span class="status ${claseEstado}">${mesa.estado}</span></td>
        `;
        tbody.appendChild(tr);
      });

      // Vinculamos los eventos de los radio buttons una vez se han creado
      configurarEventosTabla();
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="form-error">Error de conexión al cargar las mesas.</td></tr>';
    }
  }

  function configurarEventosTabla() {
    const radios = form.querySelectorAll('input[name="mesa"]');
    radios.forEach((radio) => {
      const row = radio.closest("tr");
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
  }

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
      `${nombre.value.trim()}, hemos registrado tu solicitud para ${selected().value}.`;
    goTo(3);
  });

  // Ejecutamos la petición inicial a la base de datos
  cargarMesas();
})();