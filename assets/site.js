'use strict';
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
const form = document.querySelector('#consultation-form');
if (form) {
  const interest = new URLSearchParams(window.location.search).get('interest');
  if (['core', 'scale', 'custom', 'content'].includes(interest)) form.elements.interest.value = interest;
  const summary = document.querySelector('#brief-summary');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const text = name => form.elements[name].selectedOptions[0].textContent;
    summary.textContent = ['KOLOSS MEDIA — CONSULTATION BRIEF', `I’m a: ${text('audience')}`, `Interested in: ${text('interest')}`, `Monthly marketing budget: ${text('budget')}`, `Timing: ${text('timing')}`, `My goal: ${form.elements.goal.value.trim()}`].join('\n');
    document.querySelector('#brief').hidden = false;
    document.querySelector('#brief-heading').focus();
  });
  document.querySelector('#copy-brief').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try { await navigator.clipboard.writeText(summary.textContent); status.textContent = 'Copied. You can paste this into your booking notes.'; }
    catch { status.textContent = 'Select and copy the brief above, then paste it into your booking notes.'; }
  });
}
