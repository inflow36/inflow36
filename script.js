// Dark / Light Theme Toggle
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

// Smart Rollover Run Logic
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

    if (remainingKm < 0) remainingKm = 0; // Overshot target

    localStorage.setItem('pending_run_km', remainingKm.toFixed(1));
    inputField.value = '';
    calculateTodayTarget();
    alert(`ಇಂದು ನೀವು ${completedKm} KM ನಮೂದಿಸಿದ್ದೀರಿ!`);
});

// Initialize on Load
calculateTodayTarget();