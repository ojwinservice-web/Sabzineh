/* ==========================================================================
   Sabzineh — Product rendering & catalog controller
   ========================================================================== */
(function () {
  "use strict";

  function fmt(n) { return n.toLocaleString("fa-IR"); }

  var STOCK_LABEL = {
    high: { text: "موجودی بالا", cls: "bg-primary/10 text-primary" },
    medium: { text: "موجودی محدود", cls: "bg-tertiary-fixed-dim/25 text-on-tertiary-container" },
    low: { text: "رو به اتمام", cls: "bg-error/10 text-error" }
  };

  function productCardHTML(p) {
    var stock = STOCK_LABEL[p.stock] || STOCK_LABEL.high;
    var badgesHtml = (p.badges || [])
      .map(function (b) {
        return '<span class="bg-tertiary-fixed text-on-tertiary-container px-2 py-0.5 rounded font-label-sm text-label-sm">' + b + "</span>";
      })
      .join("");

    return (
      '<div class="bg-surface rounded-xl border border-surface-variant overflow-hidden ambient-shadow flex flex-col product-card hover:border-primary-fixed-dim transition-colors" data-product-card data-category="' +
      p.category +
      '">' +
      '<a href="products.html#' + p.id + '" class="relative h-52 w-full bg-surface-container-lowest overflow-hidden block">' +
      '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" class="w-full h-full object-contain p-4"/>' +
      '<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">' +
      '<span class="' + stock.cls + ' px-2 py-1 rounded font-label-sm text-label-sm backdrop-blur-sm">' + stock.text + "</span>" +
      badgesHtml +
      "</div>" +
      "</a>" +
      '<div class="p-4 flex flex-col flex-1">' +
      '<div class="flex justify-between items-start mb-2 gap-2">' +
      '<span class="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed-dim/20 px-2 py-1 rounded whitespace-nowrap">' + p.categoryLabel + "</span>" +
      '<span class="font-label-sm text-label-sm text-secondary whitespace-nowrap">کد: ' + p.id + "</span>" +
      "</div>" +
      '<h3 class="font-title-md text-title-md text-primary mb-1">' + p.name + "</h3>" +
      '<p class="font-body-md text-[14px] text-on-surface-variant mb-4 line-clamp-2">' + p.desc + "</p>" +
      '<div class="mt-auto grid grid-cols-2 gap-2 mb-4 border-t border-surface-variant pt-4">' +
      '<div><span class="block font-label-sm text-label-sm text-secondary">حداقل سفارش</span>' +
      '<span class="font-body-md text-body-md text-primary font-medium">' + p.moq + " " + (p.category === "pickles" || p.category === "portion" ? "کارتن" : "دبه") + "</span></div>" +
      '<div><span class="block font-label-sm text-label-sm text-secondary">قیمت واحد</span>' +
      '<span class="font-body-md text-body-md text-primary font-medium">' + fmt(p.price) + " تومان</span></div>" +
      "</div>" +
      '<div class="flex items-center gap-2">' +
      '<div class="flex items-center border border-outline-variant rounded-lg overflow-hidden h-10 w-24 qty-stepper flex-shrink-0">' +
      '<button type="button" class="px-2 text-secondary hover:text-primary hover:bg-surface-container-low h-full flex items-center justify-center" data-step="inc"><span class="material-symbols-outlined text-[18px]">add</span></button>' +
      '<input type="number" min="1" value="' + p.moq + '" data-qty-input class="w-full h-full text-center border-none font-body-md text-primary bg-transparent focus:ring-0 p-0"/>' +
      '<button type="button" class="px-2 text-secondary hover:text-primary hover:bg-surface-container-low h-full flex items-center justify-center" data-step="dec"><span class="material-symbols-outlined text-[18px]">remove</span></button>' +
      "</div>" +
      '<button type="button" class="flex-1 bg-primary text-on-primary h-10 rounded-lg font-label-sm text-label-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2" data-add-to-cart="' + p.id + '">' +
      '<span class="material-symbols-outlined text-[18px]">shopping_cart</span><span>افزودن به سبد</span>' +
      "</button>" +
      "</div></div></div>"
    );
  }

  function wireStepper(root) {
    root.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest("[data-product-card]");
        var input = card.querySelector("[data-qty-input]");
        var val = parseInt(input.value, 10) || 1;
        val = btn.getAttribute("data-step") === "inc" ? val + 1 : Math.max(1, val - 1);
        input.value = val;
      });
    });
  }

  function renderInto(containerId, list) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!list.length) {
      el.innerHTML =
        '<div class="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3">' +
        '<span class="material-symbols-outlined text-5xl text-outline-variant">search_off</span>' +
        '<p class="text-on-surface-variant">محصولی با این مشخصات یافت نشد</p>' +
        "</div>";
      return;
    }
    el.innerHTML = list.map(productCardHTML).join("");
    wireStepper(el);
  }

  window.SabzinehProducts = {
    fmt: fmt,
    renderInto: renderInto,
    cardHTML: productCardHTML
  };

  /* ---- Catalog controller (products.html) ---- */
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("product-grid");
    if (!grid) return; // not on products page

    var all = window.SABZINEH_PRODUCTS || [];
    var params = new URLSearchParams(window.location.search);
    var initialCat = params.get("cat") || "all";
    var initialQuery = params.get("q") || "";
    var state = { category: initialCat, query: initialQuery, sort: "default" };

    function apply() {
      var list = all.slice();

      if (state.category !== "all") {
        list = list.filter(function (p) { return p.category === state.category; });
      }
      if (state.query.trim()) {
        var q = state.query.trim().toLowerCase();
        list = list.filter(function (p) {
          return (
            p.name.toLowerCase().indexOf(q) !== -1 ||
            p.brand.toLowerCase().indexOf(q) !== -1 ||
            p.desc.toLowerCase().indexOf(q) !== -1
          );
        });
      }
      if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
      else if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
      else if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "fa"); });

      renderInto("product-grid", list);

      var countEl = document.getElementById("results-count");
      if (countEl) countEl.textContent = list.length;
    }

    document.querySelectorAll("[data-filter-category]").forEach(function (chip) {
      var isInitial = chip.getAttribute("data-filter-category") === initialCat;
      chip.setAttribute("data-active", isInitial ? "true" : "false");
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-filter-category]").forEach(function (c) { c.setAttribute("data-active", "false"); });
        chip.setAttribute("data-active", "true");
        state.category = chip.getAttribute("data-filter-category");
        apply();
      });
    });

    var searchInput = document.getElementById("product-search");
    if (searchInput) {
      searchInput.value = initialQuery;
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value;
        apply();
      });
    }

    var sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        apply();
      });
    }

    apply();
  });

  /* ---- Featured products (index.html) ---- */
  document.addEventListener("DOMContentLoaded", function () {
    var el = document.getElementById("featured-grid");
    if (!el) return;
    var all = window.SABZINEH_PRODUCTS || [];
    var featured = all.filter(function (p) { return (p.badges || []).length > 0; });
    if (featured.length < 4) featured = all.slice(0, 4);
    renderInto("featured-grid", featured.slice(0, 4));
  });
})();
