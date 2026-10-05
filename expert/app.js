(function(){
'use strict';
const R = window.RADAR; if (!R) { document.querySelector('main').innerHTML = '<div class="notice warn">데이터 파일을 불러오지 못했습니다. 새로고침해 보세요.</div>'; return; }
const $ = id => document.getElementById(id);
if (!/github\.io$|^localhost$|^127\./.test(location.hostname) && /^https?:/.test(location.protocol)) { const b = document.createElement('div'); b.className = 'banner-ext'; b.innerHTML = '이 화면은 보관용입니다. 수집·기획하기는 <a href="https://mediaplanners200-web.github.io/rader/expert/" target="_blank" rel="noopener">팀 레이더 사이트</a>에서 해 주세요.'; document.body.prepend(b); }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => { n = +n || 0; if (n >= 1e8) { const v = n/1e8; return (v>=10?Math.round(v):v.toFixed(1).replace(/\.0$/,''))+'억'; } if (n >= 1e4) { const v = n/1e4; return (v>=100?Math.round(v):v.toFixed(1).replace(/\.0$/,''))+'만'; } return Math.round(n).toLocaleString('ko-KR'); };
const median = a => { if (!a.length) return 0; const s = [...a].sort((x,y)=>x-y), m = Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };
const hash = s => { let h = 0; for (const c of String(s)) h = (h*31 + c.charCodeAt(0)) >>> 0; return h; };
const yt = id => 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
const ytS = id => 'https://www.youtube.com/shorts/' + encodeURIComponent(id);
const [uy,um,ud] = R.updated.split('-').map(Number); const TODAY = new Date(uy, um-1, ud);
const daysSince = pd => { if (!pd) return null; const [y,m,d] = pd.split('-').map(Number); return Math.max(0, Math.round((TODAY - new Date(y,m-1,d)) / 864e5)); };
const PAL = ['#1D6BF3','#12A36B','#7C5CFA','#E08700','#E5484D','#0EA5E9','#DB2777','#0F9488','#8B5CF6','#EA580C','#16A34A','#4F46E5'];
const CAT = {kr:['국내 세무회계','kr'], krp:['국내 전문직','krdoc'], ost:['해외 세무회계',''], osp:['해외 전문직','doc']};
// 깃허브 사이트에서는 유튜브 원본 고화질 이미지를 바로 씀(아티팩트는 외부 이미지가 막혀 내장 썸네일 사용)
const EXT = /github\.io$|^localhost$|^127\./.test(location.hostname);
const yimg = (id, q) => 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/' + q + '.jpg';
const GRADES = [['Great','g-great','●●●●'],['Good','g-good','●●●'],['Normal','g-normal','●●'],['Bad','g-bad','●'],['Worst','g-worst','·']];
const grade = (v,t) => { for (let i=0;i<t.length;i++) if (v>=t[i]) return GRADES[i]; return GRADES[4]; };
const perfGrade = r => grade(r, [1, .3, .1, .03]);
const contribGrade = r => grade(r, [3, 1.5, .6, .25]);
const gr = (g, sub) => `<span class="gr ${g[1]}"><i>${g[2]}</i>${g[0]}</span>${sub ? `<span class="sub num">${sub}</span>` : ''}`;
const KWG = ['Worst','Bad','Normal','Good','Great'];

// ---------- data prep ----------
const CH = R.channels; const byH = {}; CH.forEach(c => byH[c.h] = c);
const OURS = R.ours; OURS.c = 'ours'; byH[OURS.h] = OURS;
const V = R.v; // id -> {t,o,vc,pd,a,len,h,cn,kw,g,src}
const KW = {}; (R.kw||[]).forEach(k => KW[k.k] = k);
Object.entries(V).forEach(([id, v]) => {
  v.id = id; v.short = v.len === -1 || v.len === 'S' || (v.len > 0 && v.len <= 70 && /#shorts|#쇼츠/i.test(v.t||''));
  if (v.len === -1) v.short = true;
  v.d = v.pd ? daysSince(v.pd) : (v.a != null ? v.a : null);
  v.ch = byH[v.h] || null;
});
CH.forEach(c => {
  const [y,m] = (c.j||'2020-01').split('-').map(Number);
  c.years = Math.max((TODAY - new Date(y, m-1, 1)) / (365.25*864e5), .25);
  c.growth = c.subs / c.years; c.jd = y*100 + m; c.color = PAL[hash(c.h) % PAL.length];
  const all = [...new Set([...(c.L||[]), ...(c.P||[])])].map(id => V[id]).filter(Boolean);
  const longs = all.filter(v => !v.short);
  const rec = longs.filter(v => v.d != null && v.d >= 3 && v.d <= 92);
  c.active = rec.length >= 3; c.recentMed = c.active ? median(rec.map(v => v.vc)) : 0; c.recent = c.subs && c.active ? c.recentMed / c.subs : 0;
  const lat = (c.L||[]).map(id => V[id]).filter(v => v && !v.short).map(v => v.vc);
  c.base = median(lat.length >= 3 ? lat : longs.map(v => v.vc)) || 1;
  const sl = [...(c.SL||[]), ...(c.SP||[])].map(id => V[id]).filter(Boolean).map(v => v.vc);
  c.sbase = median(sl) || 1;
  c.young = c.years <= 5; c.hot = c.years < 4 && c.growth >= (/^kr/.test(c.c) ? 20000 : 70000);
  c.ini = [...(c.n||c.h).replace(/^(Dr\.?|Doctor)\s*/i,'')][0].toUpperCase();
});
OURS.color = '#1D3E8A'; OURS.ini = 'X';
Object.values(V).forEach(v => {
  const c = v.ch;
  v.ratio = c && c.subs ? v.vc / c.subs : null;
  v.contrib = c ? v.vc / (v.short ? c.sbase : c.base) : null;
  v.cat = v.c || (c ? c.c : (v.src === 'os' ? 'ost' : 'kr'));
  const kg = (v.kw||[]).map(k => KW[k]).filter(Boolean).map(k => k.grade);
  v.kwg = kg.length ? Math.max(...kg) : -1;
});

// ---------- thumbnails (lazy buckets) ----------
const TH = {}; const loadedB = {}; const NB = R.thumbBuckets || 16;
window.RADAR_T = obj => { Object.assign(TH, obj); paintThumbs(); };
const bucketOf = id => hash(id) % NB;
function loadBucket(b, file){
  const key = file || ('thumbs/b' + b + '.js'); if (loadedB[key]) return; loadedB[key] = 1;
  const s = document.createElement('script'); s.src = key + '?v=' + (R.updated||''); s.async = true; document.head.appendChild(s);
}
let paintQ = 0;
function paintThumbs(){
  if (paintQ) return; paintQ = requestAnimationFrame(() => { paintQ = 0;
    document.querySelectorAll('img[data-tid]:not([src])').forEach(img => { const d = TH[img.dataset.tid]; if (d) { img.src = 'data:image/webp;base64,' + d; img.closest('.thumb')?.querySelector('.ini')?.remove(); } else if (!R.thumbFiles?.[img.dataset.tid]) loadBucket(bucketOf(img.dataset.tid)); else loadBucket(0, R.thumbFiles[img.dataset.tid]); });
    document.querySelectorAll('img[data-aid]:not([src])').forEach(img => { const d = (window.RADAR_AV||{})[img.dataset.aid]; if (d) img.src = 'data:image/webp;base64,' + d; });
  });
}
const AVLOAD = () => { if (!window.RADAR_AV && !loadedB['av']) { loadedB['av'] = 1; const s = document.createElement('script'); s.src = 'avatars.js?v=' + (R.updated||''); s.onload = paintThumbs; document.head.appendChild(s); } };

document.addEventListener('error', e => { const im = e.target; if (!im || im.tagName !== 'IMG') return;
  if (im.dataset.fb2) { const n = im.dataset.fb2; im.dataset.fb2 = ''; im.src = n; return; }
  if (im.dataset.fb) { const id = im.dataset.fb; im.removeAttribute('data-fb'); im.removeAttribute('src'); im.dataset.tid = id; paintThumbs(); return; }
  if (im.dataset.cap2) { const n = im.dataset.cap2; im.dataset.cap2 = ''; im.src = n; return; }
  if (im.closest('figure')) im.closest('figure').remove();
}, true);
const av = c => `<span class="av" style="background:${c.color}">${esc(c.ini)}${EXT && c.a ? `<img src="https://yt3.googleusercontent.com/${esc(c.a)}=s88-c-k-c0x00ffffff-no-rj" alt="" loading="lazy">` : `<img data-aid="${esc(c.h)}" alt="">`}</span>`;
const thumb = (v, opts) => { opts = opts || {}; const color = v.ch ? v.ch.color : PAL[hash(v.h||v.cn||v.id) % PAL.length];
  return `<a class="thumb" href="${v.short ? ytS(v.id) : yt(v.id)}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,${color},${color}B3)" aria-label="유튜브에서 열기"><span class="ini">${esc(v.cn || (v.ch && v.ch.n) || '')}</span>${EXT ? `<img src="${yimg(v.id, opts.big ? 'maxresdefault' : 'mqdefault')}" data-fb="${esc(v.id)}" data-fb2="${opts.big ? yimg(v.id, 'hqdefault') : ''}" alt="" loading="lazy">` : `<img data-tid="${esc(v.id)}" alt="" loading="lazy">`}${v.short ? '<span class="sh">SHORTS</span>' : ''}<span class="tag">${fmt(v.vc)}</span></a>`; };
const chName = v => v.ch ? v.ch.n : (v.cn || '');
const ageTxt = v => v.d == null ? '' : v.d === 0 ? '오늘' : v.d < 7 ? v.d + '일 전' : v.d < 31 ? Math.floor(v.d/7) + '주 전' : v.d < 365 ? Math.floor(v.d/30) + '개월 전' : Math.floor(v.d/365) + '년 전';
const kwChips = (v, n) => (v.kw||[]).slice(0, n||3).map(k => { const K = KW[k]; return K ? `<button class="kwchip g${K.grade}" data-kw="${esc(k)}" title="검색량 탭에서 보기">#${esc(k)} <b>${KWG[K.grade]}</b></button>` : `<span class="kwchip">#${esc(k)}</span>`; }).join(' ');

// ---------- state: collected, plans, jobs ----------
let DB = null, USER = null, MCP = null, UID = null, CAN_WRITE = true, IS_OWNER = false;
document.addEventListener('click', async e => {
  const d = e.target.closest('[data-del]'); if (!d) return; e.stopPropagation();
  const p = PLANS.get(d.dataset.del); if (!p) return;
  if (d.dataset.armed !== '1') { d.dataset.armed = '1'; d.textContent = '한 번 더 누르면 삭제'; d.classList.add('pri'); setTimeout(() => { if (d.isConnected) { d.dataset.armed = ''; d.textContent = '기획 삭제'; d.classList.remove('pri'); } }, 4000); return; }
  try {
    if (p.notion) { await DB.doc('plans/' + p.id).update({status: 'deleting', delAt: Date.now(), delBy: UID || ''}); fireTrigger(R.trig?.plan, '기획 삭제 ' + p.id); toast('삭제를 요청했습니다. 노션 기획안도 "삭제된 기획" 보관함으로 옮겨집니다.', 5000); }
    else { await DB.doc('plans/' + p.id).delete(); toast('기획 요청을 삭제했습니다.'); }
  } catch(err) { toast('삭제하지 못했습니다. 팀 비밀번호와 인터넷 연결을 확인해 주세요.'); }
});
document.addEventListener('click', async e => { if (!e.target.closest('#btnRunPlans')) return; const ok = await fireTrigger(R.trig?.plan, '기획 요청'); toast(ok ? '기획을 시작했습니다. 보통 10~20분 걸리고, 끝나면 여기서 알려 드립니다.' : '시작하지 못했습니다. 잠시 후 다시 눌러 주세요.', 5000); });
const SAVED = new Map(); const PLANS = new Map(); let REFRESH = null;
let seenPlans = {}; try { seenPlans = JSON.parse(localStorage.getItem('xr-seen') || '{}'); } catch(e) {}
const toast = (m, ms) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, ms || 2600); };
const collectBtn = id => `<button class="collect ${SAVED.has(id) ? 'on' : ''}" data-collect="${esc(id)}" type="button">${SAVED.has(id) ? '✓ 수집됨' : '＋ 수집'}</button>`;
function refreshCollectBtns(){ document.querySelectorAll('[data-collect]').forEach(b => { const on = SAVED.has(b.dataset.collect); b.classList.toggle('on', on); b.textContent = on ? '✓ 수집됨' : '＋ 수집'; }); }

const RADAR_URL = 'https://claude.ai/artifact/PUaro4Eu1i9WiveHzLav9z';
function noDb(what){
  const f = $('flash'); f.hidden = false; f.className = 'notice warn';
  f.innerHTML = location.protocol === 'file:' ? `바탕화면 파일에서는 ${what} 기록을 함께 저장할 수 없습니다. <a href="${RADAR_URL}" target="_blank" rel="noopener"><b>레이더 링크에서 열기</b></a> — PD님들과 같은 목록을 쓰고 노션에도 연동됩니다.` : `${what} 기록을 불러오는 중이거나 로그인이 필요합니다. claude.ai에 로그인한 상태로 레이더 링크를 열어 주세요.`;
  f.scrollIntoView({behavior:'smooth', block:'start'});
}
async function toggleCollect(id){
  if (!KEY) { askKey(); go('saved'); return; }
  const ref = DB.doc('collected/' + id);
  try {
    if (SAVED.has(id)) { await ref.delete(); toast('수집을 취소했습니다'); }
    else { const v = V[id] || {}; await ref.set({id, t: v.t || '', o: v.o || '', cn: chName(v), vc: v.vc || 0, short: !!v.short, by: UID || '', at: Date.now(), src: location.hash.replace('#','') || 'videos'}); toast('수집했습니다. 수집한 영상 탭에서 기획하기를 누를 수 있습니다.'); }
  } catch(e) { toast('저장하지 못했습니다. 팀 비밀번호와 인터넷 연결을 확인해 주세요.'); }
}

// ---------- nav ----------
function go(view){
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.view === view)));
  document.querySelectorAll('main > .view').forEach(v => v.hidden = v.id !== 'v-' + view);
  try { localStorage.setItem('xr-view', view); } catch(e) {}
  if (view === 'plans') markPlansSeen();
  window.scrollTo({top:0}); paintThumbs();
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.view)));
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); }
  const o = e.target.closest('[data-open]'); if (o) openDrawer(o.dataset.open);
  const c = e.target.closest('[data-collect]'); if (c) { e.preventDefault(); toggleCollect(c.dataset.collect); }
  const k = e.target.closest('[data-kw]'); if (k) { e.preventDefault(); kws.q = k.dataset.kw; $('kwQ').value = kws.q; renderKw(); go('kw'); }
});
$('updated').textContent = '데이터 ' + R.updated.replace(/-/g,'.');
$('btnNotion').href = R.links.notion;
function segBind(id, fn){ const el = $(id); el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); fn(b.dataset.v); }); }

// ---------- dashboard: our channel ----------
function renderOurs(){
  const O = OURS, S = O.stats;
  const longs = O.long.map(id => V[id]).filter(Boolean), shorts = O.shorts.map(id => V[id]).filter(Boolean);
  const recent = [...longs, ...shorts].filter(v => v.d != null).sort((a,b) => a.d - b.d).slice(0, 8);
  const vrow = v => { const r = v.vc / (v.short ? S.shortMed : S.longMed || 1); const g = contribGrade(r);
    return `<div class="vi">${thumb(v)}<div class="vt"><a href="${v.short ? ytS(v.id) : yt(v.id)}" target="_blank" rel="noopener">${esc(v.t)}</a><span class="o">${esc(ageTxt(v))} · ${v.short ? '쇼츠' : '롱폼'}${v.len > 0 && !v.short ? ' · ' + Math.round(v.len/60) + '분' : ''}</span></div><div class="r"><span class="big num">${fmt(v.vc)}</span>${v.d < 3 ? '<span class="sub">집계 중 (3일 후 판정)</span>' : gr(g, '평소의 ' + (r >= 10 ? Math.round(r) : r.toFixed(1)) + '배')}</div></div>`; };
  $('oursCard').innerHTML = `
  <div class="ours-l">
    <div class="ours-top">${av(O)}<div><h2>${esc(O.n)}</h2><div class="meta">@${esc(O.h)} · 개설 ${esc((O.j||'').replace('-','.'))} · ${esc(O.vcount||'')}</div></div>
      <div class="btns"><a class="iconbtn yt" href="https://www.youtube.com/@${encodeURIComponent(O.h)}/videos" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>채널 열기</a><a class="iconbtn" href="https://studio.youtube.com/channel/${encodeURIComponent(O.cid)}" target="_blank" rel="noopener">스튜디오</a><a class="iconbtn" href="${esc(R.links.notion)}" target="_blank" rel="noopener">노션 진행도</a></div></div>
    <div class="kpis">
      <div class="kpi"><span class="l">구독자</span><span class="v num">${Number(O.subs).toLocaleString('ko-KR')}</span><span class="s">${S.subsNote ? esc(S.subsNote) : '누적 조회수 ' + fmt(O.views)}</span></div>
      <div class="kpi"><span class="l">롱폼 평소 조회수</span><span class="v num">${fmt(S.longMed)}</span><span class="s">최근 롱폼 ${S.longN}편 중앙값</span></div>
      <div class="kpi"><span class="l">쇼츠 평소 조회수</span><span class="v num">${fmt(S.shortMed)}</span><span class="s">최근 쇼츠 ${S.shortN}편 중앙값</span></div>
      <div class="kpi"><span class="l">최근 30일 업로드</span><span class="v num">${S.up30L + S.up30S}편</span><span class="s">롱폼 ${S.up30L} · 쇼츠 ${S.up30S}</span></div>
    </div>
    <div class="ranks">${rankList('국내 세무 채널 순위', (R.ranks||{}).kr)}${rankList('해외 세무 채널 순위', (R.ranks||{}).os)}</div>
  </div>
  <div class="ours-r">
    <p class="sec-t">최근 업로드 성과 <span style="font-weight:400">(채널 평소 대비)</span></p>
    <div class="vlist">${recent.map(vrow).join('')}</div>
    <p class="sec-t" style="margin-top:6px">우리 채널 상위 영상</p>
    <div class="vlist">${[...longs, ...shorts].sort((a,b) => b.vc - a.vc).slice(0, 4).map(vrow).join('')}</div>
  </div>`;
}

function rankList(title, hs){
  const list = (hs||[]).map(h => byH[h]).filter(Boolean);
  return `<div class="rk"><p class="sec-t">${esc(title)} <span style="font-weight:400">(구독자순)</span></p>${list.map((c, i) => `<button class="rk-row" data-open="${esc(c.h)}" type="button"><span class="no ${i < 3 ? 'top' : ''}">${i+1}</span>${av(c)}<span style="min-width:0;display:block;overflow:hidden"><span class="nm" style="display:block">${esc(c.n)}</span><span class="rl">${esc(c.r||'')}</span></span><span class="sv">${fmt(c.subs)}</span></button>`).join('')}</div>`;
}
function bars(el, list, val, label, cls){
  const max = Math.max(...list.map(val), 1);
  $(el).innerHTML = list.map(c => `<button class="bar-row" data-open="${esc(c.h)}" type="button">${av(c)}<span class="n" title="${esc(c.n)}">${esc(c.n)}</span><span class="t"><span class="f ${cls||''}" style="width:${Math.max(4, val(c)/max*100)}%"></span></span><span class="val">${label(c)}</span></button>`).join('') || '<p class="sub">표시할 채널이 없습니다.</p>';
}

// ---------- topics / formats / comments ----------
let topicMode = 'kr_long';
function renderTopics(){
  const T = (R.topics||{})[topicMode] || [];
  $('topicNote').textContent = (R.topicNotes||{})[topicMode] || '';
  $('topicGrid').innerHTML = T.map((t, i) => { const ids = t.ids.filter(id => V[id]).slice(0, 3);
    return `<div class="topic"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><h3 style="flex:1;min-width:0">${esc(t.t)}</h3>${t.heat ? `<span class="badge ${t.heat === '급상승' ? 'b-hot' : t.heat === '스테디' ? 'b-ok' : 'b-good'}">${esc(t.heat)}</span>` : ''}</div>
    <p>${esc(t.why)}</p>
    <div class="strip">${ids.map(id => { const v = V[id]; return `<div>${thumb(v)}<div class="cap" title="${esc(v.t)}">${esc(chName(v))} · ${esc(ageTxt(v))}</div></div>`; }).join('')}</div>
    <div class="foot">${(t.kw||[]).map(k => { const K = KW[k]; return K ? `<button class="kwchip g${K.grade}" data-kw="${esc(k)}">#${esc(k)} <b>${KWG[K.grade]}</b></button>` : `<span class="kwchip">#${esc(k)}</span>`; }).join(' ')}${ids[0] ? collectBtn(ids[0]) : ''}</div></div>`; }).join('') || '<p class="sub">수집된 주제가 없습니다.</p>';
  paintThumbs();
}
segBind('topicSeg', v => { topicMode = v; renderTopics(); });

function bigCard(v){ return `<div class="vcard">${thumb(v, {big:1})}<a class="tt" href="${v.short ? ytS(v.id) : yt(v.id)}" target="_blank" rel="noopener" title="${esc(v.o||v.t)}">${esc(v.t)}</a><span class="mt">${esc(chName(v) || v.cn || '')} · 조회수 ${fmt(v.vc)}${v.d != null ? ' · ' + esc(ageTxt(v)) : ''}</span><div class="row"><span class="vbadges">${v.pb ? '<span class="badge b-star">우선 벤치마킹</span>' : ''}${v.bs ? '<span class="badge b-bs">베스트셀러</span>' : ''}</span>${collectBtn(v.id)}</div></div>`; }
function renderFormats(){
  $('fmtHint').textContent = R.fmtHint || '';
  $('fmtGrid').innerHTML = (R.formats||[]).map((f, i) => `<div class="fmt" style="${i ? 'border-top:1px solid var(--line);padding-top:22px' : ''};padding-left:0;padding-right:0">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h3 style="margin:0;font-size:17px;font-weight:800">${esc(f.n)}</h3>${f.tag ? `<span class="badge ${f.tag === '최우선' ? 'b-hot' : 'b-good'}">${esc(f.tag)}</span>` : ''}</div>
    <p style="margin:0;color:var(--ink2);font-size:14px;line-height:1.65">${esc(f.sum)}</p>
    <div class="twocol"><div class="box"><h4>공통점</h4><ul>${(f.common||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="box"><h4>지금 트렌드</h4>${esc(f.trend)}</div></div>
    <div class="bigv">${(f.ids||[]).filter(id => V[id]).slice(0,8).map(id => bigCard(V[id])).join('')}</div>
    <div class="foot">${(f.chs||[]).filter(h => byH[h]).map(h => `<button class="linkchip" data-open="${esc(h)}" type="button">${av(byH[h])}<span class="t">${esc(byH[h].n)}</span></button>`).join('')}</div>
    ${f.for ? `<div class="insight"><b>엑스퍼트 적용</b> · ${esc(f.for)}</div>` : ''}
  </div>`).join('');
  paintThumbs();
}
function renderComments(){
  $('cmHint').textContent = R.cmHint || '';
  $('cmGrid').innerHTML = (R.comments||[]).map(c => `<div class="topic">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h3>${esc(c.theme)}</h3><span class="badge b-new">${esc(c.share)}</span></div>
    <div class="meter" aria-hidden="true"><span style="width:${Math.min(100, c.pct||0)}%"></span></div>
    ${(c.q||[]).slice(0,3).map(q => `<p class="quote">“${esc(q.t)}”<br><span class="lk">${q.l ? '좋아요 ' + fmt(q.l) + ' · ' : ''}${esc(q.src||'')}</span></p>`).join('')}
    <div class="box"><h4>기획에 쓰는 법</h4>${esc(c.take)}</div>
  </div>`).join('');
}

// ---------- channels ----------
const cs = {q:'', cat:'all', star:false, young:false, k:'subs', dir:-1};
const catPill = c => { const [l,k] = CAT[c.c] || ['기타','']; return `<span class="pill ${k}">${l}</span>`; };
function renderCh(){
  const q = cs.q.trim().toLowerCase();
  let a = CH.filter(c => (cs.cat === 'all' || c.c === cs.cat) && (!cs.star || c.b) && (!cs.young || c.young) && (!q || (c.n + c.r + c.k + c.h).toLowerCase().includes(q)));
  a.sort((x,y) => (y[cs.k] - x[cs.k]) * (cs.dir < 0 ? 1 : -1));
  $('chCount').innerHTML = `<b>${a.length}</b>개 채널`;
  document.querySelectorAll('#v-channels th.sortable').forEach(th => { const on = th.dataset.k === cs.k; th.classList.toggle('on', on); th.innerHTML = th.textContent.replace(/[▲▼]/g,'') + (on ? `<span class="ar">${cs.dir < 0 ? '▼' : '▲'}</span>` : ''); });
  $('chBody').innerHTML = a.map(c => {
    const marks = [c.b ? '<span class="badge b-star">★ 우선</span>' : '', c.isNew ? '<span class="badge b-new">신규</span>' : '', c.hot ? '<span class="badge b-hot">급성장</span>' : '', !c.active ? '<span class="badge b-stop">업로드 뜸함</span>' : ''].filter(Boolean).join(' ');
    return `<tr><td class="l"><button data-open="${esc(c.h)}" type="button" style="border:0;background:none;padding:0;cursor:pointer;text-align:left"><span class="ch">${av(c)}<span><span class="nm">${esc(c.n)}</span><span class="rl" style="display:block">${esc(c.r)}</span></span></span></button></td>
    <td>${catPill(c)}</td><td>${esc(c.k)}</td><td><span class="big num">${fmt(c.subs)}</span></td>
    <td><span class="big num" style="color:var(--brand-d)">+${fmt(c.growth)}</span><span class="sub">운영 ${c.years.toFixed(1)}년</span></td>
    <td>${c.active ? gr(perfGrade(c.recent), Math.round(c.recent*100) + '% · 중앙값 ' + fmt(c.recentMed)) : '<span class="sub">업로드 뜸함</span>'}</td>
    <td class="num">${fmt(c.views)}</td><td class="num">${esc((c.j||'').replace('-','.'))}</td><td>${marks || '<span class="sub">-</span>'}</td>
    <td><button class="btn pri sm" data-open="${esc(c.h)}" type="button">영상 보기</button></td></tr>`; }).join('');
  paintThumbs();
}
$('chQ').addEventListener('input', e => { cs.q = e.target.value; renderCh(); });
segBind('chCat', v => { cs.cat = v; renderCh(); });
$('chStar').addEventListener('change', e => { cs.star = e.target.checked; renderCh(); });
$('chNew').addEventListener('change', e => { cs.young = e.target.checked; renderCh(); });
document.querySelectorAll('#v-channels th.sortable').forEach(th => th.addEventListener('click', () => { if (cs.k === th.dataset.k) cs.dir *= -1; else { cs.k = th.dataset.k; cs.dir = -1; } renderCh(); }));

// ---------- videos ----------
const VIDS = Object.values(V).filter(v => v.t);
$('vDesc').textContent = `벤치마킹 채널 ${CH.length}곳과 유튜브 검색에서 찾은 국내·해외 영상 ${VIDS.length.toLocaleString('ko-KR')}개입니다. 해외 영상은 한국어 번역 제목 아래 원제를 회색으로 표시합니다. ＋ 수집을 누르면 수집한 영상 탭에 모입니다.`;
const vs = {q:'', cat:'all', form:'all', range:'92', from:'', to:'', pb:false, bs:false, k:'vc', dir:-1, lim:50};
const dayOf = s => { if (!s) return null; const [y,m,d] = s.split('-').map(Number); return Math.round((TODAY - new Date(y,m-1,d)) / 864e5); };
const inRange = v => { if (vs.range === 'all') return true; if (v.d == null) return false; if (vs.range !== 'custom') return v.d <= +vs.range; const a = dayOf(vs.from), b = dayOf(vs.to); return (a == null || v.d <= a) && (b == null || v.d >= b); };
function renderV(){
  const q = vs.q.trim().toLowerCase();
  let a = VIDS.filter(v => (vs.cat === 'all' || v.cat === vs.cat) && (vs.form === 'all' || (vs.form === 'short') === !!v.short) && inRange(v) && (!vs.pb || v.pb) && (!vs.bs || v.bs) && (!q || (v.t + ' ' + (v.o||'') + ' ' + chName(v) + ' ' + (v.mk||'') + ' ' + (v.kw||[]).join(' ')).toLowerCase().includes(q)));
  const key = vs.k;
  if (key === 'd') a.sort((x,y) => vs.dir < 0 ? ((x.d ?? 9e9) - (y.d ?? 9e9)) : ((y.d ?? -1) - (x.d ?? -1)));
  else a.sort((x,y) => ((y[key] ?? -1) - (x[key] ?? -1)) * (vs.dir < 0 ? 1 : -1));
  $('vCount').innerHTML = `<b>${a.length}</b>개 영상`;
  document.querySelectorAll('#v-videos th.sortable').forEach(th => { const on = th.dataset.k === vs.k; th.classList.toggle('on', on); const lab = th.textContent.replace(/[▲▼]|최신|오래된/g,''); th.innerHTML = lab + (on ? `<span class="ar">${th.dataset.k === 'd' ? (vs.dir < 0 ? '최신' : '오래된') : (vs.dir < 0 ? '▼' : '▲')}</span>` : ''); });
  $('vBody').innerHTML = a.slice(0, vs.lim).map(v => `<tr>
    <td>${thumb(v)}</td>
    <td class="l"><div class="vt" style="min-width:300px"><a href="${v.short ? ytS(v.id) : yt(v.id)}" target="_blank" rel="noopener">${esc(v.t)}</a>${v.o ? `<span class="o">${esc(v.o)}</span>` : ''}${v.pb || v.bs ? `<span class="vbadges" style="margin-top:3px">${v.pb ? '<span class="badge b-star">우선 벤치마킹</span>' : ''}${v.bs ? '<span class="badge b-bs">베스트셀러</span>' : ''}</span>` : ''}</div></td>
    <td class="l">${v.ch ? `<button class="linkchip" data-open="${esc(v.ch.h)}" type="button">${av(v.ch)}<span class="t">${esc(v.ch.n)}</span></button>` : `<span class="sub" style="font-size:12px;color:var(--ink2)">${esc(v.cn||'')}</span>`}</td>
    <td><span class="big num">${fmt(v.vc)}</span>${v.short ? '<span class="sub">쇼츠</span>' : ''}</td>
    <td>${v.contrib != null ? gr(contribGrade(v.contrib), '평소의 ' + (v.contrib >= 10 ? Math.round(v.contrib) : v.contrib.toFixed(1)) + '배') : '<span class="sub">-</span>'}</td>
    <td>${v.ratio != null ? gr(perfGrade(v.ratio), Math.round(v.ratio*100) + '%') : '<span class="sub">-</span>'}</td>
    <td>${v.mk ? `<span style="display:flex;flex-direction:column;align-items:center;gap:3px"><span class="kwchip" style="font-weight:700">#${esc(v.mk)}</span>${v.mg != null ? gr(GRADES[4 - v.mg], v.mge ? '추정' : '') : '<span class="sub">측정 전</span>'}</span>` : '<span class="sub">-</span>'}</td>
    <td class="num">${esc(ageTxt(v)) || '-'}</td>
    <td>${collectBtn(v.id)}</td></tr>`).join('') || '<tr><td colspan="9" style="padding:40px;color:var(--muted)">조건에 맞는 영상이 없습니다. 검색어나 기간을 바꿔보세요.</td></tr>';
  const m = $('vMore'); m.hidden = a.length <= vs.lim; m.textContent = `더 보기 (${a.length - Math.min(vs.lim, a.length)}개 남음)`;
  paintThumbs();
}
$('vQ').addEventListener('input', e => { vs.q = e.target.value; vs.lim = 50; renderV(); });
segBind('vCat', v => { vs.cat = v; vs.lim = 50; renderV(); });
segBind('vForm', v => { vs.form = v; vs.lim = 50; renderV(); });
segBind('vRange', v => { vs.range = v; vs.lim = 50; $('vDates').hidden = v !== 'custom'; renderV(); });
$('vFrom').addEventListener('change', e => { vs.from = e.target.value; renderV(); });
$('vTo').addEventListener('change', e => { vs.to = e.target.value; renderV(); });
$('vPb').addEventListener('change', e => { vs.pb = e.target.checked; vs.lim = 50; renderV(); });
$('vBs').addEventListener('change', e => { vs.bs = e.target.checked; vs.lim = 50; renderV(); });
$('vTo').value = R.updated; $('vFrom').max = R.updated; $('vTo').max = R.updated;
$('vMore').addEventListener('click', () => { vs.lim += 50; renderV(); });
document.querySelectorAll('#v-videos th.sortable').forEach(th => th.addEventListener('click', () => { if (vs.k === th.dataset.k) vs.dir *= -1; else { vs.k = th.dataset.k; vs.dir = -1; } renderV(); }));

// ---------- recommendations ----------
const mmss = t => Math.floor(t/60) + ':' + String(Math.round(t%60)).padStart(2,'0');
function capsHtml(r, ids){
  const caps = r.caps || {}; const fig = (id, src, src2, t, k) => `<figure><a href="${yt(id)}&t=${Math.round(t||0)}s" target="_blank" rel="noopener"><img src="${src}" ${src2 ? `data-cap2="${src2}"` : ''} alt="${esc(V[id].t)} 장면 ${k}" loading="lazy"></a><figcaption>${esc(chName(V[id]) || V[id].cn || '')} · ${t ? (src2 ? '약 ' : '') + mmss(t) : '장면 ' + k}</figcaption></figure>`;
  let out = [];
  if (EXT) { // 유튜브가 만들어 둔 고화질 장면(25%·50%·75% 지점) — 롱폼 레퍼런스 최대 4편
    ids.filter(id => !V[id].short).slice(0, 4).forEach(id => { const len = +V[id].len || 0; [1,2,3].forEach(n => out.push(fig(id, yimg(id, 'maxres' + n), yimg(id, 'hq' + n), len > 0 ? len * n / 4 : 0, n))); });
  }
  if (!out.length) ids.filter(id => caps[id] && caps[id].length).forEach(id => caps[id].slice(0, 3).forEach((c, k) => out.push(fig(id, c.src, '', c.t, k+1))));
  return out.length ? `<div class="caps">${out.join('')}</div>` : '<p class="sub" style="margin:0">영상 장면 캡처는 다음 최신화 때 레퍼런스 영상에서 자동으로 채워집니다.</p>';
}

function renderRecs(){
  $('recList').innerHTML = (R.recs||[]).map((r, i) => { const ids = (r.ids||[]).filter(id => V[id]);
        return `<div class="card rec">
      <div class="rec-h"><div><div class="rank">추천 ${i+1}순위 · <span class="badge ${r.npb && r.nbs ? 'b-hot' : r.npb ? 'b-star' : 'b-bs'}">${esc(r.kind||'')}</span> <span class="sub" style="display:inline">점수 ${r.score} · 우선 벤치마킹 ${r.npb}편 · 베스트셀러 ${r.nbs}편</span></div><h3>${esc(r.t)}</h3></div><div style="display:flex;gap:6px;flex-wrap:wrap">${(r.kw||[]).map(k => { const K = KW[k]; return K ? `<button class="kwchip g${K.grade}" data-kw="${esc(k)}">#${esc(k)} <b>${KWG[K.grade]}</b></button>` : ''; }).join('')}</div></div>
      <p style="margin:0;color:var(--ink2);font-size:14px;line-height:1.65">${esc(r.why)}</p>
      <div class="sec"><h4>레퍼런스 영상 <span class="sub" style="display:inline;font-weight:400">조회수 + 최신성 점수 순</span></h4><div class="bigv">${ids.map(id => bigCard(V[id])).join('')}</div></div>
      <div class="twocol">
        <div class="box"><h4>본론에서 공통으로 다루는 내용</h4><ul>${(r.body||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="box"><h4>서론 후킹 방식</h4><ul>${(r.hooks||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      <div class="sec"><h4>연출 캡처 <span class="sub" style="display:inline;font-weight:400">레퍼런스 영상의 화면 구성 · 누르면 그 장면부터 재생</span></h4>${capsHtml(r, ids)}</div>
      <div class="tops">
        <div class="box"><h4>추천 제목 TOP 5</h4><ol class="tlist">${(r.titles||[]).slice(0,5).map(x => `<li><b>${esc(x)}</b></li>`).join('')}</ol></div>
        <div class="box"><h4>썸네일 문구 TOP 5 <span class="sub" style="display:inline;font-weight:400">메인 + 서브</span></h4><div class="tmocks">${(r.thumbs||[]).slice(0,5).map((x, k) => `<div class="tmock"><span class="n">${k+1}</span><span class="s">${esc(x.s)}</span><span class="m">${esc(x.m)}</span></div>`).join('')}</div></div>
      </div>
      ${r.src ? `<p class="sub" style="margin:0">본론·후킹 분석 근거: ${esc(r.src)}</p>` : ''}
    </div>`; }).join('');
  $('recFoot').innerHTML = R.recFoot || '';
  paintThumbs();
}
// ---------- keywords ----------
const kws = {q:'', cat:'all', k:'grade', dir:-1};
(function(){ const cats = ['all', ...new Set((R.kw||[]).map(k => k.cat).filter(Boolean))]; $('kwCat').innerHTML = cats.map((c,i) => `<button data-v="${esc(c)}" aria-pressed="${i===0}">${c === 'all' ? '전체' : esc(c)}</button>`).join(''); })();
const heatColor = v => v == null ? 'background:var(--chip);color:var(--muted)' : v >= 60 ? 'background:var(--brand);color:#fff' : v >= 25 ? 'background:var(--brand-l);color:var(--brand-d)' : v >= 8 ? 'background:var(--chip);color:var(--ink2)' : 'background:var(--chip);color:var(--muted)';
function renderKw(){
  $('kwDesc').innerHTML = R.kwDesc || '';
  const q = kws.q.trim().toLowerCase();
  let a = (R.kw||[]).filter(k => (kws.cat === 'all' || k.cat === kws.cat) && (!q || (k.k + ' ' + (k.rel||[]).join(' ')).toLowerCase().includes(q)));
  a.sort((x,y) => ((y[kws.k] ?? -1) - (x[kws.k] ?? -1)) * (kws.dir < 0 ? 1 : -1));
  $('kwCount').innerHTML = `<b>${a.length}</b>개 키워드`;
  document.querySelectorAll('#v-kw th.sortable').forEach(th => { const on = th.dataset.k === kws.k; th.classList.toggle('on', on); th.innerHTML = th.textContent.replace(/[▲▼]/g,'') + (on ? `<span class="ar">${kws.dir < 0 ? '▼' : '▲'}</span>` : ''); });
  $('kwBody').innerHTML = a.map(k => `<tr>
    <td class="l">${esc(k.k)}${k.cat ? `<span class="sub">${esc(k.cat)}</span>` : ''}</td>
    <td>${gr(GRADES[4 - k.grade])}</td>
    <td><span class="heat" style="${heatColor(k.yt)}">${k.yt == null ? '-' : k.yt}</span></td>
    <td><span class="heat" style="${heatColor(k.web)}">${k.web == null ? '-' : k.web}</span></td>
    <td>${k.trend == null ? '<span class="sub">-</span>' : `<b style="color:${k.trend >= 15 ? 'var(--green-ink)' : k.trend <= -15 ? 'var(--red-ink)' : 'var(--ink2)'}">${k.trend > 0 ? '▲' : k.trend < 0 ? '▼' : ''} ${Math.abs(k.trend)}%</b>`}</td>
    <td class="num">${k.supply ? fmt(k.supply) : '-'}${k.supplyN ? `<span class="sub">상위 ${k.supplyN}편 합계</span>` : ''}</td>
    <td class="l" style="max-width:420px">${(k.rel||[]).slice(0,6).map(x => `<span class="kwchip" style="margin:2px 2px 2px 0">${esc(x)}</span>`).join('')}</td></tr>`).join('') || '<tr><td colspan="7" style="padding:40px;color:var(--muted)">조건에 맞는 키워드가 없습니다.</td></tr>';
  $('kwLegend').innerHTML = R.kwLegend || '';
}
$('kwQ').addEventListener('input', e => { kws.q = e.target.value; renderKw(); });
segBind('kwCat', v => { kws.cat = v; renderKw(); });
document.querySelectorAll('#v-kw th.sortable').forEach(th => th.addEventListener('click', () => { if (kws.k === th.dataset.k) kws.dir *= -1; else { kws.k = th.dataset.k; kws.dir = -1; } renderKw(); }));

// ---------- saved ----------
const SEL = new Set();
function renderSaved(){
  const list = [...SAVED.values()].sort((a,b) => (b.at||0) - (a.at||0));
  $('cntSaved').hidden = !list.length; $('cntSaved').textContent = list.length;
  $('savedEmpty').hidden = !!list.length;
  const inPlan = new Set(); PLANS.forEach(p => (p.ids||[]).forEach(id => inPlan.add(id)));
  $('savedList').innerHTML = list.map(s => { const v = V[s.id] || {id:s.id, t:s.t, o:s.o, vc:s.vc, cn:s.cn, short:s.short, kw:[]};
    return `<div class="crow"><input type="checkbox" id="sel-${esc(s.id)}" data-sel="${esc(s.id)}" ${SEL.has(s.id) ? 'checked' : ''} aria-label="기획에 포함"> ${thumb(v)}
      <div class="vt"><a href="${v.short ? ytS(v.id) : yt(v.id)}" target="_blank" rel="noopener">${esc(v.t || s.t)}</a>${v.o ? `<span class="o">${esc(v.o)}</span>` : ''}<span class="o">${s.ext ? '<b style="color:var(--brand-d)">링크로 추가</b> · ' : ''}${esc(chName(v) || s.cn || '')}${(v.vc || s.vc) ? ' · 조회수 ' + fmt(v.vc || s.vc) : ''}${v.d != null ? ' · ' + esc(ageTxt(v)) : ''}${inPlan.has(s.id) ? ' · <b style="color:var(--violet-ink)">기획에 사용됨</b>' : ''}</span><span style="display:flex;gap:4px;flex-wrap:wrap">${kwChips(v)}</span></div>
      <button class="btn sm" data-collect="${esc(s.id)}" type="button">삭제</button></div>`; }).join('');
  $('savedList').querySelectorAll('[data-collect]').forEach(b => b.textContent = '삭제');
  $('planBar').hidden = !SEL.size; $('planSel').textContent = SEL.size + '개 선택';
  paintThumbs();
}
$('savedList').addEventListener('change', e => { const c = e.target.closest('[data-sel]'); if (!c) return; if (c.checked) SEL.add(c.dataset.sel); else SEL.delete(c.dataset.sel); $('planBar').hidden = !SEL.size; $('planSel').textContent = SEL.size + '개 선택'; });

async function requestPlan(){
  if (!SEL.size) return; if (!KEY) { askKey(); return; }
  const ids = [...SEL]; const note = $('planNote').value.trim();
  const cast = $('planCast').value === '__etc' ? $('planCastEtc').value.trim() : $('planCast').value; const shoot = $('planDate').value || '';
  if (!cast) { toast('이번 영상에 출연하는 세무사님을 선택해 주세요.'); $('planCast').focus(); return; }
  const pid = 'p' + Date.now().toString(36);
  const first = V[ids[0]] || SAVED.get(ids[0]) || {};
  $('btnPlan').disabled = true;
  try {
    await DB.doc('plans/' + pid).set({id: pid, ids, ext: ids.filter(id => (SAVED.get(id)||{}).ext).map(id => ({id, url: SAVED.get(id).url})), cast, shoot, note, by: UID || '', at: Date.now(), status: 'queued', step: '대기 중', title: first.t || '', refTitles: ids.map(id => (V[id] || SAVED.get(id) || {}).t || '')});
    SEL.clear(); $('planNote').value = ''; $('planDate').value = ''; renderSaved();
    const fired = await fireTrigger(R.trig?.plan, '기획 요청 ' + pid);
    toast('기획 요청을 접수했습니다. 보통 10~20분 안에 작성이 시작되고, 노션 컨텐츠 진행도에 바로 올라갑니다. 끝나면 여기서 알려 드립니다.', 6000);
    go('plans');
  } catch(e) { toast('기획 요청을 저장하지 못했습니다. 팀 비밀번호와 인터넷 연결을 확인해 주세요.'); }
  $('btnPlan').disabled = false;
}
$('btnPlan').addEventListener('click', requestPlan);
const CASTS = R.casts || ['강동균','강홍구','강효정','김조겸','김찬수','류아라','박광종','박상현','박철완','신준우','이승철','이아람','이정근','이주현','정재훈','황지환'];
$('planCast').innerHTML = '<option value="">출연 세무사 선택</option>' + CASTS.map(n => `<option value="${esc(n)}">${esc(n)} 세무사</option>`).join('') + '<option value="__etc">직접 입력</option>';
$('planCast').addEventListener('change', e => { $('planCastEtc').hidden = e.target.value !== '__etc'; if (e.target.value === '__etc') $('planCastEtc').focus(); });
// 다른 유튜브 영상 링크로 수집
const ytId = u => { u = (u||'').trim(); const m = u.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11})/) || u.match(/^([A-Za-z0-9_-]{11})$/); return m ? m[1] : ''; };
async function ytInfo(url){
  for (const api of ['https://www.youtube.com/oembed?format=json&url=', 'https://noembed.com/embed?url=']) {
    try { const r = await fetch(api + encodeURIComponent(url)); if (r.ok) { const j = await r.json(); if (j.title) return {t: j.title, cn: j.author_name || ''}; } } catch(e) {}
  }
  return {t: '', cn: ''};
}
$('extForm').addEventListener('submit', async e => {
  e.preventDefault(); if (!KEY) { askKey(); return; }
  const url = $('extUrl').value.trim(); const id = ytId(url);
  if (!id) { toast('유튜브 영상 링크를 확인해 주세요. (youtube.com/watch?v=…, youtu.be/…, shorts 주소)'); return; }
  if (SAVED.has(id)) { toast('이미 수집한 영상입니다.'); return; }
  if (V[id]) { toggleCollect(id); $('extUrl').value = ''; return; }
  const btn = e.target.querySelector('button'); btn.disabled = true;
  const info = await ytInfo('https://www.youtube.com/watch?v=' + id);
  try { await DB.doc('collected/' + id).set({id, ext: true, url: /shorts\//.test(url) ? 'https://www.youtube.com/shorts/' + id : 'https://www.youtube.com/watch?v=' + id, t: info.t || '외부 영상 (제목은 기획할 때 확인)', cn: info.cn, vc: 0, short: /shorts\//.test(url), by: UID || '', at: Date.now(), src: 'link'}); $('extUrl').value = ''; toast('수집했습니다. 체크하고 기획하기를 누르면 이 영상을 레퍼런스로 대본을 씁니다.'); }
  catch(err) { toast('저장하지 못했습니다. 팀 비밀번호와 인터넷 연결을 확인해 주세요.'); }
  btn.disabled = false;
});

async function fireTrigger(tid, text){
  if (!MCP || !tid) return false;
  try { await MCP.callTool('Claude Code Remote', 'fire_trigger', {trigger_id: tid, text}); return true; } catch(e) { return false; }
}

// ---------- plans ----------
const STEPS = ['대기 중','레퍼런스 분석','팩트 확인','대본 작성','노션 저장','완료'];
function planCard(p){
  const res = p.res || {}; const done = p.status === 'done'; const err = p.status === 'error';
  const stepIdx = done ? STEPS.length - 1 : Math.max(0, STEPS.indexOf(p.step));
  const thumbsRow = (ids, n) => `<div class="vgrid">${(ids||[]).slice(0, n||8).map(x => { const id = typeof x === 'string' ? x : x.id; const v = V[id] || (typeof x === 'object' ? Object.assign({id, kw:[]}, x) : null); if (!v) return ''; return `<div class="vcard">${thumb(v)}<a class="tt" href="${v.short ? ytS(id) : yt(id)}" target="_blank" rel="noopener">${esc(v.t||'')}</a><span class="mt">${esc(chName(v) || v.cn || '')}${v.vc ? ' · ' + fmt(v.vc) : ''}</span>${x.note ? `<span class="mt" style="color:var(--ink2)">${esc(x.note)}</span>` : ''}</div>`; }).join('')}</div>`;
  return `<div class="plan" id="plan-${esc(p.id)}">
    <div class="plan-h" data-toggle="${esc(p.id)}">
      <span class="badge ${done ? 'b-ok' : err ? 'b-low' : 'b-good'}">${done ? '완료' : err ? '오류' : '진행 중'}</span>
      <h3>${esc(res.title || p.title || '기획 요청')}</h3>${p.cast ? `<span class="badge b-normal">${esc(p.cast)} 세무사${p.shoot ? ' · ' + esc(p.shoot.slice(5).replace('-','/')) + ' 촬영' : ''}</span>` : ''}
      ${p.notion ? `<a class="btn sm pri" href="${esc(p.notion)}" target="_blank" rel="noopener">노션 기획안 열기</a>` : ''}
      ${p.status === 'deleting' ? '<span class="badge b-stop">삭제 중 · 노션 정리 대기</span>' : `<button class="btn sm plan-del" data-del="${esc(p.id)}" type="button">기획 삭제</button>`}
      <span class="sub">${new Date(p.at || Date.now()).toLocaleString('ko-KR', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})} 요청</span>
    </div>
    <div class="plan-b" ${done ? '' : ''}>
      <div class="steps">${STEPS.map((s,i) => `<span class="step ${i < stepIdx || done ? 'done' : i === stepIdx ? 'on' : ''}">${esc(s)}</span>`).join('')}</div>
      ${err ? `<div class="notice warn">${esc(p.error || '기획을 만들지 못했습니다. 다시 요청해 주세요.')}</div>` : ''}
      ${p.note ? `<div class="foot"><b>요청 메모</b> ${esc(p.note)}</div>` : ''}
      <div><p class="sec-t">레퍼런스 영상</p>${thumbsRow((p.ids||[]).map((id, k) => V[id] ? id : Object.assign({id, t: (p.refTitles||[])[k] || (SAVED.get(id)||{}).t || '링크로 추가한 영상', cn: (SAVED.get(id)||{}).cn || ''})), 4)}</div>
      ${done ? `
      ${res.summary ? `<div class="insight">${esc(res.summary)}</div>` : ''}
      <div class="twocol">
        <div class="box"><h4>레퍼런스 서론 후킹 분석</h4><ul>${(res.hook||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="box"><h4>레퍼런스 대본 플로우</h4><ol style="margin:0;padding-left:18px">${(res.flow||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
      </div>
      <div class="box"><h4>우리 대본은 이렇게 쓰세요</h4><ul>${(res.guide||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="twocol">
        <div class="box"><h4>추천 제목</h4><ol style="margin:0;padding-left:18px">${(res.titles||[]).map(x => `<li><b>${esc(x)}</b></li>`).join('')}</ol></div>
        <div class="box"><h4>추천 썸네일 문구 · 배치</h4><ul>${(res.thumbTexts||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      ${res.thumbRule ? `<div class="box"><h4>잘 된 썸네일의 공통 규칙</h4><ul>${res.thumbRule.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div><p class="sec-t">같은 주제 · 성과 좋은 썸네일</p>${thumbsRow(res.sameThumbs, 8)}</div>
      <div><p class="sec-t">다른 업종 · 요즘 성과 좋은 썸네일</p>${thumbsRow(res.otherThumbs, 8)}</div>
      ${res.staging ? `<div class="box"><h4>추천 연출 · ${esc(res.staging.form||'')}</h4><ul>${(res.staging.how||[]).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ` : `<div class="foot">${p.status === 'queued' ? '기획 순서를 기다리는 중입니다. 보통 10~20분 안에 시작됩니다.' : '지금 작성 중입니다. 이 화면은 자동으로 갱신됩니다.'}</div>`}
    </div></div>`;
}
function renderPlans(){
  const list = [...PLANS.values()].sort((a,b) => (b.at||0) - (a.at||0));
  const unseen = list.filter(p => p.status === 'done' && !seenPlans[p.id]).length;
  $('cntPlans').hidden = !unseen; $('cntPlans').textContent = unseen;
  const queued = list.filter(p => p.status === 'queued').length; const pn = $('plansNote');
  if (queued && IS_OWNER && MCP && R.trig?.plan) { pn.hidden = false; pn.className = 'notice'; pn.innerHTML = `대기 중인 기획 요청 <b>${queued}건</b>이 있습니다. <button class="btn sm pri" id="btnRunPlans" type="button">지금 기획 시작</button>`; }
  else if (queued && !IS_OWNER) { pn.hidden = false; pn.className = 'notice'; pn.textContent = `대기 중인 기획 요청 ${queued}건 — 보통 10~20분 안에 자동으로 시작됩니다.`; }
  else pn.hidden = true;
  if (!list.length) return;
  $('planList').innerHTML = list.map(planCard).join('');
  list.forEach(p => { if (p.res?.tf) loadBucket(0, p.res.tf); });
  paintThumbs();
}
function markPlansSeen(){ let ch = false; PLANS.forEach(p => { if (p.status === 'done' && !seenPlans[p.id]) { seenPlans[p.id] = 1; ch = true; } }); if (ch) { try { localStorage.setItem('xr-seen', JSON.stringify(seenPlans)); } catch(e) {} renderPlans(); } }

// ---------- refresh ----------
function renderRefresh(){
  const b = $('btnRefresh'); const st = REFRESH?.status;
  const busy = st === 'queued' || st === 'running';
  b.classList.toggle('busy', busy);
  $('refreshLbl').textContent = busy ? (st === 'running' ? '최신화 중…' : '최신화 대기') : '최신화';
}
$('btnRefresh').addEventListener('click', async () => {
  if (!KEY) { askKey(); go('saved'); return; }
  if (REFRESH && (REFRESH.status === 'queued' || REFRESH.status === 'running')) { toast('이미 최신화하고 있습니다. 끝나면 화면이 자동으로 바뀝니다.'); return; }
  try {
    await DB.doc('jobs/refresh').set({status: 'queued', by: UID || '', reqAt: Date.now(), from: R.updated});
    const fired = await fireTrigger(R.trig?.refresh, '레이더 최신화 요청');
    toast('최신화 요청을 접수했습니다. 보통 10~20분 안에 시작되고, 끝나면 화면이 자동으로 새 데이터로 바뀝니다.', 6000);
  } catch(e) { toast('최신화를 요청하지 못했습니다. 팀 비밀번호와 인터넷 연결을 확인해 주세요.'); }
});

// ---------- drawer ----------
const dr = $('drawer'), scrim = $('scrim');
const ds = {form:'all', range:'all', pb:false, bs:false, k:'vc', dir:-1, lim:40};
function openDrawer(h){ const c = byH[h]; if (!c || c.c === 'ours') return; Object.assign(ds, {form:'all', range:'all', pb:false, bs:false, k:'vc', dir:-1, lim:40}); dr.dataset.h = h; paintDrawer(true); dr.hidden = false; scrim.hidden = false; document.body.style.overflow = 'hidden'; dr.querySelector('.x').focus(); }
function closeDrawer(){ dr.hidden = true; scrim.hidden = true; document.body.style.overflow = ''; }
function chVideos(c){ const ids = new Set([...(c.P||[]), ...(c.L||[]), ...(c.SP||[]), ...(c.SL||[])]); VIDS.forEach(v => { if (v.h === c.h) ids.add(v.id); }); return [...ids].map(id => V[id]).filter(v => v && v.t); }
function paintDrawer(full){
  const c = byH[dr.dataset.h]; const all = chVideos(c);
  const longs = all.filter(v => !v.short), shorts = all.filter(v => v.short);
  const up30 = all.filter(v => v.d != null && v.d <= 30).length, up90 = longs.filter(v => v.d != null && v.d <= 92);
  const hits = longs.filter(v => v.contrib != null && v.contrib >= 1.5).length;
  const best = [...longs].filter(v => v.d != null && v.d <= 183).sort((a,b) => b.vc - a.vc).slice(0, 3);
  let vids = all.filter(v => (ds.form === 'all' || (ds.form === 'short') === !!v.short) && (ds.range === 'all' || (v.d != null && v.d <= +ds.range)) && (!ds.pb || v.pb) && (!ds.bs || v.bs));
  if (ds.k === 'd') vids.sort((x,y) => ds.dir < 0 ? ((x.d ?? 9e9) - (y.d ?? 9e9)) : ((y.d ?? -1) - (x.d ?? -1)));
  else vids.sort((x,y) => ((y[ds.k] ?? -1) - (x[ds.k] ?? -1)) * (ds.dir < 0 ? 1 : -1));
  const th = (k, l) => `<th class="sortable ${ds.k === k ? 'on' : ''}" data-dk="${k}">${l}${ds.k === k ? (k === 'd' ? (ds.dir < 0 ? ' 최신' : ' 오래된') : (ds.dir < 0 ? ' ▼' : ' ▲')) : ''}</th>`;
  const rows = vids.slice(0, ds.lim).map(v => `<tr><td>${thumb(v)}</td>
    <td class="l"><div class="vt" style="min-width:260px"><a href="${v.short ? ytS(v.id) : yt(v.id)}" target="_blank" rel="noopener">${esc(v.t)}</a>${v.o ? `<span class="o">${esc(v.o)}</span>` : ''}${v.pb || v.bs ? `<span class="vbadges" style="margin-top:3px">${v.pb ? '<span class="badge b-star">우선 벤치마킹</span>' : ''}${v.bs ? '<span class="badge b-bs">베스트셀러</span>' : ''}</span>` : ''}</div></td>
    <td><span class="big num">${fmt(v.vc)}</span>${v.short ? '<span class="sub">쇼츠</span>' : ''}</td>
    <td>${v.contrib != null ? gr(contribGrade(v.contrib), '평소의 ' + (v.contrib >= 10 ? Math.round(v.contrib) : v.contrib.toFixed(1)) + '배') : '<span class="sub">-</span>'}</td>
    <td>${v.ratio != null ? gr(perfGrade(v.ratio), Math.round(v.ratio*100) + '%') : '<span class="sub">-</span>'}</td>
    <td>${v.mk ? `<span class="kwchip" style="font-weight:700">#${esc(v.mk)}</span>` : '<span class="sub">-</span>'}</td>
    <td class="num">${esc(ageTxt(v)) || '-'}</td><td>${collectBtn(v.id)}</td></tr>`).join('');
  const listHtml = `<div class="dr-tbl"><table><thead><tr><th>썸네일</th><th class="l" style="text-align:left">제목</th>${th('vc','조회수')}${th('contrib','기여도')}${th('ratio','성과도')}<th>메인 키워드</th>${th('d','업로드')}<th>수집</th></tr></thead><tbody>${rows || '<tr><td colspan="8" style="padding:30px;color:var(--muted)">조건에 맞는 영상이 없습니다.</td></tr>'}</tbody></table></div>${vids.length > ds.lim ? `<button class="btn" id="drMore" type="button" style="align-self:center">더 보기 (${vids.length - ds.lim}개 남음)</button>` : ''}`;
  if (!full) { dr.querySelector('#drList').innerHTML = listHtml; dr.querySelector('#drCount').innerHTML = `<b>${vids.length}</b>개 영상`; bindDr(); paintThumbs(); return; }
  dr.innerHTML = `<div class="dr-h">${av(c)}<div style="min-width:0"><h3>${esc(c.n)}</h3><div class="meta">${catPill(c)}<span class="badge b-normal">${esc(c.r)}</span><span class="badge b-normal">${esc(c.k)}</span>${c.b ? '<span class="badge b-star">★ 우선 벤치마킹</span>' : ''}${c.hot ? '<span class="badge b-hot">급성장</span>' : ''}${c.isNew ? '<span class="badge b-new">신규</span>' : ''}</div></div><a class="btn" href="https://www.youtube.com/@${encodeURIComponent(c.h)}" target="_blank" rel="noopener" style="margin-left:auto">유튜브 채널 열기 ↗</a><button class="x" type="button" aria-label="닫기" style="margin-left:8px">✕</button></div>
  <div class="dr-b">
    <div class="dr-top">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="dr-stats">
          <div><div class="l">구독자</div><div class="v num">${fmt(c.subs)}</div><div class="s">개설 ${esc((c.j||'').replace('-','.'))} · 운영 ${c.years.toFixed(1)}년</div></div>
          <div><div class="l">연평균 구독 증가</div><div class="v num" style="color:var(--brand-d)">+${fmt(c.growth)}</div><div class="s">누적 조회수 ${fmt(c.views)}</div></div>
          <div><div class="l">롱폼 평소 조회수</div><div class="v num">${fmt(c.base)}</div><div class="s">최근 롱폼 중앙값</div></div>
          <div><div class="l">쇼츠 평소 조회수</div><div class="v num">${shorts.length ? fmt(c.sbase) : '-'}</div><div class="s">쇼츠 ${shorts.length}편 수집</div></div>
          <div><div class="l">최근 성과도</div><div class="v">${c.active ? gr(perfGrade(c.recent)) : '<span class="sub">업로드 뜸함</span>'}</div><div class="s">${c.active ? '3개월 중앙값 ' + fmt(c.recentMed) + ' · 구독자의 ' + Math.round(c.recent*100) + '%' : ''}</div></div>
          <div><div class="l">최근 30일 업로드</div><div class="v num">${up30}편</div><div class="s">최근 3개월 롱폼 ${up90.length}편</div></div>
          <div><div class="l">평소보다 잘된 영상</div><div class="v num">${hits}편</div><div class="s">기여도 1.5배 이상 롱폼</div></div>
          <div><div class="l">우선 벤치마킹 · 베스트셀러</div><div class="v num">${all.filter(v => v.pb).length} · ${all.filter(v => v.bs).length}</div><div class="s">이 채널 영상 중</div></div>
        </div>
        ${c.note ? `<div class="memo">${esc(c.note)}</div>` : ''}
      </div>
      <div><p class="sec-t" style="margin:0 0 8px">최근 6개월 가장 잘된 영상</p><div class="dr-best">${best.map(v => bigCard(v)).join('') || '<p class="sub">최근 6개월 롱폼이 없습니다.</p>'}</div></div>
    </div>
    <div class="dr-tools">
      <span class="seg" id="drForm"><button data-v="all" aria-pressed="true">전체</button><button data-v="long" aria-pressed="false">롱폼</button><button data-v="short" aria-pressed="false">쇼츠</button></span>
      <span class="seg" id="drRange"><button data-v="all" aria-pressed="true">전체 기간</button><button data-v="183" aria-pressed="false">6개월</button><button data-v="92" aria-pressed="false">3개월</button><button data-v="31" aria-pressed="false">1개월</button></span>
      <label class="chk"><input type="checkbox" id="drPb"> 우선 벤치마킹</label><label class="chk"><input type="checkbox" id="drBs"> 베스트셀러</label>
      <span class="count" id="drCount" style="margin-left:auto"><b>${vids.length}</b>개 영상</span>
    </div>
    <div id="drList" style="display:flex;flex-direction:column;gap:10px">${listHtml}</div>
  </div>`;
  dr.querySelector('.x').addEventListener('click', closeDrawer);
  const seg = (id, key) => dr.querySelector('#' + id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; dr.querySelectorAll('#' + id + ' button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); ds[key] = b.dataset.v; ds.lim = 40; paintDrawer(); });
  seg('drForm', 'form'); seg('drRange', 'range');
  dr.querySelector('#drPb').addEventListener('change', e => { ds.pb = e.target.checked; paintDrawer(); });
  dr.querySelector('#drBs').addEventListener('change', e => { ds.bs = e.target.checked; paintDrawer(); });
  bindDr(); paintThumbs();
}
function bindDr(){
  dr.querySelectorAll('th[data-dk]').forEach(t => t.addEventListener('click', () => { if (ds.k === t.dataset.dk) ds.dir *= -1; else { ds.k = t.dataset.dk; ds.dir = -1; } paintDrawer(); }));
  const m = dr.querySelector('#drMore'); if (m) m.addEventListener('click', () => { ds.lim += 40; paintDrawer(); });
}
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dr.hidden) closeDrawer(); });

// ---------- first render ----------
renderOurs();
// 요즘 반응 좋은 채널: 구독자 2만↑ · 최근 3개월 롱폼 중앙값 1만 회↑(작은 채널의 비율 착시 제거) · 세무사 출연 대담 채널·제외 표시 채널 빼기
const GUEST = new Set(['tv0505','Buja_Hacker','부동산쇼mvpshow']);
const reactOk = c => c.active && !c.xr && !GUEST.has(c.h) && c.subs >= 20000 && c.recentMed >= 10000;
bars('barKr', CH.filter(c => c.c === 'kr' && reactOk(c)).sort((a,b) => b.recent - a.recent).slice(0, 10), c => c.recent, c => Math.round(c.recent*100) + '%');
bars('barOs', CH.filter(c => c.c === 'ost' && reactOk(c)).sort((a,b) => b.recent - a.recent).slice(0, 10), c => c.recent, c => Math.round(c.recent*100) + '%', 'sky');
bars('barKrp', CH.filter(c => c.c === 'krp' && c.young).sort((a,b) => b.growth - a.growth).slice(0, 10), c => c.growth, c => '+' + fmt(c.growth), 'sky');
bars('barGrowth', CH.filter(c => c.c === 'osp' && c.years <= 7 && c.subs >= 50000).sort((a,b) => b.growth - a.growth).slice(0, 10), c => c.growth, c => '+' + fmt(c.growth));
renderTopics(); renderFormats(); renderComments(); renderCh(); renderV(); renderRecs(); renderKw(); renderSaved();
AVLOAD(); paintThumbs();
try { const v = localStorage.getItem('xr-view'); const h = (location.hash||'').replace('#',''); const want = document.getElementById('v-' + h) ? h : v; if (want && document.getElementById('v-' + want)) go(want); } catch(e) {}

// ---------- 저장 서버(구글 시트) ----------
const API = 'https://script.google.com/macros/s/AKfycbw9jnfyI3sPX-p8axDUj_S7_6RKQmgRIWtH3NFR5z-7odQ_j86DVWyDVJr0vIVBAw8Zxw/exec';
let KEY = '';
try { const q = new URLSearchParams(location.search).get('k'); if (q) { localStorage.setItem('xr-key', q); history.replaceState(null, '', location.pathname + location.hash); } KEY = localStorage.getItem('xr-key') || ''; } catch(e) {}
let api = async function(body){
  const r = await fetch(API, {method: 'POST', body: JSON.stringify(Object.assign({k: KEY}, body))});
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'fail'); return j;
};
DB = { doc(path){ const [col, id] = path.split('/'); return {
  set: data => col === 'collected' ? api({a: 'collect', v: data}) : col === 'plans' ? api({a: 'plan', p: data}) : api({a: 'refresh', from: data.from}),
  update: data => col === 'plans' && data.status === 'deleting' ? api({a: 'delplan', id}) : Promise.resolve(),
  delete: () => col === 'collected' ? api({a: 'uncollect', id}) : api({a: 'delplan', id}) }; } };
function askKey(msg){
  const n = $('savedNote'); n.hidden = false; n.className = 'notice warn';
  n.innerHTML = `${msg || '수집·기획하기를 쓰려면 팀 비밀번호를 한 번 입력해 주세요.'} <span style="display:inline-flex;gap:6px;align-items:center;margin-left:6px"><label for="keyIn" style="position:absolute;left:-9999px">팀 비밀번호</label><input id="keyIn" type="password" placeholder="팀 비밀번호" style="height:30px;border:1px solid var(--line);border-radius:8px;padding:0 8px;background:var(--card);color:var(--ink)"><button class="btn sm pri" id="keyOk" type="button">확인</button></span>`;
  $('keyOk').onclick = () => { KEY = $('keyIn').value.trim(); try { localStorage.setItem('xr-key', KEY); } catch(e) {} n.hidden = true; sync(true); };
}
let firstPlans = true, syncing = false;
async function sync(force){
  if (!KEY) { askKey(); return; }
  if (syncing && !force) return; syncing = true;
  try {
    const r = await fetch(API + '?k=' + encodeURIComponent(KEY)); const j = await r.json();
    if (!j.ok) { askKey('팀 비밀번호가 맞지 않습니다. 다시 입력해 주세요.'); return; }
    SAVED.clear(); (j.collected || []).forEach(d => SAVED.set(d.id, d));
    const before = new Map([...PLANS].map(([k,v]) => [k, v.status]));
    PLANS.clear(); (j.plans || []).forEach(d => PLANS.set(d.id, d));
    if (!firstPlans) PLANS.forEach((p, id) => { if (p.status === 'done' && before.get(id) && before.get(id) !== 'done') { toast('기획이 완료됐습니다: ' + (p.res?.title || p.title || ''), 6000); $('flash').hidden = false; $('flash').className = 'notice ok'; $('flash').innerHTML = `기획 완료 · <b>${esc(p.res?.title || p.title || '')}</b> — 기획 중인 영상 탭과 노션에서 확인하세요.`; } });
    firstPlans = false; REFRESH = j.refresh || null;
    refreshCollectBtns(); renderSaved(); renderPlans(); renderRefresh();
  } catch(e) { $('savedNote').hidden = false; $('savedNote').className = 'notice warn'; $('savedNote').textContent = '저장 서버에 연결하지 못했습니다. 잠시 후 새로고침해 주세요.'; }
  finally { syncing = false; }
}
const _api = api; api = async body => { const j = await _api(body); setTimeout(() => sync(true), 300); return j; };
sync(); setInterval(() => { if (!document.hidden) sync(); }, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
})();
