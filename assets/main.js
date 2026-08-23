/* ==========================================================================
   Sabzineh — Shared UI behaviors
   Vanilla JS only. Runs on every page.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Sticky header shadow on scroll ---- */
  var header = document.getElementById("main-nav");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 10) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---- Mobile menu toggle ---- */
  var menuBtn = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      var icon = menuBtn.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = isOpen ? "close" : "menu";
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Footer year ---- */
  var yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach(function (el) { el.textContent = new Date().getFullYear() + " / " + (1400 + (new Date().getFullYear() - 2021)); });

  /* ---- Toast helper (global) ---- */
  window.showToast = function (message, icon) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerHTML =
      '<span class="material-symbols-outlined text-tertiary-fixed-dim">' + (icon || "check_circle") + "</span>" +
      '<span>' + message + "</span>";
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  };

  /* ---- Apply store config to elements with data-config ---- */
  document.addEventListener("DOMContentLoaded", function () {
    if (!window.SABZINEH_CONFIG) return;
    var cfg = window.SABZINEH_CONFIG;
    document.querySelectorAll("[data-cfg-text]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-text");
      if (cfg[key] !== undefined) el.textContent = cfg[key];
    });
    document.querySelectorAll("[data-cfg-href]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-href");
      if (key === "telegram") el.href = "https://t.me/" + cfg.telegramUsername;
      else if (key === "whatsapp") el.href = "https://wa.me/" + cfg.whatsapp;
      else if (key === "phone") el.href = "tel:" + cfg.phone.replace(/[^0-9+]/g, "");
      else if (key === "mobile") el.href = "tel:" + cfg.mobile.replace(/[^0-9+]/g, "");
      else if (key === "instagram") el.href = "https://instagram.com/" + cfg.instagram;
    });
  });
})();
