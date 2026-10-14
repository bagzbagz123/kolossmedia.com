'use strict';
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

// Campaign context stays in this page and its internal links; no storage or transmission.
const campaignSources = {
  instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube',
  google: 'Google', email: 'Email', referral: 'Client / partner referral', outreach: 'Direct outreach'
};
const campaignMedia = ['organic', 'social', 'paid_social', 'cpc', 'email', 'referral', 'outbound'];
const campaignQuery = new URLSearchParams(window.location.search);
const campaignContext = {};
if (Object.hasOwn(campaignSources, campaignQuery.get('utm_source'))) {
  campaignContext.utm_source = campaignQuery.get('utm_source');
  const medium = campaignQuery.get('utm_medium');
  const campaign = campaignQuery.get('utm_campaign');
  if (campaignMedia.includes(medium)) campaignContext.utm_medium = medium;
  if (campaign && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(campaign) && campaign.length <= 64) campaignContext.utm_campaign = campaign;
}
function withCampaign(href) {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return href;
  Object.entries(campaignContext).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.href;
}
document.querySelectorAll('a[href]').forEach(link => {
  const url = new URL(link.href, window.location.href);
  if (url.origin === window.location.origin && !link.getAttribute('href').startsWith('#')) link.href = withCampaign(link.href);
});

// Event hooks carry only event names and offer IDs. No form answers are included.
function conversion(event, interest = 'unsure') {
  document.dispatchEvent(new CustomEvent('koloss:conversion', { detail: { event, interest } }));
}
document.querySelectorAll('a[href*="book-a-call/"]').forEach(link => {
  link.addEventListener('click', () => conversion('consultation_clicked', new URL(link.href).searchParams.get('interest') || 'unsure'));
});
document.querySelectorAll('a[href^="https://cal.com/"]').forEach(link => {
  link.addEventListener('click', () => conversion('calendar_opened', document.querySelector('#interest')?.value || 'unsure'));
});
const requestedSection = new URLSearchParams(window.location.search).get('section');
if (['packages', 'work', 'services', 'approach'].includes(requestedSection)) {
  const section = document.getElementById(requestedSection);
  if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
}
const mobileNavigation = document.querySelector('.mobile-nav');
if (mobileNavigation) {
  mobileNavigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mobileNavigation.open = false; }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileNavigation.open) {
      mobileNavigation.open = false;
      mobileNavigation.querySelector('summary').focus();
    }
  });
}
const finder = document.querySelector('#package-finder');
if (finder) {
  const options = {
    content: { title: 'Start with a tailored content plan.', interest: 'content', description: 'For personal brands and business owners who need consistent creative, discuss a Custom engagement focused on content planning, production, and editing. Format, filming, and volume are agreed in the proposal.' },
    search: { title: 'Explore Core.', interest: 'core', description: 'Core focuses on a stronger search foundation: an SEO audit, four optimized blog articles per month, weekly optimization, and a monthly performance review. Starting at $5,000 per month.' },
    paid: { title: 'Explore Scale.', interest: 'scale', description: 'Scale connects Meta and Google campaigns, creative testing, conversion improvements, and reporting. It fits a proven offer and a separate media budget. Starting at $12,000 per month.' },
    website: { title: 'Scope a focused website project.', interest: 'custom', description: 'Discuss a Custom engagement for your website or landing page. We’ll agree on the pages, content responsibilities, integrations, milestones, and fee before work begins.' },
    unsure: { title: 'Start with the consultation.', interest: 'unsure', description: 'Bring your audience, offer, and current challenge. We’ll identify a useful starting point before recommending a package.' }
  };
  finder.addEventListener('submit', event => {
    event.preventDefault();
    if (!finder.reportValidity()) return;
    const recommendation = options[finder.elements.priority.value];
    if (!recommendation) return;
    document.querySelector('#recommendation-heading').textContent = recommendation.title;
    document.querySelector('#recommendation-description').textContent = recommendation.description;
    document.querySelector('#recommendation-link').href = withCampaign(`book-a-call/index.html?interest=${recommendation.interest}`);
    document.querySelector('#recommendation').hidden = false;
    document.querySelector('#recommendation-heading').focus();
    conversion('package_finder_used', recommendation.interest);
  });
  finder.addEventListener('change', () => { document.querySelector('#recommendation').hidden = true; });
}
const form = document.querySelector('#consultation-form');
if (form) {
  const intakeQuery = new URLSearchParams(window.location.search);
  const interest = intakeQuery.get('interest');
  const audience = intakeQuery.get('audience');
  if (['business', 'brand', 'both'].includes(audience)) form.elements.audience.value = audience;
  if (['core', 'scale', 'custom', 'content'].includes(interest)) form.elements.interest.value = interest;
  const summary = document.querySelector('#brief-summary');
  const brief = document.querySelector('#brief');
  const goal = form.elements.goal;
  // Make optional fields reachable if their validation needs attention.
  form.addEventListener('invalid', event => {
    const details = document.querySelector('#brief-details');
    if (details?.contains(event.target)) details.open = true;
  }, true);
  if (campaignContext.utm_source) form.elements.discovery.value = campaignContext.utm_source;
  form.addEventListener('input', () => {
    goal.setCustomValidity('');
    brief.hidden = true;
    document.querySelector('#copy-status').textContent = '';
  });
  form.addEventListener('change', () => { brief.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    goal.setCustomValidity(goal.value.trim().length < 10 ? 'Describe your goal in at least 10 characters.' : '');
    if (!form.reportValidity()) return;
    const text = name => form.elements[name].selectedOptions[0].textContent;
    const lines = ['KOLOSS MEDIA — CONSULTATION BRIEF', `I’m a: ${text('audience')}`];
    if (form.elements.discovery.value) lines.push(`How I heard about Koloss Media: ${text('discovery')}`);
    if (campaignContext.utm_source) {
      lines.push(`Link source: ${campaignContext.utm_source}`);
      if (campaignContext.utm_medium) lines.push(`Link medium: ${campaignContext.utm_medium}`);
      if (campaignContext.utm_campaign) lines.push(`Campaign: ${campaignContext.utm_campaign}`);
    }
    if (form.elements.profile.value.trim()) lines.push(`Website / profile: ${form.elements.profile.value.trim()}`);
    lines.push(`Interested in: ${text('interest')}`, `Monthly service budget: ${text('budget')}`, `Separate advertising budget: ${text('media')}`, `Timing: ${text('timing')}`, `My goal: ${goal.value.trim()}`);
    summary.textContent = lines.join('\n');
    document.querySelector('#email-brief').href = `mailto:contact@kolossmedia.com?subject=${encodeURIComponent('Koloss Media consultation inquiry')}&body=${encodeURIComponent(summary.textContent)}`;
    document.querySelector('#copy-status').textContent = '';
    brief.hidden = false;
    document.querySelector('#brief-heading').focus();
    conversion('consultation_brief_prepared', form.elements.interest.value);
  });
  document.querySelector('#email-brief').addEventListener('click', () => conversion('email_draft_opened', form.elements.interest.value));
  document.querySelector('#copy-brief').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try { await navigator.clipboard.writeText(summary.textContent); status.textContent = 'Copied. You can paste this into your booking notes.'; }
    catch { status.textContent = 'Select and copy the brief above, then paste it into your booking notes.'; }
  });
  document.querySelector('#download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([summary.textContent], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'koloss-consultation-brief.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector('#copy-status').textContent = 'Brief downloaded. Bring it to your consultation.';
  });
}
