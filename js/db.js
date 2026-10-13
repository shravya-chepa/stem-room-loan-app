/*
 * In-browser "database".
 * All data lives in plain JS objects (users, items, requests, notifications)
 * and is persisted to localStorage so it survives page reloads.
 */
window.DB = (() => {
  const KEY = 'sml_db_v1';
  const DEMO_PASSWORD = 'Maker#2026';
  const CATEGORIES = ['Robotics', 'Electronics', 'Fabrication', 'Tools'];
  const ACTIVITY_TYPES = ['Classroom lesson', 'After-school club', 'Competition / science fair', 'Teacher training', 'Other'];
  const SCHOOLS = ['Lincoln Middle School', 'Westview High School', 'Maple Elementary School'];

  let state = null;

  /* ---------------- persistence ---------------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        state = JSON.parse(raw);
        if (state && state.version === 1) return;
      }
    } catch (e) { /* fall through to a fresh seed */ }
    state = seed();
    save();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Could not persist data', e); }
  }
  function reset() { state = seed(); save(); }

  /* ---------------- seed data ---------------- */
  function seedItems() {
    const base = { consumable: false, lowStock: null, maxLoanWeeks: 3 };
    return [
      { id: 'lego-spike', name: 'LEGO Spike Prime kit', category: 'Robotics', quantity: 10, unit: 'kit', grades: '5–8', maxLoanWeeks: 3, pickup: 'Makerspace, shelf B2', includes: 'Hub, 3 motors, 3 sensors', description: 'Programmable robotics set with hub, motors, color and distance sensors. Ideal for coding and engineering design units; each kit supports 2–3 students.' },
      { id: 'arduino-uno', name: 'Arduino Uno starter kit', category: 'Electronics', quantity: 20, unit: 'kit', grades: '6–12', maxLoanWeeks: 3, pickup: 'Makerspace, shelf C1', includes: 'Uno board, breadboard, 30+ parts', description: 'Microcontroller board with breadboard, jumper wires, LEDs, resistors and sensors plus a project booklet. Great for intro circuits and physical computing.' },
      { id: 'microbit', name: 'BBC micro:bit class set', category: 'Electronics', quantity: 5, unit: 'set', grades: '3–8', maxLoanWeeks: 2, pickup: 'Makerspace, shelf C2', includes: '30 boards, battery packs, cables', description: 'A class set of 30 pocket-sized programmable boards with LEDs, buttons, an accelerometer and radio. Code with MakeCode blocks or Python.' },
      { id: 'ozobot', name: 'Ozobot Evo robots', category: 'Robotics', quantity: 12, unit: 'robot', grades: 'K–5', maxLoanWeeks: 2, pickup: 'Makerspace, shelf B1', includes: 'Robot, charger, marker set', description: 'Tiny line-following robots that read color codes and run block-based programs. A friendly first step into coding for younger students.' },
      { id: 'pla', name: 'PLA filament spool, 1 kg', category: 'Fabrication', consumable: true, quantity: 18, unit: 'spool', lowStock: 8, grades: 'All', maxLoanWeeks: null, pickup: 'Makerspace, fabrication cabinet', includes: '1 kg spool, 1.75 mm', description: '1.75 mm PLA filament for the makerspace and classroom 3D printers. Assorted colors — mention your preferred color in the project description.' },
      { id: 'snap', name: 'Snap Circuits Jr. set', category: 'Electronics', quantity: 8, unit: 'set', grades: '2–6', maxLoanWeeks: 3, pickup: 'Makerspace, shelf C3', includes: '30+ snap parts, project manual', description: 'Snap-together electronics kit with 30+ parts and 100+ guided projects. No soldering or tools needed — perfect for elementary science.' },
      { id: 'calipers', name: 'Digital calipers', category: 'Tools', quantity: 15, unit: 'caliper', grades: '6–12', maxLoanWeeks: 3, pickup: 'Makerspace, tool wall', includes: 'Caliper, case, spare battery', description: 'Stainless steel digital calipers that measure to 0.01 mm in metric and imperial. Perfect for physics labs and engineering measurement.' },
      { id: 'soldering', name: 'Soldering station', category: 'Tools', quantity: 6, unit: 'station', grades: '9–12', maxLoanWeeks: 2, pickup: 'Makerspace, electronics bench', includes: 'Iron, stand, fume fan, glasses', description: 'Temperature-controlled soldering station with stand, tip cleaner and fume extractor. Safety glasses included; adult supervision required.' },
      { id: 'aa-batteries', name: 'AA batteries', category: 'Electronics', consumable: true, quantity: 14, unit: 'battery', unitPlural: 'batteries', lowStock: 20, grades: 'All', maxLoanWeeks: null, pickup: 'Makerspace front desk', includes: 'Single alkaline AA cells', description: 'Alkaline AA batteries for robots, sensors and classroom devices. Please drop used batteries in the makerspace recycling bin.' },
      { id: 'vex-go', name: 'VEX GO robotics kit', category: 'Robotics', quantity: 8, unit: 'kit', grades: '3–5', maxLoanWeeks: 3, pickup: 'Makerspace, shelf B3', includes: 'Brain, 2 motors, 300+ parts', description: 'Snap-together robotics kit with a robot brain, motors and sensors, designed for hands-on elementary STEM lessons.' },
      { id: '3d-pen', name: '3D pen set', category: 'Fabrication', quantity: 10, unit: 'pen', grades: '4–12', maxLoanWeeks: 2, pickup: 'Makerspace, fabrication cabinet', includes: 'Pen, charger, starter filament', description: 'Low-temperature 3D drawing pens for sketching shapes in the air. Pairs well with geometry, architecture and design units.' },
      { id: 'basswood', name: 'Basswood sheets, 3 mm', category: 'Fabrication', consumable: true, quantity: 40, unit: 'sheet', lowStock: 10, grades: 'All', maxLoanWeeks: null, pickup: 'Makerspace, material rack', includes: '12 × 20 in sheets', description: 'Laser-cutter-ready basswood sheets for prototypes, enclosures and model building.' },
    ].map((it) => ({ ...base, ...it }));
  }

  function seed() {
    const t = U.today();
    const now = Date.now();
    const at = (off, h, m = 0) => { const d = U.parse(U.addDays(t, off)); d.setHours(h, m, 0, 0); return Math.min(d.getTime(), now - 5 * 60000); };
    const ago = (min) => now - min * 60000;
    const rand = U.rng(20261013);
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

    const teacherRows = [
      ['u_jordan', 'Jordan Reyes', 'Lincoln Middle School', 'Springfield', 'jreyes@lincoln.school.org', 'T-204518'],
      ['u_amara', 'Amara Lewis', 'Westview High School', 'Riverside District', 'alewis@westview.school.org', 'T-318842'],
      ['u_marcus', 'Marcus Tran', 'Lincoln Middle School', 'Springfield', 'mtran@lincoln.school.org', 'T-207731'],
      ['u_keisha', 'Keisha Brown', 'Maple Elementary School', 'Oak Valley', 'kbrown@maple.school.org', 'T-112094'],
      ['u_diego', 'Diego Santos', 'Westview High School', 'Riverside District', 'dsantos@westview.school.org', 'T-320455'],
      ['u_priya', 'Priya Nair', 'Maple Elementary School', 'Oak Valley', 'pnair@maple.school.org', 'T-115563'],
      ['u_lena', 'Lena Fischer', 'Lincoln Middle School', 'Springfield', 'lfischer@lincoln.school.org', 'T-209918'],
      ['u_omar', 'Omar Bakr', 'Westview High School', 'Riverside District', 'obakr@westview.school.org', 'T-322107'],
    ];
    const created = at(-200, 9);
    const users = teacherRows.map(([id, name, school, location, email, loginId]) => ({
      id, role: 'teacher', name, school, location, email, loginId, passwordHash: U.hashPassword(DEMO_PASSWORD, loginId), createdAt: created,
    }));
    users.push({
      id: 'u_sam', role: 'admin', name: 'Sam Okafor', school: 'District STEM Makerspace', location: 'Springfield', email: 'sokafor@district.school.org',
      loginId: 'A-100234', passwordHash: U.hashPassword(DEMO_PASSWORD, 'A-100234'), createdAt: created,
    });
    const userById = Object.fromEntries(users.map((u) => [u.id, u]));
    const items = seedItems();
    const itemById = Object.fromEntries(items.map((i) => [i.id, i]));

    const reqs = [];
    const add = (o) => {
      const item = itemById[o.itemId];
      const r = {
        id: 0, qty: 1, weeks: null, returnDate: null, activity: 'Classroom lesson', classGrade: '', purpose: '',
        consumable: !!item.consumable, status: 'pending', decidedAt: null, decidedBy: null, adminNote: '', returnedAt: null, ...o,
      };
      if (!item.consumable && r.weeks && !r.returnDate) r.returnDate = U.addDays(r.pickupDate, r.weeks * 7);
      if (r.decidedAt && !r.decidedBy) r.decidedBy = 'u_sam';
      reqs.push(r);
      return r;
    };

    // ---- Pending requests (match the design mockups) ----
    add({ userId: 'u_jordan', itemId: 'lego-spike', qty: 4, pickupDate: U.addDays(t, 6), weeks: 2, submittedAt: ago(12), classGrade: '7th grade Science, period 3', purpose: 'Students will design and code a sorting robot for our simple machines unit, working in teams of three.' });
    add({ userId: 'u_amara', itemId: 'pla', qty: 3, pickupDate: U.addDays(t, 3), submittedAt: ago(64), activity: 'After-school club', classGrade: 'Engineering club', purpose: 'Engineering club prototypes for the regional design challenge.' });
    add({ userId: 'u_marcus', itemId: 'arduino-uno', qty: 10, pickupDate: U.addDays(t, 6), weeks: 3, submittedAt: ago(185), classGrade: '8th grade Tech Ed', purpose: 'Tech Ed circuits project — students build a traffic light controller.' });
    add({ userId: 'u_keisha', itemId: 'microbit', qty: 2, pickupDate: U.addDays(t, 2), weeks: 1, submittedAt: at(-1, 14, 20), classGrade: '5th grade Math', purpose: 'Intro to coding unit using micro:bit step counters.' });
    add({ userId: 'u_diego', itemId: 'calipers', qty: 8, pickupDate: U.addDays(t, 1), weeks: 2, submittedAt: at(-1, 10, 5), classGrade: 'Physics lab', purpose: 'Physics lab measurements for our density experiments.' });
    add({ userId: 'u_priya', itemId: 'snap', qty: 6, pickupDate: U.addDays(t, 7), weeks: 1, submittedAt: at(-2, 13, 10), activity: 'Competition / science fair', classGrade: '4th grade Science', purpose: 'Electricity science fair — students build working circuits.' });
    add({ userId: 'u_lena', itemId: 'aa-batteries', qty: 12, pickupDate: U.addDays(t, 7), submittedAt: at(-2, 9, 40), classGrade: '6th grade Coding club', activity: 'After-school club', purpose: 'Ozobot coding lessons — replacement batteries for chargers.' });
    add({ userId: 'u_omar', itemId: 'soldering', qty: 2, pickupDate: U.addDays(t, 13), weeks: 2, submittedAt: at(-2, 8, 15), activity: 'Competition / science fair', classGrade: 'Robotics team', purpose: 'Robotics team build season — wiring the drive base.' });

    const classesBySchool = {
      'Lincoln Middle School': ['6th grade Science', '7th grade Science', '8th grade Tech Ed', 'STEM elective'],
      'Westview High School': ['Physics lab', 'Engineering club', 'Robotics team', 'AP Computer Science'],
      'Maple Elementary School': ['3rd grade Science', '4th grade Science', '5th grade Math', 'Coding club'],
    };
    const purposes = {
      Robotics: ['Sorting robot challenge for our engineering unit.', 'Line-following maze competition in teams.', 'Robotics club practice for the regional tournament.', 'Intro to block coding with movement challenges.'],
      Electronics: ['Build simple circuits to explore voltage and current.', 'Weather station project with temperature sensors.', 'Coding night-lights and alarms with LEDs.', 'Physical computing unit — reaction timer game.'],
      Fabrication: ['3D printed bridge designs for load testing.', 'Prototype enclosures for science fair projects.', 'Laser-cut catapult build for physics week.'],
      Tools: ['Precision measurement lab for density experiments.', 'Repairing and wiring robot drive bases.', 'Engineering design challenge — measure and iterate.'],
    };
    const teachers = users.filter((u) => u.role === 'teacher');
    const reusable = items.filter((i) => !i.consumable && !['lego-spike', 'soldering', 'ozobot'].includes(i.id));
    const randomDetails = (u, item) => ({
      classGrade: pick(classesBySchool[u.school]),
      purpose: pick(purposes[item.category]),
      activity: rand() < 0.65 ? 'Classroom lesson' : pick(ACTIVITY_TYPES.slice(1)),
    });

    // A dozen more pending requests from the last two days.
    for (let i = 0; i < 12; i++) {
      const u = pick(teachers); const item = pick(reusable);
      const weeks = between(1, item.maxLoanWeeks);
      add({ userId: u.id, itemId: item.id, qty: between(1, 2), pickupDate: U.addDays(t, between(4, 20)), weeks, submittedAt: at(-between(0, 2), between(7, 16), between(0, 59)), ...randomDetails(u, item) });
    }

    // ---- Active loans (approved, not yet returned) ----
    const loan = (userId, itemId, qty, pickupOff, weeks, extra = {}) => {
      const sub = at(pickupOff - 3, 9, 30);
      return add({ userId, itemId, qty, pickupDate: U.addDays(t, pickupOff), weeks, submittedAt: sub, decidedAt: sub + 0.4 * U.DAY_MS, status: 'approved', ...randomDetails(userById[userId], itemById[itemId]), ...extra });
    };
    loan('u_jordan', 'arduino-uno', 6, -11, 2, { classGrade: '7th grade Science, period 3', purpose: 'Circuits unit — students wire LED traffic lights and buzzers.', adminNote: 'Pick up from shelf C1 after 3 PM.' });
    loan('u_lena', 'ozobot', 6, -16, 2);
    loan('u_marcus', 'soldering', 2, -15, 2);
    loan('u_keisha', 'snap', 4, -4, 1);
    loan('u_omar', 'ozobot', 5, -4, 2);
    loan('u_priya', 'soldering', 4, -7, 2);
    loan('u_diego', 'lego-spike', 4, -2, 2);
    loan('u_amara', 'microbit', 2, -5, 2);
    loan('u_omar', 'calipers', 5, -9, 3);
    loan('u_marcus', 'vex-go', 4, 5, 1); // future reservation
    add({ userId: 'u_jordan', itemId: 'pla', qty: 2, pickupDate: U.addDays(t, -13), submittedAt: at(-15, 10, 10), decidedAt: at(-14, 11), status: 'approved', classGrade: '7th grade Science, period 3', purpose: 'Printing gear prototypes for our simple machines unit.' });

    // ---- Jordan's recent history ----
    add({ userId: 'u_jordan', itemId: 'ozobot', qty: 12, pickupDate: U.addDays(t, -14), weeks: 1, submittedAt: at(-21, 13, 5), decidedAt: at(-20, 9, 30), status: 'declined', classGrade: '7th grade Science, period 3', purpose: 'Coding relay race for the whole class.', adminNote: 'We only have 12 Ozobots and several are booked that week. Could you try 6 robots or a later date?' });
    add({ userId: 'u_jordan', itemId: 'microbit', qty: 1, pickupDate: U.addDays(t, -30), weeks: 2, submittedAt: at(-33, 11), decidedAt: at(-32, 10), status: 'returned', returnedAt: U.addDays(t, -16), classGrade: '7th grade Science, period 3', purpose: 'Step counter experiment for our health and motion unit.' });

    // ---- Older history across the semester ----
    for (let i = 0; i < 48; i++) {
      const u = pick(teachers); const item = pick(items);
      const d = between(26, 140);
      const sub = at(-d, between(7, 16), between(0, 59));
      const pickupOff = -d + between(2, 4);
      const declined = rand() < 0.11;
      const base = { userId: u.id, itemId: item.id, submittedAt: sub, decidedAt: sub + (0.2 + rand() * 2.4) * U.DAY_MS, pickupDate: U.addDays(t, pickupOff), ...randomDetails(u, item) };
      if (item.consumable) {
        add({ ...base, qty: between(1, 4), status: declined ? 'declined' : 'approved', adminNote: declined ? 'Stock is reserved for a district workshop that week.' : '' });
      } else {
        const weeks = between(1, item.maxLoanWeeks);
        const returnDate = U.addDays(t, pickupOff + weeks * 7);
        const late = rand() < 0.1 ? between(1, 2) : 0;
        add({
          ...base, qty: between(1, Math.min(6, item.quantity)), weeks, returnDate,
          status: declined ? 'declined' : 'returned',
          returnedAt: declined ? null : U.addDays(returnDate, late),
          adminNote: declined ? 'Not enough units for those dates — please try a later window.' : '',
        });
      }
    }

    reqs.sort((a, b) => a.submittedAt - b.submittedAt);
    reqs.forEach((r, i) => { r.id = 1001 + i; });

    // ---- Notifications ----
    const notifications = [];
    const note = (userId, kind, title, body, link, createdAt, read) => notifications.push({ id: U.uid('n'), userId, kind, title, body, link, createdAt, read });
    const jordanReqs = reqs.filter((r) => r.userId === 'u_jordan');
    const jArduino = jordanReqs.find((r) => r.itemId === 'arduino-uno' && r.status === 'approved');
    const jOzo = jordanReqs.find((r) => r.itemId === 'ozobot' && r.status === 'declined');
    const jMicro = jordanReqs.find((r) => r.itemId === 'microbit' && r.status === 'returned');
    if (jMicro) note('u_jordan', 'returned', 'Return confirmed', 'BBC micro:bit class set ×1 was checked back in. Thanks!', '#/my-requests', at(-16, 15), true);
    if (jOzo) note('u_jordan', 'declined', 'Request declined', `Ozobot Evo robots ×12 — "${jOzo.adminNote}"`, '#/my-requests', jOzo.decidedAt, true);
    if (jArduino) note('u_jordan', 'approved', 'Request approved', 'Arduino Uno starter kit ×6 is ready to pick up from shelf C1.', '#/my-requests', jArduino.decidedAt, false);
    reqs.filter((r) => r.status === 'pending').slice(-3).forEach((r) => {
      note('u_sam', 'request', 'New loan request', `${userById[r.userId].name} requested ${itemById[r.itemId].name} ×${r.qty}.`, `#/admin/requests/${r.id}`, r.submittedAt, false);
    });

    return { version: 1, seededAt: now, users, items, requests: reqs, notifications, nextRequestId: 1001 + reqs.length };
  }

  /* ---------------- basic lookups ---------------- */
  const users = () => state.users;
  const items = () => state.items;
  const requests = () => state.requests;
  const userById = (id) => state.users.find((u) => u.id === id) || null;
  const itemById = (id) => state.items.find((i) => i.id === id) || null;
  const requestById = (id) => state.requests.find((r) => String(r.id) === String(id)) || null;
  const findUserByLogin = (loginId) => state.users.find((u) => u.loginId.toUpperCase() === String(loginId).trim().toUpperCase()) || null;
  const findUserByEmail = (email) => state.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase()) || null;
  const admins = () => state.users.filter((u) => u.role === 'admin');

  const unitLabel = (item, n) => (n === 1 ? item.unit : (item.unitPlural || `${item.unit}s`));

  /* ---------------- loan logic ---------------- */
  const isReturnable = (r) => { const it = itemById(r.itemId); return it ? !it.consumable : false; };
  // Approved, reusable, not yet checked back in.
  const isActiveLoan = (r) => r.status === 'approved' && isReturnable(r);
  const isOut = (r, day = U.today()) => isActiveLoan(r) && r.pickupDate <= day;
  const isOverdue = (r, day = U.today()) => isActiveLoan(r) && r.returnDate < day;
  const daysLate = (r, day = U.today()) => U.diffDays(day, r.returnDate);
  const wasLate = (r) => (r.status === 'returned' && r.returnedAt && r.returnDate && r.returnedAt > r.returnDate) || isOverdue(r);

  // Units of a reusable item free across [from, to]. Overdue loans keep occupying units until returned.
  function availableFor(item, from, to = from, excludeId = null) {
    if (!item) return 0;
    if (item.consumable) return item.quantity;
    const today = U.today();
    const booked = U.sum(state.requests.filter((r) => {
      if (r.itemId !== item.id || !isActiveLoan(r) || r.id === excludeId) return false;
      const end = r.returnDate < today ? today : r.returnDate;
      return r.pickupDate <= to && end >= from;
    }), (r) => r.qty);
    return Math.max(0, item.quantity - booked);
  }
  const availableNow = (item) => availableFor(item, U.today());
  const outNow = (item) => (item.consumable ? 0 : U.sum(state.requests.filter((r) => r.itemId === item.id && isOut(r)), (r) => r.qty));
  function nextBack(item) {
    const today = U.today();
    const dates = state.requests.filter((r) => r.itemId === item.id && isActiveLoan(r) && r.pickupDate <= today && r.returnDate >= today).map((r) => r.returnDate).sort();
    return dates[0] || null;
  }
  function isLowStock(item) {
    if (item.consumable) return item.quantity <= (item.lowStock ?? 10);
    return item.quantity > 0 && availableNow(item) / item.quantity <= 0.2;
  }

  /* ---------------- notifications ---------------- */
  function notify(userId, kind, title, body, link) {
    state.notifications.push({ id: U.uid('n'), userId, kind, title, body, link, createdAt: Date.now(), read: false });
  }
  const notifyAdmins = (...args) => admins().forEach((a) => notify(a.id, ...args));
  const notificationsFor = (userId) => state.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  function markNotificationRead(id) { const n = state.notifications.find((x) => x.id === id); if (n) { n.read = true; save(); } }
  function markAllRead(userId) { state.notifications.forEach((n) => { if (n.userId === userId) n.read = true; }); save(); }

  // Due-soon / overdue reminders, generated at most once per loan per day.
  function runDailyChecks() {
    const today = U.today();
    state.reminderLog = state.reminderLog || {};
    let changed = false;
    state.requests.filter(isActiveLoan).forEach((r) => {
      if (r.pickupDate > today) return;
      const item = itemById(r.itemId); const teacher = userById(r.userId);
      if (!item || !teacher) return;
      const left = U.diffDays(r.returnDate, today);
      const key = `${r.id}:${today}`;
      if (state.reminderLog[key]) return;
      if (left >= 0 && left <= 2) {
        notify(r.userId, 'reminder', 'Return reminder', `${item.name} ×${r.qty} is due ${left === 0 ? 'today' : U.fmtDay(r.returnDate)}.`, '#/my-requests');
        state.reminderLog[key] = 1; changed = true;
      } else if (left < 0) {
        notify(r.userId, 'overdue', 'Return overdue', `${item.name} ×${r.qty} was due ${U.fmtDay(r.returnDate)}. Please bring it back to the makerspace.`, '#/my-requests');
        notifyAdmins('overdue', 'Overdue return', `${item.name} ×${r.qty} from ${teacher.name} is ${U.plural(-left, 'day')} late.`, `#/admin/requests/${r.id}`);
        state.reminderLog[key] = 1; changed = true;
      }
    });
    if (changed) save();
  }

  /* ---------------- mutations ---------------- */
  function createRequest(user, data) {
    const item = itemById(data.itemId);
    if (!item) throw new Error('That item no longer exists.');
    const qty = Number(data.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new Error('Quantity must be at least 1.');
    if (!data.pickupDate || data.pickupDate < U.today()) throw new Error('Pick a pickup date from today onward.');
    if (!item.consumable) {
      if (!data.returnDate || data.returnDate <= data.pickupDate) throw new Error('Return date must be after the pickup date.');
      if (item.maxLoanWeeks && U.diffDays(data.returnDate, data.pickupDate) > item.maxLoanWeeks * 7) throw new Error(`The maximum loan for this item is ${U.plural(item.maxLoanWeeks, 'week')}.`);
    }
    const avail = item.consumable ? item.quantity : availableFor(item, data.pickupDate, data.returnDate);
    if (qty > avail) throw new Error(`Only ${avail} ${unitLabel(item, avail)} available for those dates.`);

    const r = {
      id: state.nextRequestId++, userId: user.id, itemId: item.id, qty,
      pickupDate: data.pickupDate, returnDate: item.consumable ? null : data.returnDate, weeks: item.consumable ? null : (data.weeks || null),
      activity: data.activity, classGrade: data.classGrade.trim(), purpose: data.purpose.trim(), consumable: !!data.consumable,
      status: 'pending', submittedAt: Date.now(), decidedAt: null, decidedBy: null, adminNote: '', returnedAt: null,
    };
    state.requests.push(r);
    notifyAdmins('request', 'New loan request', `${user.name} requested ${item.name} ×${qty}.`, `#/admin/requests/${r.id}`);
    save();
    return r;
  }

  function cancelRequest(id, user) {
    const r = requestById(id);
    if (!r || r.userId !== user.id) throw new Error('Request not found.');
    if (r.status !== 'pending') throw new Error('Only pending requests can be cancelled.');
    r.status = 'cancelled'; r.decidedAt = Date.now();
    save();
    return r;
  }

  // Why a pending request can't be approved right now (or null if it can).
  function approvalBlocker(r) {
    const item = itemById(r.itemId);
    if (!item) return 'This item was removed from the inventory.';
    const avail = item.consumable ? item.quantity : availableFor(item, r.pickupDate, r.returnDate, r.id);
    if (r.qty > avail) return `Only ${avail} ${unitLabel(item, avail)} ${item.consumable ? 'in stock' : 'free for these dates'}.`;
    return null;
  }

  function decide(id, decision, note, admin) {
    const r = requestById(id);
    if (!r) throw new Error('Request not found.');
    if (r.status !== 'pending') throw new Error('This request has already been decided.');
    const item = itemById(r.itemId);
    if (decision === 'approved') {
      const blocker = approvalBlocker(r);
      if (blocker) throw new Error(blocker);
      if (item.consumable) item.quantity -= r.qty;
    }
    r.status = decision; r.decidedAt = Date.now(); r.decidedBy = admin.id; r.adminNote = (note || '').trim();
    const name = item ? item.name : 'Your item';
    if (decision === 'approved') {
      const when = item && !item.consumable ? ` Pick up ${U.fmtDay(r.pickupDate)} from ${item.pickup}.` : ` Ready from ${U.fmtDay(r.pickupDate)}.`;
      notify(r.userId, 'approved', 'Request approved', `${name} ×${r.qty} was approved.${when}${r.adminNote ? ` Note: "${r.adminNote}"` : ''}`, '#/my-requests');
    } else {
      notify(r.userId, 'declined', 'Request declined', `${name} ×${r.qty} was declined.${r.adminNote ? ` Note: "${r.adminNote}"` : ''}`, '#/my-requests');
    }
    save();
    return r;
  }

  function markReturned(id) {
    const r = requestById(id);
    if (!r || !isActiveLoan(r)) throw new Error('This loan is not currently out.');
    r.status = 'returned'; r.returnedAt = U.today();
    const item = itemById(r.itemId);
    notify(r.userId, 'returned', 'Return confirmed', `${item ? item.name : 'Item'} ×${r.qty} was checked back in. Thanks!`, '#/my-requests');
    save();
    return r;
  }

  function saveItem(data) {
    const clean = {
      name: String(data.name || '').trim(),
      category: CATEGORIES.includes(data.category) ? data.category : 'Tools',
      consumable: !!data.consumable,
      quantity: Math.max(0, parseInt(data.quantity, 10) || 0),
      unit: String(data.unit || 'unit').trim().toLowerCase() || 'unit',
      grades: String(data.grades || 'All').trim() || 'All',
      maxLoanWeeks: data.consumable ? null : U.clamp(parseInt(data.maxLoanWeeks, 10) || 2, 1, 12),
      pickup: String(data.pickup || 'Makerspace').trim(),
      includes: String(data.includes || '').trim(),
      description: String(data.description || '').trim(),
      lowStock: data.consumable ? Math.max(0, parseInt(data.lowStock, 10) || 0) : null,
    };
    if (!clean.name) throw new Error('Give the item a name.');
    if (data.id) {
      const item = itemById(data.id);
      if (!item) throw new Error('Item not found.');
      if (!clean.consumable) {
        const committed = item.quantity - availableNow(item);
        if (clean.quantity < committed) throw new Error(`${committed} are on loan right now — quantity can't go below that.`);
      }
      if (item.unitPlural && clean.unit === item.unit) clean.unitPlural = item.unitPlural;
      Object.assign(item, clean);
      save();
      return item;
    }
    let id = clean.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
    while (itemById(id)) id += '-1';
    const item = { id, ...clean };
    state.items.push(item);
    save();
    return item;
  }

  function deleteItem(id) {
    const blocking = state.requests.some((r) => r.itemId === id && (r.status === 'pending' || isActiveLoan(r)));
    if (blocking) throw new Error('This item has pending requests or active loans. Resolve them first.');
    state.items = state.items.filter((i) => i.id !== id);
    save();
  }

  function addUser(u) { state.users.push(u); save(); return u; }
  function updateUser(id, patch) { const u = userById(id); if (!u) throw new Error('User not found.'); Object.assign(u, patch); save(); return u; }

  load();

  return {
    DEMO_PASSWORD, CATEGORIES, ACTIVITY_TYPES, SCHOOLS,
    save, reset, users, items, requests, userById, itemById, requestById, findUserByLogin, findUserByEmail,
    unitLabel, isReturnable, isActiveLoan, isOut, isOverdue, daysLate, wasLate,
    availableFor, availableNow, outNow, nextBack, isLowStock, approvalBlocker,
    notificationsFor, markNotificationRead, markAllRead, runDailyChecks,
    createRequest, cancelRequest, decide, markReturned, saveItem, deleteItem, addUser, updateUser,
  };
})();
