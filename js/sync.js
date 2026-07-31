/* Eras Life・璇 · 云端同步模块
 * 后端无关：默认 JSONBin（免服务器），也支持自定义 REST 地址 / 自建服务器。
 * 数据以整个 Store 对象为单位在「本地 localStorage」与「云端」之间同步。
 * 冲突策略：数组按 id/date 合并（日志不丢失），标量取较新一方；并提供强制上传/下载兜底。
 */
(function (w) {
  const K = w.Core;
  const App = () => w.App;

  const Sync = {
    syncing: false,
    timer: null,

    config() { return K.Store.data.settings.sync; },

    /* ---------- 配置 ---------- */
    set(o) {
      const c = this.config();
      Object.assign(c, o);
      K.Store.save();
    },

    /* ---------- 端点请求 ---------- */
    async req(method, body) {
      const c = this.config();
      let url, headers = { 'Content-Type': 'application/json' };
      if (c.mode === 'jsonbin') {
        if (!c.bin || !c.key) throw new Error('请先在设置中填写 Bin ID 与 API Key');
        url = 'https://api.jsonbin.io/v3/b/' + c.bin;
        headers['X-Master-Key'] = c.key;
      } else {
        if (!c.url) throw new Error('请填写自定义同步地址');
        url = c.url;
        if (c.headers) {
          try { Object.assign(headers, JSON.parse(c.headers)); }
          catch (e) { throw new Error('请求头 JSON 格式错误'); }
        }
      }
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch(url, { method, headers, mode: 'cors', cache: 'no-store', body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal });
        if (!res.ok) { const e = new Error('http ' + res.status); e.status = res.status; throw e; }
        return await res.json().catch(() => ({}));
      } finally { clearTimeout(t); }
    },

    unwrap(j) {
      if (j && typeof j === 'object' && j.record !== undefined) return j.record;
      return j;
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
      const btn = document.getElementById('btnSync');
      if (btn) {
        btn.className = 'icon-btn' + (state === 'syncing' ? ' spin' : (state === 'error' ? ' bad' : (state === 'offline' ? ' dim' : '')));
        btn.title = '云端同步' + (msg ? ' · ' + msg : '');
        const ic = btn.querySelector('.ic use');
        if (ic) ic.setAttribute('href', state === 'error' ? '#i-warn' : (state === 'offline' ? '#i-offline' : '#i-cloud'));
      }
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
          const rd = this.unwrap(await this.req('GET'));
          remote = rd;
          if (remote && remote.settings && remote.settings.sync) rRev = remote.settings.sync.rev || 0;
        } catch (e) {
          if (e.status === 404) remote = null;
          else throw e;
        }
        const local = K.Store.data;
        const lRev = local.settings.sync.rev || 0;
        const lBase = local.settings.sync.baseRev || 0;

        if (!remote || !remote.meta) {
          // 云端为空 → 上传本地
          local.settings.sync.baseRev = local.settings.sync.rev || 1;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已上传到云端');
        } else if (force === 'push') {
          // 强制以本地覆盖云端
          local.settings.sync.rev = Math.max(lRev, rRev) + 1;
          local.settings.sync.baseRev = local.settings.sync.rev;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已强制上传');
        } else if (force === 'pull') {
          // 强制以云端覆盖本地
          const merged = this.mergeObj(local, remote);
          merged.settings.sync.rev = rRev + 1;
          merged.settings.sync.baseRev = rRev + 1;
          K.Store.data = merged;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已强制下载');
          if (App() && App().render) App().render(true);
        } else if (rRev === lBase) {
          // 云端无新变更 → 上传本地
          local.settings.sync.rev = Math.max(lRev, rRev) + (lRev === rRev ? 1 : 0);
          local.settings.sync.baseRev = local.settings.sync.rev;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已同步到云端');
        } else if (rRev > lBase) {
          // 云端更新 → 合并后上传（双向收敛）
          const merged = this.mergeObj(local, remote);
          merged.settings.sync.rev = rRev + 1;
          merged.settings.sync.baseRev = rRev + 1;
          K.Store.data = merged;
          internalSave();
          await this.req('PUT', K.Store.data);
          this.setStatus('ok', '已与云端合并');
          if (App() && App().render) App().render(true);
        } else {
          // 本地领先 → 上传
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

      // 首次拉取
      this.once();

      // 联网/切前台时补同步
      w.addEventListener('online', () => this.once());
      document.addEventListener('visibilitychange', () => { if (!document.hidden && w.navigator.onLine) this.once(); });
      w.addEventListener('beforeunload', () => { if (w.navigator.onLine) this.once(); });
      this.setStatus('ok', '云端同步已开启');
    },

    /* ---------- 手动操作 ---------- */
    manual() {
      const c = this.config();
      if (!c.enabled) { if (App() && App().settings) App().settings(); return; }
      this.once();
    },
    test() {
      return this.req('GET').then(j => {
        const d = this.unwrap(j);
        return { ok: true, hasData: !!(d && d.meta), rev: d && d.settings ? d.settings.sync.rev : 0 };
      });
    },
    forcePush() { return this.once('push'); },
    forcePull() { return this.once('pull'); }
  };

  w.Sync = Sync;
})(window);
