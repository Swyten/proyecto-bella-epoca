/* Bella Época — Galería: filtros y visor de imágenes, sin librerías. */
(() => {
  "use strict";

  // =========================================================================
  // 1. GESTIÓN DE SESIÓN Y MENÚ DESPLEGABLE DE PERFIL
  // =========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const btnOpenLogin = document.getElementById("btn-open-login");
    const userWrapper = document.getElementById("user-profile-wrapper");
    const btnUserProfile = document.getElementById("btn-user-profile");
    const userNameLabel = document.getElementById("user-name-label");
    const userEmailInfo = document.getElementById("user-email-info");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const btnLogout = document.getElementById("btn-logout");
    const nav = document.getElementById("site-nav");

    const sesionGuardada = sessionStorage.getItem("usuario");

    if (sesionGuardada && userWrapper) {
      const usuario = JSON.parse(sesionGuardada);
      if (btnOpenLogin) btnOpenLogin.hidden = true;
      userWrapper.hidden = false;

      // Muestra el alias del correo y el email completo en el desplegable
      if (userNameLabel) userNameLabel.textContent = usuario.email.split('@')[0];
      if (userEmailInfo) userEmailInfo.textContent = usuario.email;

      // Inyecta el acceso al panel de mesas si el usuario pertenece al personal
      if (usuario.rol === 'empleado' || usuario.rol === 'administrador') {
        const enlaceGestion = document.createElement("a");
        enlaceGestion.href = "gestion-mesas.html";
        enlaceGestion.textContent = "Gestión de Mesas";
        nav.insertBefore(enlaceGestion, userWrapper);
      }

      // Alterna la apertura y cierre del menú de perfil
      btnUserProfile?.addEventListener("click", (e) => {
        e.stopPropagation();
        const estaAbierto = !userDropdownMenu.hidden;
        userDropdownMenu.hidden = estaAbierto;
        btnUserProfile.setAttribute("aria-expanded", String(!estaAbierto));
      });

      // Cierra el desplegable al hacer clic fuera del contenedor
      document.addEventListener("click", (e) => {
        if (userWrapper && !userWrapper.contains(e.target)) {
          if (userDropdownMenu) userDropdownMenu.hidden = true;
          btnUserProfile?.setAttribute("aria-expanded", "false");
        }
      });

      // Cierra la sesión activa y redirige a la portada
      btnLogout?.addEventListener("click", () => {
        sessionStorage.removeItem("usuario");
        window.location.href = "../index.html";
      });
    } else {
      // Si no hay sesión, redirige al inicio para abrir el modal de acceso
      if (btnOpenLogin) {
        btnOpenLogin.hidden = false;
        btnOpenLogin.addEventListener("click", () => {
          window.location.href = "../index.html";
        });
      }
      if (userWrapper) userWrapper.hidden = true;
    }
  });

  // =========================================================================
  // 2. CATÁLOGO DE IMÁGENES Y REFERENCIAS DEL DOM
  // =========================================================================

  /**
   * Colección de fotografías de la galería con su categoría y distribución en rejilla.
   * @type {Array<{img: string, alt: string, cat: string, tamano?: string, pos?: string}>}
   */
  const GALERIA = [
    { img: "../img/bella-epoca-sala.jpg", alt: "Salón principal bajo la lámpara de cristal", cat: "sala", tamano: "wide" },
    { img: "../img/bella-epoca-vip.jpg", alt: "Cócteles en la zona reservada", cat: "reservados", tamano: "tall" },
    { img: "../img/bella-epoca-dj.jpg", alt: "Sesión musical desde la cabina", cat: "musica" },
    { img: "../img/bella-epoca-sala.jpg", alt: "Detalles dorados de la arquitectura", cat: "sala", pos: "center 30%" },
    { img: "../img/bella-epoca-dj.jpg", alt: "El pulso de la pista de baile", cat: "musica", tamano: "tall" },
    { img: "../img/bella-epoca-vip.jpg", alt: "Encuentro alrededor de la mesa reservada", cat: "reservados", tamano: "wide" },
    { img: "../img/bella-epoca-sala.jpg", alt: "La barra principal del salón", cat: "sala", pos: "center 70%" },
    { img: "../img/bella-epoca-vip.jpg", alt: "Brindis bajo la lámpara central", cat: "reservados" },
    { img: "../img/bella-epoca-dj.jpg", alt: "Luces y silueta del artista", cat: "musica", tamano: "wide" },
    { img: "../img/bella-epoca-sala.jpg", alt: "El ambiente antes de la medianoche", cat: "sala", tamano: "tall" },
    { img: "../img/bella-epoca-vip.jpg", alt: "Cóctel de autor de la casa", cat: "reservados", pos: "center 20%" },
    { img: "../img/bella-epoca-dj.jpg", alt: "Cierre de noche en la cabina", cat: "musica" },
  ];

  const grid = document.getElementById("gallery-grid");
  const count = document.getElementById("gallery-count");
  const tabs = [...document.querySelectorAll("[data-filter]")];
  if (!grid) return;

  const dialog = document.getElementById("gallery-dialog");
  const enlarged = document.getElementById("gallery-image");
  const caption = document.getElementById("gallery-caption");

  /** Lista de enlaces de imagen renderizados actualmente en pantalla */
  let imagenes = [];
  /** Índice de la imagen activa dentro del visor modal */
  let current = 0;
  /** Elemento que abrió el modal para devolverle el foco al cerrarse */
  let opener = null;

  // =========================================================================
  // 3. VISOR MODAL (LIGHTBOX) Y RENDERIZADO DE REJILLA
  // =========================================================================

  /**
   * Actualiza la imagen ampliada, el texto alternativo y el contador dentro del modal.
   * Permite navegación circular en ambos sentidos.
   * @param {number} index - Índice de la imagen a mostrar.
   */
  function updateImage(index) {
    current = (index + imagenes.length) % imagenes.length;
    const link = imagenes[current];
    const image = link?.querySelector("img");
    if (!link || !image || !enlarged || !caption) return;
    enlarged.src = link.getAttribute("href");
    enlarged.alt = image.alt;
    caption.textContent = `${image.alt} — ${current + 1} / ${imagenes.length}`;
  }

  /**
   * Filtra el catálogo por categoría, construye el mosaico HTML y sincroniza
   * el contador de resultados y los atributos ARIA de las pestañas.
   * @param {string} filtro - Categoría seleccionada ("todas", "sala", "reservados", "musica").
   */
  function render(filtro) {
    const lista = filtro === "todas" ? GALERIA : GALERIA.filter((foto) => foto.cat === filtro);
    grid.innerHTML = lista
      .map(
        (foto) => `
      <a class="gallery-item${foto.tamano ? ` gallery-item--${foto.tamano}` : ""}" href="${foto.img}" data-cat="${foto.cat}" aria-label="Ampliar: ${foto.alt}"
        ><img
          src="${foto.img}"
          alt="${foto.alt}"
          width="1536"
          height="1024"
          loading="lazy"
          decoding="async"${foto.pos ? ` style="object-position:${foto.pos}"` : ""} /></a>`
      )
      .join("");
    imagenes = [...grid.querySelectorAll(".gallery-item")];
    count.textContent = `${lista.length} ${lista.length === 1 ? "imagen" : "imágenes"}`;
    tabs.forEach((t) => {
      const activo = t.dataset.filter === filtro;
      t.setAttribute("aria-selected", String(activo));
      if (activo) grid.setAttribute("aria-labelledby", t.id);
    });
  }

  // =========================================================================
  // 4. EVENTOS DE FILTRADO, NAVEGACIÓN POR TECLADO Y CIERRE DE DIÁLOGOS
  // =========================================================================

  // Filtrado al pulsar cada pestaña de categoría
  tabs.forEach((t) => t.addEventListener("click", () => render(t.dataset.filter)));

  // Delegación de clics en la rejilla para abrir la imagen seleccionada en el visor
  grid.addEventListener("click", (event) => {
    const link = event.target.closest(".gallery-item");
    if (!link || !(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== "function") return;
    event.preventDefault();
    opener = link;
    updateImage(imagenes.indexOf(link));
    dialog.showModal();
  });

  // Controles de navegación anterior / siguiente en el modal
  document
    .querySelector("[data-gallery-prev]")
    ?.addEventListener("click", () => updateImage(current - 1));
  document
    .querySelector("[data-gallery-next]")
    ?.addEventListener("click", () => updateImage(current + 1));

  // Soporte de flechas izquierda/derecha cuando el visor está abierto
  dialog?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateImage(current + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateImage(current - 1);
    }
  });

  // Cierre mediante botones explícitos con atributo [data-dialog-close]
  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });

  // Cierre al hacer clic en el fondo oscuro (backdrop) fuera de la caja del modal
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

  // Restaura el foco al enlace original cuando se cierra el visor
  dialog?.addEventListener("close", () => opener?.focus());

  // Inicializa la galería leyendo el hash de la URL (si existe) o mostrando todas
  const inicial = location.hash.slice(1);
  render(["todas", "sala", "reservados", "musica"].includes(inicial) ? inicial : "todas");
})();