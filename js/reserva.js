/* Bella Época — Asistente y Panel de Control de Reservas */
(() => {
  "use strict";

  // =========================================================
  // 1. GESTIÓN DE SESIÓN Y CABECERA
  // =========================================================
  //const sesionGuardada = sessionStorage.getItem("usuario");
  const sesionGuardada = sessionStorage.getItem("usuario") || JSON.stringify({ email: "auditoria@bellaepoca.com", rol: "usuario" });

  // Redirigir si no hay sesión (Protección de la página de reservas)
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

    // Ocultar botón login y mostrar perfil
    if (btnOpenLogin) btnOpenLogin.hidden = true;
    if (userWrapper) userWrapper.hidden = false;

    if (userNameLabel) userNameLabel.textContent = sesion.email.split('@')[0];
    if (userEmailInfo) userEmailInfo.textContent = sesion.email;

    // Desplegable de usuario
    btnUserProfile?.addEventListener("click", (e) => {
      e.stopPropagation();
      const estaAbierto = !userDropdownMenu.hidden;
      userDropdownMenu.hidden = estaAbierto;
      btnUserProfile.setAttribute("aria-expanded", String(!estaAbierto));
    });

    // Cerrar desplegable al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (userWrapper && !userWrapper.contains(e.target)) {
        if (userDropdownMenu) userDropdownMenu.hidden = true;
        btnUserProfile?.setAttribute("aria-expanded", "false");
      }
    });

    // Cerrar sesión
    btnLogout?.addEventListener("click", () => {
      sessionStorage.removeItem("usuario");
      window.location.href = "../index.html";
    });

    // =========================================================
    // 2. TRANSICIONES DE PÁGINA
    // =========================================================
    if (sessionStorage.getItem("animacion-volver") === "true") {
      document.body.style.animation = "slide-in-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
      sessionStorage.removeItem("animacion-volver");
    } else {
      document.body.style.animation = "slide-in-right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
    }
  });

  // =========================================================
  // 3. REFERENCIAS AL DOM (FORMULARIO Y TABLA)
  // =========================================================
  const form = document.getElementById("booking-form");
  if (!form) return;

  const tbody = document.getElementById("tabla-mesas");
  const thead = form.querySelector(".data-table thead tr");
  const wizardSteps = form.querySelector(".wizard-steps");
  const panels = form.querySelectorAll("[data-step]");
  const labels = form.querySelectorAll("[data-step-label]");
  
  // Botones de navegación del Wizard
  const next = document.getElementById("btn-next");
  const back = document.getElementById("btn-back");
  const submit = document.getElementById("btn-submit");
  
  // Campos de texto y errores
  const nombre = document.getElementById("nombre");
  const nombreError = document.getElementById("nombre-error");
  const mesaError = document.getElementById("mesa-error");

  // Nuevos campos (Fecha y Cumpleaños)
  const fechaInput = document.getElementById("fecha-reserva");
  const tipoReservaInput = document.getElementById("tipo-reserva");
  const capaCumpleanero = document.getElementById("capa-cumpleanero");
  const nombreCumpleanero = document.getElementById("nombre-cumpleanero");

  // =========================================================
  // 4. CONFIGURACIÓN DE VISTA SEGÚN EL ROL
  // =========================================================
  if (esEmpleado) {
    document.getElementById("reserva-title").textContent = "Control y Gestión de Mesas";
    const introCopy = form.closest(".container").querySelector(".body-copy");
    if (introCopy) introCopy.textContent = "Panel de control en tiempo real del estado de los reservados y asignación de clientes.";

    if (wizardSteps) wizardSteps.style.display = "none";
    const wizardActions = form.querySelector('[data-step="1"] .wizard-actions');
    if (wizardActions) wizardActions.style.display = "none";

    // Cambiar cabeceras de la tabla para empleados
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

  // =========================================================
  // 5. LÓGICA DEL CALENDARIO (Validación de fechas)
  // =========================================================
  if (fechaInput) {
    const hoy = new Date();
    const unMesDespues = new Date();
    unMesDespues.setMonth(hoy.getMonth() + 1);

    // Limitar la fecha desde hoy hasta dentro de un mes (formato YYYY-MM-DD)
    fechaInput.min = hoy.toISOString().split("T")[0];
    fechaInput.max = unMesDespues.toISOString().split("T")[0];

    fechaInput.addEventListener("change", (e) => {
      const fechaSeleccionada = new Date(e.target.value);
      const diaSemana = fechaSeleccionada.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, etc.

      // Validar que la discoteca esté abierta (Miércoles a Domingo)
      if (diaSemana === 1 || diaSemana === 2) {
        alert("La discoteca solo abre de miércoles a domingo. Por favor, elige otra fecha.");
        e.target.value = ""; // Limpiar el input
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Selecciona una fecha válida.</td></tr>';
        if (next) next.disabled = true;
        return;
      }

      // Si la fecha es válida, cargar la disponibilidad
      cargarMesas(e.target.value);
    });
  }

  // =========================================================
  // 6. LÓGICA DEL SELECT DE CUMPLEAÑOS
  // =========================================================
  if (tipoReservaInput && capaCumpleanero) {
    tipoReservaInput.addEventListener("change", (e) => {
      if (e.target.value === "cumpleanos") {
        capaCumpleanero.hidden = false;
        nombreCumpleanero.required = true;
      } else {
        capaCumpleanero.hidden = true;
        nombreCumpleanero.required = false;
        nombreCumpleanero.value = ""; // Limpiar valor si se oculta
      }
    });
  }

  // Funciones auxiliares para el Wizard
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

  // =========================================================
  // 7. CARGA DE MESAS Y RENDERIZADO
  // =========================================================
  async function cargarMesas(fecha) {
    if (!tbody) return;
    
    // Si no hay fecha seleccionada y es cliente, pedir fecha
    if (!fecha && !esEmpleado) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Selecciona una fecha primero.</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Buscando disponibilidad...</td></tr>';
    
    try {
      // Llamada al endpoint con el parámetro de fecha
      const url = fecha ? `/api/reservasMesas?fecha=${fecha}` : '/api/reservasMesas';
      const respuesta = await fetch(url);
      const mesas = await respuesta.json();
      tbody.innerHTML = "";

      mesas.forEach((mesa) => {
        let claseEstado = mesa.disponible ? "status--available" : "status--reserved";
        const tr = document.createElement("tr");

        if (esEmpleado) {
          // Vista de empleado: Mostrar detalles de reserva si la mesa está ocupada
          let detallesReserva = '<span style="opacity: 0.6; font-style: italic;">Sin reserva</span>';
          
          if (!mesa.disponible) {
            const nombreReserva = mesa.nombre_reserva || 'Desconocido';
            const tipo = mesa.tipo_reserva === 'cumpleanos' ? '🎂 Cumpleaños' : '🥂 Genérica';
            const cumpleanero = mesa.nombre_cumpleanero ? `<br><small style="color:#d4af37">Para: ${mesa.nombre_cumpleanero}</small>` : '';
            
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
          // Vista de cliente: Input radio y control de deshabilitado
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

      // Solo clientes necesitan eventos para interactuar con la tabla
      if (!esEmpleado) {
        configurarEventosTabla();
      }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="form-error">Error de conexión al cargar la disponibilidad.</td></tr>';
    }
  }

  function configurarEventosTabla() {
    const radios = form.querySelectorAll('input[name="mesa"]');
    radios.forEach((radio) => {
      const row = radio.closest("tr");
      // Seleccionar fila completa al hacer clic
      row.addEventListener("click", () => {
        if (radio.disabled) return;
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
      });
      // Habilitar botón de siguiente
      radio.addEventListener("change", () => {
        radios.forEach((r) => r.closest("tr").classList.toggle("is-selected", r.checked));
        if (next) next.disabled = !selected();
        if (mesaError) mesaError.hidden = true;
      });
    });
  }

  // =========================================================
  // 8. EVENTOS DEL FORMULARIO Y WIZARD (Solo para clientes)
  // =========================================================
  if (!esEmpleado) {
    
    // Botón Siguiente (Paso 1 a 2)
    next?.addEventListener("click", () => {
      const mesa = selected();
      if (!mesa || !fechaInput.value) {
        if (mesaError) {
          mesaError.textContent = !fechaInput.value ? "Selecciona una fecha primero." : "Selecciona una mesa para continuar.";
          mesaError.hidden = false;
        }
        return;
      }
      // Mostrar el nombre de la mesa seleccionada en el resumen
      const nombreMesa = document.querySelector(`label[for="${mesa.id}"]`).textContent;
      document.getElementById("summary-mesa").textContent = `${nombreMesa} (para el ${fechaInput.value})`;
      goTo(2);
    });

    // Botón Atrás
    back?.addEventListener("click", () => goTo(1));

    // Validación del nombre en tiempo real
    nombre?.addEventListener("input", () => {
      if (submit) submit.disabled = !validName();
      if (validName()) {
        nombre.removeAttribute("aria-invalid");
        if (nombreError) nombreError.hidden = true;
      }
    });

    // Envío final del formulario (Petición POST)
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      
      if (!selected() || !fechaInput.value) return goTo(1);
      
      if (!validName()) {
        nombre.setAttribute("aria-invalid", "true");
        if (nombreError) nombreError.hidden = false;
        nombre.focus();
        return;
      }

      // Construcción del payload
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
          goTo(3); // Mostrar panel de éxito
        } else {
           const data = await res.json();
           alert(data.error || "Error al procesar la reserva.");
        }
      } catch (err) {
        alert("Error al comunicarse con el servidor. Inténtalo de nuevo.");
      }
    });
  }

  // =========================================================
  // 9. INICIALIZACIÓN AL CARGAR LA PÁGINA
  // =========================================================
  if (esEmpleado) {
    // Los empleados ven por defecto las mesas del día actual
    const hoyStr = new Date().toISOString().split("T")[0];
    if (fechaInput) fechaInput.value = hoyStr;
    cargarMesas(hoyStr);
  } else {
    // Los clientes deben seleccionar fecha obligatoriamente
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Selecciona una fecha arriba para ver las mesas disponibles.</td></tr>';
    }
  }
})();