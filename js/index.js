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

  /** Caché en memoria con las reseñas obtenidas del servidor */
  let reseñasData = [];

  /**
   * Obtiene el listado completo de reseñas desde `/api/resenas` y renderiza
   * la vista correspondiente a la pestaña de filtro activa.
   * @returns {Promise<void>}
   */
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

  // Envío del formulario de nueva reseña mediante POST a la API
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

  /**
   * Genera el marcado HTML de las 5 estrellas coloreadas según la puntuación.
   * @param {number} num - Valoración de 1 a 5.
   * @returns {string} HTML con las etiquetas `<span>` de estrellas.
   */
  const generarEstrellas = (num) => {
    let estrellasHTML = '';
    for (let i = 1; i <= 5; i++) {
      estrellasHTML += `<span style="color: ${i <= num ? 'var(--primary)' : 'var(--muted)'}">★</span>`;
    }
    return estrellasHTML;
  };

  /**
   * Filtra, ordena cronológicamente y renderiza las tarjetas de reseñas en el DOM.
   * @param {string} [filtro="todas"] - Criterio de filtrado ("todas", "positivas", "negativas").
   */
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

  // Cambio de filtro al pulsar las pestañas de reseñas
  reviewTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      reviewTabs.forEach(t => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      pintarReseñas(tab.dataset.filterReview);
    });
  });

  pintarReseñas();

  // Apertura del modal de creación de reseña (requiere sesión iniciada)
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

  // Selección interactiva de estrellas en el formulario de valoración
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

      // Abre o cierra el desplegable de perfil
      btnUserProfile?.addEventListener("click", (e) => {
        e.stopPropagation();
        const estaAbierto = !userDropdownMenu.hidden;
        userDropdownMenu.hidden = estaAbierto;
        btnUserProfile.setAttribute("aria-expanded", String(!estaAbierto));
      });

      // Cierra el desplegable si se pulsa fuera de él
      document.addEventListener("click", (e) => {
        if (!userWrapper.contains(e.target)) {
          if (userDropdownMenu) userDropdownMenu.hidden = true;
          btnUserProfile?.setAttribute("aria-expanded", "false");
        }
      });

      // Elimina la sesión almacenada y recarga la página
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

  // Inicializa el cliente OAuth de Google una vez cargado el script externo
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

  // Dispara el flujo de consentimiento de Google al pulsar el botón correspondiente
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
  const verifyEmailTarget = document.getElementById("verify-email-target");
  const verifyForm = document.getElementById("verify-form");
  const verifyCodeInput = document.getElementById("verify-code");
  const verifyError = document.getElementById("verify-error");
  const btnBackToLogin = document.getElementById("btn-back-to-login");

  /** Correo pendiente de confirmación mediante código de 6 dígitos */
  let emailPendienteVerificar = '';

  // Reinicia ambos pasos del modal de acceso antes de mostrarlo
  btnOpenLogin?.addEventListener("click", () => {
    loginForm?.reset();
    verifyForm?.reset();
    if (loginError) loginError.hidden = true;
    if (verifyError) verifyError.hidden = true;
    if (authStep1) authStep1.hidden = false;
    if (authStep2) authStep2.hidden = true;
    loginModal?.showModal();
  });

  // Inicio de sesión con correo y contraseña contra `/api/login`
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

  // Registro de nueva cuenta y transición al paso de verificación por correo
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
      loginError.hidden = true;
      authStep1.hidden = true;
      authStep2.hidden = false;
      verifyCodeInput?.focus();

    } catch (error) {
      loginError.textContent = "Error de conexión al enviar el registro.";
      loginError.hidden = false;
    }
  });

  // Validación del código OTP de 6 dígitos enviado al usuario
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

      alert("¡Cuenta verificada con éxito! Ya puedes iniciar sesión.");
      
      authStep2.hidden = true;
      authStep1.hidden = false;
      document.getElementById("login-pass").value = "";
      document.getElementById("login-pass").focus();

    } catch (error) {
      verifyError.textContent = "Error al verificar el código.";
      verifyError.hidden = false;
    }
  });

  // Regresa del paso de verificación al formulario de inicio de sesión
  btnBackToLogin?.addEventListener("click", () => {
    authStep2.hidden = true;
    authStep1.hidden = false;
  });

  // =========================================================================
  // 5. MENÚ RESPONSIVE Y PESTAÑAS ACCESIBLES (ARIA)
  // =========================================================================
  const menu = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");

  /**
   * Contrae el menú de navegación móvil actualizando `aria-expanded`.
   */
  function closeMenu() {
    menu?.setAttribute("aria-expanded", "false");
  }

  menu?.addEventListener("click", () => {
    menu.setAttribute("aria-expanded", String(menu.getAttribute("aria-expanded") !== "true"));
  });
  nav?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && !event.target.closest(".site-header")) closeMenu();
  });
  const desktop = window.matchMedia("(min-width: 769px)");
  desktop.addEventListener("change", closeMenu);

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];

  /**
   * Activa una pestaña ARIA y muestra su panel asociado.
   * @param {HTMLElement} tab - Pestaña a seleccionar.
   * @param {boolean} [focus=false] - Indica si debe recibir el foco del teclado.
   */
  function activateTab(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
    if (focus) tab.focus();
  }

  // Navegación por clic y teclas de dirección entre pestañas
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let target;
      if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        activateTab(target, true);
      }
    });
  });
  if (tabs[0]) activateTab(tabs[0]);

  // =========================================================================
  // 6. VISOR MODAL DE GALERÍA DE INICIO Y GUARDIA DE RESERVAS
  // =========================================================================
  const gallery = document.getElementById("gallery-dialog");
  const enlarged = document.getElementById("gallery-image");
  const caption = document.getElementById("gallery-caption");
  const images = [...document.querySelectorAll(".gallery-item")];
  let current = 0;
  let opener = null;

  /**
   * Actualiza la fotografía mostrada y el pie de foto en el visor modal de portada.
   * @param {number} index - Índice de la miniatura seleccionada.
   */
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

  // Cierre genérico para todos los elementos <dialog> de la página
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

  // Verifica que el usuario tenga sesión antes de redirigir al asistente de reservas
  document.querySelectorAll("[data-booking]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sesion = sessionStorage.getItem("usuario");
      if (!sesion) {
        alert("Debes iniciar sesión para realizar una reserva.");
        document.getElementById("login-modal")?.showModal();
      } else {
        window.location.href = "html/reserva.html";
      }
    });
  });
})();