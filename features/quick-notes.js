export const quickNotes = {
  id: 'quick-notes', label: 'Quick Note', icon: '📝', group: 'Notes',
  fields: [{ key: 'text', label: 'Note', type: 'textarea', placeholder: 'ನಿಮ್ಮ note ಇಲ್ಲಿ ಬರೆಯಿರಿ…' }],
  render(entries, { esc }) {
    return entries.length ? `<div class="notes-grid">${entries.map(entry => `<article class="note-card" data-edit="${entry.id}"><p>${esc(entry.text)}</p><button data-delete="${entry.id}" aria-label="Delete note">🗑</button></article>`).join('')}</div>` : '<div class="empty">＋ ಒತ್ತಿ ನಿಮ್ಮ ಮೊದಲ note ಬರೆಯಿರಿ.</div>';
  }
};
