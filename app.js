import { store } from './store.js';
import { auth, authReady, signInWithGoogle, signOutUser } from './firebase-config.js';
import { features } from './features/index.js';
import { habits } from './features/habits.js';
import { runWalk } from './features/run-walk.js';

const $ = s => document.querySelector(s), app = $('#appMain');
let activeFeature = null, editingId = null;

const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const date = () => { const d = new Date(); const pad = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN',{maximumFractionDigits:2});
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

// Data management via Store
async function dataFor(f) {
  return await store.loadEntries(f.id);
}

function toast(message) {
  const e = $('#toast');
  if (!e) return;
  e.textContent = message;
  e.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => e.classList.remove('show'), 2500);
}

async function saveEntries(f, entries) {
  return await store.saveEntries(f.id, entries);
}

// Render Dashboard (Home)
async function renderHome() {
  activeFeature = null;
  const runs = await dataFor(runWalk);
  const todayKm = runs.filter(x => x.date === date()).reduce((n, x) => n + Number(x.km || 0), 0);
  const progressPercent = Math.min(100, Math.round((todayKm / 5) * 100));

  app.innerHTML = `
    <section>
      <div class="hero-card">
        <div>
          <span>ಇಂದಿನ ಪ್ರಗತಿ</span>
          <strong>${progressPercent}%</strong>
          <small>${todayKm.toFixed(1)} / 5 KM</small>
        </div>
        <div class="ring" style="--p:${progressPercent}%">
          <b>${todayKm.toFixed(1)}</b>
          <small>KM</small>
        </div>
      </div>

      <div class="section-head">
        <h2>Quick Actions</h2>
        <small>☁ Firebase sync active</small>
      </div>

      <div class="quick-grid">
        ${features.map(f => `
          <button class="quick-button" data-open="${f.id}">
            <i>${f.icon}</i>
            <span>${f.label}</span>
          </button>
        `).join('')}
      </div>

      <div class="sync-card">
        <b>☁ Firebase Sync</b>
        <p>ನಿಮ್ಮ ಎಲ್ಲಾ ಎಂಟ್ರಿಗಳು ಕಂಪ್ಯೂಟರ್ ಮತ್ತು ಮೊಬೈಲ್ ನಡುವೆ ಲೈವ್ ಆಗಿ ಸಿಂಕ್ ಆಗುತ್ತವೆ.</p>
      </div>
    </section>
  `;
}

// Render Module View
async function renderFeature(f) {
  activeFeature = f;
  const entries = await dataFor(f);
  const body = f.render ? f.render(entries, { money, date, esc }) : defaultList(entries, f);

  app.innerHTML = `
    <section class="feature-view">
      <header class="page-title">
        <div>
          <span>${f.group}</span>
          <h2>${f.icon} ${f.label}</h2>
        </div>
        <button class="add" data-add>＋</button>
      </header>
      ${body}
      <button class="back-wide" data-home>← Dashboard ಗೆ ಹಿಂತಿರುಗಿ</button>
    </section>
  `;
}

function defaultList(entries, f) {
  return entries.length ? entries.slice().reverse().map(x => `
    <article class="entry-card">
      <div>
        <b>${esc(x.title || x.name || x.text || f.label)}</b>
        <small>${esc(x.date || x.createdAt?.slice(0, 10) || '')}</small>
        ${x.amount !== undefined ? `<strong>${money(x.amount)}</strong>` : ''}
        ${x.text ? `<p>${esc(x.text)}</p>` : ''}
      </div>
      <div class="entry-actions">
        <button data-edit="${x.id}">✎</button>
        <button data-delete="${x.id}">🗑</button>
      </div>
    </article>
  `).join('') : '<div class="empty">ಇನ್ನೂ ಯಾವುದೇ ಎಂಟ್ರಿ ಇಲ್ಲ.</div>';
}

function showForm(f, item = null) {
  editingId = item?.id || null;
  $('#modalTitle').textContent = `${item ? 'ತಿದ್ದು' : 'ಸೇರಿಸಿ'} · ${f.label}`;
  $('#entryForm').innerHTML = f.fields.map(x => `
    <label>
      ${x.label}
      ${x.type === 'textarea'
        ? `<textarea ${x.required === false ? '' : 'required'} name="${x.key}" placeholder="${x.placeholder || ''}">${esc(item?.[x.key] ?? '')}</textarea>`
        : `<input ${x.required === false ? '' : 'required'} name="${x.key}" type="${x.type || 'text'}" value="${esc(item?.[x.key] ?? x.value ?? '')}" placeholder="${x.placeholder || ''}" ${x.step ? `step="${x.step}"` : ''}>`}
    </label>
  `).join('') + `<button class="primary" type="submit">${f.id === 'quick-notes' ? 'Done' : 'Save'}</button>`;
  $('#entryModal').classList.add('open');
}

function closeForm() {
  $('#entryModal').classList.remove('open');
}

async function handleSave(form) {
  const values = Object.fromEntries(new FormData(form));
  const entries = await dataFor(activeFeature);
  const entry = {
    ...values,
    id: editingId || uid(),
    date: values.date || date(),
    createdAt: new Date().toISOString()
  };

  let updatedEntries;
  if (activeFeature?.id === 'run-walk') {
    // Run/Walk allows exactly one entry per calendar day.
    const sameDay = entries.find(x => x.date === entry.date && x.id !== editingId);
    if (sameDay) {
      updatedEntries = entries.map(x => x.id === sameDay.id ? { ...x, ...entry, id: sameDay.id } : x);
    } else if (editingId) {
      updatedEntries = entries.map(x => x.id === editingId ? { ...x, ...entry } : x);
    } else {
      updatedEntries = [entry, ...entries];
    }
  } else {
    updatedEntries = editingId ? entries.map(x => x.id === editingId ? { ...x, ...entry } : x) : [entry, ...entries];
  }
  const result = await saveEntries(activeFeature, updatedEntries);
  closeForm();
  await renderFeature(activeFeature);
  toast(result?.ok ? 'Firebase sync ಆಯಿತು' : 'Local save ಆಯಿತು; Firebase sync ವಿಫಲವಾಗಿದೆ');
}

// Global Click Handlers
document.addEventListener('click', async e => {
  const open = e.target.closest('[data-open]');
  if (open) {
    const target = features.find(f => f.id === open.dataset.open);
    if (target) renderFeature(target);
    return;
  }

  if (e.target.closest('[data-home]')) return renderHome();
  if (e.target.closest('[data-add]')) return showForm(activeFeature);
  if (e.target.closest('[data-close]')) return closeForm();

  // Habit Direct Tap Toggle (Green/Red Toggle logic)
  const habitBtn = e.target.closest('.habit-day-btn');
  if (habitBtn) {
    const title = habitBtn.dataset.title;
    const targetDate = habitBtn.dataset.date;
    const currentStatus = habitBtn.dataset.status;

    let nextStatus = 'done';
    if (currentStatus === 'done') nextStatus = 'missed';
    else if (currentStatus === 'missed') nextStatus = 'none';

    let entries = await store.loadEntries('habits');
    
    // Remove existing entry for same habit and date
    entries = entries.filter(item => !(item.title === title && item.date === targetDate));

    if (nextStatus !== 'none') {
      entries.unshift({
        id: 'habit_' + Date.now(),
        title: title,
        date: targetDate,
        status: nextStatus,
        createdAt: new Date().toISOString()
      });
    }

    await store.saveEntries('habits', entries);
    await renderFeature(habits);
    return;
  }

  // Edit / Delete Logic
  const edit = e.target.closest('[data-edit]');
  if (edit) {
    const entries = await dataFor(activeFeature);
    return showForm(activeFeature, entries.find(x => x.id === edit.dataset.edit));
  }

  const del = e.target.closest('[data-delete]');
  if (del && confirm('ಈ ಎಂಟ್ರಿ ಅಳಿಸಬೇಕೇ?')) {
    const entries = await dataFor(activeFeature);
    const updated = entries.filter(x => x.id !== del.dataset.delete);
    await saveEntries(activeFeature, updated);
    renderFeature(activeFeature);
  }
});

// Form Handlers
$('#entryForm').addEventListener('submit', e => {
  e.preventDefault();
  handleSave(e.currentTarget);
});

// Quick Note: save a draft while the user types, then update the same note.
$('#entryForm').addEventListener('input', e => {
  if (activeFeature?.id !== 'quick-notes' || e.target.name !== 'text') return;
  clearTimeout(window.noteAutosaveTimer);
  window.noteAutosaveTimer = setTimeout(async () => {
    const text = e.target.value.trim();
    if (!text) return;
    const entries = await dataFor(activeFeature);
    if (!editingId) editingId = uid();
    const draft = { id: editingId, text, date: date(), createdAt: new Date().toISOString() };
    await saveEntries(activeFeature, entries.some(entry => entry.id === editingId) ? entries.map(entry => entry.id === editingId ? { ...entry, ...draft } : entry) : [draft, ...entries]);
    toast('Note auto-saved');
  }, 500);
});

// Theme Setup
const themeBtn = $('#themeToggle');
if (themeBtn) {
  themeBtn.onclick = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('life-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  };
}
if (localStorage.getItem('life-theme') === 'dark') {
  document.body.classList.add('dark');
}

// Authentication gate: the app stays hidden until Google login succeeds.
async function launchAfterLogin() {
  const user = await authReady;
  if (!user) {
    app.innerHTML = `<section class="login-screen"><h2>My Life Dashboard</h2><p>ನಿಮ್ಮ dashboard ತೆರೆಯಲು Google account ಮೂಲಕ login ಮಾಡಿ.</p><button id="googleLogin" class="primary">Continue with Google</button><small id="loginError"></small></section>`;
    $('#googleLogin').addEventListener('click', async () => {
      const button = $('#googleLogin');
      const error = $('#loginError');
      button.disabled = true; button.textContent = 'Signing in…'; error.textContent = '';
      try { await signInWithGoogle(); }
      catch (e) { error.textContent = 'Login failed. Please try again.'; button.disabled = false; button.textContent = 'Continue with Google'; console.error(e); }
    });
    return;
  }
  renderHome();
}

if (auth) {
  auth.onAuthStateChanged(user => {
    if (user) renderHome();
    else launchAfterLogin();
  });
} else {
  launchAfterLogin();
}
