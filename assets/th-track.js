/* ──────────────────────────────────────────────────────────────────────────
   Talhive — sitewide tracking + lead-routing layer
   Loaded on every page via:  <script src="/assets/th-track.js" defer></script>

   Responsibilities:
     1. Bootstrap GA4 (gtag).
     2. Resolve the lead's country -> calendar owner (pratik = India, som = rest).
     3. Capture UTM params on landing (persist for the session).
     4. Fire GA4 funnel events: form_started, form_submit_success,
        form_submit_error, calendar_clicked, thank_you_*_view, marketing_deck_download.
     5. Wrap fetch('/submit.php') so EVERY form on the site is tracked and
        country/calendar_owner are injected into the payload — without editing
        each form's inline handler.
     6. On a successful submission, redirect to the owner's thank-you page,
        carrying lead_id + country + calendar_owner + UTM.

   ▶ CONFIG: replace GA4_ID with the real GA4 Measurement ID before deploy.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* ===== CONFIG ===================================================== */
  var GA4_ID = "G-EQJ5ZHJ64Q";          // live Measurement ID
  var REDIRECT_TO_THANKYOU = true;       // set false to keep inline success messages
  /* ================================================================== */

  /* ---- GA4 ----------------------------------------------------------
     The canonical gtag snippet is loaded in each page's <head>, which
     defines window.gtag + dataLayer and calls config. We only define a
     safety shim here (no-op if gtag already exists) so thTrack always works,
     and we do NOT re-inject gtag.js (avoids loading the library twice). */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  // Public helper — events queue in dataLayer until gtag.js is ready.
  window.thTrack = function (name, params) {
    try { gtag("event", name, params || {}); } catch (e) {}
  };

  /* ---- UTM capture (persist for the session) ---------------------- */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  (function captureUtm() {
    try {
      var qs = new URLSearchParams(window.location.search);
      var found = false, store = {};
      UTM_KEYS.forEach(function (k) {
        var v = qs.get(k);
        if (v) { store[k] = v; found = true; }
      });
      if (found) sessionStorage.setItem("th_utm", JSON.stringify(store));
    } catch (e) {}
  })();
  function getUtm() {
    try { return JSON.parse(sessionStorage.getItem("th_utm") || "{}"); }
    catch (e) { return {}; }
  }
  function utmQuery() {
    var u = getUtm(), parts = [];
    UTM_KEYS.forEach(function (k) { if (u[k]) parts.push(k + "=" + encodeURIComponent(u[k])); });
    return parts.join("&");
  }
  window.thGetUtm = getUtm;
  window.thUtmQuery = utmQuery;

  /* ---- Country / calendar-owner resolution ------------------------ */
  // Map of intl-tel-input dial codes (used by the legacy lead forms) -> ISO2
  var DIAL_TO_ISO = {
    "+91": "in", "+1": "us", "+44": "gb", "+61": "au", "+65": "sg", "+971": "ae",
    "+49": "de", "+33": "fr", "+31": "nl", "+353": "ie", "+41": "ch", "+46": "se",
    "+45": "dk", "+47": "no", "+358": "fi", "+32": "be", "+34": "es", "+39": "it",
    "+81": "jp", "+82": "kr", "+852": "hk", "+64": "nz", "+27": "za", "+966": "sa"
  };

  // Robust geo-IP detection shared with the contact form, cached per session.
  // Uses CORS-friendly, no-key providers that work from the browser:
  //   Primary:  api.country.is        -> { country: "VN" }
  //   Fallback: get.geojs.io          -> { country: "VN" }
  // (ipwho.is dropped free-tier CORS and ipapi.co rate-limits, so both were
  //  silently failing and forcing the "in" default — that was the bug.)
  // The default "in" is NEVER cached, so a failed lookup cannot poison the
  // session for later pages.
  var GEO_KEY = "iti_cc";
  function thGeoFetch(url, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; reject(0); } }, ms || 5000);
      fetch(url).then(function (r) { return r.json(); }).then(
        function (d) { if (!done) { done = true; clearTimeout(t); resolve(d); } },
        function () { if (!done) { done = true; clearTimeout(t); reject(0); } }
      );
    });
  }
  function thCacheCC(cc) {
    cc = (cc || "").toLowerCase();
    if (/^[a-z]{2}$/.test(cc)) { try { sessionStorage.setItem(GEO_KEY, cc); } catch (e) {} return cc; }
    return "";
  }
  // Resolves a 2-letter country code from multiple providers.
  // Tries several CORS-friendly, no-key IP providers in order, then
  // falls back to browser locale/timezone. Returns "" (unknown) only
  // if EVERYTHING fails — it never fabricates a country. A genuine
  // detection is cached; "" is never cached so later pages can retry.
  var GEO_PROVIDERS = [
    { url: "https://api.country.is/",                     key: "country" },
    { url: "https://get.geojs.io/v1/ip/country.json",     key: "country" },
    { url: "https://ipapi.co/json/",                       key: "country_code" },
    { url: "https://ipwho.is/",                            key: "country_code" }
  ];

  // Best-effort country from the browser itself (no network needed).
  // Used only as a last resort when all IP providers are blocked.
  function browserCountryGuess() {
    // 1. Locale region, e.g. "en-IN" -> "IN"
    try {
      var langs = (navigator.languages && navigator.languages.length)
                    ? navigator.languages : [navigator.language || ""];
      for (var i = 0; i < langs.length; i++) {
        var m = String(langs[i]).match(/[-_]([A-Za-z]{2})$/);
        if (m) return m[1].toLowerCase();
      }
    } catch (e) {}
    // 2. Timezone heuristic for the India case specifically
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Kolkata|Calcutta/i.test(tz)) return "in";
    } catch (e) {}
    return "";
  }

  function tryProvidersFrom(idx, cb) {
    if (idx >= GEO_PROVIDERS.length) { cb(""); return; }
    var p = GEO_PROVIDERS[idx];
    thGeoFetch(p.url, 4000).then(function (d) {
      var cc = d && (d[p.key] || d.country || d.country_code);
      if (cc && /^[a-z]{2}$/i.test(cc)) { cb(String(cc).toLowerCase()); return; }
      throw 0;
    }).catch(function () { tryProvidersFrom(idx + 1, cb); });
  }

  window.thDetectCountry = function (cb) {
    cb = cb || function () {};
    // cached genuine detection?
    try { var c = sessionStorage.getItem(GEO_KEY); if (c) { cb(c); return; } } catch (e) {}
    tryProvidersFrom(0, function (cc) {
      if (cc) { cb(thCacheCC(cc)); return; }         // genuine IP detection, cached
      var guess = browserCountryGuess();             // last-resort local guess
      if (guess) { cb(guess); return; }              // NOT cached (weaker signal)
      cb("");                                        // truly unknown — never cached, never faked
    });
  };


  // Warm the cache once per session so the signal is ready on later pages.
  (function geoPrime() {
    try { if (sessionStorage.getItem(GEO_KEY)) return; } catch (e) {}
    window.thDetectCountry(function () {});
  })();

  function localeCountry() {
    try {
      var lang = navigator.language || navigator.userLanguage || "";
      var region = (lang.split("-")[1] || "").toLowerCase();
      return region || "";
    } catch (e) { return ""; }
  }

  // Priority: (1) phone dropdown country, (2) geo-IP, (3) browser locale.
  function resolveCountry() {
    // (1) intl-tel-input on the contact form
    try {
      if (window.itiContact && window.itiContact.getSelectedCountryData) {
        var d = window.itiContact.getSelectedCountryData();
        if (d && d.iso2) return d.iso2.toLowerCase();
      }
    } catch (e) {}
    // (1b) legacy lead-form country-code <select id$="-cc">
    try {
      var sel = document.querySelector('select[id$="-cc"]');
      if (sel && sel.value && DIAL_TO_ISO[sel.value]) return DIAL_TO_ISO[sel.value];
    } catch (e) {}
    // (2) geo-IP
    try {
      var geo = sessionStorage.getItem(GEO_KEY);
      if (geo) return geo.toLowerCase();
    } catch (e) {}
    // (3) browser locale
    var loc = localeCountry();
    if (loc) return loc;
    return "in"; // default
  }
  function ownerFor(country) { return (country || "in").toLowerCase() === "in" ? "pratik" : "som"; }
  window.thResolveCountry = resolveCountry;
  window.thOwnerFor = ownerFor;

  /* ---- form_name helper ------------------------------------------- */
  function formName() {
    var p = window.location.pathname.replace(/\/$/, "");
    if (p === "/contact" || p === "/contact.html") return "contact-mandate";
    var slug = p.split("/").filter(Boolean).pop() || "home";
    return "lead:" + slug;
  }
  function pagePath() { return window.location.pathname; }

  /* ---- form_started (delegated, once per form per pageload) -------- */
  var startedForms = new WeakSet();
  function nearestForm(el) {
    return el.closest("form, .fw, [id$='-fw'], #form, .contact-form") || document.body;
  }
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches("input, select, textarea")) return;
    if (t.type === "hidden") return;
    var f = nearestForm(t);
    if (startedForms.has(f)) return;
    startedForms.add(f);
    window.thTrack("form_started", { form_name: formName(), page: pagePath() });
  }, true);

  /* ---- validation errors -> form_submit_error --------------------- */
  // The inline handlers reveal validation errors by adding class "show" to
  // elements whose id ends in -e / -phe. Observe those to emit error events.
  var lastValErr = 0;
  try {
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName !== "class") return;
        var el = m.target;
        if (!el.id || !/-e$|-phe$/.test(el.id)) return;
        if (el.classList && el.classList.contains("show")) {
          var now = Date.now();
          if (now - lastValErr < 400) return;  // debounce a burst of fields
          lastValErr = now;
          window.thTrack("form_submit_error", {
            form_name: formName(), page: pagePath(), error_type: "validation"
          });
        }
      });
    });
    mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });
  } catch (e) {}

  /* ---- fetch wrapper: track + inject country/owner + redirect ----- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  if (realFetch) {
    window.fetch = function (input, init) {
      var url = (typeof input === "string") ? input : (input && input.url) || "";
      var isLead = /\/submit\.php(\?|$)/.test(url) &&
                   init && (init.method || "").toUpperCase() === "POST";

      if (!isLead) return realFetch(input, init);

      // Inject country + calendar_owner into the JSON payload.
      var country = resolveCountry();
      var owner = ownerFor(country);
      var leadEmail = "";
      try {
        if (init.body && typeof init.body === "string") {
          var obj = JSON.parse(init.body);
          if (!obj.country) obj.country = country;
          if (!obj.calendar_owner) obj.calendar_owner = owner;
          leadEmail = (obj.email || "").trim();
          var utm = getUtm();
          if (Object.keys(utm).length && !obj.utm) obj.utm = utm;
          init.body = JSON.stringify(obj);
        }
      } catch (e) {}

      return realFetch(input, init).then(function (res) {
        // Clone so the page's own .then() still gets a readable body.
        res.clone().json().then(function (data) {
          if (data && data.ok) {
            var leadId = data.lead_id || "";
            window.thTrack("form_submit_success", {
              form_name: formName(), page: pagePath(),
              country: country, calendar_owner: owner
            });
            if (REDIRECT_TO_THANKYOU && !window.__thNoRedirect) {
              var dest = owner === "pratik" ? "/schedule-a-call" : "/schedule-a-call-global";
              try { if (leadEmail) sessionStorage.setItem("th_lead_email", leadEmail); } catch (e) {}
              var q = ["country=" + encodeURIComponent(country),
                       "owner=" + owner,
                       leadId ? "lead_id=" + encodeURIComponent(leadId) : "",
                       leadEmail ? "email=" + encodeURIComponent(leadEmail) : ""].filter(Boolean);
              var utmq = utmQuery(); if (utmq) q.push(utmq);
              // gtag uses sendBeacon, so the event survives navigation.
              setTimeout(function () { window.location.href = dest + "?" + q.join("&"); }, 120);
            }
          } else {
            window.thTrack("form_submit_error", {
              form_name: formName(), page: pagePath(), error_type: "server"
            });
          }
        }).catch(function () { /* non-JSON response: ignore */ });
        return res;
      }).catch(function (err) {
        window.thTrack("form_submit_error", {
          form_name: formName(), page: pagePath(), error_type: "network"
        });
        throw err;
      });
    };
  }
})();
