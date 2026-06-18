const FEEDS = ['report', 'growth', 'hot'];
const LABEL = { report: '技术日报', growth: '增长榜', hot: '热门榜' };
let manifest = {}, feed = 'report';

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
    b.onclick = () => { feed = b.dataset.feed; mark(); fillDates(); load(); });
  mark(); fillDates(wantDate); load();
}
function mark() {
  document.querySelectorAll('#tabs button').forEach(b => {
    const on = b.dataset.feed === feed;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
}
function fillDates(want) {
  const sel = document.getElementById('date');
  const dates = (manifest[feed] || []).slice().sort().reverse();
  sel.hidden = dates.length === 0;
  sel.innerHTML = dates.map(d => `<option>${d}</option>`).join('');
  if (want && dates.includes(want)) sel.value = want;
  sel.onchange = load;
}
async function load() {
  syncURL();
  const box = document.getElementById('list');
  const dates = (manifest[feed] || []);
  if (!dates.length) {
    box.innerHTML = `<p class="empty"><b>${LABEL[feed]}还没有数据</b>每日自动更新，首批数据生成中。</p>`;
    return;
  }
  const d = document.getElementById('date').value;
  const items = await fetch(`data/${feed}/${d}.json`).then(r => r.json()).catch(() => []);
  box.innerHTML = items.map(x => `
    <div class="item">
      <h3><span class="rank">${x.rank}</span><a href="${x.url}" target="_blank" rel="noopener">${x.repo || x.title}</a></h3>
      <div class="meta">
        ${x.stars ? `<span class="tag">★ ${x.stars}</span>` : ''}
        ${x.trend ? `<span class="tag">${x.trend}</span>` : ''}
        ${[x.date, x.source].filter(Boolean).map(t => `<span class="src">${t}</span>`).join('')}
      </div>
      ${x.what ? `<p><span class="k">做了什么：</span>${x.what}</p>` : ''}
      ${x.why ? `<p><span class="k">看点：</span>${x.why}</p>` : ''}
      ${x.insight ? `<p><span class="k">启发：</span>${x.insight}</p>` : ''}
    </div>`).join('') || `<p class="empty"><b>这天还没有数据</b>换个日期或等明天的更新。</p>`;
}
init();
