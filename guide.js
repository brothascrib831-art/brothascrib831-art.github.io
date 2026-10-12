/* Guide pages: menu drawer, and YouTube videos that only load when you press play. */
(() => {
  const menuBtn = document.getElementById('menu-btn'), drawer = document.getElementById('drawer');
  if (menuBtn && drawer) {
    const setMenu = open => { drawer.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
    menuBtn.addEventListener('click', () => setMenu(drawer.hidden));
    drawer.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { setMenu(false); menuBtn.focus(); } });
  }

  // Without JavaScript (or with a modifier key) the link just opens YouTube.
  document.addEventListener('click', e => {
    const a = e.target.closest('.yt a');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const box = a.closest('.yt');
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(box.dataset.yt)}?autoplay=1&rel=0`;
    f.title = a.getAttribute('aria-label') || 'YouTube video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    box.replaceChildren(f);
  });
})();
