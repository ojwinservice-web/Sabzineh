/* ==========================================================================
   Sabzineh — Cart (localStorage) + Telegram checkout
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "sabzineh_cart_v1";

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) { /* storage unavailable — ignore */ }
    renderCartBadge();
    renderCartDrawer();
  }

  function findProduct(id) {
    var list = window.SABZINEH_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function addToCart(id, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var cart = readCart();
    var item = cart.find(function (c) { return c.id === id; });
    if (item) item.qty += qty;
    else cart.push({ id: id, qty: qty });
    writeCart(cart);
    var product = findProduct(id);
    if (window.showToast) {
      window.showToast((product ? product.name : "محصول") + " به سبد خرید افزوده شد", "shopping_cart");
    }
  }

  function updateQty(id, qty) {
    qty = parseInt(qty, 10) || 1;
    var cart = readCart();
    var item = cart.find(function (c) { return c.id === id; });
    if (!item) return;
    if (qty <= 0) {
      cart = cart.filter(function (c) { return c.id !== id; });
    } else {
      item.qty = qty;
    }
    writeCart(cart);
  }

  function removeFromCart(id) {
    var cart = readCart().filter(function (c) { return c.id !== id; });
    writeCart(cart);
  }

  function clearCart() {
    writeCart([]);
  }

  function cartCount() {
    return readCart().reduce(function (sum, c) { return sum + c.qty; }, 0);
  }

  function cartTotal() {
    var cart = readCart();
    var total = 0;
    cart.forEach(function (c) {
      var p = findProduct(c.id);
      if (p) total += p.price * c.qty;
    });
    return total;
  }

  function fmtPrice(n) {
    return n.toLocaleString("fa-IR");
  }

  function renderCartBadge() {
    var count = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = count;
      el.classList.toggle("hidden", count === 0);
    });
  }

  function renderCartDrawer() {
    var body = document.getElementById("cart-drawer-body");
    var footer = document.getElementById("cart-drawer-footer");
    if (!body) return;
    var cart = readCart();

    if (cart.length === 0) {
      body.innerHTML =
        '<div class="flex flex-col items-center justify-center h-full gap-3 text-center px-8 py-16">' +
        '<span class="material-symbols-outlined text-5xl text-outline-variant">shopping_cart</span>' +
        '<p class="text-on-surface-variant font-body-md">سبد خرید شما خالی است</p>' +
        '<a href="products.html" class="mt-2 text-primary font-title-md underline">مشاهده محصولات</a>' +
        "</div>";
      if (footer) footer.classList.add("hidden");
      return;
    }

    if (footer) footer.classList.remove("hidden");

    var html = "";
    cart.forEach(function (c) {
      var p = findProduct(c.id);
      if (!p) return;
      html +=
        '<div class="flex gap-3 p-4 border-b border-surface-variant items-center">' +
        '<img src="' + p.image + '" alt="' + p.name + '" class="w-16 h-16 rounded-lg object-cover bg-surface-container-low flex-shrink-0"/>' +
        '<div class="flex-1 min-w-0">' +
        '<h4 class="font-title-md text-[15px] text-primary line-clamp-2">' + p.name + "</h4>" +
        '<p class="text-label-sm text-secondary mt-0.5">' + p.unit + "</p>" +
        '<div class="flex items-center justify-between mt-2">' +
        '<div class="flex items-center border border-outline-variant rounded-lg overflow-hidden h-8 qty-stepper">' +
        '<button class="px-2 h-full text-secondary hover:text-primary hover:bg-surface-container-low" data-cart-inc="' + p.id + '"><span class="material-symbols-outlined text-[16px]">add</span></button>' +
        '<input type="number" min="1" value="' + c.qty + '" data-cart-input="' + p.id + '" class="w-10 h-full text-center border-none bg-transparent text-sm p-0 focus:ring-0"/>' +
        '<button class="px-2 h-full text-secondary hover:text-primary hover:bg-surface-container-low" data-cart-dec="' + p.id + '"><span class="material-symbols-outlined text-[16px]">remove</span></button>' +
        "</div>" +
        '<span class="font-title-md text-[14px] text-primary">' + fmtPrice(p.price * c.qty) + " ت</span>" +
        "</div></div>" +
        '<button class="text-secondary hover:text-error transition-colors" data-cart-remove="' + p.id + '" aria-label="حذف">' +
        '<span class="material-symbols-outlined text-[20px]">delete</span></button>' +
        "</div>";
    });
    body.innerHTML = html;

    var totalEl = document.getElementById("cart-drawer-total");
    if (totalEl) totalEl.textContent = fmtPrice(cartTotal()) + " تومان";

    // Wire up controls
    body.querySelectorAll("[data-cart-inc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-cart-inc");
        var item = readCart().find(function (c) { return c.id === id; });
        updateQty(id, (item ? item.qty : 0) + 1);
      });
    });
    body.querySelectorAll("[data-cart-dec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-cart-dec");
        var item = readCart().find(function (c) { return c.id === id; });
        updateQty(id, (item ? item.qty : 1) - 1);
      });
    });
    body.querySelectorAll("[data-cart-input]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        updateQty(inp.getAttribute("data-cart-input"), inp.value);
      });
    });
    body.querySelectorAll("[data-cart-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeFromCart(btn.getAttribute("data-cart-remove"));
      });
    });
  }

  function buildTelegramOrderText() {
    var cart = readCart();
    var cfg = window.SABZINEH_CONFIG || {};
    var lines = [];
    lines.push("سفارش جدید از سایت " + (cfg.storeNameEn || "Sabzineh") + ":");
    lines.push("");
    cart.forEach(function (c) {
      var p = findProduct(c.id);
      if (!p) return;
      lines.push("• " + p.name + " — تعداد: " + c.qty + " (" + p.unit + ") — " + fmtPrice(p.price * c.qty) + " تومان");
    });
    lines.push("");
    lines.push("جمع کل: " + fmtPrice(cartTotal()) + " تومان");
    return lines.join("\n");
  }

  function openTelegramCheckout() {
    var cart = readCart();
    if (cart.length === 0) {
      if (window.showToast) window.showToast("سبد خرید شما خالی است", "info");
      return;
    }
    var cfg = window.SABZINEH_CONFIG || {};
    var text = buildTelegramOrderText();
    var url = "https://t.me/" + (cfg.telegramUsername || "Sabzinehco_bot") + "?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener");
  }

  function openDrawer() {
    var overlay = document.getElementById("cart-overlay");
    var drawer = document.getElementById("cart-drawer");
    if (overlay) overlay.classList.add("open");
    if (drawer) drawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    var overlay = document.getElementById("cart-overlay");
    var drawer = document.getElementById("cart-drawer");
    if (overlay) overlay.classList.remove("open");
    if (drawer) drawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  // Expose API
  window.SabzinehCart = {
    add: addToCart,
    update: updateQty,
    remove: removeFromCart,
    clear: clearCart,
    count: cartCount,
    total: cartTotal,
    open: openDrawer,
    close: closeDrawer,
    checkoutTelegram: openTelegramCheckout,
    fmtPrice: fmtPrice
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderCartBadge();
    renderCartDrawer();

    document.querySelectorAll("[data-cart-open]").forEach(function (btn) {
      btn.addEventListener("click", openDrawer);
    });
    document.querySelectorAll("[data-cart-close]").forEach(function (btn) {
      btn.addEventListener("click", closeDrawer);
    });
    var overlay = document.getElementById("cart-overlay");
    if (overlay) overlay.addEventListener("click", closeDrawer);

    var checkoutBtn = document.getElementById("cart-checkout-telegram");
    if (checkoutBtn) checkoutBtn.addEventListener("click", openTelegramCheckout);

    var clearBtn = document.getElementById("cart-clear");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      clearCart();
      if (window.showToast) window.showToast("سبد خرید خالی شد", "delete_sweep");
    });

    // Delegate "add to cart" buttons rendered anywhere on the page
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add-to-cart]");
      if (!btn) return;
      var id = btn.getAttribute("data-add-to-cart");
      var card = btn.closest("[data-product-card]");
      var qtyInput = card ? card.querySelector("[data-qty-input]") : null;
      var qty = qtyInput ? qtyInput.value : 1;
      addToCart(id, qty);
    });
  });
})();
