/* Bella Época — Asistente y Panel de Control de Reservas */
(() => {
  "use strict";

  const sesionGuardada = sessionStorage.getItem("usuario");

  if (!sesionGuardada) {
    alert("Debes iniciar sesión para acceder al sistema de reservas.");
    window.location.href = "../index.html";
    return;
  }

  const sesion = JSON.parse(sesionGuardada);
  const esEmpleado = sesion.rol === 'empleado' || sesion.rol === 'administrador';

  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const userWrapper = document.getElementById("user-profile-wrapper");
    const btnUserProfile = document.getElementById("btn-user-profile");
    const userNameLabel = document.getElementById("user-name-label");
    const userEmailInfo = document.getElementById("user-email-info");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const btnLogout = document.getElementById("btn-logout");

    if (btnOpenLogin) btnOpenLogin.hidden = true;
    if (userWrapper) userWrapper.hidden = false;

    if (userNameLabel) userNameLabel.textContent = sesion.email.split('@')[0];
    if (userEmailInfo) userEmailInfo.textContent = sesion.email;

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

  const fechaInput = document.getElementById("fecha-reserva");
  const tipoReservaInput = document.getElementById("tipo-reserva");
  const capaCumpleanero = document.getElementById("capa-cumpleanero");
  const nombreCumpleanero = document.getElementById("nombre-cumpleanero");

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
        <th scope="col">Detalles Reserva</th>
      `;
    }
  }

  if (fechaInput) {
    const hoy = new Date();
    const unMesDespues = new Date();
    unMesDespues.setMonth(hoy.getMonth() + 1);

    fechaInput.min = hoy.toISOString().split("T")[0];
    fechaInput.max = unMesDespues.toISOString().split("T")[0];

    fechaInput.addEventListener("change", (e) => {
      const fechaSeleccionada = new Date(e.target.value);
      const diaSemana = fechaSeleccionada.getDay();

      if (diaSemana === 1 || diaSemana === 2) {
        alert("La discoteca solo abre de miércoles a domingo. Por favor, elige otra fecha.");
        e.target.value = "";
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: var(--space-6);">Selecciona una fecha válida.</td></tr>';
        if (next) next.disabled = true;
        return;
      }

      cargarMesas(e.target.value);
    });
  }

  if (tipoReservaInput && capaCumpleanero) {
    tipoReservaInput.addEventListener("change", (e) => {
      if (e.target.value === "cumpleanos") {
        capaCumpleanero.hidden = false;
        nombreCumpleanero.required = true;
      } else {
        capaCumpleanero.hidden = true;
        nombreCumpleanero.required = false;
        nombreCumpleanero.value = "";
      }
    });
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

  async function cargarMesas(fecha) {
    if (!tbody) return;
    
    if (!fecha && !esEmpleado) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: var(--space-6);">Selecciona una fecha primero.</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: var(--space-6);">Buscando disponibilidad...</td></tr>';
    
    try {
      const url = fecha ? `/api/reservasMesas?fecha=${fecha}` : '/api/reservasMesas';
      const respuesta = await fetch(url);
      const mesas = await respuesta.json();
      tbody.innerHTML = "";

      mesas.forEach((mesa) => {
        let claseEstado = mesa.disponible ? "status--available" : "status--reserved";
        const tr = document.createElement("tr");

        if (esEmpleado) {
          let detallesReserva = '<span class="form-hint" style="font-style: italic;">Sin reserva</span>';
          
          if (!mesa.disponible) {
            const nombreReserva = mesa.nombre_reserva || 'Desconocido';
            const tipo = mesa.tipo_reserva === 'cumpleanos' ? '🎂 Cumpleaños' : '🥂 Genérica';
            const cumpleanero = mesa.nombre_cumpleanero ? `<br><small style="color: var(--primary)">Para: ${mesa.nombre_cumpleanero}</small>` : '';
            
            detallesReserva = `<strong>${nombreReserva}</strong><br><small>${tipo}</small>${cumpleanero}`;
          }

          tr.innerHTML = `
            <td><strong>${mesa.nombre}</strong></td>
            <td>${mesa.zona}</td>
            <td>${mesa.capacidad} pers.</td>
            <td class="data-table__price">${mesa.consumo_minimo}</td>
            <td><span class="status ${claseEstado}">${mesa.disponible ? 'Disponible' : 'Reservada'}</span></td>
            <td>${detallesReserva}</td>
          `;
        } else {
          const disabledAttr = mesa.disponible ? "" : "disabled";
          tr.className = mesa.disponible ? "is-selectable" : "is-disabled";
          tr.innerHTML = `
            <td><input type="radio" name="mesa" value="${mesa.id}" id="m${mesa.id}" data-zona="${mesa.zona}" ${disabledAttr} /></td>
            <td><label for="m${mesa.id}">${mesa.nombre}</label></td>
            <td>${mesa.zona}</td>
            <td>${mesa.capacidad}</td>
            <td class="data-table__price">${mesa.consumo_minimo}</td>
            <td><span class="status ${claseEstado}">${mesa.disponible ? 'Disponible' : 'Ocupada'}</span></td>
          `;
        }

        tbody.appendChild(tr);
      });

      if (!esEmpleado) {
        configurarEventosTabla();
      }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="form-error" style="text-align: center; padding: var(--space-6);">Error de conexión al cargar la disponibilidad.</td></tr>';
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
      if (!mesa || !fechaInput.value) {
        if (mesaError) {
          mesaError.textContent = !fechaInput.value ? "Selecciona una fecha primero." : "Selecciona una mesa para continuar.";
          mesaError.hidden = false;
        }
        return;
      }
      const nombreMesa = document.querySelector(`label[for="${mesa.id}"]`).textContent;
      document.getElementById("summary-mesa").textContent = `${nombreMesa} (para el ${fechaInput.value})`;
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
      
      if (!selected() || !fechaInput.value) return goTo(1);
      
      if (!validName()) {
        nombre.setAttribute("aria-invalid", "true");
        if (nombreError) nombreError.hidden = false;
        nombre.focus();
        return;
      }

      const payload = {
        mesa_id: selected().value,
        nombre_reserva: nombre.value.trim(),
        fecha_reserva: fechaInput.value,
        tipo_reserva: tipoReservaInput ? tipoReservaInput.value : 'generica',
        nombre_cumpleanero: (tipoReservaInput && tipoReservaInput.value === 'cumpleanos') ? nombreCumpleanero.value.trim() : null,
        usuario_id: sesion.id || null
      };

      try {
        const res = await fetch('/api/crearReserva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const nombreMesa = document.querySelector(`label[for="${selected().id}"]`).textContent;
          document.getElementById("confirm-text").textContent =
            `${nombre.value.trim()}, tu reserva para la ${nombreMesa} el día ${fechaInput.value} ha sido confirmada correctamente.`;
          goTo(3);
        } else {
           const data = await res.json();
           alert(data.error || "Error al procesar la reserva.");
        }
      } catch (err) {
        alert("Error al comunicarse con el servidor. Inténtalo de nuevo.");
      }
    });
  }

  if (esEmpleado) {
    const hoyStr = new Date().toISOString().split("T")[0];
    if (fechaInput) fechaInput.value = hoyStr;
    cargarMesas(hoyStr);
  } else {
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: var(--space-6);">Selecciona una fecha arriba para ver las mesas disponibles.</td></tr>';
    }
  }
})();