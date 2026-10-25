/* AURORA review notes: post-it notes pinned to parts of the dashboard mockups, shared through Firebase.
   Review scaffolding, like the review strip: not part of the design. README ("Review notes") covers the
   invite link, the facilitator link and the Firebase project; firestore.rules is the access template. */
(function () {
  'use strict';

  // Firebase web config for the aurora-dashboard-notes project. It is public by design: the Firestore rules
  // protect the notes. Without it (null), notes are kept in this browser only.
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDzlG5Faa7YkFOGf0YIzbhFw6jYkanLnEA',
    authDomain: 'aurora-dashboard-notes.firebaseapp.com',
    projectId: 'aurora-dashboard-notes',
    storageBucket: 'aurora-dashboard-notes.firebasestorage.app',
    messagingSenderId: '279283200593',
    appId: '1:279283200593:web:5b407fb0d9d4b8e65f3e70'
  };
  const SDK = 'https://www.gstatic.com/firebasejs/13.1.0/';
  const PAGE_FILES = { v2: 'AURORA%20Dashboard%20v2.dc.html', v3: 'AURORA%20Dashboard%20v3.dc.html' };
  const VIEW_NAMES = { list: 'Patients list', patient: 'Patient page', handout: 'Patient handout' };
  const KINDS = [['idea', 'Idea'], ['problem', 'Problem'], ['question', 'Question'], ['like', 'Like']];
  const ROLES = ['Clinician', 'Supervisor', 'Researcher', 'Lived experience', 'Technology team', 'Other'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DEFAULT_STATE = { view: 'list', pid: 'delgado', order: 'visit', distinct: true, big: true, icons: true, clock24: false, drivers: false };
  const VERSION = (document.currentScript && document.currentScript.dataset.version) || '';

  // localStorage can throw in private windows
  const LS = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const lsGet = (k) => { try { return LS ? LS.getItem(k) : null; } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (LS) { if (v == null) LS.removeItem(k); else LS.setItem(k, v); } } catch (e) { /* full or blocked */ } };

  // Invite link: ?board=<id>, remembered so later links work without it. Facilitators add &facilitator=1.
  const query = new URLSearchParams(location.search);
  if (query.get('board')) lsSet('aurora-notes-board', query.get('board'));
  if (query.has('facilitator')) lsSet('aurora-notes-facilitator', query.get('facilitator') === '1' ? '1' : null);
  const BOARD = lsGet('aurora-notes-board');
  const FACILITATOR = lsGet('aurora-notes-facilitator') === '1';
  const EMULATOR = query.get('emulator') === '1'; // tests against the Firebase emulator on this machine

  let page = { ...DEFAULT_STATE }; // the mockup's state, from its dc:render events
  let notes = []; // every note on the board, replies included
  let store = null;
  let status = { ok: false, text: 'Connecting…' };
  let composer = null, pendingPanel = false, pendingScroll = null, timer = 0;
  const ui = { open: lsGet('aurora-notes-open') === '1', adding: false, filter: 'page', showResolved: false, focus: null, reply: null, edit: null, me: false, error: '' };
  // The first visit from an invite link opens the panel, so reviewers find it
  if (query.get('board') && !lsGet('aurora-notes-welcomed')) { ui.open = true; lsSet('aurora-notes-open', '1'); lsSet('aurora-notes-welcomed', '1'); }

  // The mockup announces each render with its state (componentDidMount and componentDidUpdate)
  window.addEventListener('dc:render', (e) => { page = { ...DEFAULT_STATE, ...(e.detail || {}) }; schedule(); });

  /* ---------- Helpers ---------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  }
  const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const without = (el, sel) => { const c = el.cloneNode(true); c.querySelectorAll(sel).forEach((x) => x.remove()); return clean(c); };
  const short = (s, n = 48) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const byTime = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
  const msg = (e) => (e && (e.code || e.message)) || String(e);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const me = () => ({ name: lsGet('aurora-notes-name') || '', role: lsGet('aurora-notes-role') || '' });
  function ago(ms) {
    if (!ms) return 'just now';
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    const d = new Date(ms);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }
  const kindName = (k) => (KINDS.find(([v]) => v === k) || [k, k])[1];
  const pageName = (key) => { const [v, view] = key.split(':'); return `${v} · ${VIEW_NAMES[view] || view}`; };

  /* ---------- Parts of the page a note can be pinned to ---------- */
  // Innermost first. id() tells repeated parts apart (rows, tiles, goals).
  const SECTIONS = [
    { k: 'facts', sel: '.modal', label: () => 'Model Facts' },
    { k: 'row', sel: '.list > .row', id: (el) => clean(el.querySelector('.pt-name')), label: (id) => `Row: ${id}` },
    { k: 'group', sel: '.list > .grp', id: (el) => without(el, '.count, .rel'), label: (id) => `Group: ${id}` },
    { k: 'columns', sel: '.list > .lhead', label: () => 'Column headings' },
    { k: 'list', sel: '.list', label: () => 'Patients list' },
    { k: 'tile', sel: '.stats > .stat', id: (el) => clean(el.querySelector('.stat-label')).replace(/\s*\(.*$/, ''), label: (id) => `Tile: ${id}` },
    { k: 'status', sel: '.pt-status', label: () => 'Status line' },
    { k: 'title', sel: '.pt-title', label: () => 'Name and actions' },
    { k: 'visit', sel: '.pt-band .sub', label: () => 'Next-visit line' },
    { k: 'callout', sel: '.callout', label: () => 'PHQ-9 and AI estimate note' },
    { k: 'change', sel: '.pt-changes li', id: (el) => clean(el.querySelector('.change-title')), label: (id) => `What changed: ${short(id)}` },
    { k: 'changes', sel: '.pt-changes', label: () => 'What changed' },
    { k: 'drivers', sel: '.drivers', label: () => 'Sleep, activity and contact' },
    { k: 'key', sel: '.pt-trend .key', label: () => 'Chart key' },
    { k: 'chart', sel: '.pt-trend', label: () => 'Trend chart' },
    { k: 'goal', sel: '.pt-goals li', id: (el) => clean(el.querySelector('.goal-text')), label: (id) => `Goal: ${short(id)}` },
    { k: 'goals', sel: '.pt-goals', label: () => 'Goals' },
    { k: 'discussed', sel: '.check', label: () => '“Discussed” checkbox' },
    { k: 'hgoals', sel: '.handout .goals', label: () => 'Handout goals' },
    { k: 'hpara', sel: '.handout p', id: (el) => String([...document.querySelectorAll('.handout p')].indexOf(el) + 1), label: (id) => `Handout paragraph ${id}` },
    { k: 'handout', sel: '.handout', label: () => 'Patient handout' },
    { k: 'footer', sel: 'main .foot', label: () => 'Footer' },
    { k: 'band', sel: '.pt-band', label: () => 'Summary band' },
    { k: 'topbar', sel: '.topbar', label: () => 'Top bar' }
  ];
  const dcRoot = () => document.getElementById('dc-root');
  const keyOf = (s, el) => { const id = s.id ? s.id(el) : ''; return { key: s.k + (id ? ':' + id : ''), label: s.label(id) }; };
  function sectionOf(target) {
    const root = dcRoot();
    for (let el = target; el && el !== root && el !== document.body; el = el.parentElement) {
      const s = SECTIONS.find((x) => el.matches(x.sel));
      if (s) return { el, ...keyOf(s, el) };
    }
    return root ? { el: root, key: 'page', label: 'Whole page' } : null;
  }
  function findAnchor(key) {
    const root = dcRoot();
    if (!root || !key) return null;
    if (key === 'page') return root;
    const i = key.indexOf(':'), k = i < 0 ? key : key.slice(0, i), id = i < 0 ? '' : key.slice(i + 1);
    const s = SECTIONS.find((x) => x.k === k);
    if (!s) return null;
    for (const el of root.querySelectorAll(s.sel)) if (!s.id || s.id(el) === id) return el;
    return null;
  }
  // Every part on screen, in page order, for the note form's "On" menu
  function sectionsOnPage() {
    const root = dcRoot();
    if (!root) return [];
    const seen = new Set(), out = [];
    for (const s of SECTIONS) {
      for (const el of root.querySelectorAll(s.sel)) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const p = keyOf(s, el);
        if (!seen.has(p.key)) { seen.add(p.key); out.push({ el, ...p }); }
      }
    }
    return out.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  /* ---------- What is on screen ---------- */
  const pageKey = () => `${VERSION}:${page.view}`;
  const here = (n) => n.pageKey === pageKey() && (page.view === 'list' || !n.pid || n.pid === page.pid);
  function patientName() {
    if (page.view === 'list') return '';
    const parts = [...document.querySelectorAll('#dc-root .crumbs a, #dc-root .crumbs .cur')].map(clean);
    return parts[1] || '';
  }
  function contextNow() {
    return {
      version: VERSION, view: page.view, pid: page.view === 'list' ? null : page.pid, pname: patientName(), pageKey: pageKey(),
      ctx: { order: page.order, style: page.distinct ? 'distinct' : 'plain', text: page.big ? 'larger' : 'current', icons: !!page.icons, clock: page.clock24 ? 24 : 12, drivers: !!page.drivers }
    };
  }
  // After posting: a reviewer sees others' notes on a page once they have added one there. Facilitators see all.
  function model() {
    const uid = store ? store.uid : '';
    const tops = notes.filter((n) => !n.parent);
    const mine = new Set(tops.filter((n) => n.uid === uid).map((n) => n.pageKey));
    const shown = (n) => FACILITATOR || n.uid === uid || mine.has(n.pageKey);
    const visible = tops.filter(shown).sort(byTime);
    const num = new Map(), count = {};
    for (const n of visible) num.set(n.id, (count[n.pageKey] = (count[n.pageKey] || 0) + 1));
    return { uid, visible, hidden: tops.filter((n) => !shown(n)), num, replies: (id) => notes.filter((r) => r.parent === id).sort(byTime) };
  }

  /* ---------- Stores: this browser only, or shared through Firestore ---------- */
  const rand = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  function localStore(name) {
    const KEY = 'aurora-notes:' + name;
    let uid = lsGet('aurora-notes-local-uid');
    if (!uid) { uid = 'local-' + rand(); lsSet('aurora-notes-local-uid', uid); }
    const read = () => { try { return JSON.parse(lsGet(KEY) || '[]'); } catch (e) { return []; } };
    const subs = [];
    const write = (list) => { lsSet(KEY, JSON.stringify(list)); subs.forEach((cb) => cb(read())); };
    window.addEventListener('storage', (e) => { if (e.key === KEY) subs.forEach((cb) => cb(read())); });
    const now = () => Date.now();
    return {
      uid,
      subscribe(cb) { subs.push(cb); cb(read()); },
      add: async (n) => { const id = rand(); write([...read(), { ...n, id, uid, createdAt: now(), updatedAt: now() }]); return id; },
      update: async (id, patch) => write(read().map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n))),
      remove: async (id) => write(read().filter((n) => n.id !== id)),
      plus: async (id, on) => write(read().map((n) => {
        if (n.id !== id) return n;
        const p = { ...(n.plus || {}) };
        if (on) p[uid] = true; else delete p[uid];
        return { ...n, plus: p };
      }))
    };
  }
  async function sharedStore(cfg, board) {
    const [appSdk, authSdk, fs] = await Promise.all(['app', 'auth', 'firestore'].map((m) => import(`${SDK}firebase-${m}.js`)));
    const app = appSdk.initializeApp(cfg, 'aurora-notes');
    const auth = authSdk.getAuth(app);
    const db = fs.getFirestore(app);
    if (EMULATOR) {
      authSdk.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    if (auth.authStateReady) await auth.authStateReady();
    const user = auth.currentUser || (await authSdk.signInAnonymously(auth)).user;
    const col = fs.collection(db, 'boards', board, 'notes');
    const ref = (id) => fs.doc(col, id);
    const millis = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : t || 0);
    return {
      uid: user.uid,
      subscribe(cb, onError) {
        fs.onSnapshot(col, (snap) => cb(snap.docs.map((d) => {
          const x = d.data({ serverTimestamps: 'estimate' });
          return { ...x, id: d.id, createdAt: millis(x.createdAt), updatedAt: millis(x.updatedAt) };
        })), onError);
      },
      add: (n) => fs.addDoc(col, { ...n, uid: user.uid, createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() }).then((r) => r.id),
      update: (id, patch) => fs.updateDoc(ref(id), { ...patch, updatedAt: fs.serverTimestamp() }),
      remove: (id) => fs.deleteDoc(ref(id)),
      // +1s change only the plus map, as the rules require
      plus: (id, on) => fs.updateDoc(ref(id), { [`plus.${user.uid}`]: on ? true : fs.deleteField() })
    };
  }
  async function connect() {
    const cfg = EMULATOR ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-aurora', appId: '1:1:web:1' } : FIREBASE_CONFIG;
    if (cfg && BOARD && /^https?:$/.test(location.protocol)) {
      try {
        store = await sharedStore(cfg, BOARD);
        status = { ok: true, text: 'Shared with everyone who has the review link.' };
      } catch (e) {
        store = localStore('unshared');
        status = { ok: false, text: `Couldn’t reach the shared notes (${msg(e)}). New notes are saved in this browser only.` };
      }
    } else {
      store = localStore(BOARD || 'local');
      status = {
        ok: false,
        text: !cfg ? 'Saved in this browser only, until the shared store is set up.'
          : !BOARD ? 'Saved in this browser only. Open your review link to share notes.'
            : 'Saved in this browser only. Open the published site to share notes.'
      };
    }
    store.subscribe((list) => { notes = list; schedule(); }, (e) => {
      status = { ok: false, text: `Lost the connection to the shared notes (${msg(e)}).` };
      render(true);
    });
    render(true);
  }
  async function act(fn) {
    ui.error = '';
    try { await fn(); } catch (e) { ui.error = `Couldn’t save: ${msg(e)}`; }
    render(true);
  }

  /* ---------- Rendering ---------- */
  const fabCount = h('span', { class: 'an-fab-count', hidden: true });
  const fab = h('button', { type: 'button', class: 'an-fab an-ui', 'aria-controls': 'an-panel', 'aria-expanded': 'false', onclick: () => setOpen(!ui.open) }, 'Notes', fabCount);
  const panelHead = h('div', { class: 'an-head' },
    h('div', {}, h('div', { class: 'an-title' }, 'Review notes'), h('div', { class: 'an-sub' }, 'Not part of the design')),
    h('button', { type: 'button', class: 'an-x', 'aria-label': 'Close notes', onclick: () => setOpen(false) }, '×'));
  const panelBody = h('div', { class: 'an-body' });
  const panelFoot = h('div', { class: 'an-foot' });
  const panel = h('aside', { id: 'an-panel', class: 'an-panel an-ui', 'aria-label': 'Review notes', hidden: true }, panelHead, panelBody, panelFoot);
  const pins = h('div', { class: 'an-pins' });
  const hlLabel = h('span', { class: 'an-hl-label' });
  const hl = h('div', { class: 'an-hl', hidden: true, 'aria-hidden': 'true' }, hlLabel);
  const live = h('p', { class: 'an-sr', 'aria-live': 'polite' });
  const announce = (t) => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

  // A timer rather than an animation frame, which background tabs pause; React has committed by the time it fires
  function schedule() { if (!timer) timer = setTimeout(() => { timer = 0; render(false); }, 16); }
  // Renders before the store connects too, so the panel opens at once and says it is connecting
  function render(force) {
    const m = model();
    renderPins(m);
    renderPanel(m, force);
    const k = m.visible.filter((n) => here(n) && !n.resolved).length;
    fabCount.textContent = String(k);
    fabCount.hidden = !k;
    fab.setAttribute('aria-expanded', String(ui.open));
    fab.setAttribute('aria-label', `Review notes: ${plural(k, 'note')} on this page`);
    if (pendingScroll && m.visible.some((n) => n.id === pendingScroll && here(n))) {
      const p = pins.querySelector('.an-pin.on');
      if (p) { p.scrollIntoView({ block: 'center' }); pendingScroll = null; }
    }
  }
  function renderPins(m) {
    pins.replaceChildren();
    if (!ui.open) return;
    for (const n of m.visible) {
      if (!here(n) || (n.resolved && !ui.showResolved)) continue;
      const el = findAnchor(n.anchor);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      const left = r.left + window.scrollX + (n.x == null ? 0.03 : n.x) * r.width;
      const top = r.top + window.scrollY + (n.y == null ? 0.1 : n.y) * r.height;
      const k = m.num.get(n.id);
      pins.append(h('button', {
        type: 'button', class: 'an-pin' + (ui.focus === n.id ? ' on' : '') + (n.resolved ? ' resolved' : ''),
        style: `left:${left.toFixed(1)}px;top:${top.toFixed(1)}px`, 'aria-label': `Note ${k} by ${n.name}: ${n.text}`,
        onclick: () => focusNote(n.id, false)
      }, String(k)));
    }
  }
  const typing = () => { const a = document.activeElement; return panel.contains(a) && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName); };
  function renderPanel(m, force) {
    panel.hidden = !ui.open;
    if (!ui.open) return;
    // A note arriving while someone types would wipe their reply; catch up when they leave the box
    if (!force && typing()) { pendingPanel = true; return; }
    pendingPanel = false;
    const pk = pageKey();
    const onPage = ui.filter === 'page';
    const list = m.visible.filter((n) => (!onPage || n.pageKey === pk) && (ui.showResolved || !n.resolved));
    const resolvedN = m.visible.filter((n) => (!onPage || n.pageKey === pk) && n.resolved).length;
    const hidden = m.hidden.filter((n) => !onPage || n.pageKey === pk);
    const seg = (label, value) => h('button', { type: 'button', class: ui.filter === value ? 'on' : '', 'aria-pressed': String(ui.filter === value), onclick: () => { ui.filter = value; render(true); } }, label);
    const items = [];
    let lastPage = '';
    for (const n of onPage ? list : [...list].sort((a, b) => a.pageKey.localeCompare(b.pageKey) || byTime(a, b))) {
      if (!onPage && n.pageKey !== lastPage) { lastPage = n.pageKey; items.push(h('li', { class: 'an-subhead' }, pageName(n.pageKey))); }
      items.push(card(n, m));
    }
    panelBody.replaceChildren(...[
      identity(),
      h('p', { class: 'an-status' + (status.ok ? '' : ' warn') }, status.text),
      FACILITATOR ? h('p', { class: 'an-status' }, 'Facilitator view: you see every note.') : null,
      m.visible.some((n) => n.uid === m.uid) ? null : h('p', { class: 'an-intro' }, 'Click “Add a note”, then the part of the page it’s about.'
        + (FACILITATOR ? '' : ' Others’ notes on a page appear once you’ve added one there.')),
      h('div', { class: 'an-actions' },
        h('button', { type: 'button', class: 'an-btn an-add' + (ui.adding ? ' on' : ''), 'aria-pressed': String(ui.adding), disabled: !store, onclick: onAdd }, ui.adding ? 'Cancel adding' : 'Add a note'),
        h('div', { class: 'an-seg', role: 'group', 'aria-label': 'Which notes' }, seg('This page', 'page'), seg('All pages', 'all'))),
      ui.adding ? h('p', { class: 'an-hint' }, 'Click the part of the page your note is about. Escape cancels.') : null,
      ui.error ? h('p', { class: 'an-status warn', role: 'alert' }, ui.error) : null,
      hidden.length ? h('p', { class: 'an-gate' }, gateText(hidden, onPage)) : null,
      items.length ? h('ol', { class: 'an-list' }, items)
        : h('p', { class: 'an-empty' }, onPage ? 'No notes on this page yet. What do you notice, like or suggest?' : 'No notes yet.'),
      resolvedN ? h('label', { class: 'an-check' }, h('input', { type: 'checkbox', checked: ui.showResolved, onchange: (e) => { ui.showResolved = e.target.checked; render(true); } }), ` Show resolved (${resolvedN})`) : null
    ].filter(Boolean)); // replaceChildren would print null as text
    panelFoot.replaceChildren(h('button', { type: 'button', class: 'an-tool', onclick: downloadCsv }, 'Download notes (CSV)'));
  }
  function gateText(hidden, onPage) {
    if (onPage) return `${plural(hidden.length, 'note')} from others on this page will appear once you add yours.`;
    const by = {};
    hidden.forEach((n) => { by[n.pageKey] = (by[n.pageKey] || 0) + 1; });
    return 'Others’ notes on a page appear once you add one there: ' + Object.entries(by).map(([k, c]) => `${pageName(k)} (${c})`).join(', ') + '.';
  }
  function card(n, m) {
    const mine = n.uid === m.uid;
    const plusN = Object.keys(n.plus || {}).length, iPlus = !!(n.plus || {})[m.uid];
    const reps = m.replies(n.id);
    const where = [VIEW_NAMES[n.view] || n.view, n.pname, n.anchorLabel].filter(Boolean).join(' · ');
    const shownHere = here(n) && !!findAnchor(n.anchor);
    const tool = (label, onclick, extra = {}) => h('button', { type: 'button', class: 'an-tool', onclick, ...extra }, label);
    return h('li', {
      class: 'an-card' + (ui.focus === n.id ? ' on' : '') + (n.resolved ? ' resolved' : '') + (mine ? ' mine' : ''), 'data-id': n.id,
      onclick: (e) => { if (!e.target.closest('button, textarea, input, select, label, a')) { if (shownHere) focusNote(n.id, true); else goTo(n); } }
    },
    h('div', { class: 'an-meta' }, h('span', { class: 'an-num', 'aria-hidden': 'true' }, String(m.num.get(n.id))),
      h('span', { class: 'an-who' }, n.name + (n.role ? ' · ' + n.role : '')), h('span', { class: 'an-when' }, ago(n.createdAt))),
    h('div', { class: 'an-where' }, `${n.version} · ${where}`, shownHere ? null : [' · ', tool('Show', () => goTo(n), { class: 'an-tool an-inline' })]),
    n.kind ? h('div', { class: 'an-kind' }, kindName(n.kind)) : null,
    ui.edit === n.id ? editBox(n) : h('p', { class: 'an-text' }, n.text),
    n.resolved ? h('div', { class: 'an-where' }, `Resolved${n.resolvedBy ? ' by ' + n.resolvedBy : ''}`) : null,
    h('div', { class: 'an-tools' },
      tool(`+1${plusN ? ' · ' + plusN : ''}`, () => act(() => store.plus(n.id, !iPlus)), { 'aria-pressed': String(iPlus), class: 'an-tool' + (iPlus ? ' on' : ''), 'aria-label': `Plus one, ${plusN} so far` }),
      tool('Reply', () => { ui.reply = n.id; render(true); focusIn(`[data-id="${n.id}"] .an-reply textarea`); }),
      tool(n.resolved ? 'Reopen' : 'Resolve', () => act(() => store.update(n.id, { resolved: !n.resolved, resolvedBy: n.resolved ? '' : me().name || 'someone' }))),
      mine ? tool('Edit', () => { ui.edit = n.id; render(true); focusIn(`[data-id="${n.id}"] .an-edit textarea`); }) : null,
      mine && !reps.length ? tool('Delete', () => { if (confirm('Delete this note?')) act(() => store.remove(n.id)); }) : null),
    reps.length ? h('ul', { class: 'an-replies' }, reps.map((r) => h('li', {},
      h('div', { class: 'an-meta' }, h('span', { class: 'an-who' }, r.name + (r.role ? ' · ' + r.role : '')), h('span', { class: 'an-when' }, ago(r.createdAt))),
      h('p', { class: 'an-text' }, r.text),
      r.uid === m.uid ? h('div', { class: 'an-tools' }, tool('Delete', () => { if (confirm('Delete this reply?')) act(() => store.remove(r.id)); })) : null))) : null,
    ui.reply === n.id ? replyBox(n) : null);
  }
  const focusIn = (sel) => setTimeout(() => { const el = panel.querySelector(sel); if (el) el.focus(); }, 0);
  function nameFields() {
    const name = h('input', { class: 'an-input', autocomplete: 'name', 'aria-label': 'Your name', placeholder: 'Your name', maxlength: 80 });
    const role = h('select', { class: 'an-input', 'aria-label': 'Your role' }, h('option', { value: '' }, 'Role (optional)'), ROLES.map((r) => h('option', { value: r }, r)));
    return { name, role, el: h('div', { class: 'an-c-row' }, name, role) };
  }
  function saveName(f) {
    const name = f.name.value.trim().slice(0, 80);
    if (!name) return false;
    lsSet('aurora-notes-name', name);
    lsSet('aurora-notes-role', f.role.value || null);
    return true;
  }
  function replyBox(n) {
    const f = me().name ? null : nameFields();
    const ta = h('textarea', { class: 'an-input', rows: 2, maxlength: 4000, 'aria-label': 'Reply', placeholder: 'Reply…' });
    const close = () => { ui.reply = null; render(true); };
    const send = () => {
      const t = ta.value.trim();
      if (!t) return ta.focus();
      if (f && !saveName(f)) return f.name.focus();
      const who = me();
      ui.reply = null;
      act(() => store.add({
        version: n.version, view: n.view, pid: n.pid || null, pname: n.pname || '', pageKey: n.pageKey, ctx: n.ctx || {},
        anchor: n.anchor, anchorLabel: n.anchorLabel, x: null, y: null, kind: '', text: t.slice(0, 4000),
        name: who.name, role: who.role, parent: n.id, plus: {}, resolved: false, resolvedBy: ''
      }));
    };
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    return h('div', { class: 'an-reply' }, f ? f.el : null, ta,
      h('div', { class: 'an-row' }, h('button', { type: 'button', class: 'an-btn', onclick: send }, 'Reply'), h('button', { type: 'button', class: 'an-btn quiet', onclick: close }, 'Cancel')));
  }
  function editBox(n) {
    const ta = h('textarea', { class: 'an-input', rows: 3, maxlength: 4000, 'aria-label': 'Edit note' }, n.text);
    const close = () => { ui.edit = null; render(true); };
    const saveEdit = () => { const t = ta.value.trim(); if (!t) return ta.focus(); ui.edit = null; act(() => store.update(n.id, { text: t.slice(0, 4000) })); };
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(); if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    return h('div', { class: 'an-edit' }, ta,
      h('div', { class: 'an-row' }, h('button', { type: 'button', class: 'an-btn', onclick: saveEdit }, 'Save'), h('button', { type: 'button', class: 'an-btn quiet', onclick: close }, 'Cancel')));
  }
  // Who you are, at the top of the panel: the form until there is a name, then one line with Change
  function identity() {
    const who = me();
    if (who.name && !ui.me) {
      return h('div', { class: 'an-me' }, h('span', {}, 'You: ', h('strong', {}, who.name), who.role ? ` · ${who.role}` : ''),
        h('button', { type: 'button', class: 'an-tool', onclick: () => { ui.me = true; render(true); focusIn('.an-me-form input'); } }, 'Change'));
    }
    const f = nameFields();
    f.name.value = who.name;
    f.role.value = who.role;
    const err = h('p', { class: 'an-err', role: 'alert' });
    const save = () => {
      if (!saveName(f)) { err.textContent = 'Type your name first.'; f.name.focus(); return; }
      ui.me = false;
      render(true);
      announce('Name saved.');
    };
    f.name.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
    return h('div', { class: 'an-me-form' },
      h('div', { class: 'an-c-title' }, who.name ? 'Your name, shown with your notes' : 'Add your name, so others know whose notes they are'),
      f.el, err,
      h('div', { class: 'an-row' }, h('button', { type: 'button', class: 'an-btn', onclick: save }, 'Save'),
        who.name ? h('button', { type: 'button', class: 'an-btn quiet', onclick: () => { ui.me = false; render(true); } }, 'Cancel') : null));
  }

  /* ---------- Panel, adding, the note form ---------- */
  function setOpen(on) {
    ui.open = on;
    lsSet('aurora-notes-open', on ? '1' : null);
    document.body.classList.toggle('an-open', on);
    if (!on) { stopAdding(); closeComposer(); }
    render(true);
    if (on) schedule(); // pins follow the narrower page
  }
  function focusNote(id, scrollPage) {
    ui.focus = id;
    if (!ui.open) setOpen(true); else render(true);
    setTimeout(() => {
      const c = panel.querySelector(`[data-id="${id}"]`);
      if (c) c.scrollIntoView({ block: 'nearest' });
      const p = scrollPage && pins.querySelector('.an-pin.on');
      if (p) p.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  }
  // Open the page, patient and settings the note was written on
  function goTo(n) {
    const c = n.ctx || {};
    const hp = new URLSearchParams({
      view: n.view, p: n.pid || page.pid, order: c.order || page.order, icons: c.icons === false ? '0' : '1',
      style: c.style || 'distinct', text: c.text || 'larger', clock: String(c.clock || 12)
    });
    if (c.drivers) hp.set('drivers', '1');
    ui.focus = n.id;
    if (n.version !== VERSION && PAGE_FILES[n.version]) { location.href = `${PAGE_FILES[n.version]}${location.search}#${hp}&note=${n.id}`; return; }
    pendingScroll = n.id;
    location.hash = '#' + hp.toString();
    render(true);
  }
  function onAdd(e) {
    if (!store) return;
    if (ui.adding) return stopAdding();
    closeComposer();
    if (e.detail === 0) return openComposer(null, null); // from the keyboard: pick the part from the menu
    ui.adding = true;
    document.body.classList.add('an-adding');
    announce('Click the part of the page your note is about. Escape cancels.');
    render(true);
  }
  function stopAdding() {
    if (!ui.adding) return;
    ui.adding = false;
    document.body.classList.remove('an-adding');
    hl.hidden = true;
    render(true);
  }
  const ours = (t) => !!(t && t.closest && t.closest('.an-ui, .an-pins, .review'));
  // While adding, a click places the note instead of acting on the page; the review strip still works
  function intercept(e) {
    if (!ui.adding || ours(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type !== 'click') return;
    const sec = sectionOf(e.target);
    if (!sec) return;
    const r = sec.el.getBoundingClientRect();
    stopAdding();
    openComposer({ x: e.clientX, y: e.clientY }, { ...sec, x: clamp01((e.clientX - r.left) / (r.width || 1)), y: clamp01((e.clientY - r.top) / (r.height || 1)) });
  }
  function highlight(e) {
    if (!ui.adding || ours(e.target)) { hl.hidden = true; return; }
    const sec = sectionOf(e.target);
    if (!sec) return;
    const r = sec.el.getBoundingClientRect();
    Object.assign(hl.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    hlLabel.textContent = sec.label;
    hl.classList.toggle('below', r.top < 32);
    hl.hidden = false;
  }
  function closeComposer(back) {
    if (!composer) return;
    composer.remove();
    composer = null;
    if (back) { const b = panel.querySelector('.an-add'); if (b) b.focus(); }
  }
  function openComposer(at, sec) {
    const who = me(), parts = sectionsOnPage();
    const f = who.name ? null : nameFields();
    const partIn = h('select', { class: 'an-input', 'aria-label': 'Part of the page' },
      h('option', { value: 'page' }, 'Whole page'),
      parts.map((p) => h('option', { value: p.key, selected: !!sec && p.key === sec.key }, p.label)));
    if (sec && sec.key !== 'page' && !parts.some((p) => p.key === sec.key)) partIn.append(h('option', { value: sec.key, selected: true }, sec.label));
    const kinds = h('div', { class: 'an-kinds', role: 'radiogroup', 'aria-label': 'Kind of note (optional)' },
      KINDS.map(([k, l]) => h('label', { class: 'an-chip' }, h('input', { type: 'radio', name: 'an-kind', value: k }), ' ', l)));
    const text = h('textarea', { class: 'an-input an-textarea', rows: 4, maxlength: 4000, 'aria-label': 'Note', placeholder: 'What do you notice, like or suggest?' });
    const err = h('p', { class: 'an-err', role: 'alert' });
    const save = h('button', { type: 'button', class: 'an-btn' }, 'Save note');
    composer = h('div', { class: 'an-composer an-ui', role: 'dialog', 'aria-label': 'New note' },
      h('div', { class: 'an-c-title' }, 'New note'),
      f ? f.el : h('p', { class: 'an-c-as' }, `As ${who.name}${who.role ? ' · ' + who.role : ''}`),
      h('label', { class: 'an-field' }, h('span', {}, 'On'), partIn),
      kinds, text,
      h('p', { class: 'an-c-hint' }, 'Everyone with the review link can read notes. Please leave out patient information.'),
      err,
      h('div', { class: 'an-row' }, save, h('button', { type: 'button', class: 'an-btn quiet', onclick: () => closeComposer(true) }, 'Cancel')));
    save.addEventListener('click', async () => {
      if (f && !saveName(f)) { err.textContent = 'Add your name, so others know whose note it is.'; f.name.focus(); return; }
      const body = text.value.trim();
      if (!body) { err.textContent = 'Write your note first.'; text.focus(); return; }
      const key = partIn.value, same = !!sec && key === sec.key;
      const part = key === 'page' ? { label: 'Whole page' } : parts.find((p) => p.key === key) || sec || { label: key };
      const mine = me();
      save.disabled = true;
      try {
        const id = await store.add({
          ...contextNow(), anchor: key, anchorLabel: part.label, x: same ? sec.x : 0.03, y: same ? sec.y : 0.1,
          kind: (composer.querySelector('input[name="an-kind"]:checked') || {}).value || '', text: body.slice(0, 4000),
          name: mine.name, role: mine.role, parent: null, plus: {}, resolved: false, resolvedBy: ''
        });
        closeComposer();
        ui.focus = id;
        if (!ui.open) setOpen(true); else render(true);
        announce('Note saved.');
      } catch (e2) {
        save.disabled = false;
        err.textContent = `Couldn’t save: ${msg(e2)}`;
      }
    });
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save.click(); });
    document.body.append(composer);
    const w = composer.offsetWidth, ht = composer.offsetHeight;
    const right = innerWidth - (ui.open ? panel.offsetWidth : 0) - w - 16; // keep clear of the panel
    const x = at ? at.x + 14 : right;
    const y = at ? at.y + 14 : 88;
    composer.style.left = `${Math.max(16, Math.min(x, right))}px`;
    composer.style.top = `${Math.max(16, Math.min(y, innerHeight - ht - 16))}px`;
    (f ? f.name : text).focus();
  }

  /* ---------- CSV ---------- */
  function downloadCsv() {
    const m = model();
    const cell = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = "'" + s; // keep spreadsheets from running it as a formula
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const iso = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) : '');
    const head = ['id', 'created_utc', 'name', 'role', 'kind', 'text', 'reply_to', 'plus_ones', 'resolved', 'resolved_by', 'version', 'page', 'patient', 'part', 'x', 'y', 'order', 'style', 'text_size', 'icons', 'clock', 'drivers_open'];
    const rows = [...m.visible, ...m.visible.flatMap((n) => m.replies(n.id))].sort(byTime).map((n) => {
      const c = n.ctx || {};
      return [n.id, iso(n.createdAt), n.name, n.role, n.kind, n.text, n.parent || '', Object.keys(n.plus || {}).length, n.resolved ? 'yes' : '', n.resolvedBy || '',
        n.version, VIEW_NAMES[n.view] || n.view, n.pname || n.pid || '', n.anchorLabel, n.x == null ? '' : n.x.toFixed(3), n.y == null ? '' : n.y.toFixed(3),
        c.order, c.style, c.text, c.icons, c.clock, c.drivers];
    });
    const csv = [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
    const d = new Date(), pad = (v) => String(v).padStart(2, '0');
    const a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `AURORA review notes ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
  }

  /* ---------- Styles: review scaffolding, in the review strip's colours ---------- */
  const CSS = `
.an-fab{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:8px;padding:10px 16px;font:600 15px/20px var(--font,system-ui,sans-serif);color:#4A3B12;background:repeating-linear-gradient(45deg,#F3EFE6,#F3EFE6 12px,#EFEAE0 12px,#EFEAE0 24px);border:1px dashed #A8986F;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.16);cursor:pointer}
.an-fab:focus-visible,.an-panel button:focus-visible,.an-composer button:focus-visible,.an-pin:focus-visible{outline:2px solid #0072B2;outline-offset:2px}
.an-fab-count{min-width:24px;padding:0 6px;border-radius:999px;background:#FFD54A;color:#4A3B12;text-align:center}
.an-fab-count[hidden],.an-panel[hidden],.an-hl[hidden]{display:none}
.an-open .an-fab{display:none}
@media screen and (min-width:1100px){body.an-open{padding-right:23rem}}
.an-panel{position:fixed;top:0;right:0;bottom:0;z-index:60;display:flex;flex-direction:column;width:min(23rem,100vw);background:#FBF8F1;border-left:1px dashed #A8986F;box-shadow:-8px 0 24px rgba(0,0,0,.10);font:400 15px/21px var(--font,system-ui,sans-serif);color:#1F2A33}
.an-head{display:flex;align-items:flex-start;gap:8px;padding:12px 16px;background:repeating-linear-gradient(45deg,#F3EFE6,#F3EFE6 12px,#EFEAE0 12px,#EFEAE0 24px);border-bottom:1px dashed #A8986F}
.an-title{font-size:17px;line-height:24px;font-weight:600}
.an-sub{color:#7A6A45}
.an-x{margin-left:auto;width:32px;height:32px;font:400 24px/1 var(--font,system-ui,sans-serif);color:#4A3B12;background:transparent;border:0;border-radius:6px;cursor:pointer}
.an-x:hover{background:rgba(0,0,0,.06)}
.an-body{flex:1;overflow:auto;padding:12px 16px}
.an-foot{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:10px 16px 12px;border-top:1px dashed #C9BFA8}
.an-status{margin:0 0 10px;color:#4C6272}
.an-status.warn{color:#9C4400}
.an-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:8px}
.an-btn{font:600 15px/20px var(--font,system-ui,sans-serif);padding:7px 14px;color:#fff;background:#6B5A2E;border:0;border-radius:6px;cursor:pointer}
.an-btn:hover{background:#574820}
.an-btn.quiet{color:#4A3B12;background:transparent}
.an-btn.quiet:hover{background:rgba(0,0,0,.06)}
.an-btn.on{background:#9C4400}
.an-btn:disabled{opacity:.6;cursor:default}
.an-seg{display:inline-flex;border:1px solid #C9BFA8;border-radius:6px;overflow:hidden;background:#fff}
.an-seg button{font:600 15px/20px var(--font,system-ui,sans-serif);padding:6px 10px;color:#5B6B78;background:transparent;border:0;border-right:1px solid #E3E7EA;cursor:pointer}
.an-seg button:last-child{border-right:0}
.an-seg button.on{color:#1F2A33;background:#EDE5D2}
.an-intro{margin:0 0 10px;color:#1F2A33}
.an-hint{margin:0 0 10px;padding:8px 10px;color:#4A3B12;background:#FFF1B8;border-radius:6px}
.an-gate{margin:0 0 10px;padding:8px 10px;color:#4A3B12;background:#F1EBDD;border-radius:6px}
.an-empty{color:#5B6B78}
.an-list{list-style:none;margin:0;padding:0}
.an-subhead{margin:14px 0 4px;font-weight:600;color:#7A6A45}
.an-card{margin:0 0 10px;padding:10px 12px;background:#FFF8D6;border:1px solid #E8D896;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.06);cursor:pointer}
.an-card.on{border-color:#B8860B;box-shadow:0 0 0 2px #E7C35A}
.an-card.resolved{background:#F4F1E8}
.an-meta{display:flex;align-items:baseline;gap:8px;color:#5B6B78}
.an-num{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 4px;border-radius:4px;background:#FFD54A;color:#4A3B12;font-weight:600}
.an-who{font-weight:600;color:#1F2A33}
.an-when{margin-left:auto;white-space:nowrap}
.an-where{margin-top:2px;color:#5B6B78}
.an-kind{margin-top:4px;font-weight:600;color:#7A6A45}
.an-text{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
.an-tools{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px}
.an-tool{font:400 15px/21px var(--font,system-ui,sans-serif);padding:2px 0;color:#0072B2;background:transparent;border:0;cursor:pointer}
.an-tool:hover{text-decoration:underline}
.an-tool.on{font-weight:600}
.an-inline{padding:0}
.an-replies{list-style:none;margin:8px 0 0;padding:0 0 0 12px;border-left:2px solid #E8D896}
.an-replies li{margin-top:6px}
.an-reply,.an-edit{margin-top:8px}
.an-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:6px}
.an-me{display:flex;align-items:baseline;gap:10px;margin:0 0 10px;color:#4C6272}
.an-me strong{color:#1F2A33;font-weight:600}
.an-me-form{margin:0 0 12px;padding:10px 12px;background:#FFF1B8;border-radius:6px}
.an-me-form .an-c-row{margin-bottom:0}
.an-check{display:flex;align-items:center;gap:6px;color:#4C6272}
.an-input{box-sizing:border-box;width:100%;font:400 15px/21px var(--font,system-ui,sans-serif);color:#1F2A33;padding:6px 8px;background:#fff;border:1px solid #C9BFA8;border-radius:6px}
.an-input:focus{outline:2px solid #0072B2;outline-offset:0}
.an-textarea{resize:vertical}
.an-c-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.an-composer{position:fixed;z-index:70;box-sizing:border-box;width:min(23rem,calc(100vw - 32px));padding:12px 14px;background:#FFF8D6;border:1px solid #E0CC7A;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.22);font:400 15px/21px var(--font,system-ui,sans-serif);color:#1F2A33}
.an-c-title{margin-bottom:6px;font-weight:600}
.an-c-as{margin:0 0 8px;color:#5B6B78}
.an-field{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;margin-bottom:8px}
.an-kinds{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
.an-chip{position:relative;display:inline-flex;align-items:center;gap:4px;padding:2px 10px;background:#fff;border:1px solid #C9BFA8;border-radius:999px;cursor:pointer}
.an-chip input{position:absolute;width:1px;height:1px;margin:0;opacity:0}
.an-chip:has(input:checked){background:#FFE38A;border-color:#B8860B;font-weight:600}
.an-chip:has(input:focus-visible){outline:2px solid #0072B2;outline-offset:2px}
.an-c-hint{margin:6px 0 0;color:#5B6B78}
.an-err{margin:6px 0 0;color:#9C4400}
.an-err:empty{display:none}
.an-pins{position:absolute;top:0;left:0;width:100%;height:0;z-index:55}
.an-pin{position:absolute;transform:translate(-50%,-50%) rotate(-3deg);display:grid;place-items:center;min-width:28px;height:28px;padding:0 4px;font:700 15px/1 var(--font,system-ui,sans-serif);color:#4A3B12;background:#FFD54A;border:1px solid #C9A227;border-radius:3px 3px 3px 10px;box-shadow:0 3px 8px rgba(0,0,0,.25);cursor:pointer}
.an-pin:hover,.an-pin.on{background:#FFC107;box-shadow:0 0 0 3px rgba(184,134,11,.45),0 3px 8px rgba(0,0,0,.25)}
.an-pin.resolved{opacity:.55}
.an-hl{position:fixed;z-index:58;box-sizing:border-box;pointer-events:none;border:2px dashed #B8860B;border-radius:6px;background:rgba(255,213,74,.14)}
.an-hl-label{position:absolute;left:-2px;bottom:100%;margin-bottom:4px;padding:2px 8px;font:600 15px/21px var(--font,system-ui,sans-serif);color:#fff;background:#4A3B12;border-radius:4px;white-space:nowrap}
.an-hl.below .an-hl-label{top:100%;bottom:auto;margin:4px 0 0}
.an-adding #dc-root,.an-adding #dc-root *{cursor:crosshair!important}
.an-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media print{.an-fab,.an-panel,.an-pins,.an-composer,.an-hl,.an-sr{display:none!important}body.an-open{padding-right:0!important}}
`;

  /* ---------- Start ---------- */
  function init() {
    document.head.append(h('style', { id: 'an-style' }, CSS));
    document.body.append(pins, hl, fab, panel, live);
    const hq = new URLSearchParams(location.hash.slice(1));
    if (hq.get('note')) { ui.focus = hq.get('note'); ui.open = true; pendingScroll = ui.focus; }
    document.body.classList.toggle('an-open', ui.open);
    ['pointerdown', 'mousedown', 'mouseup', 'pointerup', 'click', 'dblclick', 'mouseover', 'mouseout'].forEach((t) => window.addEventListener(t, intercept, true));
    window.addEventListener('mousemove', highlight, true);
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (composer) { e.stopPropagation(); closeComposer(true); } else if (ui.adding) { e.stopPropagation(); stopAdding(); }
    }, true);
    panel.addEventListener('focusout', () => setTimeout(() => { if (pendingPanel && !typing()) render(true); }, 150));
    window.addEventListener('resize', schedule);
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    setInterval(() => { if (ui.open) schedule(); }, 30000); // "5 min ago" stays current
    render(true);
    connect();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
