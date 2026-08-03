/* Eras Life・璇 · 跨设备同步模块（GitHub 同源后端）
 * 整个 Store 对象在「本地 localStorage」与「GitHub 仓库 data/full.json」之间同步。
 * 读取：同源静态文件（无需 token、无需 CORS 预检），手机/电脑/换网络均一致。
 * 写入：GitHub Contents API（需 PAT，前端持有），每次保存自动安排上传。
 * 冲突策略：数组按 id/date 合并（日志不丢失），标量取较新一方；并提供强制上传/下载兜底。
 */
(function (w) {
  const K = w.Core;
  const App = () => w.App;
  const REPO = 'jessica66-66/eras-life-xuan';
  const FILE = 'data/full.json';

  const Sync = {
    syncing: false,
    timer: null,

    config() { return K.Store.data.settings.sync; },

    set(o) {
      const c = this.config();
      Object.assign(c, o);
      K.Store.save();
    },

    /* ---------- 端点请求 ---------- */
    ghUrl() { return 'https://api.github.com/repos/' + REPO + '/contents/' + FILE; },
    async ghApi(method, body) {
      const c = this.config();
      if (!c.token) throw new Error('请先在设置中填写 GitHub Token');
      const headers = {
        'Authorization': 'token ' + (c.token || '').trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'eras-life-xuan'
      };
      const res = await fetch(this.ghUrl(), { method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined });
      return res;
    },
    /* 读取：同源静态文件（无需 token）；写入：GitHub API（需 token） */
    async req(method, body) {
      if (method === 'GET') {
        const url = (location.origin + location.pathname.replace(/index\.html$/, '')) + FILE + '?t=' + Date.now();
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) { if (res.status === 404) return null; throw new Error('http ' + res.status); }
        return await res.json().catch(() => null);
      }
      // PUT：先取当前 sha（更新需要），再写入（剔除 token 避免泄露）
      let sha = null;
      try { const g = await this.ghApi('GET'); if (g.ok) { const j = await g.json(); sha = j.sha; } } catch (e) {}
      const data = JSON.parse(JSON.stringify(K.Store.data));
      if (data.settings && data.settings.sync) delete data.settings.sync.token;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      const payload = { message: 'sync: update full data @ ' + K.tstr(), content, branch: (this.config().branch || 'main') };
      if (sha) payload.sha = sha;
      const res = await this.ghApi('PUT', payload);
      if (!res.ok) {
        let msg = 'http ' + res.status;
        try { const j = await res.json(); if (j.message) msg = j.message; } catch (e) {}
        throw new Error(msg);
      }
      return await res.json();
    },

    /* ---------- 合并（数组按键、标量取较新） ---------- */
    keyOf(x) {
      if (x && typeof x === 'object') {
        if (x.id != null) return 'id:' + x.id;
        if (x.date != null) return 'date:' + x.date;
        if (x.at != null) return 'at:' + x.at;
      }
      return null;
    },
    mergeArr(a, b) {
      const m = new Map();
      (a || []).forEach(it => { const k = this.keyOf(it); m.set(k || ('$' + m.size), it); });
      (b || []).forEach(it => {
        const k = this.keyOf(it);
        if (k && m.has(k)) m.set(k, this.mergeObj(m.get(k), it));
        else if (k) m.set(k, it);
        else {
          const dup = [...m.values()].some(o => JSON.stringify(o) === JSON.stringify(it));
          if (!dup) m.set('$' + Math.random(), it);
        }
      });
      return [...m.values()];
    },
    mergeObj(a, b) {
      if (Array.isArray(a) || Array.isArray(b)) return this.mergeArr(a || [], b || []);
      if (a && typeof a === 'object' && b && typeof b === 'object') {
        const out = Object.assign({}, a);
        for (const k in b) out[k] = (k in a) ? this.mergeObj(a[k], b[k]) : b[k];
        return out;
      }
      return b;
    },

    /* ---------- 状态 ---------- */
    setStatus(state, msg) {
      const c = this.config();
      c.status = state;            // syncing | ok | offline | error | idle
      if (state === 'ok') c.lastSync = K.tstr();
      if (msg) c._msg = msg;
      const txt = state === 'ok' ? ('已同步' + (msg ? ' · ' + msg : '')) :
        (state === 'error' ? ('同步出错' + (msg ? ' · ' + msg : '')) :
        (state === 'offline' ? ('离线待同步' + (msg ? ' · ' + msg : '')) :
        (state === 'syncing' ? ('同步中…' + (msg ? ' ' + msg : '')) : (msg || '未开启'))));
      const stEl = document.getElementById('stSyncStatus');
      if (stEl) stEl.textContent = '状态：' + txt;
    },

    /* ---------- 单次同步 ---------- */
    async once(force) {
      const c = this.config();
      if (!c.enabled) return;
      if (this.syncing) return;
      if (!w.navigator.onLine) { this.setStatus('offline', '离线，待联网后同步'); return; }
      this.syncing = true;
      this.setStatus('syncing', '同步中…');
      const self = this;
      const internalSave = () => { self._internal = true; try { K.Store.save(); } finally { self._internal = false; } };
      try {
        let remote = null, rRev = 0;
        try {
          const rd = await this.req('GET');
          remote = rd;
          if (remote && remote.settings && remote.settings.sync) rRev = remote.settings.sync.rev || 0;
        } catch (e) {
          if (e.message && e.message.indexOf('404') >= 0) remote = null;
          else throw e;
        }
        const local = K.Store.data;
        const lRev = local.settings.sync.rev || 0;
        const lBase = local.settings.sync.baseRev || 0;

        if (!remote || !remote.meta) {
          local.settings.sync.baseRev = local.settings.sync.rev || 1;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已上传到云端');
        } else if (force === 'push') {
          local.settings.sync.rev = Math.max(lRev, rRev) + 1;
          local.settings.sync.baseRev = local.settings.sync.rev;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已强制上传');
        } else if (force === 'pull') {
          const merged = this.mergeObj(local, remote);
          merged.settings.sync.rev = rRev + 1;
          merged.settings.sync.baseRev = rRev + 1;
          K.Store.data = merged;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已强制下载');
          if (App() && App().render) App().render(true);
        } else if (rRev === lBase) {
          local.settings.sync.rev = Math.max(lRev, rRev) + (lRev === rRev ? 1 : 0);
          local.settings.sync.baseRev = local.settings.sync.rev;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已同步到云端');
        } else if (rRev > lBase) {
          const merged = this.mergeObj(local, remote);
          merged.settings.sync.rev = rRev + 1;
          merged.settings.sync.baseRev = rRev + 1;
          K.Store.data = merged;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已与云端合并');
          if (App() && App().render) App().render(true);
        } else {
          local.settings.sync.baseRev = lRev || 1;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已同步到云端');
        }
      } catch (e) {
        this.setStatus('error', (e && e.message) || '同步失败');
        K.Toast('同步失败：' + ((e && e.message) || e));
      } finally {
        this.syncing = false;
      }
    },

    schedulePush() {
      const c = this.config();
      if (!c.enabled || this.syncing) return;
      if (!w.navigator.onLine) { this.setStatus('offline', '离线，待联网后同步'); return; }
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.once(), 3000);
    },

    /* ---------- 初始化 ---------- */
    init() {
      const c = this.config();
      // 包装 Store.save：每次保存即记录一次本地变更并安排上传
      const self = this;
      const orig = K.Store.save.bind(K.Store);
      K.Store.save = function () {
        const r = orig.apply(K.Store, arguments);
        if (c.enabled && !self._internal) {
          K.Store.data.settings.sync.rev = (K.Store.data.settings.sync.rev || 0) + 1;
          try { localStorage.setItem('erasLifeXuan_v1', JSON.stringify(K.Store.data)); } catch (e) {}
          self.schedulePush();
        }
        return r;
      };
      if (!c.enabled) { this.setStatus(c.status || 'idle', '未开启'); return; }
      this.once();
      w.addEventListener('online', () => this.once());
      document.addEventListener('visibilitychange', () => { if (!document.hidden && w.navigator.onLine) this.once(); });
      w.addEventListener('beforeunload', () => { if (w.navigator.onLine) this.once(); });
      this.setStatus('ok', '跨设备同步已开启');
    },

    /* ---------- 手动操作 ---------- */
    manual() {
      const c = this.config();
      if (!c.enabled) { if (App() && App().settings) App().settings(); return; }
      this.once();
    },
    test() {
      return this.ghApi('GET').then(r => ({ ok: r.ok, status: r.status }));
    },
    forcePush() { return this.once('push'); },
    forcePull() { return this.once('pull'); }
  };

  w.Sync = Sync;
})(window);
