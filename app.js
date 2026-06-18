const FEEDS = ['report', 'growth', 'hot'];
let manifest = {}, feed = 'report';

async function init() {
  manifest = await fetch('data/manifest.json').then(r => r.json()).catch(() => ({}));
  document.querySelectorAll('#tabs button').forEach(b =>
    b.onclick = () => { feed = b.dataset.feed; mark(); fillDates(); load(); });
  fillDates(); load();
}
function mark() {
  document.querySelectorAll('#tabs button').forEach(b =>
    b.classList.toggle('on', b.dataset.feed === feed));
}
function fillDates() {
  const sel = document.getElementById('date');
  const dates = (manifest[feed] || []).slice().sort().reverse();
  sel.innerHTML = dates.map(d => `<option>${d}</option>`).join('') || '<option>暂无</option>';
  sel.onchange = load;
}
async function load() {
  const d = document.getElementById('date').value;
  const box = document.getElementById('list');
  if (!d || d === '暂无') { box.innerHTML = '<p class="empty">还没有数据</p>'; return; }
  const items = await fetch(`data/${feed}/${d}.json`).then(r => r.json()).catch(() => []);
  box.innerHTML = items.map(x => `
    <div class="item">
      <h3>${x.rank}. <a href="${x.url}" target="_blank">${x.repo || x.title}</a></h3>
      <div class="meta">${[x.stars, x.trend, x.date, x.source].filter(Boolean).join(' · ')}</div>
      ${x.what ? `<p><span class="k">做了什么：</span>${x.what}</p>` : ''}
      ${x.why ? `<p><span class="k">看点：</span>${x.why}</p>` : ''}
      ${x.insight ? `<p><span class="k">启发：</span>${x.insight}</p>` : ''}
    </div>`).join('') || '<p class="empty">还没有数据</p>';
}
init();
