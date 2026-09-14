// ==========================================
// 1. Dark / Light Theme Toggle
// ==========================================
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

// ==========================================
// 2. Smart Rollover Run Logic (5 KM Daily)
// ==========================================
const DAILY_TARGET = 5.0;

function calculateTodayTarget() {
    let pendingKm = parseFloat(localStorage.getItem('pending_run_km')) || 0;
    let todayTarget = DAILY_TARGET + pendingKm;
    
    const runTargetElem = document.getElementById('runTarget');
    if (runTargetElem) {
        runTargetElem.textContent = todayTarget.toFixed(1);
    }
}

const addRunBtn = document.getElementById('addRunBtn');
if (addRunBtn) {
    addRunBtn.addEventListener('click', () => {
        const inputField = document.getElementById('runInput');
        const completedKm = parseFloat(inputField.value) || 0;
        
        let currentTarget = parseFloat(document.getElementById('runTarget').textContent);
        let remainingKm = currentTarget - completedKm;

        if (remainingKm < 0) remainingKm = 0; // Target complete

        localStorage.setItem('pending_run_km', remainingKm.toFixed(1));
        inputField.value = '';
        calculateTodayTarget();
        alert(`ಇಂದು ನೀವು ${completedKm} KM ಎಂಟ್ರಿ ಮಾಡಿದ್ದೀರಿ!`);
    });
}

// ==========================================
// 3. Quick Notes Auto-Save
// ==========================================
const noteInput = document.getElementById('noteInput');
if (noteInput) {
    // Load existing note
    noteInput.value = localStorage.getItem('user_quick_note') || '';

    // Save note function
    const saveNoteBtn = noteInput.nextElementSibling;
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            localStorage.setItem('user_quick_note', noteInput.value);
            alert('ನೋಟ್ಸ್ ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಆಗಿದೆ!');
        });
    }
}

// App Initialization
calculateTodayTarget();