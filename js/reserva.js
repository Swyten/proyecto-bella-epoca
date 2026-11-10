/* Bella Época — Asistente y Panel de Control de Reservas */
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

    const sesionGuardada = sessionStorage.getItem("usuario");

    if (sesionGuardada && userWrapper) {
      const usuario = JSON.parse(sesionGuardada);
      if (btnOpenLogin) btnOpenLogin.hidden = true;
      userWrapper.hidden = false;

      if (userNameLabel) userNameLabel.textContent = usuario.email.split('@')[0];
      if (userEmailInfo) userEmailInfo.textContent = usuario.email;

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

  // --- PROTECCIÓN DE ACCESO: REQUERIR SESIÓN ---
  const sesionGuardada = sessionStorage.getItem("usuario");
  if (!sesionGuardada) {
    alert("Debes iniciar sesión para acceder al sistema de reservas.");
    window.location.href = "../index.html";
    return;
  }

  // --- CONTROL DE SESIÓN EN LA CABECERA ---
  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const userWrapper = document.getElementById("user-profile-wrapper");
    const btnUserProfile = document.getElementById("btn-user-profile");
    const userNameLabel = document.getElementById("user-name-label");
    const userEmailInfo = document.getElementById("user-email-info");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const btnLogout = document.getElementById("btn-logout");

    const usuario = JSON.parse(sesionGuardada);
    if (btnOpenLogin) btnOpenLogin.hidden = true;
    if (userWrapper) userWrapper.hidden = false;

    if (userNameLabel) userNameLabel.textContent = usuario.email.split('@')[0];
    if (userEmailInfo) userEmailInfo.textContent = usuario.email;

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
  });

  // Transiciones de página
  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("animacion-volver") === "true") {
      document.body.style.animation = "slide-in-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
      sessionStorage.removeItem("animacion-volver");
    } else {
      document.body.style.animation = "slide-in-right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
    }
  });

  const form = document.getElementById("booking-form");
  if (!form) return;

  const tbody = document.getElementById("tabla-mesas");
  const thead = form.querySelector(".data-table thead tr");
  const wizardSteps = form.querySelector(".wizard-steps");
  const panels = form.querySelectorAll("[data-step]");
  const labels = form.querySelectorAll("[data-step-label]");
  const next = document.getElementById("btn-next");
  const back = document.getElementById("btn-back");
  const submit = document.getElementById("btn-submit");
  const nombre = document.getElementById("nombre");
  const nombreError = document.getElementById("nombre-error");
  const mesaError = document.getElementById("mesa-error");

  // Detección de Rol
  const sesion = JSON.parse(sesionGuardada || "{}");
  const esEmpleado = sesion.rol === 'empleado' || sesion.rol === 'administrador';

  // Configuración de vista según el rol
  if (esEmpleado) {
    document.getElementById("reserva-title").textContent = "Control y Gestión de Mesas";
    const introCopy = form.closest(".container").querySelector(".body-copy");
    if (introCopy) introCopy.textContent = "Panel de control en tiempo real del estado de los reservados y asignación de clientes.";

    if (wizardSteps) wizardSteps.style.display = "none";
    const wizardActions = form.querySelector('[data-step="1"] .wizard-actions');
    if (wizardActions) wizardActions.style.display = "none";

    if (thead) {
      thead.innerHTML = `
        <th scope="col">Mesa</th>
        <th scope="col">Zona</th>
        <th scope="col">Capacidad</th>
        <th scope="col">Consumo mín.</th>
        <th scope="col">Estado</th>
        <th scope="col">Cliente / Reserva</th>
      `;
    }
  }

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

  // Carga de datos desde Neon
  async function cargarMesas() {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Cargando estado de las mesas...</td></tr>';
    
    try {
      const respuesta = await fetch('/api/reservasMesas');
      const mesas = await respuesta.json();
      tbody.innerHTML = "";

      mesas.forEach((mesa) => {
        let claseEstado = "status--available";
        if (!mesa.disponible) claseEstado = "status--reserved";
        else if (mesa.estado.toLowerCase().includes("últimas")) claseEstado = "status--limited";

        const tr = document.createElement("tr");

        if (esEmpleado) {
          const clienteInfo = mesa.disponible 
            ? '<span style="opacity: 0.6; font-style: italic;">Sin reserva</span>'
            : `<strong style="color: #d4af37;">${mesa.cliente_nombre || 'Cliente asignado'}</strong>`;

          tr.innerHTML = `
            <td><strong>${mesa.nombre}</strong></td>
            <td>${mesa.zona}</td>
            <td>${mesa.capacidad} pers.</td>
            <td class="data-table__price">${mesa.consumo_minimo}</td>
            <td><span class="status ${claseEstado}">${mesa.disponible ? 'Disponible' : 'Reservada'}</span></td>
            <td>${clienteInfo}</td>
          `;
        } else {
          const disabledAttr = mesa.disponible ? "" : "disabled";
          tr.className = mesa.disponible ? "is-selectable" : "is-disabled";
          tr.innerHTML = `
            <td><input type="radio" name="mesa" value="${mesa.nombre}" id="m${mesa.id}" data-zona="${mesa.zona}" ${disabledAttr} /></td>
            <td><label for="m${mesa.id}">${mesa.nombre}</label></td>
            <td>${mesa.zona}</td>
            <td>${mesa.capacidad}</td>
            <td class="data-table__price">${mesa.consumo_minimo}</td>
            <td><span class="status ${claseEstado}">${mesa.estado}</span></td>
          `;
        }

        tbody.appendChild(tr);
      });

      if (!esEmpleado) {
        configurarEventosTabla();
      }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="form-error">Error de conexión al cargar la lista de mesas.</td></tr>';
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
        if (next) next.disabled = !selected();
        if (mesaError) mesaError.hidden = true;
      });
    });
  }

  if (!esEmpleado) {
    next?.addEventListener("click", () => {
      const mesa = selected();
      if (!mesa) {
        if (mesaError) mesaError.hidden = false;
        return;
      }
      document.getElementById("summary-mesa").textContent = mesa.value;
      goTo(2);
    });

    back?.addEventListener("click", () => goTo(1));

    nombre?.addEventListener("input", () => {
      if (submit) submit.disabled = !validName();
      if (validName()) {
        nombre.removeAttribute("aria-invalid");
        if (nombreError) nombreError.hidden = true;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!selected()) return goTo(1);
      if (!validName()) {
        nombre.setAttribute("aria-invalid", "true");
        if (nombreError) nombreError.hidden = false;
        nombre.focus();
        return;
      }

      const payload = {
        mesa: selected().value,
        nombre: nombre.value.trim(),
        user_id: sesion.id || null
      };

      try {
        const res = await fetch('/api/crearReserva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          document.getElementById("confirm-text").textContent =
            `${nombre.value.trim()}, tu reserva para ${selected().value} ha sido confirmada correctamente.`;
          goTo(3);
        }
      } catch (err) {
        alert("Error al procesar la reserva. Inténtalo de nuevo.");
      }
    });
  }

  cargarMesas();
})();