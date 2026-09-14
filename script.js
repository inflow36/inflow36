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

// 2. Rollover Run Tracker
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

// 3. Finance Inputs
const payableInput = document.getElementById('payableInput');
const receivableInput = document.getElementById('receivableInput');

payableInput.value = localStorage.getItem('fin_payable') || '';
receivableInput.value = localStorage.getItem('fin_receivable') || '';

document.getElementById('saveFinanceBtn').addEventListener('click', () => {
    localStorage.setItem('fin_payable', payableInput.value);
    localStorage.setItem('fin_receivable', receivableInput.value);
    alert('ಫೈನಾನ್ಸ್ ಡೇಟಾ ಸೇವ್ ಆಗಿದೆ!');
});

// 4. Dynamic Emergency Cards Generator
let emergencyCards = JSON.parse(localStorage.getItem('emergency_cards')) || [
    { name: 'ಜುಲೈ ಎಮರ್ಜೆನ್ಸಿ ಫಂಡ್', items: [{ title: '15th Kuri', amount: 20000 }, { title: 'Sango', amount: 5000 }] }
];

function renderEmergencyCards() {
    const container = document.getElementById('emergencyCardsContainer');
    container.innerHTML = '';

    emergencyCards.forEach((card, cardIndex) => {
        let total = card.items.reduce((sum, item) => sum + Number(item.amount), 0);
        
        let cardHtml = `
            <div class="border border-indigo-100 dark:border-gray-700 rounded-xl p-3 bg-indigo-50/50 dark:bg-gray-700/30 space-y-2">
                <div class="flex justify-between items-center border-b border-indigo-100 dark:border-gray-600 pb-2">
                    <span class="text-xs font-bold text-indigo-700 dark:text-indigo-300">${card.name}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-extrabold text-gray-800 dark:text-gray-200">Total: ₹ ${total.toLocaleString()}</span>
                        <button onclick="deleteCard(${cardIndex})" class="text-xs text-red-500 font-bold">✕</button>
                    </div>
                </div>
                <div class="space-y-1">
                    ${card.items.map(item => `
                        <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span>${item.title}</span>
                            <span>₹ ${Number(item.amount).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="addItemToCard(${cardIndex})" class="w-full text-center text-[11px] text-indigo-600 dark:text-indigo-400 font-bold pt-1 border-t border-indigo-100 dark:border-gray-600">+ ವೆಚ್ಚ ಸೇರಿಸಿ</button>
            </div>
        `;
        container.innerHTML += cardHtml;
    });

    localStorage.setItem('emergency_cards', JSON.stringify(emergencyCards));
}

document.getElementById('addCardBtn').addEventListener('click', () => {
    let cardName = prompt('ಹೊಸ ಎಮರ್ಜೆನ್ಸಿ / ಫಂಡ್ ಹೆಸರು ಬರೆಯಿರಿ (ಉದಾ: ಆಗಸ್ಟ್ പ್ಲಾನ್):');
    if (cardName) {
        emergencyCards.push({ name: cardName, items: [] });
        renderEmergencyCards();
    }
});

window.addItemToCard = function(cardIndex) {
    let title = prompt('ವಿವರ (ಉದಾ: Wedding, Kuri):');
    let amount = prompt('ಮೊತ್ತ (₹):');
    if (title && amount) {
        emergencyCards[cardIndex].items.push({ title, amount: Number(amount) });
        renderEmergencyCards();
    }
};

window.deleteCard = function(cardIndex) {
    if (confirm('ಈ ಕಾರ್ಡ್ ಅನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ?')) {
        emergencyCards.splice(cardIndex, 1);
        renderEmergencyCards();
    }
};

// 5. PIN Protected Diary (PIN Code: inflow36)
const SECRET_PIN = "inflow36";
const diaryPinView = document.getElementById('diaryPinView');
const diaryContentView = document.getElementById('diaryContentView');
const diaryPinInput = document.getElementById('diaryPinInput');
const lockDiaryBtn = document.getElementById('lockDiaryBtn');

document.getElementById('unlockDiaryBtn').addEventListener('click', () => {
    if (diaryPinInput.value === SECRET_PIN) {
        diaryPinView.classList.add('hidden');
        diaryContentView.classList.remove('hidden');
        lockDiaryBtn.classList.remove('hidden');
        diaryInput.value = localStorage.getItem('user_diary_entry') || '';
        diaryPinInput.value = '';
    } else {
        alert('ತಪ್ಪಾದ PIN Code! ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.');
    }
});

lockDiaryBtn.addEventListener('click', () => {
    diaryPinView.classList.remove('hidden');
    diaryContentView.classList.add('hidden');
    lockDiaryBtn.classList.add('hidden');
});

document.getElementById('saveDiaryBtn').addEventListener('click', () => {
    localStorage.setItem('user_diary_entry', diaryInput.value);
    alert('ಡೈರಿ ಎಂಟ್ರಿ ಸೇವ್ ಆಗಿದೆ!');
});

// 6. Quick Notes
const noteInput = document.getElementById('noteInput');
noteInput.value = localStorage.getItem('user_quick_note') || '';

document.getElementById('saveNoteBtn').addEventListener('click', () => {
    localStorage.setItem('user_quick_note', noteInput.value);
    alert('ನೋಟ್ಸ್ ಸೇವ್ ಆಗಿದೆ!');
});

// 7. Backup & Restore (Export/Import)
document.getElementById('exportDataBtn').addEventListener('click', () => {
    let backupData = JSON.stringify(localStorage);
    let blob = new Blob([backupData], { type: 'application/json' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `my_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
});

document.getElementById('importDataInput').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(event) {
            let data = JSON.parse(event.target.result);
            Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
            alert('ಡೇಟಾ ಸಫಲವಾಗಿ ರಿಸ್ಟೋರ್ ಆಗಿದೆ!');
            location.reload();
        };
        reader.readAsText(file);
    }
});

// Initializations
calculateTodayTarget();
renderEmergencyCards();