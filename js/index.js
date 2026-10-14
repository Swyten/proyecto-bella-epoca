/* Bella Época — Interacciones independientes, sin librerías ni envíos de datos. */
(() => {
  "use strict";
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
  document.querySelectorAll("[data-booking]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        !(booking instanceof HTMLDialogElement) ||
        typeof booking.showModal !== "function"
      )
        return;
      event.preventDefault();
      booking.showModal();
      booking.addEventListener("close", () => link.focus(), { once: true });
    });
  });
})();