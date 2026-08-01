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
    recordHot(item);
  };

  /* ---------- 视频播放器 ---------- */
  App.openVideo = function (item) {
    const html = '<div class="player">' +
      '<div class="player-frame"><iframe src="' + esc(item.video) + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen frameborder="0"></iframe></div>' +
      '<div class="player-foot">' +
        '<div class="hint">若播放器无法加载（多为网络限制），可点击下方在浏览器打开。</div>' +
        (item.url ? '<a class="btn soft full" style="margin-top:8px" href="' + esc(item.url) + '" target="_blank" rel="noopener">在浏览器打开 ↗</a>' : '') +
        '<a class="btn soft full" style="margin-top:8px" href="' + esc(item.video) + '" target="_blank" rel="noopener">在新窗口打开视频 ↗</a>' +
      '</div></div>';
    openFlow(html, { title: item.title });
    recordHot(item);
  };

  /* ---------- 浏览历史 ---------- */
  function recordHot(item) {
    const S = K.Store.data;
    S.hot.history = (S.hot.history || []).filter(h => h.id !== item.id);
    S.hot.history.unshift({ id: item.id, title: item.title, type: item.type, at: K.dstr() });
    if (S.hot.history.length > 40) S.hot.history.length = 40;
    K.Store.save();
  }
})(window);
