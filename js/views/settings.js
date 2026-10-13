/* Settings: profile, password, demo data. Shared by teachers and admins. */
window.Views = window.Views || {};

(() => {
  const { esc } = U;
  const { icon } = UI;

  Views.settings = (root, { user }) => {
    const isAdmin = user.role === 'admin';
    root.innerHTML = UI.shell(user, '', `
      <div class="page-head"><div><h1 class="page-title">Settings</h1><p class="page-sub">Manage your profile, password and this device.</p></div></div>
      <div class="settings-grid">
        <section class="card card-pad">
          <div class="row gap-16" style="margin-bottom:22px">${UI.avatar(user.name, 'avatar-lg')}
            <div><h2 class="card-title">${esc(user.name)}</h2><div class="muted">${isAdmin ? 'Admin' : 'Teacher'} ID <span class="kbd-id">${esc(user.loginId)}</span></div></div>
          </div>
          <form class="form-grid" novalidate data-profile>
            <div class="field"><label for="st-name">Full name</label><input class="input sm" id="st-name" name="name" value="${esc(user.name)}"></div>
            <div class="field"><label for="st-email">School email</label><input class="input sm" id="st-email" name="email" type="email" value="${esc(user.email)}"></div>
            <div class="field"><label for="st-school">School</label><input class="input sm" id="st-school" name="school" value="${esc(user.school)}" list="st-schools"></div>
            <div class="field"><label for="st-loc">Location</label><input class="input sm" id="st-loc" name="location" value="${esc(user.location)}"></div>
            <datalist id="st-schools">${DB.SCHOOLS.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
            <div class="span-2 row" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">Save profile</button></div>
          </form>
        </section>

        <section class="card card-pad">
          <h2 class="card-title">Change password</h2>
          <p class="muted small mt-8">Use at least 8 characters with letters, numbers and a symbol.</p>
          <form class="form-grid mt-16" novalidate data-password>
            <div class="field span-2"><label for="st-cur">Current password</label><input class="input sm" id="st-cur" name="current" type="password" autocomplete="current-password"></div>
            <div class="field"><label for="st-new">New password</label><input class="input sm" id="st-new" name="next" type="password" autocomplete="new-password"></div>
            <div class="field"><label for="st-conf">Confirm new password</label><input class="input sm" id="st-conf" name="confirm" type="password" autocomplete="new-password"></div>
            <div class="span-2 row" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">Update password</button></div>
          </form>
        </section>

        <section class="card card-pad">
          <h2 class="card-title">Demo data</h2>
          <p class="muted mt-8">Everything in this app is stored in your browser. Resetting restores the sample teachers, inventory and requests, and removes any accounts you created on this device.</p>
          <div class="row gap-12 wrap mt-16">
            <button class="btn btn-danger-outline" data-reset>${icon('refresh', 18)} Reset demo data</button>
            <button class="btn btn-ghost" data-action="logout">${icon('logout', 18)} Log out</button>
          </div>
        </section>
      </div>`, { narrow: true });

    const profile = root.querySelector('[data-profile]');
    profile.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = {};
      const name = profile.name.value.trim(); const email = profile.email.value.trim();
      if (!name) errors.name = 'Enter your name.';
      const emailErr = Auth.emailProblem(email);
      if (emailErr) errors.email = emailErr;
      else { const other = DB.findUserByEmail(email); if (other && other.id !== user.id) errors.email = 'Another account uses this email.'; }
      if (!profile.school.value.trim()) errors.school = 'Enter your school.';
      UI.setFieldErrors(profile, errors);
      if (Object.keys(errors).length) return;
      DB.updateUser(user.id, { name, email: email.toLowerCase(), school: profile.school.value.trim(), location: profile.location.value.trim() });
      UI.toast('Profile saved');
      App.refresh();
    });

    const pw = root.querySelector('[data-password]');
    pw.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = {};
      if (!pw.current.value) errors.current = 'Enter your current password.';
      const prob = Auth.passwordProblem(pw.next.value);
      if (prob) errors.next = prob;
      else if (pw.next.value !== pw.confirm.value) errors.confirm = 'Passwords don’t match.';
      UI.setFieldErrors(pw, errors);
      if (Object.keys(errors).length) return;
      try {
        Auth.changePassword(user, pw.current.value, pw.next.value);
        pw.reset();
        UI.toast('Password updated');
      } catch (ex) { UI.setFieldErrors(pw, { current: ex.message }); }
    });

    root.querySelector('[data-reset]').addEventListener('click', () => {
      UI.confirm({
        title: 'Reset demo data?',
        message: 'All requests, inventory changes and accounts created on this device will be replaced with the original sample data. You’ll be logged out.',
        confirmLabel: 'Reset data', danger: true,
        onConfirm: () => { DB.reset(); Auth.logout(); UI.toast('Demo data restored'); App.go('#/login'); },
      });
    });
  };
})();
