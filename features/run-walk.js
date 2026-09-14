/* Run / Walk feature module */
const STORAGE_KEY = 'inflow2036.runWalk.entries';

function readEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function dateKey(date = new Date()) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function addRun(km, date = new Date(), mode = 'Run') {
  const distance = Number(km);
  if (!Number.isFinite(distance) || distance <= 0) return readEntries();

  const entries = readEntries();
  entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    mode,
    km: Math.round(distance * 100) / 100,
    date: dateKey(date),
    createdAt: new Date().toISOString()
  });
  writeEntries(entries);
  return entries;
}

function removeRun(id) {
  const entries = readEntries().filter(entry => entry.id !== id);
  writeEntries(entries);
  return entries;
}

function totalBetween(start, end) {
  return readEntries()
    .filter(entry => entry.date >= start && entry.date <= end)
    .reduce((sum, entry) => sum + entry.km, 0);
}

function averageDailyBetween(daysCount) {
  const entries = readEntries();
  if (!entries.length) return 0;
  
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - (daysCount - 1));
  
  const startStr = dateKey(pastDate);
  const endStr = dateKey(today);
  
  const total = totalBetween(startStr, endStr);
  return Math.round((total / daysCount) * 100) / 100;
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

function report() {
  const today = dateKey();
  const yesterday = offsetDate(-1);
  const dayBeforeYesterday = offsetDate(-2);
  const weekStart = offsetDate(-6);
  
  const now = new Date();
  const dayOfYear = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
  const dayOfMonth = now.getDate();

  return {
    today: totalBetween(today, today),
    yesterday: totalBetween(yesterday, yesterday),
    dayBeforeYesterday: totalBetween(dayBeforeYesterday, dayBeforeYesterday),
    oneWeekTotal: totalBetween(weekStart, today),
    weeklyAverage: averageDailyBetween(7),
    monthlyAverage: averageDailyBetween(dayOfMonth),
    yearlyAverage: averageDailyBetween(dayOfYear),
    entries: readEntries().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };
}

// UI Render Component Function
function renderRunWalkUI(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const data = report();

  container.innerHTML = `
    <div style="background: var(--bg-card, #1e1e2e); color: var(--text, #fff); padding: 16px; border-radius: 12px; font-family: sans-serif;">
      
      <!-- Top Action Bar (Run +, Run - Toggle & Add) -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <input type="number" id="runDistanceInput" placeholder="Distance (km)" step="0.1" 
               style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #444; background: #2b2b3d; color: #fff;">
        <button id="addRunBtn" style="background: #10b981; color: white; border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-weight: bold;">+ Run</button>
      </div>

      <!-- Reports Section -->
      <h4 style="margin: 0 0 12px 0; border-bottom: 1px solid #333; padding-bottom: 6px;">Running Report</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 14px;">
        <div style="background: #2b2b3d; padding: 8px 12px; border-radius: 6px;">
          <span style="color: #aaa;">Yesterday:</span> <strong>${data.yesterday} km</strong>
        </div>
        <div style="background: #2b2b3d; padding: 8px 12px; border-radius: 6px;">
          <span style="color: #aaa;">Day Before Y'day:</span> <strong>${data.dayBeforeYesterday} km</strong>
        </div>
        <div style="background: #2b2b3d; padding: 8px 12px; border-radius: 6px; grid-column: span 2;">
          <span style="color: #aaa;">1 Week Total:</span> <strong>${data.oneWeekTotal} km</strong>
        </div>
      </div>

      <!-- Averages Section -->
      <h4 style="margin: 0 0 12px 0; border-bottom: 1px solid #333; padding-bottom: 6px;">Averages</h4>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; margin-bottom: 16px;">
        <div style="display: justify; justify-content: space-between; background: #252535; padding: 8px 12px; border-radius: 6px;">
          <span>Weekly Avg:</span> <strong>${data.weeklyAverage} km/day</strong>
        </div>
        <div style="display: flex; justify-content: space-between; background: #252535; padding: 8px 12px; border-radius: 6px;">
          <span>Monthly Avg:</span> <strong>${data.monthlyAverage} km/day</strong>
        </div>
        <div style="display: flex; justify-content: space-between; background: #252535; padding: 8px 12px; border-radius: 6px;">
          <span>Yearly Avg:</span> <strong>${data.yearlyAverage} km/day</strong>
        </div>
      </div>

      <!-- Recent Entries List with Remove (Run -) feature -->
      <h4 style="margin: 0 0 8px 0;">History</h4>
      <div style="max-height: 150px; overflow-y: auto;">
        ${data.entries.length === 0 ? '<p style="color: #888; font-size: 13px;">No entries yet.</p>' : ''}
        ${data.entries.map(entry => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #2a2a3a; font-size: 13px;">
            <span>${entry.date} - <strong>${entry.km} km</strong></span>
            <button onclick="window.runWalkFeature.deleteAndRefresh('${entry.id}', '${containerId}')" 
                    style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">- Delete</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('addRunBtn').onclick = () => {
    const val = document.getElementById('runDistanceInput').value;
    if (val) {
      addRun(val);
      renderRunWalkUI(containerId);
    }
  };
}

function deleteAndRefresh(id, containerId) {
  removeRun(id);
  renderRunWalkUI(containerId);
}

export const runWalkFeature = {
  name: 'Run / Walk',
  addRun,
  removeRun,
  report,
  getEntries: readEntries,
  renderRunWalkUI,
  deleteAndRefresh
};

if (typeof window !== 'undefined') {
  window.runWalkFeature = runWalkFeature;
}