/* ═══════════════════════════════════════════════
   TALHIVE COMPONENTS.JS
   Global header, footer, exit popup, forms, anim
   ═══════════════════════════════════════════════ */

// ── Logo SVG ────────────────────────────────────
const TH_LOGO = `<img
  src="/images/talhive-logo.png"
  alt="Talhive — Hiring Streamlined"
  width="140"
  height="36"
  style="height:36px;width:auto;display:block"
  loading="eager"
>`;

// ── Web3Forms configuration ───────────────────────
// Get your free key at https://web3forms.com
// Enter: jayeshn.nautiyal@gmail.com → copy the UUID key
// Replace the value below with your key, then redeploy.
const WEB3FORMS_KEY = 'e8081dd4-5636-4d2a-a4cb-b8468b260e7a';


// ── Navigation HTML ──────────────────────────────
function getHeader(activePage='') {
  return `
<header id="th-header" role="banner">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Talhive Home">${TH_LOGO}</a>
    <nav role="navigation" aria-label="Main navigation">
      <ul class="nav-links">
        <li>
          <a href="/services/" ${activePage==='services'?'class="active"':''}>Services</a>
        </li>
        <li>
          <a href="/solutions/" ${activePage==='solutions'?'class="active"':''}>Solutions ▾</a>
          <ul class="nav-dropdown" role="list">
            <li><a href="/solutions/technology-hiring.html">Technology Hiring</a></li>
            <li><a href="/solutions/product-design-hiring.html">Product &amp; Design</a></li>
            <li><a href="/solutions/marketing-sales-hiring.html">Marketing &amp; Sales</a></li>
            <li><a href="/services/executive-search.html">Executive Search</a></li>
          </ul>
        </li>
        <li>
          <a href="/hire/" ${activePage==='hire'?'class="active"':''}>Hire Tech ▾</a>
          <ul class="nav-dropdown" role="list">
            <li><a href="/hire/ai-engineers.html">AI Engineers</a></li>
            <li><a href="/hire/data-scientists.html">Data Scientists</a></li>
            <li><a href="/hire/data-engineers.html">Data Engineers</a></li>
            <li><a href="/hire/machine-learning-engineers.html">ML Engineers</a></li>
            <li><a href="/hire/java-developers.html">Java Developers</a></li>
            <li><a href="/hire/laravel-developers.html">Laravel Developers</a></li>
            <li><a href="/hire/sql-developers.html">SQL Developers</a></li>
            <li><a href="/hire/blockchain-developers.html">Blockchain</a></li>
          </ul>
        </li>
        <li>
          <a href="/india/" ${activePage==='india'?'class="active"':''}>India ▾</a>
          <ul class="nav-dropdown" role="list">
            <li><a href="/india/bangalore.html">Bangalore</a></li>
            <li><a href="/india/mumbai.html">Mumbai</a></li>
            <li><a href="/india/pune.html">Pune</a></li>
            <li><a href="/india/delhi.html">Delhi NCR</a></li>
            <li><a href="/india/gurgaon.html">Gurgaon</a></li>
            <li><a href="/india/hyderabad.html">Hyderabad</a></li>
            <li><a href="/india/chennai.html">Chennai</a></li>
          </ul>
        </li>
        <li>
          <a href="/usa/" ${activePage==='usa'?'class="active"':''}>USA</a>
        </li>
        <li>
          <a href="/blog/">Blog</a>
        </li>
        <li>
          <a href="/case-studies/">Case Studies</a>
        </li>
      </ul>
    </nav>
    <a href="/contact.html" class="nav-cta" aria-label="Start a search with Talhive">Start a Search →</a>
    <button class="nav-hamburger" id="th-menu-btn" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
  <!-- Mobile nav -->
  <div id="th-nav-mobile" class="nav-mobile" role="navigation" aria-label="Mobile navigation">
    <div class="mob-section-title">Services</div>
    <a href="/services/">All Services</a>
    <a href="/services/talent-acquisition.html">Talent Acquisition</a>
    <a href="/services/executive-search.html">Executive Search</a>
    <a href="/services/staffing.html">Staffing</a>
    <div class="mob-section-title">Solutions</div>
    <a href="/solutions/technology-hiring.html">Technology Hiring</a>
    <a href="/solutions/product-design-hiring.html">Product &amp; Design</a>
    <a href="/solutions/marketing-sales-hiring.html">Marketing &amp; Sales</a>
    <div class="mob-section-title">Hire Tech</div>
    <a href="/hire/ai-engineers.html">AI Engineers</a>
    <a href="/hire/data-scientists.html">Data Scientists</a>
    <a href="/hire/data-engineers.html">Data Engineers</a>
    <a href="/hire/machine-learning-engineers.html">ML Engineers</a>
    <a href="/hire/java-developers.html">Java Developers</a>
    <div class="mob-section-title">India</div>
    <a href="/india/">All India</a>
    <a href="/india/bangalore.html">Bangalore</a>
    <a href="/india/mumbai.html">Mumbai</a>
    <a href="/india/pune.html">Pune</a>
    <a href="/india/delhi.html">Delhi NCR</a>
    <a href="/india/gurgaon.html">Gurgaon</a>
    <a href="/india/hyderabad.html">Hyderabad</a>
    <a href="/india/chennai.html">Chennai</a>
    <div class="mob-section-title">Company</div>
    <a href="/usa/">USA</a>
    <a href="/about.html">About Us</a>
    <a href="/blog/">Blog</a>
    <a href="/case-studies/">Case Studies</a>
    <a href="/contact.html" style="background:var(--green-500);color:var(--navy-900);border-radius:var(--radius-full);text-align:center;margin-top:16px;font-weight:700;">Start a Search →</a>
  </div>
</header>`;
}

// ── Footer HTML ──────────────────────────────────
function getFooter() {
  const year = new Date().getFullYear();
  return `
<footer id="th-footer" role="contentinfo">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" aria-label="Talhive Home">${TH_LOGO}</a>
        <p>Talhive is a retained executive search and talent acquisition firm trusted by 270+ companies across India, the US, and Southeast Asia. 97% NPS. 95% offer acceptance rate. 30-day average time-to-hire.</p>
        <div class="footer-social">
          <a href="https://www.linkedin.com/company/talhive" target="_blank" rel="noopener" aria-label="Talhive on LinkedIn">in</a>
          <a href="https://twitter.com/talhive" target="_blank" rel="noopener" aria-label="Talhive on Twitter">𝕏</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <ul>
          <li><a href="/services/">All Services</a></li>
          <li><a href="/services/talent-acquisition.html">Talent Acquisition</a></li>
          <li><a href="/services/executive-search.html">Executive Search</a></li>
          <li><a href="/services/staffing.html">Staffing</a></li>
          <li><a href="/services/global-talent-sourcing.html">Global Sourcing</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Hire Tech</h4>
        <ul>
          <li><a href="/hire/ai-engineers.html">AI Engineers</a></li>
          <li><a href="/hire/data-scientists.html">Data Scientists</a></li>
          <li><a href="/hire/data-engineers.html">Data Engineers</a></li>
          <li><a href="/hire/machine-learning-engineers.html">ML Engineers</a></li>
          <li><a href="/hire/">All Tech Roles →</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>India Offices</h4>
        <ul>
          <li><a href="/india/bangalore.html">Bangalore</a></li>
          <li><a href="/india/mumbai.html">Mumbai</a></li>
          <li><a href="/india/pune.html">Pune</a></li>
          <li><a href="/india/delhi.html">Delhi NCR</a></li>
          <li><a href="/india/">All Cities →</a></li>
        </ul>
        <h4 style="margin-top:24px">Contact</h4>
        <ul>
          <li><a href="mailto:som@talhive.com">som@talhive.com</a></li>
          <li><a href="tel:+919920265005">+91 99202 65005</a></li>
          <li><a href="/contact.html">Get in Touch →</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${year} Talhive. All rights reserved.</span>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/terms.html">Terms of Service</a>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </div>
  </div>
</footer>`;
}

// ── Exit Intent Popup ────────────────────────────
function getExitPopup() {
  return `
<div id="th-exit-popup" role="dialog" aria-modal="true" aria-labelledby="exit-title">
  <div class="exit-card">
    <button class="exit-close" id="th-exit-close" aria-label="Close">&times;</button>
    <div class="exit-emoji">&#x23F1;&#xFE0F;</div>
    <h2 class="t-h3" id="exit-title">In a hurry?</h2>
    <p class="exit-sub">Leave your details and we&#39;ll reach out within 4 business hours with a clear plan for your search.</p>

    <form id="th-exit-form" class="employer-form"
          action="https://api.web3forms.com/submit"
          method="POST" novalidate>
      <input type="hidden" name="access_key" value="e8081dd4-5636-4d2a-a4cb-b8468b260e7a">
      <input type="hidden" name="subject" value="New Hiring Brief — Talhive">
      <input type="hidden" name="Source"    value="Exit Intent Popup">
      <input type="hidden" name="Source Page" id="th-exit-form-source">

      <!-- Success state -->
      <div class="form-success" id="th-exit-form-success"
           style="display:none;text-align:center;padding:28px 0">
        <div style="font-size:2.8rem;margin-bottom:12px">&#x2713;</div>
        <h3 style="margin-bottom:8px">Got it! We&#39;ll be in touch.</h3>
        <p style="color:var(--grey-400);font-size:.9rem">Response within 4 business hours.</p>
      </div>

      <!-- Fields wrapper — hidden after submit -->
      <div id="th-exit-form-fields">
        <div class="form-group">
          <label class="form-label" for="exit-name">
            Your Name <span class="required">*</span>
          </label>
          <input class="form-input" type="text" id="exit-name"
                 name="Name" placeholder="e.g. Rahul Sharma"
                 required autocomplete="name">
          <span class="form-error-msg">Please enter your name</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="exit-email">
            Business Email <span class="required">*</span>
          </label>
          <input class="form-input" type="email" id="exit-email"
                 name="Business Email" placeholder="rahul@yourcompany.com"
                 required autocomplete="email">
          <span class="form-error-msg">Please use a business email (not Gmail / Yahoo)</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="exit-phone">
            Phone Number <span class="required">*</span>
          </label>
          <input class="form-input" type="tel" id="exit-phone"
                 name="Phone" placeholder="+91 98765 43210"
                 required autocomplete="tel">
          <span class="form-error-msg">Please enter your phone number</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="exit-role">
            Role You&#39;re Looking to Hire <span class="required">*</span>
          </label>
          <input class="form-input" type="text" id="exit-role"
                 name="Roles to Fill"
                 placeholder="e.g. Senior Data Scientist" required>
          <span class="form-error-msg">Please enter the role</span>
        </div>

        <button type="submit" class="form-submit" id="th-exit-form-btn">
          <span id="th-exit-form-txt">Connect With Us &#x2192;</span>
          <span id="th-exit-form-spin" style="display:none">&#x27F3;</span>
        </button>
        <p class="form-note">
          &#x1F512; Business emails only &nbsp;&middot;&nbsp; We respond within 4 hours
        </p>
      </div>
    </form>
  </div>
</div>`;}

// ── Toast HTML ───────────────────────────────────
function getToast() {
  return `<div id="th-toast" role="alert" aria-live="polite"></div>`;
}

// ── Employer form builder ────────────────────────
function buildEmployerForm(formId='main-form', formTitle='Start Your Search', compact=false) {
  return `
<form id="${formId}" class="employer-form" action="https://api.web3forms.com/submit" method="POST" novalidate>
  <input type="hidden" name="access_key" value="e8081dd4-5636-4d2a-a4cb-b8468b260e7a">
      <input type="hidden" name="subject" value="New Hiring Brief — Talhive">
  <input type="hidden" name="_next" value="https://www.talhive.com/thank-you/">
  <input type="hidden" name="Source Page" id="${formId}-source">
  <div class="form-success" id="${formId}-success">
    <div class="form-success-icon">✓</div>
    <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:8px">Brief received!</h3>
    <p style="color:var(--grey-400);font-size:.92rem">Our team will reach out within 4 business hours. Check your inbox for a confirmation.</p>
  </div>
  <div id="${formId}-fields">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="${formId}-name">Your Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="${formId}-name" name="Name" placeholder="Rahul Sharma" required autocomplete="name">
        <span class="form-error-msg">Please enter your name</span>
      </div>
      <div class="form-group">
        <label class="form-label" for="${formId}-company">Company Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="${formId}-company" name="Company" placeholder="Acme Technologies" required autocomplete="organization">
        <span class="form-error-msg">Please enter your company name</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="${formId}-email">Business Email <span class="required">*</span></label>
        <input class="form-input" type="email" id="${formId}-email" name="Business Email" placeholder="rahul@acmetech.com" required autocomplete="email">
        <span class="form-error-msg">Please use your business email (not Gmail/Yahoo)</span>
      </div>
      <div class="form-group">
        <label class="form-label" for="${formId}-phone">Phone Number <span class="required">*</span></label>
        <input class="form-input" type="tel" id="${formId}-phone" name="Phone" placeholder="+91 98765 43210" required autocomplete="tel">
        <span class="form-error-msg">Please enter your phone number</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="${formId}-role">Role(s) You're Hiring For <span class="required">*</span></label>
      <input class="form-input" type="text" id="${formId}-role" name="Roles to Fill" placeholder="e.g. Senior AI Engineer, Head of Product" required>
      <span class="form-error-msg">Please tell us what role(s) you need to fill</span>
    </div>
    ${!compact ? `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="${formId}-size">Team / Company Size</label>
        <select class="form-input form-select" id="${formId}-size" name="Company Size">
          <option value="">Select size</option>
          <option value="1-10">1–10 employees</option>
          <option value="11-50">11–50 employees</option>
          <option value="51-200">51–200 employees</option>
          <option value="201-500">201–500 employees</option>
          <option value="500+">500+ employees</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="${formId}-timeline">Hiring Timeline</label>
        <select class="form-input form-select" id="${formId}-timeline" name="Hiring Timeline">
          <option value="">Select timeline</option>
          <option value="ASAP">ASAP — within 2 weeks</option>
          <option value="1-month">Within 1 month</option>
          <option value="1-3-months">1–3 months</option>
          <option value="3-plus">3+ months (planning ahead)</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="${formId}-notes">Additional Context (optional)</label>
      <textarea class="form-input" id="${formId}-notes" name="Additional Notes" rows="3" placeholder="Team context, must-have skills, seniority, compensation range…"></textarea>
    </div>` : ''}
    <button type="submit" class="form-submit" id="${formId}-submit">
      <span id="${formId}-btn-text">Send Search Brief →</span>
      <span id="${formId}-btn-loading" style="display:none" class="spin">⟳</span>
    </button>
    <p class="form-note">🔒 Business emails only · We respond within 4 business hours · No spam, ever</p>
  </div>
</form>`;
}

// ── Email validation ─────────────────────────────
const BLOCKED_DOMAINS = [
  'gmail.com','googlemail.com','yahoo.com','yahoo.in','yahoo.co.in',
  'yahoo.co.uk','yahoo.fr','yahoo.de','yahoo.es','yahoo.it','yahoo.ca',
  'yahoo.com.au','ymail.com','rocketmail.com',
  'hotmail.com','hotmail.in','hotmail.co.uk','hotmail.fr','hotmail.de',
  'outlook.com','outlook.in','live.com','live.in','msn.com',
  'icloud.com','me.com','mac.com',
  'aol.com','rediffmail.com','rediff.com','mail.com',
  'protonmail.com','proton.me','pm.me',
  'tutanota.com','tutanota.de','tuta.io',
  'gmx.com','gmx.net','gmx.de',
  'fastmail.com','fastmail.fm',
  'inbox.com','mail.ru','yandex.com','yandex.ru',
  'mailinator.com','maildrop.cc','guerrillamail.com',
  'yopmail.com','trashmail.com','temp-mail.org','discard.email',
  'throwam.com','spam4.me','sharklasers.com'
];
function isSubdomainBlocked(domain) {
  for (const b of BLOCKED_DOMAINS) {
    if (domain === b || domain.endsWith('.' + b)) return true;
  }
  return false;
}
function isBusinessEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  return !isSubdomainBlocked(domain);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Show toast ───────────────────────────────────
function showToast(msg, type='success') {
  const t = document.getElementById('th-toast');
  if (!t) return;
  t.innerHTML = (type==='success'?'✅':'❌') + ' ' + msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 4500);
}

// ── Form handler ─────────────────────────────────
function initForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Set source page — handle both -src and -source suffix
  const srcField = document.getElementById(formId+'-src')
                || document.getElementById(formId+'-source');
  if (srcField) srcField.value = window.location.pathname;

  // Upgrade selects
  initCustomSelects(form);

  // Real-time: show error as user types / leaves email field
  const _el = form.querySelector('[name="Business Email"]');
  if (_el) {
    const _check = () => {
      const v = _el.value.trim();
      const errEl = _el.nextElementSibling;
      _el.classList.remove('error','valid');
      if (errEl) errEl.classList.remove('visible');
      if (!v) return;
      if (!isValidEmail(v) || !isBusinessEmail(v)) {
        _el.classList.add('error');
        if (errEl) errEl.classList.add('visible');
      } else {
        _el.classList.add('valid');
      }
    };
    _el.addEventListener('blur', _check);
    _el.addEventListener('input', _check);
    _el.addEventListener('paste', () => setTimeout(_check, 30));
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    let valid = true;

    // Clear previous errors
    form.querySelectorAll('.form-error-msg').forEach(el => el.classList.remove('visible'));
    form.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

    // ── Validation ──────────────────────────────
    const nameEl  = form.querySelector('[name="Name"]');
    const emailEl = form.querySelector('[name="Business Email"]');
    const phoneEl = form.querySelector('[name="Phone"]');

    if (nameEl && !nameEl.value.trim()) {
      nameEl.classList.add('error');
      nameEl.nextElementSibling?.classList.add('visible');
      valid = false;
    }
    if (emailEl) {
      if (!isValidEmail(emailEl.value) || !isBusinessEmail(emailEl.value)) {
        emailEl.classList.add('error');
        emailEl.nextElementSibling?.classList.add('visible');
        valid = false;
      }
    }
    if (phoneEl && !phoneEl.value.trim()) {
      phoneEl.classList.add('error');
      phoneEl.nextElementSibling?.classList.add('visible');
      valid = false;
    }
    ['Company','Roles to Fill','Role to Hire'].forEach(n => {
      const f = form.querySelector(`[name="${n}"]`);
      if (f && f.required && !f.value.trim()) {
        f.classList.add('error');
        f.nextElementSibling?.classList.add('visible');
        valid = false;
      }
    });

    if (!valid) return;

    // ── Loading state — handle both ID conventions ─
    const btn     = document.getElementById(formId+'-btn')
                 || document.getElementById(formId+'-submit');
    const btnTxt  = document.getElementById(formId+'-txt')
                 || document.getElementById(formId+'-btn-text');
    const btnSpin = document.getElementById(formId+'-spin')
                 || document.getElementById(formId+'-btn-loading');
    if (btn)     btn.disabled = true;
    if (btnTxt)  btnTxt.style.display  = 'none';
    if (btnSpin) btnSpin.style.display = 'inline';

    // ── Submit via Web3Forms ──────────────────────
    try {
      const data = new FormData(form);
      // Inject Web3Forms access key
      if (!data.get('access_key')) {
        data.set('access_key', WEB3FORMS_KEY);
      }
      // Add CC for delivery copy
      data.set('cc', 'som@talhive.com,pratik@talhive.com');

      const res  = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body:   data,
      });
      const json = await res.json().catch(() => ({}));

      if (json.success) {
        // ── Success: handle both -ok and -success ID ──
        const fieldsEl  = document.getElementById(formId+'-fields');
        const successEl = document.getElementById(formId+'-ok')
                       || document.getElementById(formId+'-success');
        if (fieldsEl)  fieldsEl.style.display = 'none';
        if (successEl) {
          successEl.style.display = 'block';
          successEl.classList.add('visible');
        }
        showToast("Brief sent! We'll be in touch within 4 hours. ✓");
        if (formId === 'th-exit-form') closeExitPopup();
      } else {
        throw new Error(json.message || 'Submission failed');
      }
    } catch(err) {
      console.error('Form error:', err);
      showToast('Something went wrong. Email us at som@talhive.com', 'error');
      if (btn)     btn.disabled = false;
      if (btnTxt)  btnTxt.style.display  = 'inline';
      if (btnSpin) btnSpin.style.display = 'none';
    }
  });
}

// ── Exit popup ───────────────────────────────────
let exitShown = false;
function closeExitPopup() {
  document.getElementById('th-exit-popup')?.classList.remove('active');
}
function initExitIntent() {
  document.addEventListener('mouseleave', (e) => {
    // Only trigger when cursor leaves the browser window entirely (not just to an iframe etc.)
    if (e.clientY <= 0 && !e.relatedTarget && !exitShown && !sessionStorage.getItem('th_exit')) {
      exitShown = true;
      sessionStorage.setItem('th_exit','1');
      document.getElementById('th-exit-popup')?.classList.add('active');
      document.getElementById('th-exit-popup')?.setAttribute('aria-hidden','false');
    }
  });
  // Mobile: show after 45s
  setTimeout(()=>{
    if (!exitShown && !sessionStorage.getItem('th_exit') && window.innerWidth<768) {
      exitShown=true;
      sessionStorage.setItem('th_exit','1');
      document.getElementById('th-exit-popup')?.classList.add('active');
    }
  }, 45000);
  document.getElementById('th-exit-close')?.addEventListener('click', closeExitPopup);
  document.getElementById('th-exit-popup')?.addEventListener('click', (e)=>{
    if (e.target===document.getElementById('th-exit-popup')) closeExitPopup();
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key==='Escape') closeExitPopup();
  });
  initForm('th-exit-form');
}

// ── Scroll animations ────────────────────────────
function initAnimations() {
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(el=>{
      if (el.isIntersecting) { el.target.classList.add('animated'); obs.unobserve(el.target) }
    });
  }, { threshold:.12, rootMargin:'0px 0px -48px 0px' });
  document.querySelectorAll('[data-anim]').forEach(el=>obs.observe(el));
}

// ── Stat counter ─────────────────────────────────
function initCounters() {
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const target= parseFloat(el.dataset.count);
      const suffix= el.dataset.suffix||'';
      const prefix= el.dataset.prefix||'';
      const dec   = el.dataset.decimals||0;
      let start   = 0;
      const dur   = 1800;
      const step  = (timestamp)=>{
        if (!start) start=timestamp;
        const prog = Math.min((timestamp-start)/dur,1);
        const ease = 1-Math.pow(1-prog,3);
        const val  = (target*ease).toFixed(dec);
        el.textContent = prefix+val+suffix;
        if (prog<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, {threshold:.5});
  document.querySelectorAll('[data-count]').forEach(el=>obs.observe(el));
}

// ── Header scroll effect ──────────────────────────
function initHeader() {
  const hdr = document.getElementById('th-header');
  if (!hdr) return;
  window.addEventListener('scroll', ()=>{
    hdr.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive:true });
}

// ── Mobile menu ──────────────────────────────────
function initMobileMenu() {
  const btn = document.getElementById('th-menu-btn');
  const nav = document.getElementById('th-nav-mobile');
  if (!btn || !nav) return;

  // ── KEY FIX ─────────────────────────────────────────────────
  // backdrop-filter:blur on #th-header.scrolled creates a CSS
  // containing block. position:fixed children inside it are no
  // longer fixed to the viewport — they're fixed to the 72px
  // header box, so inset:72px 0 0 0 gives zero height.
  // Moving nav to <body> puts it in the viewport stacking context.
  if (nav.parentElement !== document.body) {
    document.body.appendChild(nav);
  }
  // ────────────────────────────────────────────────────────────

  const close = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    const spans = btn.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  };

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    document.getElementById('th-header')?.classList.toggle('menu-open', open);
    const spans = btn.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close when any nav link is tapped
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', close);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) close();
  });
}

// ── FAQ accordion ────────────────────────────────
function initFAQs() {
  document.querySelectorAll('.faq-item').forEach(item=>{
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', ()=>{
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  });
}

// ── Sticky CTA ───────────────────────────────────
function initStickyBanner() {
  // Show sticky bottom CTA after scrolling past hero
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const banner = document.createElement('div');
  banner.id = 'th-sticky-cta';
  banner.style.cssText=`position:fixed;bottom:0;left:0;right:0;z-index:990;background:var(--navy-800);border-top:1px solid rgba(0,229,160,.2);padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;transform:translateY(100%);transition:transform .3s ease;flex-wrap:wrap`;
  banner.innerHTML=`
    <p style="font-size:.9rem;font-weight:600;color:var(--grey-200);margin:0">
      Ready to find your next A-player? <span style="color:var(--green-500)">95% offer acceptance rate.</span>
    </p>
    <a href="/contact.html" class="btn btn-primary btn-sm" style="animation:pulseGreen 3s ease infinite;flex-shrink:0">Start a Search →</a>`;
  document.body.appendChild(banner);
  let shown=false;
  window.addEventListener('scroll', ()=>{
    const heroBottom = hero.getBoundingClientRect().bottom;
    if (heroBottom<0 && !shown) { banner.style.transform='translateY(0)'; shown=true }
    if (heroBottom>0 && shown)  { banner.style.transform='translateY(100%)'; shown=false }
  }, {passive:true});
}

// ── Init all ─────────────────────────────────────

// ── Nav dropdown hover with 150ms leave-grace ────
// Complements the CSS ::before bridge — prevents
// the menu snapping shut mid-travel on any browser.
function initNavDropdowns() {
  document.querySelectorAll('.nav-links > li').forEach(li => {
    const dd = li.querySelector('.nav-dropdown');
    if (!dd) return;
    let hideTimer = null;

    const show = () => {
      clearTimeout(hideTimer);
      dd.classList.add('dd-open');
      dd.style.opacity    = '1';
      dd.style.pointerEvents = 'all';
      dd.style.transform  = 'translateX(-50%) translateY(0)';
    };
    const scheduleHide = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        dd.classList.remove('dd-open');
        dd.style.opacity    = '';
        dd.style.pointerEvents = '';
        dd.style.transform  = '';
      }, 150);
    };

    li.addEventListener('mouseenter',  show);
    li.addEventListener('mouseleave',  scheduleHide);
    dd.addEventListener('mouseenter',  show);
    dd.addEventListener('mouseleave',  scheduleHide);

    // Keyboard close
    li.addEventListener('keydown', e => {
      if (e.key === 'Escape') { scheduleHide(); li.querySelector('a')?.focus(); }
    });
  });

  // Close all on outside click (touch)
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-links')) {
      document.querySelectorAll('.nav-links > li .nav-dropdown').forEach(dd => {
        dd.style.opacity    = '';
        dd.style.pointerEvents = '';
        dd.style.transform  = '';
      });
    }
  }, true);
}

// ── Custom select — replaces native <select> ──────
// Builds a fully-styled div dropdown that respects
// the dark theme on every OS and browser.
function initCustomSelects(root) {
  const scope = root || document;
  scope.querySelectorAll('select.form-input, select.form-select').forEach(sel => {
    // Skip if already wrapped
    if (sel.closest('.custom-select-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'custom-select-wrap';
    // Copy any extra classes except form-input/form-select
    const extraCls = [...sel.classList].filter(c => !['form-input','form-select'].includes(c));
    if (extraCls.length) wrap.classList.add(...extraCls);

    // Trigger button
    const trigger = document.createElement('div');
    trigger.className = 'cs-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.className = 'cs-label';

    const arrow = document.createElementNS('http://www.w3.org/2000/svg','svg');
    arrow.setAttribute('viewBox','0 0 12 8');
    arrow.setAttribute('fill','none');
    arrow.classList.add('cs-arrow');
    arrow.innerHTML = '<path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';

    trigger.appendChild(label);
    trigger.appendChild(arrow);

    // Dropdown panel
    const dropdown = document.createElement('div');
    dropdown.className = 'cs-dropdown';
    dropdown.setAttribute('role','listbox');

    // Build options from the native select
    const options = [...sel.options];
    options.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'cs-option' + (opt.value === '' ? ' placeholder-opt' : '');
      div.setAttribute('role','option');
      div.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
      div.dataset.value = opt.value;
      div.textContent  = opt.text;
      if (opt.selected) {
        div.classList.add(opt.value === '' ? '' : 'selected');
        label.textContent = opt.value === '' ? opt.text : opt.text;
        if (opt.value !== '') trigger.classList.add('has-value');
      }
      dropdown.appendChild(div);
    });

    // Set placeholder if nothing selected
    if (!label.textContent) label.textContent = options[0]?.text || 'Select';

    // Insert in DOM
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(trigger);
    wrap.appendChild(dropdown);
    wrap.appendChild(sel);  // keep hidden native sel for form submit

    // ── Interactions ─────────────────────────────
    let highlightIdx = -1;
    const allOpts = () => [...dropdown.querySelectorAll('.cs-option')];

    const openDrop = () => {
      wrap.classList.add('open');
      trigger.setAttribute('aria-expanded','true');
      // Scroll selected into view
      const selected = dropdown.querySelector('.cs-option.selected');
      if (selected) selected.scrollIntoView({ block:'nearest' });
    };
    const closeDrop = () => {
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded','false');
      highlightIdx = -1;
      allOpts().forEach(o => o.classList.remove('highlighted'));
    };
    const selectOption = (div) => {
      if (div.classList.contains('placeholder-opt')) { closeDrop(); return; }
      const val = div.dataset.value;
      label.textContent = div.textContent;
      trigger.classList.add('has-value');
      trigger.classList.remove('error');
      // Sync native select
      sel.value = val;
      sel.dispatchEvent(new Event('change', { bubbles:true }));
      // Mark selected
      allOpts().forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-selected','false'); });
      div.classList.add('selected');
      div.setAttribute('aria-selected','true');
      closeDrop();
    };

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.contains('open') ? closeDrop() : openDrop();
    });
    trigger.addEventListener('keydown', e => {
      const opts = allOpts().filter(o => !o.classList.contains('placeholder-opt'));
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        wrap.classList.contains('open') && highlightIdx >= 0
          ? selectOption(opts[highlightIdx])
          : openDrop();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!wrap.classList.contains('open')) { openDrop(); return; }
        highlightIdx = Math.min(highlightIdx+1, opts.length-1);
        opts.forEach((o,i) => o.classList.toggle('highlighted', i===highlightIdx));
        opts[highlightIdx]?.scrollIntoView({ block:'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightIdx = Math.max(highlightIdx-1, 0);
        opts.forEach((o,i) => o.classList.toggle('highlighted', i===highlightIdx));
        opts[highlightIdx]?.scrollIntoView({ block:'nearest' });
      } else if (e.key === 'Escape') {
        closeDrop();
      }
    });
    dropdown.addEventListener('click', e => {
      const opt = e.target.closest('.cs-option');
      if (opt) { e.stopPropagation(); selectOption(opt); }
    });
    // Close when clicking outside
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) closeDrop();
    });
  });
}

function initComponents(opts={}) {
  // Inject header
  const hdrEl = document.getElementById('th-header');
  if (hdrEl) hdrEl.outerHTML = getHeader(opts.activePage||'');
  // Inject footer
  const ftrEl = document.getElementById('th-footer');
  if (ftrEl) ftrEl.outerHTML = getFooter();
  // Inject exit popup & toast
  if (!document.getElementById('th-exit-popup')) {
    document.body.insertAdjacentHTML('beforeend', getExitPopup());
    document.body.insertAdjacentHTML('beforeend', getToast());
  }
  // Init everything
  initHeader();
  initMobileMenu();
  initAnimations();
  initCounters();
  initFAQs();
  initExitIntent();
  initStickyBanner();
  // Inject GTM noscript at body start
  if (!document.getElementById('gtm-noscript')) {
    const ns = document.createElement('noscript');
    ns.id = 'gtm-noscript';
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-MJS5P2T';
    iframe.height = '0'; iframe.width = '0';
    iframe.style.cssText = 'display:none;visibility:hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  }
  // Nav dropdown hover management
  initNavDropdowns();
  // Custom select dropdowns (replaces native <select>)
  initCustomSelects();
  // Init all employer forms on the page
  document.querySelectorAll('.employer-form').forEach(f=>{
    if (f.id) initForm(f.id);
  });
}

// ── Auto-init on DOM ready ────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  const page = document.body.dataset.page||'';
  initComponents({ activePage:page });
});
