// ==========================================
// 1. Timezone-Safe Local Date Function
// ==========================================
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const START_DATE = "2026-09-14"; // ಪ್ರಾರಂಭ ದಿನಾಂಕ
const DAILY_TARGET = 5.0;
const todayStr = getLocalDateString();

// Helper: Escape HTML to prevent XSS
function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

// ==========================================
// 2. Theme Management (Light Mode Default)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIcon.textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.textContent = '🌙';
    }
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('app_theme', newTheme);
    applyTheme(newTheme);
});

applyTheme(localStorage.getItem('app_theme') || 'light');

// ==========================================
// 3. Bottom Navigation Router
// ==========================================
const views = {
    home: document.getElementById('viewHome'),
    finance: document.getElementById('viewFinance'),
    diary: document.getElementById('viewDiary')
};

const navBtns = {
    home: document.getElementById('navHome'),
    finance: document.getElementById('navFinance'),
    diary: document.getElementById('navDiary')
};

function switchView(target) {
    Object.keys(views).forEach(key => {
        if (key === target) {
            views[key].classList.remove('hidden');
            navBtns[key].className = "nav-btn flex flex-col items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold";
        } else {
            views[key].classList.add('hidden');
            navBtns[key].className = "nav-btn flex flex-col items-center gap-1 text-gray-400 font-medium";
        }
    });
}

navBtns.home.addEventListener('click', () => switchView('home'));
navBtns.finance.addEventListener('click', () => switchView('finance'));
navBtns.diary.addEventListener('click', () => switchView('diary'));

// ==========================================
// 4. Fixed Run Tracker (Rollover & Calendar Averages)
// ==========================================
let runHistory = JSON.parse(localStorage.getItem('run_history_db')) || {};

function updateRunDashboard() {
    let todayKm = parseFloat(runHistory[todayStr]) || 0;
    
    // Rollover: 14 Sep 2026 ರಿಂದ ಇಂದಿನವರೆಗಿನ ಬಾಕಿ ಮಾತ್ರ ಲೆಕ್ಕಾಚಾರ
    let pendingKm = 0;
    Object.keys(runHistory).forEach(date => {
        if (date >= START_DATE && date < todayStr) {
            let deficit = DAILY_TARGET - runHistory[date];
            if (deficit > 0) pendingKm += deficit;
        }
    });

    let totalTarget = DAILY_TARGET + pendingKm;
    let remainingKm = totalTarget - todayKm;
    if (remainingKm < 0) remainingKm = 0;

    document.getElementById('runRemaining').textContent = remainingKm.toFixed(1);
    document.getElementById('completedKmDisplay').textContent = todayKm.toFixed(1);
    document.getElementById('totalTargetDisplay').textContent = totalTarget.toFixed(1);

    // 1. Yesterday Walk
    let yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    let yesterdayStr = getLocalDateString(yesterdayDate);
    document.getElementById('yesterdayRun').textContent = `${(runHistory[yesterdayStr] || 0).toFixed(1)} KM`;

    // 2. Exact Calendar 7-Days Average
    let sum7 = 0;
    for (let i = 0; i < 7; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dateStr = getLocalDateString(d);
        sum7 += (runHistory[dateStr] || 0);
    }
    document.getElementById('weeklyAvgRun').textContent = `${(sum7 / 7).toFixed(1)} KM`;

    // 3. Exact Calendar 30-Days Average
    let sum30 = 0;
    for (let i = 0; i < 30; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dateStr = getLocalDateString(d);
        sum30 += (runHistory[dateStr] || 0);
    }
    document.getElementById('monthlyAvgRun').textContent = `${(sum30 / 30).toFixed(1)} KM`;

    localStorage.setItem('run_history_db', JSON.stringify(runHistory));
}

document.getElementById('addRunBtn').addEventListener('click', () => {
    const inputField = document.getElementById('runInput');
    const enteredKm = parseFloat(inputField.value);
    
    if (isNaN(enteredKm) || enteredKm <= 0) {
        alert('ದಯವಿಟ್ಟು ಸರಿಯಾದ KM ನಮೂದಿಸಿ!');
        return;
    }

    runHistory[todayStr] = (runHistory[todayStr] || 0) + enteredKm;
    inputField.value = '';
    updateRunDashboard();
});

document.getElementById('editRunBtn').addEventListener('click', () => {
    let currentCompleted = runHistory[todayStr] || 0;
    let newKm = prompt('ಇಂದು ನಡೆದ ಒಟ್ಟು KM ನಮೂದಿಸಿ:', currentCompleted);
    let numericKm = parseFloat(newKm);
    
    if (newKm !== null && !isNaN(numericKm) && numericKm >= 0) {
        runHistory[todayStr] = numericKm;
        updateRunDashboard();
    } else if (newKm !== null) {
        alert('ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೊತ್ತವನ್ನು ಹಾಕಿ!');
    }
});

// Run History Modal
const runHistoryModal = document.getElementById('runHistoryModal');
document.getElementById('openRunHistoryBtn').addEventListener('click', () => {
    const list = document.getElementById('runHistoryList');
    list.innerHTML = '';
    
    let sortedDates = Object.keys(runHistory).sort().reverse();
    if (sortedDates.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 py-4">ಯಾವುದೇ ಹಿಸ್ಟರಿ ಲಭ್ಯವಿಲ್ಲ</p>';
    } else {
        sortedDates.forEach(date => {
            list.innerHTML += `
                <div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span class="font-medium">${escapeHTML(date)}</span>
                    <span class="font-bold text-indigo-600 dark:text-indigo-400">${runHistory[date].toFixed(1)} KM</span>
                </div>
            `;
        });
    }
    runHistoryModal.classList.remove('hidden');
});

document.getElementById('closeRunHistoryBtn').addEventListener('click', () => runHistoryModal.classList.add('hidden'));

// ==========================================
// 5. Habit Tracker Persistence
// ==========================================
const habitsKey = `habits_${todayStr}`;
let savedHabits = JSON.parse(localStorage.getItem(habitsKey)) || {};

document.querySelectorAll('.habit-check').forEach(checkbox => {
    checkbox.checked = !!savedHabits[checkbox.id];
    checkbox.addEventListener('change', (e) => {
        savedHabits[e.target.id] = e.target.checked;
        localStorage.setItem(habitsKey, JSON.stringify(savedHabits));
    });
});

// ==========================================
// 6. Dynamic Emergency Cards (With Amount Validation)
// ==========================================
let emergencyCards = JSON.parse(localStorage.getItem('emergency_cards')) || [
    { name: 'ಜುಲೈ ಎಮರ್ಜೆನ್ಸಿ ಫಂಡ್', items: [{ title: '15th Kuri', amount: 20000 }, { title: 'Sango', amount: 5000 }] }
];

function renderEmergencyCards() {
    const container = document.getElementById('emergencyCardsContainer');
    container.innerHTML = '';

    emergencyCards.forEach((card, cardIndex) => {
        let total = card.items.reduce((sum, item) => sum + Number(item.amount), 0);
        
        container.innerHTML += `
            <div class="border border-indigo-100 dark:border-gray-700 rounded-xl p-3 bg-indigo-50/50 dark:bg-gray-700/30 space-y-2">
                <div class="flex justify-between items-center border-b border-indigo-100 dark:border-gray-600 pb-2">
                    <span class="text-xs font-bold text-indigo-700 dark:text-indigo-300">${escapeHTML(card.name)}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-extrabold text-gray-800 dark:text-gray-200">Total: ₹ ${total.toLocaleString()}</span>
                        <button onclick="deleteCard(${cardIndex})" class="text-xs text-red-500 font-bold">✕</button>
                    </div>
                </div>
                <div class="space-y-1">
                    ${card.items.map(item => `
                        <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span>${escapeHTML(item.title)}</span>
                            <span>₹ ${Number(item.amount).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="addItemToCard(${cardIndex})" class="w-full text-center text-[11px] text-indigo-600 dark:text-indigo-400 font-bold pt-1 border-t border-indigo-100 dark:border-gray-600">+ ವೆಚ್ಚ ಸೇರಿಸಿ</button>
            </div>
        `;
    });

    localStorage.setItem('emergency_cards', JSON.stringify(emergencyCards));
}

document.getElementById('addCardBtn').addEventListener('click', () => {
    let name = prompt('ಹೊಸ ಕಾರ್ಡ್ ಹೆಸರು:');
    if (name && name.trim() !== '') {
        emergencyCards.push({ name: name.trim(), items: [] });
        renderEmergencyCards();
    }
});

window.addItemToCard = function(i) {
    let title = prompt('ವಿವರ:');
    let amount = prompt('ಮೊತ್ತ (₹):');
    let numericAmount = Number(amount);

    if (title && title.trim() !== '' && amount !== null && amount.trim() !== '' && Number.isFinite(numericAmount) && numericAmount >= 0) {
        emergencyCards[i].items.push({ title: title.trim(), amount: numericAmount });
        renderEmergencyCards();
    } else {
        alert('ದಯವಿಟ್ಟು ಸರಿಯಾದ ಶೀರ್ಷಿಕೆ ಮತ್ತು ಮೊತ್ತವನ್ನು ಹಾಕಿ!');
    }
};

window.deleteCard = function(i) {
    if (confirm('ತೆಗೆದುಹಾಕಬೇಕೇ?')) {
        emergencyCards.splice(i, 1);
        renderEmergencyCards();
    }
};

// ==========================================
// 7. Dynamic Bucket List (With Validation)
// ==========================================
let bucketList = JSON.parse(localStorage.getItem('bucket_list')) || [
    { title: 'ಲಡಾಖ್ ಟ್ರಿಪ್', budget: 35000 }
];

function renderBucketList() {
    const container = document.getElementById('bucketContainer');
    container.innerHTML = '';

    bucketList.forEach((item, index) => {
        container.innerHTML += `
            <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center">
                <div>
                    <h3 class="text-xs font-bold">${escapeHTML(item.title)}</h3>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">ಅಂದಾಜು ಬಜೆಟ್: ₹ ${Number(item.budget).toLocaleString()}</p>
                </div>
                <button onclick="deleteBucketItem(${index})" class="text-xs text-red-500 font-bold">✕</button>
            </div>
        `;
    });

    localStorage.setItem('bucket_list', JSON.stringify(bucketList));
}

document.getElementById('addBucketBtn').addEventListener('click', () => {
    let title = prompt('ಪ್ರವಾಸ ಅಥವಾ ಪ್ಲಾನ್ ಹೆಸರು:');
    let budget = prompt('ಅಂದಾಜು ಬಜೆಟ್ (₹):');
    let numericBudget = Number(budget);

    if (title && title.trim() !== '' && budget !== null && budget.trim() !== '' && Number.isFinite(numericBudget) && numericBudget >= 0) {
        bucketList.push({ title: title.trim(), budget: numericBudget });
        renderBucketList();
    } else {
        alert('ದಯವಿಟ್ಟು ಸರಿಯಾದ ವಿವರ ಮತ್ತು ಬಜೆಟ್ ಹಾಕಿ!');
    }
});

window.deleteBucketItem = function(i) {
    bucketList.splice(i, 1);
    renderBucketList();
};

// ==========================================
// 8. Finance Section
// ==========================================
const payableInput = document.getElementById('payableInput');
const receivableInput = document.getElementById('receivableInput');

payableInput.value = localStorage.getItem('fin_payable') || '';
receivableInput.value = localStorage.getItem('fin_receivable') || '';

document.getElementById('saveFinanceBtn').addEventListener('click', () => {
    localStorage.setItem('fin_payable', payableInput.value);
    localStorage.setItem('fin_receivable', receivableInput.value);
    alert('ಫೈನಾನ್ಸ್ ಡೇಟಾ ಸೇವ್ ಆಗಿದೆ!');
});

// ==========================================
// 9. Multiple Notes History Management
// ==========================================
let notesHistory = JSON.parse(localStorage.getItem('notes_history')) || [];

function renderNotes() {
    const container = document.getElementById('notesListContainer');
    container.innerHTML = '';

    if (notesHistory.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400">ಯಾವುದೇ ನೋಟ್ಸ್ ಲಭ್ಯವಿಲ್ಲ.</p>';
        return;
    }

    notesHistory.forEach((note, index) => {
        container.innerHTML += `
            <div class="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs space-y-1 relative">
                <div class="flex justify-between items-center text-[10px] text-gray-400">
                    <span>${escapeHTML(note.date)}</span>
                    <button onclick="deleteNote(${index})" class="text-red-500 font-bold text-xs">✕</button>
                </div>
                <p class="text-gray-700 dark:text-gray-200 whitespace-pre-line">${escapeHTML(note.text)}</p>
            </div>
        `;
    });

    localStorage.setItem('notes_history', JSON.stringify(notesHistory));
}

document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const input = document.getElementById('noteInput');
    if (input.value.trim() !== '') {
        notesHistory.unshift({ date: todayStr, text: input.value.trim() });
        input.value = '';
        renderNotes();
        alert('ನೋಟ್ ಸೇವ್ ಆಗಿದೆ!');
    }
});

window.deleteNote = function(i) {
    notesHistory.splice(i, 1);
    renderNotes();
};

// ==========================================
// 10. Multiple Personal Diary History (PIN: inflow36)
// ==========================================
const SECRET_PIN = "inflow36";
const diaryPinView = document.getElementById('diaryPinView');
const diaryContentView = document.getElementById('diaryContentView');
const diaryPinInput = document.getElementById('diaryPinInput');
const lockDiaryBtn = document.getElementById('lockDiaryBtn');

let diaryEntries = JSON.parse(localStorage.getItem('diary_entries_db')) || [];

function renderDiaryEntries() {
    const container = document.getElementById('diaryEntriesContainer');
    container.innerHTML = '';

    if (diaryEntries.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400">ಯಾವುದೇ ಎಂಟ್ರಿ ಲಭ್ಯವಿಲ್ಲ.</p>';
        return;
    }

    diaryEntries.forEach((entry, index) => {
        container.innerHTML += `
            <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-1 text-xs">
                <div class="flex justify-between items-center text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>📅 ${escapeHTML(entry.date)}</span>
                    <button onclick="deleteDiaryEntry(${index})" class="text-red-500 font-bold">✕ Delete</button>
                </div>
                <p class="text-gray-700 dark:text-gray-200 whitespace-pre-line">${escapeHTML(entry.text)}</p>
            </div>
        `;
    });

    localStorage.setItem('diary_entries_db', JSON.stringify(diaryEntries));
}

document.getElementById('unlockDiaryBtn').addEventListener('click', () => {
    if (diaryPinInput.value === SECRET_PIN) {
        diaryPinView.classList.add('hidden');
        diaryContentView.classList.remove('hidden');
        lockDiaryBtn.classList.remove('hidden');
        diaryPinInput.value = '';
        renderDiaryEntries();
    } else {
        alert('ತಪ್ಪಾದ PIN Code!');
    }
});

lockDiaryBtn.addEventListener('click', () => {
    diaryPinView.classList.remove('hidden');
    diaryContentView.classList.add('hidden');
    lockDiaryBtn.classList.add('hidden');
});

document.getElementById('saveDiaryBtn').addEventListener('click', () => {
    const input = document.getElementById('diaryInput');
    if (input.value.trim() !== '') {
        diaryEntries.unshift({ date: todayStr, text: input.value.trim() });
        input.value = '';
        renderDiaryEntries();
        alert('ಡೈರಿ ಸೇವ್ ಆಗಿದೆ!');
    }
});

window.deleteDiaryEntry = function(i) {
    if (confirm('ಈ ಎಂಟ್ರಿ ಅಳಿಸಬೇಕೇ?')) {
        diaryEntries.splice(i, 1);
        renderDiaryEntries();
    }
};

// ==========================================
// 11. Clean JSON Backup & Restore System
// ==========================================
document.getElementById('exportDataBtn').addEventListener('click', () => {
    const backupObj = {
        version: 1,
        exportedAt: new Date().toISOString(),
        runHistory,
        emergencyCards,
        bucketList,
        notesHistory,
        diaryEntries,
        finance: {
            payable: payableInput.value,
            receivable: receivableInput.value
        }
    };

    let blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `life_app_backup_${todayStr}.json`;
    a.click();
});

document.getElementById('importDataInput').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(evt) {
            try {
                let data = JSON.parse(evt.target.result);
                if (data.runHistory) localStorage.setItem('run_history_db', JSON.stringify(data.runHistory));
                if (data.emergencyCards) localStorage.setItem('emergency_cards', JSON.stringify(data.emergencyCards));
                if (data.bucketList) localStorage.setItem('bucket_list', JSON.stringify(data.bucketList));
                if (data.notesHistory) localStorage.setItem('notes_history', JSON.stringify(data.notesHistory));
                if (data.diaryEntries) localStorage.setItem('diary_entries_db', JSON.stringify(data.diaryEntries));
                if (data.finance) {
                    localStorage.setItem('fin_payable', data.finance.payable || '');
                    localStorage.setItem('fin_receivable', data.finance.receivable || '');
                }
                alert('ಬ್ಯಾಕಪ್ ಫೈಲ್ ಸಫಲವಾಗಿ ರಿಸ್ಟೋರ್ ಆಗಿದೆ!');
                location.reload();
            } catch (err) {
                alert('ಅಮಾನ್ಯವಾದ (Invalid) ಬ್ಯಾಕಪ್ ಫೈಲ್!');
            }
        };
        reader.readAsText(file);
    }
});

// Init
updateRunDashboard();
renderEmergencyCards();
renderBucketList();
renderNotes();