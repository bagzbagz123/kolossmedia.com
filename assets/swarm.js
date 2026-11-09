'use strict';
(() => {
  const story = document.querySelector('.hero-story');
  if (!story) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = window.matchMedia('(forced-colors: active)');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'swarm-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  if (window.getComputedStyle(canvas).position !== 'fixed') { canvas.remove(); return; }

  const colors = ['#b8a0ff', '#78dce8', '#f596bd', '#c6e58b', '#efc87e', '#91b4ff'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => 1 - Math.pow(1 - clamp(value), 3);
  const selector = [
    '.hero h1 .title-line > span', '.hero-evidence .archive-crop',
    '.hero-services h2 .title-line > span', '.service-row h3',
    '.approach-layout h2', '.faq-section h2', '.closing h2'
  ].join(',');
  const tasks = Array.from(document.querySelectorAll(selector), (source, index) => ({
    source, color: colors[index % colors.length], lines: [], top: 0, begin: 0, end: 1,
    progress: 1, settled: false, text: !source.matches('.archive-crop'),
    hero: !!source.closest('.hero'), intro: !!source.closest('.hero-services'),
    group: source.closest('.service-row, .steps li, .faq-section, .closing, .hero-services, .approach-layout > div'),
    box: null, pen: {x: 0, y: 0}
  }));
  let width = 0, height = 0, maximum = 0, frame = 0, layoutFrame = 0;
  let lastScroll = window.scrollY;
  let disabled = preference.matches || contrast.matches;

  function restore(task) {
    task.source.dataset.swarmProgress = '1.0000';
  }

  function clear() {
    ctx.clearRect(0, 0, width, height);
    canvas.hidden = true;
    canvas.dataset.activeCount = '0';
  }

  function linesFor(source, box) {
    const lines = [];
    if (box.width < 1 || box.height < 1) return lines;
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue;
        const top = (rect.top - box.top) / box.height;
        let line = lines.find(item => Math.abs(item.y - top) * box.height < 3);
        if (!line) {
          line = {x: (rect.left - box.left) / box.width, y: top, right: (rect.right - box.left) / box.width, bottom: (rect.bottom - box.top) / box.height};
          lines.push(line);
        } else {
          line.x = Math.min(line.x, (rect.left - box.left) / box.width);
          line.right = Math.max(line.right, (rect.right - box.left) / box.width);
          line.bottom = Math.max(line.bottom, (rect.bottom - box.top) / box.height);
        }
      }
    }
    range.detach();
    lines.sort((a, b) => a.y - b.y);
    return lines;
  }

  function measure() {
    width = window.innerWidth;
    height = window.innerHeight;
    maximum = Math.max(0, document.documentElement.scrollHeight - height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const span = height * 0.42;
    for (const task of tasks) {
      task.top = 0;
      for (let node = task.source; node; node = node.offsetParent) task.top += node.offsetTop;
      task.begin = Math.min(task.top - height * 0.97, maximum - span);
      task.end = Math.min(task.top - height * 0.55, maximum);
      task.box = task.source.getBoundingClientRect();
      task.lines = linesFor(task.source, task.box);
      task.lineWidth = task.lines.reduce((sum, line) => sum + line.right - line.x, 0);
    }
    clear();
  }

  function layout() {
    if (layoutFrame) return;
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0;
      measure();
      for (const task of tasks) restore(task);
    });
  }

  function progressFor(task, y) {
    if (task.settled || !maximum) return 1;
    if (story.dataset.pin === 'true' && (task.hero || task.intro)) {
      const p = Number(story.dataset.progress) || 0;
      if (task.hero) return clamp(p / 0.60);
      if (task.source.closest('h2')) return clamp((p - 0.57) / 0.37);
      return clamp((p - 0.29) / 0.46);
    }
    if (task.hero) return 1;
    return task.end <= task.begin ? 1 : clamp((y - task.begin) / (task.end - task.begin));
  }

  function penFor(task, amount) {
    let remaining = task.lineWidth * amount;
    const box = task.box;
    for (const line of task.lines) {
      const length = line.right - line.x;
      if (remaining <= length) {
        task.pen.x = box.left + (line.x + remaining) * box.width;
        task.pen.y = box.top + (line.y + line.bottom) * box.height / 2;
        return task.pen;
      }
      remaining -= length;
    }
    task.pen.x = box.left + box.width * amount;
    task.pen.y = box.top + box.height / 2;
    return task.pen;
  }

  function reveal(task, progress) {
    task.source.dataset.swarmProgress = progress.toFixed(4);
  }

  function cursor(x, y, color, mode, alpha, dx, dy) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.2;
    for (let i = 6; i > 0; i--) {
      const tx = x - dx * i, ty = y - dy * i;
      ctx.globalAlpha = alpha * (1 - i / 7) * 0.28;
      ctx.beginPath();
      ctx.moveTo(tx - 2, ty); ctx.lineTo(tx + 2, ty);
      ctx.moveTo(tx, ty - 2); ctx.lineTo(tx, ty + 2);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
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

  function draw(task, index) {
    const p = task.progress, box = task.box;
    const alpha = Math.min(1, p * 12, (1 - p) * 10);
    const x = box.left - 5, y = box.top - 4, w = box.width + 10, h = box.height + 8;
    const trace = ease(p / 0.28);
    ctx.save();
    ctx.strokeStyle = task.color;
    ctx.fillStyle = task.color;
    ctx.globalAlpha = alpha * 0.38;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x, y, w * trace, h * trace);
    ctx.setLineDash([]);
    if (trace > 0.98) {
      for (const px of [x, x + w]) for (const py of [y, y + h]) ctx.fillRect(px - 2, py - 2, 4, 4);

    }
    ctx.restore();
    const amount = clamp((p - 0.10) / 0.80);
    const pen = penFor(task, amount);
    const fromX = index % 2 ? width + 24 : -24;
    const fromY = Math.max(100, Math.min(height - 30, box.top - 70));
    const travel = ease(p / 0.30);
    const penX = p < 0.22 ? x + w * trace : pen.x;
    const penY = p < 0.22 ? y + h * trace : pen.y;
    const cx = fromX + (penX - fromX) * travel;
    const cy = fromY + (penY - fromY) * travel;
    cursor(cx, cy, task.color, p < 0.22 ? 'crosshair' : task.text ? 'text' : 'arrow', alpha, 5 + index % 3, 2);
    const angle = p * Math.PI * 3 + index * 1.7;
    cursor(cx + Math.cos(angle) * 28, cy + Math.sin(angle) * 22 + 18, colors[(index + 2) % colors.length], 'arrow', alpha * 0.85, -4, 3);
  }

  function update() {
    frame = 0;
    const y = window.scrollY;
    if (disabled || document.hidden || y === lastScroll) return;
    lastScroll = y;
    try {
      ctx.clearRect(0, 0, width, height);
      for (const task of tasks) {
        task.progress = progressFor(task, y);
        task.box = task.source.getBoundingClientRect();
      }
      let count = 0;
      const limit = width < 600 ? 4 : 7;
      ctx.save();
      ctx.beginPath();
      const headerHeight = document.querySelector('.header').offsetHeight;
      ctx.rect(0, headerHeight + 4, width, height - headerHeight);
      ctx.clip();
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i], box = task.box;
        reveal(task, task.progress);
        if (count >= limit || task.settled || task.progress <= 0 || task.progress >= 1 || box.bottom < 90 || box.top > height || box.width < 1) continue;
        if (task.hero && story.dataset.scene !== 'opening') continue;
        draw(task, i);
        count++;
      }
      ctx.restore();
      canvas.hidden = count === 0;
      canvas.dataset.activeCount = String(count);
      canvas.dataset.scrollY = String(y);
    } catch {
      disabled = true;
      clear();
      for (const task of tasks) restore(task);
    }
  }

  function scroll() {
    if (!frame && !disabled && !document.hidden) frame = window.requestAnimationFrame(update);
  }

  function settle(event) {
    for (const task of tasks) {
      if (task.source.contains(event.target) || task.group?.contains(event.target)) {
        task.settled = true;
        restore(task);
      }
    }
    clear();
  }

  function onPreference() {
    disabled = preference.matches || contrast.matches;
    window.cancelAnimationFrame(frame);
    frame = 0;
    clear();
    for (const task of tasks) restore(task);
    lastScroll = window.scrollY;
    layout();
  }

  canvas.hidden = true;
  measure();
  window.addEventListener('scroll', scroll, {passive: true});
  window.addEventListener('resize', layout, {passive: true});
  document.addEventListener('toggle', layout, true);
  document.addEventListener('focusin', settle);
  document.addEventListener('pointerdown', settle, {passive: true});
  document.addEventListener('visibilitychange', clear);
  preference.addEventListener('change', onPreference);
  contrast.addEventListener('change', onPreference);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(document.body);
  if (document.fonts) document.fonts.ready.then(layout);
  window.addEventListener('load', layout, {once: true});
})();
