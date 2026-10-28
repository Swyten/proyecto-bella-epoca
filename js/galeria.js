/* Bella Época — Galería: filtros y visor de imágenes, sin librerías. */
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

  // Datos de la galería: sustituir por las fotografías reales del local.
  // img: ruta del archivo (relativa a html/, por eso ../img/...).
  // cat: sala | reservados | musica (debe coincidir con los filtros).
  // tamano: "" (normal), "tall" (doble de alto) o "wide" (doble de ancho).
  // pos (opcional): recorte de la imagen, p. ej. "center 30%".
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

  // --- VISOR DE IMÁGENES ---
  const dialog = document.getElementById("gallery-dialog");
  const enlarged = document.getElementById("gallery-image");
  const caption = document.getElementById("gallery-caption");
  let imagenes = [];
  let current = 0;
  let opener = null;

  function updateImage(index) {
    current = (index + imagenes.length) % imagenes.length;
    const link = imagenes[current];
    const image = link?.querySelector("img");
    if (!link || !image || !enlarged || !caption) return;
    enlarged.src = link.getAttribute("href");
    enlarged.alt = image.alt;
    caption.textContent = `${image.alt} — ${current + 1} / ${imagenes.length}`;
  }

  // --- RENDERIZADO Y FILTROS ---
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

  tabs.forEach((t) => t.addEventListener("click", () => render(t.dataset.filter)));

  // --- APERTURA DEL VISOR ---
  grid.addEventListener("click", (event) => {
    const link = event.target.closest(".gallery-item");
    if (!link || !(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== "function") return;
    event.preventDefault();
    opener = link;
    updateImage(imagenes.indexOf(link));
    dialog.showModal();
  });

  document
    .querySelector("[data-gallery-prev]")
    ?.addEventListener("click", () => updateImage(current - 1));
  document
    .querySelector("[data-gallery-next]")
    ?.addEventListener("click", () => updateImage(current + 1));
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
  dialog?.addEventListener("close", () => opener?.focus());

  // Abre el filtro indicado en la URL (galeria.html#musica) o "Todas".
  const inicial = location.hash.slice(1);
  render(["todas", "sala", "reservados", "musica"].includes(inicial) ? inicial : "todas");
})();
