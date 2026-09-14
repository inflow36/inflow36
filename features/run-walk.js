/* Run / Walk Feature Module
 * Supports adding runs (+), subtracting/deleting runs (-),
 * and displaying complete reports (Yesterday, Day Before, 1-Week, Averages).
 */

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

// 1. Run Plus (+) - ಹೊಸ ರನ್ನಿಂಗ್ KM ಸೇರಿಸಲು
function addRun(km, date = new Date(), mode = 'Run') {
  const distance = Number(km);
  if (!Number.isFinite(distance) || distance <= 0) return readEntries();

  const entries = readEntries();
  entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    mode,
    km: Math.round(distance * 100) / 100,
    date: dateKey(date),
    createdAt: new Date().toISOString()
  });
  writeEntries(entries);
  return entries;
}

// 2. Run Minus (-) - ನಿರ್ದಿಷ್ಟ KM ಅಥವಾ ಎಂಟ್ರಿಯನ್ನು ಮೈನಸ್ / ತೆಗೆದುಹಾಕಲು
function removeRun(id) {
  const entries = readEntries().filter(entry => entry.id !== id);
  writeEntries(entries);
  return entries;
}

// 3. ಮೈನಸ್ KM ಕಳೆಯಲು (ಬಯಸಿದರೆ ನೇರವಾಗಿ KM ಮೈನಸ್ ಮಾಡುವ ಫಂಕ್ಷನ್)
function subtractRunKM(km, date = new Date()) {
  const distance = Number(km);
  if (!Number.isFinite(distance) || distance <= 0) return readEntries();

  const targetDate = dateKey(date);
  let entries = readEntries();

  // ಇಂದಿನ ದಿನಾಂಕದ ಇತ್ತೀಚಿನ ಎಂಟ್ರಿಗಳಿಂದ KM ಕಳೆಯುವುದು
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].date === targetDate) {
      if (entries[i].km <= distance) {
        entries.splice(i, 1);
      } else {
        entries[i].km = Math.round((entries[i].km - distance) * 100) / 100;
      }
      break;
    }
  }

  writeEntries(entries);
  return entries;
}

function totalBetween(start, end) {
  return readEntries()
    .filter(entry => entry.date >= start && entry.date <= end)
    .reduce((sum, entry) => sum + entry.km, 0);
}

function averageDailyBetween(daysCount) {
  if (daysCount <= 0) return 0;
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

// 4. Running Report Generator
function report() {
  const today = dateKey();
  const yesterday = offsetDate(-1);
  const dayBeforeYesterday = offsetDate(-2);
  const weekStart = offsetDate(-6);

  const now = new Date();
  const dayOfYear = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
  const dayOfMonth = now.getDate();

  return {
    today: Math.round(totalBetween(today, today) * 100) / 100,
    yesterday: Math.round(totalBetween(yesterday, yesterday) * 100) / 100,
    dayBeforeYesterday: Math.round(totalBetween(dayBeforeYesterday, dayBeforeYesterday) * 100) / 100,
    oneWeekTotal: Math.round(totalBetween(weekStart, today) * 100) / 100,
    weeklyAverage: averageDailyBetween(7),
    monthlyAverage: averageDailyBetween(dayOfMonth),
    yearlyAverage: averageDailyBetween(dayOfYear),
    entries: readEntries().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };
}

// 5. Run/Walk UI Rendering Function (ಅದೇ ಪೇಜಿನಲ್ಲಿ ಕೆಳಗೆ ರಿಪೋರ್ಟ್ ತೋರಿಸಲು)
function renderRunWalkUI(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const data = report();

  container.innerHTML = `
    <div style="background: var(--bg-card, #1e1e2e); color: var(--text, #fff); padding: 18px; border-radius: 14px; font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      
      <h3 style="margin-top: 0; text-align: center;">🏃 Run / Walk Tracker</h3>

      <!-- Distance Input Section (+ / - Buttons) -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <input type="number" id="runDistanceInput" placeholder="Distance (km)" step="0.1" 
               style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #444; background: #2b2b3d; color: #fff; font-size: 16px;">
        <button id="addRunBtn" style="background: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px;">+ Add</button>
        <button id="subRunBtn" style="background: #f59e0b; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px;">- Minus</button>
      </div>

      <!-- Running Report Section -->
      <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 6px; color: #38bdf8;">📊 Running Report</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; font-size: 14px;">
        <div style="background: #2b2b3d; padding: 10px; border-radius: 8px;">
          <span style="color: #aaa; display: block; font-size: 12px;">Today</span>
          <strong style="font-size: 16px;">${data.today} km</strong>
        </div>
        <div style="background: #2b2b3d; padding: 10px; border-radius: 8px;">
          <span style="color: #aaa; display: block; font-size: 12px;">Yesterday</span>
          <strong style="font-size: 16px;">${data.yesterday} km</strong>
        </div>
        <div style="background: #2b2b3d; padding: 10px; border-radius: 8px;">
          <span style="color: #aaa; display: block; font-size: 12px;">Day Before Y'day</span>
          <strong style="font-size: 16px;">${data.dayBeforeYesterday} km</strong>
        </div>
        <div style="background: #2b2b3d; padding: 10px; border-radius: 8px;">
          <span style="color: #aaa; display: block; font-size: 12px;">One Week Total</span>
          <strong style="font-size: 16px;">${data.oneWeekTotal} km</strong>
        </div>
      </div>

      <!-- Running Averages Section -->
      <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 6px; color: #38bdf8;">📈 Averages</h4>
      
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; background: #252535; padding: 8px 12px; border-radius: 6px;">
          <span>Weekly Avg:</span> <strong>${data.weeklyAverage} km/day</strong>
        </div>
        <div style="display: flex; justify-content: space-between; background: #252535; padding: 8px 12px; border-radius: 6px;">
          <span>Monthly Avg:</span> <strong>${data.monthlyAverage} km/day</strong>
        </div>
        <div style="display: flex; justify-content: space-between; background: #252535; padding: 8px 12px; border-radius: 6px;">
          <span>Yearly Avg:</span> <strong>${data.yearlyAverage} km/day</strong>
        </div>
      </div>

      <!-- History & Individual Entry Minus/Delete -->
      <h4 style="margin: 0 0 10px 0; color: #38bdf8;">📜 Recent Entries</h4>
      <div style="max-height: 180px; overflow-y: auto; padding-right: 4px;">
        ${data.entries.length === 0 ? '<p style="color: #888; font-size: 13px; text-align: center;">No entries recorded yet.</p>' : ''}
        ${data.entries.map(entry => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #2a2a3a; font-size: 13px;">
            <span>📅 ${entry.date} - <strong style="color: #10b981;">${entry.km} km</strong></span>
            <button onclick="window.runWalkFeature.deleteAndRefresh('${entry.id}', '${containerId}')" 
                    style="background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">- Delete</button>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  // Dynamic Event Handlers
  document.getElementById('addRunBtn').onclick = () => {
    const input = document.getElementById('runDistanceInput');
    if (input.value) {
      addRun(input.value);
      renderRunWalkUI(containerId);
    }
  };

  document.getElementById('subRunBtn').onclick = () => {
    const input = document.getElementById('runDistanceInput');
    if (input.value) {
      subtractRunKM(input.value);
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
  subtractRunKM,
  report,
  getEntries: readEntries,
  renderRunWalkUI,
  deleteAndRefresh
};

if (typeof window !== 'undefined') {
  window.runWalkFeature = runWalkFeature;
}