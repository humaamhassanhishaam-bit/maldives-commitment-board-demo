/* Review demo: stands in for server.py inside the viewer's browser.
   Answers the same /api/* calls the real pages make, keeps data in this browser only,
   and adds a "prototype" label with a reset button. Not used by the real deployment. */
(function () {
  "use strict";
  var KEY = "cb-review-demo-v1";
  var DEMO_PASSWORD = "demo";

  var TYPES = {
    individual: ["individual", "Individual"],
    ministry: ["government", "Ministry / government agency"],
    island_council: ["government", "Island council"],
    atoll_council: ["government", "Atoll council"],
    city_council: ["government", "City council"],
    wdc: ["government", "Women's Development Committee"],
    justice_sector: ["government", "Police / justice sector"],
    independent: ["government", "Independent institution"],
    cso: ["organisation", "Civil society / NGO"],
    gbv_service: ["organisation", "GBV service provider"],
    private: ["organisation", "Private sector"],
    media: ["organisation", "Media"],
    education: ["organisation", "School / academic institution"],
    partner: ["organisation", "UN / development partner"],
    other_org: ["organisation", "Other organisation"]
  };
  var PILLARS = { prevention: 1, support: 1, justice: 1 };
  var ATOLLS = ["national", "haa_alif", "haa_dhaalu", "shaviyani", "noonu", "raa", "baa", "lhaviyani", "kaafu",
    "alif_alif", "alif_dhaal", "vaavu", "faafu", "meemu", "dhaalu", "thaa", "laamu",
    "gaafu_alif", "gaafu_dhaalu", "gnaviyani", "addu"];

  function iso(minsAgo) { return new Date(Date.now() - minsAgo * 60000).toISOString().replace(/\.\d+Z$/, "Z"); }
  function row(id, status, type, org, atoll, island, pillar, text, extra) {
    var r = { id: id, created_at: iso(600 - id * 20), status: status, org: org, display_public: 1,
      reporter_type: type, level: TYPES[type][0], atoll: atoll, island: island, pillar: pillar, text: text,
      contact: null, reviewed_at: status === "pending" ? null : iso(300 - id * 10), reviewer_note: null };
    for (var k in extra || {}) r[k] = extra[k];
    return r;
  }
  function seed() {
    var items = [
      row(1, "approved", "ministry", "Sample Ministry A", "kaafu", "Malé", "prevention", "Integrate digital safety and online-abuse awareness into national school programmes."),
      row(2, "approved", "cso", "Sample Civil Society B", "addu", "Hithadhoo", "support", "Offer a confidential helpline and peer support for people facing online harassment."),
      row(3, "approved", "justice_sector", "Sample Authority C", "national", null, "justice", "Streamline reporting and investigation of non-consensual sharing of intimate images."),
      row(4, "approved", "private", "Sample Telecom D", "kaafu", "Hulhumalé", "prevention", "Run public awareness campaigns on safe use of mobile technology and reporting tools."),
      row(5, "approved", "island_council", "Sample Council E", "haa_dhaalu", "Kulhudhuffushi", "support", "Train island-level responders to refer survivors of TFGBV to services."),
      row(6, "approved", "gbv_service", "Sample Service Provider F", "laamu", "Fonadhoo", "support", "Expand counselling services to include digital-abuse case management."),
      row(7, "approved", "independent", "Sample Institution G", "gaafu_dhaalu", "Thinadhoo", "justice", "Publish annual data on TFGBV cases handled to strengthen accountability."),
      row(8, "approved", "cso", "Sample Network H", "noonu", "Manadhoo", "prevention", "Engage young people as digital safety champions in their communities."),
      row(9, "approved", "island_council", "Sample Council J", "lhaviyani", "Naifaru", "prevention", "Host community sessions on recognising and reporting online abuse."),
      row(10, "approved", "wdc", "Sample WDC K", "thaa", "Veymandoo", "support", "Set up a trusted point of contact on the island for women facing online abuse."),
      row(11, "approved", "individual", "Sample Person L", "gnaviyani", "Fuvahmulah", "prevention", "Speak up when I see harassment in group chats and report abusive accounts.", { display_public: 0 }),
      row(12, "pending", "atoll_council", "Sample Atoll Council M", "laamu", "Gan", "justice", "Designate a focal point to follow up TFGBV complaints with the police.", { contact: "focal@example.org" }),
      row(13, "pending", "wdc", "Sample WDC N", "raa", "Ungoofaaru", "prevention", "Hold monthly sessions for parents and young people on recognising online harassment."),
      row(14, "pending", "individual", "Sample Person O", "addu", "Hithadhoo", "prevention", "Check in on friends who are targeted online and help them reach support services.", { display_public: 0, contact: "person@example.org" })
    ];
    return { next: 15, items: items, admin: false };
  }

  var memory = null;
  function load() {
    if (memory) return memory;
    try { var s = localStorage.getItem(KEY); if (s) { memory = JSON.parse(s); return memory; } } catch (e) {}
    memory = seed(); save(memory); return memory;
  }
  function save(st) { memory = st; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function reset() { memory = null; try { localStorage.removeItem(KEY); } catch (e) {} }

  function clean(v, n) { return String(v == null ? "" : v).replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "").trim().slice(0, n); }
  function validate(b, partial) {
    var out = {}, err = null;
    function has(k) { return (k in b) || !partial; }
    if (has("org")) { out.org = clean(b.org, 120); if (!out.org) err = "Please enter a name."; }
    if (has("reporter_type")) { if (!TYPES[b.reporter_type]) err = "Please choose who is making the commitment."; else { out.reporter_type = b.reporter_type; out.level = TYPES[b.reporter_type][0]; } }
    if (has("atoll")) { if (ATOLLS.indexOf(b.atoll) < 0) err = "Please choose an atoll."; else out.atoll = b.atoll; }
    if (has("island")) { out.island = clean(b.island, 80) || null; if (out.atoll === "national") out.island = null; }
    if (has("pillar")) { if (!PILLARS[b.pillar]) err = "Please choose a pillar."; else out.pillar = b.pillar; }
    if (has("text")) { out.text = clean(b.text, 600); if (out.text.length < 15) err = "Please write the commitment (at least 15 characters)."; }
    if (has("display_public")) out.display_public = [true, 1, "1", "true", "on"].indexOf(b.display_public) >= 0 ? 1 : 0;
    if (!partial) out.contact = clean(b.contact, 160) || null;
    return [out, err];
  }
  function publicRow(r) {
    var t = TYPES[r.reporter_type] || ["organisation", "Organisation"];
    return { id: r.id, org: t[0] === "individual" && !r.display_public ? "Individual (name withheld)" : r.org,
      sector: t[1], level: t[0], atoll: r.atoll, island: r.island, pillar: r.pillar, text: r.text };
  }
  function approved(st) {
    return st.items.filter(function (r) { return r.status === "approved"; })
      .sort(function (a, b) { return (a.reviewed_at || "").localeCompare(b.reviewed_at || "") || a.id - b.id; });
  }

  function handle(method, path, query, body) {
    var st = load();
    if (method === "GET") {
      if (path === "/api/commitments") return [200, approved(st).map(publicRow)];
      if (path === "/api/meta") return [200, { reporter_types: Object.keys(TYPES).map(function (k) { return { id: k, level: TYPES[k][0], label: TYPES[k][1] }; }) }];
      if (path === "/api/admin/session") return [200, { admin: !!st.admin, configured: true }];
      if (path === "/api/admin/submissions") {
        if (!st.admin) return [401, { error: "Not signed in" }];
        var status = query.get("status") || "pending", counts = {};
        st.items.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
        var items = st.items.filter(function (r) { return ["pending", "approved", "rejected"].indexOf(status) < 0 || r.status === status; })
          .slice().sort(function (a, b) { return b.id - a.id; })
          .map(function (r) { var c = JSON.parse(JSON.stringify(r)); c.reporter_label = (TYPES[r.reporter_type] || ["", r.reporter_type])[1]; return c; });
        return [200, { items: items, counts: counts }];
      }
      return [404, { error: "Not found" }];
    }
    if (path === "/api/submissions") {
      if (!body || typeof body !== "object") return [400, { error: "Invalid request." }];
      if (body.website) return [200, { ok: true }];
      if ([true, "on", "1", 1].indexOf(body.consent) < 0) return [400, { error: "Please confirm consent before submitting." }];
      var v = validate(body, false); if (v[1]) return [400, { error: v[1] }];
      var f = v[0], r = { id: st.next++, created_at: iso(0), status: "pending", reviewed_at: null, reviewer_note: null };
      for (var k in f) r[k] = f[k];
      st.items.push(r); save(st);
      return [201, { ok: true, id: r.id }];
    }
    if (path === "/api/admin/login") {
      if (!body || body.password !== DEMO_PASSWORD) return [401, { error: "Incorrect password. In this demo the password is “demo”." }];
      st.admin = true; save(st); return [200, { ok: true }];
    }
    if (path === "/api/admin/logout") { st.admin = false; save(st); return [200, { ok: true }]; }
    var m = path.match(/^\/api\/admin\/submissions\/(\d+)$/);
    if (m) {
      if (!st.admin) return [401, { error: "Not signed in" }];
      var item = st.items.filter(function (x) { return x.id === +m[1]; })[0];
      if (!item) return [404, { error: "Not found" }];
      var action = body && body.action;
      if (["approve", "reject", "pending", "save"].indexOf(action) < 0) return [400, { error: "Unknown action." }];
      var sub = {}; ["org", "reporter_type", "atoll", "island", "pillar", "text", "display_public"].forEach(function (k) { if (k in body) sub[k] = body[k]; });
      var pv = validate(sub, true); if (pv[1]) return [400, { error: pv[1] }];
      for (var key in pv[0]) item[key] = pv[0][key];
      if (action !== "save") { item.status = { approve: "approved", reject: "rejected", pending: "pending" }[action]; item.reviewed_at = iso(0); }
      if ("note" in body) item.reviewer_note = clean(body.note, 300) || null;
      save(st); return [200, { ok: true }];
    }
    return [404, { error: "Not found" }];
  }

  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    init = init || {};
    var url = new URL(typeof input === "string" ? input : input.url, location.href);
    var i = url.pathname.indexOf("/api/");
    if (i < 0) return realFetch(input, init);
    var path = url.pathname.slice(i), body = null;
    try { body = init.body ? JSON.parse(init.body) : null; } catch (e) { body = null; }
    var res = handle((init.method || "GET").toUpperCase(), path, url.searchParams, body);
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(new Response(JSON.stringify(res[1]), { status: res[0], headers: { "Content-Type": "application/json" } }));
      }, 120);
    });
  };

  /* ---------- prototype label ---------- */
  function addBanner() {
    var css = document.createElement("style");
    css.textContent =
      ".demo-pill{position:fixed;z-index:9999;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:calc(100vw - 24px);background:#0a2a5c;color:#fff;" +
      "font:600 12px/1.3 'Segoe UI',system-ui,sans-serif;padding:8px 10px 8px 14px;border-radius:999px;box-shadow:0 6px 20px rgba(10,42,92,.25)}" +
      ".demo-pill button{font:inherit;border:0;border-radius:999px;padding:5px 10px;background:#fff;color:#0a2a5c;cursor:pointer}" +
      ".demo-pill button:focus-visible{outline:2px solid #8fb6ff;outline-offset:2px}" +
      ".demo-hint{background:#fff8e6;border:1px solid #f2dca0;color:#7a5a00;border-radius:10px;padding:8px 12px;font-size:13px}" +
      "a[href='/api/admin/export']{display:none!important}" +
      "body.display .demo-pill{opacity:.55}";
    document.head.appendChild(css);
    var pill = document.createElement("div");
    pill.className = "demo-pill";
    pill.setAttribute("role", "note");
    pill.innerHTML = '<span>Prototype for review · demo data stays in your browser · not an official UNFPA site</span>';
    var btn = document.createElement("button");
    btn.type = "button"; btn.textContent = "Reset demo";
    btn.addEventListener("click", function () {
      if (btn.dataset.armed) { reset(); location.reload(); return; }
      btn.dataset.armed = "1"; btn.textContent = "Click again to reset";
      setTimeout(function () { delete btn.dataset.armed; btn.textContent = "Reset demo"; }, 3000);
    });
    pill.appendChild(btn);
    document.body.appendChild(pill);
    var login = document.getElementById("login");
    if (login) {
      var hint = document.createElement("div");
      hint.className = "demo-hint";
      hint.textContent = "Demo reviewer password: demo";
      login.insertBefore(hint, login.querySelector("button"));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addBanner); else addBanner();
})();
