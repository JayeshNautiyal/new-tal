/* ──────────────────────────────────────────────────────────────────────────
   Talhive — engagement / exit-intent popup
   Loaded sitewide via: <script src="/assets/th-popup.js" defer></script>

   - Appears once the visitor has spent 60s on the site (cumulative across
     pages) OR shows an exit-intent trigger on desktop, whichever comes first.
   - Shows once per session; once shown or dismissed it never reappears
     (sessionStorage flag).
   - Posts to /submit.php like every other lead form (so it inherits country
     routing, the notification email and the autoresponder). It sets
     window.__thNoRedirect so the visitor stays on the page and sees an inline
     thank-you instead of being navigated to the scheduler.
   - Suppressed on pages where a lead form would be redundant.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
    var THP_ROLE = (function (p) {
    if (/^\/executive-search/.test(p)) return 'Executive Search';
    if (/^\/india-team-build/.test(p)) return 'India Team Build';
    if (/^\/rpo-embedded-hiring/.test(p)) return 'RPO: Embedded Recruiting';
    if (/^\/(hire\/|profiles|engineering-ai-hiring|product-hiring|design-hiring)/.test(p) || /-(engineers|managers|scientists|designers)-india(\.html)?$/.test(p)) return 'Executive Search';
    return 'Multiple or unsure';
  })(location.pathname);
  function __thPopupBusy(){
    var a=document.activeElement;
    if(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
    var open=document.querySelectorAll('[role="dialog"], .modal, .modal-overlay, .cd-ov, #modal, #th-modal');
    for(var i=0;i<open.length;i++){ var st=getComputedStyle(open[i]); if(st.display!=='none' && st.visibility!=='hidden' && open[i].offsetParent!==null) return true; }
    return false;
  }

  "use strict";

  var SEEN_KEY = "th_popup_seen";
  var START_KEY = "th_popup_start";
  var DELAY_MS = 60000;       // 60 seconds on site
  var GRACE_MS = 1500;        // small grace if the threshold is already passed

  // Don't pop on pages where it's redundant.
  var path = location.pathname.replace(/\/$/, "");
  var SUPPRESS = ["/contact", "/contact.html", "/schedule-a-call", "/schedule-a-call-global",
                  "/deck-download", "/vp-engineering-series-b", "/privacy", "/404"];
  if (SUPPRESS.indexOf(path) !== -1) return;

  try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch (e) {}

  // Cumulative session timer.
  var start;
  try {
    start = parseInt(sessionStorage.getItem(START_KEY), 10);
    if (!start) { start = Date.now(); sessionStorage.setItem(START_KEY, String(start)); }
  } catch (e) { start = Date.now(); }

  var shown = false, fired = false;

  function markSeen() { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {} }

  /* ---------- styles ---------- */
  var css = '' +
  '.thp-back{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'padding:20px;background:rgba(23,20,16,.5);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);' +
    'opacity:0;transition:opacity .28s ease;font-family:"DM Sans",system-ui,Arial,sans-serif;}' +
  '.thp-back.on{opacity:1;}' +
  '.thp{position:relative;width:100%;max-width:440px;max-height:90vh;overflow-y:auto;background:#FAF8F4;border:1px solid rgba(23,20,16,.1);' +
    'border-radius:16px;box-shadow:0 30px 80px rgba(15,28,46,.32);padding:34px 32px 30px;' +
    'transform:translateY(14px) scale(.985);transition:transform .3s cubic-bezier(.2,.7,.2,1);}' +
  '.thp-back.on .thp{transform:none;}' +
  '.thp-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border:1px solid rgba(23,20,16,.12);background:#fff;' +
    'color:#6B6258;font-size:20px;line-height:1;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;}' +
  '.thp-x:hover{background:rgba(23,20,16,.06);color:#171410;border-color:rgba(23,20,16,.2);}' +
  '.thp-rule{width:42px;height:3px;background:#B91C1C;border-radius:2px;margin-bottom:18px;}' +
  '.thp-eye{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#6B6258;margin-bottom:12px;}' +
  '.thp-h{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:30px;line-height:1.12;' +
    'color:#1C3A5C;letter-spacing:-.01em;margin-bottom:12px;}' +
  '.thp-p{font-size:14.5px;line-height:1.6;color:#6B6258;margin-bottom:20px;}' +
  '.thp-f{display:flex;flex-direction:column;gap:10px;}' +
  '.thp-in{width:100%;font-family:inherit;font-size:15px;color:#171410;background:#fff;' +
    'border:1px solid rgba(23,20,16,.18);border-radius:9px;padding:12px 14px;outline:none;}' +
  '.thp-in:focus{border-color:#1C3A5C;box-shadow:0 0 0 3px rgba(28,58,92,.12);}' +
  '.thp-sel{appearance:none;-webkit-appearance:none;cursor:pointer;color:#171410;' +
    'background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B6258\' stroke-width=\'2\'><path d=\'M6 9l6 6 6-6\'/></svg>");' +
    'background-repeat:no-repeat;background-position:right 13px center;padding-right:36px;}' +
  '.thp-sel:required:invalid{color:#9A9088;}' +
  '.thp .iti{display:block;width:100%;position:relative;}' +
  '.thp .iti__country-container{position:absolute;top:0;bottom:0;left:0;display:flex;align-items:center;padding:0;margin:0;}' +
  '.thp .iti__selected-country{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;gap:3px;background:transparent;border:none;padding:0 10px 0 14px;cursor:pointer;border-right:1px solid rgba(23,20,16,.12);height:auto;margin:0;}' +
  '.thp .iti__selected-country-primary{display:inline-flex;align-items:center;gap:3px;padding:0;margin:0;}' +
  '.thp .iti__selected-dial-code{font-size:15px;color:#171410;white-space:nowrap;line-height:1;padding:0;margin:0;}' +
  '.thp .iti__flag{display:inline-block;vertical-align:middle;}' +
  '.thp .iti__arrow{display:inline-block;vertical-align:middle;}' +
  '.thp .iti__tel-input{width:100%;border:1px solid rgba(23,20,16,.18)!important;border-radius:9px!important;font-size:15px!important;padding:14px 14px 14px 100px!important;font-family:inherit!important;color:#171410;background:#fff;outline:none;line-height:1;}' +
  '.thp .iti__tel-input:focus{border-color:#1C3A5C!important;box-shadow:0 0 0 3px rgba(28,58,92,.12)!important;}' +
  '.iti--container{z-index:100003!important;}' +
  '.thp-btn{margin-top:2px;width:100%;font-family:inherit;font-size:15px;font-weight:600;color:#fff;' +
    'background:#1C3A5C;border:0;border-radius:9px;padding:13px 16px;cursor:pointer;transition:background .15s;}' +
  '.thp-btn:hover{background:#15304d;}' +
  '.thp-btn[disabled]{opacity:.6;cursor:default;}' +
  '.thp-note{font-size:12px;color:#9A9088;margin-top:12px;text-align:center;}' +
  '.thp-sm-wrap{display:flex;flex-direction:column;gap:7px;}' +
  '.thp-sm-q{font-size:12.5px;line-height:1.45;color:#6B6258;font-weight:500;}' +

  '.thp-err{font-size:13px;color:#B91C1C;min-height:0;margin-top:2px;}' +
  '.thp-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}' +
  '.thp-ok{text-align:center;padding:8px 0 4px;}' +
  '.thp-ok .thp-h{margin-bottom:8px;}' +
  '@media(max-width:520px){.thp-back{align-items:flex-end;padding:0;}' +
    '.thp{max-width:none;max-height:85vh;overflow-y:auto;border-radius:16px 16px 0 0;padding:28px 22px 26px;}' +
    '.thp-back.on .thp{transform:none;}.thp{transform:translateY(22px);}' +
    '.thp-h{font-size:26px;}}';

  var styleEl = document.createElement("style");
  styleEl.textContent = css;

  /* ---------- markup ---------- */
  var back = document.createElement("div");
  back.className = "thp-back";
  back.setAttribute("role", "dialog");
  back.setAttribute("aria-modal", "true");
  back.setAttribute("aria-label", "Talk to Talhive");
  back.innerHTML =
    '<div class="thp">' +
      '<button class="thp-x" type="button" aria-label="Close">&times;</button>' +
      '<div id="thp-body">' +
        '<div class="thp-rule"></div>' +
        '<div class="thp-eye">Talk to Talhive</div>' +
        '<div class="thp-h">Hiring a leader you can\u2019t afford to get wrong?</div>' +
        '<p class="thp-p">Tell us the role. We\u2019ll tell you honestly whether it needs executive search, and how we\u2019d run it. One reply from a founder, usually within a day.</p>' +
        '<div class="thp-f">' +
          '<input class="thp-in" id="thp-name" type="text" autocomplete="name" placeholder="Full name">' +
          '<input class="thp-in" id="thp-email" type="email" autocomplete="email" placeholder="Work email">' +
          '<input class="thp-in" id="thp-phone" type="tel" autocomplete="tel" placeholder="Phone number">' +
          '<input class="thp-in" id="thp-company" type="text" autocomplete="organization" placeholder="Company">' +
          '<input type="hidden" id="thp-role" value="' + THP_ROLE + '">' +
          '<div class="thp-sm-wrap" id="thp-sm-wrap" style="display:' + (THP_ROLE === 'RPO: Embedded Recruiting' ? 'none' : 'block') + ';margin-top:12px;">' +
            '<label class="thp-sm-q" for="thp-sm">Are you open to an executive search model for this mandate? <span style="color:#B91C1C;">*</span></label>' +
            '<select class="thp-in" id="thp-sm">' +
              '<option value="" disabled selected>Select one</option>' +
              '<option value="Yes, executive search is the right model for this role">Yes, executive search is the right model for this role</option>' +
              '<option value="Yes, open to executive search after calibration">Yes, open to executive search after calibration</option>' +
              '<option value="Not sure yet, I would like to understand the model">Not sure yet, I would like to understand the model</option>' +
              '<option value="No, we are only considering contingent / success-fee recruitment">No, we are only considering contingent / success-fee recruitment</option>' +
            '</select>' +
          '</div>' +
          '<input class="thp-hp" id="thp-website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" placeholder="Leave blank">' +
          '<div class="thp-sm-wrap" id="thp-intent-wrap">' +
            '<label class="thp-sm-q" for="thp-intent">What would you like to achieve through this conversation? <span style="color:#B91C1C;">*</span></label>' +
            '<select class="thp-in" id="thp-intent">' +
              '<option value="" disabled selected>Select one</option>' +
              '<option value="Explore career opportunities">Explore career opportunities</option>' +
              '<option value="Discuss hiring or talent acquisition needs">Discuss hiring or talent acquisition needs</option>' +
            '</select>' +
          '</div>' +
          '<div class="thp-err" id="thp-err"></div>' +
          '<button class="thp-btn" id="thp-submit" type="button">Get Expert Guidance &rarr;</button>' +
        '</div>' +
        '<div class="thp-note">Your details are held in strict confidence and are not shared with third parties.</div>' +
      '</div>' +
    '</div>';

  var startedAt = 0;

  function open() {
    if (shown) return;
    shown = true; markSeen();
    document.head.appendChild(styleEl);
    document.body.appendChild(back); try { window.thpToggleSm && window.thpToggleSm(); } catch (e) {}
    startedAt = Math.floor(Date.now() / 1000);
    requestAnimationFrame(function () { requestAnimationFrame(function () { back.classList.add("on"); }); });
    document.addEventListener("keydown", onKey);
  }
  /* Toggle executive search question based on Nature of Enquiry */
  window.thpToggleSm = function() {
    var role = document.getElementById("thp-role");
    var smWrap = document.getElementById("thp-sm-wrap");
    if (!role || !smWrap) return;
    var isRPO = role.value === "RPO: Embedded Recruiting";
    smWrap.style.display = (role.value && !isRPO) ? "" : "none";
    if (isRPO) {
      var sm = document.getElementById("thp-sm");
      if (sm) sm.selectedIndex = 0;
    }
  };

  function close() {
    back.classList.remove("on");
    document.removeEventListener("keydown", onKey);
    setTimeout(function () { if (back.parentNode) back.parentNode.removeChild(back); }, 320);
  }
  function onKey(e) { if (e.key === "Escape") close(); }

  back.addEventListener("click", function (e) {
    if (e.target === back) close();                               // click outside card
    if (e.target.closest && e.target.closest(".thp-x")) close();  // X button
  });

  function submit() {
    var name = (document.getElementById("thp-name").value || "").trim();
    var email = (document.getElementById("thp-email").value || "").trim();
    var phoneRaw = (document.getElementById("thp-phone").value || "").trim();
    var phone = (window.thpIti && window.thpIti.getNumber) ? (window.thpIti.getNumber() || phoneRaw) : phoneRaw;
    var company = (document.getElementById("thp-company").value || "").trim();
    var role = (document.getElementById("thp-role").value || "").trim();
    var hp = (document.getElementById("thp-website").value || "").trim();
    var err = document.getElementById("thp-err");
    var btn = document.getElementById("thp-submit");
    err.textContent = ""; err.style.cssText = "";
    // Clear all field highlights
    ["thp-name","thp-email","thp-phone","thp-company","thp-role","thp-intent"].forEach(function(id){
      var el=document.getElementById(id); if(el)el.style.borderColor="";
    });
    function fail(id, msg) {
      err.textContent = msg;
      err.style.cssText = "font-size:13px;color:#B91C1C;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:8px 12px;margin-top:6px;line-height:1.4;";
      var el = document.getElementById(id); if(el){ el.style.borderColor="#B91C1C"; el.focus(); }
    }
    if (!name) { fail("thp-name", "Please add your name."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { fail("thp-email", "Please enter a valid work email."); return; }
    if (/@(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|aol|icloud|me|mac|protonmail|proton|gmx|mail)\.(com|co\.in|co\.uk|net|org|me|in)$/i.test(email)) { fail("thp-email", "Please add your official ID."); return; }
    if (!phoneRaw) { fail("thp-phone", "Please add a phone number."); return; }
    if (window.thpIti && window.thpIti.isValidNumber && !window.thpIti.isValidNumber()) {
      fail("thp-phone", "Please enter a valid phone number."); return;
    }
    if (!company) { fail("thp-company", "Please add your company."); return; }
    if (!role) { fail("thp-role", "Please select a service area."); return; }
    var intentEl = document.getElementById("thp-intent");
    var leadIntent = intentEl ? intentEl.value : "";
    if (intentEl && !leadIntent) { fail("thp-intent", "Please select what you would like to achieve."); return; }
    var leadType = (window.thLeadTypeFor ? window.thLeadTypeFor(leadIntent) : (leadIntent.indexOf("career")!==-1?"Candidate":(leadIntent?"Client":"")));
    var smWrap = document.getElementById("thp-sm-wrap");
    var smVisible = smWrap && smWrap.style.display !== "none";
    var smEl = document.getElementById("thp-sm");
    var searchModel = "";
    if (smVisible && smEl) {
      if (!smEl.value) { fail("thp-sm", "Please answer the search model question."); return; }
      searchModel = smEl.value;
    }
    var wasContingentNo = (searchModel.indexOf("No, we are only considering contingent") === 0);
    btn.setAttribute("disabled", "true"); btn.textContent = "Sending\u2026";

    window.__thNoRedirect = true;  // stay on page; show inline thanks
    fetch("/submit.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name, email: email, company: company,
        service_area: "Engagement popup", phone: phone, role: role,
        search_model: searchModel,
        lead_intent: leadIntent, lead_type: leadType,
        message: "Engagement popup lead (" + path + ")",
        page: location.pathname,
        website: hp, form_started_at: startedAt,
        lead_id: window.thLeadId || "",
        first_touch_source: (window.thFirstTouch||{}).source || "",
        first_touch_medium: (window.thFirstTouch||{}).medium || "",
        first_touch_campaign: (window.thFirstTouch||{}).campaign || "",
        referrer: (window.thFirstTouch||{}).referrer || "",
        landing_page: (window.thFirstTouch||{}).landing_page || ""
      })
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        if (d && d.ok) {
          var noteHtml = wasContingentNo ?
            '<div style="text-align:left;font-size:12.5px;line-height:1.55;color:#171410;background:#FAF3E0;border-left:2px solid #B91C1C;padding:10px 12px;margin-top:16px;">' +
            '<strong style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#6B6258;display:block;margin-bottom:4px;">A note on our search model</strong>' +
            'Thank you for sharing this. Talhive may not be the right fit for contingent-only recruitment requirements. Our search model is best suited for executive search mandates that involve deeper role calibration, market mapping, targeted talent engagement, and senior-level candidate outreach.</div>' : '';
          document.getElementById("thp-body").innerHTML =
            '<div class="thp-ok"><div class="thp-rule" style="margin:0 auto 18px;"></div>' +
            '<div class="thp-h">Thank you. Your note is with us.</div>' +
            '<p class="thp-p">A Talhive partner will be in touch shortly. We\u2019ve also sent a confirmation to your inbox.</p>' +
            noteHtml +
            '<button class="thp-btn" type="button" id="thp-done">Close</button></div>';
          var done = document.getElementById("thp-done");
          if (done) done.addEventListener("click", close);
          if(window.thTrackFormSubmit)window.thTrackFormSubmit('popup',searchModel);
          if(window.thPushToSheets)window.thPushToSheets({name:name,email:email,phone:phone,company:company,role:role,search_model:searchModel,lead_intent:leadIntent,lead_type:leadType,service_area:"Engagement popup",page:location.pathname});
        } else {
          btn.removeAttribute("disabled"); btn.innerHTML = "Get Expert Guidance &rarr;";
          err.textContent = (d && d.error) ? d.error : "Something went wrong. Please try again.";
        }
      }).catch(function () {
        btn.removeAttribute("disabled"); btn.innerHTML = "Get Expert Guidance &rarr;";
        err.textContent = "Network error. Please try again.";
      }).then(function () { setTimeout(function () { window.__thNoRedirect = false; }, 4000); });
  }

  function loadIti(cb) {
    if (window.intlTelInput) { cb(); return; }
    if (!document.getElementById("thp-iti-css")) {
      var l = document.createElement("link");
      l.id = "thp-iti-css"; l.rel = "stylesheet";
      l.href = "https://cdn.jsdelivr.net/npm/intl-tel-input@25.11.2/build/css/intlTelInput.min.css";
      document.head.appendChild(l);
    }
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/intl-tel-input@25.11.2/build/js/intlTelInputWithUtils.min.js";
    s.onload = cb; s.onerror = function () { /* plain tel input remains usable */ };
    document.body.appendChild(s);
  }
  function thpApplyGeo(cc){
    var intl = String(cc||'').toLowerCase() !== 'in';
    if(/[?&](intl|force_intl|test_intl)=1/i.test(location.search)) intl = true;
    var w = document.getElementById('thp-sm-wrap');
    if(w) w.style.display = (intl && THP_ROLE !== 'RPO: Embedded Recruiting') ? 'block' : 'none';
  }
  function initPhone() {
    var el = document.getElementById("thp-phone");
    if (!el || !window.intlTelInput || el.dataset.iti) return;
    el.dataset.iti = "1";
    window.thpIti = window.intlTelInput(el, {
      initialCountry: "auto",
      separateDialCode: true,
      countrySearch: true,
      dropdownContainer: document.body,
      geoIpLookup: function (success) {
        function done(cc){try{thpApplyGeo(cc);}catch(e){} success(cc);}
        if (window.thDetectCountry) { window.thDetectCountry(done); } else { done("in"); }
      }
    });
    el.addEventListener('countrychange', function(){
      var d = window.thpIti.getSelectedCountryData();
      if(d && d.iso2){try{thpApplyGeo(d.iso2);}catch(e){}}
    });
    if(window.thLimitItiPhone) window.thLimitItiPhone(el, window.thpIti);

  }
  function wire() {
    document.getElementById("thp-submit").addEventListener("click", submit);
    document.getElementById("thp-email").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    loadIti(initPhone);
  }
  // wire after the node is in the DOM (open appends it)
  var _open = open;
  open = function () { _open(); wire(); };

  /* ---------- triggers ---------- */
  function trigger() { if (!fired) { fired = true; open(); } }

  var elapsed = Date.now() - start;
  if (elapsed >= DELAY_MS) {
    setTimeout(function __thTry(){ if(__thPopupBusy()){ setTimeout(__thTry, 15000); return; } trigger(); }, GRACE_MS);
  } else {
    setTimeout(trigger, DELAY_MS - elapsed);
  }

  // Desktop exit-intent: pointer leaves toward the top of the viewport.
  if (!("ontouchstart" in window)) {
    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && e.clientY <= 4) trigger();
    });
  }
})();
