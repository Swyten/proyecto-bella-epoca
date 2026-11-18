/* Bella Época — Interacciones principales */
(() => {
  "use strict";

  // =========================================================================
  // 1. SISTEMA DE RESEÑAS (LECTURA, FILTRADO Y PUBLICACIÓN)
  // =========================================================================
  const btnOpenReview = document.getElementById("btn-open-review");
  const reviewModal = document.getElementById("review-modal");
  const reviewForm = document.getElementById("review-form");
  const reviewRatingInput = document.getElementById("review-rating");
  const starContainer = document.getElementById("star-rating");
  const reviewsContainer = document.getElementById("reviews-container");
  const reviewTabs = document.querySelectorAll("[data-filter-review]");
  const reviewError = document.getElementById("review-error");

  let reseñasData = [];

  async function cargarReseñas() {
    if (!reviewsContainer) return;
    reviewsContainer.innerHTML = '<p class="form-hint" style="grid-column: 1 / -1; text-align: center;">Cargando opiniones...</p>';

    try {
      const response = await fetch('/api/resenas');
      reseñasData = await response.json();
      
      const tabActiva = document.querySelector('[data-filter-review][aria-selected="true"]');
      pintarReseñas(tabActiva ? tabActiva.dataset.filterReview : "todas");
    } catch (error) {
      reviewsContainer.innerHTML = '<p class="form-error" style="grid-column: 1 / -1; text-align: center;">Error al cargar las reseñas.</p>';
    }
  }

  reviewForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!reviewRatingInput.value) {
      reviewError.textContent = "Por favor, selecciona una puntuación de estrellas.";
      reviewError.hidden = false;
      return;
    }

    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    const nuevoComentario = document.getElementById("review-text").value.trim();
    
    const payload = {
      nombre: usuario ? usuario.email.split('@')[0] : "Anónimo",
      estrellas: parseInt(reviewRatingInput.value),
      comentario: nuevoComentario
    };

    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al guardar la reseña");

      reviewModal.close();
      alert("¡Gracias por tu reseña!");
      await cargarReseñas();

    } catch (err) {
      reviewError.textContent = "Hubo un error al publicar tu reseña. Inténtalo de nuevo.";
      reviewError.hidden = false;
    }
  });

  cargarReseñas();

  const generarEstrellas = (num) => {
    let estrellasHTML = '';
    for (let i = 1; i <= 5; i++) {
      estrellasHTML += `<span style="color: ${i <= num ? 'var(--primary)' : 'var(--muted)'}">★</span>`;
    }
    return estrellasHTML;
  };

  const pintarReseñas = (filtro = "todas") => {
    if (!reviewsContainer) return;

    let filtradas = reseñasData.filter(res => {
      if (filtro === "positivas") return res.estrellas >= 4;
      if (filtro === "negativas") return res.estrellas <= 3;
      return true;
    });

    filtradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (filtradas.length === 0) {
      reviewsContainer.innerHTML = `<p class="form-hint" style="grid-column: 1 / -1; text-align: center;">No hay reseñas en esta categoría todavía.</p>`;
      return;
    }

    reviewsContainer.innerHTML = filtradas.map(res => {
      const fechaObj = new Date(res.fecha);
      const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      
      return `
        <figure class="review" style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p class="eyebrow" style="margin: 0;">${res.nombre}</p>
            <div class="review__stars" style="margin: 0; font-size: 1.1rem; letter-spacing: 2px;">${generarEstrellas(res.estrellas)}</div>
          </div>
          <blockquote class="body-copy" style="flex-grow: 1;">"${res.comentario}"</blockquote>
          <figcaption style="margin: 0; text-align: right;">${fechaFormateada}</figcaption>
        </figure>
      `;
    }).join("");
  };

  reviewTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      reviewTabs.forEach(t => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      pintarReseñas(tab.dataset.filterReview);
    });
  });

  pintarReseñas();

  btnOpenReview?.addEventListener("click", () => {
    const sesion = sessionStorage.getItem("usuario");
    if (!sesion) {
      alert("Debes iniciar sesión para dejar una reseña.");
      document.getElementById("login-modal")?.showModal();
      return;
    }
    reviewForm.reset();
    reviewRatingInput.value = "";
    Array.from(starContainer.children).forEach(s => s.style.color = 'var(--muted)');
    if (reviewError) reviewError.hidden = true;
    reviewModal?.showModal();
  });

  if (starContainer) {
    starContainer.addEventListener("click", (e) => {
      if (e.target.tagName === "SPAN") {
        const valor = e.target.dataset.value;
        reviewRatingInput.value = valor;
        Array.from(starContainer.children).forEach(star => {
          star.style.color = star.dataset.value <= valor ? 'var(--primary)' : 'var(--muted)';
        });
      }
    });
  }

  // =========================================================================
  // 2. DETECCIÓN DE SESIÓN Y MENÚ DESPLEGABLE DE PERFIL
  // =========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const userWrapper = document.getElementById("user-profile-wrapper");
    const btnUserProfile = document.getElementById("btn-user-profile");
    const userNameLabel = document.getElementById("user-name-label");
    const userEmailInfo = document.getElementById("user-email-info");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const btnLogout = document.getElementById("btn-logout");

    const sesionGuardada = sessionStorage.getItem("usuario");

    if (sesionGuardada && userWrapper && btnOpenLogin) {
      const usuario = JSON.parse(sesionGuardada);
      
      btnOpenLogin.hidden = true;
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
        if (!userWrapper.contains(e.target)) {
          if (userDropdownMenu) userDropdownMenu.hidden = true;
          btnUserProfile?.setAttribute("aria-expanded", "false");
        }
      });

      btnLogout?.addEventListener("click", () => {
        sessionStorage.removeItem("usuario");
        window.location.reload();
      });
    } else {
      if (btnOpenLogin) btnOpenLogin.hidden = false;
      if (userWrapper) userWrapper.hidden = true;
    }
  });

  // =========================================================================
  // 3. AUTENTICACIÓN CON GOOGLE OAUTH 2.0 (GSI)
  // =========================================================================
  let googleClient;

  window.onload = () => {
    if (window.google) {
      googleClient = google.accounts.oauth2.initTokenClient({
        client_id: '740009760567-n251fo9rrh13o2l7bprvtpjpbq2r85em.apps.googleusercontent.com',
        scope: 'email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            try {
              const res = await fetch('/api/auth-google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenResponse.access_token })
              });
              
              const data = await res.json();
              
              if (!res.ok) {
                throw new Error(data.error || 'Error en la autenticación con Google');
              }

              sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
              
              const modal = document.getElementById("login-modal");
              if (modal && typeof modal.close === 'function') {
                modal.close();
              }
              
              alert(`¡Bienvenido, ${data.usuario.email}! Sesión iniciada correctamente.`);
              window.location.reload();

            } catch (err) {
              alert(err.message);
            }
          }
        },
      });
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const btnGoogle = document.getElementById("btn-google");
    
    btnGoogle?.addEventListener("click", () => {
      if (googleClient) {
        googleClient.requestAccessToken();
      } else {
        alert("El servicio de Google aún se está cargando. Espera un segundo e inténtalo de nuevo.");
      }
    });
  });

  // =========================================================================
  // 4. LOGIN TRADICIONAL, REGISTRO Y VERIFICACIÓN POR CÓDIGO OTP
  // =========================================================================
  const loginModal = document.getElementById("login-modal");
  const btnOpenLogin = document.getElementById("btn-open-login");
  const loginForm = document.getElementById("login-form");
  const btnRegister = document.getElementById("btn-register");
  const loginError = document.getElementById("login-error");

  const authStep1 = document.getElementById("auth-step-1");
  const authStep2 = document.getElementById("auth-step-2");
  const authStepForgot = document.getElementById("auth-step-forgot");
  const authStepReset = document.getElementById("auth-step-reset");
  const loginTitle = document.getElementById("login-title");
  const loginContextAlert = document.getElementById("login-context-alert");
  const loginContextMessage = document.getElementById("login-context-message");

  const verifyEmailTarget = document.getElementById("verify-email-target");
  const verifyForm = document.getElementById("verify-form");
  const verifyCodeInput = document.getElementById("verify-code");
  const verifyError = document.getElementById("verify-error");
  const btnBackToLogin = document.getElementById("btn-back-to-login");

  const btnForgotPassword = document.getElementById("btn-forgot-password");
  const forgotForm = document.getElementById("forgot-form");
  const forgotEmailInput = document.getElementById("forgot-email");
  const forgotError = document.getElementById("forgot-error");
  const btnSendRecovery = document.getElementById("btn-send-recovery");
  const btnBackFromForgot = document.getElementById("btn-back-from-forgot");

  const resetEmailTarget = document.getElementById("reset-email-target");
  const resetForm = document.getElementById("reset-form");
  const resetCodeInput = document.getElementById("reset-code");
  const resetNewPassInput = document.getElementById("reset-new-pass");
  const resetConfirmPassInput = document.getElementById("reset-confirm-pass");
  const resetError = document.getElementById("reset-error");
  const btnConfirmReset = document.getElementById("btn-confirm-reset");
  const btnBackFromReset = document.getElementById("btn-back-from-reset");

  /** Correo pendiente de confirmación en registro o recuperación */
  let emailPendienteVerificar = '';
  /** Correo del usuario que está restableciendo su contraseña */
  let emailRecuperacion = '';

  /**
   * Alterna de forma accesible entre las distintas vistas del modal de acceso
   * actualizando el encabezado principal y ocultando errores previos.
   * @param {"login"|"verify"|"forgot"|"reset"} vista - Vista activa del modal.
   */
  function mostrarVistaAuth(vista) {
    if (authStep1) authStep1.hidden = vista !== "login";
    if (authStep2) authStep2.hidden = vista !== "verify";
    if (authStepForgot) authStepForgot.hidden = vista !== "forgot";
    if (authStepReset) authStepReset.hidden = vista !== "reset";

    if (loginError) loginError.hidden = true;
    if (verifyError) verifyError.hidden = true;
    if (forgotError) forgotError.hidden = true;
    if (resetError) resetError.hidden = true;

    const titulos = {
      login: "Acceso",
      verify: "Verificar cuenta",
      forgot: "Recordar contraseña",
      reset: "Nueva contraseña"
    };
    if (loginTitle && titulos[vista]) {
      loginTitle.textContent = titulos[vista];
    }
  }

  // Reinicia todos los pasos del modal de acceso antes de mostrarlo
  btnOpenLogin?.addEventListener("click", () => {
    loginForm?.reset();
    verifyForm?.reset();
    forgotForm?.reset();
    resetForm?.reset();
    if (loginContextAlert) loginContextAlert.hidden = true;
    mostrarVistaAuth("login");
    loginModal?.showModal();
  });

  // Navegación desde el formulario de login hacia "Recordar contraseña"
  btnForgotPassword?.addEventListener("click", () => {
    forgotForm?.reset();
    if (loginContextAlert) loginContextAlert.hidden = true;
    // Si el usuario ya había escrito su correo en login, lo precargamos por comodidad
    const correoPrevio = document.getElementById("login-email")?.value.trim();
    if (correoPrevio && forgotEmailInput) {
      forgotEmailInput.value = correoPrevio;
    }
    mostrarVistaAuth("forgot");
    forgotEmailInput?.focus();
  });

  // Botones de retorno al inicio de sesión desde los pasos de recuperación
  btnBackFromForgot?.addEventListener("click", () => {
    mostrarVistaAuth("login");
    document.getElementById("login-email")?.focus();
  });

  btnBackFromReset?.addEventListener("click", () => {
    mostrarVistaAuth("login");
    document.getElementById("login-email")?.focus();
  });

  // Paso 1 de recuperación: Solicitud de envío de código OTP al correo
  forgotForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = forgotEmailInput.value.trim();
    if (!email) return;

    if (forgotError) forgotError.hidden = true;
    if (btnSendRecovery) {
      btnSendRecovery.disabled = true;
      btnSendRecovery.textContent = "Enviando código...";
    }

    try {
      const response = await fetch('/api/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        forgotError.textContent = data.error || "No se pudo enviar el código de verificación.";
        forgotError.hidden = false;
        return;
      }

      emailRecuperacion = email;
      if (resetEmailTarget) resetEmailTarget.textContent = email;
      resetForm?.reset();
      mostrarVistaAuth("reset");
      resetCodeInput?.focus();
    } catch (error) {
      forgotError.textContent = "Error de conexión con el servidor.";
      forgotError.hidden = false;
    } finally {
      if (btnSendRecovery) {
        btnSendRecovery.disabled = false;
        btnSendRecovery.textContent = "Enviar código de verificación";
      }
    }
  });

  // Paso 2 de recuperación: Verificación de código OTP y guardado de nueva contraseña
  resetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codigo = resetCodeInput.value.trim();
    const nuevaPassword = resetNewPassInput.value;
    const confirmarPassword = resetConfirmPassInput.value;

    if (resetError) resetError.hidden = true;

    if (!/^\d{6}$/.test(codigo)) {
      resetError.textContent = "El código de verificación debe tener 6 dígitos.";
      resetError.hidden = false;
      resetCodeInput.focus();
      return;
    }

    if (nuevaPassword.length < 6) {
      resetError.textContent = "La nueva contraseña debe tener al menos 6 caracteres.";
      resetError.hidden = false;
      resetNewPassInput.focus();
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      resetError.textContent = "Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.";
      resetError.hidden = false;
      resetConfirmPassInput.focus();
      return;
    }

    if (btnConfirmReset) {
      btnConfirmReset.disabled = true;
      btnConfirmReset.textContent = "Actualizando contraseña...";
    }

    try {
      const response = await fetch('/api/restablecer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailRecuperacion,
          codigo,
          nuevaPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        resetError.textContent = data.error || "Código incorrecto o expirado.";
        resetError.hidden = false;
        return;
      }

      // Vuelve al formulario de login con confirmación accesible integrada
      mostrarVistaAuth("login");
      const loginEmailField = document.getElementById("login-email");
      const loginPassField = document.getElementById("login-pass");
      if (loginEmailField) loginEmailField.value = emailRecuperacion;
      if (loginPassField) loginPassField.value = "";

      if (loginContextAlert && loginContextMessage) {
        loginContextAlert.className = "alert alert--success";
        loginContextMessage.textContent = "Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva clave.";
        loginContextAlert.hidden = false;
      }
      loginPassField?.focus();
    } catch (error) {
      resetError.textContent = "Error de conexión al actualizar la contraseña.";
      resetError.hidden = false;
    } finally {
      if (btnConfirmReset) {
        btnConfirmReset.disabled = false;
        btnConfirmReset.textContent = "Actualizar contraseña";
      }
    }
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.error || "Error en el inicio de sesión";
        loginError.hidden = false;
        return;
      }

      loginError.hidden = true;
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      loginModal.close();
      window.location.reload();

    } catch (error) {
      loginError.textContent = "Error de conexión con el servidor.";
      loginError.hidden = false;
    }
  });

  btnRegister?.addEventListener("click", async () => {
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value;

    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.error || "Error al registrar la cuenta";
        loginError.hidden = false;
        return;
      }

      emailPendienteVerificar = email;
      if (verifyEmailTarget) verifyEmailTarget.textContent = email;
      mostrarVistaAuth("verify");
      verifyCodeInput?.focus();

    } catch (error) {
      loginError.textContent = "Error de conexión al enviar el registro.";
      loginError.hidden = false;
    }
  });

  verifyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codigo = verifyCodeInput.value.trim();

    try {
      const response = await fetch('/api/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailPendienteVerificar, codigo })
      });

      const data = await response.json();

      if (!response.ok) {
        verifyError.textContent = data.error || "Código incorrecto";
        verifyError.hidden = false;
        return;
      }

      mostrarVistaAuth("login");
      if (loginContextAlert && loginContextMessage) {
        loginContextAlert.className = "alert alert--success";
        loginContextMessage.textContent = "¡Cuenta verificada con éxito! Ya puedes iniciar sesión.";
        loginContextAlert.hidden = false;
      }
      document.getElementById("login-pass").value = "";
      document.getElementById("login-pass").focus();

    } catch (error) {
      verifyError.textContent = "Error al verificar el código.";
      verifyError.hidden = false;
    }
  });

  btnBackToLogin?.addEventListener("click", () => {
    mostrarVistaAuth("login");
  });

  // =========================================================================
  // 6. VISOR MODAL DE GALERÍA DE INICIO Y GUARDIAS DE SESIÓN
  // =========================================================================
  const gallery = document.getElementById("gallery-dialog");
  const enlarged = document.getElementById("gallery-image");
  const caption = document.getElementById("gallery-caption");
  const images = [...document.querySelectorAll(".gallery-item")];
  let current = 0;
  let opener = null;

  function updateImage(index) {
    current = (index + images.length) % images.length;
    const link = images[current];
    const image = link?.querySelector("img");
    if (!link || !image || !enlarged || !caption) return;
    enlarged.src = link.href;
    enlarged.alt = image.alt;
    caption.textContent = `${image.alt} — ${current + 1} / ${images.length}`;
  }

  images.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      if (!(gallery instanceof HTMLDialogElement) || typeof gallery.showModal !== "function") return;
      event.preventDefault();
      opener = link;
      updateImage(index);
      gallery.showModal();
    });
  });

  document.querySelector("[data-gallery-prev]")?.addEventListener("click", () => updateImage(current - 1));
  document.querySelector("[data-gallery-next]")?.addEventListener("click", () => updateImage(current + 1));

  gallery?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateImage(current + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateImage(current - 1);
    }
  });

  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    });
  });
  gallery?.addEventListener("close", () => opener?.focus());

  /**
   * Abre el modal de inicio de sesión mostrando un aviso contextual accesible
   * sin bloquear la navegación con cuadros alert() nativos.
   * @param {string} mensaje - Explicación del motivo por el que se solicita acceso.
   */
  function solicitarAccesoConMensaje(mensaje) {
    if (loginContextAlert && loginContextMessage) {
      loginContextAlert.className = "alert alert--info";
      loginContextMessage.textContent = mensaje;
      loginContextAlert.hidden = false;
    }
    mostrarVistaAuth("login");
    document.getElementById("login-modal")?.showModal();
  }

  // Verifica que el usuario tenga sesión antes de redirigir al asistente de reservas
  document.querySelectorAll("[data-booking]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sesion = sessionStorage.getItem("usuario");
      if (!sesion) {
        solicitarAccesoConMensaje("Debes iniciar sesión con tu cuenta para realizar una reserva de mesa.");
      } else {
        window.location.href = "html/reserva.html";
      }
    });
  });

  // Verifica que el usuario tenga sesión antes de redirigir a la compra de entradas anticipadas
  document.querySelectorAll("[data-tickets]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sesion = sessionStorage.getItem("usuario");
      if (!sesion) {
        solicitarAccesoConMensaje("Debes iniciar sesión con tu cuenta para adquirir entradas anticipadas.");
      } else {
        window.location.href = "html/entradas.html";
      }
    });
  });
})();