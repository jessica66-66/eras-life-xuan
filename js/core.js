/* =========================================================
   core.js — 基础引擎：时间 / 存储 / UI 组件 / 图表 / 拖拽
   ========================================================= */
(function (w) {
  'use strict';

  /* ---------- DOM ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ico = (id, cls) => {
    const S = Store.data;
    if (S && S.icons && S.icons.custom && S.icons.custom[id] && S.icons.custom[id].kind === 'img') {
      const d = S.icons.custom[id].data;
      return '<svg class="ic ' + (cls || '') + '"><image href="' + d + '" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"/></svg>';
    }
    return '<svg class="ic ' + (cls || '') + '"><use href="#' + id + '"></use></svg>';
  };

  /* ---------- 时间（统一北京时间 UTC+8） ---------- */
  const pad = n => String(n).padStart(2, '0');
  function nowBJ() { const d = new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000); }
  function dstr(d) { d = d || nowBJ(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function mstr(d) { return dstr(d).slice(0, 7); }
  function tstr(d) { d = d || nowBJ(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function addDays(ds, n) {
    const p = ds.split('-').map(Number); const dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
  }
  function addMonth(ms, n) {
    const p = ms.split('-').map(Number); let y = p[0], m = p[1] + n;
    while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; }
    return y + '-' + pad(m);
  }
  function dayDiff(a, b) { // b - a
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function weekdayOf(ds) { const p = ds.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  const WD = ['日', '一', '二', '三', '四', '五', '六'];
  function weekdayCN(ds) { return '星期' + WD[weekdayOf(ds)]; }
  function daysInMonth(ms) { const p = ms.split('-').map(Number); return new Date(p[0], p[1], 0).getDate(); }
  function monthDays(ms) { const n = daysInMonth(ms), a = []; for (let i = 1; i <= n; i++) a.push(ms + '-' + pad(i)); return a; }
  function weekRange(ds) { // 周一 ~ 周日
    const wd = weekdayOf(ds), off = wd === 0 ? 6 : wd - 1, start = addDays(ds, -off), a = [];
    for (let i = 0; i < 7; i++) a.push(addDays(start, i));
    return a;
  }
  function lastNDays(n, end) { const e = end || dstr(), a = []; for (let i = n - 1; i >= 0; i--) a.push(addDays(e, -i)); return a; }
  function mdShort(ds) { const p = ds.split('-'); return +p[1] + '/' + +p[2]; }
  function hm2min(t) { if (!t) return null; const p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function min2hm(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function sleepMinutes(bed, wake) { // 支持跨夜
    const a = hm2min(bed), b = hm2min(wake); if (a == null || b == null) return 0;
    return b >= a ? b - a : b + 1440 - a;
  }

  /* ---------- 工具 ---------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : (d || 0); };
  const pct = (a, b) => b > 0 ? clamp(Math.round(a / b * 1000) / 10, 0, 999) : 0;
  const money = v => '¥' + (Math.round(num(v) * 100) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function deepMerge(base, patch) {
    if (patch === undefined || patch === null) return base;
    if (Array.isArray(base) || typeof base !== 'object') return patch;
    const out = Object.assign({}, base);
    Object.keys(patch).forEach(k => {
      out[k] = (k in base) ? deepMerge(base[k], patch[k]) : patch[k];
    });
    return out;
  }

  /* ---------- 存储 ---------- */
  const DB_KEY = 'erasLifeXuan_v1';
  const Store = {
    data: null,
    load(defaults) {
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { raw = null; }
      this.data = raw ? deepMerge(defaults, raw) : defaults;
      return this.data;
    },
    save() {
      try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); }
      catch (e) { Toast('存储空间不足，部分数据未保存'); }
      return this.data;
    },
    export() { return JSON.stringify(this.data, null, 2); },
    import(str, defaults) {
      const obj = JSON.parse(str);
      this.data = deepMerge(defaults, obj); this.save(); return this.data;
    },
    reset() { localStorage.removeItem(DB_KEY); }
  };

  /* ---------- 专属图标：注入 / 选择器 ---------- */
  function injectIcons() {
    const S = Store.data; if (!S) return;
    const defs = document.getElementById('iconDefs'); if (!defs) return;
    $$('.cust-sym', defs).forEach(n => n.remove());
    if (S.icons && S.icons.overrides) {
      Object.keys(S.icons.overrides).forEach(bid => {
        const sym = document.getElementById(bid);
        if (sym && sym.tagName.toLowerCase() === 'symbol') sym.innerHTML = S.icons.overrides[bid];
      });
    }
    if (S.icons && S.icons.custom) {
      Object.keys(S.icons.custom).forEach(id => {
        const it = S.icons.custom[id];
        if (it.kind === 'svg') {
          const sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
          sym.setAttribute('id', id);
          sym.setAttribute('viewBox', '0 0 24 24');
          sym.setAttribute('class', 'cust-sym');
          sym.innerHTML = it.data;
          defs.appendChild(sym);
        }
      });
    }
  }
  function svgInner(code) {
    if (!code) return '';
    let s = String(code).trim();
    if (/^<svg[\s>]/i.test(s)) s = s.replace(/<\/?svg[^>]*>/gi, '');
    else if (/^<symbol[\s>]/i.test(s)) s = s.replace(/<\/?symbol[^>]*>/gi, '');
    return s.replace(/xmlns="[^"]*"/g, '').trim();
  }
  function iconCellsHTML(selected) {
    const list = (w.D && w.D.ICON_CHOICES) || [];
    let cells = list.map(o =>
      '<button type="button" class="ic-cell' + (o.v === selected ? ' on' : '') + '" data-ic="' + o.v + '">' +
      ico(o.v) + '<span>' + esc(o.t) + '</span></button>').join('');
    const S = Store.data || {};
    const custom = (S.icons && S.icons.custom) || {};
    cells += Object.keys(custom).map(id => {
      const c = custom[id];
      const label = c.label || (c.kind === 'img' ? '图片' : '自定义');
      return '<button type="button" class="ic-cell' + (id === selected ? ' on' : '') + '" data-ic="' + id + '">' +
        ico(id) + '<span>' + esc(label) + '</span></button>';
    }).join('');
    return cells;
  }

  /* ---------- Toast ---------- */
  function Toast(msg, ms) {
    const root = $('#toastRoot'); if (!root) return;
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg;
    root.appendChild(d);
    setTimeout(() => { d.style.transition = 'opacity .3s,transform .3s'; d.style.opacity = '0'; d.style.transform = 'translateY(8px)'; setTimeout(() => d.remove(), 320); }, ms || 2000);
  }

  /* ---------- 底部弹层 ---------- */
  const Sheet = {
    _stack: [],
    open({ title, body, footer, onMount, height }) {
      const root = $('#sheetRoot');
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;inset:0;pointer-events:auto;';
      wrap.innerHTML =
        '<div class="sheet-mask"></div>' +
        '<div class="sheet"' + (height ? ' style="height:' + height + '"' : '') + '>' +
        '<div class="grabber"></div>' +
        '<div class="sheet-hd"><div class="sheet-ttl">' + esc(title || '') + '</div>' +
        '<button class="icon-btn sheet-close" aria-label="关闭">' + ico('i-close') + '</button></div>' +
        '<div class="sheet-bd"></div>' +
        (footer ? '<div class="sheet-ft"></div>' : '') +
        '</div>';
      root.appendChild(wrap);
      const mask = $('.sheet-mask', wrap), sh = $('.sheet', wrap), bd = $('.sheet-bd', wrap);
      if (typeof body === 'string') bd.innerHTML = body; else if (body) bd.appendChild(body);
      if (footer) $('.sheet-ft', wrap).innerHTML = footer;
      requestAnimationFrame(() => { mask.classList.add('show'); sh.classList.add('show'); });
      const close = () => this.close(wrap);
      mask.addEventListener('click', close);
      $('.sheet-close', wrap).addEventListener('click', close);
      const api = { el: wrap, body: bd, close };
      this._stack.push(api);
      if (onMount) onMount(api);
      return api;
    },
    close(wrap) {
      const w2 = wrap || (this._stack.length ? this._stack[this._stack.length - 1].el : null);
      if (!w2) return;
      const mask = $('.sheet-mask', w2), sh = $('.sheet', w2);
      if (mask) mask.classList.remove('show'); if (sh) sh.classList.remove('show');
      setTimeout(() => w2.remove(), 300);
      this._stack = this._stack.filter(s => s.el !== w2);
    },
    /* 通用表单 */
    form({ title, fields, submitText, onSubmit, extra }) {
      const html = fields.map(f => renderField(f)).join('') + (extra || '');
      const api = Sheet.open({
        title,
        body: html,
        footer: '<button class="btn ghost" data-act="cancel">取消</button><button class="btn primary" data-act="ok">' + esc(submitText || '保存') + '</button>',
        onMount(a) {
          bindFields(a.el, fields);
          $('[data-act="cancel"]', a.el).addEventListener('click', a.close);
          $('[data-act="ok"]', a.el).addEventListener('click', () => {
            const vals = collectFields(a.el, fields);
            if (vals === null) return;
            const r = onSubmit(vals, a);
            if (r !== false) a.close();
          });
        }
      });
      return api;
    },
    confirm(title, text, onOk, okText) {
      return Sheet.open({
        title,
        body: '<div class="hint" style="font-size:13px;color:var(--ink-2);line-height:1.7">' + esc(text) + '</div>',
        footer: '<button class="btn ghost" data-act="cancel">取消</button><button class="btn primary" data-act="ok">' + esc(okText || '确定') + '</button>',
        onMount(a) {
          $('[data-act="cancel"]', a.el).addEventListener('click', a.close);
          $('[data-act="ok"]', a.el).addEventListener('click', () => { a.close(); onOk && onOk(); });
        }
      });
    }
  };

  function renderField(f) {
    const id = 'f_' + f.k;
    const lab = '<div class="fld-l">' + esc(f.label) + (f.required ? '<span class="req">*</span>' : '') + '</div>';
    let ctl = '';
    const v = f.value == null ? '' : f.value;
    switch (f.type) {
      case 'textarea': ctl = '<textarea class="inp" id="' + id + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(v) + '</textarea>'; break;
      case 'icons':
        ctl = '<div class="ic-grid" id="' + id + '" data-val="' + esc(v) + '">' + iconCellsHTML(v) + '</div>';
        break;
      case 'number': ctl = '<input class="inp" id="' + id + '" type="number" inputmode="decimal" step="' + (f.step || 'any') + '" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(v) + '">'; break;
      case 'date': ctl = '<input class="inp" id="' + id + '" type="date" value="' + esc(v) + '">'; break;
      case 'time': ctl = '<input class="inp" id="' + id + '" type="time" value="' + esc(v) + '">'; break;
      case 'select':
        ctl = '<select class="inp" id="' + id + '">' + (f.options || []).map(o =>
          '<option value="' + esc(o.v) + '"' + (String(o.v) === String(v) ? ' selected' : '') + '>' + esc(o.t) + '</option>').join('') + '</select>';
        break;
      case 'opts':
        ctl = '<div class="opts" id="' + id + '" data-val="' + esc(v) + '">' + (f.options || []).map(o =>
          '<button type="button" class="opt' + (String(o.v) === String(v) ? ' on' : '') + '" data-v="' + esc(o.v) + '">' + esc(o.t) + '</button>').join('') + '</div>';
        break;
      case 'range':
        ctl = '<input class="rng" id="' + id + '" type="range" min="' + (f.min || 1) + '" max="' + (f.max || 10) + '" step="' + (f.step || 1) + '" value="' + esc(v || f.min || 1) + '">' +
          '<div class="rng-v" id="' + id + '_v">' + esc(v || f.min || 1) + (f.unit || '') + '</div>';
        break;
      case 'switch':
        return '<div class="fld"><div class="sw-row"><div class="fld-l" style="margin:0">' + esc(f.label) + '</div>' +
          '<div class="sw' + (v ? ' on' : '') + '" id="' + id + '"><i></i></div></div>' + (f.hint ? '<div class="fld-h">' + esc(f.hint) + '</div>' : '') + '</div>';
      case 'note': return '<div class="fld"><div class="fld-h" style="font-size:11.5px">' + f.label + '</div></div>';
      default: ctl = '<input class="inp" id="' + id + '" type="text" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(v) + '">';
    }
    return '<div class="fld" data-fk="' + f.k + '">' + lab + ctl + (f.hint ? '<div class="fld-h">' + f.hint + '</div>' : '') + '</div>';
  }
  function bindFields(root, fields) {
    fields.forEach(f => {
      const id = '#f_' + f.k, e = $(id, root); if (!e) return;
      if (f.type === 'opts') {
        e.addEventListener('click', ev => {
          const b = ev.target.closest('.opt'); if (!b) return;
          $$('.opt', e).forEach(x => x.classList.remove('on')); b.classList.add('on');
          e.dataset.val = b.dataset.v;
          if (f.onChange) f.onChange(b.dataset.v, root);
        });
      } else if (f.type === 'range') {
        const out = $(id + '_v', root);
        e.addEventListener('input', () => { out.textContent = e.value + (f.unit || ''); if (f.onChange) f.onChange(e.value, root); });
      } else if (f.type === 'switch') {
        e.addEventListener('click', () => { e.classList.toggle('on'); if (f.onChange) f.onChange(e.classList.contains('on'), root); });
      } else if (f.type === 'icons') {
        e.addEventListener('click', ev => {
          const b = ev.target.closest('.ic-cell'); if (!b) return;
          $$('.ic-cell', e).forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          e.dataset.val = b.dataset.ic;
        });
      } else if (f.onChange) {
        e.addEventListener('change', () => f.onChange(e.value, root));
      }
    });
  }
  function collectFields(root, fields) {
    const out = {};
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i]; if (f.type === 'note') continue;
      const e = $('#f_' + f.k, root); if (!e) continue;
      let v;
      if (f.type === 'opts') v = e.dataset.val;
      else if (f.type === 'switch') v = e.classList.contains('on');
      else if (f.type === 'icons') v = e.dataset.val;
      else v = e.value;
      if (f.type === 'number') v = v === '' ? '' : num(v);
      if (typeof v === 'string') v = v.trim();
      if (f.required && (v === '' || v == null)) { Toast('请填写：' + f.label); e.focus && e.focus(); return null; }
      if (f.validate) { const msg = f.validate(v, out); if (msg) { Toast(msg); return null; } }
      out[f.k] = v;
    }
    return out;
  }

  /* ---------- 轻量 SVG 图表 ---------- */
  const C = { pink: '#FF9CC9', lilac: '#B197F0', sky: '#7FC0F5', mint: '#6FCFB0', gold: '#F0BE63', grey: '#D8CFE2', ink: '#A497B0' };
  function chartLine(opts) {
    const { labels = [], series = [], height = 150, max, min = 0, area = true, yTicks = 3, fmt } = opts;
    const W = 320, H = height, pl = 26, pr = 8, pt = 12, pb = 20;
    const iw = W - pl - pr, ih = H - pt - pb;
    let vmax = max;
    if (vmax == null) { vmax = 1; series.forEach(s => s.data.forEach(v => { if (v != null && v > vmax) vmax = v; })); vmax = Math.ceil(vmax * 1.15); }
    const n = labels.length || 1;
    const X = i => pl + (n === 1 ? iw / 2 : iw * i / (n - 1));
    const Y = v => pt + ih - (clamp((v - min) / (vmax - min || 1), 0, 1) * ih);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img">';
    for (let t = 0; t <= yTicks; t++) {
      const v = min + (vmax - min) * t / yTicks, y = Y(v);
      s += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="rgba(170,145,190,.16)" stroke-width="1"/>';
      s += '<text x="' + (pl - 4) + '" y="' + (y + 3).toFixed(1) + '" font-size="8" fill="#A497B0" text-anchor="end">' + (fmt ? fmt(v) : Math.round(v)) + '</text>';
    }
    series.forEach((se, si) => {
      const col = se.color || [C.pink, C.lilac, C.sky, C.mint][si % 4];
      const pts = [];
      se.data.forEach((v, i) => { if (v != null) pts.push([X(i), Y(v)]); });
      if (!pts.length) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      if (area && se.area !== false) {
        s += '<defs><linearGradient id="g' + si + Math.random().toString(36).slice(2, 6) + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
        s += '<path d="' + d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (pt + ih) + ' L' + pts[0][0].toFixed(1) + ' ' + (pt + ih) + ' Z" fill="' + col + '" opacity=".16"/>';
      }
      s += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
      pts.forEach(p => { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="#fff" stroke="' + col + '" stroke-width="1.8"/>'; });
    });
    const step = Math.ceil(n / 7);
    labels.forEach((l, i) => {
      if (i % step && i !== n - 1) return;
      s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 5) + '" font-size="8" fill="#A497B0" text-anchor="middle">' + esc(l) + '</text>';
    });
    return s + '</svg>';
  }
  function chartBar(opts) {
    const { labels = [], data = [], height = 150, colors, max, fmt, target } = opts;
    const W = 320, H = height, pl = 26, pr = 8, pt = 12, pb = 20;
    const iw = W - pl - pr, ih = H - pt - pb;
    let vmax = max || Math.max.apply(null, data.concat([1])); vmax = vmax * 1.18;
    const n = data.length || 1, bw = Math.max(4, Math.min(26, iw / n * .62)), gap = iw / n;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img">';
    for (let t = 0; t <= 3; t++) {
      const y = pt + ih - ih * t / 3;
      s += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="rgba(170,145,190,.16)"/>';
      s += '<text x="' + (pl - 4) + '" y="' + (y + 3).toFixed(1) + '" font-size="8" fill="#A497B0" text-anchor="end">' + (fmt ? fmt(vmax * t / 3) : Math.round(vmax * t / 3)) + '</text>';
    }
    if (target != null && target > 0 && target < vmax) {
      const y = pt + ih - ih * (target / vmax);
      s += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="#F5A8C4" stroke-width="1.2" stroke-dasharray="4 3"/>';
    }
    data.forEach((v, i) => {
      const h = clamp((v || 0) / vmax, 0, 1) * ih, x = pl + gap * i + (gap - bw) / 2, y = pt + ih - h;
      const col = colors ? colors[i] : null;
      s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(h, v ? 2 : 0).toFixed(1) + '" rx="' + Math.min(4, bw / 2).toFixed(1) + '" fill="' + (col || 'url(#bargrad)') + '"/>';
    });
    s += '<defs><linearGradient id="bargrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFAAD3"/><stop offset="1" stop-color="#C0A5F5"/></linearGradient></defs>';
    const step = Math.ceil(n / 8);
    labels.forEach((l, i) => {
      if (i % step && i !== n - 1) return;
      s += '<text x="' + (pl + gap * i + gap / 2).toFixed(1) + '" y="' + (H - 5) + '" font-size="8" fill="#A497B0" text-anchor="middle">' + esc(l) + '</text>';
    });
    return s + '</svg>';
  }
  function chartRing(opts) {
    const { value = 0, label = '', sub = '', size = 120, color = '#FF9CC9', color2 = '#9FC9F7' } = opts;
    const r = 46, cx = 60, cy = 60, cir = 2 * Math.PI * r, off = cir * (1 - clamp(value / 100, 0, 1));
    const gid = 'rg' + Math.random().toString(36).slice(2, 7);
    return '<svg viewBox="0 0 120 120" style="width:' + size + 'px;height:' + size + 'px;max-width:100%" role="img">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + color + '"/><stop offset="1" stop-color="' + color2 + '"/></linearGradient></defs>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(190,165,210,.18)" stroke-width="11"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="url(#' + gid + ')" stroke-width="11" stroke-linecap="round" ' +
      'stroke-dasharray="' + cir.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '<text x="60" y="' + (sub ? 57 : 63) + '" text-anchor="middle" font-size="21" font-weight="700" fill="#6B537C">' + esc(label) + '</text>' +
      (sub ? '<text x="60" y="75" text-anchor="middle" font-size="10" fill="#A497B0">' + esc(sub) + '</text>' : '') +
      '</svg>';
  }
  function chartDonut(items, opts) {
    opts = opts || {};
    const total = items.reduce((s, i) => s + i.v, 0) || 1;
    const R = 52, r = 32, cx = 60, cy = 60;
    let a0 = -Math.PI / 2, s = '<svg viewBox="0 0 120 120" style="width:' + (opts.size || 130) + 'px;height:' + (opts.size || 130) + 'px;max-width:100%">';
    items.forEach(it => {
      const a1 = a0 + (it.v / total) * Math.PI * 2;
      const big = (a1 - a0) > Math.PI ? 1 : 0;
      if (it.v <= 0) { return; }
      const p = (rad, ang) => [(cx + rad * Math.cos(ang)).toFixed(2), (cy + rad * Math.sin(ang)).toFixed(2)];
      const A = p(R, a0), B = p(R, a1), Cc = p(r, a1), D = p(r, a0);
      s += '<path d="M' + A + 'A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + B + 'L' + Cc + 'A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + D + 'Z" fill="' + it.c + '" opacity=".92"/>';
      a0 = a1;
    });
    s += '<text x="60" y="58" text-anchor="middle" font-size="13" font-weight="700" fill="#6B537C">' + esc(opts.center || '') + '</text>';
    s += '<text x="60" y="72" text-anchor="middle" font-size="9" fill="#A497B0">' + esc(opts.sub || '') + '</text>';
    return s + '</svg>';
  }
  const Chart = { line: chartLine, bar: chartBar, ring: chartRing, donut: chartDonut, C };

  /* ---------- 拖拽排序（指针事件，移动端友好） ---------- */
  function makeSortable(list, opts) {
    opts = opts || {};
    const itemSel = opts.item || '[data-sort-id]';
    const handleSel = opts.handle || '.drag-handle';
    let drag = null;
    list.addEventListener('pointerdown', e => {
      const h = e.target.closest(handleSel); if (!h || !list.contains(h)) return;
      const it = h.closest(itemSel); if (!it) return;
      e.preventDefault();
      drag = it; it.classList.add('dragging');
      try { h.setPointerCapture(e.pointerId); } catch (err) { }
      const move = ev => {
        if (!drag) return;
        const y = ev.clientY;
        const sibs = $$(itemSel, list).filter(x => x !== drag);
        for (let i = 0; i < sibs.length; i++) {
          const r = sibs[i].getBoundingClientRect(), mid = r.top + r.height / 2;
          if (y < mid && sibs[i].compareDocumentPosition(drag) & Node.DOCUMENT_POSITION_FOLLOWING) { list.insertBefore(drag, sibs[i]); break; }
          if (y > mid && sibs[i].compareDocumentPosition(drag) & Node.DOCUMENT_POSITION_PRECEDING) { list.insertBefore(drag, sibs[i].nextSibling); break; }
        }
      };
      const up = () => {
        if (drag) drag.classList.remove('dragging');
        drag = null;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (opts.onEnd) opts.onEnd($$(itemSel, list).map(x => x.dataset.sortId));
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
  }

  /* ---------- 网络（带超时 + 容错） ---------- */
  function fetchJSON(url, ms) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('timeout')), ms || 7000);
      fetch(url, { mode: 'cors', cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)))
        .then(j => { clearTimeout(t); res(j); })
        .catch(e => { clearTimeout(t); rej(e); });
    });
  }

  w.Core = {
    $, $$, esc, ico, pad, nowBJ, dstr, mstr, tstr, addDays, addMonth, dayDiff, weekdayCN, weekdayOf,
    daysInMonth, monthDays, weekRange, lastNDays, mdShort, hm2min, min2hm, sleepMinutes,
    uid, clamp, num, pct, money, pick, deepMerge, Store, Toast, Sheet, Chart, makeSortable, fetchJSON, DB_KEY,
    injectIcons, iconCellsHTML, svgInner
  };
})(window);
