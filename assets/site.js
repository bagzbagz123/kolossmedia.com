'use strict';
(() => {
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  const interests = {core:'Search & content',scale:'Campaigns & Search',custom:'Websites & Conversion / project',content:'Content & Creative',unsure:'Help choosing a starting point'};
  const query = new URLSearchParams(location.search);
  const context = {};
  const allowed = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','source','ref'];
  for (const key of allowed) {
    const value = query.get(key);
    if (value && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value)) context[key] = value;
  }
  if (Object.hasOwn(interests,query.get('interest'))) context.interest = query.get('interest');
  if (['business','brand','both'].includes(query.get('audience'))) context.audience = query.get('audience');
  // Context is carried in links, never browser storage. Explicit destination values win.
  function withContext(href) {
    const url = new URL(href,location.href);
    if (url.origin !== location.origin || !['http:','https:','file:'].includes(url.protocol)) return href;
    Object.entries(context).forEach(([key,value]) => { if (!url.searchParams.has(key)) url.searchParams.set(key,value); });
    return url.href;
  }
  document.querySelectorAll('a[href]').forEach(link => {
    if (!link.getAttribute('href').startsWith('#')) link.href = withContext(link.href);
  });
  // Existing analytics integration point. Clicks are intent, not completed bookings.
  function conversion(event,interest=context.interest || 'unsure') {
    document.dispatchEvent(new CustomEvent('koloss:conversion',{detail:{event,interest}}));
  }
  document.querySelectorAll('a[href*="book-a-call/"]').forEach(link => {
    link.addEventListener('click',() => conversion('consultation_clicked',new URL(link.href).searchParams.get('interest') || 'unsure'));
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => link.addEventListener('click',() => conversion('email_draft_opened')));
  const menu = document.querySelector('.mobile-nav');
  if (menu) {
    const trigger = menu.querySelector('summary');
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click',() => { menu.open=false; }));
    document.addEventListener('keydown',event => { if(event.key==='Escape' && menu.open){menu.open=false;trigger.focus();} });
    document.addEventListener('click',event => { if(menu.open && !menu.contains(event.target)) menu.open=false; });
  }
  const section = query.get('section');
  if (['work','services','approach','packages'].includes(section)) document.getElementById(section)?.scrollIntoView({behavior:'instant'});
  window.Koloss = Object.freeze({context,interests,conversion});
})();
