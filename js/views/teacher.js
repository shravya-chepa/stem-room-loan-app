/* Teacher screens: browse, item detail, request form, my requests, my data. */
window.Views = window.Views || {};

/* Tiny CSS-only chart helpers (shared with admin screens). */
window.Charts = (() => {
  const { esc } = U;
  const monthKey = (iso) => iso.slice(0, 7);
  const monthLabel = (key) => U.MONTHS[Number(key.slice(5, 7)) - 1];
  // Inclusive list of YYYY-MM keys between two ISO dates.
  function monthRange(fromIso, toIso) {
    const out = [];
    let [y, m] = fromIso.slice(0, 7).split('-').map(Number);
    const [ty, tm] = toIso.slice(0, 7).split('-').map(Number);
    while (y < ty || (y === ty && m <= tm)) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  function grouped(groups, series) {
    const max = Math.max(1, ...groups.flatMap((g) => g.values));
    return `
      <div class="bar-chart" role="img" aria-label="${esc(series.map((s) => s.name).join(' and '))} by month">
        ${groups.map((g) => `<div class="bar-group"><div class="bars">${g.values.map((v, i) => `<div class="bar ${series[i].cls}" style="height:${(v / max) * 100}%" title="${esc(`${series[i].name}: ${v}`)}"><span class="bv">${v}</span></div>`).join('')}</div></div>`).join('')}
      </div>
      <div class="bar-labels">${groups.map((g) => `<span>${esc(g.label)}</span>`).join('')}</div>`;
  }
  function stacked(groups, series) {
    const max = Math.max(1, ...groups.map((g) => U.sum(g.values)));
    return `
      <div class="bar-chart" role="img" aria-label="Requests by month">
        ${groups.map((g) => {
          const total = U.sum(g.values);
          return `<div class="bar-group"><div class="stacked" style="height:${(total / max) * 100}%">${total ? `<span class="bv">${total}</span>` : ''}${g.values.map((v, i) => (v ? `<div class="seg ${series[i].cls}" style="height:${(v / total) * 100}%" title="${esc(`${series[i].name}: ${v}`)}"></div>` : '')).join('')}</div></div>`;
        }).join('')}
      </div>
      <div class="bar-labels">${groups.map((g) => `<span>${esc(g.label)}</span>`).join('')}</div>`;
  }
  const legend = (series) => `<div class="legend">${series.map((s) => `<span><i class="${s.cls}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  function hbars(rows, { fillCls = '', suffix = '' } = {}) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return `<div class="hbar-list">${rows.map((r) => `
      <div class="hbar"><div class="hb-top"><span>${esc(r.label)}</span><span>${r.display ?? r.value}${suffix}</span></div>
      <div class="hb-track"><div class="hb-fill ${fillCls}" style="width:${r.pct ?? (r.value / max) * 100}%"></div></div></div>`).join('')}</div>`;
  }
  return { monthKey, monthLabel, monthRange, grouped, stacked, legend, hbars };
})();

(() => {
  const { esc } = U;
  const { icon } = UI;

  const myRequests = (user) => DB.requests().filter((r) => r.userId === user.id);

  /* ---------------- Browse ---------------- */
  Views.browse = (root, { user, query }) => {
    let cat = DB.CATEGORIES.includes(query.cat) ? query.cat : 'All';
    let term = query.q || '';
    const today = U.today();

    const mine = myRequests(user);
    const active = mine.filter((r) => DB.isActiveLoan(r) && r.pickupDate <= today).sort((a, b) => a.returnDate.localeCompare(b.returnDate));
    const upcoming = mine.filter((r) => DB.isActiveLoan(r) && r.pickupDate > today).sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));
    let nextCard;
    if (active.length) {
      const r = active[0]; const item = DB.itemById(r.itemId);
      const left = U.diffDays(r.returnDate, today);
      const due = left < 0 ? `Overdue · was due ${U.fmtDay(r.returnDate)}` : left === 0 ? 'Due today' : `Due ${U.fmtDay(r.returnDate)}`;
      nextCard = `<div class="eyebrow">Next return</div>
        <div class="nr-row"><span class="nr-icon ${left > 3 ? 'ok' : ''}">${icon('calendar', 24)}</span><span><div class="nr-title">${esc(item.name)} ×${r.qty}</div><div class="nr-due ${left > 3 ? 'ok' : ''}">${due}</div></span></div>`;
    } else if (upcoming.length) {
      const r = upcoming[0]; const item = DB.itemById(r.itemId);
      nextCard = `<div class="eyebrow">Next pickup</div>
        <div class="nr-row"><span class="nr-icon ok">${icon('calendar', 24)}</span><span><div class="nr-title">${esc(item.name)} ×${r.qty}</div><div class="nr-due ok">Pick up ${U.fmtDay(r.pickupDate)}</div></span></div>`;
    } else {
      nextCard = `<div class="eyebrow">Next return</div>
        <div class="nr-row"><span class="nr-icon ok">${icon('calendar', 24)}</span><span><div class="nr-title">No active loans</div><div class="nr-due ok">Request something below to get started.</div></span></div>`;
    }

    root.innerHTML = UI.shell(user, 'browse', `
      <div class="layout-side">
        <section class="hero-band">
          <div class="hero-ring"></div>
          <h1>${U.greeting()}, ${esc(U.firstName(user.name))}</h1>
          <p>What will your class build this week?</p>
          <form class="search-bar" role="search">
            ${icon('search', 22)}
            <input name="q" type="search" placeholder="Search kits, tools, materials…" aria-label="Search the catalog" value="${esc(term)}">
            <button class="btn btn-sky" type="submit">Search</button>
          </form>
        </section>
        <aside class="card next-return">
          ${nextCard}
          <a class="link-plain" href="#/my-requests">View my loans ${icon('arrowRight', 16)}</a>
        </aside>
      </div>

      <div class="catalog-head">
        <h2 class="section-title" id="catalog-title">Equipment catalog</h2>
        <div class="chip-row" role="group" aria-label="Filter by category">
          ${['All', ...DB.CATEGORIES].map((c) => `<button class="chip" data-cat="${c}" aria-pressed="false">${c}</button>`).join('')}
        </div>
      </div>
      <div class="catalog-grid" data-grid aria-labelledby="catalog-title"></div>`);

    const grid = root.querySelector('[data-grid]');
    const renderGrid = () => {
      root.querySelectorAll('[data-cat]').forEach((b) => { const on = b.dataset.cat === cat; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
      const t = term.trim().toLowerCase();
      const list = DB.items().filter((it) => (cat === 'All' || it.category === cat)
        && (!t || `${it.name} ${it.category} ${it.description} ${it.includes}`.toLowerCase().includes(t)));
      grid.innerHTML = list.length ? list.map((it) => `
        <article class="card item-card">
          <a href="#/item/${esc(it.id)}" tabindex="-1" aria-hidden="true" style="position:relative;display:block">
            ${UI.itemArt(it, 54)}
            ${it.consumable ? '<span class="badge badge-solid-red corner-badge">Consumable</span>' : ''}
          </a>
          <div class="body">
            <div class="cat">${esc(it.category)}</div>
            <h3 class="name"><a href="#/item/${esc(it.id)}">${esc(it.name)}</a></h3>
            ${UI.availHtml(it)}
            <div class="actions">
              <a class="btn btn-primary" href="#/request/${esc(it.id)}">Loan</a>
              <a class="btn btn-ghost btn-sq" href="#/item/${esc(it.id)}" aria-label="View ${esc(it.name)} details">${icon('arrowRight', 18)}</a>
            </div>
          </div>
        </article>`).join('')
        : `<div style="grid-column:1/-1" class="card">${UI.emptyState('search', 'No equipment matches', `Nothing found${term ? ` for “${esc(term)}”` : ''}${cat !== 'All' ? ` in ${esc(cat)}` : ''}.`, '<button class="btn btn-outline btn-sm" data-clear>Clear filters</button>')}</div>`;
      const clear = grid.querySelector('[data-clear]');
      if (clear) clear.addEventListener('click', () => { cat = 'All'; term = ''; root.querySelector('[name="q"]').value = ''; renderGrid(); });
    };
    root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; renderGrid(); }));
    const searchForm = root.querySelector('.search-bar');
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); term = searchForm.q.value; renderGrid(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    searchForm.q.addEventListener('input', () => { term = searchForm.q.value; renderGrid(); });
    renderGrid();
  };

  /* ---------------- Item detail ---------------- */
  Views.item = (root, { user, params }) => {
    const item = DB.itemById(params.id);
    if (!item) { root.innerHTML = UI.shell(user, 'browse', UI.emptyState('search', 'Item not found', 'It may have been removed from the catalog.', '<a class="btn btn-primary" href="#/browse">Back to catalog</a>')); return; }
    const views = ['Overview', 'In the box', 'In the classroom', 'Storage'];
    const maxQty = Math.max(1, item.quantity);
    root.innerHTML = UI.shell(user, 'browse', `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="#/browse">${icon('arrowLeft', 18)} Catalog</a><span>/</span>
        <a href="#/browse?cat=${encodeURIComponent(item.category)}" style="color:var(--muted);font-weight:500">${esc(item.category)}</a><span>/</span>
        <span class="current">${esc(item.name)}</span>
      </nav>
      <div class="detail-grid">
        <div>
          <div class="art gallery-main ${UI.artClass(item)}" data-gallery>${icon(UI.categoryIcon(item.category), 104, 1.6)}<span class="caption" data-caption>${views[0]}</span></div>
          <div class="thumbs" role="group" aria-label="Photos">
            ${views.map((v, i) => `<button class="thumb ${i === 0 ? 'active' : ''}" data-thumb="${i}" aria-label="${esc(v)}">${icon(UI.categoryIcon(item.category), 24, 1.8)}</button>`).join('')}
          </div>
        </div>
        <div>
          <div class="row gap-12 wrap">
            <span class="tag tag-navy">${esc(item.category)}</span>
            <span class="tag ${item.consumable ? 'tag-red' : ''}">${item.consumable ? 'Consumable · not returned' : 'Reusable · return required'}</span>
          </div>
          <h1 class="detail-title">${esc(item.name)}</h1>
          <div class="mt-8">${item.consumable ? UI.availHtml(item) : `<span class="avail ${UI.availability(item).low ? 'low' : ''}">${DB.availableNow(item)} of ${item.quantity} ${DB.unitLabel(item, item.quantity)} available</span>`}</div>
          <p class="detail-desc">${esc(item.description)}</p>
          <div class="fact-grid">
            <div class="fact"><div class="k">Grades</div><div class="v">${esc(item.grades)}</div></div>
            <div class="fact"><div class="k">${item.consumable ? 'In stock' : 'Max loan'}</div><div class="v">${item.consumable ? `${item.quantity} ${DB.unitLabel(item, item.quantity)}` : U.plural(item.maxLoanWeeks, 'week')}</div></div>
            <div class="fact"><div class="k">Pickup</div><div class="v">${esc(item.pickup)}</div></div>
            <div class="fact"><div class="k">Includes</div><div class="v">${esc(item.includes || '—')}</div></div>
          </div>
          <div class="card quick-card">
            <h2 style="font-size:21px;font-weight:800">Quick request</h2>
            <div class="form-grid" style="margin-top:18px">
              <div class="field ${item.consumable ? 'span-2' : ''}"><span class="label">Quantity</span>${UI.stepperHtml(Math.min(item.consumable ? 1 : 4, maxQty), 'Quantity', true)}</div>
              ${item.consumable ? '' : `<div class="field"><label for="qr-dur">Loan duration</label>
                <select class="select" id="qr-dur" style="height:52px">${Array.from({ length: item.maxLoanWeeks }, (_, i) => i + 1).map((w) => `<option value="${w}" ${w === Math.min(2, item.maxLoanWeeks) ? 'selected' : ''}>${U.plural(w, 'week')}</option>`).join('')}</select></div>`}
            </div>
            <button class="btn btn-primary btn-lg btn-block" style="margin-top:22px" data-go ${item.quantity === 0 ? 'disabled' : ''}>Request this item ${icon('arrowRight', 18)}</button>
            <p class="small muted" style="margin-top:14px">${item.quantity === 0 ? 'This item is out of stock right now.' : 'You’ll add the purpose and dates on the next step. Admins usually respond within 1 school day.'}</p>
          </div>
        </div>
      </div>`);

    const gallery = root.querySelector('[data-gallery]');
    root.querySelectorAll('[data-thumb]').forEach((b) => b.addEventListener('click', () => {
      root.querySelectorAll('[data-thumb]').forEach((x) => x.classList.toggle('active', x === b));
      root.querySelector('[data-caption]').textContent = views[b.dataset.thumb];
      gallery.style.filter = `saturate(${1 - b.dataset.thumb * 0.15}) brightness(${1 - b.dataset.thumb * 0.02})`;
    }));
    const qty = UI.stepper(root.querySelector('[data-stepper]'), { min: 1, max: maxQty, value: Math.min(item.consumable ? 1 : 4, maxQty) });
    root.querySelector('[data-go]').addEventListener('click', () => {
      const dur = root.querySelector('#qr-dur');
      App.go(`#/request/${item.id}?qty=${qty.value}${dur ? `&weeks=${dur.value}` : ''}`);
    });
  };

  /* ---------------- New loan request ---------------- */
  Views.request = (root, { user, params, query }) => {
    const item = DB.itemById(params.id);
    if (!item) { App.go('#/browse'); return; }
    const today = U.today();
    let pickup = U.addDays(today, 2);
    while (U.weekday(pickup) !== 'Mon') pickup = U.addDays(pickup, 1);
    const maxW = item.maxLoanWeeks || 1;
    let weeks = U.clamp(parseInt(query.weeks, 10) || Math.min(2, maxW), 1, maxW); // number or 'custom'
    let ret = U.addDays(pickup, weeks * 7);
    let consumableAnswer = item.consumable;

    const unit = (n) => DB.unitLabel(item, n);
    const step1 = item.consumable
      ? `<div class="step-head"><span class="step-num">1</span><h2 class="step-title">When do you need it?</h2></div>
         <div class="form-grid"><div class="field"><label for="rq-pickup">Pickup date</label><input class="input" type="date" id="rq-pickup" min="${today}" value="${pickup}"></div>
         <div class="field"><span class="label">Return date</span><div class="hint" style="padding-top:14px">Consumables aren’t returned.</div></div></div>`
      : `<div class="step-head"><span class="step-num">1</span><h2 class="step-title">How long do you need it?</h2></div>
         <div class="chip-row" role="group" aria-label="Loan length">
           ${Array.from({ length: maxW }, (_, i) => i + 1).map((w) => `<button type="button" class="choice" data-weeks="${w}">${U.plural(w, 'week')}</button>`).join('')}
           <button type="button" class="choice" data-weeks="custom">Custom</button>
         </div>
         <div class="form-grid" style="margin-top:18px">
           <div class="field"><label for="rq-pickup">Pickup date</label><input class="input" type="date" id="rq-pickup" min="${today}" value="${pickup}"></div>
           <div class="field"><label for="rq-return">Return date</label><input class="input" type="date" id="rq-return" value="${ret}" readonly></div>
         </div>
         <div class="hint mt-8">Maximum loan for this item: ${U.plural(maxW, 'week')}.</div>`;

    root.innerHTML = `
      <header class="topbar"><div class="topbar-inner" style="justify-content:space-between">
        <a class="brand" href="#/browse"><span class="brand-mark">${icon('flask', 22)}</span><span class="brand-name">STEM Makerspace Loans</span></a>
        <a class="btn btn-ghost btn-sm" href="#/item/${esc(item.id)}">${icon('x', 16)} Cancel request</a>
      </div></header>
      <main class="page" style="max-width:1240px">
        <div class="eyebrow">New loan request</div>
        <h1 class="page-title" style="margin:4px 0 22px">Tell us how you’ll use it</h1>
        <div class="layout-side" style="grid-template-columns:minmax(0,1fr) 340px">
          <form class="stack gap-20" novalidate>
            <section class="card step-card">${step1}</section>

            <section class="card step-card">
              <div class="step-head"><span class="step-num">2</span><h2 class="step-title">How many do you need?</h2></div>
              <div class="row gap-16 wrap">${UI.stepperHtml(U.clamp(parseInt(query.qty, 10) || 1, 1, 999), 'Quantity')}<span class="muted small" data-avail-text></span></div>
              <div class="note warn mt-12" data-avail-warn hidden>${icon('alert', 18)}<span></span></div>
            </section>

            <section class="card step-card">
              <div class="step-head"><span class="step-num">3</span><h2 class="step-title">What’s the purpose?</h2></div>
              <div class="form-grid">
                <div class="field"><label for="rq-activity">Activity type</label><select class="select" id="rq-activity" name="activity">${DB.ACTIVITY_TYPES.map((a) => `<option>${esc(a)}</option>`).join('')}</select></div>
                <div class="field"><label for="rq-class">Class / grade</label><input class="input" id="rq-class" name="classGrade" placeholder="e.g. 7th grade Science, period 3" maxlength="80"></div>
                <div class="field span-2"><label for="rq-purpose">Describe the project</label>
                  <textarea class="textarea" id="rq-purpose" name="purpose" maxlength="500" placeholder="What will students build or investigate?"></textarea>
                  <div class="counter"><span data-count>0</span> / 500</div>
                </div>
              </div>
            </section>

            <section class="card step-card">
              <div class="step-head"><span class="step-num">4</span><h2 class="step-title">Will anything be used up?</h2></div>
              <p class="muted small" style="margin:-6px 0 16px">Consumables (filament, batteries, LEDs, wire) aren’t returned. Let us know so we can restock.</p>
              <div class="option-grid" role="radiogroup" aria-label="Consumables">
                <button type="button" class="option ${item.consumable ? 'disabled' : ''}" data-cons="no" role="radio" ${item.consumable ? 'disabled' : ''}><span class="radio-dot"></span><span><div class="opt-title">No, everything comes back</div><div class="opt-sub">Reusable equipment only</div></span></button>
                <button type="button" class="option" data-cons="yes" role="radio"><span class="radio-dot"></span><span><div class="opt-title">Yes, some is consumable</div><div class="opt-sub">${item.consumable ? 'This item is consumable' : 'Parts or materials will be used up'}</div></span></button>
              </div>
            </section>

            <div class="form-error" role="alert" hidden></div>
            <div class="row-between">
              <a class="link-plain" href="#/item/${esc(item.id)}">${icon('arrowLeft', 18)} Back to item</a>
              <button class="btn btn-primary btn-lg" type="submit">Submit request</button>
            </div>
          </form>

          <aside class="card summary-card">
            ${UI.itemArt(item, 40)}
            <div class="summary-body">
              <div class="eyebrow">Request summary</div>
              <div style="font-weight:800;font-size:19px;margin:4px 0 10px">${esc(item.name)}</div>
              <div data-summary></div>
              <div class="note mt-12">${icon('info', 16)}<span>An admin will review your request. You’ll get an email and a notification here when it’s approved.</span></div>
            </div>
          </aside>
        </div>
      </main>`;

    const form = root.querySelector('form');
    const pickupEl = root.querySelector('#rq-pickup');
    const returnEl = root.querySelector('#rq-return');
    const availText = root.querySelector('[data-avail-text]');
    const warn = root.querySelector('[data-avail-warn]');
    const submitBtn = form.querySelector('[type="submit"]');
    const purpose = form.purpose;
    const qty = UI.stepper(root.querySelector('[data-stepper]'), { min: 1, max: 999, value: U.clamp(parseInt(query.qty, 10) || 1, 1, 999), onChange: () => update() });

    const available = () => (item.consumable ? item.quantity : DB.availableFor(item, pickup, ret));

    function update() {
      // Step 1
      if (!item.consumable) {
        root.querySelectorAll('[data-weeks]').forEach((b) => b.classList.toggle('active', String(weeks) === b.dataset.weeks));
        if (weeks !== 'custom') ret = U.addDays(pickup, weeks * 7);
        returnEl.readOnly = weeks !== 'custom';
        returnEl.min = U.addDays(pickup, 1);
        returnEl.max = U.addDays(pickup, maxW * 7);
        if (ret <= pickup) ret = U.addDays(pickup, 1);
        if (ret > returnEl.max) ret = returnEl.max;
        returnEl.value = ret;
      }
      // Step 2
      const avail = available();
      qty.setMax(Math.max(1, avail));
      availText.textContent = `${unit(qty.value)} · ${avail} ${item.consumable ? 'in stock' : 'available for your dates'}`;
      warn.hidden = avail > 0;
      if (avail === 0) warn.querySelector('span').textContent = item.consumable ? 'This item is out of stock.' : `All ${unit(2)} are booked for these dates${DB.nextBack(item) ? ` — some come back ${U.fmtDate(DB.nextBack(item))}` : ''}. Try different dates.`;
      submitBtn.disabled = avail === 0;
      // Step 4
      root.querySelectorAll('[data-cons]').forEach((b) => { const on = (b.dataset.cons === 'yes') === consumableAnswer; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
      // Summary
      const days = item.consumable ? 0 : U.diffDays(ret, pickup);
      const duration = item.consumable ? '—' : (days % 7 === 0 ? U.plural(days / 7, 'week') : U.plural(days, 'day'));
      root.querySelector('[data-summary]').innerHTML = `
        <div class="kv"><span class="k">Quantity</span><span class="v">${qty.value} ${unit(qty.value)}</span></div>
        <div class="kv"><span class="k">Duration</span><span class="v">${duration}</span></div>
        <div class="kv"><span class="k">${item.consumable ? 'Pickup' : 'Dates'}</span><span class="v">${item.consumable ? U.fmtDate(pickup) : U.fmtRange(pickup, ret)}</span></div>
        <div class="kv"><span class="k">Consumable</span><span class="v">${consumableAnswer ? 'Yes' : 'No'}</span></div>`;
    }

    root.querySelectorAll('[data-weeks]').forEach((b) => b.addEventListener('click', () => {
      weeks = b.dataset.weeks === 'custom' ? 'custom' : Number(b.dataset.weeks);
      update();
      if (weeks === 'custom') returnEl.focus();
    }));
    pickupEl.addEventListener('change', () => {
      if (!pickupEl.value) return;
      pickup = pickupEl.value < today ? today : pickupEl.value;
      pickupEl.value = pickup;
      if (weeks === 'custom') ret = U.addDays(pickup, Math.max(1, Math.min(U.diffDays(ret, pickup), maxW * 7)));
      update();
    });
    if (returnEl) returnEl.addEventListener('change', () => { if (returnEl.value) { ret = returnEl.value; update(); } });
    root.querySelectorAll('[data-cons]').forEach((b) => b.addEventListener('click', () => { if (b.disabled) return; consumableAnswer = b.dataset.cons === 'yes'; update(); }));
    purpose.addEventListener('input', () => { root.querySelector('[data-count]').textContent = purpose.value.length; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = {};
      if (!form.classGrade.value.trim()) errors.classGrade = 'Tell us which class or group this is for.';
      if (purpose.value.trim().length < 10) errors.purpose = 'Add a short description (at least 10 characters).';
      UI.setFieldErrors(form, errors);
      const fe = form.querySelector('.form-error');
      fe.hidden = true;
      if (Object.keys(errors).length) return;
      try {
        const r = DB.createRequest(user, {
          itemId: item.id, qty: qty.value, pickupDate: pickup, returnDate: ret, weeks: weeks === 'custom' ? null : weeks,
          activity: form.activity.value, classGrade: form.classGrade.value, purpose: purpose.value, consumable: consumableAnswer,
        });
        App.go(`#/my-data?submitted=${r.id}`);
      } catch (ex) {
        fe.innerHTML = `${icon('alert', 18)}<span>${esc(ex.message)}</span>`;
        fe.hidden = false;
      }
    });

    update();
  };

  /* ---------------- My requests ---------------- */
  Views.myRequests = (root, { user, query }) => {
    let tab = ['all', 'pending', 'active', 'history'].includes(query.tab) ? query.tab : 'all';
    const today = U.today();
    const groups = {
      all: () => true,
      pending: (r) => r.status === 'pending',
      active: (r) => DB.isActiveLoan(r),
      history: (r) => ['returned', 'declined', 'cancelled'].includes(r.status) || (r.status === 'approved' && !DB.isReturnable(r)),
    };
    const labels = { all: 'All', pending: 'Pending', active: 'Active loans', history: 'History' };

    function render() {
      const mine = myRequests(user).sort((a, b) => b.submittedAt - a.submittedAt);
      const list = mine.filter(groups[tab]);
      root.innerHTML = UI.shell(user, 'requests', `
        <div class="page-head">
          <div><h1 class="page-title">My requests</h1><p class="page-sub">Track every request, pickup and return.</p></div>
          <a class="btn btn-primary" href="#/browse">${icon('plus', 18)} New request</a>
        </div>
        <div class="toolbar"><div class="tabs" role="tablist">
          ${Object.keys(labels).map((k) => `<button role="tab" data-tab="${k}" class="${tab === k ? 'active' : ''}" aria-selected="${tab === k}">${labels[k]} · ${mine.filter(groups[k]).length}</button>`).join('')}
        </div></div>
        <div class="card list-card">
          ${list.length ? list.map((r) => {
            const item = DB.itemById(r.itemId) || { name: 'Removed item', category: 'Tools', consumable: false };
            const dates = r.returnDate ? U.fmtRange(r.pickupDate, r.returnDate) : `Pickup ${U.fmtDate(r.pickupDate)}`;
            let hint = '';
            if (DB.isActiveLoan(r)) {
              hint = r.pickupDate > today ? `Pick up ${U.fmtDay(r.pickupDate)} · ${esc(item.pickup || '')}` : (DB.isOverdue(r) ? `<span class="text-red">Was due ${U.fmtDay(r.returnDate)} — please return it</span>` : `Return by ${U.fmtDay(r.returnDate)}`);
            }
            return `<div class="lc-row">
              <a href="#/item/${esc(r.itemId)}" class="lc-art" aria-hidden="true" tabindex="-1">${UI.itemArt(item, 26, 'lc-art')}</a>
              <div class="lc-main">
                <div class="lc-title">${esc(item.name)} ×${r.qty}</div>
                <div class="lc-meta">#${r.id} · Requested ${U.fmtDate(U.isoFromTs(r.submittedAt))} · ${dates}${r.classGrade ? ` · ${esc(r.classGrade)}` : ''}</div>
                ${hint ? `<div class="lc-meta" style="margin-top:4px;font-weight:600">${hint}</div>` : ''}
                ${r.adminNote ? `<div class="lc-note"><strong>Admin note:</strong> ${esc(r.adminNote)}</div>` : ''}
              </div>
              <div class="lc-side">
                ${UI.statusBadge(r)}
                ${r.status === 'pending' ? `<button class="btn btn-danger-outline btn-sm" data-cancel="${r.id}">Cancel</button>` : (DB.itemById(r.itemId) ? `<a class="btn btn-ghost btn-sm" href="#/request/${esc(r.itemId)}?qty=${r.qty}">Request again</a>` : '')}
              </div>
            </div>`;
          }).join('') : UI.emptyState('inbox', `No ${tab === 'all' ? '' : `${labels[tab].toLowerCase()} `}requests`, 'Browse the catalog to borrow equipment for your class.', '<a class="btn btn-primary btn-sm" href="#/browse">Browse catalog</a>')}
        </div>`);

      root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
      root.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', () => {
        const r = DB.requestById(b.dataset.cancel);
        UI.confirm({
          title: 'Cancel this request?',
          message: `Your request for <strong>${esc(DB.itemById(r.itemId)?.name || 'this item')} ×${r.qty}</strong> will be withdrawn. You can always request it again.`,
          confirmLabel: 'Cancel request', danger: true,
          onConfirm: () => { try { DB.cancelRequest(r.id, user); UI.toast('Request cancelled.'); render(); } catch (ex) { UI.toast(ex.message, 'error'); } },
        });
      }));
    }
    render();
  };

  /* ---------------- My data ---------------- */
  function schoolYearStart(iso) {
    const d = U.parse(iso);
    const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-07-01`;
  }

  Views.myData = (root, { user, query }) => {
    const today = U.today();
    const syStart = schoolYearStart(today);
    const syYear = Number(syStart.slice(0, 4));
    const periods = {
      year: { label: `${syYear}–${String((syYear + 1) % 100).padStart(2, '0')} school year`, from: syStart, to: today },
      prev: { label: `${syYear - 1}–${String(syYear % 100).padStart(2, '0')} school year`, from: `${syYear - 1}-07-01`, to: `${syYear}-06-30` },
      all: { label: 'All time', from: null, to: today },
    };
    let period = 'year';
    const submitted = query.submitted ? DB.requestById(query.submitted) : null;

    function render() {
      const p = periods[period];
      const all = myRequests(user).filter((r) => r.status !== 'cancelled');
      const inPeriod = all.filter((r) => { const d = U.isoFromTs(r.submittedAt); return (!p.from || d >= p.from) && d <= p.to; });
      const loanedOf = (list) => list.filter((r) => (r.status === 'approved' || r.status === 'returned') && r.pickupDate <= today);
      const itemsLoaned = U.sum(loanedOf(inPeriod), (r) => r.qty);
      const itemsRequested = U.sum(inPeriod, (r) => r.qty);
      const pending = all.filter((r) => r.status === 'pending');
      const weekEnd = U.addDays(today, 7);
      const dueSoon = all.filter((r) => DB.isActiveLoan(r) && r.pickupDate <= today && r.returnDate <= weekEnd).sort((a, b) => a.returnDate.localeCompare(b.returnDate));
      const dueQty = U.sum(dueSoon, (r) => r.qty);
      const oldestPending = pending.length ? Math.min(...pending.map((r) => r.submittedAt)) : null;

      // Chart months
      let from = p.from;
      if (!from) from = all.length ? U.isoFromTs(Math.min(...all.map((r) => r.submittedAt))) : today;
      let months = Charts.monthRange(from, p.to);
      if (months.length > 12) months = months.slice(-12);
      const groups = months.map((m) => {
        const inMonth = inPeriod.filter((r) => Charts.monthKey(U.isoFromTs(r.submittedAt)) === m);
        return { label: Charts.monthLabel(m), values: [U.sum(inMonth, (r) => r.qty), U.sum(loanedOf(inMonth), (r) => r.qty)] };
      });
      const byCat = DB.CATEGORIES.map((c) => ({ label: c, value: U.sum(inPeriod.filter((r) => DB.itemById(r.itemId)?.category === c), (r) => r.qty) })).sort((a, b) => b.value - a.value);
      const recent = [...all].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 6);
      const subItem = submitted && DB.itemById(submitted.itemId);

      root.innerHTML = UI.shell(user, 'data', `
        ${submitted && subItem ? `<div class="banner" role="status"><span class="b-icon">${icon('check', 18, 2.5)}</span><span><strong>Request submitted.</strong> ${esc(subItem.name)} ×${submitted.qty} is waiting for admin review.</span><button class="b-close" data-close-banner aria-label="Dismiss">${icon('x', 18)}</button></div>` : ''}
        <div class="page-head">
          <div><h1 class="page-title">My data</h1><p class="page-sub">Your loans and requests ${period === 'all' ? 'over time' : `for the ${p.label}`}</p></div>
          <label class="row gap-12"><span style="font-weight:600">Period</span>
            <select class="select sm" data-period style="width:auto">${Object.entries(periods).map(([k, v]) => `<option value="${k}" ${k === period ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
          </label>
        </div>

        <div class="grid-4">
          <div class="card stat navy"><div class="s-label">Items loaned</div><div class="s-value">${itemsLoaned}</div><div class="s-sub">Approved and picked up</div></div>
          <div class="card stat"><div class="s-label">Items requested</div><div class="s-value">${itemsRequested}</div><div class="s-sub">Across ${U.plural(inPeriod.length, 'request')}</div></div>
          <div class="card stat"><div class="s-label">Pending review</div><div class="s-value">${pending.length}</div><div class="s-sub">${oldestPending ? (U.isoFromTs(oldestPending) === today ? 'Submitted today' : `Oldest from ${U.fmtDate(U.isoFromTs(oldestPending))}`) : 'Nothing waiting'}</div></div>
          <div class="card stat"><div class="s-label">Due this week</div><div class="s-value ${dueQty ? 'red' : ''}">${dueQty}</div><div class="s-sub ${dueQty ? 'text-red' : ''}" style="${dueQty ? 'font-weight:600' : ''}">${dueSoon.length ? `${esc(DB.itemById(dueSoon[0].itemId).name)} · ${U.fmtDay(dueSoon[0].returnDate)}` : 'Nothing due'}</div></div>
        </div>

        <div class="layout-side wide" style="margin-top:22px;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr)">
          <section class="card card-pad">
            <div class="row-between wrap" style="margin-bottom:6px"><h2 class="card-title" style="font-size:17px">Items requested by month</h2>${Charts.legend([{ name: 'Requested', cls: 'c-navy' }, { name: 'Loaned', cls: 'c-sky' }])}</div>
            ${inPeriod.length ? Charts.grouped(groups, [{ name: 'Requested', cls: 'c-navy' }, { name: 'Loaned', cls: 'c-sky' }]) : UI.emptyState('chart', 'No requests in this period', 'Your monthly activity will show up here.')}
          </section>
          <section class="card card-pad">
            <h2 class="card-title" style="font-size:17px;margin-bottom:18px">By category</h2>
            ${Charts.hbars(byCat)}
          </section>
        </div>

        <section class="card" style="margin-top:22px">
          <div class="card-head" style="border:0;padding-bottom:6px"><h2 class="card-title" style="font-size:17px">Recent requests</h2><a class="link-plain small" href="#/browse">+ New request</a></div>
          <div class="table-wrap" style="padding:0 18px 10px">
            ${recent.length ? `<table class="table compact">
              <thead><tr><th>Item</th><th>Qty</th><th>Requested</th><th>Return by</th><th>Status</th></tr></thead>
              <tbody>${recent.map((r) => { const it = DB.itemById(r.itemId); return `<tr class="clickable" data-href="#/my-requests">
                <td style="font-weight:700">${esc(it ? it.name : 'Removed item')}${it && it.consumable ? ' <span class="muted" style="font-weight:500">(consumable)</span>' : ''}</td>
                <td>${r.qty}</td><td class="nowrap">${U.fmtDate(U.isoFromTs(r.submittedAt))}</td><td class="nowrap">${r.returnDate ? U.fmtDate(r.returnDate) : '—'}</td><td>${UI.statusBadge(r)}</td></tr>`; }).join('')}</tbody>
            </table>` : UI.emptyState('inbox', 'No requests yet', 'Your requests will appear here.')}
          </div>
        </section>`);

      root.querySelector('[data-period]').addEventListener('change', (e) => { period = e.target.value; render(); });
      const close = root.querySelector('[data-close-banner]');
      if (close) close.addEventListener('click', () => App.go('#/my-data', true));
      root.querySelectorAll('tr[data-href]').forEach((tr) => tr.addEventListener('click', () => App.go(tr.dataset.href)));
    }
    render();
  };
})();
