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
    { id: 'reading', name: '阅读', desc: '中文书籍 · 每日 60 分钟', icon: 'i-book', slogan: 'I found peace in your melody', sloganCn: '我在你的旋律里，找到了安宁' },
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

  /* =========================================================
     云养萌宠 · 数据层（全部为写实真实猫狗照片，非卡通）
     图源：TheCatAPI / Dog CEO 品种照片库
     每个品种 6 张：0~3 对应四个成长形态，4 用于庆祝动态，5 用于图鉴封面
     ========================================================= */
  const PET_BREEDS = [
    { id: 'ragdoll', name: '布偶猫', kind: 'cat', tone: '#FFE3EF', tag: '温柔黏人', imgs: ['https://cdn2.thecatapi.com/images/aWVfoSN_K.jpg', 'https://cdn2.thecatapi.com/images/oGefY4YoG.jpg', 'https://cdn2.thecatapi.com/images/83htMb1AJ.jpg', 'https://cdn2.thecatapi.com/images/smuGD4z2U.jpg', 'https://cdn2.thecatapi.com/images/QZYN75HxN.jpg', 'https://cdn2.thecatapi.com/images/xPkUTg4-N.jpg'] },
    { id: 'britishshort', name: '英国短毛猫', kind: 'cat', tone: '#E6EEF8', tag: '稳重憨厚', imgs: ['https://cdn2.thecatapi.com/images/GrPErz7EA.jpg', 'https://cdn2.thecatapi.com/images/1bFFj7N5c.jpg', 'https://cdn2.thecatapi.com/images/xNuSF5YWY.jpg', 'https://cdn2.thecatapi.com/images/IouWtnMl2.jpg', 'https://cdn2.thecatapi.com/images/utX9jo5EO.jpg', 'https://cdn2.thecatapi.com/images/N8bl5RjPG.jpg'] },
    { id: 'siamese', name: '暹罗猫', kind: 'cat', tone: '#F0E6DA', tag: '机灵爱说话', imgs: ['https://cdn2.thecatapi.com/images/DFHMMPNcD.jpg', 'https://cdn2.thecatapi.com/images/O2aNhFGU-.jpg', 'https://cdn2.thecatapi.com/images/Xwp-MBOtI.jpg', 'https://cdn2.thecatapi.com/images/nwrkX6GhX.jpg', 'https://cdn2.thecatapi.com/images/e0sS4bZcP.jpg', 'https://cdn2.thecatapi.com/images/VsaXX13yt.jpg'] },
    { id: 'mainecoon', name: '缅因猫', kind: 'cat', tone: '#EFE8DC', tag: '温柔巨人', imgs: ['https://cdn2.thecatapi.com/images/MtgMsxPw9.jpg', 'https://cdn2.thecatapi.com/images/PoZIVJ124.jpg', 'https://cdn2.thecatapi.com/images/EwApDDFZR.jpg', 'https://cdn2.thecatapi.com/images/PKblw2RPe.jpg', 'https://cdn2.thecatapi.com/images/LIQSvUemz.jpg', 'https://cdn2.thecatapi.com/images/ftmw29QPb.jpg'] },
    { id: 'scottishfold', name: '苏格兰折耳猫', kind: 'cat', tone: '#F3E9F6', tag: '安静乖巧', imgs: ['https://cdn2.thecatapi.com/images/nd9FDCrLY.jpg', 'https://cdn2.thecatapi.com/images/OlCMYSMZD.jpg', 'https://cdn2.thecatapi.com/images/TOozwr2OD.jpg', 'https://cdn2.thecatapi.com/images/JVITS8pXF.jpg', 'https://cdn2.thecatapi.com/images/IboDUkK8K.jpg', 'https://cdn2.thecatapi.com/images/O4zh8w0vB.jpg'] },
    { id: 'persian', name: '波斯猫', kind: 'cat', tone: '#FBEDE4', tag: '优雅贵气', imgs: ['https://cdn2.thecatapi.com/images/RhBsBQg6y.jpg', 'https://cdn2.thecatapi.com/images/d_RzH-Zft.jpg', 'https://cdn2.thecatapi.com/images/AYfFc4vOB.jpg', 'https://cdn2.thecatapi.com/images/e7-hS3gey.jpg', 'https://cdn2.thecatapi.com/images/zFm4AbO-d.jpg', 'https://cdn2.thecatapi.com/images/tSbM4vHB_.png'] },
    { id: 'golden', name: '金毛寻回犬', kind: 'dog', tone: '#FDECD2', tag: '暖心陪伴', imgs: ['https://images.dog.ceo/breeds/retriever-golden/n02099601_8181.jpg', 'https://images.dog.ceo/breeds/retriever-golden/joey_img_0261.jpg', 'https://images.dog.ceo/breeds/retriever-golden/joey_20210805_130226.jpg', 'https://images.dog.ceo/breeds/retriever-golden/n02099601_816.jpg', 'https://images.dog.ceo/breeds/retriever-golden/mori_2.jpg', 'https://images.dog.ceo/breeds/retriever-golden/n02099601_7744.jpg'] },
    { id: 'corgi', name: '柯基犬', kind: 'dog', tone: '#FFE9DC', tag: '短腿元气', imgs: ['https://images.dog.ceo/breeds/corgi/13263927_10154125975153449_6587119903523649180_n.jpg', 'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_13102.jpg', 'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_11017.jpg', 'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_12499.jpg', 'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_4536.jpg', 'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_9935.jpg'] },
    { id: 'shiba', name: '柴犬', kind: 'dog', tone: '#FFE7D6', tag: '倔强可爱', imgs: ['https://images.dog.ceo/breeds/shiba/shiba-16.jpg', 'https://images.dog.ceo/breeds/shiba/shiba-7.jpg', 'https://images.dog.ceo/breeds/shiba/mamehiko01.jpg', 'https://images.dog.ceo/breeds/shiba/shiba-13.jpg', 'https://images.dog.ceo/breeds/shiba/shiba-6.jpg', 'https://images.dog.ceo/breeds/shiba/mamehiko02.jpg'] },
    { id: 'husky', name: '哈士奇', kind: 'dog', tone: '#E4F0FA', tag: '活力戏精', imgs: ['https://images.dog.ceo/breeds/husky/n02110185_11138.jpg', 'https://images.dog.ceo/breeds/husky/n02110185_1338.jpg', 'https://images.dog.ceo/breeds/husky/n02110185_7888.jpg', 'https://images.dog.ceo/breeds/husky/n02110185_12120.jpg', 'https://images.dog.ceo/breeds/husky/n02110185_698.jpg', 'https://images.dog.ceo/breeds/husky/n02110185_1598.jpg'] },
    { id: 'samoyed', name: '萨摩耶', kind: 'dog', tone: '#EEF4FB', tag: '微笑天使', imgs: ['https://images.dog.ceo/breeds/samoyed/n02111889_5075.jpg', 'https://images.dog.ceo/breeds/samoyed/n02111889_6249.jpg', 'https://images.dog.ceo/breeds/samoyed/n02111889_2136.jpg', 'https://images.dog.ceo/breeds/samoyed/n02111889_2361.jpg', 'https://images.dog.ceo/breeds/samoyed/ruby.jpg', 'https://images.dog.ceo/breeds/samoyed/n02111889_12171.jpg'] },
    { id: 'labrador', name: '拉布拉多', kind: 'dog', tone: '#F2EBDD', tag: '忠厚稳重', imgs: ['https://images.dog.ceo/breeds/labrador/n02099712_2473.jpg', 'https://images.dog.ceo/breeds/labrador/n02099712_3197.jpg', 'https://images.dog.ceo/breeds/labrador/n02099712_6455.jpg', 'https://images.dog.ceo/breeds/labrador/n02099712_3753.jpg', 'https://images.dog.ceo/breeds/labrador/n02099712_7815.jpg', 'https://images.dog.ceo/breeds/labrador/n02099712_4845.jpg'] }
  ];

  /* 成长形态：依据「累计早睡打卡天数」，永不退化 */
  const PET_STAGES = [
    { i: 0, need: 0, name: '初见幼生', desc: '刚被你接回家，还有点怕生' },
    { i: 1, need: 15, name: '幼崽形态', desc: '开始黏着你，会主动蹭手心了' },
    { i: 2, need: 45, name: '少年形态', desc: '毛色油亮，眼睛里全是光' },
    { i: 3, need: 90, name: '成年完全体', desc: '沉稳漂亮，是你 90 天早睡换来的' }
  ];

  /* 连续早睡阶梯里程碑（一轮 90 天）— 类型：feed 饲料 / acc 配饰 / scene 场景 / fx 特效 / outfit 穿搭 / toy 玩具 / rare 稀有 */
  const PET_MILESTONES = [
    { day: 3, type: 'feed', id: 'feedpack1', name: '基础饲料礼包', desc: '一次性发放 10 袋优质饲料', emo: '🍖', gain: 10 },
    { day: 7, type: 'acc', id: 'acc_collar', name: '宠物配饰 · 铃铛项圈', desc: '走起路来会叮当响的小项圈', emo: '🔔' },
    { day: 14, type: 'scene', id: 'scene_home', name: '简易居家背景', desc: '有地毯和暖灯的小客厅', emo: '🏠', bg: 'linear-gradient(160deg,#FFF3E4,#FFE6D2 55%,#F6DFC8)' },
    { day: 21, type: 'fx', id: 'fx_heart', name: '基础互动效果 · 爱心气泡', desc: '点它的时候会冒出爱心', emo: '💗' },
    { day: 30, type: 'outfit', id: 'outfit_knit', name: '第一套穿搭 · 米色针织衫', desc: '写实风格的软糯针织，冬天刚好', emo: '🧶', filter: 'saturate(1.06) contrast(1.02)' },
    { day: 45, type: 'toy', id: 'toy_ball', name: '宠物玩具 · 毛线球', desc: '放进家园里，它会自己玩', emo: '🧵' },
    { day: 60, type: 'scene', id: 'scene_autumn', name: '季节家园 · 秋日暖阳', desc: '解锁季节场景，同时新增待机动作', emo: '🍂', bg: 'linear-gradient(160deg,#FFEFD8,#FFDCC0 50%,#F2C9A6)', idle: true },
    { day: 75, type: 'fx', id: 'fx_light', name: '专属环境光影特效', desc: '午后斜射进来的那束光', emo: '✨' },
    { day: 90, type: 'rare', id: 'rare_royal', name: '稀有主题套装 + 纪念勋章', desc: '限定套装、专属电子勋章，并解锁新品种领养资格', emo: '👑', filter: 'saturate(1.12) contrast(1.04) brightness(1.02)' }
  ];

  const PET_CFG = { len: 90, days: [3, 7, 14, 21, 30, 45, 60, 75, 90], feedGood: 3, feedMid: 1, growthPerFeed: 10, lvUp: 100 };

  const PET_TALK = [
    '呼噜呼噜——它把头埋进你手心里', '它轻轻咬了下你的袖口，然后跑开了', '尾巴甩得像小风扇，它很开心',
    '它翻了个身，露出肚皮示意你摸', '它盯着你看了三秒，然后打了个哈欠', '它把玩具叼过来，放在你脚边',
    '它蹭了蹭你的手腕，留下一点温度', '它踩了踩你的手掌，像在给你按摩'
  ];
  const PET_CHEER = [
    '今天也早睡啦，它嗅到了饲料的味道！', '你按时上床的样子，它全看在眼里 ✦',
    '连击 +1，它开心地绕着你转圈', '又是安稳的一晚，它趴在你枕边睡着了'
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

  /* ---------- 首页实时热点：内置精选（文章含全文 / 视频含播放地址） ---------- */
  const HOTSPOTS = [
    { id: 'h_article_1', type: 'article', tag: '治愈随笔', title: '把今天好好过完，就是一种胜利',
      summary: '不必等一个完美的节点，认真过好普通的一天，本身就很了不起。',
      content: [
        '我们总在等一个「重要时刻」才愿意肯定自己：等考完试、等发工资、等瘦下来、等被谁喜欢。可日子是由一个个普通到不行的今天叠起来的。',
        '今天你按时吃了一顿饭，给疲惫的身体一点照顾；今天你把一件拖了很久的小事做完了；今天你在想放弃的时候又多坚持了十分钟——这些都不必等别人鼓掌，它们本身就是胜利。',
        '所以别把「值得被肯定」的门槛抬得太高。把今天好好过完，就已经很了不起了。明天的你，会感谢今天没有放弃的自己。'
      ] },
    { id: 'h_article_2', type: 'article', tag: '情绪管理', title: '允许自己慢下来',
      summary: '效率不是人生的全部，休息也不是偷懒。',
      content: [
        '这个时代把「快」当成了美德。慢一点，就好像在掉队。可人的能量本来就有起伏，像潮水，有涨就有退。',
        '你不需要每一天都马力全开。允许自己在状态不好的时候慢下来，允许自己发呆、放空、什么都不做。那不是浪费，是给电池充电。',
        '真正稳定的前进，是张弛有度的。今天慢一点，是为了明天走得更远。'
      ] },
    { id: 'h_article_3', type: 'article', tag: '自我对话', title: '给三年后的自己写一封信',
      summary: '把现在的困惑写下来，时间会替你回答。',
      content: [
        '现在的你，可能正卡在某个说不清的瓶颈里：不确定方向，怀疑自己，怕努力没有回报。',
        '但请相信，三年后的你回头看，会感谢现在这个还在咬牙坚持的自己。很多当时觉得过不去的坎，后来都成了故事里轻描淡写的一笔。',
        '如果可以，今晚就给三年后的自己写几句话吧。不用工整，写下你现在的烦恼和期待就好。时间，会替你慢慢回答。'
      ] },
    { id: 'h_article_4', type: 'article', tag: '生活美学', title: '手机之外，还有整个世界',
      summary: '放下屏幕，去感受真实的风、光和人的温度。',
      content: [
        '我们习惯了用一块屏幕丈量世界：刷不完的信息流，看不完的别人的生活。可屏幕里的热闹，常常让真实的生活显得安静又无聊。',
        '其实窗外有风，路边有花，锅里的水在咕嘟咕嘟，朋友的笑是带温度的。这些不会被点赞，却最值得被记住。',
        '今天，试着把手机放下一会儿。去看看真实的世界，去和真实的人说话。你会发现自己比想象中更需要这些。'
      ] },
    { id: 'h_article_5', type: 'article', tag: '心理小课', title: '如何和坏情绪和平相处',
      summary: '情绪没有好坏，它只是来告诉你一些事。',
      content: [
        '我们总想赶走坏情绪：焦虑、委屈、烦躁。可越想赶，它越黏人。',
        '情绪其实像天气，来了又会走。它来，是替身体传一个信号：你累了、你在意、你需要被看见。',
        '与其对抗，不如先承认它的存在：「我现在确实有点丧。」然后给自己一杯热水、一段安静。等它自然退潮，你还是完整的你。'
      ] },
    { id: 'h_video_1', type: 'video', tag: '放松电台', title: '治愈 Lo-Fi 放松电台 · 学习 / 睡前',
      summary: '一边听一边读，让节奏慢下来。',
      video: 'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1Ei4y1j7CG&p=1&high_quality=1&danmaku=0&autoplay=1' },
    { id: 'h_video_2', type: 'video', tag: '自然白噪', title: '窗外雨声 · 助眠白噪音',
      summary: '关灯，戴上耳机，让雨声替你按暂停。',
      video: 'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1ji4y1Y77p&p=1&high_quality=1&danmaku=0&autoplay=1' }
  ];

  /* ---------- 心情模块：治愈金句素材库（跨来源，随机降重） ---------- */
  const HEALING = [
    { cat: '诗词', t: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。', a: '苏轼' },
    { cat: '诗词', t: '但愿人长久，千里共婵娟。', a: '苏轼' },
    { cat: '诗词', t: '行到水穷处，坐看云起时。', a: '王维' },
    { cat: '诗词', t: '采菊东篱下，悠然见南山。', a: '陶渊明' },
    { cat: '诗词', t: '海内存知己，天涯若比邻。', a: '王勃' },
    { cat: '诗词', t: '会当凌绝顶，一览众山小。', a: '杜甫' },
    { cat: '诗词', t: '沉舟侧畔千帆过，病树前头万木春。', a: '刘禹锡' },
    { cat: '诗词', t: '人生到处知何似，应似飞鸿踏雪泥。', a: '苏轼' },
    { cat: '诗词', t: '落霞与孤鹜齐飞，秋水共长天一色。', a: '王勃' },
    { cat: '诗词', t: '山重水复疑无路，柳暗花明又一村。', a: '陆游' },
    { cat: '文学', t: '于千万人之中遇见你所遇见的人，没有早一步，也没有晚一步，刚巧赶上了。', a: '张爱玲' },
    { cat: '文学', t: '你若安好，便是晴天。', a: '林徽因' },
    { cat: '文学', t: '愿你出走半生，归来仍是少年。', a: '佚名' },
    { cat: '文学', t: '我走得很慢，但我从不后退。', a: '林肯' },
    { cat: '文学', t: '我们终将相遇，在前方，在更明亮的地方。', a: '佚名' },
    { cat: '文学', t: '生活不止眼前的苟且，还有诗和远方的田野。', a: '高晓松' },
    { cat: '影视', t: '不管前方的路有多苦，只要走的方向正确，都比站在原地更接近幸福。', a: '《千与千寻》' },
    { cat: '影视', t: '不是每一次努力都会有收获，但每一次收获都必须努力。', a: '《练习曲》' },
    { cat: '影视', t: '你现在已经很好了，不需要再为谁变得更好。', a: '《俗女养成记》' },
    { cat: '影视', t: '成长是一笔一笔，把自己重新写一遍。', a: '《小敏家》' },
    { cat: '散文', t: '人间烟火气，最抚凡人心。', a: '佚名' },
    { cat: '散文', t: '慢下来，才能看见桂花是什么时候开的。', a: '佚名' },
    { cat: '散文', t: '把平凡的日子，过出一点甜味来。', a: '佚名' },
    { cat: '散文', t: '万物皆有裂痕，那就是光照进来的地方。', a: '莱昂纳德·科恩' },
    { cat: '心理', t: '你不需要准备好才能开始，开始本身就会让你准备好。', a: '心理学小句' },
    { cat: '心理', t: '允许自己有情绪，是心理健康的开始。', a: '心理学小句' },
    { cat: '心理', t: '你不必为别人的情绪负责，先照顾好自己。', a: '心理学小句' },
    { cat: '心理', t: '焦虑的反面不是平静，而是具体。把大事拆成小事，就不慌了。', a: '心理学小句' },
    { cat: '心理', t: '自我关怀不是放纵，而是像对待好朋友那样对待自己。', a: '心理学小句' },
    { cat: '心理', t: '完成比完美重要，先做完，再做好。', a: '心理学小句' },
    { cat: '治愈', t: '今天的你，已经做得很好了，真的。', a: 'Eras Life・璇' },
    { cat: '治愈', t: '慢慢来，比较快。', a: 'Eras Life・璇' },
    { cat: '治愈', t: '你不是一个人，这世界有很多和你一样温柔的人。', a: 'Eras Life・璇' },
    { cat: '治愈', t: '先爱自己，再去爱这个世界。', a: 'Eras Life・璇' },
    { cat: '治愈', t: '再小的光，也是光。你也是。', a: 'Eras Life・璇' },
    { cat: '治愈', t: '累的时候就停下来，天空不会怪你。', a: 'Eras Life・璇' },
    { cat: '治愈', t: '你值得被好好对待，包括被你自己。', a: 'Eras Life・璇' },
    { cat: '诗词', t: '晚来天欲雪，能饮一杯无？', a: '白居易' },
    { cat: '诗词', t: '春风十里不如你。', a: '冯唐' },
    { cat: '文学', t: '你微微地笑着，不同我说什么话，而我觉得，为了这个，我已等待很久了。', a: '泰戈尔' },
    { cat: '影视', t: '明天又是新的一天。', a: '《飘》' },
    { cat: '散文', t: '世间所有的相遇，都是久别重逢。', a: '佚名' },
    { cat: '心理', t: '把期待降低一点，幸福就会多出来一点。', a: '心理学小句' }
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
        sync: { enabled: false, mode: 'github', token: '', branch: 'main', status: '', lastSync: '', rev: 0, baseRev: 0 }
      },
      todo: { days: {}, cats: TODO_CATS.map(c => ({ id: c.id, name: c.name, icon: c.icon })) },
      words: { days: {}, errors: [], target: { minutes: 20, count: 30 } },
      reading: {
        dailyMin: 60,               // 微信读书同步规则：当日有效阅读时长 ≥60 分钟视为打卡成功
        books: [],                  // 在读书籍 [{id, title, author, pages, progress, cover, at}]
        logs: [],                   // 每日阅读明细 [{id, date, bookId, minutes, page, quote, thought, source, importedAt}]
        finished: [],               // 已读完书籍清单（永久保留）[{id, bookId, title, author, cover, finishedAt, totalMinutes}]
        streak: { current: 0, best: 0, lastCheck: '' }, // 连续打卡天数（未达标则清零）
        sync: { weread: { lastAt: '', lastMinutes: 0, status: 'none', msg: '' } },
        cloud: { bin: '', readKey: '' } // 微信读书自动同步云端中转（JSONBin）：bin id 与读密钥，由用户在阅读模块内填写
      },
      savings: {
        goal: { annual: 0, monthlyLiving: 0, emergency: 0 },
        records: [],
        monthMark: {},
        customFunds: []   // 用户在专项基金中新增的自定义类目
      },
      sleep: {
        std: { bed: '23:00', focus: '22:40', wake: '07:00', redline: '23:30' },
        logs: [], rewards: { mvUnlocked: false, lastUnlock: '' }, penalties: {},
        pet: {
          init: false,            // 是否已完成初次领养
          cur: '',                // 当前正在查看/饲养的宠物 id
          list: [],               // [{id,breed,name,adoptedAt,round}]
          feed: 0,                // 饲料库存（全部宠物共享）
          growth: {},             // {petId: 累计成长值}
          bag: { acc: [], scene: [], fx: [], outfit: [], toy: [], rare: [], medal: [] },
          dress: {},              // {petId:{acc,scene,fx,outfit,toy}}
          done: [],               // 已达成的里程碑 day 数组（永久保留）
          tickets: 1,             // 领养资格券
          cycle: { start: '', round: 1, rounds: 0 },
          cfg: { len: 90, days: [3, 7, 14, 21, 30, 45, 60, 75, 90], feedGood: 3, feedMid: 1, growthPerFeed: 10, lvUp: 100 },
          nameOv: {},             // 里程碑奖励改名：{day:{name,desc}}
          lastFeedDate: '',       // 上次自动发饲料的日期
          log: []                 // 最近动态（最多 30 条）
        }
      },
      mood: { logs: [], favs: [], recent: [], heal: [] },
      review: { months: {} },
      customData: {},
      weatherCache: null, newsCache: null,
      hot: { list: [], updated: 0 },
      fav: { list: [] }
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
    // 云养萌宠：补结算里程碑（断签不回收，已解锁永久保留）
    if (S.sleep.pet && S.sleep.pet.init) petSync();
    // 阅读打卡：旧默认 30 分钟迁移到 60 分钟
    if (S.reading && S.reading.dailyMin === 30) S.reading.dailyMin = 60;
    // 阅读打卡：旧 JSONBin 云端配置已废弃，清除残留避免状态行显示过期 bin
    if (S.reading && S.reading.cloud) { S.reading.cloud.bin = ''; S.reading.cloud.readKey = ''; }
    // 阅读打卡：刷新连续天数（未达标自动清零）
    readingCheck(today);
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

  /* ---------- 专项基金：基础 4 个 + 用户自定义类目（编辑/新增后同步生效） ---------- */
  function allFunds() {
    const S = K.Store.data;
    const overrides = (S.savings && S.savings.baseFundOverrides) || {};
    const custom = (S.savings && S.savings.customFunds) || [];
    return FUNDS.map(f => ({ id: f.id, name: overrides[f.id] || f.name, icon: f.icon, c: f.c }))
      .concat(custom.map(f => ({ id: f.id, name: f.name, icon: f.icon || 'i-sparkle', c: f.c || '#B197F0' })));
  }

  /* =========================================================
     阅读 · 逻辑（微信读书同步 + 60 分钟打卡 + 连续天数）
     ========================================================= */
  function readingToday() {
    const today = K.dstr();
    return K.Store.data.reading.logs.filter(l => l.date === today).reduce((s, l) => s + K.num(l.minutes), 0);
  }
  function readingDay(date) {
    return K.Store.data.reading.logs.filter(l => l.date === date).reduce((s, l) => s + K.num(l.minutes), 0);
  }
  /* 计算连续打卡天数：当日必须达标，否则 current=0；达标后往前连续累加 */
  function readingStreak() {
    const R = K.Store.data.reading, today = K.dstr();
    if (readingDay(today) < R.dailyMin) return { current: 0, best: Math.max(R.streak.best || 0, 0), checked: 1 };
    let ds = K.addDays(today, -1), streak = 1;
    while (true) {
      const min = readingDay(ds);
      if (min >= R.dailyMin) { streak++; ds = K.addDays(ds, -1); }
      else break;
    }
    return { current: streak, best: Math.max(R.streak.best || 0, streak), checked: 1 };
  }
  /* 检查并刷新连续打卡状态：通常由 runDailyJobs 每日调用一次 */
  function readingCheck(today) {
    const R = K.Store.data.reading;
    if (!R.streak) R.streak = { current: 0, best: 0, lastCheck: '' };
    if (R.streak.lastCheck === today) return R.streak;
    const info = readingStreak();
    R.streak.current = info.current;
    R.streak.best = info.best;
    R.streak.lastCheck = today;
    K.Store.save();
    return R.streak;
  }
  /* 添加一条阅读记录，自动结算连续打卡、已读完书籍（由 progress=100 触发） */
  function readingAddLog(opt) {
    const S = K.Store.data, R = S.reading, today = opt.date || K.dstr();
    const log = { id: K.uid(), date: today, bookId: opt.bookId || '', minutes: K.num(opt.minutes) || 0, page: K.num(opt.page) || 0, quote: opt.quote || '', thought: opt.thought || '', source: opt.source || 'manual', importedAt: opt.importedAt || '' };
    R.logs.push(log);
    // 若指定了书籍且页码达到总页数，则移入已读完书单
    if (log.bookId) {
      const b = R.books.find(x => x.id === log.bookId);
      if (b) {
        b.progress = Math.max(b.progress || 0, Math.min(log.page, b.pages));
        if (b.progress >= b.pages && b.pages > 0) {
          const exist = R.finished.find(x => x.bookId === b.id);
          if (!exist) {
            const totalMin = R.logs.filter(l => l.bookId === b.id).reduce((s, l) => s + K.num(l.minutes), 0);
            R.finished.push({ id: K.uid(), bookId: b.id, title: b.title, author: b.author, cover: b.cover || '', finishedAt: today, totalMinutes: totalMin });
          }
        }
      }
    }
    readingCheck(today);
    K.Store.save();
    return log;
  }
  /* 从微信读书同步数据：data = { date, minutes, books:[{bookId,title,author,cover,progress,totalMinutes,finished}] } */
  function readingSyncFromWeread(data) {
    const R = K.Store.data.reading, today = data.date || K.dstr();
    let addedMin = 0;
    // 按日期写入/合并阅读时长
    if (K.num(data.minutes) > 0) {
      const exists = R.logs.filter(l => l.date === today && l.source === 'weread');
      const existMin = exists.reduce((s, l) => s + K.num(l.minutes), 0);
      if (data.minutes > existMin) {
        const delta = data.minutes - existMin;
        R.logs.push({ id: K.uid(), date: today, bookId: '', minutes: delta, page: 0, quote: '', thought: '', source: 'weread', importedAt: new Date().toISOString() });
        addedMin += delta;
      }
    }
    // 同步在读书籍进度
    (data.books || []).forEach(wb => {
      let b = R.books.find(x => x.bookId === wb.bookId);
      if (!b) {
        b = { id: K.uid(), bookId: wb.bookId || '', title: wb.title || '未命名书籍', author: wb.author || '', pages: K.num(wb.pages) || 100, cover: wb.cover || '', progress: 0, at: today };
        R.books.push(b);
      }
      b.progress = Math.max(b.progress || 0, K.num(wb.progress));
      if (wb.cover) b.cover = wb.cover;
      if (wb.finished || b.progress >= b.pages) {
        b.progress = b.pages;
        const bid = b.bookId || b.id;
        const exist = R.finished.find(x => x.bookId === bid);
        if (!exist) {
          const totalMin = R.logs.filter(l => l.bookId === b.id).reduce((s, l) => s + K.num(l.minutes), 0) + K.num(wb.totalMinutes || 0);
          R.finished.push({ id: K.uid(), bookId: bid, title: b.title, author: b.author, cover: b.cover, finishedAt: today, totalMinutes: totalMin });
        }
      }
    });
    readingCheck(today);
    R.sync.weread = { lastAt: new Date().toISOString(), lastMinutes: readingToday(), status: 'ok', msg: '本次同步新增 ' + addedMin + ' 分钟' };
    K.Store.save();
    return addedMin;
  }
  /* 今日数据 */
  function readingReportToday() {
    const R = K.Store.data.reading, today = K.dstr();
    const min = readingToday();
    return { date: today, minutes: min, goal: R.dailyMin, done: min >= R.dailyMin, streak: readingStreak() };
  }
  /* 本周汇总（周一到今天） */
  function readingReportWeek() {
    const R = K.Store.data.reading, today = K.dstr();
    const dow = (new Date(today + 'T00:00:00').getDay() + 6) % 7; // 0=周一
    const mon = K.addDays(today, -dow);
    const days = [];
    let total = 0, okDays = 0;
    for (let i = 0; i < 7; i++) {
      const ds = K.addDays(mon, i);
      const min = readingDay(ds);
      const isFuture = ds > today;
      if (!isFuture) { total += min; if (min >= R.dailyMin) okDays++; }
      days.push({ date: ds, day: ['一', '二', '三', '四', '五', '六', '日'][i], minutes: min, done: min >= R.dailyMin, future: isFuture });
    }
    return { total, okDays, goalTotal: R.dailyMin * 7, days };
  }
  /* 月度报告 */
  function readingReportMonth(ms) {
    const R = K.Store.data.reading, month = ms || K.dstr().slice(0, 7);
    const list = R.logs.filter(l => l.date.slice(0, 7) === month);
    const total = list.reduce((s, l) => s + K.num(l.minutes), 0);
    const days = new Set(list.map(l => l.date)).size;
    const okDays = [];
    const dim = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const ds = month + '-' + String(d).padStart(2, '0');
      if (readingDay(ds) >= R.dailyMin) okDays.push(ds);
    }
    return { month, total, days, okDays: okDays.length, finished: R.finished.filter(x => (x.finishedAt || '').slice(0, 7) === month).length };
  }

  /* =========================================================
     云养萌宠 · 逻辑
     ========================================================= */
  function petData() { return K.Store.data.sleep.pet; }
  function petCfg() { return Object.assign({}, PET_CFG, petData().cfg || {}); }
  function breedOf(id) { return PET_BREEDS.find(b => b.id === id) || PET_BREEDS[0]; }

  /* 累计早睡达标天数（决定成长形态，断签不影响） */
  function petTotalDays() {
    return K.Store.data.sleep.logs.filter(l => l.state === 'good').length;
  }
  function petStage(total) {
    const t = total == null ? petTotalDays() : total;
    let s = PET_STAGES[0];
    PET_STAGES.forEach(x => { if (t >= x.need) s = x; });
    return s;
  }
  /* 距离下一形态 */
  function petNextStage(total) {
    const t = total == null ? petTotalDays() : total;
    return PET_STAGES.find(x => t < x.need) || null;
  }

  /* 里程碑列表：合并后台配置的天数与改名覆盖 */
  function petMilestones() {
    const P = petData(), cfg = petCfg(), ov = P.nameOv || {};
    return PET_MILESTONES.map((m, i) => {
      const day = K.num(cfg.days[i] != null ? cfg.days[i] : m.day);
      const o = ov[m.id] || {};
      return Object.assign({}, m, { day: day, name: o.name || m.name, desc: o.desc || m.desc });
    }).sort((a, b) => a.day - b.day);
  }

  /* 当前宠物 */
  function petCur() {
    const P = petData();
    if (!P.list.length) return null;
    return P.list.find(p => p.id === P.cur) || P.list[0];
  }
  function petLv(pid) {
    const P = petData(), cfg = petCfg();
    const g = K.num(P.growth[pid] || 0);
    return { g: g, lv: Math.floor(g / cfg.lvUp) + 1, cur: g % cfg.lvUp, need: cfg.lvUp };
  }
  function petLog(text) {
    const P = petData();
    P.log.unshift({ t: K.dstr() + ' ' + new Date().toTimeString().slice(0, 5), x: text });
    if (P.log.length > 30) P.log.length = 30;
  }

  /* 结算：里程碑 + 周期完成。返回本次新解锁的里程碑数组 */
  function petSync() {
    const P = petData();
    if (!P.init) return [];
    const streak = sleepStreak(), cfg = petCfg(), list = petMilestones(), got = [];
    list.forEach(m => {
      if (streak >= m.day && P.done.indexOf(m.id) < 0) {
        P.done.push(m.id);
        got.push(m);
        if (m.type === 'feed') P.feed += K.num(m.gain || 10);
        else if (m.type === 'rare') {
          if (P.bag.rare.indexOf(m.id) < 0) P.bag.rare.push(m.id);
          if (P.bag.medal.indexOf('medal_r' + P.cycle.round) < 0) P.bag.medal.push('medal_r' + P.cycle.round);
        } else if (P.bag[m.type] && P.bag[m.type].indexOf(m.id) < 0) P.bag[m.type].push(m.id);
        petLog('解锁里程碑：' + m.name);
      }
    });
    // 一轮全部里程碑达成 → 发放新品种领养资格，周期进入下一轮
    const all = list.every(m => P.done.indexOf(m.id) >= 0);
    if (all && streak >= cfg.len && P.cycle.rounds < P.cycle.round) {
      P.cycle.rounds = P.cycle.round;
      P.cycle.round += 1;
      P.tickets += 1;
      P.done = [];                    // 新一轮里程碑重新计数（奖励已永久入库）
      P.cycle.start = K.dstr();
      petLog('完成第 ' + P.cycle.rounds + ' 轮 ' + cfg.len + ' 天周期，获得 1 张新品种领养资格');
      got.push({ type: 'round', name: '周期通关', day: cfg.len, emo: '🏆', desc: '获得新品种领养资格 ×1' });
    }
    K.Store.save();
    return got;
  }

  /* 每日打卡自动发饲料（同一天只发一次） */
  function petDailyFeed(state) {
    const P = petData(), cfg = petCfg(), today = K.dstr();
    if (!P.init) return 0;
    if (P.lastFeedDate === today) return 0;
    const n = state === 'good' ? K.num(cfg.feedGood) : state === 'mid' ? K.num(cfg.feedMid) : 0;
    if (n <= 0) return 0;
    P.feed += n; P.lastFeedDate = today;
    petLog('早睡打卡领取饲料 ×' + n);
    K.Store.save();
    return n;
  }

  w.D = {
    MODULES, ICON_CHOICES, TODO_CATS, PRI, EXP_CATS, INC_CATS, FUNDS, MOODS, QUOTES,
    BOOK_RECS, ARTICLE_RECS, MV_LIST, WMO, hasCN, HOTSPOTS, HEALING,
    PET_BREEDS, PET_STAGES, PET_MILESTONES, PET_CFG, PET_TALK, PET_CHEER,
    defaults, ensureTodoDay, runDailyJobs, sleepStreak, wordStreak,
    todoRate, weekTodoRate, savedTotal, monthStat, rankOf, allFunds,
    readingToday, readingDay, readingStreak, readingCheck, readingAddLog, readingSyncFromWeread,
    readingReportToday, readingReportWeek, readingReportMonth,
    petData, petCfg, breedOf, petTotalDays, petStage, petNextStage,
    petMilestones, petCur, petLv, petLog, petSync, petDailyFeed
  };
})(window);
