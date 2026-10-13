/* Small, dependency-free helpers shared by every module. */
window.U = (() => {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_MS = 86400000;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  // Dates are stored as local "YYYY-MM-DD" strings; timestamps as epoch ms.
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY_MS); // a − b
  const isoFromTs = (ts) => iso(new Date(ts));

  const fmtDate = (s) => { if (!s) return '—'; const d = parse(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; };
  const fmtDateY = (s) => { if (!s) return '—'; const d = parse(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  const fmtDay = (s) => `${DAYS[parse(s).getDay()]}, ${fmtDate(s)}`;
  const weekday = (s) => DAYS[parse(s).getDay()];
  const fmtRange = (a, b) => (b && b !== a ? `${fmtDate(a)} – ${fmtDate(b)}` : fmtDate(a));
  const fmtTime = (ts) => { const d = new Date(ts); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${pad(d.getMinutes())} ${ap}`; };
  const fmtDateTime = (ts) => `${fmtDate(isoFromTs(ts))}, ${fmtTime(ts)}`;
  const fmtLongToday = () => { const d = new Date(); return `${DAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}`; };

  function timeAgo(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    const days = diffDays(today(), isoFromTs(ts));
    if (days <= 0) return `${Math.floor(s / 3600)} h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return fmtDate(isoFromTs(ts));
  }

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const firstName = (name) => String(name || '').split(/\s+/)[0];
  const plural = (n, word, pluralWord) => `${n} ${n === 1 ? word : (pluralWord || `${word}s`)}`;
  const sum = (arr, fn = (x) => x) => arr.reduce((a, x) => a + fn(x), 0);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const shortSchool = (s) => String(s || '').replace(/\s+School$/i, '');

  // Deterministic PRNG (mulberry32) so seeded demo data is stable.
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // cyrb53 — a fast non-cryptographic hash. This is a front-end-only demo,
  // so passwords are hashed (never stored in plain text) but this is not real security.
  function hash(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const hashPassword = (password, loginId) => hash(`sml:${String(loginId).toUpperCase()}:${password}`, 7);

  function parseQuery(q) {
    const out = {};
    new URLSearchParams(q || '').forEach((v, k) => { out[k] = v; });
    return out;
  }

  function downloadFile(filename, content, type = 'text/csv') {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

  return {
    MONTHS, DAY_MS, esc, iso, today, parse, addDays, diffDays, isoFromTs,
    fmtDate, fmtDateY, fmtDay, weekday, fmtRange, fmtTime, fmtDateTime, fmtLongToday, timeAgo,
    greeting, initials, firstName, plural, sum, clamp, uid, shortSchool, rng, hash, hashPassword,
    parseQuery, downloadFile, toCSV,
  };
})();
