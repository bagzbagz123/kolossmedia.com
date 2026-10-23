'use strict';
(() => {
  const story = document.querySelector('.hero-story');
  if (!story) return;
  const stage = story.querySelector('.hero-stage');
  const hero = story.querySelector('.hero');
  const grid = story.querySelector('.hero-grid');
  const eyebrow = hero.querySelector('.eyebrow');
  const title = hero.querySelector('h1');
  const intro = story.querySelector('.hero-services .section-intro');
  const nextTitle = intro.querySelector('h2');
  const services = document.getElementById('services');
  const header = document.querySelector('.header');
  const owner = story.parentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = (value, start, end) => {
    const t = clamp((value - start) / (end - start));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  let reduced = preference.matches;
  let enabled = false;
  let start = 0, distance = 1, dx = 0, dy = 0, scale = 1;
  let scheduled = false, measureNeeded = true;

  function position(element, ancestor = null) {
    let left = 0, top = 0;
    for (let node = element; node && node !== ancestor; node = node.offsetParent) {
      left += node.offsetLeft;
      top += node.offsetTop;
    }
    return {left, top};
  }
  function measure() {
    const top = header.offsetHeight;
    const height = Math.max(0, window.innerHeight - top);
    const contentHeight = grid.offsetHeight + eyebrow.offsetHeight + parseFloat(window.getComputedStyle(eyebrow).marginBottom) + 48;
    enabled = !reduced && !!window.CSS?.supports('position', 'sticky') && height >= 360 && height >= contentHeight;
    story.dataset.pin = String(enabled);
    const padding = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || top;
    if (!enabled) {
      story.dataset.progress = '0.0000';
      story.dataset.scene = 'opening';
      story.dataset.servicesReady = 'true';
      services.style.setProperty('--story-service-lift', '0px');
      services.style.setProperty('--story-services-opacity', '1');
      const offset = position(services).top - position(nextTitle).top + top + 24 - padding;
      owner.style.setProperty('--story-anchor-offset', `${Math.max(0, offset)}px`);
      return;
    }
    const mobile = window.innerWidth <= 760;
    distance = Math.round(Math.min(860, Math.max(320, height * (mobile ? 0.70 : 0.86))));
    owner.style.setProperty('--story-top', `${top}px`);
    owner.style.setProperty('--story-height', `${height}px`);
    owner.style.setProperty('--story-distance', `${distance}px`);
    const introTop = Math.round(Math.min(96, Math.max(40, height * (mobile ? 0.07 : 0.09))));
    owner.style.setProperty('--story-intro-top', `${introTop}px`);
    const overlap = Math.max(0, height - introTop - intro.offsetHeight - 32);
    owner.style.setProperty('--story-overlap', `${overlap}px`);
    owner.style.setProperty('--story-anchor-offset', `${Math.max(0, top + height - overlap - padding)}px`);
    start = position(story).top - top;
    const from = position(title, stage), to = position(nextTitle, stage);
    dx = to.left - from.left;
    dy = to.top - from.top;
    scale = Math.min(0.9, parseFloat(window.getComputedStyle(nextTitle).fontSize) / parseFloat(window.getComputedStyle(title).fontSize));
  }
  function update() {
    scheduled = false;
    if (measureNeeded) { measure(); measureNeeded = false; }
    if (!enabled) return;
    const p = clamp((window.scrollY - start) / distance);
    // Use the full scene for movement rather than a quick change followed by a hold.
    const travel = ease(p, 0.02, 0.57);
    const copyOut = ease(p, 0.02, 0.32);
    const headingOut = ease(p, 0.24, 0.46);
    const swap = ease(p, 0.46, 0.90);
    const secondLine = ease(p, 0.50, 0.98);
    // Bring the list into the scene without shortening the headline's slow handoff.
    // Its gap stays bounded; the curve never reverses and joins native flow smoothly.
    const remaining = distance * (1 - p);
    const gapLimit = window.innerWidth <= 760 ? 64 : 100;
    const gap = remaining * gapLimit / (remaining + gapLimit);
    const listOpacity = ease(p, 0.28, 0.52);
    services.style.setProperty('--story-service-lift', `${(remaining - gap).toFixed(2)}px`);
    services.style.setProperty('--story-services-opacity', listOpacity.toFixed(4));
    story.dataset.servicesReady = String(listOpacity >= 0.1);
    story.dataset.progress = p.toFixed(4);
    story.dataset.scene = p < 0.32 ? 'opening' : 'services';
    story.style.setProperty('--story-x', `${(dx * travel).toFixed(2)}px`);
    story.style.setProperty('--story-y', `${(dy * travel).toFixed(2)}px`);
    story.style.setProperty('--story-scale', (1 + (scale - 1) * travel).toFixed(4));
    story.style.setProperty('--story-swap', swap.toFixed(4));
    story.style.setProperty('--story-swap-second', secondLine.toFixed(4));
    story.style.setProperty('--story-heading-out', headingOut.toFixed(4));
    story.style.setProperty('--story-copy-out', copyOut.toFixed(4));
    story.style.setProperty('--story-label', ease(p, 0.25, 0.55).toFixed(4));
    story.style.setProperty('--story-detail', ease(p, 0.27, 0.72).toFixed(4));
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }
  function resize() { measureNeeded = true; schedule(); }
  // Restoring a focused hero action also clears the service content behind it.
  story.dataset.heroFocus = String(stage.contains(document.activeElement));
  stage.addEventListener('focusin', () => { story.dataset.heroFocus = 'true'; });
  stage.addEventListener('focusout', event => {
    if (!stage.contains(event.relatedTarget)) story.dataset.heroFocus = 'false';
  });
  // Tabbing into the early preview reveals the complete services section immediately.
  // Pointer focus keeps the link in place through its click.
  services.addEventListener('focusin', event => {
    if (enabled && window.scrollY < start + distance && event.target.matches?.(':focus-visible')) {
      services.scrollIntoView({behavior: 'instant'});
      update();
    }
  });
  const change = event => { reduced = event.matches; measureNeeded = true; update(); };
  if (preference.addEventListener) preference.addEventListener('change', change);
  else if (preference.addListener) preference.addListener(change);
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', resize, {passive: true});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(grid);
    observer.observe(intro);
  }
  update();

  // Keep existing deep links and section-query redirects correct after pin geometry is added.
  const hash = window.location.hash.slice(1);
  const section = new URLSearchParams(window.location.search).get('section');
  const target = hash || section;
  if (['services', 'work', 'campaigns', 'websites', 'approach', 'packages'].includes(target)) {
    window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({behavior: 'instant'}));
  }
})();
