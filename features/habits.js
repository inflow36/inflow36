export const habits = {
  id: 'habits',
  label: 'Habit Tracker',
  icon: '✓',
  group: 'Daily routine',
  fields: [
    { key: 'title', label: 'Habit Name', placeholder: 'Eg: nellikai', required: true },
    { key: 'emoji', label: 'Icon / Emoji', placeholder: 'Eg: 🍋', required: false }
  ],
  render(entries, helpers) {
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // Base Date: Yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Group entries by habit title and date
    const habitMap = {};
    entries.forEach(e => {
      if (!habitMap[e.title]) habitMap[e.title] = {};
      habitMap[e.title][e.date] = e;
    });

    const habitTitles = Object.keys(habitMap);

    // Streak & Overall Calculation
    const getHabitStats = (datesObj) => {
      let streak = 0;
      let completedCount = 0;
      const now = new Date();

      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = d.toISOString().slice(0, 10);
        if (datesObj[dStr] && datesObj[dStr].status === 'done') {
          completedCount++;
          if (i === streak) streak++;
        }
      }

      const overall = Math.round((completedCount / 30) * 100);
      return { streak, overall };
    };

    let habitsListHtml = '';

    if (habitTitles.length === 0) {
      habitsListHtml = `
        <div style="background: #ffffff; padding: 24px; border-radius: 12px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
          <p style="color: #777; margin: 0; font-size: 14px;">ಯಾವುದೇ Habit ಸೇರಿಸಲಾಗಿಲ್ಲ. '+' ಒತ್ತಿ ಹೊಸ Habit ಸೇರಿಸಿ.</p>
        </div>`;
    } else {
      habitTitles.forEach(title => {
        const stats = getHabitStats(habitMap[title]);
        
        // Render 7 Days Circular Buttons around Yesterday
        let circlesHtml = '';

        for (let i = 5; i >= -1; i--) {
          const d = new Date(yesterday);
          d.setDate(yesterday.getDate() - i);
          const dStr = d.toISOString().slice(0, 10);
          const dayText = dayLabels[d.getDay()];
          
          const isToday = dStr === helpers.date();
          const entry = habitMap[title][dStr];
          
          let bgColor = '#e0e0e0'; // Default Grey
          let textColor = '#666666';

          if (entry) {
            if (entry.status === 'done') {
              bgColor = '#8bc34a'; // Green
              textColor = '#ffffff';
            } else if (entry.status === 'missed') {
              bgColor = '#f44336'; // Red
              textColor = '#ffffff';
            }
          }

          const existingId = entry ? entry.id : '';

          circlesHtml += `
            <div style="text-align: center; flex: 1;">
              <button class="habit-day-btn" 
                      data-title="${helpers.esc(title)}" 
                      data-date="${dStr}" 
                      data-entryid="${existingId}"
                      data-status="${entry ? entry.status : 'none'}"
                      style="width: 38px; height: 38px; border-radius: 50%; background: ${bgColor}; color: ${textColor}; border: none; font-size: 12px; font-weight: 700; margin: 0 auto; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; outline: none;">
                ${dayText}
              </button>
              ${isToday ? '<span style="font-size: 9px; color: #888; font-weight: 700; display: block; margin-top: 2px;">TODAY</span>' : ''}
            </div>`;
        }

        const sampleEntry = Object.values(habitMap[title])[0] || {};
        const sampleEntryId = sampleEntry.id || '';
        const emoji = sampleEntry.emoji || '✓';

        habitsListHtml += `
          <div style="background: #ffffff; padding: 14px 12px; border-bottom: 1px solid #eeeeee;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div>
                <h4 style="font-size: 15px; font-weight: 800; color: #1a237e; margin: 0 0 2px 0;">${emoji} ${title}</h4>
                <span style="font-size: 11px; color: #555; font-weight: 600;">Streak: +${stats.streak} | Overall: ${stats.overall}%</span>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn-icon" data-edit="${sampleEntryId}" style="background: none; border: none; font-size: 14px; cursor: pointer; opacity: 0.6;">✏️</button>
                <button class="btn-icon" data-delete="${sampleEntryId}" style="background: none; border: none; font-size: 14px; cursor: pointer; opacity: 0.6;">🗑️</button>
              </div>
            </div>

            <!-- Circular Days Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              ${circlesHtml}
            </div>
          </div>`;
      });
    }

    return `
      <!-- Container Box -->
      <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <div style="padding: 12px 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align- items: center; background: #fafafa;">
          <span style="font-size: 12px; font-weight: 800; color: #666; letter-spacing: 0.5px;">ALL HABITS</span>
        </div>
        ${habitsListHtml}
      </div>
    `;
  }
};
