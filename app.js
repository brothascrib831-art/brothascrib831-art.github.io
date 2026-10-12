(() => {
  const SITE = window.BC_SITE || {};
  const ALL = (window.BC_VIDEOS || []).slice();
  const SOC = SITE.socials || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAY = 864e5;

  /* ---------- data helpers ---------- */
  // Shorts have no upload date on the channel page, so give them an order key that follows the
  // channel's newest-first order (only used for sorting, never shown).
  const shorts = ALL.filter(v => v.type === 'short');
  const newest = Math.max(...ALL.filter(v => v.date).map(v => Date.parse(v.date)));
  shorts.forEach((v, i) => { v._t = newest - i * 2.6 * DAY; });
  ALL.forEach(v => { if (v.date) v._t = Date.parse(v.date); });

  const byNew = (a, b) => b._t - a._t;
  const byViews = (a, b) => b.views - a.views;

  const fmt = n => {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e5) return Math.round(n / 1e3) + 'K';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };
  const ago = d => {
    const days = Math.floor((Date.now() - Date.parse(d)) / DAY);
    const unit = (n, w) => `${n} ${w}${n === 1 ? '' : 's'} ago`;
    if (days < 1) return 'today';
    if (days < 2) return 'yesterday';
    if (days < 7) return unit(days, 'day');
    if (days < 30) return unit(Math.round(days / 7), 'week');
    if (days < 365) return unit(Math.round(days / 30), 'month');
    return unit(Math.round(days / 365), 'year');
  };
  const url = v => v.type === 'short' ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
  const img = (v, eager) => `<img src="img/thumbs/${esc(v.id)}.jpg" alt="" ${eager ? '' : 'loading="lazy"'} data-id="${esc(v.id)}">`;
  const views = v => `${fmt(v.views)} view${v.views === 1 ? '' : 's'}`;
  const meta = (v, withGame = true, withType = false) => [withGame && v.game, withType && v.type === 'short' && 'Short', views(v), v.date && ago(v.date)].filter(Boolean).map(esc).join(' &middot; ');
  const typeTag = v => v.type === 'short' ? '<span class="tag tag--short">Short</span>' : v.type === 'stream' ? '<span class="tag tag--stream">Stream</span>' : '';
  const link = v => `href="${url(v)}" target="_blank" rel="noopener"`;

  // Thumbnails ship in img/thumbs. A video added later without a local file falls back to YouTube's copy.
  document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName === 'IMG' && t.dataset.id && !t.dataset.fb) {
      t.dataset.fb = '1';
      t.src = `https://i.ytimg.com/vi/${t.dataset.id}/hqdefault.jpg`;
    }
  }, true);

  const games = (() => {
    const m = new Map();
    ALL.forEach(v => { if (v.game) m.set(v.game, (m.get(v.game) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  })();
  const gameCount = g => ALL.filter(v => v.game === g).length;

  /* ---------- socials ---------- */
  const ICONS = {
    youtube: '<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/>',
    twitch: '<path d="M11.57 4.71h1.72v5.15h-1.72zm4.72 0H18v5.15h-1.71zM6 0 1.71 4.29v15.42h5.15V24l4.28-4.29h3.43L22.29 12V0zm14.57 11.14-3.43 3.43h-3.43l-3 3v-3H6.86V1.71h13.71z"/>',
    discord: '<path d="M20.32 4.37A19.8 19.8 0 0 0 15.39 2.8l-.62 1.27a18.3 18.3 0 0 0-5.53 0L8.61 2.8a19.7 19.7 0 0 0-4.94 1.57C.53 9.05-.32 13.6.1 18.09a19.9 19.9 0 0 0 6.07 3.07l1.3-2.05a12.9 12.9 0 0 1-2.05-.98l.5-.39a14.2 14.2 0 0 0 12.16 0l.5.39c-.65.39-1.34.72-2.05.98l1.3 2.05a19.8 19.8 0 0 0 6.07-3.07c.5-5.2-.84-9.71-3.58-13.72zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.19 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.95 2.42-2.16 2.42z"/>',
    tiktok: '<path d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.4 6.2V8.6a8 8 0 0 0 4.6 1.5V6.7A4.6 4.6 0 0 1 16.6 2z"/>',
    instagram: '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/>',
    x: '<path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.3zm-1.2 17.9h1.9L6.8 4.2H4.8z"/>'
  };
  const NAMES = { youtube: 'YouTube', twitch: 'Twitch', discord: 'Discord', tiktok: 'TikTok', instagram: 'Instagram', x: 'X' };
  const live = Object.keys(NAMES).filter(k => SOC[k]);

  $$('[data-socials]').forEach(box => {
    const labels = box.hasAttribute('data-labels') || box.closest('.footer');
    box.innerHTML = live.map(k => `<a class="social" href="${esc(SOC[k])}" target="_blank" rel="noopener" aria-label="BrothasCrib on ${NAMES[k]}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>${labels ? `<span>${NAMES[k]}</span>` : ''}</a>`).join('');
  });
  $$('[data-link]').forEach(a => {
    const href = SOC[a.dataset.link];
    if (href) a.href = href; else a.hidden = true;
  });

  /* ---------- trending strip + hero ---------- */
  $('#trending').innerHTML = (SITE.trending || []).filter(gameCount)
    .map(g => `<button type="button" data-game="${esc(g)}">${esc(g)}</button>`).join('');

  const quick = [
    { label: 'AION 2 builds', q: 'aion build' },
    { label: 'BrothasCrib Reacts', q: 'react' },
    { label: "Dragon's Dogma 2", game: "Dragon's Dogma 2" },
    { label: 'Stream VODs', type: 'stream' }
  ];
  $('#hero-quick').innerHTML = '<span>Popular:</span>' + quick.map((c, i) => `<button class="chip" type="button" data-quick="${i}">${esc(c.label)}</button>`).join('');
  $('#hero-q').placeholder = `Search ${ALL.length} videos, shorts and streams across ${games.length} games`;

  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const streamDays = SITE.streamDays || [];
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const total = ALL.reduce((s, v) => s + v.views, 0);
  $('#hero-stats').innerHTML = [
    ['Uploads', ALL.length],
    ['Total views', fmt(total)],
    ['Games covered', games.length],
    ['Live', weekOrder.filter(d => streamDays.includes(d)).map(d => dayShort[d]).join(' / ') || 'Soon']
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');

  /* ---------- featured games + most watched ---------- */
  $('#featured-games').innerHTML = (SITE.featuredGames || []).filter(gameCount).map(g => {
    const items = ALL.filter(v => v.game === g);
    const cover = items.filter(v => v.type === 'video').sort(byNew)[0] || items.sort(byViews)[0];
    const n = items.length;
    return `<button class="game" type="button" data-game="${esc(g)}" aria-label="Show all ${n} ${esc(g)} uploads">
      ${img(cover, true)}
      <span class="game__body">
        <span><span class="game__name">${esc(g)}</span><span class="game__count" style="display:block">${n} uploads &middot; ${fmt(items.reduce((s, v) => s + v.views, 0))} views</span></span>
        <span class="game__go">Watch</span>
      </span>
    </button>`;
  }).join('');

  $('#most-watched').innerHTML = ALL.slice().sort(byViews).slice(0, 6).map((v, i) => `
    <li><a ${link(v)}>
      <span class="ranked__n">${i + 1}</span>
      <span class="ranked__thumb">${img(v)}</span>
      <span><span class="ranked__title">${esc(v.title)}</span><span class="ranked__meta" style="display:block">${meta(v, true, true)}</span></span>
    </a></li>`).join('');

  /* ---------- tabbed feed ---------- */
  function renderFeed(kind) {
    let list = ALL.slice().sort(byNew);
    if (kind === 'stream') list = list.filter(v => v.type === 'stream');
    else if (kind !== 'latest') list = list.filter(v => v.kind === kind);
    const lead = list.find(v => v.type !== 'short') || list[0];
    const rest = list.filter(v => v !== lead).slice(0, 4);
    $('#feed-body').innerHTML = !lead ? '<p class="empty">Nothing here yet.</p>' : `
      <a class="lead" ${link(lead)}>
        <span class="lead__media">${img(lead)}${lead.len ? `<span class="dur">${esc(lead.len)}</span>` : ''}<span class="play"></span></span>
        <span class="lead__meta">${typeTag(lead) || '<span class="tag">Video</span>'}${lead.game ? `<span class="tag">${esc(lead.game)}</span>` : ''}</span>
        <span class="lead__title">${esc(lead.title)}</span>
        <span class="lead__meta">${meta(lead, false)}</span>
      </a>
      <div class="feed__list">${rest.map(v => `
        <a class="item" ${link(v)}>
          <span class="item__media">${img(v)}${v.len ? `<span class="dur">${esc(v.len)}</span>` : ''}</span>
          <span class="item__body">
            <span class="item__title">${esc(v.title)}</span>
            <span class="item__meta">${typeTag(v)}${meta(v)}</span>
          </span>
        </a>`).join('')}
      </div>`;
  }
  $('#feed-tabs').addEventListener('click', e => {
    const b = e.target.closest('[role="tab"]');
    if (!b) return;
    $$('[role="tab"]', e.currentTarget).forEach(t => t.setAttribute('aria-selected', String(t === b)));
    $('#feed-body').setAttribute('aria-labelledby', b.id);
    renderFeed(b.dataset.kind);
  });
  renderFeed('latest');

  /* ---------- cards ---------- */
  const card = v => `
    <a class="card${v.type === 'short' ? ' card--short' : ''}" ${link(v)}>
      <span class="card__media">${img(v)}${v.len ? `<span class="dur">${esc(v.len)}</span>` : ''}${v.type !== 'video' ? `<span class="media-tag">${typeTag(v)}</span>` : ''}<span class="play"></span></span>
      <span class="card__title">${esc(v.title)}</span>
      <span class="card__meta">${meta(v)}</span>
    </a>`;

  $('#latest-videos').innerHTML = ALL.filter(v => v.type === 'video').sort(byNew).slice(0, 6).map(card).join('');

  const eye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5C6.5 5 2.7 9.3 1.5 12c1.2 2.7 5 7 10.5 7s9.3-4.3 10.5-7C21.3 9.3 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>';
  $('#shorts-rail').innerHTML = shorts.map(v => `
    <a class="card card--short" ${link(v)}>
      <span class="card__media">${img(v)}<span class="short-views">${eye}${fmt(v.views)}</span><span class="play"></span></span>
      <span class="card__title">${esc(v.title)}</span>
    </a>`).join('');
  const rail = $('#shorts-rail');
  $('#shorts-prev').addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * .8, behavior: reduceMotion ? 'auto' : 'smooth' }));
  $('#shorts-next').addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * .8, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- live on twitch ---------- */
  const today = new Date().getDay();
  $('#week').innerHTML = weekOrder.map(d => {
    const on = streamDays.includes(d);
    return `<li class="${on ? 'on' : ''}${d === today ? ' today' : ''}"${d === today ? ' aria-current="date"' : ''}>${dayShort[d]}<small>${on ? 'Live' : '&ndash;'}</small></li>`;
  }).join('');
  let next = null;
  for (let i = 1; i <= 7 && next === null; i++) if (streamDays.includes((today + i) % 7)) next = (today + i) % 7;
  $('#live-status').innerHTML = streamDays.includes(today)
    ? '<strong>Today is a stream day.</strong> Follow on Twitch so you catch the go-live alert.'
    : next !== null ? `Next stream: <strong>${dayLong[next]}</strong>. Follow on Twitch so you catch the go-live alert.` : '';
  const lastStream = ALL.filter(v => v.type === 'stream').sort(byNew)[0];
  if (lastStream) {
    $('#last-stream').innerHTML = `<p class="eyebrow" style="margin-bottom:10px">Latest stream VOD</p>` + card(lastStream);
  }

  /* ---------- library ---------- */
  const DEFAULTS = { q: '', type: 'all', game: '', sort: 'new', limit: 18 };
  const state = { ...DEFAULTS };
  const libQ = $('#lib-q'), libGame = $('#lib-game'), libSort = $('#lib-sort');
  libGame.innerHTML = `<option value="">All games (${games.length})</option>` + games.map(([g, n]) => `<option value="${esc(g)}">${esc(g)} (${n})</option>`).join('');

  const norm = s => s.toLowerCase().replace(/['’]/g, '');
  function results() {
    const words = norm(state.q).split(/\s+/).filter(Boolean);
    return ALL.filter(v => {
      if (state.type !== 'all' && v.type !== state.type) return false;
      if (state.game && v.game !== state.game) return false;
      const hay = norm(`${v.title} ${v.game} ${v.kind} ${v.type}`);
      return words.every(w => hay.includes(w));
    }).sort(state.sort === 'views' ? byViews : byNew);
  }
  function renderLib() {
    const list = results();
    const shown = list.slice(0, state.limit);
    $('#lib-grid').innerHTML = shown.length ? shown.map(card).join('')
      : `<p class="empty">No uploads match <strong>&ldquo;${esc(state.q)}&rdquo;</strong>${state.game ? ` in ${esc(state.game)}` : ''}. Try a game name like AION 2, or clear the filters.</p>`;
    $('#lib-count').textContent = list.length ? `Showing ${shown.length} of ${list.length}` : 'No matches';
    $('#lib-more').hidden = shown.length >= list.length;
  }
  function syncControls() {
    libQ.value = state.q;
    libGame.value = state.game;
    libSort.value = state.sort;
    $$('#lib-type button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === state.type)));
  }
  function showLibrary(opts) {
    Object.assign(state, DEFAULTS, opts);
    syncControls();
    renderLib();
    $('#library').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  libQ.addEventListener('input', () => { state.q = libQ.value; state.limit = DEFAULTS.limit; renderLib(); });
  libGame.addEventListener('change', () => { state.game = libGame.value; state.limit = DEFAULTS.limit; renderLib(); });
  libSort.addEventListener('change', () => { state.sort = libSort.value; renderLib(); });
  $('#lib-type').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    state.type = b.dataset.type; state.limit = DEFAULTS.limit;
    syncControls(); renderLib();
  });
  $('#lib-more').addEventListener('click', () => { state.limit += DEFAULTS.limit; renderLib(); });
  $('#hero-search').addEventListener('submit', e => { e.preventDefault(); showLibrary({ q: $('#hero-q').value.trim() }); });

  document.addEventListener('click', e => {
    const g = e.target.closest('[data-game]');
    if (g && !g.closest('#lib-grid')) { e.preventDefault(); showLibrary({ game: g.dataset.game }); return; }
    const qk = e.target.closest('[data-quick]');
    if (qk) { showLibrary(quick[+qk.dataset.quick]); return; }
    const a = e.target.closest('a[href="#library"]');
    if (a) {
      e.preventDefault();
      showLibrary(a.dataset.sort ? { sort: a.dataset.sort } : a.dataset.type ? { type: a.dataset.type } : {});
    }
  });
  renderLib();

  /* ---------- brotherhood ---------- */
  const initials = name => {
    const words = name.split(/[\s_]+/).filter(Boolean);
    if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    const caps = name.match(/[A-Z]/g);
    return caps && caps.length > 1 ? caps[0] + caps[1] : name[0].toUpperCase();
  };
  $('#partners').innerHTML = (SITE.partners || []).map(p => `<li><span class="mono" aria-hidden="true">${esc(initials(p))}</span><span>${esc(p)}</span></li>`).join('');
  $('#platforms').innerHTML = (SITE.platforms || []).length
    ? '<span>Find the Brothas on</span>' + SITE.platforms.map(p => `<span class="tag">${esc(p)}</span>`).join('') : '';

  /* ---------- menu ---------- */
  const menuBtn = $('#menu-btn'), drawer = $('#drawer');
  const setMenu = open => { drawer.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  menuBtn.addEventListener('click', () => setMenu(drawer.hidden));
  drawer.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { setMenu(false); menuBtn.focus(); } });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- gold starfield (echoes the channel banner) ---------- */
  const cv = $('#stars');
  const ctx = cv.getContext('2d');
  const gold = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#f3e227';
  let W = 0, H = 0, dots = [], sparks = [], running = false, raf = 0;
  function seed() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 2200);
    dots = Array.from({ length: n }, () => {
      const big = Math.random() < .07;
      return { x: Math.random() * W, y: Math.random() * H, r: big ? 1.3 + Math.random() * 1.1 : .35 + Math.random() * .8, a: .2 + Math.random() * .8, s: .5 + Math.random() * 1.8, p: Math.random() * 6.28, v: .03 + Math.random() * .1, big };
    });
    sparks = Array.from({ length: Math.max(3, Math.round(W / 240)) }, () => ({ x: Math.random() * W, y: Math.random() * H, L: 4 + Math.random() * 5, s: .3 + Math.random() * .6, p: Math.random() * 6.28 }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const sec = t / 1000;
    for (const d of dots) {
      const tw = reduceMotion ? 1 : .5 + .5 * Math.sin(sec * d.s + d.p);
      ctx.globalAlpha = d.a * tw;
      ctx.fillStyle = d.big ? '#fff7b8' : gold;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      if (!reduceMotion) { d.y -= d.v; if (d.y < -3) { d.y = H + 3; d.x = Math.random() * W; } }
    }
    ctx.strokeStyle = '#fffbe6'; ctx.lineWidth = 1;
    for (const s of sparks) {
      const k = reduceMotion ? .7 : Math.max(0, Math.sin(sec * s.s + s.p));
      if (k < .02) continue;
      const L = s.L * (.5 + .5 * k);
      ctx.globalAlpha = .85 * k;
      ctx.beginPath(); ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y); ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function loop(t) { draw(t); if (running) raf = requestAnimationFrame(loop); }
  function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  seed(); draw(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => en.isIntersecting ? start() : stop()).observe(cv);
  } else start();
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { seed(); draw(performance.now()); }, 150); });
})();
