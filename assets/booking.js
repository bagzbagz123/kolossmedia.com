'use strict';
(() => {
  const {context,interests,conversion} = window.Koloss;
  const base = 'https://cal.com/ivans-qbhhss/30min';
  const config = {theme:'dark',layout:'month_view'};
  const notes=[];
  if(context.interest){notes.push('Interested in: '+interests[context.interest]);config['metadata[service_interest]']=context.interest;}
  if(context.audience){notes.push('Audience: '+({business:'Business owner',brand:'Personal brand / creator',both:'Business owner building a personal brand'}[context.audience]));config['metadata[audience]']=context.audience;}
  Object.entries(context).forEach(([key,value]) => {
    if(key.startsWith('utm_')) config[key]=value;
    if(key!=='interest' && key!=='audience') config[`metadata[${key}]`]=value;
  });
  if(notes.length) config.notes=notes.join('\n');
  const contextLabel=document.getElementById('booking-context');
  if(context.interest){contextLabel.textContent='Starting point: '+interests[context.interest];contextLabel.hidden=false;}
  const calendarURL=new URL(base);
  Object.entries(config).forEach(([key,value]) => calendarURL.searchParams.set(key,value));
  // Keep original service/source keys in the fallback URL as well as supported Cal metadata.
  Object.entries(context).forEach(([key,value]) => calendarURL.searchParams.set(key,value));
  document.querySelectorAll('[data-calendar]').forEach(link => {link.href=calendarURL.href;link.addEventListener('click',()=>conversion('calendar_opened'));});
  const status=document.getElementById('calendar-status');
  const calendar=document.getElementById('cal-inline');
  const panel=document.getElementById('calendar-panel') || document.querySelector('.calendar-panel');
  let ready=false,confirmed=false;
  function calendarState(state,message){
    const busy=String(state==='loading');
    calendar.setAttribute('aria-busy',busy);
    panel.setAttribute('aria-busy',busy);
    panel.dataset.calendarState=state;
    status.hidden=false;
    status.textContent=message;
  }
  function unavailable(failed=false){
    if(ready)return;
    calendarState('unavailable',failed
      ? 'The calendar could not load. Use “Open the calendar” or ask by email.'
      : 'The calendar is taking longer than expected. Use “Open the calendar” or ask by email.');
  }
  calendarState('loading','Loading available times… You can also open the calendar directly or ask by email.');
  // Official Cal.com queue bootstrap. No API key or additional booking backend is needed.
  (function(C,A,L){let p=function(a,ar){a.q.push(ar)};let d=C.document;C.Cal=C.Cal||function(){let cal=C.Cal;let ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];let s=d.createElement('script');s.src=A;s.onerror=()=>unavailable(true);d.head.appendChild(s);cal.loaded=true;}if(ar[0]===L){const api=function(){p(api,arguments)};const namespace=ar[1];api.q=api.q||[];if(typeof namespace==='string'){cal.ns[namespace]=cal.ns[namespace]||api;p(cal.ns[namespace],ar);p(cal,['initNamespace',namespace]);}else p(cal,ar);return;}p(cal,ar);};})(window,'https://app.cal.com/embed/embed.js','init');
  Cal('init',{origin:'https://cal.com'});
  Cal('on',{action:'linkReady',callback:()=>{
    ready=true;
    calendarState('ready','Calendar ready. Select a date and time.');
  }});
  Cal('on',{action:'bookingSuccessfulV2',callback:()=>{
    if(confirmed)return;
    confirmed=true;
    conversion('consultation_booked');
    const message=document.getElementById('booking-confirmation');
    message.textContent='Your consultation is booked. Cal.com will send your confirmation and meeting details.';
    message.hidden=false;
  }});
  Cal('inline',{elementOrSelector:'#cal-inline',calLink:'ivans-qbhhss/30min',config});
  Cal('ui',{hideEventTypeDetails:false,layout:'month_view',theme:'dark'});
  // The direct calendar and email links remain visible even if embedding is blocked.
  setTimeout(()=>{if(!ready)unavailable();},12000);
})();
