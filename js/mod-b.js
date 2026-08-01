/* =========================================================
   mod-b.js — 模块 5~8：存款 / 早睡 / 心情 / 每月复盘 + 自定义模块
   ========================================================= */
(function (w) {
  'use strict';
  const K = w.Core, D = w.D, UI = w.UI, $ = K.$, $$ = K.$$, esc = K.esc, ico = K.ico;
  const Pages = w.Pages = w.Pages || {};

  /* =======================================================
     模块 5 · 存款
     ======================================================= */
  Pages.savings = {
    tab: 'record',
    render() {
      const S = K.Store.data, V = S.savings, today = K.dstr(), ms = K.mstr();
      const annual = K.num(V.goal.annual), emg = K.num(V.goal.emergency);
      const mGoal = annual > 0 ? Math.round(annual / 12) : 0;
      const dGoal = mGoal > 0 ? Math.round(mGoal / K.daysInMonth(ms)) : 0;
      const savedAll = D.savedTotal();
      const savedMonth = D.savedTotal(r => r.date.slice(0, 7) === ms);
      const rest = Math.max(0, annual - savedAll);
      const p = annual > 0 ? K.pct(savedAll, annual) : 0;
      const mp = mGoal > 0 ? K.pct(savedMonth, mGoal) : 0;
      const inc = V.records.filter(r => r.kind === 'in' && r.date.slice(0, 7) === ms).reduce((s, r) => s + K.num(r.amount), 0);
      const exp = V.records.filter(r => r.kind === 'out' && r.date.slice(0, 7) === ms).reduce((s, r) => s + K.num(r.amount), 0);
      let h = '';

      h += UI.card({
        icon: 'i-gem', title: '存钱目标', cls: 'tex-knit',
        extra: '<button class="btn xs ghost" id="svGoal">设置</button>',
        body: annual > 0 ?
          '<div style="display:flex;gap:14px;align-items:center">' +
          K.Chart.ring({ value: p, label: p + '%', sub: '年度进度', size: 112, color: '#FFC96B', color2: '#FF9CC9' }) +
          '<div style="flex:1;min-width:0">' +
          '<div class="prow"><span>年度目标</span><b>' + K.money(annual) + '</b></div>' +
          '<div class="prow"><span>累计已存</span><b style="color:#3FB68B">' + K.money(savedAll) + '</b></div>' +
          '<div class="prow"><span>剩余差额</span><b style="color:#D2536F">' + K.money(rest) + '</b></div>' +
          '<div class="prow"><span>应急储备金</span><b>' + K.money(emg) + '</b></div>' +
          '</div></div>' +
          '<div class="grid g3" style="margin-top:10px">' +
          UI.stat(K.money(mGoal), '月度目标', 'sm') + UI.stat(K.money(dGoal), '每日最低存入', 'sm') + UI.stat(mp + '%', '本月完成', 'sm') +
          '</div>' +
          '<div style="margin-top:10px"><div class="prow"><span>本月已存 ' + K.money(savedMonth) + '</span><b>' + (mp >= 100 ? '✅ 已达标' : '还差 ' + K.money(Math.max(0, mGoal - savedMonth))) + '</b></div>' + UI.bar(mp, mp >= 100 ? 'ok' : '') + '</div>'
          : '<div class="hint">还没有设置存钱目标。点击右上角「设置」，填写年度总存钱目标与月度生活费，系统会自动拆分月度目标与每日最低存入金额。</div>' +
          '<button class="btn primary full" style="margin-top:10px" id="svGoal2">立即设置目标</button>'
      });

      h += UI.card({
        icon: 'i-sparkle', title: '专项基金',
        body: D.FUNDS.map(f => {
          const v = D.savedTotal(r => (r.fund || 'common') === f.id);
          const mx = Math.max(1, D.FUNDS.reduce((m, x) => Math.max(m, D.savedTotal(r => (r.fund || 'common') === x.id)), 1));
          return '<div style="margin-bottom:9px"><div class="prow"><span>' + ico(f.icon, 'sm') + ' ' + esc(f.name) + '</span><b>' + K.money(v) + '</b></div>' +
            '<div class="pbar thin"><i style="width:' + K.pct(v, mx) + '%;background:' + f.c + '"></i></div></div>';
        }).join('') + '<div class="hint">分项独立统计，存入时选择对应基金即可自动归类。</div>'
      });

      h += '<div class="fab-row">' +
        '<button class="btn primary" style="flex:1" id="svSave">' + ico('i-plus', 'sm') + ' 存入</button>' +
        '<button class="btn soft" style="flex:1" id="svIn">记录收入</button>' +
        '<button class="btn soft" style="flex:1" id="svOut">记录支出</button></div>';

      h += UI.card({
        icon: 'i-chart', title: '本月收支', extra: esc(ms),
        body: '<div class="grid g3">' + UI.stat(K.money(inc), '收入', 'sm') + UI.stat(K.money(exp), '支出', 'sm') + UI.stat(K.money(inc - exp), '结余', 'sm') + '</div>' +
          this.expChart(ms) +
          '<button class="btn sm soft full" style="margin-top:10px" data-go="review">' + ico('i-chart', 'sm') + ' 进入月度财务复盘</button>'
      });

      const imp = V.records.filter(r => r.kind === 'out' && r.cat === '冲动消费').slice().reverse().slice(0, 8);
      h += UI.card({
        icon: 'i-heart', title: '冲动消费记录', extra: imp.length + ' 笔',
        body: imp.length ? imp.map(r =>
          '<div class="li"><div class="li-main"><div class="li-t">' + K.money(r.amount) + ' · ' + esc(r.note || '未填写') + '</div>' +
          '<div class="li-s">' + UI.tag(r.date, 'grey') + UI.tag('理由：' + esc(r.reason || '—'), 'warn') + '</div></div></div>').join('') +
          '<div class="hint" style="margin-top:8px">每一笔冲动消费都必须写下理由——看见它，就更容易克制它 ✦</div>'
          : UI.empty('本月还没有冲动消费，你很棒 ✦', 'i-heart')
      });

      const recent = V.records.slice().reverse().slice(0, 20);
      h += UI.card({
        icon: 'i-news', title: '最近流水', cls: 'tex-news',
        body: recent.length ? recent.map(r =>
          '<div class="li"><div class="li-main"><div class="li-t">' +
          (r.kind === 'save' ? '存入' : r.kind === 'in' ? '收入' : '支出') + ' ' + K.money(r.amount) + '</div>' +
          '<div class="li-s">' + UI.tag(r.date, 'grey') + UI.tag(esc(r.cat || (r.fund ? (D.FUNDS.find(f => f.id === r.fund) || {}).name : '')), r.kind === 'out' ? 'bad' : r.kind === 'in' ? 'mint' : 'lilac') +
          (r.note ? '<span style="color:var(--ink-3)">' + esc(r.note.slice(0, 16)) + '</span>' : '') + '</div></div>' +
          '<div class="li-act"><button class="mini-btn del" data-dr="' + r.id + '">' + ico('i-close') + '</button></div></div>').join('')
          : UI.empty('还没有记账记录')
      });
      return h;
    },
    expChart(ms) {
      const V = K.Store.data.savings;
      const cols = ['#FF9CC9', '#B197F0', '#7FC0F5', '#6FCFB0', '#F0BE63', '#F08C9C'];
      const items = D.EXP_CATS.map((c, i) => ({
        n: c, v: V.records.filter(r => r.kind === 'out' && r.cat === c && r.date.slice(0, 7) === ms).reduce((s, r) => s + K.num(r.amount), 0), c: cols[i]
      }));
      const tot = items.reduce((s, i) => s + i.v, 0);
      if (!tot) return '<div class="hint" style="margin-top:8px">本月还没有支出记录。</div>';
      return '<div style="display:flex;gap:12px;align-items:center;margin-top:10px">' +
        K.Chart.donut(items, { center: K.money(tot), sub: '本月支出', size: 124 }) +
        '<div style="flex:1;min-width:0">' + items.filter(i => i.v > 0).map(i =>
          '<div class="prow"><span><i style="display:inline-block;width:8px;height:8px;border-radius:3px;background:' + i.c + ';margin-right:5px"></i>' + esc(i.n) + '</span><b>' + K.money(i.v) + '</b></div>').join('') +
        '</div></div>';
    },
    mount(root, App) {
      const S = K.Store.data;
      ['#svGoal', '#svGoal2'].forEach(s => { const b = $(s, root); if (b) b.addEventListener('click', () => this.goal(App)); });
      const a = $('#svSave', root); if (a) a.addEventListener('click', () => this.rec(App, 'save'));
      const b1 = $('#svIn', root); if (b1) b1.addEventListener('click', () => this.rec(App, 'in'));
      const b2 = $('#svOut', root); if (b2) b2.addEventListener('click', () => this.rec(App, 'out'));
      $$('[data-go]', root).forEach(x => x.addEventListener('click', () => App.go(x.dataset.go)));
      $$('[data-dr]', root).forEach(x => x.addEventListener('click', () => {
        S.savings.records = S.savings.records.filter(r => r.id !== x.dataset.dr); K.Store.save(); App.render();
      }));
    },
    goal(App) {
      const V = K.Store.data.savings;
      K.Sheet.form({
        title: '存钱目标设置',
        fields: [
          { k: 'annual', label: '年度总存钱目标（元）', type: 'number', value: V.goal.annual || '', required: true, placeholder: '如 36000' },
          { k: 'living', label: '每月生活费（元）', type: 'number', value: V.goal.monthlyLiving || '', placeholder: '用于自动计算 3 个月应急储备金' },
          { k: 'emg', label: '应急储备金目标（元，可手动覆盖）', type: 'number', value: V.goal.emergency || '', placeholder: '留空则自动 = 生活费 × 3' },
          { k: 'note', type: 'note', label: '保存后系统会自动拆分：<b>月度存钱目标 = 年度目标 ÷ 12</b>，<b>每日最低存入 = 月度目标 ÷ 当月天数</b>。' }
        ],
        onSubmit: v => {
          V.goal.annual = K.num(v.annual);
          V.goal.monthlyLiving = K.num(v.living);
          V.goal.emergency = v.emg !== '' ? K.num(v.emg) : K.num(v.living) * 3;
          K.Store.save(); K.Toast('目标已保存，已自动拆分月度与每日计划 ✦'); App.render();
        }
      });
    },
    rec(App, kind) {
      const V = K.Store.data.savings;
      const title = kind === 'save' ? '存入记录' : kind === 'in' ? '当日收入' : '当日支出';
      const fields = [
        { k: 'date', label: '日期', type: 'date', value: K.dstr(), required: true },
        { k: 'amount', label: '金额（元）', type: 'number', required: true, placeholder: '0.00' }
      ];
      if (kind === 'in') fields.push({ k: 'cat', label: '收入分类', type: 'opts', value: '薪资', options: D.INC_CATS.map(c => ({ v: c, t: c })) });
      if (kind === 'out') fields.push({
        k: 'cat', label: '支出分类', type: 'opts', value: '餐饮', options: D.EXP_CATS.map(c => ({ v: c, t: c })),
        onChange: (v, root) => {
          const fd = $('[data-fk="reason"]', root);
          if (fd) fd.style.display = v === '冲动消费' ? '' : 'none';
        }
      });
      if (kind === 'save') fields.push({ k: 'fund', label: '归入基金', type: 'opts', value: 'common', options: D.FUNDS.map(f => ({ v: f.id, t: f.name })) });
      fields.push({ k: 'note', label: '备注', placeholder: kind === 'out' ? '买了什么…' : '来源 / 说明' });
      if (kind === 'out') fields.push({
        k: 'reason', label: '冲动消费理由（必填）', type: 'textarea',
        placeholder: '为什么一定要买它？三天后你还会需要吗？',
        validate: (v, all) => '', hint: '仅「冲动消费」分类需要填写，用于日后复盘、克制非理性消费。'
      });

      K.Sheet.form({
        title: title, fields: fields, submitText: '保存',
        onSubmit: (v, api) => {
          if (kind === 'out' && v.cat === '冲动消费' && !v.reason) { K.Toast('冲动消费必须填写购买理由'); return false; }
          V.records.push({ id: K.uid(), kind: kind, date: v.date, amount: K.num(v.amount), cat: v.cat || '', fund: v.fund || '', note: v.note || '', reason: v.reason || '' });
          const ms = v.date.slice(0, 7);
          const mGoal = V.goal.annual > 0 ? V.goal.annual / 12 : 0;
          if (mGoal > 0) V.monthMark[ms] = D.savedTotal(r => r.date.slice(0, 7) === ms) >= mGoal ? 'ok' : 'no';
          K.Store.save();
          if (kind === 'save') K.Toast('已存入 ' + K.money(v.amount) + '，你又闪耀了一点 ✦');
          else if (v.cat === '冲动消费') K.Toast('已记录，明天回头看看这个理由是否成立 🤍');
          else K.Toast('记录成功');
          App.render();
        },
        onMount: null
      });
      // 初始隐藏冲动消费理由
      setTimeout(() => {
        const sh = document.querySelectorAll('.sheet');
        const cur = sh[sh.length - 1]; if (!cur) return;
        const fd = cur.querySelector('[data-fk="reason"]');
        if (fd && kind === 'out') fd.style.display = 'none';
      }, 30);
    }
  };

  /* =======================================================
     模块 6 · 早睡
     ======================================================= */
  Pages.sleep = {
    render() {
      const S = K.Store.data, SL = S.sleep, today = K.dstr(), ms = K.mstr();
      const t = SL.logs.find(l => l.date === today);
      const streak = D.sleepStreak();
      const days7 = K.lastNDays(7);
      const map = {}; SL.logs.forEach(l => map[l.date] = l);
      const mlogs = SL.logs.filter(l => l.date.slice(0, 7) === ms);
      const good = mlogs.filter(l => l.state === 'good').length;
      const pen = SL.penalties[today];
      let h = '';

      h += UI.card({
        icon: 'i-moon', title: '硬性睡眠标准', cls: 'tex-knit',
        extra: '<button class="btn xs ghost" id="slStd">自定义</button>',
        body: '<div class="grid g4">' +
          UI.stat(SL.std.focus, '手机专注', 'sm') + UI.stat(SL.std.bed, '上床时间', 'sm') +
          UI.stat(SL.std.wake, '起床时间', 'sm') + UI.stat(SL.std.redline, '熬夜红线', 'sm') + '</div>' +
          '<div class="hint" style="margin-top:8px">' + SL.std.bed + ' 前上床 · ' + SL.std.focus + ' 手机进入专注模式 · ' + SL.std.wake + ' 起床；' + SL.std.redline + ' 后入睡判定为熬夜红线。</div>'
      });

      h += UI.card({
        icon: 'i-sparkle', title: '今日打卡', extra: t ? this.stateTag(t.state) : '待打卡',
        body: (t ?
          '<div class="grid g4">' + UI.stat(t.bed, '上床', 'sm') + UI.stat(t.asleep || '—', '睡着', 'sm') +
          UI.stat((t.dur / 60).toFixed(1) + 'h', '时长', 'sm') + UI.stat(t.score + '分', '睡眠评分', 'sm') + '</div>' +
          '<div class="hint" style="margin-top:8px">起床 ' + t.wake + ' · 熬夜原因：' + esc(t.reason) + '</div>'
          : '<div class="hint">今天还没有打卡。记录一次，就多一天看得见的坚持 ✦</div>') +
          '<button class="btn primary full" style="margin-top:10px" id="slLog">' + (t ? '修改今日打卡' : '立即打卡') + '</button>'
      });

      h += UI.card({
        icon: 'i-fire', title: '连续早睡', extra: '连续 ' + streak + ' 天',
        body: '<div style="margin-bottom:8px"><div class="prow"><span>距离解锁奖励</span><b>' + Math.min(streak, 7) + '/7 天</b></div>' + UI.bar(K.pct(Math.min(streak, 7), 7), streak >= 7 ? 'ok' : '') + '</div>' +
          '<div class="reward ' + (SL.rewards.mvUnlocked ? 'on' : 'locked') + '">' +
          '<div class="reward-t">' + ico('i-vinyl', 'sm') + ' ' + (SL.rewards.mvUnlocked ? '已解锁：泰勒高清 MV 合集观看权益' : '未解锁：连续 7 天早睡可解锁 MV 合集') + '</div>' +
          (SL.rewards.mvUnlocked ? '<div style="margin-top:8px">' + D.MV_LIST.map(m =>
            '<div class="li" style="padding:7px 9px"><div class="li-main"><div class="li-t">' + esc(m.t) + '</div><div class="li-s">' + esc(m.d) + '</div></div>' +
            '<div class="li-act"><a class="btn xs soft" target="_blank" rel="noopener" href="https://search.bilibili.com/all?keyword=' + encodeURIComponent('Taylor Swift ' + m.t + ' MV') + '">观看</a></div></div>').join('') +
            '<div class="hint" style="margin-top:6px">解锁时间：' + esc(SL.rewards.lastUnlock || '—') + '，好好享受这份奖励 🎬</div>'
            : '<div class="hint" style="margin-top:6px">还差 ' + Math.max(0, 7 - streak) + ' 天，坚持住 ✦</div>') +
          '</div>' +
          (pen ? '<div class="reward" style="margin-top:10px;border-color:#F5B8C6;background:rgba(255,240,243,.7)">' +
            '<div class="reward-t" style="color:#D2536F">' + ico('i-bell', 'sm') + ' 今日惩罚生效（来源：' + esc(pen.from) + ' 无故熬夜）</div>' +
            '<div class="hint" style="margin-top:6px">❌ 当日禁止刷短视频<br>❌ 已自动增加 30 分钟单词背诵任务到「待办 · 学习任务」</div></div>' : '')
      });

      h += UI.card({
        icon: 'i-chart', title: '近 7 日睡眠',
        body: '<div class="chart-box">' + K.Chart.bar({
          labels: days7.map(K.mdShort), data: days7.map(d => map[d] ? +(map[d].dur / 60).toFixed(1) : 0),
          colors: days7.map(d => map[d] ? (map[d].state === 'good' ? '#8FE3C4' : map[d].state === 'late' ? '#F5A8C4' : '#C6B6EE') : '#EAE3F2'),
          height: 140, target: 8, fmt: v => v.toFixed(0) + 'h'
        }) + '</div>' +
          '<div class="legend"><span><i style="background:#8FE3C4"></i>达标</span><span><i style="background:#C6B6EE"></i>一般</span><span><i style="background:#F5A8C4"></i>熬夜</span><span><i style="background:#F5A8C4"></i>参考线 8h</span></div>' +
          '<div class="chart-box" style="margin-top:8px">' + K.Chart.line({
            labels: days7.map(K.mdShort), series: [{ data: days7.map(d => map[d] ? map[d].score : null), color: '#B197F0' }], height: 130, max: 10
          }) + '</div><div class="legend"><span><i style="background:#B197F0"></i>睡眠评分（1-10）</span></div>' +
          '<div class="grid g3" style="margin-top:10px">' +
          UI.stat(good + '/' + mlogs.length, '本月达标', 'sm') +
          UI.stat(K.pct(good, mlogs.length || 1) + '%', '达标率', 'sm') +
          UI.stat(mlogs.length ? (mlogs.reduce((s, l) => s + l.dur, 0) / mlogs.length / 60).toFixed(1) + 'h' : '—', '平均时长', 'sm') + '</div>'
      });

      const recent = SL.logs.slice().sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 12);
      h += UI.card({
        icon: 'i-news', title: '打卡记录', cls: 'tex-news',
        body: recent.length ? recent.map(l =>
          '<div class="li"><div class="li-main"><div class="li-t">' + l.date + ' · ' + l.bed + ' 上床 / ' + l.wake + ' 起床</div>' +
          '<div class="li-s">' + this.stateTag(l.state) + UI.tag((l.dur / 60).toFixed(1) + 'h', 'sky') + UI.tag(l.score + '分', 'lilac') + UI.tag(esc(l.reason), 'grey') + '</div></div>' +
          '<div class="li-act"><button class="mini-btn del" data-ds="' + l.date + '">' + ico('i-close') + '</button></div></div>').join('')
          : UI.empty('还没有睡眠记录', 'i-moon')
      });
      return h;
    },
    stateTag(s) { return s === 'good' ? UI.tag('早睡达标 ✓', 'mint') : s === 'late' ? UI.tag('熬夜红线', 'bad') : UI.tag('一般', 'warn'); },
    mount(root, App) {
      const S = K.Store.data;
      const a = $('#slLog', root); if (a) a.addEventListener('click', () => this.log(App));
      const b = $('#slStd', root); if (b) b.addEventListener('click', () => this.std(App));
      $$('[data-ds]', root).forEach(x => x.addEventListener('click', () => {
        S.sleep.logs = S.sleep.logs.filter(l => l.date !== x.dataset.ds); K.Store.save(); App.render();
      }));
    },
    std(App) {
      const SL = K.Store.data.sleep;
      K.Sheet.form({
        title: '自定义睡眠标准',
        fields: [
          { k: 'focus', label: '手机进入专注模式', type: 'time', value: SL.std.focus },
          { k: 'bed', label: '上床时间', type: 'time', value: SL.std.bed },
          { k: 'wake', label: '起床时间', type: 'time', value: SL.std.wake },
          { k: 'redline', label: '熬夜红线（入睡时间晚于此判定熬夜）', type: 'time', value: SL.std.redline }
        ],
        onSubmit: v => { Object.assign(SL.std, v); K.Store.save(); K.Toast('标准已更新'); App.render(); }
      });
    },
    log(App) {
      const S = K.Store.data, SL = S.sleep, today = K.dstr();
      const ex = SL.logs.find(l => l.date === today) || {};
      K.Sheet.form({
        title: '睡眠打卡',
        fields: [
          { k: 'date', label: '日期', type: 'date', value: ex.date || today, required: true },
          { k: 'bed', label: '上床时间', type: 'time', value: ex.bed || SL.std.bed, required: true },
          { k: 'asleep', label: '实际睡着时间', type: 'time', value: ex.asleep || '' },
          { k: 'wake', label: '起床时间', type: 'time', value: ex.wake || SL.std.wake, required: true },
          { k: 'reason', label: '熬夜原因', type: 'opts', value: ex.reason || '无', options: [{ v: '无', t: '无' }, { v: '刷手机', t: '刷手机' }, { v: '工作焦虑', t: '工作焦虑' }] },
          { k: 'score', label: '当日睡眠评分', type: 'range', min: 1, max: 10, value: ex.score || 7, unit: ' 分' },
          { k: 'note', label: '备注', value: ex.note || '' }
        ],
        submitText: '保存打卡',
        onSubmit: v => {
          const dur = K.sleepMinutes(v.asleep || v.bed, v.wake);
          const bedM = K.hm2min(v.bed), stdBed = K.hm2min(SL.std.bed), red = K.hm2min(SL.std.redline);
          const asleepM = K.hm2min(v.asleep || v.bed);
          const norm = m => (m < 240 ? m + 1440 : m); // 凌晨归一
          let state = 'mid';
          if (norm(asleepM) >= norm(red)) state = 'late';
          else if (norm(bedM) <= norm(stdBed)) state = 'good';
          const rec = { date: v.date, bed: v.bed, asleep: v.asleep, wake: v.wake, dur: dur, reason: v.reason, score: K.num(v.score), note: v.note, state: state };
          const i = SL.logs.findIndex(l => l.date === v.date);
          if (i >= 0) SL.logs[i] = rec; else SL.logs.push(rec);
          // 奖惩判定
          if (state === 'late' && v.reason !== '无') {
            const nd = K.addDays(v.date, 1);
            SL.penalties[nd] = { noShortVideo: true, extraWords: 30, from: v.date };
            K.Toast('❌ 判定为无故熬夜：明日禁止刷短视频，并自动增加 30 分钟单词任务');
          } else if (state === 'good') {
            K.Toast('✅ 早睡达标，连击继续 ✦');
          }
          K.Store.save();
          if (D.sleepStreak() >= 7 && !SL.rewards.mvUnlocked) {
            SL.rewards.mvUnlocked = true; SL.rewards.lastUnlock = K.dstr(); K.Store.save();
            K.Toast('🎉 连续 7 天早睡，泰勒高清 MV 合集已解锁！', 3500);
          }
          D.runDailyJobs();
          App.render();
        }
      });
    }
  };

  /* =======================================================
     模块 7 · 心情
     ======================================================= */
  Pages.mood = {
    tab: 'today', month: null,
    render() {
      const S = K.Store.data, today = K.dstr();
      const t = S.mood.logs.find(l => l.date === today);
      const ms = this.month = this.month || K.mstr();
      let h = '';

      h += UI.card({
        icon: 'i-vinyl', title: '此刻心情', extra: t ? '今日已记录' : '选择一个表情',
        body: '<div class="emo-grid" id="emoGrid">' + D.MOODS.map(m =>
          '<button class="emo' + (t && t.mood === m.v ? ' on' : '') + '" data-m="' + m.v + '"><div class="emo-e">' + m.e + '</div><div class="emo-n">' + esc(m.n) + '</div></button>').join('') + '</div>' +
          '<div class="hint" style="margin-top:8px">点击表情即可快速记录，随后可补充评分与当日事件。</div>'
      });

      if (t) {
        const m = D.MOODS.find(x => x.v === t.mood) || D.MOODS[0];
        h += UI.card({
          icon: 'i-heart', title: '今日记录', extra: esc(today),
          body: '<div class="grid g2">' + UI.stat(m.e + ' ' + m.n, '心情状态', 'sm') + UI.stat(t.score + ' / 10', '心情评分', 'sm') + '</div>' +
            (t.good ? '<div class="li" style="margin-top:10px"><div class="li-main"><div class="li-s">' + UI.tag('好事 ✦', 'mint') + '</div><div class="li-t" style="font-weight:500;margin-top:4px">' + esc(t.good) + '</div></div></div>' : '') +
            (t.bad ? '<div class="li"><div class="li-main"><div class="li-s">' + UI.tag('糟心事', 'bad') + '</div><div class="li-t" style="font-weight:500;margin-top:4px">' + esc(t.bad) + '</div></div></div>' : '') +
            '<button class="btn sm soft full" style="margin-top:8px" id="mdEdit">补充 / 修改今日记录</button>'
        });
      }

      // 治愈金句（扩充素材库 + 随机降重）
      if (!(S.mood.healing && S.mood.healing.t)) S.mood.healing = this.healPick(S);
      const hq = S.mood.healing;
      h += UI.card({
        icon: 'i-sparkle', title: '今日治愈金句',
        extra: '<button class="btn xs ghost" id="qRe">换一句</button>',
        body: '<div class="quote">' + esc(hq.t) + '<div class="qm">—— ' + esc(hq.a) + (hq.cat ? ' · ' + esc(hq.cat) : '') + '</div></div>' +
          '<div class="btn-row"><button class="btn soft" id="qFav">' + ico('i-heart', 'sm') + ' 收藏这句</button></div>'
      });
      const flow = this.healFlow(S);
      const myHeal = S.mood.heal || [];
      const baseN = (D.HEALING || []).length;
      h += UI.card({
        icon: 'i-book', title: '治愈金句库 · 随便翻翻',
        extra: '<button class="btn xs ghost" id="qFlow">换一批</button>',
        body: flow.map(q => '<div class="quote sm">' + esc(q.t) + '<div class="qm">—— ' + esc(q.a || '佚名') + ' · ' + esc(q.cat) + (q.mine ? ' · 我的' : '') + '</div></div>').join('') +
          '<div class="hint" style="margin-top:6px">内置 ' + baseN + ' 句 + 我的 ' + myHeal.length + ' 句 = 共 ' + (baseN + myHeal.length) + ' 句，随机推送、减少重复。想加更多？点下面的「添加我的金句」。</div>' +
          (myHeal.length ? '<div class="sub-h" style="margin-top:12px">我的金句 · ' + myHeal.length + ' 句</div>' + myHeal.map(q =>
            '<div class="li" style="display:block"><div class="quote sm" style="background:rgba(255,255,255,.6)">' + esc(q.t) + '<div class="qm">—— ' + esc(q.a || '我') + ' · ' + esc(q.cat) + '</div></div>' +
            '<div style="text-align:right;margin-top:6px"><button class="btn xs ghost" data-delh="' + esc(q.id) + '">删除</button></div></div>').join('') : '') +
          '<button class="btn sm soft full" id="qAdd" style="margin-top:10px">＋ 添加我的金句</button>'
      });

      h += '<div class="seg" id="mdTab">' +
        ['today|金句收藏夹', 'board|月度心情看板'].map(x => { const p = x.split('|'); return '<button data-t="' + p[0] + '"' + (this.tab === p[0] ? ' class="on"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div>';

      if (this.tab === 'today') {
        h += UI.card({
          icon: 'i-heart', title: '金句收藏夹', extra: S.mood.favs.length + ' 句',
          body: S.mood.favs.length ? S.mood.favs.slice().reverse().map((q, i) =>
            '<div class="li" style="display:block"><div class="quote" style="background:rgba(255,255,255,.6)">' + esc(q.t) + '<div class="qm">—— ' + esc(q.a) + ' · ' + esc(q.at) + '</div></div>' +
            '<div style="text-align:right;margin-top:6px"><button class="btn xs ghost" data-df="' + esc(q.id) + '">移除</button></div></div>').join('')
            : UI.empty('还没有收藏，遇到喜欢的句子就存下来吧', 'i-heart')
        });
      } else {
        const days = K.monthDays(ms), map = {};
        S.mood.logs.forEach(l => map[l.date] = l);
        const scores = days.map(d => map[d] ? map[d].score : null);
        const rec = days.filter(d => map[d]);
        const avg = rec.length ? (rec.reduce((s, d) => s + map[d].score, 0) / rec.length).toFixed(1) : '—';
        const dist = D.MOODS.map(m => ({ n: m.n, e: m.e, v: days.filter(d => map[d] && map[d].mood === m.v).length, c: m.c }));
        const firstWd = K.weekdayOf(days[0]);
        h += UI.card({
          icon: 'i-chart', title: '月度心情看板',
          extra: '<button class="btn xs ghost" id="mPrev">‹</button> ' + esc(ms) + ' <button class="btn xs ghost" id="mNext">›</button>',
          body: '<div class="grid g3">' + UI.stat(rec.length, '记录天数', 'sm') + UI.stat(avg, '平均分', 'sm') +
            UI.stat(dist.slice().sort((a, b) => b.v - a.v)[0].v ? dist.slice().sort((a, b) => b.v - a.v)[0].e : '—', '高频心情', 'sm') + '</div>' +
            '<div class="chart-box" style="margin-top:10px">' + K.Chart.line({ labels: days.map(K.mdShort), series: [{ data: scores, color: '#FF9CC9' }], height: 140, max: 10 }) + '</div>' +
            '<div class="legend"><span><i style="background:#FF9CC9"></i>每日心情评分 · 情绪波动规律</span></div>' +
            '<div style="margin-top:12px"><div class="heat" style="margin-bottom:5px">' + ['一', '二', '三', '四', '五', '六', '日'].map(x => '<div class="heat-h">' + x + '</div>').join('') + '</div>' +
            '<div class="heat">' + (() => {
              const off = firstWd === 0 ? 6 : firstWd - 1;
              let s = '';
              for (let i = 0; i < off; i++) s += '<div></div>';
              days.forEach(d => {
                const l = map[d], m = l ? D.MOODS.find(x => x.v === l.mood) : null;
                s += '<div class="heat-c' + (l ? ' has' : '') + '"' + (m ? ' style="background:' + m.c + '"' : '') + ' title="' + d + '">' + (l ? m.e : (+d.slice(-2))) + '</div>';
              });
              return s;
            })() + '</div></div>' +
            '<div style="margin-top:12px">' + dist.filter(d => d.v).map(d =>
              '<div class="prow"><span>' + d.e + ' ' + esc(d.n) + '</span><b>' + d.v + ' 天</b></div><div class="pbar thin" style="margin-bottom:7px"><i style="width:' + K.pct(d.v, rec.length || 1) + '%;background:' + d.c + '"></i></div>').join('') + '</div>'
        });
      }
      return h;
    },
    mount(root, App) {
      const S = K.Store.data, today = K.dstr();
      $$('#emoGrid [data-m]', root).forEach(b => b.addEventListener('click', () => {
        let t = S.mood.logs.find(l => l.date === today);
        if (!t) { t = { date: today, mood: b.dataset.m, score: (D.MOODS.find(x => x.v === b.dataset.m) || {}).s || 6, good: '', bad: '' }; S.mood.logs.push(t); }
        else t.mood = b.dataset.m;
        t.quote = K.pick(D.QUOTES[t.mood] || D.QUOTES.calm);
        K.Store.save(); K.Toast('心情已记录 ✦'); App.render();
      }));
      const e = $('#mdEdit', root); if (e) e.addEventListener('click', () => this.edit(App));
      const qr = $('#qRe', root); if (qr) qr.addEventListener('click', () => {
        S.mood.healing = this.healPick(S); K.Store.save(); App.render();
      });
      const qf = $('#qFav', root); if (qf) qf.addEventListener('click', () => {
        const hq = S.mood.healing; if (!hq) return;
        if (S.mood.favs.some(f => f.t === hq.t)) { K.Toast('已经在收藏夹里啦'); return; }
        S.mood.favs.push({ id: K.uid(), t: hq.t, a: hq.a, at: today }); K.Store.save(); K.Toast('已收藏 🤍'); App.render();
      });
      const qfl = $('#qFlow', root); if (qfl) qfl.addEventListener('click', () => App.render());
      const qa = $('#qAdd', root); if (qa) qa.addEventListener('click', () => this.addHeal(App));
      $$('[data-delh]', root).forEach(b => b.addEventListener('click', () => {
        S.mood.heal = (S.mood.heal || []).filter(q => q.id !== b.dataset.delh); K.Store.save(); K.Toast('已删除'); App.render();
      }));
      $$('[data-df]', root).forEach(b => b.addEventListener('click', () => {
        S.mood.favs = S.mood.favs.filter(f => f.id !== b.dataset.df); K.Store.save(); App.render();
      }));
      $$('#mdTab [data-t]', root).forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.t; App.render(); }));
      const p = $('#mPrev', root); if (p) p.addEventListener('click', () => { this.month = K.addMonth(this.month, -1); App.render(); });
      const n = $('#mNext', root); if (n) n.addEventListener('click', () => { this.month = K.addMonth(this.month, 1); App.render(); });
    },
    edit(App) {
      const S = K.Store.data, today = K.dstr();
      const t = S.mood.logs.find(l => l.date === today) || { mood: 'calm', score: 6 };
      K.Sheet.form({
        title: '今日心情记录',
        fields: [
          { k: 'mood', label: '心情状态', type: 'opts', value: t.mood, options: D.MOODS.map(m => ({ v: m.v, t: m.e + ' ' + m.n })) },
          { k: 'score', label: '心情自评分', type: 'range', min: 1, max: 10, value: t.score || 6, unit: ' 分' },
          { k: 'good', label: '今天的好事', type: 'textarea', value: t.good || '', placeholder: '哪怕很小，也值得记下来…' },
          { k: 'bad', label: '今天的糟心事', type: 'textarea', value: t.bad || '', placeholder: '写出来，就不会一直堵在心里…' }
        ],
        onSubmit: v => {
          let r = S.mood.logs.find(l => l.date === today);
          if (!r) { r = { date: today }; S.mood.logs.push(r); }
          Object.assign(r, { mood: v.mood, score: K.num(v.score), good: v.good, bad: v.bad });
          if (!r.quote || r.quoteMood !== v.mood) { r.quote = K.pick(D.QUOTES[v.mood] || D.QUOTES.calm); r.quoteMood = v.mood; }
          K.Store.save(); K.Toast('已保存 ✦'); App.render();
        }
      });
    },
    /* 治愈金句：扩展素材库 + 随机降重 */
    healPick(S) {
      const pool = this.allHeal(S);
      const recent = S.mood.recent || [];
      let cand = pool.filter(q => recent.indexOf(q.t) < 0);
      if (!cand.length) cand = pool;
      const q = K.pick(cand);
      S.mood.recent = recent.concat([q.t]).slice(-8);
      K.Store.save();
      return q;
    },
    healFlow(S) {
      const pool = this.allHeal(S);
      let cand = pool.filter(q => (S.mood.recent || []).indexOf(q.t) < 0);
      if (cand.length < 6) cand = pool.slice();
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
      return cand.slice(0, 6);
    },
    /* 合并素材池：内置 HEALING + 用户自定义 heal，构成无限金句库 */
    allHeal(S) {
      const base = (D.HEALING || []).map(q => ({ cat: q.cat, t: q.t, a: q.a, mine: false }));
      const mine = (S.mood.heal || []).map(q => ({ cat: q.cat, t: q.t, a: q.a, mine: true }));
      return base.concat(mine);
    },
    /* 添加我的金句（无限扩充） */
    addHeal(App) {
      const S = K.Store.data;
      K.Sheet.form({
        title: '添加我的金句',
        fields: [
          { k: 't', label: '句子内容', type: 'textarea', required: true, placeholder: '写下想收藏的那句话…' },
          { k: 'cat', label: '分类', type: 'select', value: '治愈', options: ['诗词', '文学', '影视', '散文', '心理', '治愈', '自定义'].map(c => ({ v: c, t: c })) },
          { k: 'a', label: '出处 / 作者（可选）', type: 'text', placeholder: '如：佚名 / 我' }
        ],
        submitText: '保存进金句库',
        onSubmit: v => {
          if (!v.t || !v.t.trim()) { K.Toast('句子内容不能为空'); return; }
          S.mood.heal = S.mood.heal || [];
          S.mood.heal.unshift({ id: K.uid(), t: v.t.trim(), cat: v.cat || '治愈', a: (v.a || '').trim() || '我' });
          K.Store.save(); K.Toast('已加入金句库 ✦'); App.render();
        }
      });
    }
  };

  /* =======================================================
     模块 8 · 每月复盘
     ======================================================= */
  Pages.review = {
    month: null,
    render() {
      const S = K.Store.data, ms = this.month = this.month || K.mstr();
      const st = D.monthStat(ms);
      const R = S.review.months[ms] = S.review.months[ms] || { goals: [], summary: '', period: '平稳期', next: { overall: '', weeks: ['', '', '', ''] }, reward: { claimed: false, gift: '' } };
      const dims = [
        { k: '早睡', v: st.sleep.rate, d: st.sleep.good + '/' + st.eff + ' 天达标' },
        { k: '存款', v: st.savings.rate, d: K.money(st.savings.saved) + ' / ' + K.money(Math.round(st.savings.goal)) },
        { k: '阅读', v: st.reading.rate, d: st.reading.min + '′ / ' + st.reading.goal + '′' },
        { k: '单词', v: st.words.rate, d: st.words.days + '/' + st.eff + ' 天打卡' },
        { k: '心情', v: st.mood.rate, d: '平均 ' + st.mood.avg + ' 分' }
      ];
      const overall = Math.round(dims.reduce((s, d) => s + d.v, 0) / dims.length);
      const rank = D.rankOf(overall);
      const days = K.monthDays(ms);
      const daily = days.map(d => {
        if (d > K.dstr()) return null;
        const t = D.todoRate(d).rate;
        const sl = S.sleep.logs.find(l => l.date === d);
        const rm = S.reading.logs.filter(l => l.date === d).reduce((s, l) => s + K.num(l.minutes), 0);
        const wd = S.words.days[d];
        const parts = [t, sl ? (sl.state === 'good' ? 100 : sl.state === 'mid' ? 60 : 20) : 0, K.pct(rm, S.reading.dailyMin), wd && wd.checked ? 100 : 0];
        return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
      });
      let h = '';

      h += '<div class="seg"><button id="rPrev">‹ 上月</button><button class="on">' + esc(ms) + '</button><button id="rNext">下月 ›</button></div>';

      h += UI.card({
        icon: 'i-chart', title: '月度数据大盘', extra: '综合评级',
        body: '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">' +
          '<div class="rank ' + rank + '" style="width:52px;height:52px;font-size:24px;border-radius:16px">' + rank + '</div>' +
          '<div style="flex:1;min-width:0"><div class="li-t">本月综合完成度 ' + overall + '%</div>' +
          '<div class="hint">' + (rank === 'S' ? '近乎完美的一个月，值得一张属于你的专辑封面 ✦' : rank === 'A' ? '非常棒，已达到自我奖励标准 🎁' : rank === 'B' ? '稳步前进，下个月再推一把' : '这个月辛苦了，先照顾好自己再谈进度 🤍') + '</div>' +
          '<div style="margin-top:6px">' + UI.bar(overall) + '</div></div></div>' +
          '<div class="chart-box">' + K.Chart.line({ labels: days.map(K.mdShort), series: [{ data: daily, color: '#FF9CC9' }], height: 150, max: 100, fmt: v => Math.round(v) }) + '</div>' +
          '<div class="legend"><span><i style="background:#FF9CC9"></i>月度完成度折线（待办 / 早睡 / 阅读 / 单词 综合）</span></div>'
      });

      /* 月度完成度 · 四类独立曲线（早睡 / 存款 / 阅读 / 单词） */
      (function () {
        const days = K.monthDays(ms);
        const dailySleep = days.map(d => {
          const l = S.sleep.logs.find(x => x.date === d);
          if (!l) return 0; return l.state === 'good' ? 100 : l.state === 'mid' ? 60 : 20;
        });
        const mGoal = S.savings.goal.annual > 0 ? Math.round(S.savings.goal.annual / 12) : 0;
        const dimCount = K.daysInMonth(ms);
        let cum = 0;
        const dailySave = days.map(d => {
          const s = D.savedTotal(r => r.date === d); cum += s;
          if (mGoal <= 0) return cum > 0 ? 60 : 0;
          return Math.min(100, Math.round(cum / (mGoal / dimCount) * 100));
        });
        const dailyRead = days.map(d => {
          const m = S.reading.logs.filter(l => l.date === d).reduce((a, l) => a + K.num(l.minutes), 0);
          return Math.min(100, Math.round(m / S.reading.dailyMin * 100));
        });
        const dailyWord = days.map(d => { const w = S.words.days[d]; return (w && w.checked) ? 100 : 0; });
        h += UI.card({
          icon: 'i-chart', title: '月度完成度 · 四类独立曲线',
          body: '<div class="chart-box">' + K.Chart.line({
            labels: days.map(K.mdShort),
            series: [
              { data: dailySleep, color: '#8FE3C4' },
              { data: dailySave, color: '#F3C969' },
              { data: dailyRead, color: '#B197F0' },
              { data: dailyWord, color: '#7FC0F5' }
            ], height: 190, max: 100, fmt: v => Math.round(v)
          }) + '</div>' +
          '<div class="legend">' +
          '<span><i style="background:#8FE3C4"></i>早睡达标</span>' +
          '<span><i style="background:#F3C969"></i>存款进度</span>' +
          '<span><i style="background:#B197F0"></i>阅读时长</span>' +
          '<span><i style="background:#7FC0F5"></i>单词打卡</span></div>' +
          '<div class="hint" style="margin-top:6px">横轴为日期，纵轴为当日完成度（0–100%）。存款曲线为当月累计进度占比。</div>'
        });
      })();

      h += UI.card({
        icon: 'i-sparkle', title: '五项维度评级',
        body: dims.map(d => {
          const r = D.rankOf(d.v);
          return '<div class="li"><div class="rank ' + r + '">' + r + '</div>' +
            '<div class="li-main"><div class="li-t">' + esc(d.k) + ' · ' + d.v + '%</div>' +
            '<div class="li-s"><span style="color:var(--ink-3)">' + esc(d.d) + '</span></div>' +
            '<div style="margin-top:6px">' + UI.bar(d.v, d.v >= 75 ? 'ok' : d.v >= 60 ? '' : 'warn') + '</div></div></div>';
        }).join('') + '<div class="hint" style="margin-top:8px">评级标准：S ≥ 90% · A ≥ 75% · B ≥ 60% · C &lt; 60%</div>'
      });

      h += UI.card({
        icon: 'i-news', title: '月初目标核对', cls: 'tex-news',
        extra: '<button class="btn xs ghost" id="gAdd">' + ico('i-plus', 'sm') + ' 添加</button>',
        body: (R.goals.length ? R.goals.map(g =>
          '<div class="li' + (g.done ? ' done' : '') + '"><button class="cbox" data-gt="' + g.id + '">' + ico('i-check') + '</button>' +
          '<div class="li-main"><div class="li-t">' + esc(g.text) + '</div>' +
          (!g.done ? '<div class="li-s">' + (g.sub ? UI.tag('主观：' + esc(g.sub.slice(0, 14)), 'warn') : UI.tag('待填主观原因', 'grey')) +
            (g.obj ? UI.tag('客观：' + esc(g.obj.slice(0, 14)), 'sky') : UI.tag('待填客观原因', 'grey')) + '</div>' : '') +
          '</div><div class="li-act">' + (!g.done ? '<button class="mini-btn" data-gr="' + g.id + '">' + ico('i-pen') + '</button>' : '') +
          '<button class="mini-btn del" data-gd="' + g.id + '">' + ico('i-close') + '</button></div></div>').join('')
          : UI.empty('还没有登记本月目标，点击右上角添加')) +
          '<div class="hint" style="margin-top:8px">未完成的目标需要填写「主观原因 + 客观原因」双重复盘。</div>'
      });

      if (!R.summary) {
        R.summary = '本月综合完成度 ' + overall + '%（评级 ' + rank + '）。早睡达标 ' + st.sleep.good + '/' + st.eff + ' 天；存款 ' + K.money(st.savings.saved) + (st.savings.goal > 0 ? ' / 目标 ' + K.money(Math.round(st.savings.goal)) : '') + '；阅读 ' + st.reading.min + ' 分钟；单词打卡 ' + st.words.days + '/' + st.eff + ' 天；心情均分 ' + st.mood.avg + '。' + (rank === 'S' || rank === 'A' ? '整体状态向好，记得好好犒劳自己。' : rank === 'B' ? '稳步前进，下月再推一把。' : '这个月辛苦了，先照顾好自己，进度之外你也很重要。');
        K.Store.save();
      }
      h += UI.card({
        icon: 'i-heart', title: '月度状态总结',
        extra: UI.tag(R.period, R.period === '高效期' ? 'mint' : R.period === '焦虑期' ? 'bad' : 'sky'),
        body: '<div class="hint" style="margin-bottom:8px">系统建议：本月心情平均 ' + st.mood.avg + ' 分，睡眠达标率 ' + st.sleep.rate + '%，' +
          (st.mood.avg >= 7.5 && st.sleep.rate >= 70 ? '整体偏向<b>高效期</b>。' : st.mood.avg < 5.5 || st.sleep.rate < 40 ? '需要警惕<b>焦虑期</b>，请优先休息。' : '整体处于<b>平稳期</b>。') + '</div>' +
          (R.summary ? '<div class="quote">' + esc(R.summary) + '</div>' : UI.empty('还没有写本月总结')) +
          '<button class="btn sm soft full" style="margin-top:8px" id="sumEdit">' + (R.summary ? '修改总结' : '撰写月度总结') + '</button>'
      });

      h += UI.card({
        icon: 'i-pen', title: '下月规划',
        extra: '<button class="btn xs ghost" id="nextEdit">编辑</button>',
        body: (R.next.overall ? '<div class="li"><div class="li-main"><div class="li-s">' + UI.tag('月度整体目标', 'lilac') + '</div><div class="li-t" style="margin-top:4px">' + esc(R.next.overall) + '</div></div></div>' : UI.empty('还没有制定下月目标')) +
          R.next.weeks.map((wk2, i) => wk2 ? '<div class="li"><div class="li-main"><div class="li-s">' + UI.tag('第 ' + (i + 1) + ' 周', 'sky') + '</div><div class="li-t" style="margin-top:4px;font-weight:500">' + esc(wk2) + '</div></div></div>' : '').join('')
      });

      h += UI.card({
        icon: 'i-gem', title: '月度奖励结算',
        body: '<div class="reward ' + (rank === 'S' || rank === 'A' ? 'on' : 'locked') + '">' +
          '<div class="reward-t">' + ico('i-sparkle', 'sm') + ' ' + (rank === 'S' || rank === 'A' ? '恭喜！综合评级 ' + rank + '，可以自我购置心仪礼物犒劳自己 🎁' : '综合评级 ' + rank + '，达到 A 及以上即可解锁自我奖励') + '</div>' +
          (R.reward.claimed ? '<div class="hint" style="margin-top:6px">已领取奖励：<b>' + esc(R.reward.gift) + '</b>（' + esc(R.reward.at || '') + '）</div>'
            : (rank === 'S' || rank === 'A' ? '<button class="btn sm primary full" style="margin-top:8px" id="rwClaim">登记我的犒劳礼物</button>' : '<div class="hint" style="margin-top:6px">继续加油，下个月的礼物在等你 ✦</div>')) +
          '</div>' +
          '<div class="hint" style="margin-top:10px">数据来源：早睡 / 存款 / 阅读 / 单词 四大核心模块 + 心情看板，均为系统自动汇总。</div>'
      });
      return h;
    },
    mount(root, App) {
      const S = K.Store.data, ms = this.month, R = S.review.months[ms];
      const p = $('#rPrev', root); if (p) p.addEventListener('click', () => { this.month = K.addMonth(ms, -1); App.render(); });
      const n = $('#rNext', root); if (n) n.addEventListener('click', () => { this.month = K.addMonth(ms, 1); App.render(); });
      const ga = $('#gAdd', root); if (ga) ga.addEventListener('click', () => {
        K.Sheet.form({
          title: '添加本月目标', fields: [{ k: 'text', label: '目标内容', required: true, placeholder: '如：本月存入 3000 元' }],
          onSubmit: v => { R.goals.push({ id: K.uid(), text: v.text, done: false, sub: '', obj: '' }); K.Store.save(); App.render(); }
        });
      });
      $$('[data-gt]', root).forEach(b => b.addEventListener('click', () => {
        const g = R.goals.find(x => x.id === b.dataset.gt); if (!g) return;
        g.done = !g.done; K.Store.save(); App.render();
      }));
      $$('[data-gd]', root).forEach(b => b.addEventListener('click', () => {
        R.goals = R.goals.filter(x => x.id !== b.dataset.gd); K.Store.save(); App.render();
      }));
      $$('[data-gr]', root).forEach(b => b.addEventListener('click', () => {
        const g = R.goals.find(x => x.id === b.dataset.gr); if (!g) return;
        K.Sheet.form({
          title: '未完成复盘 · ' + g.text,
          fields: [
            { k: 'sub', label: '主观原因', type: 'textarea', value: g.sub, required: true, placeholder: '拖延？动力不足？高估了自己？' },
            { k: 'obj', label: '客观原因', type: 'textarea', value: g.obj, required: true, placeholder: '临时加班？突发事件？外部条件变化？' }
          ],
          onSubmit: v => { g.sub = v.sub; g.obj = v.obj; K.Store.save(); K.Toast('复盘已记录'); App.render(); }
        });
      }));
      const se = $('#sumEdit', root); if (se) se.addEventListener('click', () => {
        K.Sheet.form({
          title: '月度状态总结',
          fields: [
            { k: 'period', label: '本月状态划分', type: 'opts', value: R.period, options: [{ v: '焦虑期', t: '焦虑期' }, { v: '平稳期', t: '平稳期' }, { v: '高效期', t: '高效期' }] },
            { k: 'summary', label: '整体情绪与身心状态总结', type: 'textarea', value: R.summary, required: true, placeholder: '这个月我的情绪、身体、精力状态是…' }
          ],
          onSubmit: v => { R.period = v.period; R.summary = v.summary; K.Store.save(); App.render(); }
        });
      });
      const ne = $('#nextEdit', root); if (ne) ne.addEventListener('click', () => {
        K.Sheet.form({
          title: '下月规划',
          fields: [
            { k: 'overall', label: '下月整体目标', type: 'textarea', value: R.next.overall, required: true },
            { k: 'w1', label: '第 1 周方向', value: R.next.weeks[0] },
            { k: 'w2', label: '第 2 周方向', value: R.next.weeks[1] },
            { k: 'w3', label: '第 3 周方向', value: R.next.weeks[2] },
            { k: 'w4', label: '第 4 周方向', value: R.next.weeks[3] }
          ],
          onSubmit: v => {
            R.next = { overall: v.overall, weeks: [v.w1, v.w2, v.w3, v.w4] };
            // 自动同步为下月的月初目标
            const nm = K.addMonth(ms, 1);
            const NR = S.review.months[nm] = S.review.months[nm] || { goals: [], summary: '', period: '平稳期', next: { overall: '', weeks: ['', '', '', ''] }, reward: { claimed: false, gift: '' } };
            if (v.overall && !NR.goals.some(g => g.text === v.overall)) NR.goals.push({ id: K.uid(), text: v.overall, done: false, sub: '', obj: '' });
            K.Store.save(); K.Toast('下月规划已保存，并同步到下月目标核对 ✦'); App.render();
          }
        });
      });
      const rc = $('#rwClaim', root); if (rc) rc.addEventListener('click', () => {
        K.Sheet.form({
          title: '登记犒劳礼物', fields: [{ k: 'gift', label: '心仪礼物', required: true, placeholder: '如：泰勒新专黑胶 / 一支好看的钢笔' }],
          onSubmit: v => { R.reward = { claimed: true, gift: v.gift, at: K.dstr() }; K.Store.save(); K.Toast('已登记，好好享受这份奖励 🎁'); App.render(); }
        });
      });
    }
  };

  /* =======================================================
     自定义新增模块（通用页面）
     ======================================================= */
  Pages.__custom = {
    render(mod) {
      const S = K.Store.data, C = S.customData[mod.id] = S.customData[mod.id] || { items: [], notes: [] };
      const done = C.items.filter(i => i.done).length;
      let h = '';
      h += UI.card({
        icon: mod.icon, title: '清单打卡', extra: done + '/' + C.items.length,
        body: (C.items.length ? C.items.map(i =>
          '<div class="li' + (i.done ? ' done' : '') + '"><button class="cbox" data-ct="' + i.id + '">' + ico('i-check') + '</button>' +
          '<div class="li-main"><div class="li-t">' + esc(i.t) + '</div></div>' +
          '<div class="li-act"><button class="mini-btn del" data-cd="' + i.id + '">' + ico('i-close') + '</button></div></div>').join('')
          : UI.empty('还没有内容，点击下方新增')) +
          '<button class="btn sm soft full" style="margin-top:8px" id="cAdd">' + ico('i-plus', 'sm') + ' 新增一项</button>' +
          (C.items.length ? '<div style="margin-top:10px">' + UI.bar(K.pct(done, C.items.length)) + '</div>' : '')
      });
      h += UI.card({
        icon: 'i-pen', title: '记录 / 笔记', extra: C.notes.length + ' 条',
        body: (C.notes.length ? C.notes.slice().reverse().map(n =>
          '<div class="li" style="display:block"><div class="li-s">' + UI.tag(n.date, 'grey') + '</div>' +
          '<div class="li-t" style="font-weight:500;margin-top:4px">' + esc(n.t) + '</div>' +
          '<div style="text-align:right"><button class="btn xs ghost" data-nd="' + n.id + '">删除</button></div></div>').join('')
          : UI.empty('可以在这里记录任何你想留存的内容')) +
          '<button class="btn sm soft full" style="margin-top:8px" id="nAdd">' + ico('i-plus', 'sm') + ' 添加记录</button>'
      });
      return h;
    },
    mount(root, App, mod) {
      const S = K.Store.data, C = S.customData[mod.id];
      const a = $('#cAdd', root); if (a) a.addEventListener('click', () => {
        K.Sheet.form({
          title: '新增一项', fields: [{ k: 't', label: '内容', required: true }],
          onSubmit: v => { C.items.push({ id: K.uid(), t: v.t, done: false }); K.Store.save(); App.render(); }
        });
      });
      const b = $('#nAdd', root); if (b) b.addEventListener('click', () => {
        K.Sheet.form({
          title: '添加记录', fields: [{ k: 't', label: '内容', type: 'textarea', required: true }],
          onSubmit: v => { C.notes.push({ id: K.uid(), t: v.t, date: K.dstr() }); K.Store.save(); App.render(); }
        });
      });
      $$('[data-ct]', root).forEach(x => x.addEventListener('click', () => {
        const i = C.items.find(y => y.id === x.dataset.ct); if (i) { i.done = !i.done; K.Store.save(); App.render(); }
      }));
      $$('[data-cd]', root).forEach(x => x.addEventListener('click', () => {
        C.items = C.items.filter(y => y.id !== x.dataset.cd); K.Store.save(); App.render();
      }));
      $$('[data-nd]', root).forEach(x => x.addEventListener('click', () => {
        C.notes = C.notes.filter(y => y.id !== x.dataset.nd); K.Store.save(); App.render();
      }));
    }
  };

})(window);
