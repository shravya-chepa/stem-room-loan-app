/* Public screens: landing, sign up, log in. */
window.Views = window.Views || {};

(() => {
  const { esc } = U;
  const { icon } = UI;

  const brand = (href = '#/') => `<a class="brand" href="${href}"><span class="brand-mark">${icon('flask', 24)}</span><span class="brand-name">STEM Makerspace Loans</span></a>`;

  /* ---------------- Landing ---------------- */
  Views.landing = (root) => {
    root.innerHTML = `
      <div class="split">
        <section class="split-hero">
          <div class="hero-ring" style="width:620px;height:620px;right:-260px;bottom:-280px"></div>
          ${brand()}
          <div class="hero-body">
            <span class="hero-eyebrow">Equipment lending for educators</span>
            <h1 class="hero-title">Borrow the tools that make STEM hands-on.</h1>
            <p class="hero-text">Browse robotics kits, electronics and fabrication gear, request what your class needs, and track every loan in one place.</p>
          </div>
          <div class="hero-chips">
            <span class="hero-chip">${icon('robot', 22)} Robotics</span>
            <span class="hero-chip">${icon('chip', 22)} Electronics</span>
            <span class="hero-chip">${icon('cube', 22)} Fabrication</span>
          </div>
        </section>
        <section class="split-main">
          <div class="card welcome-card">
            <div class="welcome-icon">${icon('flask', 34)}</div>
            <h2 style="font-size:34px;font-weight:800">Welcome</h2>
            <p class="muted" style="font-size:17px;margin-top:10px">Teachers and makerspace admins sign in here.</p>
            <a class="btn btn-primary btn-lg btn-block" href="#/signup" style="margin-top:32px">Sign up</a>
            <div class="divider-text">Already have an account?</div>
            <a class="btn btn-outline btn-lg btn-block" href="#/login">Log in</a>
            <p class="muted" style="margin-top:28px">Need help? <button class="link" data-action="contact">Contact the makerspace team</button></p>
          </div>
        </section>
      </div>`;
    root.querySelector('[data-action="contact"]').addEventListener('click', UI.showContact);
  };

  /* ---------------- Sign up ---------------- */
  Views.signup = (root, { query }) => {
    let role = query.role === 'admin' ? 'admin' : 'teacher';
    root.innerHTML = `
      <header class="topbar simple-top"><div class="topbar-inner">${brand()}<span class="muted">Already have an account? <a class="link" href="#/login">Log in</a></span></div></header>
      <main class="page">
        <form class="card form-card" novalidate>
          <h1 class="form-title">Create your account</h1>
          <p class="muted" style="font-size:17px;margin-top:8px">Tell us who you are so we can match you to your school’s makerspace.</p>

          <div class="label" style="margin-top:32px;margin-bottom:12px">I am signing up as</div>
          <div class="option-grid" role="radiogroup" aria-label="Account type">
            <button type="button" class="option" data-role="teacher" role="radio">${icon('cap', 24)}<span><div class="opt-title">Teacher</div><div class="opt-sub">Browse and request items</div></span></button>
            <button type="button" class="option" data-role="admin" role="radio">${icon('shield', 24)}<span><div class="opt-title">Admin</div><div class="opt-sub">Manage inventory and approvals</div></span></button>
          </div>

          <div class="form-grid" style="margin-top:28px">
            <div class="field"><label for="su-name">Full name</label><input class="input" id="su-name" name="name" placeholder="e.g. Jordan Reyes" autocomplete="name"></div>
            <div class="field"><label for="su-school">School</label><input class="input" id="su-school" name="school" placeholder="School name" list="school-list" autocomplete="organization"></div>
            <div class="field"><label for="su-location">Location</label><input class="input" id="su-location" name="location" placeholder="City or district" autocomplete="address-level2"></div>
            <div class="field"><label for="su-email">School email</label><input class="input" id="su-email" name="email" type="email" placeholder="name@school.org" autocomplete="email"></div>
            <div class="field"><label for="su-id" data-id-label>Teacher ID</label><input class="input" id="su-id" name="loginId" autocomplete="username"><div class="hint" data-id-hint></div></div>
            <div class="field"><label for="su-pw">Password</label><input class="input" id="su-pw" name="password" type="password" placeholder="At least 8 characters" autocomplete="new-password"><div class="hint">Use letters, numbers and a symbol.</div></div>
            <div class="field span-2">
              <label class="checkbox" style="font-weight:500"><input type="checkbox" name="agree"><span>I agree to the makerspace <button type="button" class="link" data-action="policy">loan policy</button> and will return equipment on time.</span></label>
            </div>
          </div>
          <datalist id="school-list">${DB.SCHOOLS.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>

          <div class="row-between" style="margin-top:32px">
            <a class="link-plain" href="#/">${icon('arrowLeft', 18)} Back</a>
            <button class="btn btn-primary btn-lg" type="submit">Create account</button>
          </div>
        </form>
      </main>`;

    const form = root.querySelector('form');
    const applyRole = () => {
      root.querySelectorAll('[data-role]').forEach((b) => { const on = b.dataset.role === role; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
      root.querySelector('[data-id-label]').textContent = role === 'teacher' ? 'Teacher ID' : 'Admin ID';
      root.querySelector('[data-id-hint]').textContent = role === 'teacher' ? 'Found on your district staff badge.' : 'Issued by the district makerspace office.';
      form.loginId.placeholder = role === 'teacher' ? 'e.g. T-204518' : 'e.g. A-100234';
    };
    root.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', () => { role = b.dataset.role; applyRole(); }));
    root.querySelector('[data-action="policy"]').addEventListener('click', UI.showLoanPolicy);
    applyRole();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        role, name: form.name.value, school: form.school.value, location: form.location.value,
        email: form.email.value, loginId: form.loginId.value, password: form.password.value, agree: form.agree.checked,
      };
      const result = Auth.signup(data);
      if (result.errors) { UI.setFieldErrors(form, result.errors); return; }
      UI.toast(`Welcome, ${U.firstName(result.user.name)}! Your account is ready.`);
      App.go(result.user.role === 'admin' ? '#/admin' : '#/browse');
    });
  };

  /* ---------------- Log in ---------------- */
  Views.login = (root, { query }) => {
    let role = query.role === 'admin' ? 'admin' : 'teacher';
    root.innerHTML = `
      <div class="split login">
        <section class="split-hero">
          <div class="hero-ring" style="width:560px;height:560px;left:-210px;top:-250px"></div>
          ${brand()}
          <div class="hero-body">
            <h1 class="hero-title" style="font-size:clamp(36px,4vw,56px)">Welcome back.</h1>
            <p class="hero-text">Pick up where you left off — check request status, upcoming returns and what’s newly available.</p>
          </div>
          <div class="hero-toast">
            <span class="t-icon">${icon('check', 20, 2.5)}</span>
            <span><div style="font-weight:700">Request approved</div><div style="opacity:.88">LEGO Spike Prime · 4 kits</div></span>
          </div>
        </section>
        <section class="split-main">
          <div class="auth-panel">
            <h2 style="font-size:38px;font-weight:800">Log in</h2>
            <p class="muted" style="font-size:17px;margin-top:6px">Use your Teacher ID or Admin ID.</p>
            <form novalidate style="margin-top:26px" class="stack gap-20">
              <div class="segmented" role="tablist" aria-label="Account type">
                <button type="button" role="tab" data-role="teacher">Teacher</button>
                <button type="button" role="tab" data-role="admin">Admin</button>
              </div>
              <div class="form-error" role="alert" hidden></div>
              <div class="field"><label for="li-id" data-id-label>Teacher ID</label><input class="input" id="li-id" name="loginId" autocomplete="username"></div>
              <div class="field">
                <div class="label-row"><label for="li-pw">Password</label><button type="button" class="link small" data-action="forgot">Forgot password?</button></div>
                <input class="input" id="li-pw" name="password" type="password" placeholder="Enter your password" autocomplete="current-password">
              </div>
              <label class="checkbox"><input type="checkbox" name="remember" checked><span>Keep me logged in on this device</span></label>
              <button class="btn btn-primary btn-lg btn-block" type="submit">Log in</button>
              <p class="muted" style="text-align:center">New here? <a class="link" href="#/signup">Create an account</a></p>
            </form>
            <div class="demo-box">
              <div class="eyebrow" style="margin-bottom:6px">Demo accounts</div>
              <div class="demo-row"><span>Teacher · <code>T-204518</code></span><button class="link-plain small" data-demo="teacher">Use teacher demo</button></div>
              <div class="demo-row"><span>Admin · <code>A-100234</code></span><button class="link-plain small" data-demo="admin">Use admin demo</button></div>
              <div class="small muted" style="margin-top:4px">Password for both: <code>${esc(DB.DEMO_PASSWORD)}</code></div>
            </div>
          </div>
        </section>
      </div>`;

    const form = root.querySelector('form');
    const err = root.querySelector('.form-error');
    const applyRole = () => {
      root.querySelectorAll('[data-role]').forEach((b) => { const on = b.dataset.role === role; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
      root.querySelector('[data-id-label]').textContent = role === 'teacher' ? 'Teacher ID' : 'Admin ID';
      form.loginId.placeholder = role === 'teacher' ? 'e.g. T-204518' : 'e.g. A-100234';
    };
    root.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', () => { role = b.dataset.role; err.hidden = true; applyRole(); }));
    applyRole();

    root.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
      role = b.dataset.demo; applyRole();
      form.loginId.value = role === 'teacher' ? 'T-204518' : 'A-100234';
      form.password.value = DB.DEMO_PASSWORD;
      err.hidden = true;
      form.querySelector('[type="submit"]').focus();
    }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const user = Auth.login(role, form.loginId.value, form.password.value, form.remember.checked);
        UI.toast(`${U.greeting()}, ${U.firstName(user.name)}!`);
        App.go(query.next && query.next.startsWith('#/') ? query.next : (user.role === 'admin' ? '#/admin' : '#/browse'));
      } catch (ex) {
        err.innerHTML = `${icon('alert', 18)}<span>${esc(ex.message)}</span>`;
        err.hidden = false;
      }
    });

    root.querySelector('[data-action="forgot"]').addEventListener('click', () => {
      UI.modal({
        title: 'Reset your password',
        body: `
          <p>Enter your ID and the school email on your account, then choose a new password.</p>
          <form class="stack gap-16 mt-16" novalidate data-reset>
            <div class="form-error" hidden></div>
            <div class="field"><label for="rp-id">Teacher or Admin ID</label><input class="input sm" id="rp-id" name="loginId" value="${esc(form.loginId.value)}" placeholder="e.g. T-204518"></div>
            <div class="field"><label for="rp-email">School email</label><input class="input sm" id="rp-email" name="email" type="email" placeholder="name@school.org"></div>
            <div class="field"><label for="rp-pw">New password</label><input class="input sm" id="rp-pw" name="password" type="password" placeholder="At least 8 characters"><div class="hint">Use letters, numbers and a symbol.</div></div>
          </form>`,
        actions: [
          { label: 'Cancel' },
          {
            label: 'Reset password', cls: 'btn-primary',
            onClick: (wrap) => {
              const f = wrap.querySelector('[data-reset]');
              const fe = f.querySelector('.form-error');
              try {
                const user = Auth.resetPassword(f.loginId.value, f.email.value, f.password.value);
                form.loginId.value = user.loginId; form.password.value = '';
                role = user.role; applyRole();
                UI.toast('Password updated. Log in with your new password.');
                return true;
              } catch (ex) {
                fe.innerHTML = `${icon('alert', 18)}<span>${esc(ex.message)}</span>`; fe.hidden = false;
                return false;
              }
            },
          },
        ],
      });
    });
  };
})();
