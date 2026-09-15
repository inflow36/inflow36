export const salaryCard = {
  id: 'salary-card', label: 'Salary Card', icon: '💳', group: 'Money',
  fields: [{key:'title',label:'Month',placeholder:'2026 March'},{key:'amount',label:'In hand amount',type:'number',step:'0.01'},{key:'text',label:'Remarks',required:false}],
  render(entries, helpers) {
    const total = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const rows = entries.slice().reverse().map(entry => '<article class="entry-card"><div><b>' + helpers.esc(entry.title) + '</b><small>' + helpers.esc(entry.text || '') + '</small><strong>' + helpers.money(entry.amount) + '</strong></div><div class="entry-actions"><button data-edit="' + entry.id + '">✎</button><button data-delete="' + entry.id + '">🗑</button></div></article>').join('');
    return '<div class="metric"><b>' + helpers.money(total) + '</b><span>Total in hand</span></div>' + (rows || '<div class="empty">ತಿಂಗಳ salary ಸೇರಿಸಿ.</div>');
  }
};
