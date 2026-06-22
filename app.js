const SB_URL = 'https://idfbjcloyxuxbuheekzm.supabase.co';
const SB_KEY = 'sb_publishable_fjqAxsSMdohSyYg80OOZ_A_OZRnX8Dg';
const sb = (path, opt = {}) => fetch(`${SB_URL}/rest/v1/${path}`, { ...opt, headers: { apikey: SB_KEY, 'Content-Type': 'application/json', ...opt.headers } });

const FEEDS = ['article', 'paper', 'growth', 'hot'];
const LABEL = { article: '高质量文章', paper: '论文', growth: '增长榜', hot: '热门榜', fav: '收藏' };
let manifest = {}, feed = 'article', favs = new Map();

function kfmt(v) {
  const n = +String(v).replace(/[,k]/gi, '') * (/k/i.test(v) ? 1000 : 1);
  if (!n) return v;
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : n;
}
function readURL() {
  const p = new URLSearchParams(location.search);
  const f = p.get('feed');
  if (FEEDS.includes(f) || f === 'fav') feed = f;
  return p.get('date');
}
function syncURL() {
  const d = document.getElementById('date').value;
  const p = new URLSearchParams();
  p.set('feed', feed);
  if (d && feed !== 'fav') p.set('date', d);
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

async function loadFavs() {
  const rows = await sb('favorites?select=url,data&order=marked_at.desc').then(r => r.json()).catch(() => []);
  favs = new Map((Array.isArray(rows) ? rows : []).map(x => [x.url, x.data]));
}
async function toggleFav(x) {
  if (favs.has(x.url)) {
    favs.delete(x.url);
    await sb(`favorites?url=eq.${encodeURIComponent(x.url)}`, { method: 'DELETE' });
  } else {
    const data = { ...x, feed };
    favs.set(x.url, data);
    await sb('favorites', { method: 'POST', body: JSON.stringify({ url: x.url, data }) });
  }
}

async function init() {
  manifest = await fetch(`data/manifest.json?t=${Date.now()}`).then(r => r.json()).catch(() => ({}));
  await loadFavs();
  const wantDate = readURL();
  document.querySelectorAll('#tabs button').forEach(b =>
    b.onclick = () => { feed = b.dataset.feed; mark(); load(); });
  mark(); fillDates(wantDate); load();
}
function mark() {
  document.querySelectorAll('#tabs button').forEach(b => {
    const on = b.dataset.feed === feed;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
}
const picker = document.getElementById('date');
function fillDates(want) {
  const all = [...new Set(FEEDS.flatMap(f => manifest[f] || []))].sort().reverse();
  picker.dataset.all = all.join(',');
  picker.hidden = all.length === 0 || feed === 'fav';
  picker.value = (want && all.includes(want)) ? want : all[0] || '';
  const menu = picker.querySelector('.pk-menu');
  const btn = picker.querySelector('.pk-btn'), val = picker.querySelector('.pk-val');
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  val.textContent = picker.value;
  menu.innerHTML = all.map(d => `<li role="option" data-d="${d}" class="${d === picker.value ? 'on' : ''}">${d}</li>`).join('');
  btn.onclick = () => { const o = menu.hidden; menu.hidden = !o; btn.setAttribute('aria-expanded', o); };
  menu.onclick = e => { const d = e.target.dataset.d; if (!d) return; pick(d); close(); };
  document.onclick = e => { if (!picker.contains(e.target)) close(); };
  document.getElementById('prev').onclick = () => step(1);
  document.getElementById('next').onclick = () => step(-1);
}
function pick(d) { picker.value = d; picker.querySelector('.pk-val').textContent = d; load(); }
function step(dir) {
  const all = (picker.dataset.all || '').split(',').filter(Boolean);
  const i = all.indexOf(picker.value);
  if (i > -1 && all[i + dir]) pick(all[i + dir]);
}
const card = x => `
  <div class="item">
    <button class="star ${favs.has(x.url) ? 'on' : ''}" data-u="${encodeURIComponent(x.url)}" aria-label="收藏">${favs.has(x.url) ? '★' : '☆'}</button>
    <h3><span class="rank">${x.rank || ''}</span><a href="${x.url}" target="_blank" rel="noopener">${x.repo || x.title}</a></h3>
    <div class="meta">
      ${x.stars ? `<span class="tag">★ ${kfmt(x.stars)}</span>` : ''}
      ${x.trend ? `<span class="tag">${x.trend}</span>` : ''}
      ${[x.date, x.source].filter(Boolean).map(t => `<span class="src">${t}</span>`).join('')}
    </div>
    ${x.what ? `<p><span class="k">做了什么：</span>${x.what}</p>` : ''}
    ${x.why ? `<p><span class="k">看点：</span>${x.why}</p>` : ''}
    ${x.insight ? `<p><span class="k">启发：</span>${x.insight}</p>` : ''}
  </div>`;
async function load() {
  syncURL();
  picker.hidden = feed === 'fav' || !(picker.dataset.all || '');
  const box = document.getElementById('list');
  let items;
  if (feed === 'fav') {
    items = [...favs.values()];
    if (!items.length) { box.innerHTML = `<p class="empty"><b>还没有收藏</b>点卡片右上角 ☆ 收藏，跨设备同步。</p>`; return; }
  } else {
    const d = document.getElementById('date').value;
    if (!d) { box.innerHTML = `<p class="empty"><b>${LABEL[feed]}还没有数据</b>每日自动更新，首批数据生成中。</p>`; return; }
    items = await fetch(`data/${feed}/${d}.json?t=${Date.now()}`).then(r => r.json()).catch(() => []);
  }
  box.innerHTML = items.map(card).join('') || `<p class="empty"><b>这天还没有数据</b>换个日期或等明天的更新。</p>`;
  box.querySelectorAll('.star').forEach(b => b.onclick = async () => {
    const url = decodeURIComponent(b.dataset.u);
    const x = items.find(i => i.url === url);
    await toggleFav(x); load();
  });
}
init();
