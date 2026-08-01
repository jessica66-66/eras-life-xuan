/* =========================================================
   flow.js — 全屏流页面：书籍阅读器 / 文章阅读 / 视频播放 / 摘抄
   挂载在 app.js 之后，运行时为 App 注入 openReader / openArticle / openVideo
   ========================================================= */
(function (w) {
  'use strict';
  const K = w.Core, D = w.D, $ = K.$, $$ = K.$$, esc = K.esc, ico = K.ico, App = w.App;
  if (!App) return;

  /* ---------- 全屏流容器 ---------- */
  function ensureRoot() {
    let r = document.getElementById('flowRoot');
    if (!r) { r = document.createElement('div'); r.id = 'flowRoot'; document.body.appendChild(r); }
    return r;
  }
  function openFlow(innerHTML, opts) {
    opts = opts || {};
    const root = ensureRoot();
    root.innerHTML =
      '<div class="flow-mask"></div>' +
      '<div class="flow">' +
        '<div class="flow-bar">' +
          '<button class="icon-btn flow-back" aria-label="关闭">' + ico('i-back') + '</button>' +
          '<div class="flow-tt">' + esc(opts.title || '') + '</div>' +
          '<div style="width:40px"></div>' +
        '</div>' +
        '<div class="flow-body">' + innerHTML + '</div>' +
      '</div>';
    requestAnimationFrame(() => root.classList.add('show'));
    root.querySelector('.flow-back').addEventListener('click', closeFlow);
    root.querySelector('.flow-mask').addEventListener('click', closeFlow);
    return root;
  }
  function closeFlow() {
    const r = document.getElementById('flowRoot'); if (!r) return;
    r.classList.remove('show');
    setTimeout(() => { if (r) r.innerHTML = ''; }, 260);
  }

  /* ---------- 文本分页 ---------- */
  function toPages(text) {
    const paras = String(text || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    const pages = []; let cur = ''; const CH = 520;
    paras.forEach(p => {
      if (!cur) { cur = p; return; }
      if ((cur + '\n' + p).length <= CH) cur += '\n' + p;
      else { pages.push(cur); cur = p; }
    });
    if (cur) pages.push(cur);
    return pages.length ? pages : ['（暂无正文）'];
  }

  /* ---------- 长按 / 选中摘抄 ---------- */
  function saveExcerpt(book, page, prefill) {
    K.Sheet.form({
      title: '收藏摘抄感悟',
      fields: [
        { k: 'quote', label: '摘抄内容', type: 'textarea', value: prefill || '', required: true, placeholder: '选中或手写的句子…' },
        { k: 'thought', label: '我的感悟（可选）', type: 'textarea', placeholder: '它让你想到了什么？' }
      ],
      submitText: '存入摘抄',
      onSubmit: v => {
        const S = K.Store.data, today = K.dstr();
        S.reading.logs.push({ id: K.uid(), date: today, bookId: book.id, minutes: 0, page: page, quote: v.quote, thought: v.thought || '' });
        K.Store.save();
        K.Toast('已收藏到摘抄感悟 🤍');
      }
    });
  }
  function enableExcerpt(pageEl, book, getCur) {
    if (!pageEl) return;
    const showMenu = (x, y) => {
      const sel = window.getSelection();
      const txt = sel.toString().trim();
      if (!txt) return;
      let m = document.getElementById('selMenu');
      if (!m) { m = document.createElement('div'); m.id = 'selMenu'; m.className = 'sel-menu'; document.body.appendChild(m); }
      m.innerHTML = '<button class="sel-btn">收藏摘抄</button>';
      m.style.left = Math.min(x, window.innerWidth - 130) + 'px';
      m.style.top = Math.max(8, y - 46) + 'px';
      m.style.display = 'block';
      m.querySelector('.sel-btn').onclick = () => { m.style.display = 'none'; const t = sel.toString().trim(); sel.removeAllRanges(); saveExcerpt(book, getCur(), t); };
    };
    pageEl.addEventListener('mouseup', e => { setTimeout(() => { const s = window.getSelection(); if (s.toString().trim()) showMenu(e.clientX, e.clientY); }, 10); });
    pageEl.addEventListener('touchend', e => { const s = window.getSelection(); if (s.toString().trim()) { const t = e.changedTouches[0]; showMenu(t.clientX, t.clientY); } });
    document.addEventListener('selectionchange', () => { const s = window.getSelection(); if (!s.toString().trim()) { const m = document.getElementById('selMenu'); if (m) m.style.display = 'none'; } });
  }

  /* ---------- 书籍阅读器（分页 + 续读 + 摘抄） ---------- */
  App.openReader = function (bookId) {
    const S = K.Store.data, book = S.reading.books.find(b => b.id === bookId);
    if (!book) { K.Toast('书籍不存在'); return; }
    if (!book.content || !book.content.trim()) {
      const html = '<div class="reader-empty">' +
        '<div class="hint" style="margin-bottom:10px">本书还没有录入正文，粘贴全文即可开启分页阅读与摘抄。</div>' +
        '<textarea class="inp reader-ta" id="rbContent" placeholder="在此粘贴书籍全文（自动分页，纯文本）"></textarea>' +
        '<button class="btn primary full" id="rbSave">保存并开始阅读</button></div>';
      openFlow(html, { title: book.title });
      const save = $('#rbSave'); if (save) save.addEventListener('click', () => {
        const t = $('#rbContent').value.trim();
        if (!t) { K.Toast('请先粘贴正文'); return; }
        book.content = t; K.Store.save(); App.openReader(bookId);
      });
      return;
    }
    const pages = toPages(book.content);
    let cur = Math.min(Math.max(1, (book.progress || 1)), pages.length);
    const paint = () => {
      const root = document.getElementById('flowRoot'); if (!root) return;
      root.querySelector('.flow-body').innerHTML =
        '<div class="reader-page" id="rdPage">' + pages[cur - 1].split('\n').map(p => '<p>' + esc(p) + '</p>').join('') + '</div>' +
        '<div class="reader-foot">' +
          '<button class="btn sm soft" id="rdPrev">' + ico('i-back', 'sm') + ' 上一页</button>' +
          '<button class="btn sm primary" id="rdClip">' + ico('i-pen', 'sm') + ' 摘抄</button>' +
          '<div class="reader-prog">第 ' + cur + ' / ' + pages.length + ' 页</div>' +
          '<button class="btn sm soft" id="rdNext">下一页 ' + ico('i-arrow', 'sm') + '</button>' +
        '</div>';
      const prev = $('#rdPrev'), next = $('#rdNext'), clip = $('#rdClip'), pageEl = $('#rdPage');
      if (pageEl) enableExcerpt(pageEl, book, () => cur);
      if (clip) clip.onclick = () => { const s = window.getSelection().toString().trim(); saveExcerpt(book, cur, s); };
      if (pageEl) pageEl.addEventListener('click', e => { if (e.target.tagName === 'A') e.stopPropagation(); });
      if (next) next.onclick = () => { if (cur < pages.length) { cur++; commit(); paint(); } };
      if (next) next.style.opacity = cur < pages.length ? '1' : '.4';
      if (cur >= pages.length) { const b = $('#rdNext'); if (b) b.classList.add('done'); }
    };
    const commit = () => { book.progress = cur; K.Store.save(); };
    openFlow('<div class="reader-page"></div><div class="reader-foot"></div>', { title: book.title });
    paint();
    // 退出时确保记录最新页码
    const back = document.querySelector('#flowRoot .flow-back');
    if (back) back.addEventListener('click', commit, { once: true });
  };

  /* ---------- 文章阅读页（首页热点） ---------- */
  App.openArticle = function (item) {
    if (item.content && item.content.length) {
      const pages = toPages(item.content.join('\n'));
      let cur = 1;
      const paint = () => {
        const root = document.getElementById('flowRoot'); if (!root) return;
        root.querySelector('.flow-body').innerHTML =
          '<div class="reader-page">' + pages[cur - 1].split('\n').map(p => '<p>' + esc(p) + '</p>').join('') + '</div>' +
          '<div class="reader-foot">' +
            '<button class="btn sm soft" id="aPrev">' + ico('i-back', 'sm') + ' 上一页</button>' +
            '<div class="reader-prog">第 ' + cur + ' / ' + pages.length + ' 页</div>' +
            '<button class="btn sm soft" id="aNext">下一页 ' + ico('i-arrow', 'sm') + '</button>' +
          '</div>';
        const prev = $('#aPrev'), next = $('#aNext');
        if (next) { next.onclick = () => { if (cur < pages.length) { cur++; paint(); } }; next.style.opacity = cur < pages.length ? '1' : '.4'; }
        if (cur >= pages.length) { const b = $('#aNext'); if (b) b.classList.add('done'); }
      };
      openFlow('', { title: item.title });
      paint();
    } else {
      const html = '<div class="reader-page"><p>' + esc(item.summary || item.title) + '</p>' +
        (item.url ? '<p style="margin-top:14px"><a class="btn soft" href="' + esc(item.url) + '" target="_blank" rel="noopener">阅读原文 ↗</a></p>' : '') + '</div>';
      openFlow(html, { title: item.title });
    }
  };

  /* ---------- 图标 ---------- */
  const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const STAR_BIG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.5L12 17.8 6.1 20.9l1.3-6.5L2.5 9.9l6.6-.8z"/></svg>';

  /* ---------- 视频播放器（自适应 / 弱网缓冲 / 失败重试 / 占位图） ---------- */
  function showBuffer(root, on) {
    const b = root.querySelector('#pvBuf'); if (!b) return;
    b.style.display = on ? 'flex' : 'none';
  }
  function showPlayerError(root, src, item, pageUrl) {
    const frame = root.querySelector('.player-frame'); if (!frame) return;
    const link = pageUrl || item.url || src || '';
    frame.innerHTML = '<div class="player-ph">' +
      '<div class="ph-icon">' + PLAY_ICON + '</div>' +
      '<div class="hint">视频加载失败</div>' +
      '<button class="btn soft" id="pvRetry">重试</button>' +
      (link ? '<a class="btn primary full" style="margin-top:8px" href="' + esc(link) + '" target="_blank" rel="noopener">去原平台观看 ↗</a>' : '') +
      '</div>';
    const r = frame.querySelector('#pvRetry'); if (r) r.onclick = () => { App.openVideo(item); };
  }
  App.openVideo = function (item) {
    const v = item.video || item.url || '';
    const cover = item.cover || '';
    let embed = '', kind = 'ext', bv = '', dyId = '';
    const m = v.match(/player\.bilibili\.com\/player\.html\?[^"'\s]*bvid=(BV[0-9A-Za-z]+)/i)
      || v.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i)
      || v.match(/\b(BV[0-9A-Za-z]+)\b/i);
    const dy = v.match(/douyin\.com\/video\/(\d+)/i)
      || v.match(/v\.douyin\.com\/([a-zA-Z0-9_-]+)/i);
    if (m) {
      bv = m[1] || m[2] || m[3];
      embed = 'https://player.bilibili.com/player.html?isOutside=true&bvid=' + bv + '&p=1&high_quality=1&danmaku=0&autoplay=1';
      kind = 'bili';
    } else if (dy) {
      dyId = dy[1] || dy[2];
      kind = 'douyin';
    } else if (/youtube\.com\/embed\/|youtu\.be\//i.test(v)) { embed = v; kind = 'yt'; }
    else if (/\.(mp4|webm|m3u8|ogg)(\?|$)/i.test(v)) { kind = 'media'; }

    const biliPageUrl = bv ? 'https://www.bilibili.com/video/' + bv : (item.url || '');
    const douyinPageUrl = dyId ? (v.match(/v\.douyin\.com\//i) ? v : 'https://www.douyin.com/video/' + dyId) : '';
    const extUrl = biliPageUrl || douyinPageUrl || item.url || embed || v;

    function copyBtn() {
      const link = extUrl || item.url || item.video || '';
      return link ? '<button class="btn sm ghost" id="pvCopy" data-link="' + esc(link) + '">复制链接</button>' : '';
    }

    let body;
    if (kind === 'bili') {
      // B 站视频：大量 UP 主/平台关闭外链 iframe 嵌入，统一改为封面占位 + 跳转 B 站，彻底避免「暂不支持内嵌播放」
      body = '<div class="player">' +
        '<div class="player-frame">' +
          (cover ? '<img src="' + esc(cover) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.82)">' : '') +
          '<div class="player-ph player-ph-dark' + (cover ? ' has-cover' : '') + '">' +
            '<div class="ph-icon">' + PLAY_ICON + '</div>' +
            '<div class="hint">该视频需在 B 站应用或网页中观看</div>' +
          '</div>' +
        '</div>' +
        '<div class="player-foot">' +
          '<a class="btn primary full" href="' + esc(extUrl) + '" target="_blank" rel="noopener">去 B 站观看 ↗</a>' +
          copyBtn() +
          '<div class="hint" style="margin-top:8px">B 站限制外链内嵌，点击上方按钮到 B 站观看最稳定</div>' +
        '</div></div>';
    } else if (kind === 'douyin') {
      body = '<div class="player">' +
        '<div class="player-frame">' +
          (cover ? '<img src="' + esc(cover) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.82)">' : '') +
          '<div class="player-ph player-ph-dark' + (cover ? ' has-cover' : '') + '">' +
            '<div class="ph-icon">' + PLAY_ICON + '</div>' +
            '<div class="hint">该视频需在抖音应用或网页中观看</div>' +
          '</div>' +
        '</div>' +
        '<div class="player-foot">' +
          '<a class="btn primary full" href="' + esc(extUrl) + '" target="_blank" rel="noopener">去抖音观看 ↗</a>' +
          copyBtn() +
          '<div class="hint" style="margin-top:8px">抖音限制外链内嵌，点击上方按钮到抖音观看最稳定</div>' +
        '</div></div>';
    } else if (kind === 'yt') {
      body = '<div class="player">' +
        '<div class="player-frame"><div class="player-loading" id="pvLoad"><div class="spinner"></div><div class="hint">视频加载中…</div></div>' +
        '<div class="player-buf" id="pvBuf" style="display:none"><div class="spinner"></div><div class="hint">弱网缓冲中…</div></div>' +
        '<iframe id="pvIframe" src="' + esc(embed) + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen frameborder="0" style="opacity:0"></iframe>' +
        '<div class="player-fallback" id="pvFallback" style="display:none">' +
          '<div class="hint">视频没出来？可能是该视频关闭了内嵌播放</div>' +
          '<a class="btn primary" href="' + esc(extUrl) + '" target="_blank" rel="noopener">去原平台观看 ↗</a>' +
        '</div></div>' +
        '<div class="player-foot">' +
          copyBtn() +
          '<div class="hint" style="margin-top:8px">若提示无法播放，请点击下方按钮到原平台观看。</div>' +
          '<a class="btn soft full" style="margin-top:8px" href="' + esc(extUrl) + '" target="_blank" rel="noopener">去原平台观看 ↗</a>' +
        '</div></div>';
    } else if (kind === 'media') {
      body = '<div class="player"><div class="player-frame"><video id="pvMedia" controls playsinline preload="metadata" ' + (cover ? ('poster="' + esc(cover) + '"') : '') + ' style="width:100%;background:#000;max-height:60vh"><source src="' + esc(v) + '"></video></div>' +
        '<div class="player-foot">' + copyBtn() + '<div class="hint" style="margin-top:8px">若无法播放，可去原平台查看。</div>' +
        (item.url ? '<a class="btn soft full" style="margin-top:8px" href="' + esc(item.url) + '" target="_blank" rel="noopener">在浏览器打开 ↗</a>' : '') + '</div></div>';
    } else {
      body = '<div class="player"><div class="player-ph">' +
        (cover ? '<img src="' + esc(cover) + '" alt="">' : '<div class="ph-icon">' + PLAY_ICON + '</div>') +
        '<div class="hint">该视频需在原始平台观看</div></div>' +
        '<div class="player-foot">' + copyBtn() + (item.url ? '<a class="btn primary full" href="' + esc(item.url) + '" target="_blank" rel="noopener">去原平台观看 ↗</a>' : (item.video ? '<a class="btn primary full" href="' + esc(item.video) + '" target="_blank" rel="noopener">去原平台观看 ↗</a>' : '')) + '</div></div>';
    }
    openFlow(body, { title: item.title });
    const root = document.getElementById('flowRoot');
    if (!root) return;
    const copy = root.querySelector('#pvCopy');
    if (copy) copy.addEventListener('click', function() {
      const link = this.dataset.link;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => K.Toast('链接已复制，可在对应 App 中打开'), () => K.Toast('复制失败，请手动复制地址'));
      } else {
        try {
          const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta); K.Toast('链接已复制，可在对应 App 中打开');
        } catch (e) { K.Toast('复制失败，请手动复制地址'); }
      }
    });
    if (kind === 'bili' || kind === 'douyin') {
      // 平台限制外链内嵌，统一跳转，无需 iframe 绑定
    } else if (kind === 'yt') {
      const iframe = root.querySelector('#pvIframe');
      const load = root.querySelector('#pvLoad');
      const fallback = root.querySelector('#pvFallback');
      if (iframe) {
        const done = () => { if (load) load.style.display = 'none'; iframe.style.opacity = '1'; };
        iframe.onload = done;
        iframe.onerror = () => showPlayerError(root, embed, item, extUrl);
        setTimeout(() => { if (load && load.style.display !== 'none') { load.style.display = 'none'; iframe.style.opacity = '1'; } }, 7000);
        setTimeout(() => { if (load && load.style.display !== 'none') showPlayerError(root, embed, item, extUrl); }, 12000);
        setTimeout(() => { if (fallback) fallback.style.display = 'flex'; }, 5000);
      }
    } else if (kind === 'media') {
      const media = root.querySelector('#pvMedia');
      if (media) {
        media.addEventListener('waiting', () => showBuffer(root, true));
        media.addEventListener('playing', () => showBuffer(root, false));
        media.addEventListener('canplay', () => showBuffer(root, false));
        media.addEventListener('error', () => showPlayerError(root, v, item, extUrl));
      }
    }
  };

  /* ---------- 无内嵌地址的外链（live 视频/文章，去原平台打开） ---------- */
  App.openExternal = function (item) {
    if (item.url) window.open(item.url, '_blank', 'noopener');
    else App.openArticle(item);
  };

  /* ---------- 我的收藏 ---------- */
  App.openFavItem = function (it) {
    if (it.type === 'video') App.openVideo(it);
    else App.openArticle(it);
  };
  App.openFav = function () {
    const S = K.Store.data; S.fav = S.fav || { list: [] };
    let tab = 'all';
    const sel = {};
    const paint = () => {
      const list = S.fav.list.filter(f => tab === 'all' ? true : (f.type === (tab === 'video' ? 'video' : 'article')));
      let body;
      if (!S.fav.list.length) {
        body = '<div class="fav-empty"><div class="ph-icon big">' + STAR_BIG + '</div><div class="hint">收藏喜欢的视频 / 文章，在这里快速查看</div></div>';
      } else if (!list.length) {
        body = '<div class="fav-empty"><div class="hint">该分类下还没有收藏</div></div>';
      } else {
        body = '<div class="fav-grid">' + list.map(f => {
          const on = sel[f.id] ? ' on' : '';
          return '<div class="fav-card' + (f.type === 'video' ? ' v' : '') + (on ? ' sel' : '') + '" data-fid="' + esc(f.id) + '">' +
            '<button class="fav-check' + on + '" data-fid="' + esc(f.id) + '">' + (on ? '✓' : '') + '</button>' +
            '<button class="fav-del" data-fid="' + esc(f.id) + '" aria-label="删除">×</button>' +
            '<span class="hot-badge ' + (f.type === 'video' ? 'v' : 'a') + '">' + (f.type === 'video' ? '▶ 视频' : '文章') + '</span>' +
            (f.domain && f.domain !== '精选' ? '<span class="hot-dom">' + esc(f.domain) + '</span>' : '') +
            '<div class="fav-tt">' + esc(f.title) + '</div>' +
          '</div>';
        }).join('') + '</div>';
      }
      const tabs = '<div class="fav-tabs">' +
        '<button class="ft' + (tab === 'all' ? ' on' : '') + '" data-t="all">全部</button>' +
        '<button class="ft' + (tab === 'video' ? ' on' : '') + '" data-t="video">视频</button>' +
        '<button class="ft' + (tab === 'article' ? ' on' : '') + '" data-t="article">文章</button>' +
        '</div>';
      const selN = Object.keys(sel).length;
      const bar = '<div class="fav-actions">' +
        '<span class="hint">已选 ' + selN + ' 项</span>' +
        '<button class="btn sm soft" id="favCancel"' + (selN ? '' : ' disabled') + '>取消收藏</button>' +
        '</div>';
      openFlow(tabs + body + bar, { title: '我的收藏（' + S.fav.list.length + '）' });
      bindFav();
    };
    const bindFav = () => {
      const root = document.getElementById('flowRoot'); if (!root) return;
      root.querySelectorAll('.fav-tabs .ft').forEach(b => b.onclick = () => { tab = b.dataset.t; paint(); });
      root.querySelectorAll('.fav-card').forEach(c => c.onclick = e => {
        if (e.target.closest('.fav-del') || e.target.closest('.fav-check')) return;
        const it = S.fav.list.find(f => f.id === c.dataset.fid); if (it) App.openFavItem(it);
      });
      root.querySelectorAll('.fav-del').forEach(b => b.onclick = e => {
        e.stopPropagation();
        S.fav.list = S.fav.list.filter(f => f.id !== b.dataset.fid); delete sel[b.dataset.fid]; K.Store.save(); paint();
      });
      root.querySelectorAll('.fav-check').forEach(b => b.onclick = e => {
        e.stopPropagation();
        if (sel[b.dataset.fid]) delete sel[b.dataset.fid]; else sel[b.dataset.fid] = 1; paint();
      });
      const cancel = root.querySelector('#favCancel'); if (cancel) cancel.onclick = () => {
        const ids = Object.keys(sel); if (!ids.length) return;
        S.fav.list = S.fav.list.filter(f => ids.indexOf(f.id) < 0); ids.forEach(id => delete sel[id]); K.Store.save();
        K.Toast('已取消收藏 ' + ids.length + ' 项'); paint();
      };
    };
    paint();
  };
})(window);
