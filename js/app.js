/* Hash router + global event wiring. Hash routes work on GitHub Pages with no server config. */
window.App = (() => {
  const root = document.getElementById('app');

  const routes = [
    { path: '/', view: 'landing', access: 'guest' },
    { path: '/signup', view: 'signup', access: 'guest', title: 'Sign up' },
    { path: '/login', view: 'login', access: 'guest', title: 'Log in' },
    { path: '/browse', view: 'browse', access: 'teacher', title: 'Browse' },
    { path: '/item/:id', view: 'item', access: 'teacher', title: 'Item' },
    { path: '/request/:id', view: 'request', access: 'teacher', title: 'New request' },
    { path: '/my-requests', view: 'myRequests', access: 'teacher', title: 'My requests' },
    { path: '/my-data', view: 'myData', access: 'teacher', title: 'My data' },
    { path: '/settings', view: 'settings', access: 'user', title: 'Settings' },
    { path: '/admin', view: 'adminDashboard', access: 'admin', title: 'Dashboard' },
    { path: '/admin/requests', view: 'adminRequests', access: 'admin', title: 'Requests' },
    { path: '/admin/requests/:id', view: 'adminRequest', access: 'admin', title: 'Request' },
    { path: '/admin/inventory', view: 'adminInventory', access: 'admin', title: 'Inventory' },
    { path: '/admin/insights', view: 'adminInsights', access: 'admin', title: 'Insights' },
  ];

  function match(path) {
    for (const r of routes) {
      const a = r.path.split('/'); const b = path.split('/');
      if (a.length !== b.length) continue;
      const params = {};
      if (a.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(b[i])), true) : seg === b[i]))) return { route: r, params };
    }
    return null;
  }

  const home = (user) => (user ? (user.role === 'admin' ? '#/admin' : '#/browse') : '#/');

  function go(hash, replace = false) {
    if (replace) { history.replaceState(null, '', hash); render(); return; }
    if (location.hash === hash) render(); else location.hash = hash;
  }

  function render() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = raw.split('?');
    const path = pathPart.replace(/\/+$/, '') || '/';
    const query = U.parseQuery(queryPart);
    const user = Auth.current();
    const found = match(path);

    if (!found) { go(home(user), true); return; }
    const { route, params } = found;
    if (route.access === 'guest' && user) { go(home(user), true); return; }
    if (route.access !== 'guest' && !user) { go(`#/login?next=${encodeURIComponent(`#${raw}`)}`, true); return; }
    if ((route.access === 'teacher' || route.access === 'admin') && user.role !== route.access) { go(home(user), true); return; }

    if (user) DB.runDailyChecks();
    document.title = route.title ? `${route.title} · STEM Makerspace Loans` : 'STEM Makerspace Loans';
    document.getElementById('modal-root').innerHTML = '';
    try {
      Views[route.view](root, { user, params, query });
    } catch (err) {
      console.error(err);
      const msg = UI.emptyState('alert', 'Something went wrong', 'This page couldn’t be displayed.', `<a class="btn btn-primary" href="${home(user)}">Go home</a>`);
      root.innerHTML = user ? UI.shell(user, '', msg) : `<main class="page">${msg}</main>`;
    }
    window.scrollTo(0, 0);
  }

  // Re-render: either a view's own local render (keeps tab/page state) or the whole route.
  function refresh(localRender) {
    if (typeof localRender === 'function') localRender(); else render();
  }

  /* ---------- global delegated events ---------- */
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle]');
    const openDropdowns = document.querySelectorAll('.dropdown.open');
    if (toggle) {
      const dd = toggle.closest('[data-dropdown]');
      const willOpen = !dd.classList.contains('open');
      openDropdowns.forEach((d) => d.classList.remove('open'));
      dd.classList.toggle('open', willOpen);
      toggle.setAttribute('aria-expanded', willOpen);
      return;
    }
    if (!e.target.closest('.menu')) openDropdowns.forEach((d) => d.classList.remove('open'));

    const action = e.target.closest('[data-action]');
    if (action && action.dataset.action === 'logout') {
      Auth.logout();
      UI.toast('You’re logged out.');
      go('#/');
      return;
    }
    if (action && action.dataset.action === 'read-all') {
      const user = Auth.current();
      if (user) DB.markAllRead(user.id);
      const menu = action.closest('.menu');
      if (menu && user) menu.innerHTML = UI.notificationMenu(DB.notificationsFor(user.id));
      const dot = document.querySelector('.icon-btn .dot');
      if (dot) dot.remove();
      return;
    }
    const notif = e.target.closest('[data-notif]');
    if (notif) {
      DB.markNotificationRead(notif.dataset.notif);
      openDropdowns.forEach((d) => d.classList.remove('open'));
      go(notif.dataset.link || location.hash);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
  });

  // Keep multiple tabs in sync when data changes elsewhere.
  window.addEventListener('storage', (e) => { if (e.key === 'sml_db_v1') location.reload(); });
  window.addEventListener('hashchange', render);

  const api = { go, refresh, render };
  window.App = api; // expose before the first render so views can navigate
  render();
  return api;
})();
