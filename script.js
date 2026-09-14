// 1. Dark/Light Theme Logic
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
});

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
    themeIcon.textContent = '🌙';
}

// 2. Rollover Run Tracker (5 KM Daily Target)
const DAILY_TARGET = 5.0;

function calculateTodayTarget() {
    let pendingKm = parseFloat(localStorage.getItem('pending_run_km')) || 0;
    let todayTarget = DAILY_TARGET + pendingKm;
    document.getElementById('runTarget').textContent = todayTarget.toFixed(1);
}

document.getElementById('addRunBtn').addEventListener('click', () => {
    const inputField = document.getElementById('runInput');
    const completedKm = parseFloat(inputField.value) || 0;
    let currentTarget = parseFloat(document.getElementById('runTarget').textContent);
    let remainingKm = currentTarget - completedKm;

    if (remainingKm < 0) remainingKm = 0;

    localStorage.setItem('pending_run_km', remainingKm.toFixed(1));
    inputField.value = '';
    calculateTodayTarget();
    alert(`ಇಂದು ನೀವು ${completedKm} KM ನಮೂದಿಸಿದ್ದೀರಿ!`);
});

// 3. Finance Inputs Load & Save
const payableInput = document.getElementById('payableInput');
const receivableInput = document.getElementById('receivableInput');

payableInput.value = localStorage.getItem('fin_payable') || '';
receivableInput.value = localStorage.getItem('fin_receivable') || '';

document.getElementById('saveFinanceBtn').addEventListener('click', () => {
    localStorage.setItem('fin_payable', payableInput.value);
    localStorage.setItem('fin_receivable', receivableInput.value);
    alert('ಫೈನಾನ್ಸ್ ಡೇಟಾ ಸೇವ್ ಆಗಿದೆ!');
});

// 4. Quick Notes Load & Save
const noteInput = document.getElementById('noteInput');
noteInput.value = localStorage.getItem('user_quick_note') || '';

document.getElementById('saveNoteBtn').addEventListener('click', () => {
    localStorage.setItem('user_quick_note', noteInput.value);
    alert('ನೋಟ್ಸ್ ಸೇವ್ ಆಗಿದೆ!');
});

// 5. Diary Load & Save
const diaryInput = document.getElementById('diaryInput');
diaryInput.value = localStorage.getItem('user_diary_entry') || '';

document.getElementById('saveDiaryBtn').addEventListener('click', () => {
    localStorage.setItem('user_diary_entry', diaryInput.value);
    alert('ಡೈರಿ ಎಂಟ್ರಿ ಸೇವ್ ಆಗಿದೆ!');
});

// Initialize Run Target
calculateTodayTarget();