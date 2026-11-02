/* Talhive — lead intent qualifier.
   Adds a mandatory "What would you like to achieve through this conversation?"
   dropdown directly above the submit button on every lead form (contact page,
   engagement popup, and all inline lead forms). The answer identifies whether
   the lead is a candidate (career seeker) or a client (hiring), captured in the
   submission payload as lead_intent + lead_type. Redirect behaviour is unchanged:
   all leads still proceed to the scheduling flow.

   Field id convention mirrors the existing -sm qualifier: <prefix>-intent.
   Submission capture is handled centrally here via a global helper so each
   form's submit handler only needs a one-line validation + payload merge. */
(function () {
  "use strict";

  var Q = "What would you like to achieve through this conversation?";
  var OPTS = [
    ["", "Select one", true],
    ["Explore career opportunities", "Explore career opportunities", false],
    ["Discuss hiring or talent acquisition needs", "Discuss hiring or talent acquisition needs", false]
  ];

  // Map a selected option to a clean lead_type for easy filtering in the sheet.
  function leadTypeFor(val) {
    if (!val) return "";
    return val.indexOf("career") !== -1 ? "Candidate" : "Client";
  }
  // expose for submit handlers
  window.thLeadTypeFor = leadTypeFor;

  function styleOnce() {
    if (document.getElementById("thi-style")) return;
    var st = document.createElement("style");
    st.id = "thi-style";
    st.textContent = ".thi-field .fl-lbl span.thi-req,.thi-field label span.thi-req{color:#B91C1C;}";
    document.head.appendChild(st);
  }

  function build(prefix) {
    var wrap = document.createElement("div");
    wrap.className = "field thi-field";
    wrap.id = prefix + "-intent-field";

    var lbl = document.createElement("label");
    lbl.className = "fl-lbl";
    lbl.setAttribute("for", prefix + "-intent");
    lbl.innerHTML = Q + ' <span class="thi-req">*</span>';

    var sel = document.createElement("select");
    sel.className = "form-input";
    sel.id = prefix + "-intent";
    OPTS.forEach(function (o) {
      var op = document.createElement("option");
      op.value = o[0]; op.textContent = o[1];
      if (o[2]) { op.disabled = true; op.selected = true; }
      sel.appendChild(op);
    });

    var err = document.createElement("div");
    err.className = "ferr"; err.id = prefix + "-intent-e";
    err.textContent = "Please select an option.";

    sel.addEventListener("change", function () { err.classList.remove("show"); });

    wrap.appendChild(lbl); wrap.appendChild(sel); wrap.appendChild(err);
    return wrap;
  }

  // Insert the intent field as the last field before the submit button of a form root.
  function findSubmitBtn(root) {
    // Prefer the real submit control; never the intl-tel-input country button.
    var cands = root.querySelectorAll('button.fsubmit, .fsubmit, button.thp-btn, button[type="button"]');
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      if (c.closest(".iti")) continue;                 // skip phone-input internals
      if (/iti__/.test(c.className)) continue;
      return c;
    }
    return null;
  }

  function injectBeforeSubmit(root, prefix) {
    if (!root) return;
    // Skip if this form already has an intent dropdown (hardcoded or injected).
    if (document.getElementById(prefix + "-intent") ||
        document.getElementById(prefix + "-intent-field")) return;
    var btn = findSubmitBtn(root);
    if (!btn || !btn.parentNode) return;
    var field = build(prefix);
    btn.parentNode.insertBefore(field, btn);
  }

  // Central validation + payload helper used by every submit handler.
  // Returns {ok:true, value, type} or {ok:false} (and shows the error).
  window.thReadIntent = function (prefix) {
    var sel = document.getElementById(prefix + "-intent");
    var err = document.getElementById(prefix + "-intent-e");
    if (!sel) return { ok: true, value: "", type: "" }; // field absent -> don't block
    if (!sel.value) {
      if (err) err.classList.add("show");
      try { sel.focus(); } catch (e) {}
      return { ok: false };
    }
    if (err) err.classList.remove("show");
    return { ok: true, value: sel.value, type: leadTypeFor(sel.value) };
  };

  function init() {
    styleOnce();

    // 1) Contact page form (prefix "ct", root #contact-fw)
    var ctFw = document.getElementById("contact-fw");
    if (ctFw && document.getElementById("ct-ph")) injectBeforeSubmit(ctFw, "ct");

    // 2) Inline lead forms: any input[type=tel][id$="-ph"] that also has a -n field.
    var phones = document.querySelectorAll('input[type="tel"][id$="-ph"]');
    Array.prototype.forEach.call(phones, function (ph) {
      var prefix = ph.id.replace(/-ph$/, "");
      if (prefix === "ct") return; // handled above
      // inline lead forms use either <prefix>-n or <prefix>-name for the name field
      if (!document.getElementById(prefix + "-n") &&
          !document.getElementById(prefix + "-name")) return;
      // find the form root: nearest container holding the submit button
      var root = ph.closest("form, .fbox, .lead-form, [id$='-fw'], .field") || ph.parentNode;
      // climb to a parent that contains a submit button
      var hop = root, guard = 0;
      while (hop && guard < 6 && !findSubmitBtn(hop)) {
        hop = hop.parentNode; guard++;
      }
      if (hop) injectBeforeSubmit(hop, prefix);
    });
  }

  // The popup builds its DOM asynchronously; expose an injector it can call.
  window.thInjectIntent = function (root, prefix) {
    styleOnce();
    injectBeforeSubmit(root, prefix);
  };

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
