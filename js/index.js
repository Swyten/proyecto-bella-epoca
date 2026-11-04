/* Bella Época — Interacciones independientes, sin librerías ni envíos de datos. */
(() => {
  "use strict";

  let googleClient;

// 1. Inicializar el cliente de Google cuando cargue la ventana
  window.onload = () => {
    if (window.google) {
      googleClient = google.accounts.oauth2.initTokenClient({
        client_id: 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com',
        scope: 'email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            try {
              // 2. Enviar el token recibido de Google a nuestro backend
              const res = await fetch('/api/auth-google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenResponse.access_token })
              });
              
              const data = await res.json();
              
              if (!res.ok) {
                throw new Error(data.error || 'Error en la autenticación con Google');
              }

              // 3. Guardar sesión y cerrar el modal de login
              sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
              
              const modal = document.getElementById("login-modal");
              if (modal && typeof modal.close === 'function') {
                modal.close();
              }
              
              alert(`¡Bienvenido, ${data.usuario.email}! Sesión iniciada correctamente.`);
              
              // Opcional: recargar o redirigir a la vista de usuario
              window.location.reload();

            } catch (err) {
              alert(err.message);
            }
          }
        },
      });
    }
  };

// 4. Activar la ventana emergente de Google al hacer clic en el botón personalizado
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

  // --- LOGIN Y REGISTRO ---
  const loginModal = document.getElementById("login-modal");
  const btnOpenLogin = document.getElementById("btn-open-login");
  const loginForm = document.getElementById("login-form");
  const btnRegister = document.getElementById("btn-register");
  const loginError = document.getElementById("login-error");

  // Abrir modal
  btnOpenLogin?.addEventListener("click", () => {
    loginForm.reset();
    loginError.hidden = true;
    loginModal?.showModal();
  });

  // Función para manejar Login/Registro
  async function authRequest(endpoint) {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-pass").value;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.error || "Error en la petición";
        loginError.hidden = false;
        return;
      }

      // Éxito
      loginError.hidden = true;
      if (endpoint === '/api/login') {
        alert(`Bienvenido, rol: ${data.usuario.rol}`);
        // Aquí puedes guardar el usuario en sessionStorage
        sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
        loginModal.close();
      } else {
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
      }
    } catch (error) {
      loginError.textContent = "Error de conexión con el servidor.";
      loginError.hidden = false;
    }
  }

  // Evento Iniciar Sesión (Submit del form)
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    authRequest('/api/login');
  });

  // Evento Registrarse (Botón secundario)
  btnRegister?.addEventListener("click", () => {
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }
    authRequest('/api/registro');
  });
  
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

  const menu = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
  function closeMenu() {
    menu?.setAttribute("aria-expanded", "false");
  }
  menu?.addEventListener("click", () => {
    menu.setAttribute(
      "aria-expanded",
      String(menu.getAttribute("aria-expanded") !== "true"),
    );
  });
  nav?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a"))
      closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu?.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      !event.target.closest(".site-header")
    )
      closeMenu();
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
      if (event.key === "ArrowLeft")
        target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        activateTab(target, true);
      }
    });
  });
  if (tabs[0]) activateTab(tabs[0]);

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
      if (
        !(gallery instanceof HTMLDialogElement) ||
        typeof gallery.showModal !== "function"
      )
        return;
      event.preventDefault();
      opener = link;
      updateImage(index);
      gallery.showModal();
    });
  });
  document
    .querySelector("[data-gallery-prev]")
    ?.addEventListener("click", () => updateImage(current - 1));
  document
    .querySelector("[data-gallery-next]")
    ?.addEventListener("click", () => updateImage(current + 1));
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

  // No se simulan reservas, pagos ni altas de newsletter.
  const booking = document.getElementById("booking-dialog");
  // Redirigir a la página de reservas en lugar de abrir el modal
  document.querySelectorAll("[data-booking]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Evita que salte el ancla (href="#contacto")
      window.location.href = "html/reserva.html"; // Redirige a la página física
    });
  });
})();