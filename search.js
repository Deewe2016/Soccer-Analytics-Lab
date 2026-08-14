function setupTeamSearch(inputId, selectId) {
  const input = document.getElementById(inputId);
  const select = document.getElementById(selectId);
  if (!input || !select) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    for (const option of select.options) {
      option.hidden = query !== '' && !option.textContent.toLowerCase().includes(query);
    }
    const current = select.selectedOptions[0];
    if (query && (!current || current.hidden)) {
      const firstMatch = [...select.options].find(option => !option.hidden);
      if (firstMatch) {
        select.value = firstMatch.value;
        select.dispatchEvent(new Event('change'));
      }
    }
  });
}

setupTeamSearch('homeSearch', 'home');
setupTeamSearch('awaySearch', 'away');
