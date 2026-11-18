(function () {
  "use strict";
  var DRAFT_KEY = "eal_products_draft", CFG_KEY = "eal_gh_cfg", TOK_KEY = "eal_gh_token", PATH = "products.json";
  var products = [];
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function status(msg, bad) { $("status").textContent = msg; $("status").className = "status" + (bad ? " err" : ""); }
  function setDirty(b) { $("dirty").hidden = !b; }
  function saveDraft() { localStorage.setItem(DRAFT_KEY, JSON.stringify(products)); setDirty(true); }
  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }

  // ---- GitHub connection settings ----
  function guess() {
    var m = /^(.+)\.github\.io$/.exec(location.hostname); if (!m) return {};
    var seg = location.pathname.split("/")[1];
    return { owner: m[1], repo: seg && seg !== "admin.html" ? seg : m[1] + ".github.io" };
  }
  function loadCfg() {
    var c = {}; try { c = JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) {}
    var g = guess();
    $("ghOwner").value = c.owner || g.owner || ""; $("ghRepo").value = c.repo || g.repo || ""; $("ghBranch").value = c.branch || "main";
    var t = localStorage.getItem(TOK_KEY) || sessionStorage.getItem(TOK_KEY) || "";
    $("ghToken").value = t; $("ghRemember").checked = !!localStorage.getItem(TOK_KEY);
    if (!t) $("gh").open = true;
  }
  function readCfg() {
    return { owner: $("ghOwner").value.trim(), repo: $("ghRepo").value.trim(), branch: $("ghBranch").value.trim() || "main", token: $("ghToken").value.trim() };
  }
  function persistCfg(c) {
    localStorage.setItem(CFG_KEY, JSON.stringify({ owner: c.owner, repo: c.repo, branch: c.branch }));
    localStorage.removeItem(TOK_KEY); sessionStorage.removeItem(TOK_KEY);
    (($("ghRemember").checked) ? localStorage : sessionStorage).setItem(TOK_KEY, c.token);
  }

  // ---- Publish: commit products.json to the repo via the GitHub API ----
  var ERRORS = {
    401: "The token is invalid or expired.",
    403: "The token cannot write to this repo. It needs Contents: Read and write.",
    404: "Repo or branch not found. Check username, repository and branch (a token without access also shows this).",
    409: "The file changed on GitHub meanwhile. Click Publish again.",
    422: "GitHub rejected the update. Check the branch name."
  };
  function fail(r) { status(ERRORS[r.status] || "GitHub error " + r.status + ".", true); }

  async function publish() {
    var c = readCfg();
    if (!c.owner || !c.repo || !c.token) { $("gh").open = true; status("Fill in the GitHub connection details first.", true); return; }
    persistCfg(c);
    var api = "https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + "/contents/" + PATH;
    var h = { Authorization: "Bearer " + c.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    $("publish").disabled = true; status("Publishing…");
    try {
      var g = await fetch(api + "?ref=" + encodeURIComponent(c.branch), { headers: h, cache: "no-store" });
      var sha;
      if (g.ok) sha = (await g.json()).sha; else if (g.status !== 404) { fail(g); return; }
      var body = { message: "Update products from admin panel", content: b64(JSON.stringify(products, null, 2) + "\n"), branch: c.branch };
      if (sha) body.sha = sha;
      var p = await fetch(api, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, h), body: JSON.stringify(body) });
      if (!p.ok) { fail(p); return; }
      localStorage.removeItem(DRAFT_KEY); setDirty(false);
      status("Published. GitHub Pages will show the changes in about 1 to 2 minutes.");
    } catch (e) { status("Network error. Check your connection and try again.", true); }
    finally { $("publish").disabled = false; }
  }
  $("publish").addEventListener("click", publish);

  // ---- Product list and form ----
  async function init() {
    loadCfg();
    try { var d = JSON.parse(localStorage.getItem(DRAFT_KEY)); if (Array.isArray(d)) { products = d; setDirty(true); } } catch (e) {}
    if (!products.length && $("dirty").hidden) {
      try { var r = await fetch(PATH + "?t=" + Date.now(), { cache: "no-store" }); products = await r.json(); } catch (e) { products = []; }
    }
    render();
  }

  function render() {
    var ul = $("list"); ul.textContent = "";
    $("count").textContent = "(" + products.length + ")";
    if (!products.length) ul.appendChild(el("li", "muted", "No products yet. Add your first one."));
    products.forEach(function (p) {
      var li = el("li"), info = el("div");
      info.appendChild(el("div", "t", p.title + " · " + p.price));
      info.appendChild(el("div", "m", p.url));
      var act = el("div", "actions");
      var ed = el("button", "btn ghost small", "Edit"); ed.type = "button";
      ed.addEventListener("click", function () { edit(p.id); });
      var del = el("button", "btn ghost small danger", "Delete"); del.type = "button";
      del.addEventListener("click", function () {
        if (!confirm("Delete \"" + p.title + "\"?")) return;
        products = products.filter(function (x) { return x.id !== p.id; }); saveDraft(); render(); resetForm();
      });
      act.appendChild(ed); act.appendChild(del); li.appendChild(info); li.appendChild(act); ul.appendChild(li);
    });
  }

  var fields = ["title", "description", "price", "category", "url", "image", "badge"];
  function edit(id) {
    var p = products.find(function (x) { return x.id === id; }); if (!p) return;
    $("id").value = p.id;
    fields.forEach(function (f) { $(f).value = p[f] || ""; });
    $("featured").checked = !!p.featured;
    $("formTitle").textContent = "Edit product"; $("save").textContent = "Save changes"; $("cancel").hidden = false;
    $("title").focus();
  }
  function resetForm() {
    $("form").reset(); $("id").value = ""; $("formErr").textContent = "";
    $("formTitle").textContent = "Add product"; $("save").textContent = "Add product"; $("cancel").hidden = true;
  }
  $("cancel").addEventListener("click", resetForm);

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var item = { id: $("id").value || "p" + Date.now() };
    fields.forEach(function (f) { item[f] = $(f).value.trim(); });
    item.featured = $("featured").checked;
    try { if (new URL(item.url).protocol !== "https:") throw 0; } catch (x) { $("formErr").textContent = "The Gumroad link must start with https://"; return; }
    if (item.image) { try { if (new URL(item.image).protocol !== "https:") throw 0; } catch (x) { $("formErr").textContent = "The image URL must start with https://"; return; } }
    var i = products.findIndex(function (p) { return p.id === item.id; });
    if (i > -1) products[i] = item; else products.push(item);
    saveDraft(); render(); resetForm(); status("Draft saved. Click Publish to put it on the live site.");
  });

  $("download").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "products.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  });

  $("import").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!Array.isArray(d) || d.some(function (p) { return !p || !p.title || !p.url; })) throw 0;
        products = d; saveDraft(); render();
      } catch (x) { alert("That file is not a valid products.json."); }
    };
    rd.readAsText(f); e.target.value = "";
  });

  $("reset").addEventListener("click", function () {
    if (confirm("Discard your draft and reload the live products.json?")) { localStorage.removeItem(DRAFT_KEY); products = []; setDirty(false); resetForm(); init(); }
  });

  init();
})();
