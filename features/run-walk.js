export const runWalk = {
  id: 'run-walk', 
  label: 'Run Walk', 
  icon: '🏃', 
  group: 'Activity',
  fields: [
    { key: 'km', label: 'Distance (KM)', type: 'number', step: '0.1', placeholder: '5' }, 
    { key: 'date', label: 'Date', type: 'date' }
  ],
  render(entries, helpers) {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 1. Today's Distance
    const today = entries
      .filter(entry => entry.date === todayStr)
      .reduce((sum, entry) => sum + Number(entry.km || 0), 0);

    // Helper for Date Math
    const getKmForDays = (days) => {
      const now = new Date();
      let total = 0;
      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = d.toLocaleDateString('en-CA');
        total += entries
          .filter(e => e.date === dStr)
          .reduce((sum, e) => sum + Number(e.km || 0), 0);
      }
      return total;
    };

    // 2. Calculated Averages
    const weekTotal = getKmForDays(7);
    const monthTotal = getKmForDays(30);
    const yearTotal = getKmForDays(365);

    const weeklyAvg = (weekTotal / 7).toFixed(1);
    const monthlyAvg = (monthTotal / 30).toFixed(1);
    const yearlyAvg = (yearTotal / 365).toFixed(1);

    // 3. 7 Days Simple Single-Box History List
    let weekHistoryRows = '';
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = d.toLocaleDateString('en-CA');
      const formattedDate = `${dStr.slice(5, 7)}-${dStr.slice(8, 10)}`;
      const dayLabel = i === 0 ? 'ಇವತ್ತು' : `${dayNames[d.getDay()]} (${formattedDate})`;
      
      const dayEntries = entries.filter(e => e.date === dStr);
      const dayKm = dayEntries.reduce((sum, e) => sum + Number(e.km || 0), 0);

      let actionBtns = '';
      if (dayEntries.length > 0) {
        actionBtns = `<button class="btn-icon" data-edit="${dayEntries[0].id}">✏️</button><button class="btn-icon" data-delete="${dayEntries[0].id}">🗑️</button>`;
      }

      weekHistoryRows += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <span style="font-size: 14px; color: #444;">${dayLabel}</span>
          <div>
            <span style="font-size: 15px; font-weight: 700; color: #111; margin-right: 8px;">🏃 ${dayKm.toFixed(1)} KM</span>
            ${actionBtns}
          </div>
        </div>`;
    }

    // UI Structure Output
    return `
      <!-- Main Metric -->
      <div style="background: #ffffff; padding: 20px; border-radius: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px;">
        <h2 style="font-size: 32px; font-weight: 800; color: #5f259f; margin: 0;">${today.toFixed(1)} KM</h2>
        <span style="font-size: 13px; color: #666;">ಇಂದಿನ ಒಟ್ಟು ಓಡಿದ ದೂರ</span>
      </div>

      <!-- Compact Modern Averages Grid -->
      <h4 style="font-size: 14px; font-weight: 700; color: #333; margin: 16px 0 8px 0;">📊 ಸರಾಸರಿ (Averages)</h4>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
        <div style="background: #ffffff; padding: 12px 8px; border-radius: 12px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
          <span style="font-size: 11px; color: #777; display: block; margin-bottom: 4px;">Weekly</span>
          <b style="font-size: 15px; color: #111;">${weeklyAvg} <small style="font-weight: normal; font-size: 11px;">km</small></b>
        </div>
        <div style="background: #ffffff; padding: 12px 8px; border-radius: 12px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
          <span style="font-size: 11px; color: #777; display: block; margin-bottom: 4px;">Monthly</span>
          <b style="font-size: 15px; color: #111;">${monthlyAvg} <small style="font-weight: normal; font-size: 11px;">km</small></b>
        </div>
        <div style="background: #ffffff; padding: 12px 8px; border-radius: 12px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
          <span style="font-size: 11px; color: #777; display: block; margin-bottom: 4px;">Yearly</span>
          <b style="font-size: 15px; color: #111;">${yearlyAvg} <small style="font-weight: normal; font-size: 11px;">km</small></b>
        </div>
      </div>

      <!-- Single Box History Card -->
      <h4 style="font-size: 14px; font-weight: 700; color: #333; margin: 16px 0 8px 0;">🗓️ ಕಳೆದ 7 ದಿನಗಳ ಹಿಸ್ಟರಿ</h4>
      <div style="background: #ffffff; border-radius: 16px; padding: 8px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        ${weekHistoryRows}
      </div>
    `;
  }
};