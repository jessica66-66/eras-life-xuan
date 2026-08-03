/* =========================================================
   app.js — 路由 / 侧边栏 / 拖拽改序 / 新增模块 / 设置 / 初始化
   ========================================================= */
(function (w) {
  'use strict';
  const K = w.Core, D = w.D, UI = w.UI, P = w.Pages, $ = K.$, $$ = K.$$, esc = K.esc, ico = K.ico;

  const App = w.App = {
    cur: 'home',
    timers: [],
    timer(id) { this.timers.push(id); return id; },
    clearTimers() { this.timers.forEach(clearInterval); this.timers = []; },

    modules() {
      const S = K.Store.data;
      const mi = (S.settings && S.settings.moduleIcons) || {};
      const all = D.MODULES.concat(S.settings.custom || []).map(m => {
        const icon = mi[m.id] || m.icon;
        return icon === m.icon ? m : Object.assign({}, m, { icon: icon });
      });
      const order = S.settings.order.slice();
      all.forEach(m => { if (order.indexOf(m.id) < 0) order.push(m.id); });
      S.settings.order = order.filter(id => all.some(m => m.id === id));
      return S.settings.order.map(id => all.find(m => m.id === id)).filter(Boolean);
    },
    modOf(id) { return this.modules().find(m => m.id === id) || this.modules()[0]; },

    go(id) {
      if (this.cur !== id) { this.cur = id; this._scroll = 0; }
      this.closeDrawer();
      this.render(true);
    },

    render(reset) {
      const S = K.Store.data, mod = this.modOf(this.cur), page = P[mod.id] || P.__custom;
      const view = $('#view');
      const keep = reset ? 0 : window.scrollY;
      this.clearTimers();
      const slogan = mod.slogan ? '<section class="slogan">' +
        '<div class="slogan-en">' + esc(mod.slogan) + '</div>' +
        (mod.sloganCn ? '<div class="slogan-cn">' + esc(mod.sloganCn) + '</div>' : '') +
        ico(mod.icon, 'slogan-ico') + '</section>' : '';
      view.innerHTML = '<div class="page">' + slogan + page.render(mod) + '</div>';
      page.mount(view, this, mod);
      $('#topTitle').textContent = mod.id === 'home' ? 'Eras Life・璇' : mod.name + '・璇';
      this.paintNav();
      window.scrollTo(0, keep);
      this._scroll = keep;
    },

    /* ---------- 侧边栏 ---------- */
    paintNav() {
      const S = K.Store.data, list = $('#navList');
      list.innerHTML = this.modules().map(m =>
        '<div class="nav-item' + (m.id === this.cur ? ' active' : '') + '" data-sort-id="' + m.id + '" data-id="' + m.id + '"' + (m.custom ? ' data-custom="1"' : '') + '>' +
        '<div class="nav-handle drag-handle">' + ico('i-drag') + '</div>' +
        '<div class="nav-ico" data-ic-mid="' + m.id + '" title="点击更换图标">' + ico(m.icon || 'i-sparkle') + '</div>' +
        '<div class="nav-txt"><div class="nav-name">' + esc(m.name) + '</div><div class="nav-desc">' + esc(m.desc || '') + '</div></div>' +
        (m.custom ? '<button class="nav-del" data-del="' + m.id + '">' + ico('i-close') + '</button>' : '') +
        '</div>').join('');
      $$('.nav-item', list).forEach(it => it.addEventListener('click', e => {
        if (e.target.closest('.drag-handle') || e.target.closest('[data-del]') || e.target.closest('.nav-ico')) return;
        if (list.classList.contains('sorting')) return;
        App.go(it.dataset.id);
      }));
      $$('.nav-ico[data-ic-mid]', list).forEach(ic => ic.addEventListener('click', e => {
        e.stopPropagation();
        if (list.classList.contains('sorting')) return;
        App.pickIconForModule(ic.dataset.icMid);
      }));
      $$('[data-del]', list).forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        App.deleteModule(b.dataset.del);
      }));
      const n = S.meta.visitDays.length;
      $('#footDays').textContent = '已陪伴你 ' + n + ' 天 · 共 ' + this.modules().length + ' 个模块';
    },
    openDrawer() { $('#drawer').classList.add('open'); $('#scrim').classList.add('show'); },
    closeDrawer() { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('show'); },

    addModule() {
      const S = K.Store.data;
      K.Sheet.form({
        title: '新增自定义模块',
        fields: [
          { k: 'name', label: '模块名称', required: true, placeholder: '如：运动 / 护肤 / 追星日程' },
          { k: 'desc', label: '一句话说明', placeholder: '如：每日运动打卡' },
          { k: 'icon', label: '专属图标', type: 'icons', value: 'i-sparkle' },
          { k: 'slogan', label: '模块标语（英文）', placeholder: '如：Keep shining every day' },
          { k: 'sloganCn', label: '标语中文释义', placeholder: '如：每天都要闪闪发光' }
        ],
        submitText: '创建模块',
        onSubmit: v => {
          const id = 'c_' + K.uid();
          S.settings.custom.push({ id: id, name: v.name, desc: v.desc || '自定义模块', icon: v.icon, slogan: v.slogan || 'Write your own era', sloganCn: v.sloganCn || '书写属于你自己的时代', custom: true });
          S.settings.order.push(id);
          S.customData[id] = { items: [], notes: [] };
          K.Store.save(); K.Toast('模块已创建 ✦'); App.go(id);
        }
      });
    },

    deleteModule(id) {
      const S = K.Store.data;
      const mod = this.modules().find(m => m.id === id);
      if (!mod) return;
      K.Sheet.confirm('删除模块', '即将删除「' + mod.name + '」及其所有数据，删除后不可恢复。确认删除吗？', () => {
        S.settings.custom = S.settings.custom.filter(m => m.id !== id);
        S.settings.order = S.settings.order.filter(x => x !== id);
        if (S.settings.moduleIcons) delete S.settings.moduleIcons[id];
        delete S.customData[id];
        K.Store.save();
        if (App.cur === id) App.cur = 'home';
        App.closeDrawer();
        App.render(true);
        K.Toast('模块已删除 ✦');
      }, '删除');
    },

    delModule() {
      const S = K.Store.data;
      const mods = this.modules();
      const rows = mods.map(m => {
        const ic = ico(m.icon || 'i-sparkle');
        if (!m.custom) return '<div class="dm-item dm-locked"><div class="dm-ico">' + ic + '</div><div class="dm-txt"><strong>' + esc(m.name) + '</strong><span>核心模块 · 不可删除</span></div></div>';
        return '<div class="dm-item"><div class="dm-ico">' + ic + '</div><div class="dm-txt"><strong>' + esc(m.name) + '</strong><span>' + esc(m.desc || '自定义模块') + '</span></div><button class="dm-del" data-id="' + m.id + '">' + ico('i-close') + '</button></div>';
      }).join('');
      const body = rows || '<div class="dm-empty">暂无可删除的自定义模块</div>';
      K.Sheet.open({
        title: '删除模块', body: body,
        onMount(a) {
          $$('.dm-del', a.el).forEach(b => b.addEventListener('click', e => {
            e.stopPropagation();
            App.deleteModule(b.dataset.id);
          }));
        }
      });
    },

    syncSectionHTML(S) {
      const c = S.settings.sync;
      const st = c.status === 'ok' ? ('已同步' + (c.lastSync ? ' · ' + c.lastSync : '')) : (c.status === 'error' ? '同步出错' : (c.status === 'offline' ? '离线待同步' : (c.enabled ? '同步中…' : '未开启')));
      const jsonbin = '<div id="syncJsonbin">' +
        '<div class="fld"><div class="fld-l">Bin ID</div><input class="inp" id="stBin" placeholder="JSONBin 的 Bin ID" value="' + esc(c.bin || '') + '"></div>' +
        '<div class="fld"><div class="fld-l">API Key（X-Master-Key）</div><input class="inp" id="stKey" type="password" placeholder="JSONBin 的密钥" value="' + esc(c.key || '') + '"></div>' +
        '<div class="fld-h">在 jsonbin.io 免费注册后新建一个 Bin，把 Bin ID 与 API Key 填到这里即可。</div></div>';
      const custom = '<div id="syncCustom" style="display:none">' +
        '<div class="fld"><div class="fld-l">同步地址（GET/PUT 完整 URL）</div><input class="inp" id="stUrl" placeholder="https://your-server/api/eras" value="' + esc(c.url || '') + '"></div>' +
        '<div class="fld"><div class="fld-l">请求头（JSON，可选）</div><textarea class="inp" id="stHeaders" placeholder=\'{"Authorization":"Bearer xxx"}\'>' + esc(c.headers || '') + '</textarea></div>' +
        '<div class="fld-h">任意返回/接收 JSON 的 REST 接口均可（含自建服务器）。</div></div>';
      return '<div class="fld"><div class="fld-l">云端同步</div>' +
        '<div class="sw-row"><div class="fld-l" style="margin:0">开启多端同步</div><div class="sw' + (c.enabled ? ' on' : '') + '" id="stSyncOn"><i></i></div></div>' +
        '<div class="fld" style="margin-top:10px"><div class="fld-l">服务类型</div>' +
        '<select class="inp" id="stSyncMode">' +
        '<option value="jsonbin"' + (c.mode === 'jsonbin' ? ' selected' : '') + '>JSONBin（免服务器）</option>' +
        '<option value="custom"' + (c.mode === 'custom' ? ' selected' : '') + '>自定义 / 自建服务器</option>' +
        '</select></div>' +
        jsonbin + custom +
        '<div class="btn-row"><button class="btn sm soft" id="stTest">测试连接</button><button class="btn sm primary" id="stNow">立即同步</button></div>' +
        '<div class="btn-row"><button class="btn sm ghost" id="stPush">强制上传</button><button class="btn sm ghost" id="stPull">强制下载</button></div>' +
        '<div class="fld-h" id="stSyncStatus">状态：' + st + '</div></div>';
    },

    /* ---------- 设置 ---------- */
    settings() {
      const S = K.Store.data;      const body =
        '<div class="fld"><div class="fld-l">所在城市</div><button class="btn full ghost" id="stCity">' + esc(S.settings.city.name) + '</button></div>' +
        '<div class="fld"><div class="fld-l">每日阅读最低目标（分钟）</div><input class="inp" id="stRead" type="number" value="' + S.reading.dailyMin + '"></div>' +
        '<div class="fld"><div class="fld-l">单词每日目标用时（分钟）</div><input class="inp" id="stWord" type="number" value="' + S.words.target.minutes + '"></div>' +
        '<div class="fld"><div class="sw-row"><div class="fld-l" style="margin:0">开启事务系统提醒</div><div class="sw' + (S.settings.notify ? ' on' : '') + '" id="stNotify"><i></i></div></div>' +
        '<div class="fld-h">用于出行事务到点提醒，需要浏览器授权通知权限。</div></div>' +
        '<div class="fld"><div class="fld-l">睡眠标准</div><div class="hint">' + S.sleep.std.focus + ' 专注 · ' + S.sleep.std.bed + ' 上床 · ' + S.sleep.std.wake + ' 起床 · ' + S.sleep.std.redline + ' 熬夜红线</div>' +
        '<button class="btn full ghost sm" style="margin-top:8px" id="stSleep">前往早睡模块自定义</button></div>' +
        '<div class="fld"><div class="fld-l">专属图标</div><button class="btn full ghost sm" id="stIcons">管理 / 新增专属图标</button>' +
        '<div class="fld-h">点击侧边栏任意模块的图标即可快速更换；此处可上传图片、粘贴 SVG 新增图标，或编辑内置图标图形。</div></div>' +
        this.syncSectionHTML(S) +
        '<div class="fld"><div class="fld-l">数据管理</div>' +
        '<div class="btn-row" style="margin-top:0"><button class="btn sm soft" id="stExport">导出备份</button><button class="btn sm soft" id="stImport">导入恢复</button></div>' +
        '<div class="fld-h">全部数据保存在本机浏览器，自动留存、每日更新；开启云端同步后，任意设备打开同一链接即自动同步、永久不丢。</div></div>' +
        '<div class="fld"><button class="btn full ghost sm" id="stReset" style="color:#D2536F">清空全部数据</button></div>' +
        '<div class="fld-h" style="text-align:center;line-height:1.8">Eras Life・璇 · 个人生活工作台<br>I can see you shining in your own eras ✦<br>累计使用 ' + S.meta.visitDays.length + ' 天 · 始于 ' + S.meta.firstUse + '</div>';
      K.Sheet.open({
        title: '设置', body: body,
        onMount: a => {
          $('#stCity', a.el).addEventListener('click', () => { a.close(); P.home.cityPicker(App); });
          $('#stSleep', a.el).addEventListener('click', () => { a.close(); App.go('sleep'); setTimeout(() => P.sleep.std(App), 320); });
          $('#stNotify', a.el).addEventListener('click', function () {
            this.classList.toggle('on');
            const on = this.classList.contains('on');
            S.settings.notify = on; K.Store.save();
            if (on && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
          });
          ['stRead', 'stWord'].forEach(id => $('#' + id, a.el).addEventListener('change', function () {
            const v = Math.max(1, K.num(this.value, 1));
            if (id === 'stRead') S.reading.dailyMin = v; else S.words.target.minutes = v;
            K.Store.save(); K.Toast('已保存');
          }));
          $('#stExport', a.el).addEventListener('click', () => {
            const blob = new Blob([K.Store.export()], { type: 'application/json' });
            const url = URL.createObjectURL(blob), el = document.createElement('a');
            el.href = url; el.download = 'eras-life-xuan-' + K.dstr() + '.json';
            document.body.appendChild(el); el.click(); el.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            K.Toast('备份文件已导出');
          });
          $('#stImport', a.el).addEventListener('click', () => {
            const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
            inp.addEventListener('change', () => {
              const f = inp.files[0]; if (!f) return;
              const rd = new FileReader();
              rd.onload = () => {
                try { K.Store.import(rd.result, D.defaults()); K.Toast('数据已恢复'); a.close(); App.render(true); }
                catch (e) { K.Toast('文件格式不正确'); }
              };
              rd.readAsText(f);
            });
            inp.click();
          });
          $('#stIcons', a.el).addEventListener('click', () => { a.close(); App.iconManager(); });

          // 云端同步
          const Sync = w.Sync;
          const c = S.settings.sync;
          const setStatus = (t) => { const el = $('#stSyncStatus', a.el); if (el) el.textContent = '状态：' + t; };
          const readCfg = () => {
            c.enabled = $('#stSyncOn', a.el).classList.contains('on');
            c.mode = $('#stSyncMode', a.el).value;
            c.bin = $('#stBin', a.el).value.trim();
            c.key = $('#stKey', a.el).value.trim();
            c.url = $('#stUrl', a.el).value.trim();
            c.headers = $('#stHeaders', a.el).value.trim();
            K.Store.save();
          };
          $('#stSyncOn', a.el).addEventListener('click', function () {
            this.classList.toggle('on'); readCfg();
          });
          Sync.setStatus(c.status);
          const toggleMode = () => {
            const m = $('#stSyncMode', a.el).value;
            $('#syncJsonbin', a.el).style.display = m === 'jsonbin' ? '' : 'none';
            $('#syncCustom', a.el).style.display = m === 'custom' ? '' : 'none';
          };
          $('#stSyncMode', a.el).addEventListener('change', function () { toggleMode(); readCfg(); });
          $('#stTest', a.el).addEventListener('click', async () => {
            readCfg();
            if (!c.enabled) { K.Toast('请先开启同步'); return; }
            try { const r = await Sync.test(); setStatus(r.ok ? ('连接正常' + (r.hasData ? '，云端已有数据' : '，云端为空')) : '连接失败'); K.Toast('连接正常 ✦'); }
            catch (e) { setStatus('连接失败：' + (e.message || e)); K.Toast('连接失败：' + (e.message || e)); }
          });
          $('#stNow', a.el).addEventListener('click', () => { readCfg(); if (!c.enabled) { K.Toast('请先开启同步'); return; } if (Sync.syncing) { K.Toast('同步已在进行中，请稍候'); return; } Sync.once(); });
          $('#stPush', a.el).addEventListener('click', () => { readCfg(); if (!c.enabled) { K.Toast('请先开启同步'); return; } if (Sync.syncing) { K.Toast('同步已在进行中，请稍候'); return; } Sync.forcePush(); });
          $('#stPull', a.el).addEventListener('click', () => { readCfg(); if (!c.enabled) { K.Toast('请先开启同步'); return; } if (Sync.syncing) { K.Toast('同步已在进行中，请稍候'); return; } Sync.forcePull(); });

          $('#stReset', a.el).addEventListener('click', () => {
            K.Sheet.confirm('清空全部数据', '此操作不可恢复，将删除所有打卡、记账、阅读与复盘记录。建议先导出备份。', () => {
              K.Store.reset(); location.reload();
            }, '确认清空');
          });
        }
      });
    },

    /* ---------- 为单个模块挑选图标（侧边栏快捷入口） ---------- */
    pickIconForModule(mid) {
      const S = K.Store.data;
      const mod = this.modules().find(m => m.id === mid);
      if (!mod) return;
      const current = (S.settings.moduleIcons && S.settings.moduleIcons[mid]) || mod.icon;
      const body = '<div class="fld-h" style="margin-bottom:10px">为「' + esc(mod.name) + '」选择专属图标：</div>' +
        '<div class="ic-grid" id="pmGrid">' + K.iconCellsHTML(current) + '</div>';
      K.Sheet.open({
        title: '更改模块图标', body: body, height: '72%',
        onMount(a) {
          const g = $('#pmGrid', a.el);
          g.addEventListener('click', ev => {
            const cell = ev.target.closest('.ic-cell'); if (!cell) return;
            S.settings.moduleIcons[mid] = cell.dataset.ic;
            K.Store.save(); K.injectIcons(); App.render(true); a.close();
            K.Toast('已更新「' + mod.name + '」图标 ✦');
          });
        }
      });
    },

    /* ---------- 专属图标管理 ---------- */
    iconManager() {
      const S = K.Store.data, self = this;
      const afterChange = () => { K.injectIcons(); K.Store.save(); self.render(true); };
      const refreshGrid = () => { const g = $('#imGrid'); if (g) g.innerHTML = K.iconCellsHTML(g.dataset.sel); };

      function assignToModule(iconId) {
        const mods = self.modules();
        const body = '<div class="fld-h" style="margin-bottom:8px">选择要把该图标指定给的模块：</div>' +
          mods.map(m => '<button class="btn full ghost sm im-mod" data-mid="' + m.id + '">' + ico(m.icon) + ' ' + esc(m.name) + '</button>').join('');
        K.Sheet.open({
          title: '指定给模块', body: body,
          onMount(a) {
            $$('.im-mod', a.el).forEach(b => b.addEventListener('click', () => {
              S.settings.moduleIcons[b.dataset.mid] = iconId;
              afterChange(); a.close(); K.Toast('已更新模块图标 ✦');
            }));
          }
        });
      }
      function delIcon(iconId) {
        delete S.icons.custom[iconId];
        if (S.settings.moduleIcons) Object.keys(S.settings.moduleIcons).forEach(k => { if (S.settings.moduleIcons[k] === iconId) delete S.settings.moduleIcons[k]; });
        if (S.settings.custom) S.settings.custom.forEach(m => { if (m.icon === iconId) m.icon = 'i-sparkle'; });
        afterChange(); K.Toast('已删除图标');
      }
      function uploadImage() {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', () => {
          const f = inp.files[0]; if (!f) return;
          if (f.size > 300 * 1024) { K.Toast('图片请小于 300KB，避免超出本地存储'); return; }
          const rd = new FileReader();
          rd.onload = () => {
            const id = 'u_' + K.uid();
            S.icons.custom[id] = { kind: 'img', data: rd.result, label: (f.name || '图片').replace(/\.[^.]+$/, '') };
            afterChange(); K.Toast('图片图标已添加 ✦'); refreshGrid();
          };
          rd.readAsDataURL(f);
        });
        inp.click();
      }
      function addSvg() {
        K.Sheet.form({
          title: '粘贴 SVG 新增图标',
          fields: [
            { k: 'name', label: '图标名称', required: true, placeholder: '如：咖啡' },
            { k: 'svg', label: 'SVG 代码（<svg>…</svg> 或内部 <path>）', type: 'textarea', required: true, placeholder: '<svg viewBox="0 0 24 24"><path d="..."/></svg>' }
          ],
          submitText: '添加图标',
          onSubmit(v) {
            const inner = K.svgInner(v.svg);
            if (!inner) { K.Toast('未识别到 SVG 内容'); return false; }
            const id = 's_' + K.uid();
            S.icons.custom[id] = { kind: 'svg', data: inner, label: v.name };
            afterChange(); K.Toast('SVG 图标已添加 ✦'); refreshGrid();
          }
        });
      }
      function editBuiltin() {
        K.Sheet.form({
          title: '编辑专属图标图形',
          fields: [
            { k: 'bid', label: '选择要改的内置图标', type: 'select', value: 'i-heart', options: D.ICON_CHOICES },
            { k: 'svg', label: '新的 SVG 内部代码（将替换原图形）', type: 'textarea', placeholder: '<path d="..."/>', required: true }
          ],
          submitText: '保存图形',
          onSubmit(v) {
            const inner = K.svgInner(v.svg);
            if (!inner) { K.Toast('未识别到 SVG 内容'); return false; }
            S.icons.overrides[v.bid] = inner;
            afterChange(); K.Toast('图标图形已更新 ✦');
          }
        });
      }

      const body =
        '<div class="fld-h" style="margin-bottom:6px">点击图标可将其<b>指定给模块</b>；自定义图标可删除。下方可上传图片或粘贴 SVG 新增图标。</div>' +
        '<div class="ic-grid" id="imGrid" data-sel="">' + K.iconCellsHTML('') + '</div>' +
        '<div class="btn-row" style="margin-top:14px">' +
        '<button class="btn sm soft" id="imUpload">＋ 上传图片</button>' +
        '<button class="btn sm soft" id="imSvg">＋ 粘贴SVG</button>' +
        '<button class="btn sm soft" id="imEdit">✎ 改内置图形</button></div>';
      K.Sheet.open({
        title: '专属图标管理', body: body, height: '78%',
        onMount(a) {
          const g = $('#imGrid', a.el);
          g.addEventListener('click', ev => {
            const cell = ev.target.closest('.ic-cell'); if (!cell) return;
            const iconId = cell.dataset.ic;
            const isCustom = !!(S.icons.custom && S.icons.custom[iconId]);
            const acts = [{ t: '指定给模块', fn: () => assignToModule(iconId) }];
            if (isCustom) acts.push({ t: '删除该图标', danger: true, fn: () => {
              K.Sheet.confirm('删除图标', '删除后使用它的模块将恢复默认图标，确认？', () => { delIcon(iconId); refreshGrid(); }, '删除');
            } });
            else acts.push({ t: '改图形', fn: () => { a.close(); editBuiltin(); } });
            const ab = acts.map((x, i) => '<button class="btn full ' + (x.danger ? 'ghost' : 'soft') + ' sm im-act" data-i="' + i + '">' + x.t + '</button>').join('');
            K.Sheet.open({ title: '图标操作', body: ab, onMount(b) {
              $$('.im-act', b.el).forEach(btn => btn.addEventListener('click', () => { b.close(); acts[+btn.dataset.i].fn(); }));
            } });
          });
          $('#imUpload', a.el).addEventListener('click', uploadImage);
          $('#imSvg', a.el).addEventListener('click', addSvg);
          $('#imEdit', a.el).addEventListener('click', () => { a.close(); editBuiltin(); });
        }
      });
    },

    /* ---------- 初始化 ---------- */
    init() {
      // 急救重置：URL 带 ?reset=1 时清空本地缓存并重新加载
      if (location.search.includes('reset=1')) {
        try { K.Store.reset(); } catch (e) {}
        const url = new URL(location.href);
        url.searchParams.delete('reset');
        location.replace(url.toString());
        return;
      }
      try {
      K.Store.load(D.defaults());
      K.injectIcons();
      if (w.Sync) w.Sync.init();
      D.runDailyJobs();

      // 星光闪片
      const sp = $('#sparkles'); let s = '';
      for (let i = 0; i < 22; i++) {
        const x = Math.random() * 100, y = Math.random() * 100, d = (Math.random() * 5).toFixed(2), sc = (.5 + Math.random() * 1.3).toFixed(2);
        s += '<span class="sp" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;animation-delay:' + d + 's;transform:scale(' + sc + ')"></span>';
      }
      sp.innerHTML = s;

      $('#btnMenu').addEventListener('click', () => this.openDrawer());
      $('#scrim').addEventListener('click', () => this.closeDrawer());
      $('#btnSettings').addEventListener('click', () => this.settings());
      $('#btnSync').addEventListener('click', () => { if (w.Sync) w.Sync.manual(); });
      $('#btnAddModule').addEventListener('click', () => { this.closeDrawer(); setTimeout(() => this.addModule(), 260); });
      $('#btnDelModule').addEventListener('click', () => { this.closeDrawer(); setTimeout(() => this.delModule(), 260); });
      const sm = $('#btnSortMode');
      sm.addEventListener('click', () => {
        const list = $('#navList');
        list.classList.toggle('sorting'); sm.classList.toggle('active');
        sm.textContent = list.classList.contains('sorting') ? '完成排序' : '拖动排序';
        K.Toast(list.classList.contains('sorting') ? '按住右侧手柄上下拖动即可改序' : '模块顺序已保存');
      });
      K.makeSortable($('#navList'), {
        item: '.nav-item', handle: '.drag-handle',
        onEnd: ids => { K.Store.data.settings.order = ids; K.Store.save(); }
      });

      // 左边缘滑动打开侧边栏
      let sx = 0, sy = 0, tracking = false;
      document.addEventListener('touchstart', e => {
        const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
        tracking = sx < 26 && !$('#drawer').classList.contains('open');
      }, { passive: true });
      document.addEventListener('touchmove', e => {
        if (!tracking) return;
        const t = e.touches[0];
        if (t.clientX - sx > 46 && Math.abs(t.clientY - sy) < 40) { this.openDrawer(); tracking = false; }
      }, { passive: true });

      this.render(true);

      // 跨零点自动刷新
      setInterval(() => {
        const d = K.dstr();
        if (K.Store.data.meta.lastRun !== d) { D.runDailyJobs(); this.render(true); K.Toast('新的一天，数据已自动更新 ✦'); }
      }, 60000);
      // 事务提醒巡检
      setInterval(() => { if (P.todo && P.todo.checkRemind) P.todo.checkRemind(); }, 5 * 60000);
      } catch (err) {
        console.error('App init failed', err);
        const view = document.getElementById('view');
        if (view) {
          view.innerHTML = '<div style="padding:28px;text-align:center;color:#c45;line-height:1.8">' +
            '<div style="font-size:18px;font-weight:600;margin-bottom:8px">页面初始化失败</div>' +
            '<div style="font-size:13px;color:#888;margin-bottom:16px;word-break:break-all">' + esc((err && err.message) || String(err)) + '</div>' +
            '<button class="btn full" style="max-width:260px;margin:0 auto" onclick="try{K.Store.reset();location.reload();}catch(e){location.href=location.pathname}">重置本地数据并刷新</button>' +
            '</div>';
        }
        if (w.K && K.Toast) K.Toast('初始化失败：' + ((err && err.message) || err));
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.init());
  else App.init();
})(window);
