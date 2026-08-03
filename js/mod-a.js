/* =========================================================
   mod-a.js — 模块 1~4：首页 / 待办 / 单词 / 阅读
   ========================================================= */
(function (w) {
  'use strict';
  const K = w.Core, D = w.D, $ = K.$, $$ = K.$$, esc = K.esc, ico = K.ico;

  /* 热度值解析与格式化（支持 60s-api 的 hot_value / hot_value_desc，以及 vvhan 的 hot/num） */
  function toNumHot(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[, ]/g, '');
    if (/亿/.test(s)) return parseFloat(s) * 1e8;
    if (/万/.test(s)) return parseFloat(s) * 1e4;
    if (/千/.test(s)) return parseFloat(s) * 1e3;
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }
  function fmtHot(v) {
    v = toNumHot(v);
    if (!v) return '';
    if (v >= 1e8) return (v / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
    if (v >= 1e4) return (v / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
    return String(v);
  }
  /* 收藏星标 SVG（空心/实心由 CSS 控制 fill） */
  const STAR_SVG = '<svg class="star-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.5L12 17.8 6.1 20.9l1.3-6.5L2.5 9.9l6.6-.8z"/></svg>';

  /* 热榜池单独存 localStorage：体积较大（100~250 条），不放进 Store.data，避免拖大云同步 payload */
  const POOL_KEY = 'erasLifeXuan_hotpool_v1';
  const HotPool = {
    get() {
      try { const a = JSON.parse(localStorage.getItem(POOL_KEY) || '[]'); return Array.isArray(a) ? a : []; }
      catch (e) { return []; }
    },
    set(a) { try { localStorage.setItem(POOL_KEY, JSON.stringify(a || [])); } catch (e) {} }
  };

  /* ---------- 热点轮转：从完整热榜池中按批次环形抽取，保证每次刷新内容不同 ----------
     pool 内每项带 si（来源索引）。按来源分组后各自环形取窗口，再按热度排序合并。 */
  const BATCH_TARGET = 26;
  function pickBatch(pool, page) {
    if (!pool || !pool.length) return [];
    const groups = {};
    pool.forEach(it => { const k = it.si == null ? 'x' : it.si; (groups[k] = groups[k] || []).push(it); });
    const keys = Object.keys(groups);
    if (!keys.length) return [];
    const per = Math.max(4, Math.ceil(BATCH_TARGET / keys.length));
    const out = [], seen = {};
    keys.forEach(k => {
      const arr = groups[k], L = arr.length;
      if (!L) return;
      const start = ((page * per) % L + L) % L;
      for (let n = 0; n < Math.min(per, L); n++) {
        const it = arr[(start + n) % L];
        const t = String(it.title || '').trim();
        if (!t || seen[t]) continue;
        seen[t] = 1; out.push(it);
      }
    });
    return out.sort((a, b) => (b.hot || 0) - (a.hot || 0));
  }
  /* 池子总批次数（用于底部提示） */
  function poolBatches(pool) {
    if (!pool || !pool.length) return 1;
    const g = {}; pool.forEach(it => { const k = it.si == null ? 'x' : it.si; g[k] = (g[k] || 0) + 1; });
    const keys = Object.keys(g);
    const per = Math.max(4, Math.ceil(BATCH_TARGET / keys.length));
    return Math.max(1, Math.ceil(Math.max.apply(null, keys.map(k => g[k])) / per));
  }

  /* ---------- 通用 UI 片段 ---------- */
  const UI = {
    card(opts) {
      const { title, icon, body, extra, cls, id, sort } = opts;
      return '<section class="card ' + (cls || '') + '"' + (id ? ' id="' + id + '"' : '') + (sort ? ' data-sort-id="' + sort + '"' : '') + '>' +
        (title ? '<div class="card-h">' +
          (sort ? '<div class="card-drag drag-handle">' + ico('i-drag') + '</div>' : '') +
          '<div class="card-ico">' + ico(icon || 'i-sparkle') + '</div>' +
          '<div class="card-t">' + esc(title) + '</div>' +
          (extra ? '<div class="card-x">' + extra + '</div>' : '') + '</div>' : '') +
        body + '</section>';
    },
    stat(v, k, cls) { return '<div class="stat"><div class="stat-v ' + (cls || '') + '">' + v + '</div><div class="stat-k">' + esc(k) + '</div></div>'; },
    bar(p, cls) { return '<div class="pbar ' + (cls || '') + '"><i style="width:' + K.clamp(p, 0, 100) + '%"></i></div>'; },
    empty(text, icon) { return '<div class="empty">' + ico(icon || 'i-sparkle') + esc(text) + '</div>'; },
    tag(t, c) { return '<span class="tag ' + (c || '') + '">' + esc(t) + '</span>'; }
  };
  w.UI = UI;

  const Pages = w.Pages = w.Pages || {};

  /* =======================================================
     模块 1 · 首页
     ======================================================= */
  Pages.home = {
    render() {
      const S = K.Store.data;
      const order = S.settings.homeCards;
      return '<div class="fab-row"><button class="btn xs ghost" id="homeSort">调整卡片顺序</button>' +
        '<div style="flex:1"></div><div class="hint" style="align-self:center">数据每日自动更新</div></div>' +
        '<div id="homeCards">' + order.map(id => this.card(id)).join('') + '</div>' +
        '<div class="foot-note">Eras Life・璇 · 本地自动留存 · 长按卡片手柄可排序</div>';
    },
    card(id) {
      const S = K.Store.data, today = K.dstr();
      switch (id) {
        case 'days': {
          const n = S.meta.visitDays.length, span = K.dayDiff(S.meta.firstUse, today) + 1;
          return UI.card({
            sort: 'days', icon: 'i-heart', title: '工作台累计使用', cls: 'tex-knit',
            extra: '始于 ' + esc(S.meta.firstUse),
            body: '<div class="grid g3">' +
              UI.stat(n, '累计使用天数') + UI.stat(span, '陪伴总天数') + UI.stat(D.sleepStreak() + '/' + D.wordStreak(), '早睡 / 单词连击') +
              '</div><div class="hint" style="margin-top:8px">你已经在自己的时代里，稳稳走过 <b>' + n + '</b> 天 ✦</div>'
          });
        }
        case 'clock':
          return UI.card({
            sort: 'clock', icon: 'i-sparkle', title: '北京时间',
            body: '<div class="clock"><div class="clock-t" id="clkT">--:--:--</div>' +
              '<div class="clock-d" id="clkD">—</div><div class="clock-z">24 小时制 · 北京时间 UTC+8</div></div>'
          });
        case 'weather':
          return UI.card({
            sort: 'weather', icon: 'i-vinyl', title: '所在地实时天气',
            extra: '<button class="btn xs ghost" id="cityBtn">' + esc(S.settings.city.name) + ' 切换</button>',
            body: '<div id="wxBox"><div class="hint">正在获取实时天气…</div></div>'
          });
        case 'news':
          return UI.card({
            sort: 'news', icon: 'i-news', title: '全领域实时热点 · 文章 / 视频', cls: 'tex-news',
            extra: '<button class="btn xs ghost" id="newsRe">刷新</button>',
            body: '<div id="hotBox"><div class="hint">正在获取今日热点…</div></div>'
          });
        case 'jump':
          return UI.card({
            sort: 'jump', icon: 'i-news', title: '快捷跳转',
            body: '<button class="btn primary full" data-go="todo">' + ico('i-check') + ' 一键前往【待办模块】</button>' +
              '<div class="btn-row"><button class="btn soft" data-go="sleep">今日早睡打卡</button><button class="btn soft" data-go="mood">记录此刻心情</button></div>'
          });
        case 'overview': {
          const t = D.todoRate(today), wk = D.weekTodoRate(today);
          const wd = S.words.days[today] || {}, rl = S.reading.logs.filter(l => l.date === today);
          const rmin = rl.reduce((s, l) => s + K.num(l.minutes), 0);
          const sv = D.savedTotal(r => r.date === today);
          const md = S.mood.logs.find(l => l.date === today);
          return UI.card({
            sort: 'overview', icon: 'i-chart', title: '今日概览',
            body: '<div class="grid g4">' +
              UI.stat(t.rate + '%', '待办完成', 'sm') +
              UI.stat((wd.minutes || 0) + '′', '单词用时', 'sm') +
              UI.stat(rmin + '′', '阅读时长', 'sm') +
              UI.stat(md ? (md.score + '分') : '—', '心情评分', 'sm') +
              '</div>' +
              '<div style="margin-top:10px"><div class="prow"><span>本周待办完成率</span><b>' + wk.done + '/' + wk.all + ' · ' + wk.rate + '%</b></div>' + UI.bar(wk.rate) + '</div>' +
              '<div style="margin-top:8px"><div class="prow"><span>今日存入</span><b>' + K.money(sv) + '</b></div></div>'
          });
        }
        default: return '';
      }
    },
    mount(root, App) {
      const S = K.Store.data;
      // 版本校验：版本变更时清理可能被旧版本污染的热点缓存，确保刷新可用
      const VER = window.APP_VER || 'v16';
      if (S.__ver !== VER) {
        S.__ver = VER;
        const hl = S.hot && S.hot.list;
        if (hl && hl.length && !hl.some(x => x.id && String(x.id).indexOf('live_') === 0)) {
          S.hot.list = []; S.hot.updated = 0;
        }
        K.Store.save();
      }
      // 时钟
      const tick = () => {
        const d = K.nowBJ();
        const t = $('#clkT'); if (!t) return;
        t.textContent = K.pad(d.getHours()) + ':' + K.pad(d.getMinutes()) + ':' + K.pad(d.getSeconds());
        $('#clkD').textContent = d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · ' + K.weekdayCN(K.dstr(d));
      };
      tick(); App.timer(setInterval(tick, 1000));

      $$('[data-go]', root).forEach(b => b.addEventListener('click', () => App.go(b.dataset.go)));
      const cb = $('#cityBtn'); if (cb) cb.addEventListener('click', () => this.cityPicker(App));
      const nr = $('#newsRe'); if (nr) nr.addEventListener('click', () => this.loadNews(true));
      const hb = $('#hotBox'); if (hb) hb.addEventListener('click', e => {
        const more = e.target.closest('#hotMore');
        if (more) { this.loadNews(true); return; }
        const fav = e.target.closest('#hotFav');
        if (fav) { this.openFav(); return; }
        const star = e.target.closest('.hot-star');
        if (star) { const it = (K.Store.data.hot.list || []).find(x => x.id === star.dataset.hid); if (it) this.toggleFav(it); return; }
        const c = e.target.closest('.hot-card');
        if (c) { const it = (K.Store.data.hot.list || []).find(x => x.id === c.dataset.hid); if (it) this.openHot(it); }
      });
      const hs = $('#homeSort');
      if (hs) hs.addEventListener('click', () => {
        const box = $('#homeCards'); box.classList.toggle('sorting-cards');
        hs.textContent = box.classList.contains('sorting-cards') ? '完成排序' : '调整卡片顺序';
        hs.classList.toggle('active');
        K.Toast(box.classList.contains('sorting-cards') ? '拖动卡片左侧手柄即可排序' : '顺序已保存');
      });
      const box = $('#homeCards');
      if (box) K.makeSortable(box, {
        item: '.card[data-sort-id]', handle: '.card-drag',
        onEnd: ids => { S.settings.homeCards = ids; K.Store.save(); }
      });
      this.loadWeather(); this.loadNews(false);
    },
    /* 天气 */
    loadWeather(force) {
      const S = K.Store.data, box = $('#wxBox'); if (!box) return;
      const c = S.settings.city, cache = S.weatherCache;
      if (!force && cache && cache.key === c.name && Date.now() - cache.at < 20 * 60000) { this.paintWeather(cache.d); return; }
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon +
        '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=1';
      K.fetchJSON(url, 8000).then(j => {
        const d = {
          t: Math.round(j.current.temperature_2m), f: Math.round(j.current.apparent_temperature),
          h: j.current.relative_humidity_2m, wc: j.current.weather_code, wind: j.current.wind_speed_10m,
          max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]),
          pop: j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[0] : null, city: c.name
        };
        S.weatherCache = { key: c.name, at: Date.now(), d: d }; K.Store.save();
        this.paintWeather(d);
      }).catch(() => {
        if (cache) { this.paintWeather(cache.d, true); }
        else box.innerHTML = '<div class="hint">暂时无法获取实时天气（网络不可用）。<br>已保留离线模式，联网后自动恢复。</div>' +
          '<div class="btn-row"><button class="btn sm ghost" id="wxRe">重新获取</button></div>';
        const r = $('#wxRe'); if (r) r.addEventListener('click', () => this.loadWeather(true));
      });
    },
    paintWeather(d, stale) {
      const box = $('#wxBox'); if (!box) return;
      const wm = D.WMO[d.wc] || ['未知', '🌈'];
      box.innerHTML = '<div class="wx"><div class="wx-emo">' + wm[1] + '</div>' +
        '<div style="flex:1;min-width:0"><div class="wx-t">' + d.t + '°C <span style="font-size:12px;font-weight:600;color:var(--ink-3)">' + esc(wm[0]) + '</span></div>' +
        '<div class="wx-m">' + esc(d.city) + ' · 体感 ' + d.f + '°C · 湿度 ' + d.h + '%</div></div>' +
        '<div style="text-align:right"><div class="tag pink">' + d.min + '° ~ ' + d.max + '°</div>' +
        (d.pop != null ? '<div class="wx-m" style="margin-top:4px">降水概率 ' + d.pop + '%</div>' : '') + '</div></div>' +
        '<div class="hint" style="margin-top:8px">' + (stale ? '（离线缓存）' : '') + this.wxTip(d) + '</div>';
    },
    wxTip(d) {
      if (d.pop != null && d.pop >= 50) return '今天可能下雨，出门记得带伞 ☔️ 温柔照顾好自己。';
      if (d.t >= 30) return '天气偏热，多喝水、别忘了防晒 ✦';
      if (d.t <= 8) return '降温了，穿上你的针织毛衣再出门 🧶';
      return '天气刚刚好，适合去完成一件小事 ✦';
    },
    cityPicker(App) {
      K.Sheet.form({
        title: '设置所在城市',
        fields: [
          { k: 'q', label: '城市名称（支持中文）', value: K.Store.data.settings.city.name, required: true, placeholder: '如：北京 / 杭州 / 成都' },
          { k: 'note', type: 'note', label: '定位数据来自 Open-Meteo 公共地理服务，实时天气按所选城市展示。' }
        ],
        submitText: '搜索并保存',
        onSubmit: (v, a) => {
          K.fetchJSON('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(v.q) + '&count=1&language=zh&format=json', 8000)
            .then(j => {
              if (!j.results || !j.results.length) { K.Toast('没有找到这个城市，换个名字试试'); return; }
              const r = j.results[0];
              K.Store.data.settings.city = { name: r.name || v.q, lat: r.latitude, lon: r.longitude, auto: false };
              K.Store.data.weatherCache = null; K.Store.save();
              K.Toast('已切换到 ' + (r.name || v.q)); App.render();
            }).catch(() => {
              K.Store.data.settings.city.name = v.q; K.Store.save();
              K.Toast('网络不可用，已记录城市名称');
            });
          return true;
        }
      });
    },
    /* 实时热点（全领域文章 / 视频，显示热度值，点击进入内置阅读器 / 播放器，支持收藏） */
    loadNews(force) {
      const S = K.Store.data, box = $('#hotBox');
      const bundled = D.HOTSPOTS.map(x => Object.assign({ id: x.id, hot: 0, domain: '精选' }, x));
      S.hot = S.hot || { list: [], updated: 0 };
      if (typeof S.hot.page !== 'number') S.hot.page = 0;
      if (S.hot.pool) { delete S.hot.pool; K.Store.save(); } // 旧版本曾把池写进 Store，这里清理掉
      const pool0 = HotPool.get();
      // 记录刷新前标题集合，用于统计本批新内容数量
      const prevTitles = new Set((S.hot.list || []).map(x => String(x.title || '').trim()).filter(Boolean));
      // 迁移/修复：旧版本可能把内置精选写入 S.hot.list 导致永远只显示精选
      const isOnlyBundled = S.hot.list && S.hot.list.length && !S.hot.list.some(x => x.id && String(x.id).indexOf('live_') === 0);
      if (isOnlyBundled) { S.hot.list = []; S.hot.updated = 0; K.Store.save(); }
      if (!force && S.hot.list && S.hot.list.length) { this.paintHot(S.hot.list, false); return; }

      // ① 刷新即换批：先用本地热榜池立刻切到「下一批」，保证点一次必有变化（离线同样有效）
      let quickDone = false;
      if (force) {
        S.hot.page = (S.hot.page + 1) % 100000;
        const quick = pickBatch(pool0, S.hot.page);
        if (quick.length) {
          S.hot.list = bundled.concat(quick); S.hot.updated = Date.now(); K.Store.save();
          this.paintHot(S.hot.list, false, { ok: 0, fail: 0, page: S.hot.page, total: poolBatches(pool0), pool: pool0.length });
          quickDone = true;
        } else { S.hot.list = []; S.hot.updated = 0; K.Store.save(); }
      }
      if (!quickDone && box) box.innerHTML = '<div class="hot-status"><div class="spinner sm"></div><div class="hint">正在获取全领域实时热点…</div></div>';
      const nr0 = $('#newsRe'); if (nr0) { nr0.disabled = true; nr0.classList.add('loading'); nr0.textContent = '刷新中'; }

      // ② 后台拉取全量热榜，扩充/更新本地池
      // 主源：60s-api（国内可达，字段规范，每源 30~50 条）；备用源：vvhan（短超时，避免拖垮）
      const srcs = [
        { n: '微博', domain: '综合', type: 'article', u: 'https://60s-api.viki.moe/v2/weibo', timeout: 7000 },
        { n: '知乎', domain: '知识', type: 'article', u: 'https://60s-api.viki.moe/v2/zhihu', timeout: 7000 },
        { n: '抖音', domain: '视频', type: 'video', u: 'https://60s-api.viki.moe/v2/douyin', timeout: 7000 },
        { n: '今日头条', domain: '新闻', type: 'article', u: 'https://60s-api.viki.moe/v2/toutiao', timeout: 7000 },
        {
          n: '每日简报', domain: '简报', type: 'article', u: 'https://60s-api.viki.moe/v2/60s', timeout: 7000,
          parse: (j, s, i) => {
            const d = (j && j.data) || {}; const link = d.link || '';
            return (d.news || []).slice(0, 20).map((t, k) => ({
              id: 'live_' + i + '_' + k, si: i, title: String(t || ''), url: link, cover: '',
              hot: 0, type: 'article', domain: '简报', source: '每日简报'
            })).filter(x => x.title);
          }
        },
        { n: '百度', domain: '综合', type: 'article', u: 'https://api.vvhan.com/api/hotlist/baiduRD', timeout: 6000 },
        { n: '36氪', domain: '财经', type: 'article', u: 'https://api.vvhan.com/api/hotlist/36kr', timeout: 6000 },
        { n: 'IT之家', domain: '科技', type: 'article', u: 'https://api.vvhan.com/api/hotlist/ithome', timeout: 6000 }
      ];
      const defaultParse = (j, s, i) => {
        let arr = (j && (j.data || j.Data)) ? (j.data || j.Data) : [];
        if (!Array.isArray(arr)) arr = Object.values(arr).filter(Boolean);
        return arr.filter(x => x && (x.title || x.name)).slice(0, 50).map((x, k) => ({
          id: 'live_' + i + '_' + k, si: i,
          title: String(x.title || x.name || ''),
          url: x.link || x.url || x.mobileUrl || x.mobil_url || '',
          cover: x.cover || '',
          hot: toNumHot(x.hot_value || x.hot_value_desc || x.hot || x.num),
          type: s.type, domain: s.domain, source: s.n
        }));
      };
      const pools = srcs.map(() => []);
      const srcStatus = srcs.map(() => 'pending'); // pending/success/fail
      const statusMeta = { ok: 0, fail: 0, at: 0 };
      let done = 0, rendered = false;
      const restoreBtn = () => {
        const nr = $('#newsRe');
        if (nr) { nr.disabled = false; nr.classList.remove('loading'); nr.textContent = '刷新'; }
      };
      const updateStatus = () => {
        const el = box && box.querySelector('.hot-status');
        if (!el) return;
        const tags = srcs.map((s, i) => {
          const st = srcStatus[i];
          const icon = st === 'success' ? '✓' : st === 'fail' ? '✗' : '···';
          return '<span class="src-tag ' + st + '">' + icon + ' ' + esc(s.n) + '</span>';
        }).join('');
        el.innerHTML = '<div class="spinner sm"></div><div class="hint">正在获取全领域实时热点…</div><div class="src-row">' + tags + '</div>';
      };
      const applyPool = () => {
        const flat = [];
        pools.forEach(p => p.forEach(it => flat.push(it)));
        if (!flat.length) return false;
        const batch = pickBatch(flat, S.hot.page);
        if (!batch.length) return false;
        HotPool.set(flat);
        statusMeta.total = poolBatches(flat); statusMeta.pool = flat.length;
        S.hot.list = bundled.concat(batch);
        S.hot.updated = Date.now(); K.Store.save();
        this.paintHot(S.hot.list, false, {
          ok: statusMeta.ok, fail: statusMeta.fail,
          page: S.hot.page, total: statusMeta.total, pool: flat.length
        });
        rendered = true;
        return true;
      };
      const finish = () => {
        if (done < srcs.length) return;
        restoreBtn();
        statusMeta.at = Date.now();
        if (applyPool()) {
          if (force) {
            const cur = (S.hot.list || []).filter(x => x.si != null);
            const fresh = cur.filter(x => !prevTitles.has(String(x.title || '').trim())).length;
            const total = statusMeta.total || 1;
            K.Toast('已换一批 · 本批 ' + cur.length + ' 条（新内容 ' + fresh + ' 条）· 第 ' +
              ((S.hot.page % total) + 1) + '/' + total + ' 批 · ' + statusMeta.ok + '/' + srcs.length + ' 个源', 3400);
          }
        } else if (quickDone) {
          if (force) K.Toast('网络暂不可用，已从本地热榜池换了一批', 3000);
        } else {
          // 全部失败且无本地池：给出明确提示和重试按钮
          if (box) {
            box.innerHTML = '<div class="hot-empty">' +
              '<div class="hot-empty-icon">📡</div>' +
              '<div class="hot-empty-title">实时热点获取失败</div>' +
              '<div class="hot-empty-desc">可能原因：网络受限、接口暂时不可用或当前地区无法访问热榜接口。<br>点击下方按钮重新获取，或检查网络后重试。</div>' +
              '<button class="btn primary" id="hotRetry">重新获取热点</button>' +
              '</div>';
            const r = $('#hotRetry'); if (r) r.addEventListener('click', () => this.loadNews(true));
          }
          if (force) K.Toast('刷新失败，请检查网络');
        }
      };
      if (!quickDone) updateStatus();
      srcs.forEach((s, i) => {
        const url = s.u + (s.u.indexOf('?') > 0 ? '&' : '?') + '_t=' + Date.now() + '&_p=' + S.hot.page;
        K.fetchJSON(url, s.timeout || 6000).then(j => {
          pools[i] = (s.parse ? s.parse(j, s, i) : defaultParse(j, s, i)) || [];
          if (pools[i].length) { srcStatus[i] = 'success'; statusMeta.ok++; }
          else { srcStatus[i] = 'fail'; statusMeta.fail++; }
        }).catch(() => { srcStatus[i] = 'fail'; statusMeta.fail++; }).then(() => {
          done++;
          if (!quickDone && !rendered && pools.some(p => p.length)) applyPool(); // 首屏尽快出内容
          finish();
          if (!rendered && !quickDone) updateStatus();
        });
      });
      // 兜底：11s 后若仍无数据，强制结束
      setTimeout(() => {
        if (done < srcs.length && !pools.some(p => p.length)) { done = srcs.length; finish(); }
      }, 11000);
    },
    paintHot(list, stale, meta) {
      const box = $('#hotBox'); if (!box) return;
      const S = K.Store.data;
      S.fav = S.fav || { list: [] };
      if (S.hot && S.hot.history) { delete S.hot.history; }
      const favIds = {}; (S.fav.list || []).forEach(f => { favIds[f.id] = 1; });
      const favN = S.fav.list.length;
      let h = list.map(x => {
        const on = favIds[x.id] ? ' on' : '';
        const typeBadge = '<span class="hot-badge ' + (x.type === 'video' ? 'v' : 'a') + '">' + (x.type === 'video' ? '▶ 视频' : '文章') + '</span>';
        const dom = (x.domain && x.domain !== '精选') ? '<span class="hot-dom">' + esc(x.domain) + '</span>' : '';
        const src = x.source ? '<span class="hot-dom src">' + esc(x.source) + '</span>' : '';
        let heat = x.hot ? '<span class="hot-heat">热度 ' + fmtHot(x.hot) + '</span>'
          : (x.domain === '精选' ? '<span class="hot-dom sel">编辑精选</span>'
            : (x.domain === '简报' ? '<span class="hot-dom sel">今日简报</span>' : '<span class="hot-heat none">暂无热度</span>'));
        const star = '<button class="hot-star' + on + '" data-hid="' + esc(x.id) + '" aria-label="收藏">' + STAR_SVG + '</button>';
        return '<div class="hot-card" data-hid="' + esc(x.id) + '">' +
          '<div class="hot-top">' + typeBadge + dom + src + heat + '</div>' +
          '<div class="hot-tt">' + esc(x.title) + '</div>' +
          (x.summary ? '<div class="hot-ds">' + esc(x.summary) + '</div>' : '') +
          star +
        '</div>';
      }).join('');
      h += '<div class="btn-row" style="margin-top:10px">' +
        '<button class="btn sm primary" id="hotMore">换一批 ↻</button>' +
        '<button class="btn sm soft" id="hotFav">我的收藏（' + favN + '）</button></div>';
      const liveCount = list.filter(x => x.id && String(x.id).indexOf('live_') === 0).length;
      const srcTxt = meta && meta.ok ? (' · ' + meta.ok + '/' + (meta.ok + meta.fail) + ' 个源') : '';
      const cachedPool = (meta && meta.total) ? null : HotPool.get();
      const total = (meta && meta.total) || poolBatches(cachedPool);
      const page = (meta && meta.page != null) ? meta.page : (S.hot.page || 0);
      const poolN = (meta && meta.pool) || (cachedPool ? cachedPool.length : 0);
      const batchTxt = poolN ? (' · 第 ' + ((page % total) + 1) + '/' + total + ' 批（热榜池 ' + poolN + ' 条）') : '';
      const updatedAt = S.hot.updated ? ' · 更新于 ' + K.tstr(new Date(S.hot.updated)) : '';
      h += '<div class="hint" style="margin-top:6px">本批 ' + liveCount + ' 条 · 来源：内置精选 + 全领域实时热榜（综合·知识·新闻·财经·科技·视频·简报）' +
        (stale ? '（离线缓存）' : '') + batchTxt + srcTxt + updatedAt +
        ' · 每次点「换一批 / 刷新」都会切换到不同内容 · ' + (window.APP_VER || '') + '</div>';
      box.innerHTML = h;
    },
    openHot(item) {
      if (item.type === 'video') { App.openVideo(item); return; }
      App.openArticle(item);
    },
    isFav(id) { const S = K.Store.data; S.fav = S.fav || { list: [] }; return S.fav.list.some(f => f.id === id); },
    toggleFav(item) {
      const S = K.Store.data; S.fav = S.fav || { list: [] };
      const i = S.fav.list.findIndex(f => f.id === item.id);
      let added;
      if (i >= 0) { S.fav.list.splice(i, 1); added = false; K.Toast('已取消收藏'); }
      else { S.fav.list.unshift(Object.assign({}, item, { at: K.dstr() })); added = true; K.Toast('收藏成功'); }
      K.Store.save();
      const star = document.querySelector('#hotBox .hot-card[data-hid="' + (item.id || '').replace(/"/g, '\\"') + '"] .hot-star');
      if (star) star.classList.toggle('on', added);
      const fb = document.querySelector('#hotFav'); if (fb) fb.textContent = '我的收藏（' + S.fav.list.length + '）';
    },
    openFav() { App.openFav(); }
  };

  /* =======================================================
     模块 2 · 待办
     ======================================================= */
  const TODO_DATETIME_CATS = ['morning', 'study', 'trip', 'work']; // 这四类使用完整日期时间选择器
  const todoNeedDateTime = cat => TODO_DATETIME_CATS.indexOf(cat) >= 0;
  function todoNormalizeDue(due, ds) {
    if (!due) return '';
    if (K.isFullDateTime(due)) return due;
    if (/^\d{2}:\d{2}$/.test(due)) return ds + ' ' + due; // 旧数据兼容：把时间补上当天的日期
    return '';
  }
  function todoDisplayDue(due, cat) {
    if (!due) return '';
    if (todoNeedDateTime(cat) && K.isFullDateTime(due)) return K.fmtDateTime(due);
    return due;
  }
  function todoIsOverdue(i, ds, today) {
    if (!i.due || i.done) return false;
    if (todoNeedDateTime(i.cat)) {
      if (!K.isFullDateTime(i.due)) return false;
      const p = K.parseDateTime(i.due);
      if (!p.date) return false;
      if (p.date < today) return true;
      if (p.date === today && K.hm2min(p.time) < K.hm2min(K.tstr())) return true;
      return false;
    }
    const nowM = K.hm2min(K.tstr());
    return ds < today || (ds === today && K.hm2min(i.due) < nowM);
  }
  function todoTimePart(i) {
    if (todoNeedDateTime(i.cat) && K.isFullDateTime(i.due)) return K.parseDateTime(i.due).time;
    return i.due;
  }

  Pages.todo = {
    date: null,
    render() {
      const ds = this.date = this.date || K.dstr();
      const S = K.Store.data;
      D.ensureTodoDay(ds);
      const day = S.todo.days[ds], today = K.dstr();
      const r = D.todoRate(ds), wk = D.weekTodoRate(ds);
      const nowM = K.hm2min(K.tstr());
      const overdue = day.items.filter(i => !i.done && i.due && ds <= today && (ds < today || K.hm2min(i.due) < nowM));
      let h = '';
      h += '<div class="seg" id="dateSeg">' +
        '<button data-d="' + K.addDays(today, -1) + '"' + (ds === K.addDays(today, -1) ? ' class="on"' : '') + '>昨天</button>' +
        '<button data-d="' + today + '"' + (ds === today ? ' class="on"' : '') + '>今天</button>' +
        '<button data-d="' + K.addDays(today, 1) + '"' + (ds === K.addDays(today, 1) ? ' class="on"' : '') + '>明天</button>' +
        '<button id="pickDate">' + esc(K.mdShort(ds)) + ' ' + esc(K.weekdayCN(ds)) + ' ▾</button></div>';

      h += UI.card({
        icon: 'i-chart', title: '完成率统计', extra: esc(ds),
        body: '<div class="grid g3">' + UI.stat(r.rate + '%', '当日完成率') + UI.stat(r.done + '/' + r.all, '当日完成数') + UI.stat(wk.rate + '%', '本周完成率') + '</div>' +
          '<div style="margin-top:10px">' + UI.bar(r.rate) + '</div>' +
          '<div class="prow" style="margin-top:8px"><span>本周累计 ' + wk.done + '/' + wk.all + '</span><span>' + (r.rate >= 80 ? '今天很稳，继续保持 ✦' : '慢慢来，完成比完美重要') + '</span></div>'
      });

      if (overdue.length) {
        h += UI.card({
          icon: 'i-bell', title: '逾期预警', cls: 'tex-news',
          body: '<div class="hint" style="color:#D2536F;font-weight:700;margin-bottom:8px">有 ' + overdue.length + ' 项任务已超时未完成，记得尽快处理：</div>' +
            overdue.map(i => '<div class="li overdue"><div class="li-main"><div class="li-t">' + esc(i.title) + '</div><div class="li-s">' + UI.tag('截止 ' + i.due, 'bad') + UI.tag(D.PRI[i.pri].t + '优先级', D.PRI[i.pri].c) + '</div></div></div>').join('')
        });
      }

      D.TODO_CATS.forEach(c => {
        const items = day.items.filter(i => i.cat === c.id);
        const done = items.filter(i => i.done).length;
        h += UI.card({
          icon: c.icon, title: c.name, extra: done + '/' + items.length + (c.calendar ? ' · 联动日历' : ''),
          body: (items.length ? items.map(i => this.item(i, ds, today)).join('') : UI.empty(c.calendar ? '暂无出行事务，点击下方新增并设置提醒' : '今天这一栏还空着')) +
            '<button class="btn sm soft full" style="margin-top:8px" data-add="' + c.id + '">' + ico('i-plus', 'sm') + ' 新增' + esc(c.name) + '</button>'
        });
      });

      h += UI.card({
        icon: 'i-sparkle', title: '自动化规则',
        body: '<div class="hint">· 未完成任务次日自动顺延，并标记「顺延」次数<br>· 设置截止时间后超时自动进入逾期预警<br>· 出行事务可开启提醒，打开工作台时自动播报<br>· 熬夜惩罚任务会自动写入「学习任务」</div>'
      });
      return h;
    },
    item(i, ds, today) {
      const p = D.PRI[i.pri] || D.PRI.mid;
      const od = todoIsOverdue(i, ds, today);
      return '<div class="li' + (i.done ? ' done' : '') + (od ? ' overdue' : '') + '" data-id="' + i.id + '">' +
        '<button class="cbox" data-t="' + i.id + '" aria-label="完成">' + ico('i-check') + '</button>' +
        '<div class="li-main" data-e="' + i.id + '"><div class="li-t">' + esc(i.title) + '</div>' +
        '<div class="li-s">' + UI.tag(p.t + '优先级', p.c) +
        (i.due ? UI.tag((i.remind ? '⏰ ' : '') + todoDisplayDue(i.due, i.cat), od ? 'bad' : 'sky') : '') +
        (i.carried ? UI.tag('顺延 ×' + i.carryN, 'warn') : '') +
        (i.penalty ? UI.tag('熬夜惩罚', 'bad') : '') +
        (i.note ? '<span style="color:var(--ink-3)">' + esc(i.note.slice(0, 18)) + '</span>' : '') +
        '</div></div>' +
        '<div class="li-act"><button class="mini-btn del" data-x="' + i.id + '" aria-label="删除">' + ico('i-close') + '</button></div></div>';
    },
    mount(root, App) {
      const S = K.Store.data, ds = this.date;
      $$('#dateSeg [data-d]', root).forEach(b => b.addEventListener('click', () => { this.date = b.dataset.d; App.render(); }));
      const pd = $('#pickDate', root);
      if (pd) pd.addEventListener('click', () => {
        K.Sheet.form({
          title: '选择日期', fields: [{ k: 'd', label: '日期', type: 'date', value: this.date, required: true }],
          onSubmit: v => { this.date = v.d; D.ensureTodoDay(v.d); App.render(); }
        });
      });
      $$('[data-t]', root).forEach(b => b.addEventListener('click', () => {
        const it = S.todo.days[ds].items.find(x => x.id === b.dataset.t); if (!it) return;
        it.done = !it.done; it.doneAt = it.done ? K.tstr() : ''; K.Store.save();
        if (it.done) K.Toast(K.pick(['完成一件 ✦', '很棒，继续保持', 'Long live 今天的你', '又向前走了一步 💗']));
        App.render();
      }));
      $$('[data-x]', root).forEach(b => b.addEventListener('click', () => {
        const d = S.todo.days[ds];
        d.items = d.items.filter(x => x.id !== b.dataset.x); K.Store.save(); App.render();
      }));
      $$('[data-e]', root).forEach(b => b.addEventListener('click', () => {
        const it = S.todo.days[ds].items.find(x => x.id === b.dataset.e); if (it) this.edit(it, App);
      }));
      $$('[data-add]', root).forEach(b => b.addEventListener('click', () => this.edit(null, App, b.dataset.add)));
      this.checkRemind();
    },
    edit(it, App, catId) {
      const S = K.Store.data, ds = this.date, isNew = !it;
      const cat = catId || (it && it.cat) || 'work';
      const needDT = todoNeedDateTime(cat);
      const dueValue = it ? todoNormalizeDue(it.due, ds) : (needDT ? (ds + ' ' + K.tstr()) : '');
      const dueField = needDT
        ? { k: 'due', label: '截止 / 提醒时间', type: 'datetime', value: dueValue, required: true, placeholder: '选择年月日 时:分' }
        : { k: 'due', label: '截止 / 提醒时间（睡前收尾建议填写）', type: 'time', value: it ? it.due : '' };
      K.Sheet.form({
        title: isNew ? '新增任务' : '编辑任务',
        fields: [
          { k: 'title', label: '任务内容', required: true, value: it ? it.title : '', placeholder: '要做的事…' },
          { k: 'cat', label: '所属分类', type: 'select', value: cat, options: D.TODO_CATS.map(c => ({ v: c.id, t: c.name })) },
          { k: 'pri', label: '优先级', type: 'opts', value: it ? it.pri : 'mid', options: [{ v: 'high', t: '高' }, { v: 'mid', t: '中' }, { v: 'low', t: '低' }] },
          dueField,
          { k: 'remind', label: '开启事务提醒', type: 'switch', value: it ? !!it.remind : false, hint: '开启后，打开工作台时会自动播报临近事务；已授权通知则同时弹出系统提醒。' },
          { k: 'note', label: '备注', type: 'textarea', value: it ? it.note : '', placeholder: '地点、同行人、注意事项…' }
        ],
        onSubmit: v => {
          if (needDT && !K.isFullDateTime(v.due)) { K.Toast('请选择完整的年月日和时间'); return false; }
          if (isNew) {
            S.todo.days[ds].items.push({ id: K.uid(), cat: v.cat, title: v.title, pri: v.pri, due: v.due, remind: v.remind, note: v.note, done: false, tpl: false });
          } else {
            Object.assign(it, { title: v.title, cat: v.cat, pri: v.pri, due: v.due, remind: v.remind, note: v.note });
          }
          K.Store.save();
          if (v.remind && v.due) this.askNotify();
          App.render();
        }
      });
    },
    askNotify() {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') Notification.requestPermission().then(p => { K.Store.data.settings.notify = (p === 'granted'); K.Store.save(); });
      else K.Store.data.settings.notify = (Notification.permission === 'granted');
    },
    checkRemind() {
      const S = K.Store.data, today = K.dstr(), d = S.todo.days[today]; if (!d) return;
      const now = K.hm2min(K.tstr());
      const soon = d.items.filter(i => {
        if (i.done || !i.remind || !i.due) return false;
        const t = todoTimePart(i);
        if (!t) return false;
        if (todoNeedDateTime(i.cat) && K.isFullDateTime(i.due)) {
          const p = K.parseDateTime(i.due);
          if (p.date !== today) return false;
        }
        const diff = K.hm2min(t) - now;
        return diff <= 60 && diff >= -5;
      });
      if (soon.length) {
        K.Toast('⏰ 即将到时：' + soon.map(i => i.title + ' ' + todoDisplayDue(i.due, i.cat)).join('；'), 4000);
        if (S.settings.notify && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification('Eras Life・璇 提醒', { body: soon.map(i => todoDisplayDue(i.due, i.cat) + ' ' + i.title).join('\n') }); } catch (e) { }
        }
      }
    }
  };

  /* =======================================================
     模块 3 · 单词
     ======================================================= */
  Pages.words = {
    tab: 'week',
    render() {
      const S = K.Store.data, today = K.dstr(), t = S.words.days[today] || null;
      const streak = D.wordStreak();
      const all = Object.keys(S.words.days).filter(d => S.words.days[d].checked);
      const totalMin = all.reduce((s, d) => s + K.num(S.words.days[d].minutes), 0);
      const totalCnt = all.reduce((s, d) => s + K.num(S.words.days[d].count), 0);
      let h = '';
      h += UI.card({
        icon: 'i-fire', title: '打卡总览', cls: 'tex-knit',
        extra: t && t.checked ? '今日已打卡 ✓' : '今日待打卡',
        body: '<div class="grid g4">' +
          UI.stat(streak, '连续天数', 'sm') + UI.stat(all.length, '累计天数', 'sm') +
          UI.stat(totalMin + '′', '累计用时', 'sm') + UI.stat(totalCnt, '累计词数', 'sm') + '</div>' +
          '<div class="btn-row"><button class="btn primary" id="wCheck">' + (t && t.checked ? '修改今日记录' : '今日打卡记录') + '</button>' +
          '<button class="btn soft" id="wApp">打开不背单词</button></div>' +
          '<div class="hint" style="margin-top:8px">在「不背单词」完成背诵后回到这里同步用时与词数，数据会自动进入周月报表。</div>'
      });

      if (t && t.checked) {
        h += UI.card({
          icon: 'i-pen', title: '今日记录', extra: esc(today),
          body: '<div class="grid g3">' + UI.stat(t.minutes + '′', '背诵用时') + UI.stat(t.count, '背诵词数') + UI.stat((t.wrong || 0), '新增易错') + '</div>' +
            (t.note ? '<div class="hint" style="margin-top:8px">备注：' + esc(t.note) + '</div>' : '')
        });
      }

      // 易错词
      const errs = S.words.errors.slice().sort((a, b) => b.n - a.n || (b.at > a.at ? 1 : -1));
      h += UI.card({
        icon: 'i-news', title: '高频易错单词', extra: errs.length + ' 个',
        body: (errs.length ? errs.slice(0, 30).map(e =>
          '<div class="li"><div class="li-main"><div class="li-t">' + esc(e.w) + (e.m ? ' <span style="font-weight:400;color:var(--ink-3);font-size:12px">' + esc(e.m) + '</span>' : '') + '</div>' +
          '<div class="li-s">' + UI.tag('错 ' + e.n + ' 次', e.n >= 3 ? 'bad' : 'warn') + UI.tag('最近 ' + e.at, 'grey') + '</div></div>' +
          '<div class="li-act"><button class="mini-btn" data-ew="' + esc(e.w) + '">+1</button><button class="mini-btn del" data-dw="' + esc(e.w) + '">' + ico('i-close') + '</button></div></div>'
        ).join('') : UI.empty('还没有错题记录，打卡时可一并录入')) +
          '<button class="btn sm soft full" style="margin-top:8px" id="wAddErr">' + ico('i-plus', 'sm') + ' 手动添加易错词</button>'
      });

      // 报表
      const isW = this.tab === 'week';
      const days = isW ? K.lastNDays(7) : K.monthDays(K.mstr());
      const mins = days.map(d => (S.words.days[d] || {}).minutes || 0);
      const cnts = days.map(d => (S.words.days[d] || {}).count || 0);
      const okDays = days.filter(d => (S.words.days[d] || {}).checked).length;
      h += UI.card({
        icon: 'i-chart', title: '学习数据报表',
        extra: '<button class="btn xs ghost" id="wTab">' + (isW ? '周度' : '月度') + ' ▾</button>',
        body: '<div class="grid g3">' + UI.stat(okDays + '/' + days.length, isW ? '本周打卡' : '本月打卡', 'sm') +
          UI.stat(mins.reduce((a, b) => a + b, 0) + '′', '总用时', 'sm') +
          UI.stat(cnts.reduce((a, b) => a + b, 0), '总词数', 'sm') + '</div>' +
          '<div class="chart-box" style="margin-top:10px">' + K.Chart.bar({ labels: days.map(K.mdShort), data: mins, height: 140, target: S.words.target.minutes, fmt: v => Math.round(v) + '′' }) + '</div>' +
          '<div class="legend"><span><i style="background:linear-gradient(#FFAAD3,#C0A5F5)"></i>每日背诵用时（分钟）</span><span><i style="background:#F5A8C4"></i>目标线 ' + S.words.target.minutes + '′</span></div>' +
          '<div class="chart-box" style="margin-top:10px">' + K.Chart.line({ labels: days.map(K.mdShort), series: [{ data: cnts, color: K.Chart.C.lilac }], height: 140 }) + '</div>' +
          '<div class="legend"><span><i style="background:#B197F0"></i>每日背诵词数</span></div>'
      });
      return h;
    },
    mount(root, App) {
      const S = K.Store.data;
      const c = $('#wCheck', root); if (c) c.addEventListener('click', () => this.check(App));
      const a = $('#wApp', root); if (a) a.addEventListener('click', () => { window.open('https://bbdc.cn/', '_blank'); K.Toast('已尝试打开不背单词，背完记得回来同步 ✦'); });
      const tb = $('#wTab', root); if (tb) tb.addEventListener('click', () => { this.tab = this.tab === 'week' ? 'month' : 'week'; App.render(); });
      const ae = $('#wAddErr', root); if (ae) ae.addEventListener('click', () => this.addErr(App));
      $$('[data-ew]', root).forEach(b => b.addEventListener('click', () => {
        const e = S.words.errors.find(x => x.w === b.dataset.ew); if (e) { e.n++; e.at = K.dstr(); K.Store.save(); App.render(); }
      }));
      $$('[data-dw]', root).forEach(b => b.addEventListener('click', () => {
        S.words.errors = S.words.errors.filter(x => x.w !== b.dataset.dw); K.Store.save(); App.render();
      }));
    },
    check(App) {
      const S = K.Store.data, today = K.dstr(), t = S.words.days[today] || {};
      K.Sheet.form({
        title: '单词打卡 · ' + today,
        fields: [
          { k: 'minutes', label: '背诵用时（分钟）', type: 'number', value: t.minutes || '', required: true, placeholder: '如 25' },
          { k: 'count', label: '背诵词数', type: 'number', value: t.count || '', placeholder: '如 60' },
          { k: 'errs', label: '今日易错单词', type: 'textarea', placeholder: '每行一个，如：\nabandon 放弃\nsubtle 微妙的', hint: '自动汇总统计，重复录入会累加错误次数并留存。' },
          { k: 'note', label: '备注', value: t.note || '', placeholder: '今天的状态、背诵计划…' }
        ],
        submitText: '完成打卡',
        onSubmit: v => {
          let wrong = 0;
          (v.errs || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
            const sp = line.split(/[\s,，:：]+/), word = sp.shift(), mean = sp.join(' ');
            if (!word) return;
            const ex = S.words.errors.find(x => x.w.toLowerCase() === word.toLowerCase());
            if (ex) { ex.n++; ex.at = today; if (mean) ex.m = mean; }
            else S.words.errors.push({ w: word, m: mean, n: 1, at: today });
            wrong++;
          });
          S.words.days[today] = { checked: true, minutes: K.num(v.minutes), count: K.num(v.count), wrong: (t.wrong || 0) + wrong, note: v.note, at: K.tstr() };
          // 联动待办：勾选「单词背诵」
          const d = S.todo.days[today];
          if (d) { const it = d.items.find(x => x.title === '单词背诵'); if (it && !it.done) { it.done = true; it.doneAt = K.tstr(); } }
          K.Store.save();
          K.Toast('打卡成功，连续 ' + D.wordStreak() + ' 天 ✦');
          App.render();
        }
      });
    },
    addErr(App) {
      K.Sheet.form({
        title: '添加易错单词',
        fields: [{ k: 'w', label: '单词', required: true }, { k: 'm', label: '释义' }],
        onSubmit: v => {
          const S = K.Store.data, ex = S.words.errors.find(x => x.w.toLowerCase() === v.w.toLowerCase());
          if (ex) { ex.n++; ex.at = K.dstr(); if (v.m) ex.m = v.m; }
          else S.words.errors.push({ w: v.w, m: v.m, n: 1, at: K.dstr() });
          K.Store.save(); App.render();
        }
      });
    }
  };

  /* =======================================================
     模块 4 · 阅读（微信读书同步 + 60 分钟打卡 + 连续天数）
     ======================================================= */
  Pages.reading = {
    tab: 'today',
    render() {
      const S = K.Store.data, today = K.dstr(), R = S.reading;
      // 强制刷新连续打卡状态
      D.readingCheck(today);
      const todayRep = D.readingReportToday();
      const weekRep = D.readingReportWeek();
      const monthRep = D.readingReportMonth();
      const allMin = R.logs.reduce((s, l) => s + K.num(l.minutes), 0);
      const finishedCount = R.finished.length;
      const inProgressCount = R.books.filter(b => (b.progress || 0) < b.pages).length;
      const syncStatus = R.sync && R.sync.weread ? R.sync.weread.status : 'none';
      const syncMsg = R.sync && R.sync.weread ? R.sync.weread.msg : '';
      let h = '';

      // 顶部快捷统计
      h += '<div class="grid g4">' +
        UI.stat(todayRep.minutes + '′', '今日阅读', todayRep.done ? 'mint' : 'sm') +
        UI.stat(todayRep.streak.current + ' 天', '连续打卡', todayRep.streak.current > 0 ? 'lilac' : 'sm') +
        UI.stat(finishedCount + ' 本', '已读完', 'sky') +
        UI.stat(inProgressCount + ' 本', '在读中', 'sm') +
        '</div>';

      // Tab 导航
      h += '<div class="seg" id="rTab">' +
        ['today|今日', 'week|本周', 'month|月度', 'books|在读书籍', 'finished|读完书单', 'notes|摘抄'].map(x => {
          const p = x.split('|');
          return '<button data-t="' + p[0] + '"' + (this.tab === p[0] ? ' class="on"' : '') + '>' + p[1] + '</button>';
        }).join('') + '</div>';

      if (this.tab === 'today') {
        h += UI.card({
          icon: 'i-book', title: '今日阅读数据', extra: todayRep.done ? UI.tag('打卡成功', 'mint') : UI.tag('未达标', 'grey'),
          body: '<div style="display:flex;gap:14px;align-items:center">' +
            '<div>' + K.Chart.ring({ value: K.pct(todayRep.minutes, R.dailyMin), label: todayRep.minutes + '′', sub: '/' + R.dailyMin + '′', size: 108, color: todayRep.done ? '#A8E6CF' : '#FFB6D9', color2: '#E8E8F0' }) + '</div>' +
            '<div style="flex:1;min-width:0">' +
            '<div class="prow"><span>今日进度</span><b>' + K.pct(todayRep.minutes, R.dailyMin) + '%</b></div>' + UI.bar(K.pct(todayRep.minutes, R.dailyMin), todayRep.done ? 'ok' : '') +
            '<div class="hint" style="margin-top:8px">' + (todayRep.done ? '今日阅读目标已达成 ✦ 连续打卡 ' + todayRep.streak.current + ' 天' : '还差 ' + Math.max(0, R.dailyMin - todayRep.minutes) + ' 分钟达标，连续打卡不会中断') + '</div>' +
            '<div class="hint">历史最佳连续打卡：' + todayRep.streak.best + ' 天</div>' +
            '</div></div>' +
            '<div class="btn-row">' +
            '<button class="btn primary" id="rLog">记录今日阅读</button>' +
            (R.cloud && R.cloud.bin ? '<button class="btn soft" id="rPull">云端同步</button>' : '') +
            '<button class="btn soft" id="rSync">微信读书同步</button>' +
            '<button class="btn soft" id="rAdd">添加书籍</button>' +
            '</div>' +
            (R.cloud && R.cloud.bin
              ? '<div class="hint" style="margin-top:8px">自动同步已开启（JSONBin）：' + esc(R.cloud.bin) + (syncStatus !== 'none' ? ' · ' + esc(syncMsg || syncStatus) : '') + '</div>'
              : '<div class="hint" style="margin-top:8px">未配置云端自动同步：点「微信读书同步」填写 JSONBin 后，即可每日自动拉取微信读书数据</div>')
        });
        h += UI.card({
          icon: 'i-chart', title: '近 7 日阅读趋势',
          body: '<div class="chart-box">' +
            K.Chart.bar({ labels: K.lastNDays(7).map(K.mdShort), data: K.lastNDays(7).map(d => R.logs.filter(l => l.date === d).reduce((s, l) => s + K.num(l.minutes), 0)), height: 130, target: R.dailyMin, fmt: v => Math.round(v) + '′' }) +
            '</div><div class="legend"><span><i style="background:linear-gradient(#FFAAD3,#C0A5F5)"></i>近 7 日阅读时长</span><span><i style="background:#F5A8C4"></i>每日 ' + R.dailyMin + ' 分钟目标线</span></div>'
        });
      } else if (this.tab === 'week') {
        h += UI.card({
          icon: 'i-calendar', title: '本周阅读汇总', extra: '本周打卡 ' + weekRep.okDays + '/7 天',
          body: '<div class="grid g4">' +
            UI.stat(Math.round(weekRep.total) + '′', '本周总时长', 'sm') +
            UI.stat(weekRep.okDays + ' 天', '达标天数', 'sm') +
            UI.stat(Math.round(weekRep.total / 7) + '′', '日均时长', 'sm') +
            UI.stat(todayRep.streak.current + ' 天', '当前连续', 'sm') +
            '</div>' +
            '<div class="reading-week">' + weekRep.days.map(d =>
              '<div class="reading-day' + (d.done ? ' done' : '') + (d.future ? ' future' : '') + '">' +
              '<div class="rd-d">' + d.day + '</div>' +
              '<div class="rd-ring" style="--p:' + K.pct(d.minutes, R.dailyMin) + '%"><span>' + d.minutes + '</span></div>' +
              '<div class="rd-bar"><div style="height:' + Math.min(100, K.pct(d.minutes, R.dailyMin)) + '%"></div></div>' +
              '</div>'
            ).join('') + '</div>'
        });
      } else if (this.tab === 'month') {
        h += UI.card({
          icon: 'i-chart', title: '月度阅读报告', extra: monthRep.month,
          body: '<div class="grid g4">' +
            UI.stat(Math.round(monthRep.total) + '′', '本月总时长', 'sm') +
            UI.stat(monthRep.okDays + ' 天', '达标天数', 'sm') +
            UI.stat(monthRep.days + ' 天', '阅读天数', 'sm') +
            UI.stat(monthRep.finished + ' 本', '本月读完', 'sm') +
            '</div>' +
            '<div class="hint" style="margin-top:10px">按微信读书规则：单日阅读 ≥ ' + R.dailyMin + ' 分钟计为打卡成功；未达标当日连续天数清零。</div>'
        });
      } else if (this.tab === 'books') {
        h += UI.card({
          icon: 'i-book', title: '在读书籍进度',
          body: R.books.length ? R.books.map(b => {
            const p = this.prog(b), read = this.readPage(b);
            return '<div class="li book-li" style="display:block" data-book="' + b.id + '"><div class="book">' +
              (b.cover ? '<img class="book-cv-img" src="' + esc(b.cover) + '" loading="lazy" alt="">' : '<div class="book-cv">' + esc(b.title.slice(0, 4)) + '</div>') +
              '<div style="flex:1;min-width:0"><div class="li-t">' + esc(b.title) + '</div>' +
              '<div class="li-s">' + UI.tag(esc(b.author || '佚名'), 'lilac') + UI.tag('读到 ' + read + '/' + b.pages + ' 页', 'sky') + (p >= 100 ? UI.tag('已读完 ✓', 'mint') : '') + '</div>' +
              '<div style="margin-top:6px">' + UI.bar(p, p >= 100 ? 'ok' : '') + '</div></div>' +
              '<div class="li-act"><button class="mini-btn del" data-db="' + b.id + '">' + ico('i-close') + '</button></div>' +
              '</div></div>';
          }).join('') : UI.empty('书架还空着，先添加一本想读的中文书吧', 'i-book')
        });
      } else if (this.tab === 'finished') {
        h += UI.card({
          icon: 'i-check', title: '完整读完书单',
          extra: finishedCount + ' 本',
          body: R.finished.length ? R.finished.slice().reverse().map(b =>
            '<div class="li book-li" style="display:block"><div class="book">' +
            (b.cover ? '<img class="book-cv-img" src="' + esc(b.cover) + '" loading="lazy" alt="">' : '<div class="book-cv">' + esc(b.title.slice(0, 4)) + '</div>') +
            '<div style="flex:1;min-width:0"><div class="li-t">' + esc(b.title) + '</div>' +
            '<div class="li-s">' + UI.tag(esc(b.author || '佚名'), 'lilac') + UI.tag('读完于 ' + b.finishedAt, 'mint') + UI.tag('共 ' + (b.totalMinutes || 0) + ' 分钟', 'sky') + '</div></div>' +
            '</div></div>'
          ).join('') : UI.empty('还没有读完的书，坚持阅读，第一本书正在路上 ✦', 'i-book')
        });
      } else {
        const logs = R.logs.slice().reverse().slice(0, 40).filter(l => l.quote || l.thought);
        h += UI.card({
          icon: 'i-pen', title: '文字摘抄 · 个人感悟',
          body: logs.length ? logs.map(l => {
            const b = R.books.find(x => x.id === l.bookId);
            return '<div class="li" style="display:block">' +
              '<div class="li-s" style="margin-bottom:4px">' + UI.tag(l.date, 'grey') + UI.tag(b ? b.title : '未指定书籍', 'lilac') + UI.tag(l.minutes + '′ · P' + l.page, 'sky') + '</div>' +
              (l.quote ? '<div class="quote" style="margin-bottom:6px">' + esc(l.quote) + '</div>' : '') +
              (l.thought ? '<div class="li-t" style="font-weight:500;color:var(--ink-2)">感悟：' + esc(l.thought) + '</div>' : '') +
              '</div>';
          }).join('') : UI.empty('还没有摘抄，记录阅读时可以写下打动你的句子', 'i-pen')
        });
      }
      return h;
    },
    prog(b) { return K.pct(this.readPage(b), b.pages); },
    readPage(b) {
      if (b.progress) return Math.min(b.progress, b.pages || b.progress);
      const logs = K.Store.data.reading.logs.filter(l => l.bookId === b.id);
      return logs.reduce((m, l) => Math.max(m, K.num(l.page)), 0);
    },
    mount(root, App) {
      const S = K.Store.data;
      $$('#rTab [data-t]', root).forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.t; App.render(); }));
      const ad = $('#rAdd', root); if (ad) ad.addEventListener('click', () => this.addBook(App));
      const lg = $('#rLog', root); if (lg) lg.addEventListener('click', () => this.log(App));
      const sy = $('#rSync', root); if (sy) sy.addEventListener('click', () => this.syncWeread(App));
      const pl = $('#rPull', root); if (pl) pl.addEventListener('click', () => this.fetchCloud(App));
      const RC = S.reading;
      if (RC.cloud && RC.cloud.bin && (RC.sync.weread.lastAt || '').slice(0, 10) !== K.dstr()) this.fetchCloud(App, true);
      $$('[data-db]', root).forEach(b => b.addEventListener('click', () => {
        K.Sheet.confirm('删除书籍', '删除后该书的阅读记录仍会保留在读完书单与摘抄中，确认删除？', () => {
          S.reading.books = S.reading.books.filter(x => x.id !== b.dataset.db); K.Store.save(); App.render();
        }, '删除');
      }));
      $$('[data-book]', root).forEach(b => b.addEventListener('click', e => {
        if (e.target.closest('[data-db]')) return;
        App.openReader(b.dataset.book);
      }));
    },
    addBook(App, pre) {
      const S = K.Store.data;
      K.Sheet.form({
        title: '添加书籍',
        fields: [
          { k: 'title', label: '书名', required: true, value: pre ? pre.title : '', validate: v => D.hasCN(v) ? '' : '本工作台仅收录中文书籍，请填写中文书名' },
          { k: 'author', label: '作者', value: pre ? pre.author : '' },
          { k: 'pages', label: '书籍总页数', type: 'number', required: true, placeholder: '如 320' },
          { k: 'cover', label: '封面 URL（可选）', placeholder: '粘贴微信读书封面链接' },
          { k: 'content', label: '书籍全文（可选，粘贴后开启分页阅读与摘抄）', type: 'textarea', placeholder: '在此粘贴书籍全文，系统会自动分页；留空也可稍后在阅读器内补录' }
        ],
        onSubmit: v => {
          S.reading.books.push({ id: K.uid(), title: v.title, author: v.author, pages: K.num(v.pages), cover: (v.cover || '').trim(), content: (v.content || '').trim(), progress: 0, at: K.dstr() });
          K.Store.save(); K.Toast('已加入书单 ✦'); App.render();
        }
      });
    },
    log(App) {
      const S = K.Store.data, today = K.dstr();
      if (!S.reading.books.length) { K.Toast('请先添加一本书'); this.addBook(App); return; }
      K.Sheet.form({
        title: '今日阅读记录 · ' + today,
        fields: [
          { k: 'bookId', label: '选择书籍', type: 'select', options: S.reading.books.map(b => ({ v: b.id, t: b.title })) },
          { k: 'minutes', label: '阅读时长（分钟）', type: 'number', required: true, placeholder: '不少于 ' + S.reading.dailyMin + ' 分钟' },
          { k: 'page', label: '今日读到页码', type: 'number', placeholder: '如 128' },
          { k: 'quote', label: '文字摘抄', type: 'textarea', placeholder: '记下今天打动你的句子…' },
          { k: 'thought', label: '个人感悟', type: 'textarea', placeholder: '它让你想到了什么？' }
        ],
        submitText: '保存记录',
        onSubmit: v => {
          D.readingAddLog({ bookId: v.bookId, minutes: K.num(v.minutes), page: K.num(v.page), quote: v.quote, thought: v.thought, source: 'manual' });
          const d = S.todo.days[today];
          if (d) { const it = d.items.find(x => x.title === '阅读打卡'); if (it && !it.done) { it.done = true; it.doneAt = K.tstr(); } }
          const tot = D.readingToday();
          K.Toast(tot >= S.reading.dailyMin ? '今日阅读目标已达成 ✦' : '已记录，今天还差 ' + (S.reading.dailyMin - tot) + ' 分钟');
          App.render();
        }
      });
    },
    fetchCloud(App, silent) {
      const R = K.Store.data.reading, bin = R.cloud && R.cloud.bin;
      if (!bin) { if (!silent) { K.Toast('请先在「微信读书同步」中填写 JSONBin bin id', 3000); this.syncWeread(App); } return; }
      const url = 'https://api.jsonbin.io/v3/b/' + encodeURIComponent(bin) + '/latest';
      const headers = { 'Accept': 'application/json' };
      if (R.cloud.readKey) headers['X-Access-Key'] = R.cloud.readKey;
      if (!silent) K.Toast('正在从云端拉取微信读书数据…', 1500);
      fetch(url, { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))).then(j => {
        const rec = j && j.record ? j.record : j;
        const added = D.readingSyncFromWeread(rec || {});
        if (!silent) K.Toast('云端同步完成，新增 ' + added + ' 分钟', 2500);
        if (App && App.render) App.render();
      }).catch(e => {
        if (!silent) K.Toast('云端拉取失败：' + e.message + '（检查 bin id / 读密钥 / 网络）', 3500);
      });
    },
    syncWeread(App) {
      const S = K.Store.data, R = S.reading, today = K.dstr();
      K.Sheet.form({
        title: '微信读书同步设置',
        fields: [
          { k: 'bin', label: 'JSONBin bin id（开启每日自动同步）', value: R.cloud.bin || '', placeholder: '如 64f1a2b8xxxxxxxx（jsonbin.io 创建 bin 后获取）' },
          { k: 'readKey', label: '读密钥 X-Access-Key（可选）', value: R.cloud.readKey || '', placeholder: 'bin 设为私有才需要；公开 bin 留空即可' },
          { k: 'cmd', type: 'note', label: '每日自动同步流程：WorkBuddy 定时任务调用微信读书 Skill 拉数据 → 写入此 bin → 本页打开时自动拉取合并。手动方式：复制下方指令到对话框，把返回 JSON 粘贴到「手动导入」框。' },
          { k: 'prompt', label: '手动同步指令（点击复制）', type: 'textarea', value: '帮我同步微信读书今日阅读数据到 eras-life-xuan 阅读模块，日期：' + today },
          { k: 'json', label: '手动导入 JSON（可选）', type: 'textarea', placeholder: '{"date":"' + today + '","minutes":90,"books":[...]}' }
        ],
        submitText: '保存设置',
        onSubmit: v => {
          R.cloud.bin = (v.bin || '').trim();
          R.cloud.readKey = (v.readKey || '').trim();
          K.Store.save();
          if (v.json && v.json.trim()) {
            try { const data = JSON.parse(v.json); const added = D.readingSyncFromWeread(data); K.Toast('导入成功，新增 ' + added + ' 分钟'); App.render(); }
            catch (e) { K.Toast('JSON 解析失败：' + e.message, 3000); App.render(); }
          } else if (R.cloud.bin) {
            K.Toast('已保存，正在拉取云端数据…'); this.fetchCloud(App);
          } else {
            K.Toast('已保存设置'); App.render();
          }
        }
      });
      setTimeout(() => {
        const ta = $('#f_prompt');
        if (ta) { ta.select(); if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => {}); }
      }, 200);
    }
  };

})(window);
