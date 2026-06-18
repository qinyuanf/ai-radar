const FEEDS = ['report', 'growth', 'hot'];
const LABEL = { report: '技术日报', growth: '增长榜', hot: '热门榜' };
let manifest = {}, feed = 'report';

function kfmt(v) {
  const n = +String(v).replace(/[,k]/gi, '') * (/k/i.test(v) ? 1000 : 1);
  if (!n) return v;
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : n;
}
function readURL() {
  const p = new URLSearchParams(location.search);
  const f = p.get('feed');
  if (FEEDS.includes(f)) feed = f;
  return p.get('date');
}
function syncURL() {
  const d = document.getElementById('date').value;
  const p = new URLSearchParams();
  p.set('feed', feed);
  if (d) p.set('date', d);
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

async function init() {
  manifest = await fetch('data/manifest.json').then(r => r.json()).catch(() => ({}));
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
  picker.hidden = all.length === 0;
  picker.value = (want && all.includes(want)) ? want : all[0] || '';
  const menu = picker.querySelector('.pk-menu');
  const btn = picker.querySelector('.pk-btn'), val = picker.querySelector('.pk-val');
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  val.textContent = picker.value;
  menu.innerHTML = all.map(d => `<li role="option" data-d="${d}" class="${d === picker.value ? 'on' : ''}">${d}</li>`).join('');
  btn.onclick = () => { const o = menu.hidden; menu.hidden = !o; btn.setAttribute('aria-expanded', o); };
  menu.onclick = e => { const d = e.target.dataset.d; if (!d) return; picker.value = d; val.textContent = d; menu.querySelectorAll('li').forEach(li => li.classList.toggle('on', li.dataset.d === d)); close(); load(); };
  document.onclick = e => { if (!picker.contains(e.target)) close(); };
}
async function load() {
  syncURL();
  const box = document.getElementById('list');
  const d = document.getElementById('date').value;
  if (!d) {
    box.innerHTML = `<p class="empty"><b>${LABEL[feed]}还没有数据</b>每日自动更新，首批数据生成中。</p>`;
    return;
  }
  const items = await fetch(`data/${feed}/${d}.json`).then(r => r.json()).catch(() => []);
  box.innerHTML = items.map(x => `
    <div class="item">
      <h3><span class="rank">${x.rank}</span><a href="${x.url}" target="_blank" rel="noopener">${x.repo || x.title}</a></h3>
      <div class="meta">
        ${x.stars ? `<span class="tag">★ ${kfmt(x.stars)}</span>` : ''}
        ${x.trend ? `<span class="tag">${x.trend}</span>` : ''}
        ${[x.date, x.source].filter(Boolean).map(t => `<span class="src">${t}</span>`).join('')}
      </div>
      ${x.what ? `<p><span class="k">做了什么：</span>${x.what}</p>` : ''}
      ${x.why ? `<p><span class="k">看点：</span>${x.why}</p>` : ''}
      ${x.insight ? `<p><span class="k">启发：</span>${x.insight}</p>` : ''}
    </div>`).join('') || `<p class="empty"><b>这天还没有数据</b>换个日期或等明天的更新。</p>`;
}
init();
