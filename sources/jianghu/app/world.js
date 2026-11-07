// The world: eight rooms of 雪亭镇 (Snow Pavilion Town) around the 饮风客栈 inn, the people in them and one errand.
// Rooms, details and most NPC lines are taken from ES2 (东方故事2) by Annihilator, MIT — see SOURCE.md; turned into
// simplified Chinese and trimmed. 说书的李先生 is only named in ES2 (the waiter wonders how he is); here he sits in the
// herb shop, and the errand around him is this App's own.

export const START = 'inn_hall'

/** Directions: what a command may say, and how the room text names it. */
export const DIRS = {
  east: { name: '东', words: ['东', '东边', 'e', 'east'] },
  west: { name: '西', words: ['西', '西边', 'w', 'west'] },
  south: { name: '南', words: ['南', '南边', 's', 'south'] },
  north: { name: '北', words: ['北', '北边', 'n', 'north'] },
}
export const BACK = { east: 'west', west: 'east', south: 'north', north: 'south' }

export const ROOMS = {
  inn_kitchen: {
    name: '厨房',
    long: '这里是一间宽敞的厨房，一座大灶占据了东边半个墙壁，南边的柜子整整齐齐地放着许多锅碗瓢盆。这里平常是相当忙碌的，如果你要在这里东张西望的话，最好小心别被店小二端着的热汤给烫到了。往东可以回到客栈里。',
    details: {
      柜子: '这些柜子里放的是给客人用的碗盘碟筷，分门别类装在几个大柜子里，柜子的门都拆了，想是方便取用。',
      大灶: '一座燃烧着熊熊炭火的大灶，灶口可以容纳一个汉子爬进去，不过白天炭火烧得正热，当然不会有人干这种傻事。',
    },
    exits: { east: 'inn_hall' },
  },
  inn_hall: {
    name: '客栈大堂',
    long: '这里是一家客栈的大堂，老旧的桌椅因为经年的使用而变得乌黑黝亮。西边隔着一层竹帘隐隐传来一阵阵锅铲的声音，大概是客栈的厨房。靠北边的墙壁边上有一道通往二楼雅座的楼梯，楼梯下就是柜台。东边是客栈的出口，门口一串纸糊灯笼随风摇摆，上面写着「饮风客栈」：意思是即使你没有钱，也欢迎来这里聊天听书，喝西北风。',
    details: {
      酒缸: '你仔细地瞧了瞧酒缸上贴的红纸，不得了，有延德年间的高粱，京城廖麻子酒坊火漆封印的「拔舌酒」，有四季红的一品醉美人，还有好几坛贴着西郊大鼓楼的陈年老酒。',
      灯笼: '一串纸糊的大灯笼高高地挂在屋前的旗杆上，共是五个，分别写着「饮风客栈」四个大字，最下面的灯笼画着一个葫芦。',
      桌椅: '这些桌椅零零散散地放置在客栈的厅中，看来相当老旧了。',
      楼梯: '这道楼梯通往二楼的雅座跟客房。',
      竹帘: '竹帘用来隔开客人用膳跟厨房的炉灶，但是挡不住从厨房飘出来的香气。',
      柜台: '柜台后面陈列着一坛坛贴着红纸条的酒缸，这些是客栈掌柜视如性命的陈年老酒。',
    },
    exits: { west: 'inn_kitchen', east: 'square_w' },
  },
  square_w: {
    name: '广场西',
    long: '这里是雪亭镇广场的西边，往东可以看见广场中央的大榕树。一家小客栈坐落在西边不远处，客栈前的一串灯笼上写着「饮风客栈」四个大字。广场上铺着整齐的石板，在这样的小镇通常是因为驿站的缘故才会费事铺设。',
    details: {
      石板: '一块块青石板铺得整整齐齐，缝里长着些青苔。',
      灯笼: '客栈门前的一串纸糊灯笼，写着「饮风客栈」四个大字。',
    },
    exits: { west: 'inn_hall', east: 'square' },
  },
  square: {
    name: '广场中央',
    long: '这里是雪亭镇广场的中央，一株巨大的老榕树盘根错结地站在中央，一些孩童常常爬上这株老榕嬉戏。榕树下七横八竖地放着几张长凳供人歇息聊天，树旁还有一个水缸供路人取水解渴。',
    details: {
      榕树: '这株榕树少说也有两三百岁了，一条条长长的须根几乎垂到地面，树干因为经常被人抚摸而显得光滑。',
      长凳: '十分普通常见的长凳，如果你累了，不必客气，尽管坐下来休息。',
      水缸: '一口大水缸，水面上漂着一只木瓢。',
    },
    exits: { west: 'square_w', east: 'square_e', north: 'square_n' },
  },
  square_n: {
    name: '广场北',
    long: '这里是雪亭镇广场北边，平常是附近孩童嬉戏游玩的地方，初一十五则是市集的所在。往南可以看见一株大榕树，往北则是一条笔直的街道。',
    details: {
      街道: '一条笔直的街道通往镇北的山路，今天没有市集，冷冷清清的。',
    },
    exits: { south: 'square' },
  },
  square_e: {
    name: '广场东',
    long: '这里是雪亭镇广场东边，往东是一条僻静的巷子，西边有一株高大的榕树，南边是一家打铁铺子，不过店门不在这一边。',
    details: {
      打铁铺子: '隔着墙也听得见叮叮当当的打铁声。',
    },
    exits: { west: 'square', east: 'epath' },
  },
  epath: {
    name: '僻静小巷',
    long: '这里是条僻静的小巷子，往西不远处通往雪亭镇的广场。小巷的北面是一些瓦屋，围绕着高高的围墙，看来是有钱人的屋子；南边有家小药铺，门口挂了好些晒干的药草。',
    details: {
      围墙: '这间屋子的围墙看起来相当高，不过如果你跳起来的话勉强可以够得着。',
      药草: '一束束晒干的药草挂在药铺门口，闻起来有股甘草味。',
    },
    exits: { west: 'square_e', south: 'herb_shop' },
  },
  herb_shop: {
    name: '小药铺',
    long: '这里是一间小药铺，连像样一点的招牌都没有，只在门边挂着一块不甚起眼的木牌，上面写着「顺生堂」三个字。老旧的柜台后面陈列着一列药柜，药柜的每个抽屉按药铺的规矩都没有任何标签。西面的墙上吊着几束晒干的甘草，角落里摆着一张旧躺椅。',
    details: {
      药柜: '药柜的每个抽屉都没有标签，只有药铺掌柜自己知道哪个抽屉放什么。',
      甘草: '像这种小药铺没有钱烧檀香祛除药味，只好用甘草替代。',
      躺椅: '一张竹编的旧躺椅，看来是给病人歇脚用的。',
    },
    exits: { north: 'epath' },
  },
}

/**
 * People of the town. `topics`: what asking about a word gets (the first key found in what was asked); `idle`: the
 * answer to anything else. Deterministic — every page and every agent's call says the same.
 */
export const NPCS = {
  waiter: {
    name: '店小二', words: ['小二', 'waiter'], room: 'inn_hall',
    long: '一个约二十出头的年轻小伙计，正忙进忙出招呼客人。',
    idle: '客官今天怎么有空，最近可有新鲜事能说来听听吗？',
    topics: {
      李先生: 'quest',
      说书: 'quest',
      酒: 'quest',
      送: 'quest',
      帮忙: 'quest',
      掌柜: '掌柜？在柜台后头打算盘呢，那几坛老酒他可宝贝得紧。',
      菜: '今天有包子、馒头、红烧肉，还有刚出炉的烤鸡！',
      天气: '这几天天气不错，真想出去走走。',
    },
  },
  innkeeper: {
    name: '掌柜', words: ['innkeeper', 'keeper'], room: 'inn_hall',
    long: '这位便是这家客栈的掌柜，看起来福福泰泰像是个老好人。',
    idle: '欢迎！欢迎！请里面坐！',
    topics: {
      酒: '柜台后头那几坛可是小老儿的命根子，不卖不卖。厨房那壶倒是给李先生留的。',
      李先生: '李先生在小店说书说了二十年，这回受了风寒，在顺生堂歇着。小二会跟你说。',
      顺生堂: '出门往东过了广场，进那条僻静小巷，南边就是。',
      药铺: '出门往东过了广场，进那条僻静小巷，南边就是。',
    },
  },
  gammer: {
    name: '瞎眼老太婆', words: ['老太婆', '婆婆', 'gammer'], room: 'square',
    long: '一个瞎了眼睛的老太婆，满脸皱纹，但是却给人一种亲切的感觉。',
    idle: '阿宝？是你吗？',
    topics: {
      阿宝: '阿宝那孩子，又不知道跑哪儿玩去了……',
      李先生: '李先生的书说得好啊，老婆子眼睛看不见，耳朵可灵着呢。',
    },
  },
  junkman: {
    name: '拾荒老头', words: ['老头', 'junkman'], room: 'square',
    long: '一个佝偻的拾荒老头，靠捡拾废物维生。',
    idle: '老头儿弯着腰在石板缝里找东西，头也不抬：「有不要的东西，给我就是了。」',
    topics: {
      石头: '石头？广场西边多的是，那可不值钱。',
    },
  },
  child: {
    name: '小孩', words: ['孩子', 'child'], room: 'square_n',
    long: '一个流着鼻涕的小孩，睁着一双无邪的眼睛望着你。',
    idle: '小孩吸了吸鼻涕，睁着一双无邪的眼睛望着你。',
    topics: {
      阿宝: '阿宝姐姐刚才还在榕树上呢！',
      榕树: '我能爬到最高那根枝子上！',
    },
  },
  herbalist: {
    name: '药铺掌柜', words: ['药铺老板', 'herbalist'], room: 'herb_shop',
    long: '药铺掌柜的是位胖胖的中年男子，虽然年纪有四五十岁了，不过看起来依然红光满面、精神焕发。',
    idle: '客官要抓什么药？',
    topics: {
      李先生: '李先生受了风寒，在躺椅上歇着。喝点酒驱驱寒，倒也无妨。',
      药: '小店的药柜没有标签，客官要什么，说给我听就是。',
    },
  },
  storyteller: {
    name: '李先生', words: ['说书先生', '说书的', 'storyteller', 'li'], room: 'herb_shop',
    long: '一位清瘦的老先生，裹着厚厚的棉袍半躺在躺椅上，手里还捏着一块惊堂木。',
    idle: '咳咳……老朽这嗓子，怕是好些日子说不了书了。',
    topics: {
      说书: '等老朽好了，回饮风客栈给大家说一段《雪亭镇外三把刀》。',
      酒: '饮风客栈的酒？老朽可想得紧……',
    },
  },
}

/** Things that can be picked up, and where each lies when a world begins. */
export const ITEMS = {
  hulu: {
    name: '酒葫芦', words: ['葫芦', '酒', 'gourd', 'hulu'], at: 'inn_kitchen',
    long: '一只红漆酒葫芦，塞子封得紧紧的，摇一摇咣当作响，闻得到一股陈年老酒的香气。葫芦上贴着一张红纸：「李先生」。',
    lying: '大灶边上放着一只红漆酒葫芦。',
  },
  stone: {
    name: '石头', words: ['石块', 'stone'], at: 'square_w',
    long: '一块拳头大小的石头，不知是谁从石板路上撬下来的。',
    lying: '地上有一块石头。',
  },
}

/** The errand: the waiter asks for it, the storyteller ends it. */
export const QUEST = {
  name: '给李先生送酒',
  ask: '说书的李先生病了好几天了。掌柜要我送一壶老酒去顺生堂给他驱寒，可店里实在离不开人……酒葫芦就在厨房大灶边上，劳驾客官替我跑一趟？出门往东过了广场，进僻静小巷，南边就是顺生堂。',
  again: '酒葫芦在厨房大灶边上，送到顺生堂交给李先生就成，多谢客官！',
  done: '李先生已经收到酒了？多谢客官！改天来听书，小的给您留个好座儿。',
  given: '李先生接过酒葫芦，拔开塞子闻了闻，眼睛一亮：「好酒！是饮风客栈的拔舌酒！」他抿了一口，咳嗽也止了几分，一拍惊堂木：「诸位，老朽病中无以为报，就给诸位说上一段——话说那雪亭镇外，有三把刀……」',
  hint: ['问问客栈大堂的店小二有没有要帮忙的（问 店小二 李先生）', '到西边厨房拿酒葫芦（拿 酒葫芦）', '去小药铺把酒葫芦交给李先生（给 李先生 酒葫芦）'],
}
