'use strict';
(() => {
  if (!document.querySelector('[data-story-hero]')) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = window.matchMedia('(forced-colors: active)');
  const colors = ['#b8a0ff', '#78dce8', '#f596bd', '#c6e58b', '#efc87e', '#91b4ff'];
  const icons = {
    cursor: '<path d="m4 2 13 10-7 1-3 6z"/>',
    pause: '<path d="M7 5v14M17 5v14"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    replay: '<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const controls = document.createElement('div');
  controls.className = 'swarm-controls';
  controls.hidden = true;
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Page animation');
  controls.innerHTML = `<span class="swarm-identity" aria-hidden="true">${svg('cursor')}</span><span class="swarm-status" aria-hidden="true">Building the page</span><span class="swarm-meter" role="progressbar" aria-label="Page animation progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="swarm-meter-fill"></span></span><button type="button" class="swarm-control" data-swarm-action="tour" aria-pressed="false" title="Rebuild every section">Tour</button><button type="button" class="swarm-control" data-swarm-action="pause" aria-label="Pause animation" aria-pressed="false" title="Pause animation">${svg('pause')}</button><button type="button" class="swarm-control" data-swarm-action="replay" aria-label="Restart animation" title="Restart animation">${svg('replay')}</button><button type="button" class="swarm-control swarm-speed" data-swarm-action="speed" aria-label="Animation speed: 1 times" title="Change animation speed">1×</button><button type="button" class="swarm-control swarm-finish" data-swarm-action="finish">Go live ${svg('arrow')}</button>`;
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'swarm-replay';
  replay.innerHTML = `${svg('replay')}<span>Replay animation</span>`;
  replay.hidden = preference.matches || contrast.matches;
  const announcement = document.createElement('span');
  announcement.className = 'swarm-sr';
  announcement.setAttribute('role', 'status');
  document.body.append(controls, replay, announcement);

  const pause = controls.querySelector('[data-swarm-action="pause"]');
  const speedButton = controls.querySelector('[data-swarm-action="speed"]');
  const meter = controls.querySelector('.swarm-meter');
  const meterFill = controls.querySelector('.swarm-meter-fill');
  const tourButton = controls.querySelector('[data-swarm-action="tour"]');
  const status = controls.querySelector('.swarm-status');
  const scenes = [null, '#services', '#approach', '.faq-section', '.closing'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => 1 - Math.pow(1 - clamp(value), 3);
  const mix = (from, to, amount) => from + (to - from) * amount;
  let current = null;
  let speed = 1;
  let tour = false;
  let scene = 0;
  let moving = false;
  let interacted = false;
  let transition = 0;

  function copyAppearance(source) {
    const clone = source.cloneNode(true);
    const originals = [source, ...source.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    for (let i = 0; i < originals.length; i++) {
      const style = window.getComputedStyle(originals[i]);
      for (const property of style) copies[i].style.setProperty(property, style.getPropertyValue(property));
      for (const attribute of ['id', 'class', 'href', 'tabindex', 'autofocus', 'name']) copies[i].removeAttribute(attribute);
      copies[i].style.animation = 'none';
      copies[i].style.transition = 'none';
      if (copies[i].tagName === 'IMG') copies[i].src = originals[i].currentSrc || originals[i].src;
    }
    clone.className = 'swarm-content';
    Object.assign(clone.style, {
      position: 'relative', left: 'auto', top: 'auto', right: 'auto', bottom: 'auto',
      margin: '0', width: '100%', height: '100%', maxWidth: 'none', minWidth: '0',
      transform: 'none', transformOrigin: '0 0', opacity: '0', pointerEvents: 'none'
    });
    return clone;
  }

  function textLines(source, bounds) {
    const result = [];
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue;
        const top = rect.top - bounds.top;
        let line = result.find(item => Math.abs(item.y - top) < 3);
        if (!line) {
          line = {x: rect.left - bounds.left, y: top, right: rect.right - bounds.left, height: rect.height};
          result.push(line);
        } else {
          line.x = Math.min(line.x, rect.left - bounds.left);
          line.right = Math.max(line.right, rect.right - bounds.left);
          line.height = Math.max(line.height, rect.height);
        }
      }
    }
    range.detach();
    result.sort((a, b) => a.y - b.y);
    return result;
  }

  function visible(source, bounds) {
    if (bounds.width < 2 || bounds.height < 2 || bounds.bottom < 0 || bounds.top > window.innerHeight - 12) return false;
    for (let node = source; node && node !== document.body; node = node.parentElement) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.05) return false;
    }
    return true;
  }

  function makeTasks(fragments) {
    for (const source of document.querySelectorAll('.approach-band')) {
      const bounds = source.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) continue;
      const background = document.createElement('div');
      Object.assign(background.style, {position: 'absolute', left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, background: window.getComputedStyle(source).backgroundColor});
      fragments.appendChild(background);
    }
    const groups = scene === 0 ? [
      ['.brand-file img', 'image', 700, 650],
      ['.header > nav a', 'duplicate', 1150, 700],
      ['.nav-book, .mobile-nav > summary', 'box', 1450, 900],
      ['.hero > .eyebrow', 'text', 1650, 900],
      ['.hero h1 .title-line > span', 'heading', 2000, 1550],
      ['.hero-description', 'text', 2850, 1600],
      ['.hero .actions > a', 'box', 3850, 950],
      ['.hero-note', 'text', 4250, 1000],
      ['.hero-services .eyebrow, .hero-services h2 .title-line > span, .hero-services .section-intro > p, #services h3, #services p, #services a', 'text', 3700, 1000]
    ] : [
      ['.brand-file img', 'image', 250, 600],
      ['.header > nav a', 'duplicate', 350, 650],
      ['.nav-book, .mobile-nav > summary', 'box', 500, 700],
      ['.hero-services .eyebrow, .hero-services h2 .title-line > span, .hero-services .section-intro > p, #services h3, #services p, #services a, .approach-layout h2, .approach-layout > div > p, .steps li > span, .steps h3, .steps p, .faq-section h2, .faq-section > div > .eyebrow, .faq summary, .closing h2, .closing p, .closing a, .footer > a, .footer > div > a, .footer p', 'text', 850, 1100]
    ];
    const tasks = [];
    for (const [selector, kind, start, duration] of groups) {
      let order = 0;
      for (const source of document.querySelectorAll(selector)) {
        const bounds = source.getBoundingClientRect();
        if (!visible(source, bounds)) continue;
        const frame = document.createElement('div');
        frame.className = 'swarm-fragment';
        Object.assign(frame.style, {left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`});
        const content = copyAppearance(source);
        frame.appendChild(content);
        fragments.appendChild(frame);
        const lines = textLines(source, bounds);
        const task = {
          x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height,
          content, lines, length: Math.max(1, source.textContent.trim().length),
          kind, start: start + order * (kind === 'heading' ? 260 : 160), duration,
          color: colors[tasks.length % colors.length], progress: -1, pen: {x: 0, y: 0},
          lineWidth: lines.reduce((sum, line) => sum + line.right - line.x, 0)
        };
        tasks.push(task);
        order++;
      }
    }
    return tasks;
  }

  function reveal(task, progress) {
    const amount = task.kind === 'text' || task.kind === 'heading'
      ? Math.floor(clamp(progress) * task.length) / task.length
      : clamp(progress);
    if (amount === task.progress) return;
    task.progress = amount;
    if (amount >= 1) {
      task.content.style.opacity = '1';
      task.content.style.clipPath = 'none';
      task.content.style.transform = 'none';
      return;
    }
    task.content.style.opacity = amount > 0 ? '1' : '0';
    if (task.kind === 'heading') task.content.style.transform = `scale(${0.78 + ease(amount) * 0.22})`;
    if (task.kind === 'image') {
      task.content.style.clipPath = `inset(0 0 ${(1 - amount) * 100}% 0)`;
    } else if ((task.kind === 'text' || task.kind === 'heading') && task.lines.length) {
      let remaining = task.lineWidth * amount;
      let activeLine = task.lines[0];
      for (const line of task.lines) {
        activeLine = line;
        if (remaining <= line.right - line.x) break;
        remaining -= line.right - line.x;
      }
      const right = activeLine.x + Math.max(0, remaining);
      const top = Math.max(0, activeLine.y - 3);
      const bottom = activeLine.y + activeLine.height + 3;
      task.content.style.clipPath = `polygon(0 0,100% 0,100% ${top}px,${right}px ${top}px,${right}px ${bottom}px,0 ${bottom}px)`;
    } else {
      task.content.style.clipPath = `inset(0 ${(1 - ease(amount)) * 100}% 0 0)`;
    }
  }

  function penPosition(task, progress) {
    let remaining = task.lineWidth * clamp(progress);
    for (const line of task.lines) {
      const width = line.right - line.x;
      if (remaining <= width) {
        task.pen.x = task.x + line.x + remaining;
        task.pen.y = task.y + line.y + line.height / 2;
        return task.pen;
      }
      remaining -= width;
    }
    task.pen.x = task.x + task.width * clamp(progress);
    task.pen.y = task.y + task.height;
    return task.pen;
  }

  function drawSelection(ctx, task, time) {
    const age = time - task.start;
    if (age < 0 || age > task.duration + 350) return;
    const trace = clamp(age / 420);
    const fade = 1 - clamp((age - task.duration) / 350);
    const x = task.x - 5, y = task.y - 4, width = task.width + 10, height = task.height + 8;
    ctx.save();
    ctx.globalAlpha = fade * 0.8;
    ctx.strokeStyle = '#719cff';
    ctx.fillStyle = '#719cff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x, y, width * trace, height * trace);
    ctx.setLineDash([]);
    if (trace > 0.95) {
      for (const px of [x, x + width]) for (const py of [y, y + height]) ctx.fillRect(px - 2, py - 2, 4, 4);
      if (task.kind === 'heading' || task.kind === 'box') {
        const label = `${Math.round(task.width)} × ${Math.round(task.height)}`;
        ctx.font = '10px ui-monospace, monospace';
        const labelWidth = ctx.measureText(label).width + 12;
        ctx.fillStyle = '#719cff';
        ctx.fillRect(x + width - labelWidth, y + height + 5, labelWidth, 18);
        ctx.fillStyle = '#0b0b0d';
        ctx.fillText(label, x + width - labelWidth + 6, y + height + 17);
      }
    }
    if (task.kind === 'heading' && age < 650) {
      ctx.globalAlpha = fade * 0.22;
      ctx.strokeStyle = '#f596bd';
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(window.innerWidth, y);
      ctx.moveTo(x, 0); ctx.lineTo(x, window.innerHeight);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCursor(ctx, cursor, alpha, mode) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = cursor.color;
    ctx.fillStyle = cursor.color;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < cursor.trail.length; i++) {
      const point = cursor.trail[i];
      ctx.globalAlpha = alpha * (i / cursor.trail.length) * 0.35;
      ctx.beginPath();
      ctx.moveTo(point.x - 2, point.y); ctx.lineTo(point.x + 2, point.y);
      ctx.moveTo(point.x, point.y - 2); ctx.lineTo(point.x, point.y + 2);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.translate(cursor.x, cursor.y);
    ctx.beginPath();
    if (mode === 'text') {
      ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.moveTo(-3, 7); ctx.lineTo(3, 7);
      ctx.stroke();
    } else if (mode === 'crosshair') {
      ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6);
      ctx.stroke();
    } else {
      ctx.moveTo(0, 0); ctx.lineTo(3, 16); ctx.lineTo(7, 11); ctx.lineTo(12, 10); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0b0b0d';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  }

  function render(state, time) {
    const {ctx, width, height, tasks, cursors, center} = state;
    ctx.clearRect(0, 0, width, height);
    for (const task of tasks) {
      reveal(task, (time - task.start - 420) / (task.duration - 420));
      drawSelection(ctx, task, time);
    }
    const scatter = ease((time - state.duration + 1100) / 950);
    for (let i = 0; i < cursors.length; i++) {
      const cursor = cursors[i];
      const angle = i * 2.39996 + time * 0.0011;
      const radius = 34 + (i % 4) * 18;
      const orbitX = center.x + Math.cos(angle) * radius;
      const orbitY = center.y + Math.sin(angle) * radius * 0.65;
      const task = tasks[i % tasks.length];
      const travel = ease((time - (task.start - 650)) / 650);
      const age = time - task.start;
      let destinationX = task.x - 5, destinationY = task.y - 4;
      let mode = 'arrow';
      if (age >= 0 && age < 420) {
        destinationX += (task.width + 10) * clamp(age / 420);
        destinationY += (task.height + 8) * clamp(age / 420);
        mode = 'crosshair';
      } else if (age >= 420 && age < task.duration) {
        const amount = clamp((age - 420) / (task.duration - 420));
        if ((task.kind === 'text' || task.kind === 'heading') && task.lines.length) {
          const pen = penPosition(task, amount);
          destinationX = pen.x; destinationY = pen.y;
          mode = 'text';
        } else {
          destinationX = task.x + task.width * amount;
          destinationY = task.y + task.height * (task.kind === 'image' ? amount : 0.65);
        }
      } else if (age >= task.duration) {
        const idle = (age - task.duration) * 0.002 + i;
        destinationX = task.x + task.width / 2 + Math.cos(idle) * 24;
        destinationY = task.y + task.height + 30 + Math.sin(idle * 0.8) * 15;
      }
      if (i >= tasks.length) {
        destinationX += Math.cos(angle + i) * 30;
        destinationY += Math.sin(angle + i) * 28;
        mode = 'arrow';
      }
      const endAngle = i / cursors.length * Math.PI * 2;
      const escapeX = width / 2 + Math.cos(endAngle) * width * 0.75;
      const escapeY = height / 2 + Math.sin(endAngle) * height * 0.85;
      cursor.x = mix(mix(orbitX, destinationX, travel), escapeX, scatter);
      cursor.y = mix(mix(orbitY, destinationY, travel), escapeY, scatter);
      const point = cursor.trail.shift();
      point.x = cursor.x;
      point.y = cursor.y;
      cursor.trail.push(point);
      drawCursor(ctx, cursor, 1 - scatter * 0.85, mode);
    }
    if (scene === 0 && time < 950) {
      ctx.save();
      ctx.globalAlpha = 1 - ease((time - 600) / 350);
      const logo = state.logo;
      if (logo.complete && logo.naturalWidth) {
        const logoHeight = 46 * logo.naturalHeight / logo.naturalWidth;
        ctx.filter = 'invert(1)';
        ctx.drawImage(logo, center.x - 23, center.y - logoHeight / 2, 46, logoHeight);
      }
      ctx.restore();
    }
    const amount = Math.min(100, Math.floor(time / state.duration * 100));
    meterFill.style.transform = `scaleX(${amount / 100})`;
    if (amount - state.reported >= 10) { meter.setAttribute('aria-valuenow', String(amount)); state.reported = amount; }
    state.layer.dataset.progress = String(amount);
  }

  function schedule(state) {
    if (state.paused || document.hidden || current !== state) return;
    state.frame = window.requestAnimationFrame(now => {
      if (current !== state) return;
      const delta = state.last ? Math.min(64, now - state.last) : 0;
      state.last = now;
      state.time += delta * speed;
      try {
        render(state, state.time);
        if (state.time >= state.duration) {
          if (tour && scene < scenes.length - 1) nextScene();
          else finish(false);
        }
        else schedule(state);
      } catch {
        finish(true);
      }
    });
  }

  function finish(immediate = true, continuing = false) {
    if (!continuing) {
      transition++;
      moving = false;
      tour = false;
      tourButton.setAttribute('aria-pressed', 'false');
    }
    const state = current;
    if (!state) return;
    current = null;
    window.cancelAnimationFrame(state.frame);
    const focused = controls.contains(document.activeElement);
    controls.hidden = true;
    replay.hidden = preference.matches || contrast.matches;
    if (!continuing) announcement.textContent = 'Animation finished. The page is ready.';
    if (immediate) state.layer.remove();
    else {
      state.layer.classList.add('is-leaving');
      window.setTimeout(() => state.layer.remove(), 260);
    }
    if (focused && !continuing) {
      const target = replay.hidden ? document.querySelector('.brand-file') : replay;
      target.focus({preventScroll: true});
    }
  }

  function start() {
    if (preference.matches || contrast.matches || document.hidden || (scene === 0 && window.scrollY > 8)) return;
    finish(true, true);
    const layer = document.createElement('div');
    layer.className = 'swarm-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    const fragments = document.createElement('div');
    fragments.className = 'swarm-fragments';
    const canvas = document.createElement('canvas');
    canvas.className = 'swarm-canvas';
    layer.append(fragments, canvas);
    document.body.appendChild(layer);
    try {
      if (window.getComputedStyle(layer).position !== 'fixed') { layer.remove(); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { layer.remove(); return; }
      const width = window.innerWidth, height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.scale(ratio, ratio);
      const tasks = makeTasks(fragments);
      if (!tasks.length) { layer.remove(); return; }
      const state = {
        layer, ctx, width, height, tasks, logo: document.querySelector('.brand-file img'), center: {x: width / 2, y: height * 0.43},
        cursors: Array.from({length: width < 600 ? 14 : 24}, (_, i) => ({x: width / 2, y: height * 0.43, color: colors[i % colors.length], trail: Array.from({length: 7}, () => ({x: width / 2, y: height * 0.43}))})),
        time: 0, last: 0, frame: 0, paused: false, reported: -10,
        duration: Math.max(scene === 0 ? 6400 : 4000, ...tasks.map(task => task.start + task.duration + 800))
      };
      current = state;
      controls.hidden = false;
      replay.hidden = true;
      status.textContent = tour ? `Building ${scene + 1} / ${scenes.length}` : 'Building the page';
      tourButton.setAttribute('aria-pressed', String(tour));
      pause.innerHTML = svg('pause');
      pause.setAttribute('aria-label', 'Pause animation');
      pause.setAttribute('title', 'Pause animation');
      pause.setAttribute('aria-pressed', 'false');
      announcement.textContent = tour ? `Rebuilding section ${scene + 1} of ${scenes.length}. Scroll or press Escape to end the tour.` : 'The page is being rebuilt by a cursor swarm. Scroll or press Escape to skip.';
      render(state, 0);
      schedule(state);
    } catch {
      layer.remove();
      finish(true);
    }
  }

  function restart() {
    const restoreFocus = controls.contains(document.activeElement) || document.activeElement === replay;
    finish(true);
    scene = 0;
    const token = transition;
    moving = true;
    window.scrollTo({top: 0, behavior: 'instant'});
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (token !== transition) return;
      moving = false;
      start();
      if (current && restoreFocus) pause.focus({preventScroll: true});
    }));
  }

  function nextScene() {
    const focused = controls.contains(document.activeElement) ? document.activeElement : null;
    finish(true, true);
    moving = true;
    scene++;
    const token = transition;
    document.querySelector(scenes[scene]).scrollIntoView({behavior: 'instant', block: 'start'});
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (token !== transition) return;
      moving = false;
      start();
      if (current && focused) focused.focus({preventScroll: true});
    }));
  }

  controls.addEventListener('click', event => {
    const action = event.target.closest('[data-swarm-action]')?.dataset.swarmAction;
    if (action === 'finish') finish(true);
    if (action === 'replay') restart();
    if (action === 'tour' && current) {
      tour = !tour;
      tourButton.setAttribute('aria-pressed', String(tour));
      status.textContent = tour ? `Building ${scene + 1} / ${scenes.length}` : 'Building the page';
    }
    if (action === 'speed') {
      speed = speed === 3 ? 1 : speed + 1;
      speedButton.textContent = `${speed}×`;
      speedButton.setAttribute('aria-label', `Animation speed: ${speed} times`);
    }
    if (action === 'pause' && current) {
      current.paused = !current.paused;
      window.cancelAnimationFrame(current.frame);
      current.last = 0;
      pause.innerHTML = svg(current.paused ? 'play' : 'pause');
      pause.setAttribute('aria-label', current.paused ? 'Resume animation' : 'Pause animation');
      pause.setAttribute('title', current.paused ? 'Resume animation' : 'Pause animation');
      pause.setAttribute('aria-pressed', String(current.paused));
      schedule(current);
    }
  });
  replay.addEventListener('click', restart);
  document.addEventListener('keydown', event => {
    interacted = true;
    if (event.key === 'Escape' || (event.key === 'Tab' && !controls.contains(event.target))) finish(true);
  });
  document.addEventListener('focusin', event => {
    if (!controls.contains(event.target)) {
      interacted = true;
      finish(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    interacted = true;
    if (!controls.contains(event.target) && !replay.contains(event.target)) finish(true);
  }, {passive: true});
  window.addEventListener('scroll', () => { if (!moving) { interacted = true; finish(true); } }, {passive: true});
  window.addEventListener('wheel', () => finish(true), {passive: true});
  window.addEventListener('touchmove', () => finish(true), {passive: true});
  window.addEventListener('resize', () => finish(true), {passive: true});
  window.addEventListener('pagehide', () => finish(true));
  document.addEventListener('visibilitychange', () => {
    if (!current) return;
    window.cancelAnimationFrame(current.frame);
    current.last = 0;
    schedule(current);
  });
  const onPreference = () => {
    finish(true);
    replay.hidden = preference.matches || contrast.matches;
  };
  preference.addEventListener('change', onPreference);
  contrast.addEventListener('change', onPreference);

  const navigation = performance.getEntriesByType('navigation')[0];
  if (location.hash || new URLSearchParams(location.search).has('section') || navigation?.type === 'back_forward') return;
  const startup = transition;
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([ready, new Promise(resolve => window.setTimeout(resolve, 650))]).then(() => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => { if (!interacted && startup === transition) start(); }));
  });
})();
