/* Bella Época — Interacciones principales */
(() => {
  "use strict";

  // --- DETECCIÓN DE SESIÓN EN LA NAVEGACIÓN ---
  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const sesionGuardada = sessionStorage.getItem("usuario");

    if (sesionGuardada && btnOpenLogin) {
      const usuario = JSON.parse(sesionGuardada);
      btnOpenLogin.textContent = usuario.email.split('@')[0];
      btnOpenLogin.id = "btn-user-profile";
      
      btnOpenLogin.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("¿Deseas cerrar sesión?")) {
          sessionStorage.removeItem("usuario");
          window.location.reload();
        }
      });
    }
  });

  let googleClient;

  // --- INICIALIZAR GOOGLE OAUTH ---
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

  // --- LOGIN, REGISTRO Y VERIFICACIÓN POR CÓDIGO ---
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

  let emailPendienteVerificar = '';

  // Abrir modal y reiniciar a Paso 1
  btnOpenLogin?.addEventListener("click", () => {
    loginForm?.reset();
    verifyForm?.reset();
    if (loginError) loginError.hidden = true;
    if (verifyError) verifyError.hidden = true;
    if (authStep1) authStep1.hidden = false;
    if (authStep2) authStep2.hidden = true;
    loginModal?.showModal();
  });

  // 1. Iniciar sesión tradicional
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

  // 2. Registrar usuario -> envía correo con código y pasa al Paso 2
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

      // Transición al paso 2
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

  // 3. Confirmar código de verificación
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

  btnBackToLogin?.addEventListener("click", () => {
    authStep2.hidden = true;
    authStep1.hidden = false;
  });

  // --- TRANSICIONES DE ENTRADA DE PÁGINA ---
  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("animacion-volver") === "true") {
      document.body.style.animation = "slide-in-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
      sessionStorage.removeItem("animacion-volver");
    } else {
      document.body.style.animation = "slide-in-right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
    }
  });

  document.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      const href = enlace.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (href.includes("index.html")) {
        sessionStorage.setItem("animacion-volver", "true");
      }
    });
  });

  // --- MENÚ RESPONSIVE Y PESTAÑAS ---
  const menu = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
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

  // --- VISOR DE GALERÍA DE INICIO ---
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

  document.querySelectorAll("[data-booking]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "html/reserva.html";
    });
  });
})();