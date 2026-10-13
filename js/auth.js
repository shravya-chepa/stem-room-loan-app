/*
 * Authentication backed by browser storage.
 * The session token lives in localStorage ("keep me logged in") or
 * sessionStorage (cleared when the browser closes).
 */
window.Auth = (() => {
  const KEY = 'sml_session';
  const REMEMBER_DAYS = 30;
  const ID_FORMATS = { teacher: /^T-\d{6}$/, admin: /^A-\d{6}$/ };

  function readSession() {
    for (const store of [localStorage, sessionStorage]) {
      try {
        const raw = store.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function current() {
    const s = readSession();
    if (!s) return null;
    if (s.expiresAt && s.expiresAt < Date.now()) { logout(); return null; }
    return DB.userById(s.userId);
  }

  function startSession(user, remember) {
    logout();
    const session = { userId: user.id, role: user.role, startedAt: Date.now(), expiresAt: remember ? Date.now() + REMEMBER_DAYS * U.DAY_MS : null };
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
  }

  function logout() {
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  const normalizeId = (id) => String(id || '').trim().toUpperCase();
  const passwordProblem = (pw) => {
    if (!pw || pw.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) return 'Use letters, numbers and a symbol.';
    return null;
  };
  const idProblem = (role, id) => (ID_FORMATS[role].test(id) ? null : `Use the format ${role === 'teacher' ? 'T-204518' : 'A-100234'}.`);
  const emailProblem = (email) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Enter a valid email address.');

  function login(role, loginId, password, remember) {
    const id = normalizeId(loginId);
    if (!id || !password) throw new Error(`Enter your ${role === 'teacher' ? 'Teacher' : 'Admin'} ID and password.`);
    const user = DB.findUserByLogin(id);
    if (!user || user.passwordHash !== U.hashPassword(password, user.loginId)) throw new Error('That ID and password don’t match our records.');
    if (user.role !== role) throw new Error(`That is ${user.role === 'admin' ? 'an Admin' : 'a Teacher'} ID — switch to the ${user.role === 'admin' ? 'Admin' : 'Teacher'} tab.`);
    startSession(user, remember);
    return user;
  }

  // Returns { user } or { errors: { field: message } }.
  function signup(data) {
    const role = data.role === 'admin' ? 'admin' : 'teacher';
    const loginId = normalizeId(data.loginId);
    const errors = {};
    if (!data.name.trim()) errors.name = 'Enter your full name.';
    if (!data.school.trim()) errors.school = 'Enter your school.';
    if (!data.location.trim()) errors.location = 'Enter your city or district.';
    errors.email = emailProblem(data.email.trim());
    if (!errors.email && DB.findUserByEmail(data.email)) errors.email = 'An account already uses this email.';
    errors.loginId = idProblem(role, loginId);
    if (!errors.loginId && DB.findUserByLogin(loginId)) errors.loginId = 'An account already uses this ID. Try logging in.';
    errors.password = passwordProblem(data.password);
    if (!data.agree) errors.agree = 'Please agree to the loan policy to continue.';
    Object.keys(errors).forEach((k) => { if (!errors[k]) delete errors[k]; });
    if (Object.keys(errors).length) return { errors };

    const user = DB.addUser({
      id: U.uid('u'), role, name: data.name.trim(), school: data.school.trim(), location: data.location.trim(),
      email: data.email.trim().toLowerCase(), loginId, passwordHash: U.hashPassword(data.password, loginId), createdAt: Date.now(),
    });
    startSession(user, true);
    return { user };
  }

  function resetPassword(loginId, email, newPassword) {
    const user = DB.findUserByLogin(normalizeId(loginId));
    if (!user || user.email.toLowerCase() !== String(email).trim().toLowerCase()) throw new Error('We couldn’t find an account with that ID and email.');
    const problem = passwordProblem(newPassword);
    if (problem) throw new Error(problem);
    DB.updateUser(user.id, { passwordHash: U.hashPassword(newPassword, user.loginId) });
    return user;
  }

  function changePassword(user, currentPw, nextPw) {
    if (user.passwordHash !== U.hashPassword(currentPw, user.loginId)) throw new Error('Your current password is incorrect.');
    const problem = passwordProblem(nextPw);
    if (problem) throw new Error(problem);
    DB.updateUser(user.id, { passwordHash: U.hashPassword(nextPw, user.loginId) });
  }

  return { current, login, logout, signup, resetPassword, changePassword, passwordProblem, emailProblem };
})();
