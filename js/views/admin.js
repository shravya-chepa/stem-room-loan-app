/* Admin screens: dashboard, requests, request detail, inventory, insights. */
window.Views = window.Views || {};

(() => {
  const { esc } = U;
  const { icon } = UI;

  const durationText = (r) => {
    if (!r.returnDate) return 'Consumable';
    const days = U.diffDays(r.returnDate, r.pickupDate);
    return days % 7 === 0 ? U.plural(days / 7, 'week') : U.plural(days, 'day');
  };
  const teacherOf = (r) => DB.userById(r.userId) || { name: 'Unknown teacher', school: '—', loginId: '—' };

  function approve(r, admin, note, after) {
    try {
      DB.decide(r.id, 'approved', note, admin);
      UI.toast(`Approved · ${teacherOf(r).name} notified`);
      after();
    } catch (ex) { UI.toast(ex.message, 'error'); }
  }
  function declineWithNote(r, admin, after) {
    const item = DB.itemById(r.itemId);
    UI.modal({
      title: 'Decline request?',
      body: `<p><strong>${esc(teacherOf(r).name)}</strong> requested <strong>${esc(item ? item.name : 'an item')} ×${r.qty}</strong>.</p>
        <div class="field mt-16"><label for="dn-note">Note to teacher <span class="muted" style="font-weight:500">(optional)</span></label>
        <textarea class="textarea" id="dn-note" placeholder="e.g. All kits are booked that week — could you try Nov 2?"></textarea></div>`,
      actions: [
        { label: 'Cancel' },
        { label: `${icon('x', 18)} Decline request`, cls: 'btn-danger', onClick: (wrap) => {
          try { DB.decide(r.id, 'declined', wrap.querySelector('#dn-note').value, admin); UI.toast('Request declined'); after(); } catch (ex) { UI.toast(ex.message, 'error'); }
        } },
      ],
    });
  }

  /* ---------------- Dashboard ---------------- */
  Views.adminDashboard = (root, { user }) => {
    const today = U.today();
    const reqs = DB.requests();
    const pending = reqs.filter((r) => r.status === 'pending');
    const out = reqs.filter((r) => DB.isOut(r));
    const overdue = reqs.filter((r) => DB.isOverdue(r));
    const low = DB.items().filter(DB.isLowStock);
    const latest = [...pending].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 5);
    const weekEnd = U.addDays(today, 7);
    const due = out.filter((r) => r.returnDate <= weekEnd).sort((a, b) => a.returnDate.localeCompare(b.returnDate));

    root.innerHTML = UI.shell(user, 'dashboard', `
      <div class="page-head">
        <div><h1 class="page-title">${U.greeting()}, ${esc(U.firstName(user.name))}</h1>
        <p class="page-sub">${U.fmtLongToday()} · ${pending.length ? `${U.plural(pending.length, 'request')} ${pending.length === 1 ? 'needs' : 'need'} your review` : 'You’re all caught up'}</p></div>
        <a class="btn btn-primary btn-lg" href="#/admin/requests">Review all requests</a>
      </div>

      <div class="grid-4">
        <a class="card mini-stat" href="#/admin/requests"><span class="m-icon">${icon('list', 24)}</span><span><div class="m-value">${pending.length}</div><div class="m-label">Pending requests</div></span></a>
        <a class="card mini-stat" href="#/admin/inventory"><span class="m-icon">${icon('cube', 24)}</span><span><div class="m-value">${U.sum(out, (r) => r.qty)}</div><div class="m-label">Items out on loan</div></span></a>
        <a class="card mini-stat" href="#/admin/requests?tab=approved"><span class="m-icon red">${icon('clock', 24)}</span><span><div class="m-value ${overdue.length ? 'red' : ''}">${overdue.length}</div><div class="m-label">Overdue returns</div></span></a>
        <a class="card mini-stat" href="#/admin/inventory?filter=low"><span class="m-icon grey">${icon('chart', 24)}</span><span><div class="m-value">${low.length}</div><div class="m-label">Low-stock items</div></span></a>
      </div>

      <div class="layout-side" style="margin-top:26px">
        <section class="card">
          <div class="card-head"><h2 class="card-title">Teacher requests</h2><a class="link-plain" href="#/admin/requests">See all</a></div>
          ${latest.length ? latest.map((r) => {
            const t = teacherOf(r); const item = DB.itemById(r.itemId) || { name: 'Removed item' };
            return `<div class="req-row">
              ${UI.avatar(t.name, 'avatar-soft avatar-md')}
              <div class="r-main"><div class="r-title"><strong>${esc(t.name)}</strong> has requested <strong>${esc(item.name)} ×${r.qty}</strong></div>
              <div class="r-meta">${esc(r.classGrade || r.activity)} · ${durationText(r)} · ${U.timeAgo(r.submittedAt)}</div></div>
              ${item.consumable ? '<span class="badge badge-consumable">Consumable</span>' : ''}
              <div class="r-action"><a class="btn btn-outline" href="#/admin/requests/${r.id}">Read request</a></div>
            </div>`;
          }).join('') : UI.emptyState('check', 'No pending requests', 'New teacher requests will show up here.')}
        </section>

        <div class="stack gap-24">
          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:12px">Due back this week</h2>
            ${due.length ? due.map((r) => {
              const late = DB.isOverdue(r) ? DB.daysLate(r) : 0;
              const item = DB.itemById(r.itemId);
              const chip = late ? `<span class="badge badge-late">${U.plural(late, 'day')} late</span>` : `<span class="badge badge-neutral">${r.returnDate === today ? 'Today' : U.weekday(r.returnDate)}</span>`;
              return `<a class="due-row" href="#/admin/requests/${r.id}"><span><div class="d-name">${esc(item.name.replace(/ (kit|robots|set|starter kit|class set)$/i, ''))} ×${r.qty}</div><div class="d-sub">${esc(teacherOf(r).name)}</div></span>${chip}</a>`;
            }).join('') : '<p class="muted">Nothing due in the next 7 days.</p>'}
          </section>
          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:16px">Low stock</h2>
            ${low.length ? `<div class="hbar-list">${low.map((it) => {
              const a = it.consumable ? it.quantity : DB.availableNow(it);
              const pct = it.consumable ? Math.min(100, (it.quantity / Math.max(1, (it.lowStock || 10) * 4)) * 100) : (a / Math.max(1, it.quantity)) * 100;
              return `<a class="hbar" href="#/admin/inventory?edit=${esc(it.id)}" style="text-decoration:none;color:inherit"><div class="hb-top"><span>${esc(it.name)}${it.consumable ? ' (consumable)' : ''}</span><span class="text-red">${it.consumable ? `${it.quantity} left` : `${a} of ${it.quantity}`}</span></div><div class="hb-track"><div class="hb-fill red" style="width:${Math.max(pct, 2)}%"></div></div></a>`;
            }).join('')}</div>` : '<p class="muted">Everything is well stocked.</p>'}
          </section>
        </div>
      </div>`);
  };

  /* ---------------- Requests list ---------------- */
  Views.adminRequests = (root, { user, query }) => {
    let tab = ['pending', 'approved', 'declined', 'all'].includes(query.tab) ? query.tab : 'pending';
    let term = query.q || '';
    let cat = 'All';
    let page = 1;
    const PER_PAGE = 8;
    const inTab = {
      pending: (r) => r.status === 'pending',
      approved: (r) => r.status === 'approved' || r.status === 'returned',
      declined: (r) => r.status === 'declined',
      all: (r) => r.status !== 'cancelled',
    };

    function render(keepFocus) {
      const reqs = DB.requests();
      const counts = Object.fromEntries(Object.keys(inTab).map((k) => [k, reqs.filter(inTab[k]).length]));
      const t = term.trim().toLowerCase();
      let list = reqs.filter(inTab[tab]).filter((r) => {
        const item = DB.itemById(r.itemId); const teacher = teacherOf(r);
        if (cat !== 'All' && (!item || item.category !== cat)) return false;
        return !t || `${teacher.name} ${teacher.school} ${item ? item.name : ''} ${r.id}`.toLowerCase().includes(t);
      });
      // Pending: oldest first. Others: overdue first, then newest.
      list = tab === 'pending'
        ? list.sort((a, b) => a.submittedAt - b.submittedAt)
        : list.sort((a, b) => (DB.isOverdue(b) - DB.isOverdue(a)) || (b.submittedAt - a.submittedAt));
      const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      page = U.clamp(page, 1, pages);
      const slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

      root.innerHTML = UI.shell(user, 'requests', `
        <div class="page-head"><div><h1 class="page-title">Requests</h1><p class="page-sub">Approve or decline teacher loan requests. ${tab === 'pending' ? 'Oldest first.' : 'Newest first.'}</p></div></div>
        <div class="toolbar">
          <div class="tabs" role="tablist">
            ${[['pending', 'Pending'], ['approved', 'Approved'], ['declined', 'Declined'], ['all', 'All']].map(([k, l]) => `<button role="tab" data-tab="${k}" class="${tab === k ? 'active' : ''}" aria-selected="${tab === k}">${l}${k === 'all' ? '' : ` · ${counts[k]}`}</button>`).join('')}
          </div>
          <div class="toolbar-right">
            <div class="search-input">${icon('search', 20)}<input class="input sm" type="search" placeholder="Teacher or item" aria-label="Search requests" value="${esc(term)}" data-search></div>
            <select class="select sm" data-cat aria-label="Category" style="width:auto;min-width:170px">${['All', ...DB.CATEGORIES].map((c) => `<option value="${c}" ${c === cat ? 'selected' : ''}>${c === 'All' ? 'All categories' : c}</option>`).join('')}</select>
          </div>
        </div>
        <section class="card">
          ${slice.length ? `<div class="table-wrap"><table class="table big">
            <thead><tr><th>Teacher</th><th>Item</th><th>Qty</th><th>Dates</th><th>Purpose</th><th style="text-align:right">${tab === 'pending' ? 'Decision' : 'Status'}</th></tr></thead>
            <tbody>${slice.map((r) => {
              const tch = teacherOf(r); const item = DB.itemById(r.itemId) || { name: 'Removed item' };
              return `<tr class="clickable" data-open="${r.id}">
                <td><div class="person">${UI.avatar(tch.name, 'avatar-soft avatar-md')}<div><div class="p-name">${esc(tch.name)}</div><div class="p-sub">${esc(U.shortSchool(tch.school))}</div></div></div></td>
                <td><div style="font-weight:700">${esc(item.name)}</div>${item.consumable ? '<span class="badge badge-consumable" style="height:22px;font-size:12px;margin-top:4px">Consumable</span>' : ''}</td>
                <td style="font-weight:700;font-size:16px">${r.qty}</td>
                <td class="nowrap">${r.returnDate ? U.fmtRange(r.pickupDate, r.returnDate) : U.fmtDate(r.pickupDate)}</td>
                <td><div class="truncate" title="${esc(r.purpose)}">${esc(r.purpose)}</div></td>
                <td><div class="decision-cell">
                  ${r.status === 'pending'
                    ? `<button class="btn btn-primary btn-sq" data-approve="${r.id}" aria-label="Approve request ${r.id}" title="Approve">${icon('check', 20, 2.5)}</button>
                       <button class="btn btn-danger-outline btn-sq" data-decline="${r.id}" aria-label="Decline request ${r.id}" title="Decline">${icon('x', 20, 2.5)}</button>`
                    : UI.statusBadge(r)}
                  <a class="chev" href="#/admin/requests/${r.id}" aria-label="Open request ${r.id}">${icon('chevronRight', 20)}</a>
                </div></td>
              </tr>`;
            }).join('')}</tbody></table></div>
            <div class="pager">
              <span class="muted">Showing ${(page - 1) * PER_PAGE + 1}–${(page - 1) * PER_PAGE + slice.length} of ${list.length}</span>
              <div class="pager-btns">
                <button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">${icon('chevronLeft', 18)}</button>
                ${Array.from({ length: pages }, (_, i) => i + 1).filter((n) => pages <= 7 || Math.abs(n - page) <= 2 || n === 1 || n === pages).map((n) => `<button data-page="${n}" class="${n === page ? 'active' : ''}" aria-label="Page ${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`).join('')}
                <button data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">${icon('chevronRight', 18)}</button>
              </div>
            </div>`
          : UI.emptyState(tab === 'pending' ? 'check' : 'inbox', tab === 'pending' && !t && cat === 'All' ? 'All caught up!' : 'No requests found', tab === 'pending' && !t && cat === 'All' ? 'There are no pending requests right now.' : 'Try a different search or category.')}
        </section>`);

      root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; page = 1; render(); }));
      const search = root.querySelector('[data-search]');
      search.addEventListener('input', () => { term = search.value; page = 1; render(true); });
      if (keepFocus) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
      root.querySelector('[data-cat]').addEventListener('change', (e) => { cat = e.target.value; page = 1; render(); });
      root.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => { page = Number(b.dataset.page); render(); }));
      root.querySelectorAll('tr[data-open]').forEach((tr) => tr.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        App.go(`#/admin/requests/${tr.dataset.open}`);
      }));
      root.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => approve(DB.requestById(b.dataset.approve), user, '', () => App.refresh(render))));
      root.querySelectorAll('[data-decline]').forEach((b) => b.addEventListener('click', () => declineWithNote(DB.requestById(b.dataset.decline), user, () => App.refresh(render))));
    }
    render();
  };

  /* ---------------- Request detail ---------------- */
  Views.adminRequest = (root, { user, params }) => {
    const r = DB.requestById(params.id);
    if (!r) { root.innerHTML = UI.shell(user, 'requests', UI.emptyState('inbox', 'Request not found', 'It may have been removed.', '<a class="btn btn-primary" href="#/admin/requests">All requests</a>')); return; }
    const tch = teacherOf(r);
    const item = DB.itemById(r.itemId) || { name: 'Removed item', category: 'Tools', consumable: false, quantity: 0, unit: 'unit' };
    const theirs = DB.requests().filter((x) => x.userId === r.userId && x.id !== r.id);
    const pastLoans = theirs.filter((x) => (x.status === 'approved' || x.status === 'returned') && x.pickupDate <= U.today()).length;
    const lateReturns = theirs.filter(DB.wasLate).length + (DB.wasLate(r) ? 1 : 0);
    const unit = (n) => DB.unitLabel(item, n);
    const avail = item.consumable ? item.quantity : DB.availableFor(item, r.pickupDate, r.returnDate, r.id);
    const blocker = r.status === 'pending' ? DB.approvalBlocker(r) : null;
    const decider = r.decidedBy ? DB.userById(r.decidedBy) : null;

    let decision;
    if (r.status === 'pending') {
      decision = `
        <label class="label" for="ad-note">Note to teacher</label>
        <div class="hint" style="margin:2px 0 10px">Optional — included in the email</div>
        <textarea class="textarea" id="ad-note" placeholder="e.g. Pick up from ${esc(item.pickup || 'shelf B2')} after 3 PM."></textarea>
        ${blocker ? `<div class="note warn mt-12">${icon('alert', 16)}<span>${esc(blocker)} Decline, or free up units first.</span></div>` : ''}
        <button class="btn btn-primary btn-lg btn-block mt-16" data-accept ${blocker ? 'disabled' : ''}>${icon('check', 20, 2.5)} Accept request</button>
        <button class="btn btn-danger btn-lg btn-block mt-16" data-decline>${icon('x', 20, 2.5)} Decline request</button>
        <p class="small muted mt-16">${item.consumable ? `Approving deducts ${r.qty} ${unit(r.qty)} from stock` : `Approving reserves ${r.qty} ${unit(r.qty)} for ${U.fmtRange(r.pickupDate, r.returnDate)}`} and notifies ${esc(U.firstName(tch.name))} by email.</p>`;
    } else {
      const when = r.decidedAt ? U.fmtDateTime(r.decidedAt) : '';
      const lines = {
        approved: () => (DB.isActiveLoan(r) ? (r.pickupDate > U.today() ? `Reserved — pickup ${U.fmtDay(r.pickupDate)}.` : (DB.isOverdue(r) ? `Out on loan — <strong class="text-red">${U.plural(DB.daysLate(r), 'day')} overdue</strong> (due ${U.fmtDay(r.returnDate)}).` : `Out on loan — due back ${U.fmtDay(r.returnDate)}.`)) : 'Consumable — fulfilled from stock.'),
        returned: () => `Returned ${U.fmtDay(r.returnedAt)}${r.returnedAt > r.returnDate ? ` <span class="text-red">(${U.plural(U.diffDays(r.returnedAt, r.returnDate), 'day')} late)</span>` : ' — on time'}.`,
        declined: () => 'This request was declined.',
        cancelled: () => 'The teacher cancelled this request.',
      };
      decision = `
        <p>${lines[r.status] ? lines[r.status]() : ''}</p>
        ${when && r.status !== 'cancelled' ? `<p class="small muted mt-8">Decided ${when}${decider ? ` by ${esc(decider.name)}` : ''}</p>` : ''}
        ${r.adminNote ? `<div class="purpose-box mt-16"><div class="eyebrow">Note to teacher</div><p class="mt-8">${esc(r.adminNote)}</p></div>` : ''}
        ${DB.isActiveLoan(r) && r.pickupDate <= U.today() ? `<button class="btn btn-primary btn-lg btn-block mt-16" data-returned>${icon('undo', 20)} Mark as returned</button>` : ''}`;
    }

    root.innerHTML = UI.shell(user, 'requests', `
      <a class="link-plain" href="#/admin/requests${r.status === 'pending' ? '' : `?tab=${r.status === 'declined' ? 'declined' : r.status === 'cancelled' ? 'all' : 'approved'}`}" style="margin-bottom:22px;display:inline-flex">${icon('arrowLeft', 18)} All requests</a>
      <div class="layout-side wide" style="grid-template-columns:minmax(0,1fr) 420px">
        <div class="stack gap-24">
          <section class="card card-pad row gap-20 wrap">
            ${UI.avatar(tch.name, 'avatar-lg')}
            <div style="flex:1;min-width:200px">
              <div class="muted">Request #${r.id} · submitted ${U.fmtDateTime(r.submittedAt)}</div>
              <h1 style="font-size:30px;font-weight:800;margin:4px 0">${esc(tch.name)}</h1>
              <div class="muted">${esc(tch.school)} · ${tch.role === 'admin' ? 'Admin' : 'Teacher'} ID ${esc(tch.loginId)}</div>
            </div>
            <div class="row gap-12">
              <div class="mini-box"><div class="mb-v">${pastLoans}</div><div class="mb-k">past loans</div></div>
              <div class="mini-box"><div class="mb-v ${lateReturns ? 'text-red' : ''}">${lateReturns}</div><div class="mb-k">late returns</div></div>
            </div>
          </section>

          <section class="card card-pad row gap-20 wrap">
            <a href="#/admin/inventory?edit=${esc(item.id || '')}" style="width:156px;height:124px;display:block" aria-label="Edit ${esc(item.name)}">${UI.itemArt(item, 40)}</a>
            <div>
              <div class="eyebrow">Requested item</div>
              <div style="font-size:24px;font-weight:800;margin:4px 0">${esc(item.name)}</div>
              ${r.status === 'pending'
                ? `<span class="avail ${avail < r.qty ? 'low' : ''}">${item.consumable ? `${avail} ${unit(avail)} in stock` : `${avail} of ${item.quantity} available for these dates`}</span>`
                : `<span class="avail">${item.consumable ? `${item.quantity} ${unit(item.quantity)} in stock now` : `${DB.availableNow(item)} of ${item.quantity} available now`}</span>`}
            </div>
          </section>

          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:18px">Request details</h2>
            <div class="tiles-3">
              <div class="detail-tile"><div class="k">${item.consumable ? 'Pickup' : 'Loan duration'}</div><div class="v">${item.consumable ? U.fmtDay(r.pickupDate) : `${durationText(r)} · ${U.fmtRange(r.pickupDate, r.returnDate)}`}</div></div>
              <div class="detail-tile"><div class="k">Quantity</div><div class="v">${r.qty} ${unit(r.qty)}</div></div>
              <div class="detail-tile"><div class="k">Activity</div><div class="v">${esc(r.activity)}${r.classGrade ? ` · ${esc(r.classGrade)}` : ''}</div></div>
              <div class="detail-tile"><div class="k">Consumable?</div><div class="v">${r.consumable ? 'Yes — some will be used up' : 'No — all items returned'}</div></div>
            </div>
            <div class="purpose-box mt-16"><div class="eyebrow">Purpose</div><p style="margin-top:6px;font-size:16px">${esc(r.purpose)}</p></div>
          </section>
        </div>

        <aside class="card card-pad" style="position:sticky;top:104px">
          <div class="row-between" style="margin-bottom:14px"><h2 class="card-title">Decision</h2>${UI.statusBadge(r)}</div>
          ${decision}
        </aside>
      </div>`);

    // Make the item art fill its link box
    const artLink = root.querySelector('a[aria-label^="Edit"] .art');
    if (artLink) artLink.style.height = '100%';

    const accept = root.querySelector('[data-accept]');
    if (accept) accept.addEventListener('click', () => approve(r, user, root.querySelector('#ad-note').value, () => App.refresh()));
    const decline = root.querySelector('[data-decline]');
    if (decline) decline.addEventListener('click', () => {
      try { DB.decide(r.id, 'declined', root.querySelector('#ad-note').value, user); UI.toast('Request declined'); App.refresh(); } catch (ex) { UI.toast(ex.message, 'error'); }
    });
    const returned = root.querySelector('[data-returned]');
    if (returned) returned.addEventListener('click', () => {
      UI.confirm({
        title: 'Mark as returned?',
        message: `Confirm that <strong>${esc(item.name)} ×${r.qty}</strong> from ${esc(tch.name)} is back in the makerspace.`,
        confirmLabel: 'Mark returned',
        onConfirm: () => { try { DB.markReturned(r.id); UI.toast('Loan checked back in'); App.refresh(); } catch (ex) { UI.toast(ex.message, 'error'); } },
      });
    });
  };

  /* ---------------- Inventory ---------------- */
  function itemForm(item) {
    const it = item || { name: '', category: 'Robotics', consumable: false, quantity: 1, unit: 'kit', grades: '', maxLoanWeeks: 2, pickup: 'Makerspace', includes: '', description: '', lowStock: 10 };
    return `
      <form class="form-grid" novalidate data-item-form>
        <div class="form-error span-2" hidden></div>
        <div class="field span-2"><label for="if-name">Item name</label><input class="input sm" id="if-name" name="name" value="${esc(it.name)}" placeholder="e.g. LEGO Spike Prime kit"></div>
        <div class="field"><label for="if-cat">Category</label><select class="select sm" id="if-cat" name="category">${DB.CATEGORIES.map((c) => `<option ${c === it.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="if-type">Type</label><select class="select sm" id="if-type" name="consumable"><option value="0" ${it.consumable ? '' : 'selected'}>Reusable · return required</option><option value="1" ${it.consumable ? 'selected' : ''}>Consumable · not returned</option></select></div>
        <div class="field"><label for="if-qty" data-qty-label>${it.consumable ? 'In stock' : 'Total owned'}</label><input class="input sm" id="if-qty" name="quantity" type="number" min="0" value="${it.quantity}"></div>
        <div class="field"><label for="if-unit">Unit name</label><input class="input sm" id="if-unit" name="unit" value="${esc(it.unit)}" placeholder="kit, set, spool…"></div>
        <div class="field" data-reusable><label for="if-max">Max loan (weeks)</label><input class="input sm" id="if-max" name="maxLoanWeeks" type="number" min="1" max="12" value="${it.maxLoanWeeks || 2}"></div>
        <div class="field" data-consumable><label for="if-low">Low-stock alert at</label><input class="input sm" id="if-low" name="lowStock" type="number" min="0" value="${it.lowStock ?? 10}"></div>
        <div class="field"><label for="if-grades">Grades</label><input class="input sm" id="if-grades" name="grades" value="${esc(it.grades)}" placeholder="e.g. 5–8"></div>
        <div class="field"><label for="if-pickup">Pickup location</label><input class="input sm" id="if-pickup" name="pickup" value="${esc(it.pickup)}"></div>
        <div class="field"><label for="if-inc">Includes</label><input class="input sm" id="if-inc" name="includes" value="${esc(it.includes)}" placeholder="Hub, 3 motors, 3 sensors"></div>
        <div class="field span-2"><label for="if-desc">Description</label><textarea class="textarea" id="if-desc" name="description" style="min-height:90px">${esc(it.description)}</textarea></div>
      </form>`;
  }

  function openItemModal(item, onSaved) {
    UI.modal({
      title: item ? `Edit ${item.name}` : 'Add inventory item',
      wide: true,
      body: itemForm(item),
      onMount: (wrap) => {
        const f = wrap.querySelector('[data-item-form]');
        const sync = () => {
          const cons = f.consumable.value === '1';
          f.querySelector('[data-reusable]').hidden = cons;
          f.querySelector('[data-consumable]').hidden = !cons;
          f.querySelector('[data-qty-label]').textContent = cons ? 'In stock' : 'Total owned';
        };
        f.consumable.addEventListener('change', sync);
        sync();
      },
      actions: [
        { label: 'Cancel' },
        { label: item ? 'Save changes' : 'Add item', cls: 'btn-primary', onClick: (wrap) => {
          const f = wrap.querySelector('[data-item-form]');
          const fe = f.querySelector('.form-error');
          try {
            const saved = DB.saveItem({
              id: item && item.id, name: f.name.value, category: f.category.value, consumable: f.consumable.value === '1', quantity: f.quantity.value,
              unit: f.unit.value, maxLoanWeeks: f.maxLoanWeeks.value, lowStock: f.lowStock.value, grades: f.grades.value, pickup: f.pickup.value,
              includes: f.includes.value, description: f.description.value,
            });
            UI.toast(item ? `${saved.name} updated` : `${saved.name} added to the catalog`);
            onSaved();
            return true;
          } catch (ex) {
            fe.innerHTML = `${icon('alert', 18)}<span>${esc(ex.message)}</span>`; fe.hidden = false;
            return false;
          }
        } },
      ],
    });
  }

  Views.adminInventory = (root, { user, query }) => {
    let term = '';
    let cat = 'All';
    let lowOnly = query.filter === 'low';

    function render(keepFocus) {
      const all = DB.items();
      const t = term.trim().toLowerCase();
      const list = all.filter((it) => (cat === 'All' || it.category === cat) && (!lowOnly || DB.isLowStock(it)) && (!t || `${it.name} ${it.category}`.toLowerCase().includes(t)));
      const reusable = all.filter((i) => !i.consumable);
      const totalUnits = U.sum(reusable, (i) => i.quantity);
      const outUnits = U.sum(reusable, (i) => DB.outNow(i));

      root.innerHTML = UI.shell(user, 'inventory', `
        <div class="page-head">
          <div><h1 class="page-title">Inventory</h1><p class="page-sub">Manage equipment, stock levels and what teachers can borrow.</p></div>
          <button class="btn btn-primary btn-lg" data-add>${icon('plus', 20)} Add item</button>
        </div>
        <div class="grid-4" style="margin-bottom:24px">
          <div class="card mini-stat"><span class="m-icon">${icon('cube', 24)}</span><span><div class="m-value">${all.length}</div><div class="m-label">Catalog items</div></span></div>
          <div class="card mini-stat"><span class="m-icon">${icon('robot', 24)}</span><span><div class="m-value">${totalUnits}</div><div class="m-label">Reusable units</div></span></div>
          <div class="card mini-stat"><span class="m-icon">${icon('clock', 24)}</span><span><div class="m-value">${outUnits}</div><div class="m-label">Out on loan now</div></span></div>
          <button class="card mini-stat" data-low style="text-align:left;cursor:pointer;${lowOnly ? 'outline:2px solid var(--red)' : ''}"><span class="m-icon red">${icon('alert', 24)}</span><span><div class="m-value red">${all.filter(DB.isLowStock).length}</div><div class="m-label">${lowOnly ? 'Showing low stock' : 'Low stock'}</div></span></button>
        </div>
        <div class="toolbar">
          <div class="chip-row">${['All', ...DB.CATEGORIES].map((c) => `<button class="chip ${c === cat ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
          <div class="search-input">${icon('search', 20)}<input class="input sm" type="search" placeholder="Search inventory" aria-label="Search inventory" value="${esc(term)}" data-search></div>
        </div>
        <section class="card">
          ${list.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>Item</th><th>Type</th><th class="num">Total</th><th class="num">Out now</th><th class="num">Available</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>${list.map((it) => {
              const out = DB.outNow(it); const av = it.consumable ? it.quantity : DB.availableNow(it);
              const pendingCount = DB.requests().filter((r) => r.itemId === it.id && r.status === 'pending').length;
              return `<tr>
                <td><div class="inv-name">${UI.itemArt(it, 22)}<div><div style="font-weight:700">${esc(it.name)}</div><div class="small muted">${esc(it.category)} · ${esc(it.pickup)}</div></div></div></td>
                <td>${it.consumable ? '<span class="badge badge-consumable">Consumable</span>' : '<span class="badge badge-neutral">Reusable</span>'}</td>
                <td class="num">${it.quantity}</td>
                <td class="num">${it.consumable ? '—' : out}</td>
                <td class="num" style="font-weight:700">${av}</td>
                <td>${DB.isLowStock(it) ? '<span class="badge badge-declined">Low stock</span>' : '<span class="badge badge-pending">In stock</span>'}${pendingCount ? `<div class="small muted mt-8">${U.plural(pendingCount, 'pending request')}</div>` : ''}</td>
                <td><div class="decision-cell">
                  <button class="btn btn-ghost btn-sm" data-edit="${esc(it.id)}">${icon('edit', 16)} Edit</button>
                  <button class="btn btn-ghost btn-sm btn-icon" data-del="${esc(it.id)}" aria-label="Delete ${esc(it.name)}" title="Delete">${icon('trash', 16)}</button>
                </div></td>
              </tr>`;
            }).join('')}</tbody></table></div>`
          : UI.emptyState('cube', 'No items found', lowOnly ? 'Nothing is low on stock.' : 'Try a different search or category.')}
        </section>`);

      root.querySelector('[data-add]').addEventListener('click', () => openItemModal(null, () => render()));
      root.querySelector('[data-low]').addEventListener('click', () => { lowOnly = !lowOnly; render(); });
      root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; render(); }));
      const search = root.querySelector('[data-search]');
      search.addEventListener('input', () => { term = search.value; render(true); });
      if (keepFocus) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
      root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openItemModal(DB.itemById(b.dataset.edit), () => render())));
      root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        const it = DB.itemById(b.dataset.del);
        UI.confirm({
          title: `Delete ${it.name}?`,
          message: 'It will be removed from the catalog. Past request history is kept.',
          confirmLabel: 'Delete item', danger: true,
          onConfirm: () => { try { DB.deleteItem(it.id); UI.toast(`${it.name} deleted`); render(); } catch (ex) { UI.toast(ex.message, 'error'); } },
        });
      }));
    }
    render();
    if (query.edit && DB.itemById(query.edit)) openItemModal(DB.itemById(query.edit), () => render());
  };

  /* ---------------- Insights ---------------- */
  function semesterStart(iso) {
    const d = U.parse(iso); const y = d.getFullYear();
    return d.getMonth() >= 7 ? `${y}-08-01` : `${y}-01-01`;
  }

  Views.adminInsights = (root, { user }) => {
    const today = U.today();
    const sy = (() => { const d = U.parse(today); return d.getMonth() >= 6 ? `${d.getFullYear()}-07-01` : `${d.getFullYear() - 1}-07-01`; })();
    const periods = {
      semester: { label: 'This semester', from: semesterStart(today) },
      year: { label: 'This school year', from: sy },
      d30: { label: 'Last 30 days', from: U.addDays(today, -29) },
      all: { label: 'All time', from: null },
    };
    let period = 'semester';

    function data() {
      const from = periods[period].from;
      const all = DB.requests().filter((r) => r.status !== 'cancelled');
      const list = all.filter((r) => !from || U.isoFromTs(r.submittedAt) >= from);
      return { from, all, list };
    }

    function render() {
      const { from, all, list } = data();
      const pending = DB.requests().filter((r) => r.status === 'pending');
      const accepted = list.filter((r) => r.status === 'approved' || r.status === 'returned');
      const declined = list.filter((r) => r.status === 'declined');
      const decided = [...accepted, ...declined].filter((r) => r.decidedAt);
      const rate = accepted.length + declined.length ? Math.round((accepted.length / (accepted.length + declined.length)) * 100) : 0;
      const avgResp = decided.length ? U.sum(decided, (r) => r.decidedAt - r.submittedAt) / decided.length / U.DAY_MS : 0;
      const oldest = pending.length ? Math.min(...pending.map((r) => r.submittedAt)) : null;
      const oldestDays = oldest ? U.diffDays(today, U.isoFromTs(oldest)) : 0;

      let start = from || (all.length ? U.isoFromTs(Math.min(...all.map((r) => r.submittedAt))) : today);
      let months = Charts.monthRange(start, today);
      if (months.length > 12) months = months.slice(-12);
      const series = [{ name: 'Accepted', cls: 'c-navy' }, { name: 'Declined', cls: 'c-red' }, { name: 'Pending', cls: 'c-sky' }];
      const groups = months.map((m) => {
        const inM = list.filter((r) => Charts.monthKey(U.isoFromTs(r.submittedAt)) === m);
        return { label: Charts.monthLabel(m), values: [inM.filter((r) => r.status === 'approved' || r.status === 'returned').length, inM.filter((r) => r.status === 'declined').length, inM.filter((r) => r.status === 'pending').length] };
      });

      const inUse = DB.CATEGORIES.map((c) => {
        const its = DB.items().filter((i) => i.category === c && !i.consumable);
        const total = U.sum(its, (i) => i.quantity); const out = U.sum(its, (i) => DB.outNow(i));
        return { label: c, value: total ? Math.round((out / total) * 100) : 0 };
      }).sort((a, b) => b.value - a.value);
      const inUseRows = inUse.map((r) => ({ ...r, pct: r.value, display: `${r.value}%` }));

      const counts = {};
      list.forEach((r) => { counts[r.itemId] = (counts[r.itemId] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ label: DB.itemById(id)?.name || 'Removed item', value: n }));
      const topMax = Math.max(1, ...top.map((t) => t.value));

      const schools = {};
      list.forEach((r) => {
        const s = teacherOf(r).school; schools[s] = schools[s] || { requests: 0, accepted: 0, overdue: 0 };
        schools[s].requests++;
        if (r.status === 'approved' || r.status === 'returned') schools[s].accepted++;
      });
      DB.requests().filter((r) => DB.isOverdue(r)).forEach((r) => { const s = teacherOf(r).school; schools[s] = schools[s] || { requests: 0, accepted: 0, overdue: 0 }; schools[s].overdue++; });
      const schoolRows = Object.entries(schools).sort((a, b) => b[1].requests - a[1].requests);

      root.innerHTML = UI.shell(user, 'insights', `
        <div class="page-head">
          <div><h1 class="page-title">Insights</h1><p class="page-sub">Requests, approvals and equipment use across all schools</p></div>
          <div class="row gap-12 wrap">
            <select class="select sm" data-period aria-label="Period" style="width:auto">${Object.entries(periods).map(([k, v]) => `<option value="${k}" ${k === period ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
            <button class="btn btn-outline" data-export>${icon('download', 18)} Export CSV</button>
          </div>
        </div>

        <div class="grid-4">
          <a class="card stat red" href="#/admin/requests"><div class="s-label">Pending requests</div><div class="s-value">${pending.length}</div><div class="s-sub">${oldest ? `Oldest waiting ${oldestDays ? U.plural(oldestDays, 'day') : 'since today'} →` : 'Nothing waiting'}</div></a>
          <div class="card stat navy"><div class="s-label">Items accepted</div><div class="s-value">${accepted.length}</div><div class="s-sub">${periods[period].label}</div></div>
          <div class="card stat"><div class="s-label">Approval rate</div><div class="s-value">${rate}%</div><div class="s-sub">${accepted.length} accepted · ${declined.length} declined</div></div>
          <div class="card stat"><div class="s-label">Avg. response time</div><div class="s-value">${avgResp.toFixed(1)}<small>${avgResp.toFixed(1) === '1.0' ? 'day' : 'days'}</small></div><div class="s-sub">Target: under 1 school day</div></div>
        </div>

        <div class="layout-side wide" style="margin-top:24px;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)">
          <section class="card card-pad">
            <div class="row-between wrap" style="margin-bottom:6px"><h2 class="card-title">Requests by month</h2>${Charts.legend(series)}</div>
            ${list.length ? Charts.stacked(groups, series) : UI.emptyState('chart', 'No requests in this period', '')}
          </section>
          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:20px">Inventory in use</h2>
            ${Charts.hbars(inUseRows, { fillCls: 'sky' })}
            <p class="small muted mt-16">Share of reusable units currently out on loan.</p>
          </section>
        </div>

        <div class="grid-2" style="margin-top:24px">
          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:18px">Most requested items</h2>
            ${top.length ? `<div class="rank-list">${top.map((t, i) => `<div class="rank"><span class="r-num">${i + 1}</span><div class="hbar"><div class="hb-top"><span>${esc(t.label)}</span><span>${t.value}</span></div><div class="hb-track" style="height:6px"><div class="hb-fill" style="width:${(t.value / topMax) * 100}%"></div></div></div></div>`).join('')}</div>` : '<p class="muted">No requests in this period.</p>'}
          </section>
          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:8px">By school</h2>
            <div class="table-wrap"><table class="table compact">
              <thead><tr><th>School</th><th class="num">Requests</th><th class="num">Accepted</th><th class="num">Overdue</th></tr></thead>
              <tbody>${schoolRows.length ? schoolRows.map(([s, v]) => `<tr><td style="font-weight:700">${esc(U.shortSchool(s))}</td><td class="num">${v.requests}</td><td class="num">${v.accepted}</td><td class="num ${v.overdue ? 'text-red' : ''}" style="font-weight:700;color:var(--red)">${v.overdue}</td></tr>`).join('') : '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody>
            </table></div>
          </section>
        </div>`);

      root.querySelector('[data-period]').addEventListener('change', (e) => { period = e.target.value; render(); });
      root.querySelector('[data-export]').addEventListener('click', () => exportCsv(list));
    }

    function exportCsv(list) {
      const rows = [['Request ID', 'Submitted', 'Teacher', 'Teacher ID', 'School', 'Item', 'Category', 'Quantity', 'Pickup', 'Return', 'Activity', 'Class / grade', 'Purpose', 'Consumable', 'Status', 'Decided', 'Returned', 'Admin note']];
      [...list].sort((a, b) => a.submittedAt - b.submittedAt).forEach((r) => {
        const t = teacherOf(r); const it = DB.itemById(r.itemId);
        rows.push([r.id, new Date(r.submittedAt).toISOString(), t.name, t.loginId, t.school, it ? it.name : 'Removed item', it ? it.category : '', r.qty, r.pickupDate, r.returnDate || '', r.activity, r.classGrade, r.purpose, r.consumable ? 'Yes' : 'No', DB.isOverdue(r) ? 'overdue' : r.status, r.decidedAt ? new Date(r.decidedAt).toISOString() : '', r.returnedAt || '', r.adminNote]);
      });
      U.downloadFile(`makerspace-requests-${period}-${today}.csv`, U.toCSV(rows));
      UI.toast(`Exported ${U.plural(list.length, 'request')}`);
    }

    render();
  };
})();
