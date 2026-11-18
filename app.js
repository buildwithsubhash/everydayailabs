(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // Set to true to open Gumroad checkout as a popup on your page instead of redirecting.
  var USE_OVERLAY = false;

  var DRAFT_KEY = "eal_products_draft";
  var HUES = [225, 155, 32, 330, 270, 190];
  var FALLBACK = [{ id: "p0", title: "Daily Prompt Pack", description: "Tested prompts for everyday work.", price: "$12", category: "Prompts", url: "https://gumroad.com/", image: "", badge: "", featured: false }];
  var grid = document.getElementById("grid");
  var filters = document.getElementById("filters");
  var products = [], cats = [], active = "All";

  document.getElementById("yr").textContent = new Date().getFullYear();

  function safeUrl(u) { try { var x = new URL(u); return x.protocol === "https:" ? x.href : "#"; } catch (e) { return "#"; } }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function tint(node, cat) {
    var h = HUES[Math.max(0, cats.indexOf(cat)) % HUES.length];
    node.style.setProperty("--c", "hsl(" + h + " 70% 42%)");
    node.style.setProperty("--ct", "hsl(" + h + " 90% 96%)");
  }

  async function load() {
    if (new URLSearchParams(location.search).has("preview")) {
      try { var d = JSON.parse(localStorage.getItem(DRAFT_KEY)); if (Array.isArray(d)) return d; } catch (e) {}
    }
    try {
      var r = await fetch("products.json?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) throw new Error("bad status");
      return await r.json();
    } catch (e) { return FALLBACK; }
  }

  function renderStack() {
    var s = document.getElementById("stack");
    products.slice(0, 3).forEach(function (p) {
      var m = el("div", "mini"); tint(m, p.category);
      m.appendChild(el("small", "", p.category || "Product"));
      m.appendChild(el("b", "", p.title));
      m.appendChild(el("span", "", p.price));
      s.appendChild(m);
    });
  }

  function renderFilters() {
    filters.textContent = "";
    if (cats.length < 2) return;
    ["All"].concat(cats).forEach(function (c) {
      var b = el("button", "chip", c); b.type = "button";
      b.setAttribute("aria-pressed", String(c === active));
      b.addEventListener("click", function () { active = c; renderFilters(); renderGrid(); });
      filters.appendChild(b);
    });
  }

  function renderGrid() {
    grid.textContent = "";
    var list = products.filter(function (p) { return active === "All" || p.category === active; })
      .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    if (!list.length) { grid.appendChild(el("p", "muted", "No products yet. Check back soon.")); return; }
    list.forEach(function (p) {
      var card = el("article", "card reveal" + (p.featured && active === "All" ? " featured" : ""));
      tint(card, p.category);
      var thumb = el("div", "thumb");
      if (p.image) {
        var img = document.createElement("img");
        img.src = safeUrl(p.image); img.alt = ""; img.loading = "lazy"; thumb.appendChild(img);
      } else { thumb.textContent = (p.title || "?").charAt(0); }
      if (p.badge) thumb.appendChild(el("span", "badge", p.badge));
      var body = el("div", "body");
      if (p.category) body.appendChild(el("span", "cat", p.category));
      body.appendChild(el("h3", "", p.title));
      body.appendChild(el("p", "", p.description));
      var buy = el("div", "buy");
      buy.appendChild(el("span", "price", p.price));
      var a = el("a", "btn" + (USE_OVERLAY ? " gumroad-button" : ""), "Buy on Gumroad");
      a.href = safeUrl(p.url);
      if (!USE_OVERLAY) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      a.setAttribute("aria-label", "Buy " + p.title + " on Gumroad");
      buy.appendChild(a); body.appendChild(buy);
      card.appendChild(thumb); card.appendChild(body); grid.appendChild(card);
    });
    observe();
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  function observe() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (n) { io ? io.observe(n) : n.classList.add("in"); });
  }

  window.addEventListener("scroll", function () { document.body.classList.toggle("scrolled", window.scrollY > 520); }, { passive: true });

  load().then(function (data) {
    products = data;
    cats = Array.from(new Set(products.map(function (p) { return p.category; }).filter(Boolean)));
    renderStack(); renderFilters(); renderGrid(); observe();
    if (USE_OVERLAY) { var s = document.createElement("script"); s.src = "https://gumroad.com/js/gumroad.js"; document.body.appendChild(s); }
  });
})();
