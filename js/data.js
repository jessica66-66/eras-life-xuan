/* =========================================================
   data.js — 数据模型 / 默认值 / 模块定义 / 内容库 / 每日自动任务
   ========================================================= */
(function (w) {
  'use strict';
  const K = w.Core;

  /* ---------- 8 大固定模块（可拖拽改序、可新增） ---------- */
  const MODULES = [
    { id: 'home', name: '首页', desc: '每日动态主页', icon: 'i-heart', slogan: 'I can see you shining in your own eras・璇', sloganCn: '我看见你，在属于你的时代里闪闪发光' },
    { id: 'todo', name: '待办', desc: '日期记录 + 全功能管控', icon: 'i-news', slogan: 'Long live the walls we crashed through', sloganCn: '万岁！让我们像勇士一般并肩穿越困难艰险' },
    { id: 'words', name: '单词', desc: '打卡统计 + 易错留存', icon: 'i-pen', slogan: 'Words are the keys to more worlds', sloganCn: '词汇，是看见更多世界的钥匙' },
    { id: 'reading', name: '阅读', desc: '中文书籍 · 每日 30 分钟', icon: 'i-book', slogan: 'I found peace in your melody', sloganCn: '我在你的旋律里，找到了安宁' },
    { id: 'savings', name: '存款', desc: '可视化记账 + 存钱规划', icon: 'i-gem', slogan: "Best believe I'm still bejeweled, when I walk in the room", sloganCn: '财富慢慢积攒，自己永远闪耀' },
    { id: 'sleep', name: '早睡', desc: '睡眠管控 + 奖惩自动化', icon: 'i-sweater', slogan: 'Quiet nights build brighter mornings', sloganCn: '宁静的夜晚孕育更明亮的清晨' },
    { id: 'mood', name: '心情', desc: '情绪记录 + 金句 + 看板', icon: 'i-vinyl', slogan: 'You are the album cover of your own feelings', sloganCn: '你的心情，本身就是一张封面' },
    { id: 'review', name: '每月复盘', desc: '全数据汇总 + 评级 + 规划', icon: 'i-chart', slogan: 'Each month is a new album, write it gently and firmly', sloganCn: '每月都是一张新专辑，温柔而坚定地写下去' }
  ];
  const ICON_CHOICES = [
    { v: 'i-heart', t: '♡ 心形' }, { v: 'i-sweater', t: '针织毛衣' }, { v: 'i-vinyl', t: '唱片' },
    { v: 'i-pen', t: '钢笔' }, { v: 'i-news', t: '报纸' }, { v: 'i-sparkle', t: '星光' },
    { v: 'i-book', t: '书本' }, { v: 'i-moon', t: '月亮' }, { v: 'i-gem', t: '宝石' }, { v: 'i-chart', t: '图表' },
    { v: 'i-rainbow', t: '🌈 彩虹' }, { v: 'i-bow', t: '🎀 蝴蝶结' }, { v: 'i-guitar', t: '🎸 吉他' },
    { v: 'i-mic', t: '🎤 麦克风' }, { v: 'i-keys', t: '🎹 钢琴键' }, { v: 'i-ring', t: '💍 戒指' },
    { v: 'i-snake', t: '🐍 小蛇' }, { v: 'i-apple', t: '🍎 红苹果' }, { v: 'i-candle', t: '🕯️ 蜡烛' },
    { v: 'i-butterfly', t: '🦋 蝴蝶' }, { v: 'i-lips', t: '💋 红唇' }, { v: 'i-star', t: '⭐ 五角星' },
    { v: 'i-flower', t: '🌸 花朵' }, { v: 'i-envelope', t: '✉️ 信封' }, { v: 'i-camera', t: '📷 相机' },
    { v: 'i-coffee', t: '☕ 咖啡' }, { v: 'i-leaf', t: '🍃 树叶' }, { v: 'i-crown', t: '👑 皇冠' },
    { v: 'i-disco', t: '🪩 迪斯科球' }, { v: 'i-snow', t: '❄️ 雪花' }
  ];

  /* ---------- 待办固定分类 ---------- */
  const TODO_CATS = [
    { id: 'morning', name: '晨间必做', icon: 'i-sparkle', items: ['起床打卡', '喝水', '查看今日目标'], pri: 'mid' },
    { id: 'study', name: '学习任务', icon: 'i-pen', items: ['单词背诵', '阅读打卡'], pri: 'high' },
    { id: 'trip', name: '出行事务', icon: 'i-news', items: [], pri: 'mid', calendar: true },
    { id: 'work', name: '工作任务', icon: 'i-vinyl', items: ['日常工作', '突发事项记录'], pri: 'high' },
    { id: 'night', name: '睡前收尾', icon: 'i-moon', items: ['当日所有任务完成情况核对'], pri: 'mid' }
  ];
  const PRI = { high: { t: '高', c: 'bad' }, mid: { t: '中', c: 'warn' }, low: { t: '低', c: 'mint' } };

  /* ---------- 存款分类 ---------- */
  const EXP_CATS = ['餐饮', '购物', '交通', '娱乐', '刚需日用品', '冲动消费'];
  const INC_CATS = ['薪资', '红包'];
  const FUNDS = [
    { id: 'travel', name: '旅行基金', icon: 'i-sparkle', c: '#7FC0F5' },
    { id: 'album', name: '专辑周边基金', icon: 'i-vinyl', c: '#FF9CC9' },
    { id: 'growth', name: '个人提升基金', icon: 'i-pen', c: '#B197F0' },
    { id: 'common', name: '通用存款', icon: 'i-gem', c: '#6FCFB0' }
  ];

  /* ---------- 心情表情库 ---------- */
  const MOODS = [
    { v: 'happy', e: '😊', n: '愉悦开心', c: '#FFB6D9', s: 8 },
    { v: 'calm', e: '😌', n: '平静安稳', c: '#A8D8FF', s: 7 },
    { v: 'down', e: '😔', n: '低落疲惫', c: '#B3BEDA', s: 4 },
    { v: 'angry', e: '😠', n: '烦躁压抑', c: '#F0A3A3', s: 3 },
    { v: 'warm', e: '🥰', n: '温暖治愈', c: '#FFC9A3', s: 9 },
    { v: 'numb', e: '🤍', n: '麻木无感', c: '#D8CFE2', s: 5 },
    { v: 'bliss', e: '✨', n: '超级幸福', c: '#F3C969', s: 10 }
  ];

  /* ---------- 金句库（按心情智能匹配） ---------- */
  const QUOTES = {
    happy: [
      { t: '我看见你在自己的时代里闪闪发光，这一刻请把它记牢。', a: 'Eras Life・璇' },
      { t: 'And I love you, it\'s ruining my life. —— 快乐是允许被大声承认的。', a: 'Taylor Swift《Cruel Summer》' },
      { t: '今天的好心情不是偶然，是你一点点搭起来的房子。', a: '治愈手记' }
    ],
    calm: [
      { t: 'I found peace in your melody. 安稳，是最被低估的幸福。', a: 'Taylor Swift' },
      { t: '不必每天都发光，平静地度过一天也是一种圆满。', a: '治愈手记' },
      { t: '像针织毛衣一样把自己裹好，慢一点也来得及。', a: 'cardigan' }
    ],
    down: [
      { t: 'You are not the opinion of someone who doesn\'t know you. 低落只是天气，不是你的气候。', a: 'Taylor Swift' },
      { t: '允许自己今天只完成 60%，剩下的交给明天的你。', a: '治愈手记' },
      { t: '所有的黑夜都在悄悄准备天亮，你只需要先睡个好觉。', a: 'Eras Life・璇' }
    ],
    angry: [
      { t: 'Shake it off. 有些情绪不需要被说服，只需要被抖落。', a: 'Taylor Swift《Shake It Off》' },
      { t: '烦躁时先离开现场，喝口水，再决定要不要在意。', a: '治愈手记' },
      { t: '你不需要向任何人证明你的柔软是有代价的。', a: 'Eras Life・璇' }
    ],
    warm: [
      { t: 'You are in love, true love. 被温柔对待的日子，值得写进日记。', a: 'Taylor Swift《You Are In Love》' },
      { t: '把今天的温暖存进心里，冬天的时候可以取用。', a: '治愈手记' },
      { t: '愿你被这个世界温柔以待，也愿你温柔地对待自己。', a: 'Eras Life・璇' }
    ],
    numb: [
      { t: '麻木不是坏事，是心在自我保护。给它一点时间。', a: '治愈手记' },
      { t: 'It\'s me, hi. 先和自己打个招呼，再说别的。', a: 'Taylor Swift《Anti-Hero》' },
      { t: '什么都不想做的一天，也算认真活过。', a: 'Eras Life・璇' }
    ],
    bliss: [
      { t: 'Best believe I\'m still bejeweled, when I walk in the room. 你走进房间时，光就跟着来了。', a: 'Taylor Swift《Bejeweled》' },
      { t: '把这一刻记下来，以后难过时拿出来读。', a: '治愈手记' },
      { t: 'Long live all the magic we made. 今天的幸福万岁。', a: 'Taylor Swift《Long Live》' }
    ]
  };

  /* ---------- 中文优质书籍 / 文章推荐（严格排除英文内容） ---------- */
  const BOOK_RECS = [
    { t: '活着', a: '余华', tag: '当代文学', d: '用最朴素的语言写尽生命的韧性。' },
    { t: '平凡的世界', a: '路遥', tag: '当代文学', d: '普通人如何在时代里认真生活。' },
    { t: '我与地坛', a: '史铁生', tag: '散文', d: '关于命运、母亲与和解的沉静之书。' },
    { t: '人间草木', a: '汪曾祺', tag: '散文', d: '把日子过成诗的生活美学。' },
    { t: '目送', a: '龙应台', tag: '散文', d: '写给成长与告别的温柔札记。' },
    { t: '皮囊', a: '蔡崇达', tag: '非虚构', d: '关于故乡、亲人和自我的真诚书写。' },
    { t: '万历十五年', a: '黄仁宇', tag: '历史', d: '从一年看懂一个王朝的运行逻辑。' },
    { t: '中国哲学简史', a: '冯友兰', tag: '哲学', d: '中国思想脉络的入门经典。' },
    { t: '乡土中国', a: '费孝通', tag: '社科', d: '理解中国社会结构的必读之作。' },
    { t: '巨流河', a: '齐邦媛', tag: '回忆录', d: '一个时代与一个人的深情记录。' },
    { t: '看见', a: '柴静', tag: '非虚构', d: '在采访里看见他人，也看见自己。' },
    { t: '如何阅读一本书', a: '莫提默·艾德勒（中译本）', tag: '方法论', d: '把阅读从消遣升级为能力。' },
    { t: '被讨厌的勇气', a: '岸见一郎（中译本）', tag: '心理', d: '课题分离，活出自己的人生。' },
    { t: '心流', a: '米哈里（中译本）', tag: '心理', d: '专注带来的高质量幸福感。' },
    { t: '苏东坡传', a: '林语堂', tag: '传记', d: '在起落里依然热爱生活的范本。' },
    { t: '文化苦旅', a: '余秋雨', tag: '散文', d: '行走山河间的文化思考。' },
    { t: '许三观卖血记', a: '余华', tag: '当代文学', d: '苦难中的幽默与柔软。' },
    { t: 'московские…（不推荐）', a: '', tag: '', d: '', skip: true }
  ].filter(b => !b.skip);

  const ARTICLE_RECS = [
    { t: '《我们仨》节选：思念是一场漫长的散步', src: '杨绛', d: '关于陪伴与失去的中文散文名篇。' },
    { t: '《背影》：父亲翻过月台的那一刻', src: '朱自清', d: '中学课本里最耐读的亲情片段。' },
    { t: '《荷塘月色》：一个人的静夜', src: '朱自清', d: '适合睡前朗读的中文经典。' },
    { t: '《合欢树》：母亲留下的那棵树', src: '史铁生', d: '短小却后劲极强的散文。' },
    { t: '《故乡的野菜》：把乡愁写进食物', src: '周作人', d: '闲适笔调里的生活温度。' },
    { t: '《谈美》：慢慢走，欣赏啊', src: '朱光潜', d: '关于审美与生活态度的中文随笔。' }
  ];

  /* 中文校验：排除全英文内容 */
  const hasCN = s => /[\u4e00-\u9fa5]/.test(String(s || ''));

  /* ---------- 泰勒 MV 合集（连续 7 天早睡解锁） ---------- */
  const MV_LIST = [
    { t: 'Lover', d: '梦幻粉蓝小屋，专辑同名主打' },
    { t: 'Cardigan', d: '针织毛衣与钢琴森林' },
    { t: 'Blank Space', d: '经典叙事美学' },
    { t: 'Bejeweled', d: '闪耀宝石之夜' },
    { t: 'Anti-Hero', d: '与自己和解的自嘲之作' },
    { t: 'You Belong With Me', d: '青春回忆杀' },
    { t: 'Willow', d: '柳枝般缠绕的梦境' },
    { t: 'Style', d: '复古电影感' }
  ];

  /* ---------- 天气码 ---------- */
  const WMO = {
    0: ['晴', '☀️'], 1: ['大部晴朗', '🌤'], 2: ['局部多云', '⛅️'], 3: ['阴', '☁️'],
    45: ['雾', '🌫'], 48: ['雾凇', '🌫'], 51: ['小毛雨', '🌦'], 53: ['毛毛雨', '🌦'], 55: ['大毛雨', '🌦'],
    56: ['冻毛雨', '🌧'], 57: ['冻毛雨', '🌧'], 61: ['小雨', '🌦'], 63: ['中雨', '🌧'], 65: ['大雨', '🌧'],
    66: ['冻雨', '🌧'], 67: ['冻雨', '🌧'], 71: ['小雪', '🌨'], 73: ['中雪', '🌨'], 75: ['大雪', '❄️'],
    77: ['雪粒', '🌨'], 80: ['阵雨', '🌦'], 81: ['阵雨', '🌧'], 82: ['强阵雨', '⛈'], 85: ['阵雪', '🌨'],
    86: ['强阵雪', '❄️'], 95: ['雷阵雨', '⛈'], 96: ['雷阵雨伴冰雹', '⛈'], 99: ['强雷暴', '⛈']
  };

  /* ---------- 默认数据 ---------- */
  function defaults() {
    const today = K.dstr();
    return {
      meta: { ver: 1, firstUse: today, visitDays: [today], lastRun: '' },
      icons: { custom: {}, overrides: {} },   // 自定义图标库：custom[id]={kind,data,label}，overrides[内置id]=内部SVG
      settings: {
        order: MODULES.map(m => m.id),
        custom: [],                       // 自定义新增模块
        moduleIcons: {},                  // 模块图标覆盖：{ 模块id: 图标id }
        homeCards: ['days', 'clock', 'weather', 'news', 'jump', 'overview'],
        city: { name: '北京', lat: 39.9042, lon: 116.4074, auto: true },
        notify: false,
        sync: { enabled: false, mode: 'jsonbin', bin: '', key: '', url: '', headers: '', last: '', status: '', rev: 0, baseRev: 0 }
      },
      todo: { days: {}, cats: TODO_CATS.map(c => ({ id: c.id, name: c.name, icon: c.icon })) },
      words: { days: {}, errors: [], target: { minutes: 20, count: 30 } },
      reading: { books: [], logs: [], dailyMin: 30 },
      savings: {
        goal: { annual: 0, monthlyLiving: 0, emergency: 0 },
        records: [],
        monthMark: {}
      },
      sleep: {
        std: { bed: '23:00', focus: '22:40', wake: '07:00', redline: '23:30' },
        logs: [], rewards: { mvUnlocked: false, lastUnlock: '' }, penalties: {}
      },
      mood: { logs: [], favs: [] },
      review: { months: {} },
      customData: {},
      weatherCache: null, newsCache: null
    };
  }

  /* ---------- 待办：生成某日清单（含自动顺延） ---------- */
  function ensureTodoDay(ds) {
    const S = K.Store.data, T = S.todo;
    if (T.days[ds]) return T.days[ds];
    const items = [];
    TODO_CATS.forEach(c => {
      c.items.forEach(t => items.push({
        id: K.uid(), cat: c.id, title: t, pri: c.pri, done: false, tpl: true, due: '', remind: false, note: ''
      }));
    });
    // 顺延：找最近 7 天内未完成、未顺延过的任务
    for (let back = 1; back <= 7; back++) {
      const prev = K.addDays(ds, -back), pd = T.days[prev];
      if (!pd) continue;
      pd.items.forEach(it => {
        if (it.done || it.movedTo) return;
        if (items.some(x => x.title === it.title && x.cat === it.cat)) { it.movedTo = ds; return; }
        it.movedTo = ds;
        items.push({
          id: K.uid(), cat: it.cat, title: it.title, pri: it.pri, done: false, tpl: false,
          due: it.due || '', remind: it.remind, note: it.note || '',
          carried: true, from: it.from || prev, carryN: (it.carryN || 0) + 1
        });
      });
      break; // 只顺延最近有记录的一天
    }
    T.days[ds] = { items: items, created: ds };
    K.Store.save();
    return T.days[ds];
  }

  /* ---------- 每日自动任务 ---------- */
  function runDailyJobs() {
    const S = K.Store.data, today = K.dstr();
    if (S.meta.visitDays.indexOf(today) < 0) S.meta.visitDays.push(today);
    if (S.meta.visitDays.length > 4000) S.meta.visitDays = S.meta.visitDays.slice(-4000);
    ensureTodoDay(today);
    // 熬夜惩罚：昨日熬夜 → 今日额外 30 分钟单词任务 + 禁刷短视频
    const y = K.addDays(today, -1);
    const yl = S.sleep.logs.find(l => l.date === y);
    if (yl && yl.state === 'late' && yl.reason !== '无' && !S.sleep.penalties[today]) {
      S.sleep.penalties[today] = { noShortVideo: true, extraWords: 30, from: y };
      const d = S.todo.days[today];
      if (d && !d.items.some(i => i.penalty)) {
        d.items.push({ id: K.uid(), cat: 'study', title: '【熬夜惩罚】额外 30 分钟单词背诵', pri: 'high', done: false, tpl: false, penalty: true, due: '', note: '来源：' + y + ' 无故熬夜' });
      }
    }
    // 早睡奖励：连续 7 天达标解锁 MV
    if (sleepStreak() >= 7 && !S.sleep.rewards.mvUnlocked) {
      S.sleep.rewards.mvUnlocked = true; S.sleep.rewards.lastUnlock = today;
    }
    S.meta.lastRun = today;
    K.Store.save();
  }

  function sleepStreak() {
    const S = K.Store.data, map = {};
    S.sleep.logs.forEach(l => map[l.date] = l);
    let d = K.dstr(), n = 0;
    if (!map[d]) d = K.addDays(d, -1); // 今天还没打卡，从昨天算
    for (let i = 0; i < 400; i++) {
      const l = map[d];
      if (l && l.state === 'good') { n++; d = K.addDays(d, -1); } else break;
    }
    return n;
  }
  function wordStreak() {
    const S = K.Store.data, days = S.words.days;
    let d = K.dstr(), n = 0;
    if (!(days[d] && days[d].checked)) d = K.addDays(d, -1);
    for (let i = 0; i < 400; i++) {
      if (days[d] && days[d].checked) { n++; d = K.addDays(d, -1); } else break;
    }
    return n;
  }

  /* ---------- 统计聚合（供复盘/首页使用） ---------- */
  function todoRate(ds) {
    const d = K.Store.data.todo.days[ds];
    if (!d || !d.items.length) return { done: 0, all: 0, rate: 0 };
    const done = d.items.filter(i => i.done).length;
    return { done: done, all: d.items.length, rate: K.pct(done, d.items.length) };
  }
  function weekTodoRate(ds) {
    let done = 0, all = 0;
    K.weekRange(ds || K.dstr()).forEach(d => { const r = todoRate(d); done += r.done; all += r.all; });
    return { done: done, all: all, rate: K.pct(done, all) };
  }
  function savedTotal(filter) {
    return K.Store.data.savings.records.filter(r => r.kind === 'save' && (!filter || filter(r)))
      .reduce((s, r) => s + K.num(r.amount), 0);
  }
  function monthStat(ms) {
    const S = K.Store.data, days = K.monthDays(ms), today = K.dstr();
    const past = days.filter(d => d <= today);
    const eff = past.length || days.length;
    // 早睡
    const sl = S.sleep.logs.filter(l => l.date.slice(0, 7) === ms);
    const good = sl.filter(l => l.state === 'good').length;
    // 存款
    const saved = savedTotal(r => r.date.slice(0, 7) === ms);
    const mGoal = S.savings.goal.annual > 0 ? S.savings.goal.annual / 12 : 0;
    // 阅读
    const rl = S.reading.logs.filter(l => l.date.slice(0, 7) === ms);
    const rMin = rl.reduce((s, l) => s + K.num(l.minutes), 0);
    const rGoal = S.reading.dailyMin * eff;
    // 单词
    let wDays = 0, wMin = 0;
    days.forEach(d => { const x = S.words.days[d]; if (x && x.checked) { wDays++; wMin += K.num(x.minutes); } });
    // 心情
    const ml = S.mood.logs.filter(l => l.date.slice(0, 7) === ms);
    const mAvg = ml.length ? ml.reduce((s, l) => s + K.num(l.score), 0) / ml.length : 0;
    return {
      ms: ms, days: days.length, eff: eff,
      sleep: { rec: sl.length, good: good, rate: K.pct(good, eff), avgDur: sl.length ? sl.reduce((s, l) => s + K.num(l.dur), 0) / sl.length : 0, avgScore: sl.length ? sl.reduce((s, l) => s + K.num(l.score), 0) / sl.length : 0 },
      savings: { saved: saved, goal: mGoal, rate: mGoal > 0 ? K.pct(saved, mGoal) : (saved > 0 ? 100 : 0) },
      reading: { min: rMin, goal: rGoal, rate: K.pct(rMin, rGoal), days: new Set(rl.map(l => l.date)).size },
      words: { days: wDays, min: wMin, rate: K.pct(wDays, eff) },
      mood: { n: ml.length, avg: Math.round(mAvg * 10) / 10, rate: K.pct(mAvg, 10) }
    };
  }
  function rankOf(p) { return p >= 90 ? 'S' : p >= 75 ? 'A' : p >= 60 ? 'B' : 'C'; }

  w.D = {
    MODULES, ICON_CHOICES, TODO_CATS, PRI, EXP_CATS, INC_CATS, FUNDS, MOODS, QUOTES,
    BOOK_RECS, ARTICLE_RECS, MV_LIST, WMO, hasCN,
    defaults, ensureTodoDay, runDailyJobs, sleepStreak, wordStreak,
    todoRate, weekTodoRate, savedTotal, monthStat, rankOf
  };
})(window);
