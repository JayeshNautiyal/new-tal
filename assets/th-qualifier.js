/* Talhive — international executive search qualifier for inline lead forms.
   Injects the question below the phone field, shown only when the selected
   country (the -cc dial-code select) is not India (+91). Submission blocking
   and payload capture for these forms live in submitForm() on each page. */
(function () {
  "use strict";
  var Q = "Are you open to an executive search model for this mandate?";
  var OPTS = [
    ["", "Select one", true],
    ["Yes, executive search is the right model for this role", "Yes, executive search is the right model for this role", false],
    ["Yes, open to executive search after calibration", "Yes, open to executive search after calibration", false],
    ["Not sure yet, I would like to understand the model", "Not sure yet, I would like to understand the model", false],
    ["No, we are only considering contingent / success-fee recruitment", "No, we are only considering contingent / success-fee recruitment", false]
  ];
  var TEST = /[?&](intl|force_intl|test_intl)=1/i.test(location.search);

  function isIndia(cc) { return String(cc || "").replace(/\s/g, "") === "+91"; }

  function styleOnce() {
    if (document.getElementById("thq-style")) return;
    var st = document.createElement("style");
    st.id = "thq-style";
    st.textContent =
            ".thq-field .fl-lbl span.thq-req{color:#B91C1C;}";
    document.head.appendChild(st);
  }

  function build(prefix) {
    var wrap = document.createElement("div");
    wrap.className = "field thq-field";
    wrap.id = prefix + "-sm-field";
    wrap.style.display = "none";
    wrap.style.marginTop = "16px";

    var lbl = document.createElement("label");
    lbl.className = "fl-lbl";
    lbl.setAttribute("for", prefix + "-sm");
    lbl.innerHTML = Q + ' <span class="thq-req">*</span>';

    var sel = document.createElement("select");
    sel.className = "form-input";
    sel.id = prefix + "-sm";
    OPTS.forEach(function (o) {
      var op = document.createElement("option");
      op.value = o[0]; op.textContent = o[1];
      if (o[2]) { op.disabled = true; op.selected = true; }
      sel.appendChild(op);
    });

    var err = document.createElement("div");
    err.className = "ferr"; err.id = prefix + "-sm-e";
    err.textContent = "Please select an option.";

    sel.addEventListener("change", function () {
      err.classList.remove("show");
    });

    wrap.appendChild(lbl); wrap.appendChild(sel); wrap.appendChild(err);
    return wrap;
  }

  function toggle(prefix) {
    var f = document.getElementById(prefix + "-sm-field");
    if (!f) return;
    /* Hide if Nature of Enquiry is not yet selected or is RPO */
    var svc = document.getElementById(prefix + "-svc");
    var svcVal = svc ? svc.value : "";
    var isRPO = svcVal === "RPO: Embedded Recruiting";
    var hasSelection = svcVal !== "" && svcVal !== "Select a service area";
    f.style.display = (hasSelection && !isRPO) ? "block" : "none";
    /* Reset the selection when hiding */
    if (!hasSelection || isRPO) {
      var sel = document.getElementById(prefix + "-sm");
      if (sel) sel.selectedIndex = 0;
    }
  }

  function init() {
    var phones = document.querySelectorAll('input[type="tel"][id$="-ph"]');
    if (!phones.length) return;
    styleOnce();
    Array.prototype.forEach.call(phones, function (ph) {
      var prefix = ph.id.replace(/-ph$/, "");
      // inline lead forms only: must have a name field and svc dropdown; skip if already injected
      if (!document.getElementById(prefix + "-n") && !document.getElementById(prefix + "-name")) return;
      if (document.getElementById(prefix + "-sm-field")) return;
      var fieldWrap = ph.closest(".field") || ph.parentNode;
      if (!fieldWrap || !fieldWrap.parentNode) return;
      /* Insert after the Nature of Enquiry dropdown if it exists, otherwise after phone */
      var svcEl = document.getElementById(prefix + "-svc");
      var insertAfter = (svcEl && svcEl.closest(".field")) || fieldWrap;
      insertAfter.parentNode.insertBefore(build(prefix), insertAfter.nextSibling);
      var cc = document.getElementById(prefix + "-cc");
      if (cc) cc.addEventListener("change", function () { toggle(prefix); });
      /* Listen to Nature of Enquiry dropdown to hide executive search question for RPO */
      var svc = document.getElementById(prefix + "-svc");
      if (svc) svc.addEventListener("change", function () { toggle(prefix); });
      toggle(prefix);
      // re-check shortly after, in case locale auto-select set -cc late
      setTimeout(function () { toggle(prefix); }, 400);
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
