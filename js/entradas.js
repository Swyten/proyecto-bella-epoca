/* Bella Época — Compra de Entradas Anticipadas con Pago Visa, QR y Envío por Correo */
(() => {
  "use strict";

  // =========================================================================
  // 1. CONTROL DE ACCESO OBLIGATORIO (SOLO CON CUENTA INICIADA)
  // =========================================================================
  const sesionGuardada = sessionStorage.getItem("usuario");

  // Si no hay sesión activa, redirige inmediatamente a la portada para iniciar sesión
  if (!sesionGuardada) {
    window.location.href = "../index.html";
    return;
  }

  const sesion = JSON.parse(sesionGuardada);

  // =========================================================================
  // 2. BARRA DE PERFIL DE USUARIO, MENÚ MÓVIL Y PRECARGA DE CORREO DE SESIÓN
  // =========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const userWrapper = document.getElementById("user-profile-wrapper");
    const btnUserProfile = document.getElementById("btn-user-profile");
    const userNameLabel = document.getElementById("user-name-label");
    const userEmailInfo = document.getElementById("user-email-info");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const btnLogout = document.getElementById("btn-logout");
    const sessionEmailDisplay = document.getElementById("session-email-display");
    const nav = document.getElementById("site-nav");

    if (btnOpenLogin) btnOpenLogin.hidden = true;
    if (userWrapper) userWrapper.hidden = false;

    // Muestra el usuario autenticado y el correo donde se enviará el ticket
    if (userNameLabel) userNameLabel.textContent = sesion.email.split("@")[0];
    if (userEmailInfo) userEmailInfo.textContent = sesion.email;
    if (sessionEmailDisplay) sessionEmailDisplay.textContent = sesion.email;

    // Si pertenece al personal del local, añade acceso directo a Gestión de Mesas
    if ((sesion.rol === "empleado" || sesion.rol === "administrador") && nav) {
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

    // Cierra el desplegable al pulsar fuera
    document.addEventListener("click", (e) => {
      if (userWrapper && !userWrapper.contains(e.target)) {
        if (userDropdownMenu) userDropdownMenu.hidden = true;
        btnUserProfile?.setAttribute("aria-expanded", "false");
      }
    });

    // Cierra sesión y redirige a la portada
    btnLogout?.addEventListener("click", () => {
      sessionStorage.removeItem("usuario");
      window.location.href = "../index.html";
    });

    // Gestión accesible del menú hamburguesa en dispositivos móviles
    const menu = document.querySelector(".menu-toggle");
    menu?.addEventListener("click", () => {
      menu.setAttribute("aria-expanded", String(menu.getAttribute("aria-expanded") !== "true"));
    });
    nav?.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        menu?.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu?.getAttribute("aria-expanded") === "true") {
        menu.setAttribute("aria-expanded", "false");
        menu.focus();
      }
    });
  });

  // =========================================================================
  // 3. REFERENCIAS DEL FORMULARIO Y VALIDACIÓN DE VIERNES Y SÁBADOS
  // =========================================================================
  const form = document.getElementById("advance-ticket-form");
  if (!form) return;

  const fechaInput = document.getElementById("entrada-fecha");
  const fechaError = document.getElementById("fecha-error");
  const nombreInput = document.getElementById("entrada-nombre");
  const nombreError = document.getElementById("nombre-error");
  const apellidosInput = document.getElementById("entrada-apellidos");
  const apellidosError = document.getElementById("apellidos-error");
  const telefonoInput = document.getElementById("entrada-telefono");
  const telefonoError = document.getElementById("telefono-error");

  const visaTitularInput = document.getElementById("visa-titular");
  const visaTitularError = document.getElementById("visa-titular-error");
  const visaNumeroInput = document.getElementById("visa-numero");
  const visaNumeroError = document.getElementById("visa-numero-error");
  const visaCaducidadInput = document.getElementById("visa-caducidad");
  const visaCaducidadError = document.getElementById("visa-caducidad-error");
  const visaCvvInput = document.getElementById("visa-cvv");
  const visaCvvError = document.getElementById("visa-cvv-error");

  const generalErrorBox = document.getElementById("form-general-error");
  const generalErrorText = document.getElementById("form-general-error-text");
  const btnPagar = document.getElementById("btn-pagar-entrada");

  // Restringe el rango seleccionable entre hoy y dos meses vista
  const hoy = new Date();
  const dosMeses = new Date();
  dosMeses.setMonth(hoy.getMonth() + 2);
  fechaInput.min = hoy.toISOString().split("T")[0];
  fechaInput.max = dosMeses.toISOString().split("T")[0];

  /**
   * Muestra un error accesible en un campo concreto activando aria-invalid.
   * @param {HTMLElement} input - Campo de entrada afectado.
   * @param {HTMLElement} errorEl - Contenedor con role="alert" asociado.
   * @param {string} mensaje - Mensaje descriptivo del error.
   */
  function marcarErrorCampo(input, errorEl, mensaje) {
    if (errorEl) {
      errorEl.textContent = mensaje;
      errorEl.hidden = false;
    }
    if (input) {
      input.setAttribute("aria-invalid", "true");
    }
  }

  /**
   * Limpia el estado de error de un campo cuando el usuario corrige su valor.
   * @param {HTMLElement} input - Campo de entrada.
   * @param {HTMLElement} errorEl - Contenedor de error asociado.
   */
  function limpiarErrorCampo(input, errorEl) {
    if (errorEl) errorEl.hidden = true;
    if (input) input.removeAttribute("aria-invalid");
  }

  /**
   * Comprueba que la fecha elegida corresponda exclusivamente a Viernes (5) o Sábado (6).
   * @param {string} valorFecha - Fecha en formato ISO YYYY-MM-DD.
   * @returns {boolean} True si es viernes o sábado.
   */
  function esViernesOSabado(valorFecha) {
    if (!valorFecha) return false;
    const [year, month, day] = valorFecha.split("-").map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const diaSemana = fechaObj.getDay(); // 5 = Viernes, 6 = Sábado
    return diaSemana === 5 || diaSemana === 6;
  }

  // Valida inmediatamente al cambiar la fecha en el calendario
  fechaInput.addEventListener("change", (e) => {
    if (!esViernesOSabado(e.target.value)) {
      marcarErrorCampo(
        fechaInput,
        fechaError,
        "Las entradas anticipadas solo están disponibles para noches de Viernes y Sábado."
      );
      e.target.value = "";
    } else {
      limpiarErrorCampo(fechaInput, fechaError);
    }
  });

  // Limpieza en tiempo real de errores en datos personales
  nombreInput.addEventListener("input", () => limpiarErrorCampo(nombreInput, nombreError));
  apellidosInput.addEventListener("input", () => limpiarErrorCampo(apellidosInput, apellidosError));
  telefonoInput.addEventListener("input", () => limpiarErrorCampo(telefonoInput, telefonoError));
  visaTitularInput.addEventListener("input", () => limpiarErrorCampo(visaTitularInput, visaTitularError));

  // =========================================================================
  // 4. FORMATEO Y VALIDACIÓN DE TARJETA VISA (PREFIJO 4 + ALGORITMO DE LUHN)
  // =========================================================================

  // Formatea el número de tarjeta en grupos de 4 dígitos (4XXX XXXX XXXX XXXX)
  visaNumeroInput.addEventListener("input", (e) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = soloDigitos.replace(/(\d{4})(?=\d)/g, "$1 ");
    limpiarErrorCampo(visaNumeroInput, visaNumeroError);
  });

  // Formatea automáticamente la fecha de caducidad como MM/AA
  visaCaducidadInput.addEventListener("input", (e) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (soloDigitos.length >= 3) {
      e.target.value = `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2)}`;
    } else {
      e.target.value = soloDigitos;
    }
    limpiarErrorCampo(visaCaducidadInput, visaCaducidadError);
  });

  // Restringe el CVV a 3 dígitos numéricos
  visaCvvInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
    limpiarErrorCampo(visaCvvInput, visaCvvError);
  });

  /**
   * Verifica que la tarjeta sea Visa (16 dígitos empezando por 4)
   * y supere el algoritmo de verificación de Luhn.
   * @param {string} numeroConEspacios - Número formateado con espacios.
   * @returns {boolean} True si la tarjeta Visa es válida.
   */
  function validarTarjetaVisa(numeroConEspacios) {
    const digitos = numeroConEspacios.replace(/\s+/g, "");
    if (!/^4\d{15}$/.test(digitos)) return false;

    let suma = 0;
    let alternar = false;
    for (let i = digitos.length - 1; i >= 0; i--) {
      let n = parseInt(digitos[i], 10);
      if (alternar) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      suma += n;
      alternar = !alternar;
    }
    return suma % 10 === 0;
  }

  /**
   * Comprueba que la fecha MM/AA sea válida y posterior al mes actual.
   * @param {string} mmAa - Cadena con formato MM/AA.
   * @returns {boolean} True si no está caducada.
   */
  function validarCaducidad(mmAa) {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(mmAa);
    if (!match) return false;
    const mes = parseInt(match[1], 10);
    const anio = 2000 + parseInt(match[2], 10);
    const ahora = new Date();
    const finMesTarjeta = new Date(anio, mes, 0, 23, 59, 59);
    return finMesTarjeta >= ahora;
  }

  // =========================================================================
  // 5. PROCESAMIENTO DEL PAGO, GENERACIÓN DE TICKET QR Y ENVÍO AL CORREO
  // =========================================================================
  const purchaseCard = document.getElementById("ticket-purchase-card");
  const ticketSection = document.getElementById("generated-ticket-section");
  const qrContainer = document.getElementById("ticket-qrcode");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (generalErrorBox) generalErrorBox.hidden = true;

    const fecha = fechaInput.value;
    const nombre = nombreInput.value.trim();
    const apellidos = apellidosInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const titular = visaTitularInput.value.trim();
    const numeroVisa = visaNumeroInput.value.trim();
    const caducidad = visaCaducidadInput.value.trim();
    const cvv = visaCvvInput.value.trim();

    // Validación campo a campo con enfoque accesible al primer error
    if (!esViernesOSabado(fecha)) {
      marcarErrorCampo(fechaInput, fechaError, "Selecciona un Viernes o Sábado válido para acceder.");
      fechaInput.focus();
      return;
    }

    if (nombre.length < 2) {
      marcarErrorCampo(nombreInput, nombreError, "Introduce tu nombre (mínimo 2 caracteres).");
      nombreInput.focus();
      return;
    }

    if (apellidos.length < 2) {
      marcarErrorCampo(apellidosInput, apellidosError, "Introduce tus apellidos.");
      apellidosInput.focus();
      return;
    }

    if (telefono.replace(/\D/g, "").length < 9) {
      marcarErrorCampo(telefonoInput, telefonoError, "Introduce un número de teléfono válido (al menos 9 dígitos).");
      telefonoInput.focus();
      return;
    }

    if (titular.length < 3) {
      marcarErrorCampo(visaTitularInput, visaTitularError, "Introduce el nombre del titular de la tarjeta Visa.");
      visaTitularInput.focus();
      return;
    }

    if (!validarTarjetaVisa(numeroVisa)) {
      marcarErrorCampo(
        visaNumeroInput,
        visaNumeroError,
        "Número de tarjeta Visa no válido. Debe empezar por 4 y tener 16 dígitos."
      );
      visaNumeroInput.focus();
      return;
    }

    if (!validarCaducidad(caducidad)) {
      marcarErrorCampo(visaCaducidadInput, visaCaducidadError, "Fecha de caducidad inválida o tarjeta caducada.");
      visaCaducidadInput.focus();
      return;
    }

    if (!/^\d{3}$/.test(cvv)) {
      marcarErrorCampo(visaCvvInput, visaCvvError, "El código CVV debe contener 3 dígitos.");
      visaCvvInput.focus();
      return;
    }

    // Construcción de la referencia única y datos codificados en el QR
    const codigoRef = `BE-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const ultimos4 = numeroVisa.replace(/\s+/g, "").slice(-4);
    const nombreCompleto = `${nombre} ${apellidos}`;

    const [y, m, d] = fecha.split("-").map(Number);
    const fechaFormateada = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const datosQR = JSON.stringify({
      ref: codigoRef,
      sala: "Discoteca Bella Epoca",
      titular: nombreCompleto,
      email: sesion.email,
      telefono: telefono,
      fecha: fecha
    });

    btnPagar.disabled = true;
    btnPagar.textContent = "Procesando pago Visa y enviando entrada...";

    try {
      // Llama al endpoint serverless para enviar el ticket QR al correo de la sesión
      const response = await fetch("/api/enviar-entrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referencia: codigoRef,
          nombre: nombreCompleto,
          email: sesion.email,
          telefono: telefono,
          fecha: fechaFormateada,
          fechaIso: fecha,
          ultimos4: ultimos4,
          qrData: datosQR
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo completar el envío de la entrada al correo.");
      }

      // Rellena los datos nominativos en el ticket visual
      document.getElementById("ticket-sent-email").textContent = sesion.email;
      document.getElementById("ticket-code-badge").textContent = `REF: #${codigoRef}`;
      document.getElementById("ticket-holder-name").textContent = nombreCompleto;
      document.getElementById("ticket-event-date").textContent = fechaFormateada;
      document.getElementById("ticket-holder-email").textContent = sesion.email;
      document.getElementById("ticket-holder-phone").textContent = telefono;
      document.getElementById("ticket-payment-method").textContent = `Tarjeta Visa •••• ${ultimos4}`;

      // Genera el código QR visual dentro de #ticket-qrcode
      qrContainer.innerHTML = "";
      if (typeof QRCode !== "undefined") {
        new QRCode(qrContainer, {
          text: datosQR,
          width: 168,
          height: 168,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }

      // Alterna vista al ticket generado y traslada el foco al encabezado del pase
      purchaseCard.hidden = true;
      ticketSection.hidden = false;
      document.getElementById("ticket-heading")?.focus();
      ticketSection.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      if (generalErrorBox && generalErrorText) {
        generalErrorText.textContent = error.message || "Error al procesar el pago. Inténtalo de nuevo.";
        generalErrorBox.hidden = false;
      }
    } finally {
      btnPagar.disabled = false;
      btnPagar.textContent = "Pagar 15,00 € y generar entrada QR";
    }
  });

  // Permite imprimir o guardar en PDF el ticket generado
  document.getElementById("btn-print-ticket")?.addEventListener("click", () => {
    window.print();
  });

  // Permite adquirir una nueva entrada reiniciando el formulario
  document.getElementById("btn-buy-another")?.addEventListener("click", () => {
    form.reset();
    ticketSection.hidden = true;
    purchaseCard.hidden = false;
    fechaInput.focus();
  });
})();