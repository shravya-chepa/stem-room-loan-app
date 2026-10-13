/* Shared UI building blocks: icons, app shell, toasts, modals, badges. */
window.UI = (() => {
  const { esc } = U;

  const PATHS = {
    flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    robot: '<path d="M12 4v4"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M9 13v1"/><path d="M15 13v1"/><path d="M9.5 17h5"/>',
    chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    cube: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    list: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    download: '<path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  };

  const icon = (name, size = 20, stroke = 2) =>
    `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;

  const CATEGORY_ICON = { Robotics: 'robot', Electronics: 'chip', Fabrication: 'cube', Tools: 'wrench' };
  const categoryIcon = (cat) => CATEGORY_ICON[cat] || 'cube';
  const artClass = (item) => (item.consumable ? 'art-consumable' : `art-${String(item.category).toLowerCase()}`);
  const itemArt = (item, size = 52, extraClass = '') =>
    `<div class="art ${artClass(item)} ${extraClass}">${icon(categoryIcon(item.category), size, 1.8)}</div>`;

  /* ---------- availability text ---------- */
  function availability(item) {
    if (item.consumable) {
      const n = item.quantity;
      if (n === 0) return { text: 'Out of stock', low: true };
      return DB.isLowStock(item) ? { text: `${n} left`, low: true } : { text: `${n} in stock`, low: false };
    }
    const a = DB.availableNow(item);
    if (a === 0) {
      const back = DB.nextBack(item);
      return { text: back ? `Back ${U.fmtDate(back)}` : 'All reserved', low: true };
    }
    if (a === 1) return { text: 'Only 1 left', low: true };
    return { text: `${a} of ${item.quantity} available`, low: DB.isLowStock(item) };
  }
  const availHtml = (item) => { const a = availability(item); return `<span class="avail ${a.low ? 'low' : ''}">${esc(a.text)}</span>`; };

  /* ---------- status badges ---------- */
  function statusBadge(r) {
    if (DB.isOverdue(r)) return `<span class="badge badge-overdue">${U.plural(DB.daysLate(r), 'day')} late</span>`;
    const map = { pending: 'Pending', approved: 'Approved', declined: 'Declined', returned: 'Returned', cancelled: 'Cancelled' };
    return `<span class="badge badge-${r.status}">${map[r.status] || esc(r.status)}</span>`;
  }

  const avatar = (name, cls = '') => `<span class="avatar ${cls}" aria-hidden="true">${esc(U.initials(name))}</span>`;

  /* ---------- app shell ---------- */
  function shell(user, active, content, opts = {}) {
    const isAdmin = user.role === 'admin';
    const pending = isAdmin ? DB.requests().filter((r) => r.status === 'pending').length : 0;
    const links = isAdmin
      ? [['dashboard', '#/admin', 'Dashboard'], ['requests', '#/admin/requests', `Requests${pending ? ` <span class="pill-count">${pending}</span>` : ''}`], ['inventory', '#/admin/inventory', 'Inventory'], ['insights', '#/admin/insights', 'Insights']]
      : [['browse', '#/browse', 'Browse'], ['requests', '#/my-requests', 'My requests'], ['data', '#/my-data', 'My data']];
    const notes = DB.notificationsFor(user.id);
    const unread = notes.filter((n) => !n.read).length;
    return `
      <header class="topbar ${isAdmin ? 'topbar-admin' : ''}">
        <div class="topbar-inner">
          <a class="brand" href="${isAdmin ? '#/admin' : '#/browse'}" aria-label="STEM Makerspace Loans home">
            <span class="brand-mark">${icon('flask', 22)}</span>
            <span class="brand-name">STEM Makerspace Loans</span>
            ${isAdmin ? '<span class="brand-badge">ADMIN</span>' : ''}
          </a>
          <nav class="nav" aria-label="Main">
            ${links.map(([key, href, label]) => `<a href="${href}" class="${active === key ? 'active' : ''}" ${active === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
          <div class="top-actions">
            <div class="dropdown" data-dropdown>
              <button class="icon-btn" data-toggle aria-label="Notifications${unread ? ` (${unread} unread)` : ''}">${icon('bell', 21)}${unread ? '<span class="dot"></span>' : ''}</button>
              <div class="menu notif-menu" role="menu">${notificationMenu(notes)}</div>
            </div>
            <a class="icon-btn" href="#/settings" aria-label="Settings">${icon('gear', 21)}</a>
            <div class="dropdown" data-dropdown>
              <button class="user-chip" data-toggle aria-label="Account menu">${avatar(user.name)}<span class="uc-name">${esc(U.firstName(user.name))}</span></button>
              <div class="menu" role="menu">
                <div class="menu-head"><div style="font-weight:700">${esc(user.name)}</div><div class="small muted">${esc(user.loginId)} · ${isAdmin ? 'Admin' : 'Teacher'}</div></div>
                <div class="menu-sep"></div>
                ${isAdmin ? '' : `<a class="menu-item" href="#/my-requests">${icon('list', 18)} My requests</a>`}
                <a class="menu-item" href="#/settings">${icon('gear', 18)} Settings</a>
                <button class="menu-item danger" data-action="logout">${icon('logout', 18)} Log out</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main class="page ${opts.narrow ? 'page-narrow' : ''}" id="main">${content}</main>`;
  }

  const NOTE_ICON = { approved: ['check', ''], declined: ['x', 'red'], returned: ['undo', 'grey'], request: ['inbox', ''], reminder: ['calendar', ''], overdue: ['clock', 'red'], cancelled: ['x', 'grey'] };
  function notificationMenu(notes) {
    const list = notes.slice(0, 12);
    return `
      <div class="notif-head"><strong>Notifications</strong>${notes.some((n) => !n.read) ? '<button class="link-plain small" data-action="read-all">Mark all read</button>' : ''}</div>
      <div class="notif-list">
        ${list.length ? list.map((n) => {
          const [ic, tone] = NOTE_ICON[n.kind] || ['bell', ''];
          return `<button class="notif ${n.read ? '' : 'unread'}" data-notif="${esc(n.id)}" data-link="${esc(n.link || '')}">
            <span class="n-icon ${tone}">${icon(ic, 17)}</span>
            <span><div class="n-title">${esc(n.title)}</div><div class="n-body">${esc(n.body)}</div><div class="n-time">${esc(U.timeAgo(n.createdAt))}</div></span>
          </button>`;
        }).join('') : '<div class="notif-empty">You’re all caught up.</div>'}
      </div>`;
  }

  /* ---------- toasts ---------- */
  function toast(message, type = 'success') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `${icon(type === 'error' ? 'alert' : 'check', 18)}<span>${esc(message)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
  }

  /* ---------- modals ---------- */
  function modal({ title, body, actions = [], wide = false, onMount }) {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h2 class="modal-title">${esc(title)}</h2><button class="modal-close" data-close aria-label="Close">${icon('x', 20)}</button></div>
        <div class="modal-body">${body}</div>
        ${actions.length ? `<div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.cls || 'btn-ghost'}" data-act="${i}">${a.label}</button>`).join('')}</div>` : ''}
      </div>`;
    const prevFocus = document.activeElement;
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    actions.forEach((a, i) => wrap.querySelector(`[data-act="${i}"]`).addEventListener('click', () => {
      if (a.onClick) { if (a.onClick(wrap, close) === false) return; }
      close();
    }));
    document.addEventListener('keydown', onKey);
    root.appendChild(wrap);
    if (onMount) onMount(wrap, close);
    const focusTarget = wrap.querySelector('input, textarea, select') || wrap.querySelector('.modal-foot .btn:last-child') || wrap.querySelector('[data-close]');
    if (focusTarget) focusTarget.focus();
    return { el: wrap, close };
  }

  function confirm({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
    return modal({
      title,
      body: `<p>${message}</p>`,
      actions: [{ label: 'Cancel' }, { label: confirmLabel, cls: danger ? 'btn-danger' : 'btn-primary', onClick: onConfirm }],
    });
  }

  function showLoanPolicy() {
    modal({
      title: 'Makerspace loan policy',
      wide: true,
      body: `
        <p>The STEM Makerspace lends equipment to teachers across the district so every classroom can do hands-on STEM.</p>
        <ul>
          <li><strong>Who can borrow:</strong> verified teachers and staff with a district Teacher ID.</li>
          <li><strong>Loan length:</strong> 1–3 weeks depending on the item. Each item lists its maximum loan.</li>
          <li><strong>Approval:</strong> an admin reviews every request, usually within one school day.</li>
          <li><strong>Pickup & return:</strong> collect items from the listed shelf on your pickup date and return them complete, clean and charged by the return date.</li>
          <li><strong>Consumables:</strong> filament, batteries and materials are not returned — tell us how much you’ll use so we can restock.</li>
          <li><strong>Late returns:</strong> repeated late returns may limit future requests.</li>
          <li><strong>Damage or loss:</strong> report it to the makerspace team right away. Accidents happen — we just need to know.</li>
        </ul>`,
      actions: [{ label: 'Got it', cls: 'btn-primary' }],
    });
  }

  function showContact() {
    modal({
      title: 'Contact the makerspace team',
      body: `
        <p>We’re happy to help with accounts, requests or equipment questions.</p>
        <div class="stack gap-12 mt-16">
          <div class="row gap-12">${icon('mail', 18)}<a href="mailto:makerspace@district.school.org">makerspace@district.school.org</a></div>
          <div class="row gap-12">${icon('clock', 18)}<span>Mon–Fri, 7:30 AM – 4:00 PM</span></div>
          <div class="row gap-12">${icon('flask', 18)}<span>District STEM Makerspace, Room 114</span></div>
        </div>`,
      actions: [{ label: 'Close', cls: 'btn-primary' }],
    });
  }

  function emptyState(iconName, title, text, action = '') {
    return `<div class="empty"><div class="empty-icon">${icon(iconName, 28)}</div><h3>${esc(title)}</h3><p>${text}</p>${action ? `<div class="mt-16">${action}</div>` : ''}</div>`;
  }

  // Wires up a stepper (− input +) inside root. Returns an object to read/update limits.
  function stepper(root, { min = 1, max = 99, value = 1, onChange }) {
    const input = root.querySelector('input');
    const [dec, inc] = root.querySelectorAll('button');
    const state = { min, max, value };
    const render = () => {
      input.value = state.value;
      dec.disabled = state.value <= state.min;
      inc.disabled = state.value >= state.max;
    };
    const set = (v, silent) => {
      const n = parseInt(v, 10);
      state.value = U.clamp(Number.isFinite(n) ? n : state.min, state.min, Math.max(state.min, state.max));
      render();
      if (!silent && onChange) onChange(state.value);
    };
    dec.addEventListener('click', () => set(state.value - 1));
    inc.addEventListener('click', () => set(state.value + 1));
    input.addEventListener('change', () => set(input.value));
    render();
    return {
      get value() { return state.value; },
      setMax(m) { state.max = Math.max(0, m); set(state.value, true); },
      set,
    };
  }
  const stepperHtml = (value, label, block = false) =>
    `<div class="stepper ${block ? 'block' : ''}" data-stepper><button type="button" aria-label="Decrease">${icon('minus', 18, 2.5)}</button><input type="number" inputmode="numeric" value="${value}" aria-label="${esc(label)}"><button type="button" aria-label="Increase">${icon('plus', 18, 2.5)}</button></div>`;

  // Simple inline field error helpers
  function setFieldErrors(form, errors) {
    form.querySelectorAll('.field').forEach((f) => {
      f.classList.remove('has-error');
      f.querySelectorAll('.field-error').forEach((e) => e.remove());
      f.querySelectorAll('.hint').forEach((h) => { h.hidden = false; });
    });
    Object.entries(errors).forEach(([name, msg]) => {
      const el = form.querySelector(`[name="${name}"]`);
      const field = el && el.closest('.field');
      if (!field) return;
      field.classList.add('has-error');
      const hint = field.querySelector('.hint');
      if (hint) hint.hidden = true;
      field.insertAdjacentHTML('beforeend', `<div class="field-error">${esc(msg)}</div>`);
    });
    const first = Object.keys(errors)[0];
    if (first) { const el = form.querySelector(`[name="${first}"]`); if (el) el.focus(); }
  }

  return {
    icon, categoryIcon, artClass, itemArt, availability, availHtml, statusBadge, avatar, shell, notificationMenu,
    toast, modal, confirm, showLoanPolicy, showContact, emptyState, stepper, stepperHtml, setFieldErrors,
  };
})();
