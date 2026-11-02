/* ============================================================
   TALHIVE — TH-ANALYTICS.JS v1.0
   Lead ID, First-Touch Attribution, CTA Tracking, GA4 Events
   ============================================================ */
(function () {
  "use strict";

  /* ── 1. LEAD ID GENERATION ──────────────────────────────── */
  function generateId() {
    var d = new Date();
    var ymd = d.getFullYear().toString() +
      ("0" + (d.getMonth() + 1)).slice(-2) +
      ("0" + d.getDate()).slice(-2);
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var rand = "";
    for (var i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "TLH-" + ymd + "-" + rand;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + "=" + encodeURIComponent(value) +
      ";expires=" + d.toUTCString() +
      ";path=/;SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  var leadId = localStorage.getItem("th_lead_id") || getCookie("th_lead_id");
  if (!leadId) {
    leadId = generateId();
    localStorage.setItem("th_lead_id", leadId);
    setCookie("th_lead_id", leadId, 365);
    window.thIsNewLead = true;
  } else {
    // Sync both stores
    localStorage.setItem("th_lead_id", leadId);
    setCookie("th_lead_id", leadId, 365);
    window.thIsNewLead = false;
  }
  window.thLeadId = leadId;


  /* ── 2. FIRST-TOUCH ATTRIBUTION ─────────────────────────── */
  function getParam(name) {
    var match = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  // Detect source/medium from referrer when no UTMs present
  var SEARCH_ENGINES = {
    "google":     /google\./i,
    "bing":       /bing\./i,
    "yahoo":      /yahoo\./i,
    "duckduckgo": /duckduckgo\./i,
    "baidu":      /baidu\./i,
    "yandex":     /yandex\./i,
    "ecosia":     /ecosia\./i
  };
  var SOCIAL_NETWORKS = {
    "linkedin":   /linkedin\./i,
    "facebook":   /facebook\.|fb\./i,
    "twitter":    /twitter\.|t\.co|x\.com/i,
    "instagram":  /instagram\./i,
    "youtube":    /youtube\.|youtu\.be/i,
    "reddit":     /reddit\./i,
    "whatsapp":   /whatsapp\./i,
    "telegram":   /telegram\.|t\.me/i
  };

  function detectSourceFromReferrer(ref) {
    if (!ref) return { source: "(direct)", medium: "(none)" };
    var r = String(ref);
    for (var name in SEARCH_ENGINES) {
      if (SEARCH_ENGINES[name].test(r)) return { source: name, medium: "organic" };
    }
    for (var name in SOCIAL_NETWORKS) {
      if (SOCIAL_NETWORKS[name].test(r)) return { source: name, medium: "social" };
    }
    // Generic referral: extract hostname
    try {
      var host = new URL(r).hostname.replace(/^www\./, "");
      if (host && host !== location.hostname) return { source: host, medium: "referral" };
    } catch(e) {}
    return { source: "(direct)", medium: "(none)" };
  }

  var FT_KEY = "th_first_touch";
  var FT_VERSION = 2;  // bump to force re-evaluation when detection logic changes
  var firstTouch = null;
  try { firstTouch = JSON.parse(localStorage.getItem(FT_KEY)); } catch (e) {}

  // Re-evaluate if version is old (fixes users stuck with "(direct)" from before referrer detection)
  if (firstTouch && firstTouch._v !== FT_VERSION) { firstTouch = null; }

  if (!firstTouch) {
    var utmSource = getParam("utm_source");
    var utmMedium = getParam("utm_medium");
    var ref = document.referrer || "";
    var detected = { source: "(direct)", medium: "(none)" };

    if (utmSource) {
      detected.source = utmSource;
      detected.medium = utmMedium || "(none)";
    } else {
      detected = detectSourceFromReferrer(ref);
    }

    firstTouch = {
      _v:           FT_VERSION,
      source:       detected.source,
      medium:       detected.medium,
      campaign:     getParam("utm_campaign") || "",
      content:      getParam("utm_content") || "",
      term:         getParam("utm_term") || "",
      referrer:     ref || "(direct)",
      landing_page: location.href,
      timestamp:    new Date().toISOString()
    };
    localStorage.setItem(FT_KEY, JSON.stringify(firstTouch));
  }
  // Never overwrite first-touch data
  window.thFirstTouch = firstTouch;


  /* ── 3. SESSION TRACKING ────────────────────────────────── */
  var SESSION_KEY = "th_session";
  var session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) {}

  if (!session) {
    session = {
      id: "S-" + Date.now().toString(36),
      start: new Date().toISOString(),
      pages: [],
      ctas: [],
      forms: []
    };
  }
  session.pages.push({
    url: location.pathname,
    title: document.title,
    time: new Date().toISOString()
  });
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));


  /* ── 3b. COUNTRY DETECTION ──────────────────────────────── */
  var detectedCountry = localStorage.getItem("th_country") || "";
  window.thCountry = detectedCountry;

  function detectCountry(cb) {
    if (window.thDetectCountry) {
      window.thDetectCountry(function(cc) {
        detectedCountry = (cc || "").toUpperCase();
        localStorage.setItem("th_country", detectedCountry);
        window.thCountry = detectedCountry;
        if (cb) cb(detectedCountry);
      });
    } else {
      fetch("https://api.country.is/")
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d && d.country) {
            detectedCountry = d.country.toUpperCase();
            localStorage.setItem("th_country", detectedCountry);
            window.thCountry = detectedCountry;
          }
          if (cb) cb(detectedCountry);
        })
        .catch(function() { if (cb) cb(detectedCountry); });
    }
  }

  var CC_NAMES = {
    US:"United States",GB:"United Kingdom",IN:"India",AU:"Australia",SG:"Singapore",
    AE:"UAE",DE:"Germany",FR:"France",NL:"Netherlands",IE:"Ireland",CH:"Switzerland",
    SE:"Sweden",DK:"Denmark",NO:"Norway",FI:"Finland",BE:"Belgium",ES:"Spain",
    IT:"Italy",JP:"Japan",KR:"South Korea",HK:"Hong Kong",NZ:"New Zealand",
    ZA:"South Africa",SA:"Saudi Arabia",CA:"Canada",IL:"Israel",AT:"Austria",
    PL:"Poland",CZ:"Czech Republic",BR:"Brazil",MX:"Mexico",VN:"Vietnam",
    TW:"Taiwan",TH:"Thailand",MY:"Malaysia",ID:"Indonesia",PH:"Philippines"
  };
  function countryName(cc) { return CC_NAMES[(cc||"").toUpperCase()] || cc || ""; }
  window.thCountryName = function() { return countryName(detectedCountry); };

  /* ── 3c. VISITS TRACKING ────────────────────────────────── */
  function pushVisit() {
    var url = window.TH_SHEETS_URL;
    if (!url) return;
    try {
      fetch(url, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _sheet: "visits",
          timestamp: new Date().toISOString(),
          lead_id: leadId,
          country: countryName(detectedCountry),
          source: firstTouch.source,
          medium: firstTouch.medium,
          campaign: firstTouch.campaign,
          page_visited: location.pathname,
          page_title: document.title,
          referrer: document.referrer || firstTouch.referrer,
          form_filled: sessionStorage.getItem("th_form_submitted") ? "Yes" : "No",
          call_booked: sessionStorage.getItem("th_call_booked") ? "Yes" : "No",
          device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
          browser: (navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)[\/\s](\d+)/)||[])[1] || "Other"
        })
      }).catch(function(){});
    } catch(e){}
  }

  detectCountry(function() { pushVisit(); });


  /* ── 3d. PHONE VALIDATION BY COUNTRY ────────────────────── */
  var PHONE_RULES = {
    "+1":   { min:10, max:10, label:"US/Canada (+1): 10 digits" },
    "+7":   { min:10, max:10, label:"Russia (+7): 10 digits" },
    "+20":  { min:10, max:10, label:"Egypt (+20): 10 digits" },
    "+27":  { min:9,  max:9,  label:"South Africa (+27): 9 digits" },
    "+30":  { min:10, max:10, label:"Greece (+30): 10 digits" },
    "+31":  { min:9,  max:9,  label:"Netherlands (+31): 9 digits" },
    "+32":  { min:9,  max:9,  label:"Belgium (+32): 9 digits" },
    "+33":  { min:9,  max:9,  label:"France (+33): 9 digits" },
    "+34":  { min:9,  max:9,  label:"Spain (+34): 9 digits" },
    "+36":  { min:9,  max:9,  label:"Hungary (+36): 9 digits" },
    "+39":  { min:9,  max:10, label:"Italy (+39): 9-10 digits" },
    "+40":  { min:9,  max:10, label:"Romania (+40): 9-10 digits" },
    "+41":  { min:9,  max:9,  label:"Switzerland (+41): 9 digits" },
    "+43":  { min:10, max:11, label:"Austria (+43): 10-11 digits" },
    "+44":  { min:10, max:11, label:"UK (+44): 10-11 digits" },
    "+45":  { min:8,  max:8,  label:"Denmark (+45): 8 digits" },
    "+46":  { min:9,  max:10, label:"Sweden (+46): 9-10 digits" },
    "+47":  { min:8,  max:8,  label:"Norway (+47): 8 digits" },
    "+48":  { min:9,  max:9,  label:"Poland (+48): 9 digits" },
    "+49":  { min:10, max:11, label:"Germany (+49): 10-11 digits" },
    "+51":  { min:9,  max:9,  label:"Peru (+51): 9 digits" },
    "+52":  { min:10, max:10, label:"Mexico (+52): 10 digits" },
    "+53":  { min:8,  max:8,  label:"Cuba (+53): 8 digits" },
    "+54":  { min:10, max:10, label:"Argentina (+54): 10 digits" },
    "+55":  { min:10, max:11, label:"Brazil (+55): 10-11 digits" },
    "+56":  { min:9,  max:9,  label:"Chile (+56): 9 digits" },
    "+57":  { min:10, max:10, label:"Colombia (+57): 10 digits" },
    "+60":  { min:9,  max:10, label:"Malaysia (+60): 9-10 digits" },
    "+61":  { min:9,  max:9,  label:"Australia (+61): 9 digits" },
    "+62":  { min:9,  max:12, label:"Indonesia (+62): 9-12 digits" },
    "+63":  { min:10, max:10, label:"Philippines (+63): 10 digits" },
    "+64":  { min:9,  max:10, label:"New Zealand (+64): 9-10 digits" },
    "+65":  { min:8,  max:8,  label:"Singapore (+65): 8 digits" },
    "+66":  { min:9,  max:9,  label:"Thailand (+66): 9 digits" },
    "+81":  { min:10, max:10, label:"Japan (+81): 10 digits" },
    "+82":  { min:10, max:10, label:"South Korea (+82): 10 digits" },
    "+84":  { min:9,  max:10, label:"Vietnam (+84): 9-10 digits" },
    "+86":  { min:11, max:11, label:"China (+86): 11 digits" },
    "+90":  { min:10, max:10, label:"Turkey (+90): 10 digits" },
    "+91":  { min:10, max:10, label:"India (+91): 10 digits" },
    "+92":  { min:10, max:10, label:"Pakistan (+92): 10 digits" },
    "+93":  { min:9,  max:9,  label:"Afghanistan (+93): 9 digits" },
    "+94":  { min:9,  max:9,  label:"Sri Lanka (+94): 9 digits" },
    "+95":  { min:8,  max:10, label:"Myanmar (+95): 8-10 digits" },
    "+98":  { min:10, max:10, label:"Iran (+98): 10 digits" },
    "+212": { min:9,  max:9,  label:"Morocco (+212): 9 digits" },
    "+213": { min:9,  max:9,  label:"Algeria (+213): 9 digits" },
    "+216": { min:8,  max:8,  label:"Tunisia (+216): 8 digits" },
    "+234": { min:10, max:10, label:"Nigeria (+234): 10 digits" },
    "+254": { min:9,  max:9,  label:"Kenya (+254): 9 digits" },
    "+255": { min:9,  max:9,  label:"Tanzania (+255): 9 digits" },
    "+256": { min:9,  max:9,  label:"Uganda (+256): 9 digits" },
    "+351": { min:9,  max:9,  label:"Portugal (+351): 9 digits" },
    "+352": { min:9,  max:9,  label:"Luxembourg (+352): 9 digits" },
    "+353": { min:9,  max:9,  label:"Ireland (+353): 9 digits" },
    "+354": { min:7,  max:7,  label:"Iceland (+354): 7 digits" },
    "+356": { min:8,  max:8,  label:"Malta (+356): 8 digits" },
    "+358": { min:9,  max:10, label:"Finland (+358): 9-10 digits" },
    "+370": { min:8,  max:8,  label:"Lithuania (+370): 8 digits" },
    "+371": { min:8,  max:8,  label:"Latvia (+371): 8 digits" },
    "+372": { min:7,  max:8,  label:"Estonia (+372): 7-8 digits" },
    "+374": { min:8,  max:8,  label:"Armenia (+374): 8 digits" },
    "+375": { min:9,  max:10, label:"Belarus (+375): 9-10 digits" },
    "+380": { min:9,  max:9,  label:"Ukraine (+380): 9 digits" },
    "+381": { min:8,  max:9,  label:"Serbia (+381): 8-9 digits" },
    "+385": { min:8,  max:9,  label:"Croatia (+385): 8-9 digits" },
    "+386": { min:8,  max:8,  label:"Slovenia (+386): 8 digits" },
    "+420": { min:9,  max:9,  label:"Czech Republic (+420): 9 digits" },
    "+421": { min:9,  max:9,  label:"Slovakia (+421): 9 digits" },
    "+852": { min:8,  max:8,  label:"Hong Kong (+852): 8 digits" },
    "+853": { min:8,  max:8,  label:"Macau (+853): 8 digits" },
    "+880": { min:10, max:10, label:"Bangladesh (+880): 10 digits" },
    "+886": { min:9,  max:9,  label:"Taiwan (+886): 9 digits" },
    "+960": { min:7,  max:7,  label:"Maldives (+960): 7 digits" },
    "+961": { min:7,  max:8,  label:"Lebanon (+961): 7-8 digits" },
    "+962": { min:9,  max:9,  label:"Jordan (+962): 9 digits" },
    "+964": { min:10, max:10, label:"Iraq (+964): 10 digits" },
    "+965": { min:8,  max:8,  label:"Kuwait (+965): 8 digits" },
    "+966": { min:9,  max:9,  label:"Saudi Arabia (+966): 9 digits" },
    "+968": { min:8,  max:8,  label:"Oman (+968): 8 digits" },
    "+971": { min:9,  max:9,  label:"UAE (+971): 9 digits" },
    "+972": { min:9,  max:9,  label:"Israel (+972): 9 digits" },
    "+973": { min:8,  max:8,  label:"Bahrain (+973): 8 digits" },
    "+974": { min:8,  max:8,  label:"Qatar (+974): 8 digits" },
    "+977": { min:10, max:10, label:"Nepal (+977): 10 digits" }
  };

  // Returns { valid: bool, message: string }
  window.thValidatePhone = function(dialCode, rawNumber) {
    var digits = String(rawNumber || "").replace(/\D/g, "");
    if (!digits) return { valid: false, message: "Please enter a phone number." };
    var rule = PHONE_RULES[String(dialCode || "").trim()];
    if (rule) {
      if (digits.length < rule.min || digits.length > rule.max) {
        return { valid: false, message: rule.label + " (you entered " + digits.length + ")" };
      }
    } else {
      // Generic: 7-15 digits per ITU
      if (digits.length < 7 || digits.length > 15) {
        return { valid: false, message: "Phone must be 7-15 digits (you entered " + digits.length + ")" };
      }
    }
    return { valid: true, message: "" };
  };

  /* ── Phone input length limiter ─────────────────────────── */
  // Auto-generate lookup tables from PHONE_RULES
  var DIAL_TO_MAX = {};
  var PHONE_HINTS = {};
  for (var dial in PHONE_RULES) {
    DIAL_TO_MAX[dial] = PHONE_RULES[dial].max;
    var r = PHONE_RULES[dial];
    var label = r.label.split(":")[0]; // e.g. "India (+91)"
    PHONE_HINTS[dial] = r.min === r.max
      ? r.min + "-digit number"
      : r.min + " to " + r.max + " digits";
  }
  // Country-specific examples
  var HINT_EXAMPLES = {
    "+91":"e.g. 98765 43210","+1":"e.g. 202 555 0100","+44":"e.g. 7911 123456",
    "+61":"e.g. 412 345 678","+65":"e.g. 6123 4567","+971":"e.g. 50 123 4567",
    "+49":"e.g. 151 1234 5678","+33":"e.g. 6 12 34 56 78","+81":"e.g. 90 1234 5678",
    "+86":"e.g. 138 0013 8000","+852":"e.g. 9123 4567","+55":"e.g. 11 98765 4321",
    "+374":"e.g. 91 123 456","+972":"e.g. 50 123 4567","+82":"e.g. 10 1234 5678"
  };
  for (var d in PHONE_HINTS) {
    if (HINT_EXAMPLES[d]) PHONE_HINTS[d] += ", " + HINT_EXAMPLES[d];
  }

  // ISO code to dial code mapping (for intl-tel-input)
  var ISO_TO_DIAL = {
    us:"+1",ca:"+1",gb:"+44",in:"+91",au:"+61",sg:"+65",ae:"+971",de:"+49",
    fr:"+33",nl:"+31",ie:"+353",ch:"+41",se:"+46",dk:"+45",no:"+47",fi:"+358",
    be:"+32",es:"+34",it:"+39",jp:"+81",kr:"+82",hk:"+852",nz:"+64",za:"+27",
    sa:"+966",ru:"+7",cn:"+86",br:"+55",mx:"+52",ar:"+54",co:"+57",cl:"+56",
    pe:"+51",tr:"+90",pl:"+48",ua:"+380",ro:"+40",hu:"+36",cz:"+420",sk:"+421",
    hr:"+385",rs:"+381",bg:"+359",si:"+386",lt:"+370",lv:"+371",ee:"+372",
    gr:"+30",pt:"+351",at:"+43",il:"+972",eg:"+20",ng:"+234",ke:"+254",
    th:"+66",vn:"+84",my:"+60",id:"+62",ph:"+63",tw:"+886",bd:"+880",
    pk:"+92",lk:"+94",np:"+977",am:"+374",ge:"+995",kw:"+965",qa:"+974",
    bh:"+973",om:"+968",jo:"+962",lb:"+961",iq:"+964",ir:"+98",ma:"+212",
    tn:"+216",dz:"+213",cu:"+53",is:"+354",mt:"+356",lu:"+352",mo:"+853",
    mv:"+960",mm:"+95",tz:"+255",ug:"+256",by:"+375",af:"+93"
  };
  var ISO_TO_MAX = {};
  var ISO_HINTS = {};
  for (var iso in ISO_TO_DIAL) {
    var dc = ISO_TO_DIAL[iso];
    if (PHONE_RULES[dc]) {
      ISO_TO_MAX[iso] = PHONE_RULES[dc].max;
      ISO_HINTS[iso] = PHONE_HINTS[dc] || "";
    }
  }

  function getOrCreateHint(inputEl) {
    // Walk up to .field container (works with intl-tel-input wrapping)
    var container = inputEl.closest(".field") || inputEl.parentNode.closest(".field") || inputEl.parentNode;
    // If inside an iti wrapper, place hint AFTER the wrapper (not inside it)
    // so the wrapper height matches just the input
    var itiWrap = inputEl.closest(".iti");
    var insertParent = itiWrap ? itiWrap.parentNode : container;
    var hint = insertParent.querySelector(".th-phone-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "th-phone-hint";
      hint.style.cssText = "font-size:11px;color:#9A9088;margin-top:4px;line-height:1.4;font-weight:300;transition:opacity .15s;";
      if (itiWrap && itiWrap.nextSibling) {
        itiWrap.parentNode.insertBefore(hint, itiWrap.nextSibling);
      } else if (itiWrap) {
        itiWrap.parentNode.appendChild(hint);
      } else {
        var errDiv = container.querySelector(".ferr,.th-field-err");
        if (errDiv) container.insertBefore(hint, errDiv);
        else container.appendChild(hint);
      }
    }
    return hint;
  }

  function enforceDigitLimit(inputEl, max) {
    var digits = inputEl.value.replace(/\D/g, "");
    if (digits.length > max) {
      var kept = 0, out = "";
      for (var i = 0; i < inputEl.value.length; i++) {
        var ch = inputEl.value[i];
        if (/\d/.test(ch)) { if (kept < max) { out += ch; kept++; } }
        else { out += ch; }
      }
      inputEl.value = out;
    }
  }

  function wirePhoneLimiter(inputEl, getMax, getHint) {
    if (!inputEl || inputEl.dataset.limiterWired) return;
    inputEl.dataset.limiterWired = "1";

    function update() {
      var max = getMax();
      inputEl.dataset.maxDigits = max;
      var hintEl = getOrCreateHint(inputEl);
      var hintText = getHint();
      hintEl.textContent = hintText || "";
      hintEl.style.display = hintText ? "block" : "none";
      enforceDigitLimit(inputEl, max);
    }

    // Delay initial update slightly so iti has resolved country
    setTimeout(update, 800);
    setTimeout(update, 2500); // second pass after async geo resolves

    // Block digit entry beyond max via keydown
    inputEl.addEventListener("keydown", function(e) {
      // Allow: backspace, delete, tab, escape, arrows, home, end, select-all
      if ([8,9,27,46,37,38,39,40,35,36].indexOf(e.keyCode) !== -1) return;
      if ((e.ctrlKey || e.metaKey) && [65,67,86,88].indexOf(e.keyCode) !== -1) return; // ctrl+a/c/v/x
      // Check if it's a digit key
      var isDigit = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
      if (!isDigit) return; // allow non-digit chars (spaces, dashes, +)
      var max = parseInt(inputEl.dataset.maxDigits) || 15;
      var currentDigits = inputEl.value.replace(/\D/g, "").length;
      // Account for selected text being replaced
      var selStart = inputEl.selectionStart || 0;
      var selEnd = inputEl.selectionEnd || 0;
      if (selEnd > selStart) {
        var selText = inputEl.value.substring(selStart, selEnd);
        currentDigits -= (selText.match(/\d/g) || []).length;
      }
      if (currentDigits >= max) { e.preventDefault(); }
    });

    // Clip on paste + input (catches autofill)
    inputEl.addEventListener("paste", function() {
      setTimeout(function() { enforceDigitLimit(inputEl, parseInt(inputEl.dataset.maxDigits) || 15); }, 10);
    });
    inputEl.addEventListener("input", function() {
      enforceDigitLimit(inputEl, parseInt(inputEl.dataset.maxDigits) || 15);
    });

    return update;
  }

  // For intl-tel-input (contact + popup)
  window.thLimitItiPhone = function(inputEl, itiInstance) {
    if (!inputEl || !itiInstance) return;
    var update = wirePhoneLimiter(inputEl,
      function() {
        var d = itiInstance.getSelectedCountryData();
        var iso = (d && d.iso2) ? d.iso2.toLowerCase() : "";
        return ISO_TO_MAX[iso] || 15;
      },
      function() {
        var d = itiInstance.getSelectedCountryData();
        var iso = (d && d.iso2) ? d.iso2.toLowerCase() : "";
        return ISO_HINTS[iso] || (ISO_TO_MAX[iso] ? "" : "7 to 15 digits");
      }
    );
    inputEl.addEventListener("countrychange", function() { if(update) update(); });
  };

  // For inline forms with dial-code selectors
  window.thLimitDialCodePhone = function(phoneInput, dialSelect) {
    if (!phoneInput || !dialSelect) return;
    var update = wirePhoneLimiter(phoneInput,
      function() { return DIAL_TO_MAX[dialSelect.value] || 15; },
      function() { return PHONE_HINTS[dialSelect.value] || (DIAL_TO_MAX[dialSelect.value] ? "" : "7 to 15 digits"); }
    );
    dialSelect.addEventListener("change", function() { if(update) update(); });
  };

  // Auto-wire inline forms on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", function() {
    // Wire intl-tel-input instances (contact form + popup)
    // These are created by inline scripts that run before defer scripts,
    // so we wire them here instead of relying on the inline call.
    function wireItiInstances() {
      // Contact form
      var ctPh = document.getElementById("ct-ph");
      if (ctPh && window.itiContact && !ctPh.dataset.limiterWired) {
        window.thLimitItiPhone(ctPh, window.itiContact);
      }
      // Popup (created dynamically, may not exist yet)
      var thpPh = document.getElementById("thp-phone");
      if (thpPh && window.thpIti && !thpPh.dataset.limiterWired) {
        window.thLimitItiPhone(thpPh, window.thpIti);
      }
    }
    wireItiInstances();
    // Retry for async iti init
    setTimeout(wireItiInstances, 1500);
    setTimeout(wireItiInstances, 3500);

    // Observe for popup phone (created later by th-popup.js)
    // The popup phone + iti are created asynchronously, so poll + observe
    var mo = new MutationObserver(function() {
      var thpPh = document.getElementById("thp-phone");
      if (thpPh && window.thpIti && !thpPh.dataset.limiterWired) {
        window.thLimitItiPhone(thpPh, window.thpIti);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // Also poll because iti init happens after DOM mutation
    var popupPoll = setInterval(function() {
      var thpPh = document.getElementById("thp-phone");
      if (thpPh && window.thpIti && !thpPh.dataset.limiterWired) {
        window.thLimitItiPhone(thpPh, window.thpIti);
        clearInterval(popupPoll);
      }
    }, 500);

    // Find all inline form phone pairs (-ph + -cc)
    var phones = document.querySelectorAll('input[type="tel"][id$="-ph"]');
    Array.prototype.forEach.call(phones, function(ph) {
      if (ph.id === "ct-ph" || ph.id === "thp-phone") return; // handled above
      var prefix = ph.id.replace(/-ph$/, "");
      var cc = document.getElementById(prefix + "-cc");
      if (cc) window.thLimitDialCodePhone(ph, cc);
    });
  });


  /* ── 4. GA4 EVENT HELPERS ───────────────────────────────── */
  function ga4(event, params) {
    params = params || {};
    params.lead_id = leadId;
    params.first_touch_source = firstTouch.source;
    params.first_touch_medium = firstTouch.medium;
    params.first_touch_campaign = firstTouch.campaign;
    if (typeof gtag === "function") {
      gtag("event", event, params);
    }
    // Also push to dataLayer for GTM compatibility
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params));
  }

  // Enhanced page_view with attribution
  ga4("page_view_enhanced", {
    page_location: location.href,
    page_title: document.title,
    referrer: firstTouch.referrer
  });

  // lead_created on first visit
  if (window.thIsNewLead) {
    ga4("lead_created", {
      page_location: location.href
    });
  }


  /* ── 5. CTA TRACKING ────────────────────────────────────── */
  function slugify(str) {
    return String(str || "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 30);
  }

  function getPageSlug() {
    var p = location.pathname.replace(/^\/|\/$/g, "") || "home";
    return slugify(p.split("/").pop() || p);
  }

  function getSectionSlug(el) {
    var section = el.closest("section, .cta-band, .art-header, footer, header, nav, .blog-cta-card, .answer-block");
    if (section) {
      var id = section.id || section.className.split(" ")[0] || "";
      return slugify(id) || "main";
    }
    return "main";
  }

  function getActionSlug(el) {
    var href = el.getAttribute("href") || "";
    var text = (el.textContent || "").trim();
    if (href.indexOf("/contact") !== -1 || href.indexOf("/schedule") !== -1) return "contact";
    if (href.indexOf("/case-studies") !== -1) return "casestudies";
    if (href.indexOf("/blog") !== -1) return "blog";
    if (text.indexOf("Book") !== -1 || text.indexOf("Consult") !== -1) return "bookcall";
    if (text.indexOf("Download") !== -1) return "download";
    return slugify(text).substring(0, 20) || "click";
  }

  // Delegated CTA click listener
  document.addEventListener("click", function (e) {
    var el = e.target.closest("a.btn, a.btn-wh, a.btn-gh, a.blog-cta-btn, a.fsubmit, button.fsubmit, a.rla-btn, [data-cta], a.blog-card-link, a.nlink, .header-actions a, .thp-btn");
    if (!el) return;

    var page = getPageSlug();
    var section = getSectionSlug(el);
    var action = getActionSlug(el);
    var dataCta = el.getAttribute("data-cta");
    var ctaId = dataCta ? (dataCta + "__" + page)
                        : (el.id || ("cta_" + page + "_" + section + "_" + action));
    var ctaName = el.getAttribute("data-cta-name") ||
                  (el.textContent || "").trim().substring(0, 60);

    // Set attributes for future reference
    if (!el.id) el.id = ctaId;
    if (!el.getAttribute("data-cta-name")) el.setAttribute("data-cta-name", ctaName);

    ga4("cta_click", {
      cta_id: ctaId,
      cta_name: ctaName,
      cta_url: el.href || "",
      page_location: location.href,
      section: section
    });

    // Store in session
    session.ctas.push({
      id: ctaId,
      name: ctaName,
      time: new Date().toISOString(),
      page: location.pathname
    });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, true);


  /* ── 6. FORM TRACKING ──────────────────────────────────── */
  var formStartFired = {};

  // form_start: first field focus
  document.addEventListener("focus", function (e) {
    var input = e.target;
    if (!input || !input.closest) return;
    var form = input.closest("form, .fbox, #contact-fw, .thp-f, [id$='-cf']");
    if (!form) return;
    var formId = form.id || "form_" + getPageSlug();
    if (formStartFired[formId]) return;
    formStartFired[formId] = true;

    ga4("form_start", {
      form_id: formId,
      page_location: location.href
    });
  }, true);


  /* ── 7. PAYLOAD ENRICHMENT ──────────────────────────────── */
  // Expose a function that any form submit handler can call to get tracking data
  window.thGetTrackingPayload = function () {
    return {
      lead_id:              leadId,
      country:              countryName(detectedCountry),
      first_touch_source:   firstTouch.source,
      first_touch_medium:   firstTouch.medium,
      first_touch_campaign: firstTouch.campaign,
      first_touch_content:  firstTouch.content,
      first_touch_term:     firstTouch.term,
      referrer:             firstTouch.referrer,
      landing_page:         firstTouch.landing_page,
      session_pages:        session.pages.length,
      session_ctas:         session.ctas.map(function (c) { return c.id; }).join(", ")
    };
  };

  // Fire form_submit GA4 event (call from submit handlers after successful POST)
  window.thTrackFormSubmit = function (formId, searchModel) {
    sessionStorage.setItem("th_form_submitted", "1");
    ga4("form_submit", {
      form_id: formId || "form_" + getPageSlug(),
      search_model: searchModel || "",
      page_location: location.href
    });
    session.forms.push({
      id: formId,
      time: new Date().toISOString(),
      page: location.pathname
    });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };


  /* ── 8. GOOGLE SHEETS PUSH ──────────────────────────────── */
  window.TH_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzitIuzjZr9rPiUaUtzXX2cYCg8ZVh7PQIh-QF_oJ3R1veGMixigWoAn31-ZIODJ2YfXA/exec";

  window.thPushToSheets = function (formData) {
    var url = window.TH_SHEETS_URL;
    if (!url) return;
    var payload = Object.assign({}, window.thGetTrackingPayload(), formData, {
      _sheet: "leads",
      timestamp: new Date().toISOString(),
      page_url: location.href,
      user_agent: navigator.userAgent
    });
    if (!payload.country) payload.country = countryName(detectedCountry);
    try {
      fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  };


  /* ── 9. REAL-TIME FIELD VALIDATION ──────────────────────── */
  var PERSONAL_RX = /@(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|aol|icloud|me|mac|protonmail|proton|gmx|mail)\.(com|co\.in|co\.uk|net|org|me|in|de|fr|it|es|ca|au|ru|br|jp|kr|io)$/i;
  var EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showFieldErr(input, msg) {
    var err = input.parentNode.querySelector(".th-field-err");
    if (!err) {
      err = document.createElement("div");
      err.className = "th-field-err";
      err.style.cssText = "font-size:11.5px;color:#B91C1C;margin-top:4px;font-weight:400;line-height:1.4;";
      input.parentNode.appendChild(err);
    }
    err.textContent = msg;
    err.style.display = msg ? "block" : "none";
    if (msg) input.style.borderColor = "#B91C1C";
    else input.style.borderColor = "";
  }

  function clearFieldErr(input) { showFieldErr(input, ""); }

  // Email blur: validate format + personal email
  function onEmailBlur(e) {
    var input = e.target;
    var val = (input.value || "").trim();
    if (!val) { clearFieldErr(input); return; }
    if (!EMAIL_RX.test(val)) { showFieldErr(input, "Please enter a valid email address."); return; }
    if (PERSONAL_RX.test(val)) { showFieldErr(input, "Please add your official ID."); return; }
    clearFieldErr(input);
  }

  // Phone blur: validate length for country (or intl-tel-input)
  function onPhoneBlur(e) {
    var input = e.target;
    var val = (input.value || "").trim();
    if (!val) { clearFieldErr(input); return; }
    // Try intl-tel-input first (contact form + popup)
    var iti = (input.id === "ct-ph" && window.itiContact) ? window.itiContact :
              (input.id === "thp-phone" && window.thpIti) ? window.thpIti : null;
    if (iti && iti.isValidNumber) {
      if (!iti.isValidNumber()) {
        var d = iti.getSelectedCountryData();
        showFieldErr(input, "Please enter a valid " + ((d && d.name) ? d.name : "") + " phone number.");
        return;
      }
      clearFieldErr(input); return;
    }
    // Fallback: check digit count against maxDigits
    var max = parseInt(input.dataset.maxDigits) || 0;
    if (!max) { clearFieldErr(input); return; }
    var digits = val.replace(/\D/g, "");
    var min = max;
    var cc = input.dataset.dialCode || "";
    if (cc && PHONE_RULES[cc]) min = PHONE_RULES[cc].min;
    if (digits.length < min) {
      showFieldErr(input, "Phone number too short (" + digits.length + "/" + min + " digits).");
      return;
    }
    clearFieldErr(input);
  }

  // Submit-area alert
  function showSubmitAlert(btn, msg) {
    var alert = btn.parentNode.querySelector(".th-submit-alert");
    if (!alert) {
      alert = document.createElement("div");
      alert.className = "th-submit-alert";
      alert.style.cssText = "font-size:12.5px;color:#B91C1C;margin-top:10px;text-align:center;line-height:1.5;font-weight:400;";
      btn.parentNode.insertBefore(alert, btn.nextSibling);
    }
    alert.textContent = msg;
    alert.style.display = msg ? "block" : "none";
  }

  // Expose for form submit handlers
  window.thShowSubmitAlert = function(btn, msg) { showSubmitAlert(btn, msg); };
  window.thClearSubmitAlert = function(btn) { showSubmitAlert(btn, ""); };

  // Auto-wire blur on all email inputs
  document.addEventListener("DOMContentLoaded", function() {
    // Email fields: id contains "email" or "em" and type is email
    var emails = document.querySelectorAll('input[type="email"], input[id*="-em"], input[id*="-email"]');
    Array.prototype.forEach.call(emails, function(el) {
      el.addEventListener("blur", onEmailBlur);
      el.addEventListener("input", function() { clearFieldErr(el); });
    });

    // Phone fields with maxDigits (set by thLimitDialCodePhone or thLimitItiPhone)
    setTimeout(function() {
      var phones = document.querySelectorAll('input[type="tel"]');
      Array.prototype.forEach.call(phones, function(el) {
        el.addEventListener("blur", onPhoneBlur);
        el.addEventListener("input", function() { clearFieldErr(el); });
      });
    }, 1500); // delay so iti/limiters have wired maxDigits
  });


  /* ── 10. POPUP FIELD-LEVEL VALIDATION ───────────────────── */
  // The popup builds its DOM dynamically. Wire validation after it opens.
  var _origThpOpen = null;
  document.addEventListener("DOMContentLoaded", function() {
    // Observe for popup DOM injection
    var mo = new MutationObserver(function() {
      var emailEl = document.getElementById("thp-email");
      var phoneEl = document.getElementById("thp-phone");
      if (emailEl && !emailEl.dataset.blurWired) {
        emailEl.dataset.blurWired = "1";
        emailEl.addEventListener("blur", onEmailBlur);
        emailEl.addEventListener("input", function() { clearFieldErr(emailEl); });
      }
      if (phoneEl && !phoneEl.dataset.blurWired) {
        phoneEl.dataset.blurWired = "1";
        phoneEl.addEventListener("blur", onPhoneBlur);
        phoneEl.addEventListener("input", function() { clearFieldErr(phoneEl); });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });

})();


/* ── MICROSOFT CLARITY (global, async) ─────────────────────
   Loaded once via the sitewide analytics bundle so it runs on
   every page. The injected tag is async (t.async=1); this file
   is loaded with `defer`, so it never blocks rendering. ── */
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "e6jooytq4a");
