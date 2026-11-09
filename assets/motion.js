'use strict';
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = preference.matches;
  root.dataset.motion = reduced ? 'reduced' : 'enabled';

  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * value * (value * (value * 6 - 15) + 10);
  // On the homepage, complete content groups share the opening's scroll-driven pacing.
  // Offset geometry ignores transforms and is read only when the layout changes.
  const flow = document.querySelector('.hero-story') ? [...document.querySelectorAll([
    '#services .service-row:not(:first-child)', '.approach-layout > div:first-child',
    '.steps li', '.faq-section > div:first-child', '.faq', '.closing > *', '.footer > *'
  ].join(','))].map(target => {
    const headline = target.matches('.approach-layout > div:first-child, .faq-section > div:first-child, .closing > div:first-child');
    const control = target.matches('.closing > div:last-child, .footer > *');
    target.dataset.flow = headline ? 'headline' : control ? 'control' : 'body';
    return {target, headline, control, top: 0, focused: target.contains(document.activeElement)};
  }) : [];

  // Content stays readable at rest; movement is derived only from scroll position.
  // A focused control settles immediately instead of moving under the keyboard.
  document.addEventListener('focusin', event => {
    flow.forEach(item => {
      if (!item.target.contains(event.target)) return;
      // A focused control stays settled for the rest of this visit.
      item.focused = true;
      settle(item, 1);
    });
  });

  const onPreference = event => {
    reduced = event.matches;
    root.dataset.motion = reduced ? 'reduced' : 'enabled';
    schedule();
  };
  if (preference.addEventListener) preference.addEventListener('change', onPreference);
  else if (preference.addListener) preference.addListener(onPreference);

  // A small reading-progress line follows native scrolling. No wheel/touch interception.
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const hero = document.querySelector('.hero:not([data-story-hero]), .content-hero');
  const header = document.querySelector('.header');
  let heroStart = 0;
  let heroHeight = 1;
  let flowMaximum = 0;
  let measureNeeded = true;
  let scheduled = false;
  function settle(item, amount) {
    const mobile = window.innerWidth <= 760;
    const distance = item.control ? (mobile ? 12 : 18) : item.headline ? (mobile ? 30 : 48) : (mobile ? 22 : 34);
    const rest = 1 - amount;
    item.target.style.setProperty('--flow-y', `${(rest * distance).toFixed(2)}px`);
    item.target.style.setProperty('--flow-scale', (1 - rest * (item.headline ? 0.02 : 0)).toFixed(4));
    item.target.style.setProperty('--flow-opacity', '1');
    item.target.dataset.flowProgress = amount.toFixed(4);
  }
  function update() {
    scheduled = false;
    const measured = measureNeeded;
    if (measureNeeded) {
      flowMaximum = Math.max(0, document.body.offsetHeight - window.innerHeight);
      if (hero) {
        heroStart = hero.offsetTop - (header ? header.offsetHeight : 0);
        heroHeight = Math.max(1, hero.offsetHeight);
      }
      flow.forEach(item => {
        item.top = 0;
        for (let node = item.target; node; node = node.offsetParent) item.top += node.offsetTop;
      });
    }
    measureNeeded = false;
    const maximum = Math.max(0, root.scrollHeight - window.innerHeight);
    const amount = maximum ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
    progress.style.transform = `scaleX(${amount})`;
    const heroAmount = hero && !reduced ? Math.min(1, Math.max(0, (window.scrollY - heroStart) / heroHeight)) : 0;
    if (hero) hero.style.setProperty('--hero-progress', heroAmount.toFixed(4));
    // A wider reading-area span keeps the same travel from rushing past on one gesture.
    const mobile = window.innerWidth <= 760;
    const startY = window.innerHeight * (mobile ? 0.96 : 0.97);
    const finishY = window.innerHeight * (mobile ? 0.55 : 0.50);
    const span = startY - finishY;
    flow.forEach(item => {
      // End-of-page groups finish at the document bottom, even on a tall screen.
      const begin = Math.min(item.top - startY, flowMaximum - span);
      const end = Math.min(item.top - finishY, flowMaximum);
      const p = reduced || item.focused || end <= begin ? 1 : smooth(clamp((window.scrollY - begin) / (end - begin)));
      if (item.target.dataset.flowProgress !== p.toFixed(4)) settle(item, p);
      else if (measured) settle(item, p);
    });
    root.classList.toggle('has-scrolled', window.scrollY > 24);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }
  function measure() {
    measureNeeded = true;
    schedule();
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', measure, {passive: true});
  // Accordion and mobile-menu changes can move later groups without a window resize.
  document.addEventListener('toggle', measure, true);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(root);
  update();
})();
