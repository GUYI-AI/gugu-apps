// Generated from ES2 Mudlib (MIT, (c) Annihilator / Ted Chang) — see SOURCE.md. Rooms, people and things of
// 雪亭镇 as data, turned into simplified Chinese. What they do when used is in story.js.
export const ROOMS = {
 "bazar": {
  "name": "鱼记小铺",
  "long": "这里是一间小店铺, 右侧摆了个长架, 不甚起眼的几件日常用品零零疏疏地摆在架上, 你看到了有瓶罐, 棉被, 碗盘竹筷等杂物, 不过上面隐隐有些灰尘黄土, 似乎这儿老板不常清扫. 正厅有个大圆桌, 上面摆了些布匹服饰. 左侧有个高大的柜台, 上面横挂了个匾额  (look 匾额 ), 看来像是个小钱庄.",
  "details": {
   "匾额": "『\t小\t鱼\t吃\t四\t海金\t银\t文\t都\t来\t』存款：\tdeposit  <数量> <钱币>,\t开户：\topen account 提款：\twithdraw <数量> <钱币>,\t兑换：\tconvert <数量> <钱币> to <另类钱币>金契请妥善保管，如有遗失，至本庄补发，需扣一成保证金。",
   "柜台": "一座漆黑红杉所锯雕而成, 散发出一种浓郁的杉木味, 看来价值不斐."
  },
  "exits": {
   "西": "sstreet1"
  },
  "spawn": {
   "yu": 1
  }
 },
 "bug_room": {
  "name": "小广场",
  "long": "这里是个小广场，几棵树稀稀落落的长在附近，中央有个小型的留言版，可供民众回报所遭遇的怪异现象，往南可回到人声鼎沸的雪亭镇广场。",
  "exits": {
   "南": "square_w"
  },
  "noFight": true,
  "outdoors": true
 },
 "court": {
  "name": "乡校",
  "long": "这里是雪亭镇的乡校，平常镇民对官府的施政有什么不满的可以到这里来向校老申诉，所谓的校老就是地方上有德行与声望的老人，今年担任校老的是开磨坊的杨老爹，但是他最近身体不是很好，并不常到乡校里来，往南是街道，北边是一间衙堂，当县里派师爷来这里断事就会在那里开堂。",
  "exits": {
   "南": "wstreet3"
  },
  "spawn": {
   "oldman": 1
  },
  "outdoors": true
 },
 "ebridge": {
  "name": "木桥",
  "long": "你现在来到一条横过山涧的木桥上。山涧虽不甚宽，但是深度却有三、四丈，是雪亭镇上居民主要的饮用水源。木桥连通溪边小路和东边的山路，桥面已经有些年头了，不过看起来还算坚固。桥下的溪水正发出轰隆轰隆的巨响流过溪谷，往西是雪亭镇，往东则通往著名的雪吟山庄。",
  "exits": {
   "西": "npath3"
  },
  "spawn": {
   "guard": 2
  },
  "outdoors": true
 },
 "egate": {
  "name": "河边",
  "long": "破旧大宅外，你眼前是两条河流的汇流处，来自西北、东北的两条小河汇流后，缓缓的向西南流去。西北边的河流上有一座小桥，过了桥，沿着东北边河流的小石子路可以通往李家村。",
  "details": {
   "小桥": "一座巨桧木切削搭成的木桥."
  },
  "exits": {
   "西": "ruin1"
  },
  "outdoors": true
 },
 "epath": {
  "name": "僻静小巷",
  "long": "这里是条僻静的小巷子，往西不远处通往雪亭镇的广场，小巷的北面是一些瓦屋，围绕着高高的围墙，看来是有钱人的屋子，南边有家小药铺，门口挂了好些晒干的药草，小巷往东是个转角。",
  "details": {
   "围墙": "这间屋子的围墙看起来相当高，不过如果你跳起来的话勉强可以搆得着。"
  },
  "exits": {
   "东": "lane1",
   "西": "square_e",
   "南": "herb_shop"
  },
  "outdoors": true
 },
 "fireplace": {
  "name": "大灶内",
  "long": "你现在正蜷缩着挤在一个大灶之中, 头顶上方隐隐可看到烟囱的出口, 不过显然没有办法爬出去, 这里的墙壁因为长年烧火而变得乌黑,地面上积了一层厚厚的柴灰.",
  "exits": {
   "出去": "inn_kitchen"
  },
  "spawn": {
   "woodsword": 1,
   "woodblade": 1
  }
 },
 "herb_shop": {
  "name": "小药铺",
  "long": "这里是一间小药铺，连像样一点的招牌都没有，只在门边挂着一块不甚起眼的木牌，上面写着「顺生堂」三个字，老旧的柜台后面陈列着一列药柜，药柜的每个抽屉按药铺的规矩都没有任何标签，西面的墙上吊着几束晒干的甘草，像这种小药铺没有钱烧檀香祛除药味，只好用甘草替代。",
  "exits": {
   "北": "epath"
  },
  "spawn": {
   "herbalist": 1
  }
 },
 "inn_hall": {
  "name": "客栈大堂",
  "long": "这里是一家客栈的大堂，老旧的桌椅因为经年的使用而变得乌黑黝亮。西边隔着一层竹帘隐隐传来一阵阵锅铲的声音，大概是客栈的厨房。靠北边的墙壁边上有一道通往二楼雅座的楼梯，楼梯下就是柜台。东边是客栈的出口，门口一串纸糊灯笼随风摇摆，上面写着「饮风客栈」：意思是即使你没有钱，也欢迎来这里聊天听书，喝西北风。西南边有一扇木门通往客栈后面的马房。",
  "details": {
   "酒缸": "你仔细地瞧了瞧酒缸上贴的红纸，不得了，有延德年间的高粱，京城廖痲子酒坊火漆封印的「拔舌酒」，有四季红的一品醉美人，还有好几坛贴着西郊大鼓楼的陈年老酒。",
   "灯笼": "一串纸糊的大灯笼高高地挂在屋前的旗杆上，共是五个，分别写着「饮风客栈」四个大字，最下面的灯笼画着一个葫芦。",
   "桌椅": "这些桌椅零零散散地放置在客栈的厅中，看来相当老旧了。",
   "楼梯": "这道楼梯通往二楼的雅座跟客房。",
   "竹帘": "竹帘用来隔开客人用膳跟厨房的炉灶，但是挡不住从厨房飘出来的香气。",
   "柜台": "柜台后面陈列着一坛坛贴着红纸条的酒缸，这些是客栈掌柜视如性命的陈年老酒，如果你有兴趣，不妨问问掌柜有关这些陈年老酒卖是不卖。"
  },
  "exits": {
   "西": "inn_kitchen",
   "东": "square_w"
  },
  "spawn": {
   "waiter": 1,
   "innkeeper": 1
  },
  "doors": {
   "东": {
    "name": "客栈大门",
    "closed": true
   }
  },
  "noFight": true,
  "start": true
 },
 "inn_kitchen": {
  "name": "厨房",
  "long": "这里是一间宽敞的厨房，一座大灶占据了东边半个墙壁，南边的柜子整整齐齐地放着许多锅碗瓢盆，这里平常是相当忙碌的，如果你要在这里东张西望的话，最好小心别被店小二端着的热汤给烫到了，往东可以回到客栈里。",
  "details": {
   "柜子": "这些柜子里放的是给客人用的碗盘碟筷，分门别类装在几个大柜子里，柜子的门都拆了，想是方便取用。",
   "大灶": "一座燃烧着熊熊炭火的大灶，灶口可以容纳一个汉子爬进去，不过白天炭火烧得正热，当然不会有人干这种傻事。"
  },
  "exits": {
   "东": "inn_hall"
  },
  "doors": {
   "东": {
    "name": "木板门",
    "closed": false
   }
  }
 },
 "inn_staff_room": {
  "name": "客栈人员休息室",
  "long": "这里是饮风客栈后院的员工休息室，供 NPC 员工休息和放松。普通玩家无法进入这里，巫师可以在这里休息，或者和 NPC 员工聊天，了解客栈的内部运作。",
  "exits": {},
  "noFight": true
 },
 "kitchen": {
  "name": "厨房",
  "long": "你现在正在一户有钱人家的厨房里，不过和你想像中的有钱人家厨房好像不太一样，并没有堆满了鸡鸭鱼肉跟山珍海味，想来有钱人也是省吃俭用才能有钱的，厨房的门在你的南边，不过锁住了，东边则是你进来的围墙。",
  "exits": {},
  "spawn": {
   "stock/dumpling": 2
  }
 },
 "lane1": {
  "name": "僻静小巷",
  "long": "这里是条僻静小巷的转角处，小巷往北可以通往溪边，从这里就可以听到溪流轰轰的声音，东边是一栋破旧的大宅院，门口的一的破匾写着「长乐侯府」，不过里面已经是断垣残璧了，小巷南边有一座小土地公庙。",
  "exits": {
   "北": "lane2",
   "西": "epath",
   "东": "ruin1"
  },
  "outdoors": true
 },
 "lane2": {
  "name": "溪边小路",
  "long": "你现在来到一处巷子的入口，往北通往一条溪边的小路，西边是一栋大瓦屋，大门深锁着，东边有一家磨坊，磨坊屋旁一个水车正辘辘地转着，往南通往巷子里的一个转角。",
  "details": {
   "大瓦屋": "一间高大的瓦屋，在雪亭镇这样的山间小镇而言，这样的屋子并不多见，可算得上是有钱人家。",
   "水车": "这架水车是磨坊动力的来源，平常溪水丰沛的季节就直接用水力，一到秋冬枯水季节，就得雇工人用脚踩。",
   "磨坊": "一家用水车辗面粉的磨坊，磨坊的门是关着的，不过从里面传来的声音判断，应该有工人正在里面工作。"
  },
  "exits": {
   "南": "lane1",
   "北": "npath3"
  },
  "outdoors": true
 },
 "mill": {
  "name": "磨坊",
  "long": "这里是一间以磨面粉为业的磨坊，屋子里一大半的空间被一架水车占据，水车转动横过屋梁上的木轴，木轴推动几个绞盘转动屋子中央的石磨，房子的另一角堆放着一些空的麻袋。",
  "exits": {
   "出去": "lane2"
  },
  "spawn": {
   "miller": 1
  }
 },
 "ngate": {
  "name": "山路",
  "long": "你现在正走在一条蜿蜒的山路上，往南不远处可以看见许多人家和房舍，往北则通往山上，山路两旁长满杂草，靠西的一面是山壁，东边是平缓的山坡，山坡尽头是一片草地。",
  "exits": {
   "南": "nstreet2"
  },
  "spawn": {
   "garrison": 4,
   "lieutenant": 1
  },
  "outdoors": true,
  "edge": true
 },
 "npath1": {
  "name": "小路",
  "long": "这里是一条黄土小路，往西可以回到雪亭镇的主要街道，北边是一片草地，草地尽头则是一片树林，往东你可以听到淙淙的水声，不远处可以望见一条山溪。",
  "exits": {
   "东": "npath2",
   "西": "nstreet2"
  },
  "outdoors": true
 },
 "npath2": {
  "name": "溪边小路",
  "long": "这里是一条溪边的小路，从这里可以望见北边的山间一道瀑布从崖上垂下，穿过山坡上的一片树林，以及不远处的草地，往你的东南边流过，溪水冲激着溪床的岩石，发出轰轰的响声，往西沿着小路可以回到雪亭镇的大街，小路向东南可以通往溪边。",
  "exits": {
   "东南": "npath3",
   "西": "npath1"
  },
  "spawn": {
   "woman": 1
  },
  "outdoors": true
 },
 "npath3": {
  "name": "溪边小路",
  "long": "你现在来到一条溪流边上的小路，溪水流过布满石块的河床发出轰轰的声音，一条木桥跨过溪流往东通往镇外的小路，沿着溪边往南不远处则可以望见一间磨坊。北边一条小路可以下到溪谷中。",
  "exits": {
   "北": "river1",
   "南": "lane2",
   "西北": "npath2",
   "东": "ebridge"
  },
  "outdoors": true
 },
 "nstreet1": {
  "name": "街道",
  "long": "这里是雪亭镇北边的主要街道，往南通往镇上最热闹的广场，往北则通往镇北的山路，你的西边都是一些卖杂货的店铺，这一带除了市集的日子，并不常有太多人走动。你注意到东边有一间不太显眼的土地公庙。",
  "details": {
   "店铺": "各式各样的店铺都有，不过看起来不像是你会用得着的地方。"
  },
  "exits": {
   "南": "square_n",
   "北": "nstreet2",
   "东": "small_temple"
  },
  "outdoors": true
 },
 "nstreet2": {
  "name": "街道",
  "long": "这里是雪亭镇北边的主要街道，往南稍远处便是一处广场，往北可见一条蜿蜒的山路穿过长满芒草的山坡通往野羊山上，东边是一条小路通往溪边，西边则是一间驿站。",
  "exits": {
   "西": "post_office",
   "东": "npath1",
   "南": "nstreet1",
   "北": "ngate"
  },
  "spawn": {
   "man": 1
  },
  "outdoors": true
 },
 "post_office": {
  "name": "雪亭驿",
  "long": "这里是雪亭镇的驿站，虽然驿站主要是替官府递送文书，不过由于近年来土匪强盗出没频繁，也不少百姓会花一些钱请驿站的官员帮忙送信收信，乔阴县的县令认为土匪扰民是官府的施政缺失，驿站若是还收百姓的钱，实在是受之有愧，索性下令县内驿站对百姓的邮递委托一律不得收费。如果你想要收发信，可以用 request 向驿站官员领取收发信的信札。",
  "exits": {
   "东": "nstreet2"
  },
  "noFight": true,
  "post": true
 },
 "river1": {
  "name": "溪边",
  "long": "这里是溪流旁的乱石滩，溪流两岸都有一丈多高，只有此处因为溪流弯道冲积，形成一处小石滩，水流冲激的声音经过溪谷的回音震耳欲聋，往南一条小路可以回到岸边。",
  "exits": {
   "南": "npath3"
  },
  "outdoors": true,
  "water": true
 },
 "riverbank": {
  "name": "河边空地",
  "long": "这里是河边的一处空地，湍急的河流从你的北边往东南边流去，离这里的河岸往北一丈多远的地方可以看见一个水车，南边则是一间破旧的大宅院，墙壁上一个大缺口足足可以让人通过。",
  "exits": {
   "南": "ruin2"
  },
  "outdoors": true
 },
 "ruin1": {
  "name": "破旧大宅",
  "long": "这里是一间破旧大宅的前院，大厅已经崩塌了一半，焦黑的梁柱挡住了你的去路，庭院里杂草丛生，看来已经很久没有人住了，据说这里晚上有鬼魂出现，但是倒也从没听说过有人被害，因此附近的居民仍然照常生活，往西可以经由大宅的正门回到街上。",
  "details": {
   "杂草": "这里的杂草已经足足有及腰的长度了，你忽然发现南边的草丛有什么东西发出金属的闪光，不过也有可能是你的错觉。",
   "梁柱": "从梁柱焦黑的痕迹来看，这座大宅的主人大概是因为火灾的关系才离开的吧。"
  },
  "exits": {
   "西": "lane1",
   "东": "egate"
  },
  "outdoors": true
 },
 "ruin2": {
  "name": "破旧大宅正厅",
  "long": "这里是一栋破旧大宅的正厅，北面的墙壁跟屋顶已经整个坍塌了，凉飕飕的冷风从北边的缺口直灌进来，另你觉得意外的是，这里清扫得相当整洁，地上用干草整整齐齐地铺着一个床舖，说是流浪汉在这里栖宿却也不像，哪里会有这么爱整洁的流浪汉？大厅倒塌的梁柱挡住了往西的出口。",
  "details": {
   "梁柱": "一跟粗大的梁柱倒了下来，正好挡住了正厅的出口。",
   "床舖": "一个用干草铺成的床舖，虽然简陋，但是却干干净净，当你靠近的时候竟还闻到一股淡淡的脂粉香气。",
   "缺口": "从缺口往外望去，只见大宅的其他部份都已经成为瓦砾堆了，如果你想过去，勉强可以从缺口爬出去。"
  },
  "exits": {
   "北": "riverbank"
  },
  "spawn": {
   "girl": 1
  }
 },
 "school": {
  "name": "私塾",
  "long": "这里是一间私塾，简单的陈设与几张排得整整齐齐的桌椅，就是这间屋子的所有家具，屋角一个大书柜，里面放着许多手抄本的古书，不过书柜的门是锁着的，最前面的桌上放着文房四宝，与一盆小巧的盆栽柏树，私塾的出口在北边。",
  "exits": {
   "北": "wstreet1"
  },
  "spawn": {
   "teacher": 1,
   "alchemist": 1,
   "child3": 2
  },
  "noFight": true
 },
 "sgate": {
  "name": "草棚",
  "long": "这里是雪亭镇南边的入口，往北穿过草棚通往雪亭镇的街道，出草棚往镇外有两条路，往东南的路穿过雪亭南方的老松林，通往县城乔阴，这条路虽然比较近，但是近来一群自称老松寨的土匪常常在这一带出没，往西的一条沿着老松林外的大路通往邻近的五堂镇，从乔阴县城往天邪国的商旅现在大多绕道走这一条路，因为往五堂镇的路上有一处北军府训练新兵的军营，常有军士巡逻，拦路强人多半不敢滋事。",
  "exits": {
   "北": "sstreet1"
  },
  "outdoors": true,
  "edge": true
 },
 "small_temple": {
  "name": "土地公庙",
  "long": "这里是一处小而整洁的土地公庙，中央一座红砖砌成的神龛里供奉着一尊黑色脸庞的土地公神像。神龛前有一个黄铜香炉，几注线香伴随着轻烟散发出一种安详的氛围。",
  "details": {
   "神龛": "这个神龛大约五尺见方，用红砖砌成，没有一般寺庙常见的雕刻装饰。",
   "神像": "一尊黑色脸庞的木质土地公神像，看起来颇有年代了。",
   "香炉": "一个黄铜材质的香炉，虽然看上去有点老旧，但似乎经常有人细心擦拭。"
  },
  "exits": {
   "西": "nstreet1"
  }
 },
 "smithy": {
  "name": "打铁铺子",
  "long": "这里是一间打铁铺子，墙上挂了许多铁器的半成品跟工具，铺子中间一个烧着熊熊火燄的火炉映得你在墙上的影子一晃一晃的，旁边还有一个沈重的大铁砧，铺子的出口就在东边。",
  "details": {
   "铁砧": "这个大铁砧看起来十分沈重，上面满是敲打的痕迹。",
   "铁器": "这些铁器有锅子、铲子、铁锤、耕田用的锄头、犁等等。"
  },
  "exits": {
   "西": "square_s"
  },
  "spawn": {
   "smith": 1
  }
 },
 "square": {
  "name": "广场中央",
  "long": "这里是雪亭镇广场的中央，一株巨大的老榕树盘根错结地站在中央，一些孩童常常爬上这株老榕嬉戏，榕树下七横八竖地放着几张长凳供人歇息聊天，树旁还有一个水缸供路人取水解渴。",
  "details": {
   "榕树": "这株榕树少说也有两三百岁了，一条条长长的须根几乎垂到地面，树干因为经常被人抚摸而显得光滑。",
   "长凳": "十分普通常见的长凳，如果你累了，不必客气，尽管坐下来休息。"
  },
  "exits": {
   "东": "square_e",
   "北": "square_n",
   "西": "square_w",
   "南": "square_s"
  },
  "spawn": {
   "pot": 1,
   "gammer": 1,
   "junkman": 1
  }
 },
 "square_e": {
  "name": "广场",
  "long": "这里是雪亭镇广场东边，往东是一条僻静的巷子，西边有一株高大的榕树，南边是一家打铁铺子，不过店门不在这一边。",
  "exits": {
   "东": "epath",
   "西": "square"
  },
  "outdoors": true
 },
 "square_n": {
  "name": "广场",
  "long": "这里是雪亭镇广场北边，平常是附近孩童嬉戏游玩的地方，初一十五则是市集的所在，往南可以看见一株大榕树，往北则是一条笔直的街道。",
  "exits": {
   "北": "nstreet1",
   "南": "square"
  },
  "spawn": {
   "child1": 1,
   "child2": 1
  },
  "outdoors": true
 },
 "square_s": {
  "name": "广场",
  "long": "这里是雪亭镇广场的南边，往北可以望见一株高大的榕树，广场以榕树为中心形成一个十多丈见方的大空地，街道往南通往镇外，东边不远处有间打铁铺子。",
  "exits": {
   "西": "square_sw",
   "东": "smithy",
   "北": "square",
   "南": "sstreet1"
  },
  "outdoors": true
 },
 "square_sw": {
  "name": "广场",
  "long": "这里是雪亭镇广场的西南边，广场中央的大榕树就在你的东北方不远处，这里的北边可以看见一家客栈，往西是一条街道，东边穿过一个路口可看见一家打铁铺子。",
  "exits": {
   "西": "wstreet1",
   "东": "square_s",
   "北": "square_w"
  },
  "outdoors": true
 },
 "square_w": {
  "name": "广场",
  "long": "这里是雪亭镇广场的西边，往东可以看见广场中央的大榕树。一家小客栈座落在西边不远处，客栈前的一串灯笼上写着「饮风客栈」四个大字。广场上铺着整齐的石板，在这样的小镇通常是因为驿站的缘故才会费事铺设。",
  "exits": {
   "南": "square_sw",
   "西": "inn_hall",
   "东": "square",
   "北": "bug_room"
  },
  "doors": {
   "西": {
    "name": "客栈大门",
    "closed": true
   }
  },
  "noFight": true,
  "outdoors": true
 },
 "sstreet1": {
  "name": "街道",
  "long": "这里是雪亭镇南边连接镇外的街道，西边有一间货栈，东边则是一家杂货铺，街道往北通往广场南边，往南穿过一个草棚出镇外。",
  "exits": {
   "南": "sgate",
   "北": "square_s",
   "西": "store",
   "东": "bazar"
  },
  "outdoors": true
 },
 "store": {
  "name": "货栈",
  "long": "这里是一间货栈，也是旅行客商们储放货物，运送、转交的地方，雪亭镇因为位于通往天邪国的重要道路，所以货栈往来的货物相当的多，因此成为少数几个设有货栈的村镇，天朝各地的货栈大多数都互相连系，因此商业十分发达，忙碌的货栈也常常是缺钱的人打零工的地方，因为货栈的工作量不固定，有大批货物进来的时候往往需要平常十几倍的人手，但是货栈的利润又雇不起长期的工人。",
  "exits": {
   "东": "sstreet1"
  },
  "spawn": {
   "foreman": 1,
   "wagon": 1,
   "crate": 3
  },
  "noFight": true
 },
 "tree": {
  "name": "榕树上",
  "long": "你现在正在一株巨大的榕树上，茂密的枝叶搔得你有些发痒，前面一根粗大的树枝上有人放着一块垫子。",
  "exits": {
   "下": "square"
  },
  "spawn": {
   "child": 1
  }
 },
 "wgate": {
  "name": "雪亭镇",
  "long": "这里是雪亭镇西边的官道，虽然雪亭驿设在镇上的北边，但是官道却是从西边入雪亭，因为原来修官道时利用了一段从前中阳侯征奂族乱军的栈道，因此上这条官道便从西边穿过山谷接古中阳栈道，出黄石隘，往东通往雪亭镇的街道，往西则出镇。",
  "exits": {
   "东": "wstreet3"
  },
  "outdoors": true
 },
 "wstreet1": {
  "name": "街道",
  "long": "这里是雪亭镇广场西边的街道，往北是一间客栈，不过这个方向没有入口，南边一间青瓦屋，门口洒扫得干干净净，似是家私塾模样，往西的街道十分宽敞，路上还有车马经过压出来的沟痕。",
  "exits": {
   "南": "school",
   "东": "square_sw",
   "西": "wstreet2"
  },
  "outdoors": true
 },
 "wstreet2": {
  "name": "街道",
  "long": "这里是雪亭镇西边的街道，北边是一间看起来像是客栈的大屋，围墙上晒着一些陈旧却洁白的衣服。南边有间青瓦屋，几株大树从围墙内探出头来。",
  "exits": {
   "东": "wstreet1",
   "西": "wstreet3"
  },
  "outdoors": true
 },
 "wstreet3": {
  "name": "街道",
  "long": "这里是雪亭镇西边的街道，北边是雪亭镇的乡校，平常会有一些镇上的长者在这里谈论镇上的闲事，县里若有公爷来这里断事，也是在这里设的公堂，往西不远处就是出镇的官道，街道南边是一家糕饼铺。",
  "exits": {
   "北": "court",
   "东": "wstreet2",
   "西": "wgate"
  },
  "outdoors": true
 }
}
export const NPCS = {
 "alchemist": {
  "name": "陈维侠",
  "ids": [
   "chen weisha",
   "weisha",
   "chen"
  ],
  "nickname": "牙山居士",
  "age": 55,
  "long": "陈维侠是个著名的方士，经常来往于天邪国与乔阴县之间采药及寻觅珍奇矿物，他和雪亭镇的王员外是旧日同窗，这几日原本要往野羊山采药，但是因为盗贼肆虐所以暂时在王员外家盘桓数日。陈维侠本名陈度，维侠是他的学生们送给他的称号，意思是说他相当有侠气，喜欢打抱不平，若不是给王员外的独子缠住了讲养生之术，只怕早几日前就上野羊山铲除盗匪去了。",
  "kind": [
   "villager"
  ],
  "level": 30,
  "cls": "commoner",
  "attrs": {
   "dex": 18,
   "int": 24,
   "wis": 25,
   "spi": 22,
   "cps": 19,
   "con": 20
  },
  "skills": {
   "unarmed": 60,
   "sword": 60,
   "parry": 80,
   "dodge": 70,
   "force": 70,
   "kee anatomy": 100,
   "dragon force": 60,
   "alchemy-medication": 140,
   "alchemy-wealth": 40,
   "alchemy-magic": 80,
   "alchemy-immortality": 30
  },
  "map": {
   "force": "dragon force"
  },
  "advance": {
   "gin": 180,
   "kee": 180,
   "sen": 180
  },
  "carry": [
   [
    "silversword",
    "wield"
   ],
   [
    "stock/cloth",
    "wear"
   ]
  ]
 },
 "child": {
  "name": "阿宝",
  "ids": [
   "arbao"
  ],
  "gender": "female",
  "age": 16,
  "long": "这个十五、六岁的小姑娘就是「阿宝」了，她身上虽然穿着粗布衣服，但却十足是个美人胚子，一双水汪汪的大眼睛骨碌碌地转着，还不时盯着你看，使你不禁觉得有些发窘。",
  "kind": [
   "villager"
  ],
  "level": 10,
  "cls": "commoner",
  "attrs": {
   "spi": 18,
   "int": 19,
   "dex": 19,
   "con": 17
  },
  "skills": {
   "stealing": 40,
   "dodge": 35,
   "lightswift": 45,
   "dagger": 40,
   "sword": 30
  },
  "map": {
   "dodge": "lightswift"
  },
  "coin": 30,
  "carry": [
   [
    "blue_cloth",
    "wear"
   ],
   [
    "stock/dagger",
    "wield"
   ]
  ]
 },
 "child1": {
  "name": "小孩",
  "ids": [
   "child"
  ],
  "age": 6,
  "long": "一个流着鼻涕的小孩，睁着一双无邪的眼睛望着你。",
  "kind": [
   "villager"
  ],
  "level": 1,
  "max": {
   "gin": 20,
   "kee": 20,
   "sen": 20
  },
  "notify": {
   "kee": 100
  },
  "coin": 1,
  "carry": [
   [
    "tummy_cover",
    "wear"
   ]
  ]
 },
 "child2": {
  "name": "小孩",
  "ids": [
   "child"
  ],
  "long": "一个约七、八岁大的男孩，笑瞇瞇地望着你。",
  "kind": [
   "villager"
  ],
  "level": 1,
  "notify": {
   "kee": 100
  },
  "chatChance": 10,
  "chatMsg": [
   "小孩叫道：呀 ～ 呀 ～",
   "小孩咭咭咯咯地笑着，绕着你跑来跑去。",
   "小孩叫道：咿 ～ 咿 ～"
  ],
  "coin": 1,
  "carry": [
   [
    "woodsword",
    "wield"
   ]
  ]
 },
 "child3": {
  "name": "小孩",
  "ids": [
   "child"
  ],
  "age": 6,
  "long": "一个流着鼻涕的小孩，睁着一双无邪的眼睛望着你。",
  "kind": [
   "villager"
  ],
  "level": 1,
  "max": {
   "gin": 20,
   "kee": 20,
   "sen": 20
  },
  "notify": {
   "kee": 100
  },
  "coin": 1,
  "carry": [
   [
    "tummy_cover",
    "wear"
   ]
  ]
 },
 "child4": {
  "name": "小孩",
  "ids": [
   "child"
  ],
  "age": 6,
  "long": "一个流着鼻涕的小孩，睁着一双无邪的眼睛望着你。",
  "kind": [
   "villager"
  ],
  "level": 1,
  "max": {
   "gin": 20,
   "kee": 20,
   "sen": 20
  },
  "notify": {
   "kee": 100
  },
  "coin": 1,
  "carry": [
   [
    "tummy_cover",
    "wear"
   ]
  ]
 },
 "foreman": {
  "name": "工头",
  "ids": [
   "foreman"
  ],
  "age": 48,
  "long": "这位就是这家货栈的工头，负责指挥工人将货物搬进搬出，如果你想打工赚些钱，可以跟他谈谈看。",
  "kind": [
   "villager"
  ],
  "level": 8,
  "attrs": {
   "str": 18,
   "cor": 19,
   "cps": 15,
   "dex": 16
  },
  "max": {
   "kee": 60
  },
  "chatChance": 10,
  "chatMsg": [
   {
    "fn": "new_crate"
   },
   "工头大声吆喝着工人将货物从仓库搬出来。",
   "工头大叫：小王呢？今天有没有来？",
   "工头说道：谁再去多找些人手，唉，忙死了。",
   "工头说道：要算工钱的一个个来 ... 别急 ..."
  ],
  "coin": 220
 },
 "gammer": {
  "name": "瞎眼老太婆",
  "ids": [
   "blind gammer",
   "gammer"
  ],
  "gender": "female",
  "age": 66,
  "long": "一个瞎了眼睛的老太婆，满脸皱纹，但是却给人一种亲切的感觉。",
  "kind": [
   "villager"
  ],
  "level": 44,
  "cls": "commoner",
  "attrs": {
   "dex": 29,
   "con": 21,
   "cor": 22,
   "str": 19
  },
  "skills": {
   "staff": 40,
   "stealing": 70,
   "dodge": 90,
   "blade": 30,
   "sword": 30,
   "unarmed": 50,
   "dagger": 70,
   "secondhand dagger": 70,
   "killerhood": 60,
   "force": 90,
   "regular force": 100
  },
  "map": {
   "force": "regular force"
  },
  "advance": {
   "gin": 270,
   "kee": 180,
   "sen": 90
  },
  "notify": {
   "kee": 40
  },
  "chatChance": 8,
  "chatChanceCombat": 10,
  "chatMsg": [
   "瞎眼老太婆喃喃地说道：阿宝？是你吗？",
   "瞎眼老太婆侧着耳朵似乎在倾听什么。",
   {
    "fn": "random_move"
   }
  ],
  "chatMsgCombat": [
   "瞎眼老太婆叫道：阿宝！有恶人在欺负婆婆哪！快出来啊！",
   {
    "fn": "random_move"
   }
  ],
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "cane",
    "wield"
   ],
   [
    "syndicator",
    "wield"
   ]
  ]
 },
 "garrison": {
  "name": "官兵",
  "ids": [
   "garrison"
  ],
  "long": "一位负责维护地方治安的官兵，他们受过相当的训练，有时候也加入军队作战。",
  "kind": [
   "soldier"
  ],
  "level": 17,
  "cls": "commoner",
  "attrs": {
   "con": 19,
   "str": 20
  },
  "skills": {
   "twohanded sword": 60,
   "parry": 60,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50
  },
  "vendettaMark": "authority",
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "stock/broadsword",
    "wield"
   ]
  ]
 },
 "girl": {
  "name": "白衣女子",
  "ids": [
   "girl"
  ],
  "gender": "female",
  "age": 19,
  "long": "一个身穿白衣的女子，看起来年纪不会超过二十岁，容貌虽不甚美，却别有一股灵秀之气，令人凛然不敢轻侮。",
  "kind": [
   "fighter"
  ],
  "level": 55,
  "cls": "commoner",
  "attrs": {
   "con": 23,
   "str": 23,
   "spi": 27,
   "int": 22,
   "dex": 26
  },
  "skills": {
   "sword": 140,
   "dodge": 120,
   "parry": 120,
   "blade": 70,
   "dagger": 70,
   "unarmed": 90,
   "force": 80,
   "celestial force": 80
  },
  "map": {
   "force": "celestial force"
  },
  "advance": {
   "gin": 160,
   "kee": 160,
   "sen": 80
  },
  "defensive": 60,
  "carry": [
   [
    "white_dress",
    "wear"
   ],
   [
    "slasher_sword",
    "wield"
   ]
  ]
 },
 "guard": {
  "name": "青衣汉子",
  "ids": [
   "guard"
  ],
  "age": 26,
  "long": "一个身穿藏青劲装的汉子，双目炯炯有神地盯着你。",
  "kind": [
   "villager"
  ],
  "level": 20,
  "cls": "commoner",
  "attrs": {
   "str": 20,
   "con": 20
  },
  "skills": {
   "sword": 70,
   "blade": 50,
   "parry": 50,
   "unarmed": 40,
   "dodge": 70
  },
  "coin": 160,
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "stock/longsword",
    "wield"
   ]
  ]
 },
 "herbalist": {
  "name": "药铺掌柜",
  "ids": [
   "herbalist"
  ],
  "age": 44,
  "long": "药铺掌柜的是位胖胖的中年男子，虽然年纪有四五十岁了，不过看起来依然红光满面、精神焕发，你可以用 list 问他店里有哪些药。",
  "kind": [
   "villager",
   "vendor"
  ],
  "level": 3,
  "cls": "commoner",
  "skills": {
   "unarmed": 5,
   "parry": 5,
   "dodge": 5,
   "dagger": 5
  },
  "sells": {
   "stock/black_pill": 50,
   "stock/boar_berry": 40,
   "stock/wild_ginseng": 30,
   "stock/dragon_saliva": 20
  },
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "fur_hat",
    "wear"
   ]
  ]
 },
 "innkeeper": {
  "name": "掌柜",
  "ids": [
   "innkeeper",
   "keeper"
  ],
  "age": 52,
  "long": "这位便是这家客栈的掌柜，看起来福福泰泰像是个老好人。",
  "kind": [
   "villager"
  ],
  "level": 4,
  "coin": 160
 },
 "junkman": {
  "name": "拾荒老头",
  "ids": [
   "junkman"
  ],
  "age": 66,
  "long": "一个痀偻的拾荒老头，靠捡拾废物维生，如果你愿意帮助这样一个老人过好一点的生活，或者是愿意替辛苦的巫师们节省一点记忆体，请把你身上多余的东西给他，可以得到一点的 civism。",
  "kind": [
   "villager"
  ],
  "level": 2,
  "notify": {
   "gin": 100,
   "kee": 100,
   "sen": 100
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   },
   {
    "do": "get all"
   }
  ],
  "bounty": {
   "mortal sin": 5
  }
 },
 "lieutenant": {
  "name": "武官",
  "ids": [
   "lieutenant"
  ],
  "age": 36,
  "long": "这是一名指挥官兵的武官，他们通常是军人中出类拔萃的佼佼者。",
  "kind": [
   "soldier"
  ],
  "level": 24,
  "cls": "commoner",
  "attrs": {
   "con": 21,
   "str": 22
  },
  "skills": {
   "twohanded sword": 80,
   "blade": 60,
   "unarmed": 65,
   "parry": 60,
   "dodge": 70
  },
  "vendettaMark": "authority",
  "bounty": {
   "martial art": 250,
   "martial mastery": 150
  },
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "leather_armor",
    "wear"
   ],
   [
    "helmet",
    "wear"
   ],
   [
    "clothboot",
    "wear"
   ],
   [
    "stock/broadsword",
    "wield"
   ]
  ]
 },
 "miller": {
  "name": "杨大婶",
  "ids": [
   "miller"
  ],
  "gender": "female",
  "long": "杨大婶是前几年才搬到这个地方的，据说他的丈夫是朝中的高官，但是得了功名富贵之后却抛弃妻儿，但是杨大婶自己从不承认，只说丈夫在京城经商。",
  "kind": [
   "villager"
  ],
  "level": 2,
  "carry": [
   [
    "stock/cloth",
    "wear"
   ]
  ]
 },
 "oldman": {
  "name": "黑衣老人",
  "ids": [
   "oldman"
  ],
  "age": 65,
  "long": "一个身穿黑衣的老人，虽然年纪很大了，却脸色红润，眼睛炯炯有神。",
  "kind": [
   "bandit"
  ],
  "level": 7,
  "cls": "commoner",
  "skills": {
   "sword": 25,
   "parry": 15,
   "dodge": 20,
   "dagger": 40,
   "stealing": 35
  },
  "max": {
   "gin": 70,
   "sen": 50
  },
  "notify": {
   "gin": 40,
   "kee": 40
  },
  "pursuer": 1,
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "stock/shortsword",
    "wield"
   ]
  ]
 },
 "patrol": {
  "name": "巡逻官兵",
  "ids": [
   "patrol garrison",
   "patrol",
   "garrison"
  ],
  "long": "一位负责维护地方治安的官兵，他们受过相当的训练，有时候也加入军队作战。",
  "kind": [
   "villager"
  ],
  "level": 15,
  "cls": "commoner",
  "skills": {
   "sword": 60,
   "parry": 60
  },
  "max": {
   "gin": 150,
   "kee": 150
  },
  "pursuer": 1,
  "vendettaMark": "authority",
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "stock/broadsword",
    "carry"
   ]
  ]
 },
 "smith": {
  "name": "铁匠",
  "ids": [
   "smith"
  ],
  "long": "一个身材粗壮的铁匠，正忙碌地工作着。如果你想买一些铁器，可以用 list 看有哪些东西，用 buy 向铁匠购买。",
  "kind": [
   "villager",
   "vendor"
  ],
  "level": 13,
  "attrs": {
   "str": 19,
   "cor": 17,
   "cps": 15,
   "dex": 18
  },
  "max": {
   "kee": 80
  },
  "chatChance": 5,
  "chatMsg": [
   "铁匠将一块烧红的铁块「嗤」地一声浸入一旁的水箱中。",
   "铁匠用手中的铁锤在铁砧上用力敲打。",
   "铁匠说道：站开点，小心别烫着了。",
   "铁匠说道：唉 ... 真把我给忙坏了。"
  ],
  "sells": {
   "hoe": 3,
   "shovel": 5,
   "stock/dagger": 10,
   "stock/shortsword": 5
  },
  "carry": [
   [
    "smock",
    "wear"
   ]
  ]
 },
 "teacher": {
  "name": "王怀芝",
  "ids": [
   "wang whaiz",
   "wang",
   "whaiz"
  ],
  "long": "王怀芝是镇上王员外的独子，前几年上京考试落第，碰巧王太夫人过世，因此留在家乡服丧，闲暇无事，便开了间私塾教镇上孩子读书。",
  "kind": [
   "villager"
  ],
  "level": 5,
  "cls": "scholar",
  "skills": {
   "literate": 60
  },
  "max": {
   "sen": 50
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "teach_literate"
   }
  ]
 },
 "waiter": {
  "name": "店小二",
  "ids": [
   "waiter",
   "snow_inn_waiter"
  ],
  "age": 21,
  "long": "一个约二十出头的年轻小伙计，正忙进忙出招呼客人，你可以用 list 看可以点什么菜，用 buy 跟店小二点菜。",
  "kind": [
   "villager",
   "vendor"
  ],
  "level": 2,
  "cls": "commoner",
  "chatChance": 1,
  "chatMsg": [
   "店小二闲着无聊，哼起小曲儿来。",
   "店小二探头出去望了望天色，说道：这几天天气不错，真想出去走走。",
   {
    "say": "那说书的李先生不知道好点了没，少了说书的这里实在气闷。"
   },
   {
    "say": "客倌今天怎么有空，最近可有新鲜事能说来听听吗？"
   }
  ],
  "sells": {
   "stock/dumpling": 50,
   "stock/manto": 50,
   "stock/pork": 30,
   "roast_chicken": 30
  }
 },
 "woman": {
  "name": "少妇",
  "ids": [
   "woman"
  ],
  "gender": "female",
  "long": "一个容色秀丽的少妇，穿着十分朴素。",
  "kind": [
   "villager"
  ],
  "level": 2,
  "coin": 10,
  "carry": [
   [
    "stock/cloth",
    "wear"
   ]
  ]
 },
 "yu": {
  "name": "鱼天",
  "ids": [
   "yu tan",
   "yu",
   "tan"
  ],
  "gender": "male",
  "age": 25,
  "long": "浓眉扇耳声似洪, 自幼独孤鱼家童, 不识父母识铁山, 不爱刀枪爱钱逢。鱼天跟鱼家渊源甚深, 据传闻为鱼铁山当年误杀一侠士时, 身旁之小男婴, 由于不知其性氏家源, 故从小在鱼家长大且名为天. 鱼家对其有愧, 而鱼天又不好武艺, 便以鱼家资源, 助其在此开设钱庄兼贩杂货。",
  "kind": [
   "villager",
   "vendor"
  ],
  "level": 1,
  "chatChance": 5,
  "chatMsg": [
   "鱼天喃喃念道: 嗯, 上个月的利息收了二百八十两白银, 不错 不错 !",
   "鱼天靠在左侧的大柜台上, 低头喃喃自语, 似乎正在算计着."
  ],
  "sells": {
   "blue_jacket": 5,
   "stock/fur_hat": 5,
   "stock/bottle": 5
  },
  "carry": [
   [
    "blue_jacket",
    "wear"
   ]
  ]
 },
 "man": {
  "name": "路人",
  "ids": [
   "man"
  ],
  "long": "一个普通的路人，像这样的人一天可以在路上碰见几十个。",
  "kind": [
   "villager"
  ],
  "level": 2,
  "coin": 30,
  "carry": [
   [
    "stock/cloth",
    "wear"
   ],
   [
    "stock/shortsword",
    "wield"
   ]
  ]
 }
}
export const ITEMS = {
 "blue_cloth": {
  "name": "蓝布长衫",
  "ids": [
   "blue cloth",
   "cloth"
  ],
  "unit": "件",
  "value": 600,
  "wearAs": "cloth",
  "long": "一件粗布缝制的布衣，看起来像是乡下姑娘的衣服。",
  "weight": 2000,
  "apply": {
   "armor": 2
  },
  "slot": "cloth"
 },
 "blue_jacket": {
  "name": "蓝衣套",
  "ids": [
   "blue jacket",
   "jacket"
  ],
  "unit": "件",
  "value": 500,
  "wearAs": "cloth",
  "long": "一件深蓝色的大衣，上面绣了老大一个\"鱼\"字。",
  "weight": 2000,
  "apply": {
   "armor": 2
  },
  "slot": "cloth"
 },
 "cane": {
  "name": "拐杖",
  "ids": [
   "cane"
  ],
  "unit": "根",
  "value": 600,
  "wieldAs": [
   "staff",
   "twohanded staff"
  ],
  "rigidity": 12,
  "long": "一根硬木拐杖，因为经年使用而显得光滑。",
  "weight": 2400,
  "weapon": {
   "staff": [
    1,
    19,
    130,
    0
   ]
  }
 },
 "clothboot": {
  "name": "皂步靴",
  "ids": [
   "black boots",
   "boots"
  ],
  "unit": "双",
  "value": 1000,
  "wearAs": "feet_eq",
  "long": "这是军队中的步兵武官常穿的靴子，轻便耐用。",
  "weight": 1000,
  "apply": {
   "armor": 1,
   "dodge": 1
  },
  "slot": "feet_eq"
 },
 "coin": {
  "name": "古钱",
  "ids": [
   "ancient coin",
   "coin"
  ],
  "unit": "枚",
  "value": 60,
  "thiefToken": 1,
  "long": "一枚黑黝黝的古钱，看不出有什么特别。",
  "weight": 3
 },
 "comb": {
  "name": "红木梳子",
  "ids": [
   "annatto comb",
   "comb"
  ],
  "unit": "把",
  "value": 170,
  "long": "一把质地相当细致的红木梳子。",
  "weight": 300
 },
 "crate": {
  "name": "大木箱",
  "ids": [
   "big crate",
   "crate"
  ],
  "unit": "个",
  "value": 1,
  "wage": 25,
  "long": "这是一个用来装货物的大木箱，看起来相当沈重。",
  "weight": 40000
 },
 "fur_hat": {
  "name": "毛皮帽",
  "ids": [
   "fur hat",
   "hat"
  ],
  "unit": "顶",
  "value": 500,
  "wearAs": "head_eq",
  "long": "一顶不知是鹿皮还是麈皮缝制的小帽。",
  "weight": 1000,
  "apply": {
   "armor": 1
  },
  "slot": "head_eq"
 },
 "hairpin": {
  "name": "古铜发簪",
  "ids": [
   "bronze hairpin",
   "hairpin"
  ],
  "unit": "支",
  "value": 100,
  "wearAs": "head_eq",
  "long": "一支生满铜绿，老旧不堪的发簪。",
  "weight": 400,
  "apply": {
   "spi": 1
  },
  "slot": "head_eq"
 },
 "helmet": {
  "name": "铜盔",
  "ids": [
   "brass helmet",
   "helmet"
  ],
  "unit": "顶",
  "value": 900,
  "wearAs": "head_eq",
  "long": "这是一顶铜制的头盔，属于军队中的低级武官顶戴。",
  "weight": 4000,
  "apply": {
   "armor": 3,
   "dodge": -3
  },
  "slot": "head_eq"
 },
 "hoe": {
  "name": "锄头",
  "ids": [
   "hoe"
  ],
  "unit": "把",
  "value": 800,
  "wieldAs": [
   "twohanded pike"
  ],
  "rigidity": 20,
  "long": "一把重甸甸的锄头。",
  "weight": 6000,
  "weapon": {
   "pike": [
    2,
    10,
    50,
    0
   ]
  }
 },
 "invitation": {
  "name": "英雄帖",
  "ids": [
   "invitation"
  ],
  "unit": "张",
  "value": 1,
  "long": "一张由武林盟主于兰兼毅所发的英雄帖，只有一流身分地位的武林人物才能收到这张英雄帖。",
  "weight": 20
 },
 "leather_armor": {
  "name": "硬皮甲胄",
  "ids": [
   "leather armor",
   "armor"
  ],
  "unit": "件",
  "value": 1400,
  "wearAs": "armor",
  "long": "一件用牛皮浆硬缝合，用来保护身体的甲胄，虽然防护效果比不上金属制成的铠甲，但是轻便便宜也是这类皮制甲胄的优点。",
  "weight": 10000,
  "apply": {
   "armor": 6
  },
  "slot": "armor"
 },
 "note": {
  "name": "雪亭小镇见闻",
  "ids": [
   "snow note",
   "note",
   "map"
  ],
  "unit": "张",
  "value": 1,
  "long": "一张粗糙的羊皮革，上面苍劲的笔迹简要地画了些图与笔记。\n\n最近货栈里很缺人手，正四                          ︴︴\n处招揽临时工。              「野羊山」           ﹌﹌\n                                ↑      『水月村』﹌﹌\n僻静的小巷子里经常飘出肉       山路         │     ﹌﹌\n包子的香味来，听说有些好  雪    │         溪边     ﹌﹌\n吃的野孩子常常翻墙去偷吃 亭驿─街道─小路─小路  溪边 ﹌﹌\n喔。                            │             ＼ │   ﹌﹌\n                                │               溪边  ﹌﹌\n有些顽皮的小孩子常躲在客       街道              小路─木桥→『雪吟庄』\n栈厨房里及广场中央的大榕        │                │   ﹌﹌\n树上面玩捉迷藏，每每让他        │               溪边  ﹌﹌\n们的父母找不到人。             广场              小路   ﹌﹌\n                  ╭  ╮        │                │     ﹌﹌﹌「李家村」\n                    小         广场        僻静  僻静  破旧  ﹌↗﹌﹌﹌﹌\n             厨房─客栈─广场─中央─广场─小巷─小巷─大宅─河边 ﹌﹌﹌\n                  ╰  ╯  │    │          │\n             乡校         │    │          小\n   「乱葬岗」 │          │    │         药铺\n            ↖雪          │    │   打铁\n\t     亭镇─街道─街道─广场─铺子   在广场的中央有口大水缸(pot)免费\n                    │          │          供水给过路客饮用。\n                    │          │   鱼记\n                   私塾  货栈─街道─小铺   鱼记小铺除了卖些日用杂货外，也\n                                │          经营钱庄的事务。\n                 「振武军营」←草棚\n                                 ↘         雪亭驿提供信件的转递服务。\n                                  「老松林」",
  "weight": 50
 },
 "pot": {
  "name": "大水缸",
  "ids": [
   "pot"
  ],
  "noGet": 1,
  "liquidContainer": 1,
  "long": "一个装满清水的大水缸，如果你口渴，可以舀水来喝(drink)。"
 },
 "roast_chicken": {
  "name": "红烧鸡",
  "ids": [
   "roast chicken",
   "chicken"
  ],
  "unit": "堆",
  "baseUnit": "只",
  "baseValue": 800,
  "foodStuff": 190,
  "healKee": 30,
  "baseWeight": 1500,
  "long": "一只香喷喷的红烧鸡，哇，你的口水都快流出来了。"
 },
 "shovel": {
  "name": "铁铲",
  "ids": [
   "shovel"
  ],
  "unit": "把",
  "value": 700,
  "wieldAs": [
   "twohanded pike"
  ],
  "rigidity": 20,
  "long": "一把挖土用的铁铲。",
  "weight": 6000,
  "weapon": {
   "pike": [
    2,
    9,
    70,
    0
   ]
  }
 },
 "silversword": {
  "name": "洗银剑",
  "ids": [
   "silver sword",
   "sword"
  ],
  "unit": "把",
  "value": 19000,
  "wieldAs": [
   "sword"
  ],
  "rigidity": 40,
  "long": "一把银制的短剑，铸造得十分精美。",
  "weight": 7000,
  "weapon": {
   "sword": [
    2,
    15,
    40,
    4
   ]
  }
 },
 "slasher_sword": {
  "name": "绕指柔剑",
  "ids": [
   "slasher sword",
   "sword"
  ],
  "unit": "把",
  "value": 26000,
  "wieldAs": "sword",
  "rigidity": 70,
  "long": "一把又细又长的剑，拿在手上剑刃就不断抖动，看来要使用这把剑得要相当敏捷的身手才不会误伤自己。",
  "weight": 2000,
  "apply": {
   "dex": 2,
   "attack": 20,
   "intimidate": 20,
   "parry": -10
  },
  "weapon": {
   "sword": [
    5,
    7,
    60,
    10
   ]
  }
 },
 "smock": {
  "name": "打铁褂子",
  "ids": [
   "work smock",
   "smock"
  ],
  "unit": "件",
  "value": 720,
  "wearAs": "armor",
  "long": "这是一件铁匠工作时用来遮挡火星飞溅的工作服。",
  "weight": 5500,
  "apply": {
   "armor": 2,
   "armor_vs_fire": 5
  },
  "slot": "armor"
 },
 "syndicator": {
  "name": "「尺娘」",
  "ids": [
   "syndicator"
  ],
  "unit": "把",
  "value": 32000,
  "wieldAs": [
   "dagger",
   "secondhand dagger"
  ],
  "rigidity": 40,
  "long": "这是一把长约四寸的匕首，刃上用精细的雕工镂空出一个美貌女子的脸，奇特的是这女子的表情像是伸出舌头在舔嘴边的血迹，匕首的柄奇短，只能用两只手指捏住。",
  "weight": 3000,
  "weapon": {
   "dagger": [
    3,
    14,
    100,
    5
   ]
  }
 },
 "tummy_cover": {
  "name": "肚兜",
  "ids": [
   "tummy cover",
   "tummy",
   "cover"
  ],
  "unit": "件",
  "value": 400,
  "wearAs": "cloth",
  "long": "一块两尺见方的粗布，系上两条绳儿用来给小孩穿的衣物。",
  "weight": 1000,
  "apply": {
   "armor": 1
  },
  "slot": "cloth"
 },
 "wagon": {
  "name": "运货驴车",
  "ids": [
   "wagon"
  ],
  "unit": "辆",
  "noGet": 1,
  "long": "一辆运货的四轮驴车，停在这里等着载货(load)。"
 },
 "white_dress": {
  "name": "白绸羽衫",
  "ids": [
   "white dress",
   "dress"
  ],
  "unit": "件",
  "value": 3200,
  "wearAs": "cloth",
  "long": "一件白色的丝绸女子衣衫，摸起来轻柔无比。",
  "weight": 2000,
  "apply": {
   "armor": 3,
   "spi": 1
  },
  "slot": "cloth"
 },
 "woodblade": {
  "name": "木刀",
  "ids": [
   "wooden blade",
   "blade"
  ],
  "unit": "把",
  "value": 400,
  "wieldAs": "blade",
  "rigidity": 10,
  "long": "一把用硬木削成的单刀，被炭火熏得黑黑的。",
  "weight": 2000,
  "weapon": {
   "blade": [
    1,
    14,
    40,
    0
   ]
  }
 },
 "woodsword": {
  "name": "木剑",
  "ids": [
   "wooden sword",
   "sword"
  ],
  "unit": "把",
  "value": 400,
  "wieldAs": "sword",
  "rigidity": 10,
  "long": "一把用硬木削成的长剑，被炭火熏得黑黑的。",
  "weight": 2000,
  "weapon": {
   "sword": [
    1,
    14,
    40,
    0
   ]
  }
 },
 "stock/broadsword": {
  "name": "阔剑",
  "ids": [
   "broadsword",
   "sword"
  ],
  "unit": "把",
  "value": 5500,
  "wieldAs": [
   "sword",
   "twohanded sword"
  ],
  "rigidity": 25,
  "long": "一把约三尺长的阔剑，份量不轻，需要不小的膂力才能挥舞这种武器。",
  "weight": 10000,
  "weapon": {
   "sword": [
    2,
    12,
    70,
    1
   ]
  }
 },
 "stock/cloth": {
  "name": "布衣",
  "ids": [
   "cloth"
  ],
  "unit": "件",
  "value": 0,
  "wearAs": "cloth",
  "long": "一套普通的棉布衣裤。",
  "weight": 1000,
  "apply": {
   "armor": 1
  },
  "slot": "cloth"
 },
 "stock/dagger": {
  "name": "匕首",
  "ids": [
   "dagger"
  ],
  "unit": "把",
  "value": 500,
  "wieldAs": [
   "dagger",
   "secondhand dagger"
  ],
  "rigidity": 25,
  "long": "一把锋利的短匕首，握在手里重量刚刚好。",
  "weight": 3000,
  "weapon": {
   "dagger": [
    1,
    16,
    40,
    0
   ]
  }
 },
 "stock/longsword": {
  "name": "长剑",
  "ids": [
   "long sword",
   "sword"
  ],
  "unit": "把",
  "value": 4000,
  "wieldAs": "sword",
  "rigidity": 25,
  "long": "一把约三尺长的长剑，是武林中人常用的武器。",
  "weight": 7500,
  "weapon": {
   "sword": [
    2,
    10,
    50,
    1
   ]
  }
 },
 "stock/shortsword": {
  "name": "短剑",
  "ids": [
   "short sword",
   "sword"
  ],
  "unit": "把",
  "value": 900,
  "wieldAs": [
   "sword",
   "secondhand sword"
  ],
  "rigidity": 20,
  "long": "一把粗糙的短剑，一般旅人带在身边防身用的武器。",
  "weight": 4000,
  "weapon": {
   "sword": [
    1,
    15,
    40,
    1
   ]
  }
 },
 "stock/fur_hat": {
  "name": "毛皮帽",
  "ids": [
   "fur hat",
   "hat"
  ],
  "unit": "顶",
  "value": 50,
  "wearAs": "head_eq",
  "long": "一顶不知是鹿皮还是麈皮缝制的小帽。",
  "weight": 1000,
  "apply": {
   "armor": 1
  },
  "slot": "head_eq"
 },
 "stock/bottle": {
  "name": "玻璃瓶",
  "ids": [
   "glass bottle",
   "bottle"
  ],
  "unit": "个",
  "value": 100,
  "liquidContainer": 1,
  "long": "一个透明的玻璃瓶。",
  "weight": 700
 },
 "stock/dumpling": {
  "name": "牛肉包子",
  "ids": [
   "beef dumpling",
   "dumpling"
  ],
  "unit": "堆",
  "baseUnit": "个",
  "baseValue": 10,
  "foodStuff": 80,
  "baseWeight": 60,
  "long": "一个香喷喷的牛肉包子。"
 },
 "stock/manto": {
  "name": "馒头",
  "ids": [
   "manto"
  ],
  "unit": "堆",
  "baseUnit": "个",
  "baseValue": 10,
  "foodStuff": 80,
  "baseWeight": 100,
  "long": "馒头 ... 跟你想像中的一模一样，感动吧。"
 },
 "stock/pork": {
  "name": "白切肉",
  "ids": [
   "pork"
  ],
  "unit": "堆",
  "baseUnit": "片",
  "baseValue": 200,
  "foodStuff": 90,
  "healKee": 10,
  "baseWeight": 400,
  "long": "普通的水煮白切肉 ... 。"
 },
 "stock/black_pill": {
  "name": "乌心丹",
  "ids": [
   "black pill",
   "pill"
  ],
  "unit": "些",
  "baseUnit": "粒",
  "baseValue": 80,
  "baseWeight": 5,
  "long": "乌心丹是一种民间很普遍的药方，用来恢复因操练、工作所耗的体力有不错的效果，缺点是吃了以后会昏昏沈沈想睡觉，且容易口渴。"
 },
 "stock/boar_berry": {
  "name": "山猪果",
  "ids": [
   "boar berry",
   "berry"
  ],
  "unit": "些",
  "baseUnit": "颗",
  "baseValue": 2000,
  "baseWeight": 70,
  "long": "山猪果是一种生长在深山中，尤其是野猪的巢穴附近的一种暗红色野莓，有些山猪果是有毒的，有些则是无毒的，无毒的山猪果可以用来当解毒剂的药材，直接服用则可以提神，不过先警告你，味道不....太好。"
 },
 "stock/dragon_saliva": {
  "name": "龙涎草",
  "ids": [
   "dragon-saliva herb",
   "dragon-saliva",
   "herb"
  ],
  "unit": "些",
  "baseUnit": "株",
  "baseValue": 5000,
  "baseWeight": 7,
  "long": "龙涎草是一种相当名贵的疗伤药，一般人是不太买得起这种药材的，龙涎草经常被方士们用于炼制一些珍贵的丹药，但是直接服食这种草药也有些许的疗伤效果，只不过有些浪费罢了。"
 },
 "stock/wild_ginseng": {
  "name": "野山参",
  "ids": [
   "wild ginseng",
   "ginseng"
  ],
  "unit": "些",
  "baseUnit": "根",
  "baseValue": 1500,
  "baseWeight": 400,
  "long": "野山参是一种广为人知的补品，对人的精气神都颇有助益，而且没有什么明显的副作用，通常作为疗伤药的药材，不过偶尔也有人直接服用，但是效果较不显著。"
 },
 "stock/coin": {
  "name": "钱",
  "ids": [
   "coin",
   "coins",
   "coin_money"
  ],
  "unit": "些",
  "baseUnit": "文",
  "baseValue": 1,
  "moneyId": "coin",
  "baseWeight": 3,
  "long": "这是流通中单位最小的货币，约要一百文钱才值得一两银子。"
 },
 "stock/gold": {
  "name": "黄金",
  "ids": [
   "gold",
   "ingot",
   "gold_money"
  ],
  "unit": "些",
  "baseUnit": "两",
  "baseValue": 10000,
  "moneyId": "gold",
  "baseWeight": 37,
  "long": "黄澄澄的金子，人见人爱的金子，啊～～金子！"
 },
 "stock/silver": {
  "name": "碎银",
  "ids": [
   "silver",
   "silver_money"
  ],
  "unit": "些",
  "baseUnit": "两",
  "baseValue": 100,
  "moneyId": "silver",
  "baseWeight": 37,
  "long": "白花花的银子，人见人爱的银子。"
 },
 "stock/water": {
  "name": "清水",
  "ids": [
   "water"
  ],
  "long": "... 水就是水，没啥好看的。"
 }
}
