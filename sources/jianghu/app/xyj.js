// Generated from 西游记 4.5 (xyj450, snowcat et al. 1996–98) — see SOURCE.md. 长安城, the road west and
// 五庄观 as data. What rooms and people do when used is in xyj-story.js.
export const ROOMS = {
 "x/city/baihu-w1": {
  "name": "白虎大街",
  "long": "你走在一条宽阔的石板大街上，东面就快到城中心了，可以看到钟楼耸立于前。北面静静的是一家书局，来往多是些读书人。南面是一家钱庄，整天看见客人进进出出，显得生意很兴隆。",
  "exits": {
   "南": "x/city/bank",
   "北": "x/city/bookstore",
   "西": "x/city/baihu-w2",
   "东": "x/city/center"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/baihu-w2": {
  "name": "白虎大街",
  "long": "你走在一条宽阔的石板大街上，东面就快到城中心了，可以看到钟楼耸立于前。南边有一座大府邸，高墙青瓦，一定是什么大官住的地方。有许多读书人出入。北面是长安城的总督衙门，飞檐挂角，显的极有气势。",
  "exits": {
   "南": "x/city/zhongguan",
   "北": "x/city/zhongdu",
   "西": "x/city/baihu-w3",
   "东": "x/city/baihu-w1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/baihu-w3": {
  "name": "白虎大街",
  "long": "你走在一条宽阔的石板大街上，东面就快到城中心了，可以看到钟楼耸立于前。北边是家大的酒楼，里面唏唏嚷嚷，热闹非凡。而南却是家规模不小的寺院，往西就快要出城了。",
  "exits": {
   "南": "x/city/huashengsi",
   "北": "x/city/ziyanglou",
   "西": "x/city/baihu-w4",
   "东": "x/city/baihu-w2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/baihu-w4": {
  "name": "白虎大街",
  "long": "这里已是白虎大街的西段，北面小巷里隐约看到一座大的庙宇，那是长安城的城隍庙，是个热闹的场所。耍把式卖艺的，卖小吃糕点的，都可以看到。是个三教九流，鱼龙浑杂之地。而南面巷中却很难看到几个人影，偶有行人也是低头快步而过。",
  "exits": {
   "南": "x/city/beiyin1",
   "北": "x/city/wailiu1",
   "西": "x/city/ximen",
   "东": "x/city/baihu-w3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/bank": {
  "name": "相记钱庄",
  "long": "这是一家老字号的钱庄，相老板是山西人，这家钱庄从他的爷爷的爷爷的爷爷的爷爷那辈开始办起，一直传到他手里，声誉非常好，在全国各地都有分店。它发行的银票通行全国。钱庄的门口挂有一块牌子(paizi)。",
  "details": {
   "paizi": "这里是钱庄，目前我们提供的服务有：account         查帐。deposit         存款。withdraw        取款。convert         兑换钱币。",
   "牌子": "这里是钱庄，目前我们提供的服务有：account         查帐。deposit         存款。withdraw        取款。convert         兑换钱币。"
  },
  "exits": {
   "北": "x/city/baihu-w1"
  },
  "spawn": {
   "x/city/npc/tiesuanpan": 1
  },
  "area": "xyj"
 },
 "x/city/baodian": {
  "name": "大雄宝殿",
  "long": "正中一座金身大佛盘腿坐在莲花宝座之上，左右是四大天王。一十八位金刚分列两旁。佛前的供台上是善男信女带来的香烛供品及写下心愿的香纸，供台下一个小箱，装的是供奉的金银。",
  "exits": {
   "北": "x/city/huashengsi",
   "东": "x/city/fangzhang"
  },
  "area": "xyj"
 },
 "x/city/baozipu": {
  "name": "包子铺",
  "long": "贾家兄弟几年前合开了这间包子铺，盖因其用料讲究，又有不传秘方，生意是一日好过一日，在城中也闯出了名声。店中摆了十几张八仙桌，几个小伙计来来回回忙活着。",
  "exits": {
   "东": "x/city/wailiu1"
  },
  "spawn": {
   "x/city/npc/jia": 1
  },
  "area": "xyj"
 },
 "x/city/beiyin1": {
  "name": "背阴巷",
  "long": "背阴巷位于长安城之西南，住户大多是些贫苦人家。由于官府很少管这里，所以治安并不十分好。周围民居破落，路边杂草丛生，到处是沉闷的灰色，不见一丝生机。来往的人大多是衣衫褴褛，满面愁色。",
  "exits": {
   "东": "x/city/minju1",
   "东南": "x/city/beiyin2",
   "北": "x/city/baihu-w4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/beiyin2": {
  "name": "背阴巷",
  "long": "背阴巷位于长安城之西南，住户大多是些贫苦人家。由于官府很少管这里，所以治安并不十分好。周围民居破落，路边杂草丛生，到处是沉闷的灰色，不见一丝生机。来往的人大多是衣衫褴褛，满面愁色。西面是个帮会堂口，阴森森的，东面有家小酒馆。",
  "exits": {
   "西": "x/city/sanhua",
   "东": "x/city/jiuguan",
   "西北": "x/city/beiyin1",
   "南": "x/city/beiyin3"
  },
  "spawn": {
   "x/city/npc/thief": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/beiyin3": {
  "name": "背阴巷",
  "long": "背阴巷位于长安城之西南，住户大多是些贫苦人家。由于官府很少管这里，所以治安并不十分好。周围民居破落，路边杂草丛生，到处是沉闷的灰色，不见一丝生机。来往的人大多是衣衫褴褛，满面愁色。",
  "exits": {
   "北": "x/city/beiyin2",
   "东": "x/city/beiyin4",
   "西": "x/city/minju2",
   "南": "x/city/minju3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/beiyin4": {
  "name": "背阴巷",
  "long": "背阴巷位于长安城之西南，住户大多是些贫苦人家。由于官府很少管这里，所以治安并不十分好。周围民居破落，路边杂草丛生，到处是沉闷的灰色，不见一丝生机。来往的人大多是衣衫褴褛，满面愁色。北边有家小酒馆，东面是家粮店。",
  "exits": {
   "北": "x/city/jiuguan",
   "西": "x/city/beiyin3",
   "东南": "x/city/beiyin5",
   "东": "x/city/liangdian"
  },
  "spawn": {
   "x/city/npc/liumang": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/beiyin5": {
  "name": "背阴巷",
  "long": "背阴巷位于长安城之西南，住户大多是些贫苦人家。由于官府很少管这里，所以治安并不十分好。周围民居破落，路边杂草丛生，到处是沉闷的灰色，不见一丝生机。来往的人大多是衣衫褴褛，满面愁色。西边有家杂货铺，东边就到了朱雀大街。",
  "exits": {
   "东": "x/city/zhuque-s4",
   "西北": "x/city/beiyin4",
   "西": "x/city/zahuopu",
   "南": "x/city/minju4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/biaoju": {
  "name": "镖局大院",
  "long": "振远镖局的创始人是老英雄萧振远。萧老英雄年事已高，早已不过问江湖是非了。现在镖局的对外事务都由萧振远的次子萧升主理。大院左右是厢房，靠墙放了些兵器。",
  "exits": {
   "南": "x/city/qinglong-e2"
  },
  "spawn": {
   "x/city/npc/xiaoshen": 1,
   "x/city/npc/biaotou": 2,
   "x/obj/misc/tables#1": 1,
   "x/obj/misc/chairs#5": 1,
   "x/obj/misc/chairs#0": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/bingqipu": {
  "name": "兵器铺",
  "long": "刚一进门就看到兵器架上摆着各种兵器，从上百近重的大刀到轻如芥子的飞磺石，是应有尽有。女老板是老英雄萧振远的小女儿，也是振远镖局二老板，巾帼不让须眉。",
  "exits": {
   "北": "x/city/qinglong-e1"
  },
  "spawn": {
   "x/city/npc/xiaoxiao": 1
  },
  "area": "xyj"
 },
 "x/city/bookstore": {
  "name": "三联书局",
  "long": "这是一家新开张不久的书局。书架上整整齐齐地放着一些手抄的卷轴。雕板印刷书到了唐朝已日趋成熟，因此这里的书架上也放着不少印制精美图文并茂的图书。",
  "exits": {
   "南": "x/city/baihu-w1"
  },
  "spawn": {
   "x/city/npc/bookseller": 1,
   "x/obj/misc/tables#7": 1,
   "x/obj/misc/chairs#1": 1,
   "x/obj/misc/chairs#2": 1
  },
  "area": "xyj"
 },
 "x/city/buzhuang": {
  "name": "柳记布庄",
  "long": "长安柳家的布料生意做到现今老板柳云天手上已是三代，生意是一日好过一日。城中有钱人家要买衣物，准是到这来选。正面有一张紫桐木的长台，后面橱中挂满了各式各样的衣物，鞋冠之类。往来客人不断，确是生意兴隆。",
  "exits": {
   "东": "x/city/xuanwu-n1"
  },
  "spawn": {
   "x/city/npc/liu": 1,
   "x/obj/misc/tables#3": 1,
   "x/obj/misc/chairs#5": 1,
   "x/obj/misc/chairs#0": 1
  },
  "area": "xyj"
 },
 "x/city/caotang": {
  "name": "袁氏草堂",
  "long": "这里是袁守诚先生算卦测字的地方。提起袁守诚，长安城中无人不晓，他乃是当朝钦天监台正先生袁天罡的叔父。小屋里整日访客络绎不绝。但袁先生是个坐不住的人，经常在长安城里闲逛，所以这个小屋里也常常没有人。",
  "exits": {
   "东": "x/city/wailiu2"
  },
  "spawn": {
   "x/city/npc/shouchen": 1,
   "x/city/npc/xiushi": 1,
   "x/obj/misc/tables#4": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1
  },
  "area": "xyj"
 },
 "x/city/center": {
  "name": "十字街头",
  "long": "这里便是长安城的中心，四条大街交汇于此。一座巍峨高大的钟楼耸立于前，很是有些气势。每到清晨，响亮的钟声便会伴着淡淡雾气传向长安城的大街小巷。路口车水马龙，来往人潮不断。",
  "exits": {
   "南": "x/city/zhuque-s1",
   "北": "x/city/xuanwu-n1",
   "西": "x/city/baihu-w1",
   "东": "x/city/qinglong-e1"
  },
  "spawn": {
   "x/city/npc/libai": 1,
   "x/qujing/wuzhuang/npc/zhangguolao": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/chenghuang": {
  "name": "城隍庙",
  "long": "城隍庙里香火极盛。大多是来保佑家里平安，生意兴隆之类。正中前方一座白白胖胖，满脸福相的城隍，左边有一位手持帐簿和毛笔的判官。一位庙祝走前走后，和大家打着招呼。",
  "exits": {
   "南": "x/city/wailiu2"
  },
  "spawn": {
   "x/city/npc/keeper": 1
  },
  "noFight": true,
  "noMagic": true,
  "area": "xyj"
 },
 "x/city/dangpu": {
  "name": "董记当铺",
  "long": "这是长安城里最大的一家当铺了。素来以买卖公平着称。门口挂了一块牌子 (paizi)。董老板是个很精明的生意人，见你走了进来，很客气地和你寒暄，但眼睛里却没有什么笑意，很审慎地打量着你。",
  "details": {
   "paizi": "本当铺财力雄厚，童叟无欺，欢迎惠顾，绝对保密。客官可以在这里：＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊   典当(pawn)     ＊＊   卖断(sell)     ＊＊   估价(value)     ＊＊   赎回(retrieve stamp)   ＊＊   购买(buy) 用list查看。   ＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊各种货物，铜钱、银两、黄金、银票一概通用。"
  },
  "exits": {
   "东": "x/city/zhuque-s1"
  },
  "spawn": {
   "x/city/npc/pablo": 1
  },
  "area": "xyj"
 },
 "x/city/datang": {
  "name": "长安府大堂",
  "long": "大堂之上有一种威严之势，不由让人心惊胆颤。前方一张大桌，后面坐着知府大人。上有一幅大匾，写着＂清正廉名＂四个烫金大字。桌旁立着一位老先生。",
  "exits": {
   "南": "x/city/zhongdu"
  },
  "noFight": true,
  "noMagic": true,
  "area": "xyj"
 },
 "x/city/dongmen": {
  "name": "长安城东门",
  "long": "这里是长安城的东门。西面就到了城中，远望人山人海，往来行人车流不绝。西面一条大路通向远方。城门下有一些执勤的兵士。时下虽已天下太平，但一干兵将还是英姿勃勃，警惕的盯着往来人士。",
  "exits": {
   "西": "x/city/qinglong-e4"
  },
  "spawn": {
   "x/city/npc/wujiang": 1,
   "x/city/npc/bing": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/fangzhang": {
  "name": "方丈室",
  "long": "一间小小的斗室，也没有窗户。房间里只点了一盏小油灯，显的特别昏暗。一榻一几已占去房间的大半，榻上有几个软垫，也是破旧不堪。",
  "exits": {
   "西": "x/city/baodian"
  },
  "spawn": {
   "x/city/npc/faming": 1
  },
  "area": "xyj"
 },
 "x/city/gudongdian": {
  "name": "古董店",
  "long": "大盖城中有钱人家都爱收藏个古董，所以这店中生意也是不坏。四五个精明的伙计正陪着客人看货还价。店中摆着各种各样的古货，墙上的画，架上的瓶，柜里的玉，每样看起来都那么珍贵，让人爱不释手。买的人虽多，却没人知道林老板是从哪进的货。",
  "exits": {
   "西": "x/city/wailiu2"
  },
  "spawn": {
   "x/city/npc/lin": 1,
   "x/obj/misc/tables#7": 1,
   "x/obj/misc/tables#0": 1,
   "x/obj/misc/tables#1": 1,
   "x/obj/misc/chairs#1": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1,
   "x/obj/misc/chairs#4": 1,
   "x/obj/misc/chairs#5": 1,
   "x/obj/misc/chairs#0": 1
  },
  "area": "xyj"
 },
 "x/city/gulou": {
  "name": "鼓楼",
  "long": "鼓楼是当朝皇上为报时而设，是一座长方形的青砖建筑，看起来相当的古朴稳重。顶上成拱形，雕有许多鸟兽鱼虫。每到傍晚，沉闷的鼓声就会随着蔼蔼暮气，在大街小巷中回荡。",
  "exits": {
   "西": "x/city/wailiu1"
  },
  "area": "xyj"
 },
 "x/city/guozi": {
  "name": "国子监",
  "long": "这里是国子监的正堂，也就是秀才们平时上课的地方。高高低低的桌子排了两溜。东边的一排窗子都开着，把屋中照的通亮。正面一桌一椅，上有文房四宝。一位老先生正闭目养神。",
  "exits": {
   "西": "x/city/guozijian"
  },
  "spawn": {
   "x/city/npc/xiucai4": 1,
   "x/obj/misc/tables#5": 1,
   "x/obj/misc/chairs#1": 1,
   "x/obj/misc/chairs#2": 1
  },
  "area": "xyj"
 },
 "x/city/guozijian": {
  "name": "国子监大院",
  "long": "国子监是国家培养高级人才的地方。唐朝的学风很浓，在这里不时可以看到三三两两的学生模样的人大声争辩着什么问题，还有一些老先生门蹙着眉头匆匆走过，象是在思考着什么问题。",
  "exits": {
   "西": "x/city/xuanwu-n3",
   "东": "x/city/guozi"
  },
  "spawn": {
   "x/city/npc/xiucai1": 1,
   "x/city/npc/xiucai2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/huashengsi": {
  "name": "化生寺",
  "long": "化生寺是长安城里规模最大的一家丛林了。整日里香烟袅绕，颂经声不绝于耳。来这里上香还愿的善男信女也特别多，若到了皇道吉日，更是人山人海。",
  "exits": {
   "南": "x/city/baodian",
   "北": "x/city/baihu-w3"
  },
  "spawn": {
   "x/city/npc/sengren1": 1,
   "x/city/npc/sengren": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/jiuguan": {
  "name": "小酒馆",
  "long": "小酒馆不大，屋中零乱的摆了几张方桌，几条长凳。小柜台上摆了些酒坛，所卖也不过是些花生米，老白干之类。累了一天的苦力人总爱凑到一起喝几杯，吹吹牛，消磨时光。",
  "exits": {
   "西": "x/city/beiyin2",
   "南": "x/city/beiyin4"
  },
  "spawn": {
   "x/city/npc/xiaowang": 1,
   "x/city/npc/kuli": 2
  },
  "area": "xyj"
 },
 "x/city/junying": {
  "name": "御林军营",
  "long": "京城驻扎着数万禁卫军，保卫皇上的安全，大多驻扎在皇宫周围以确保皇宫的安全。这里驻扎的是秦琼等人从禁卫军中亲手挑出来的有才之士。平日里几员将军常来传授武艺。",
  "exits": {
   "东": "x/city/xuanwu-n4"
  },
  "spawn": {
   "x/city/npc/yulinjun": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/kezhan": {
  "name": "南城客栈",
  "long": "南城客栈紧靠长安城中心，所以生意非常兴隆。兼之价钱低廉，更是成了外地游客落脚的首选。露天摆了七八张桌子，三教九流人等在此进进出出，络绎不绝，几个跑堂的小二来来回回招待着四方来客。二楼上是雅厅，后面是客房。",
  "exits": {
   "东": "x/city/sleep",
   "西": "x/city/zhuque-s1",
   "上": "x/city/kezhanup"
  },
  "spawn": {
   "x/city/npc/xiaoer": 1,
   "x/ourhome/npc/bigeye": 1
  },
  "noFight": true,
  "noMagic": true,
  "water": true,
  "area": "xyj"
 },
 "x/city/kezhanup": {
  "name": "南城客栈二楼",
  "long": "这里摆设讲究，用的餐具都是从景德镇运来。摆的桌椅都是红木的，在光照之下反射出淡淡的的光泽。推窗望去，长安城中心尽收眼底。一群酒客推杯换盏，正喝的热闹。",
  "exits": {
   "下": "x/city/kezhan"
  },
  "spawn": {
   "x/city/npc/haoke1": 1,
   "x/city/npc/haoke2": 1
  },
  "area": "xyj"
 },
 "x/city/liangdian": {
  "name": "粮仓",
  "long": "这是一家生意兴隆的粮店。丰老板坐在柜台后面笑容可鞠地接待着客人。活计们在一边忙忙碌碌地工作着。如果你身无分文，你还可以在这里向丰老板打一些零工，以赚一些钱。粮店的墙上贴着一张破旧的告示(gaoshi)。",
  "details": {
   "gaoshi": "现在正紧缺人手，急需雇佣一批短工来干活。work   开始工作。",
   "告示": "现在正紧缺人手，急需雇佣一批短工来干活。work   开始工作。"
  },
  "exits": {
   "西": "x/city/beiyin4"
  },
  "spawn": {
   "x/city/npc/feng": 1
  },
  "noFight": true,
  "area": "xyj"
 },
 "x/city/maohuo": {
  "name": "老孙皮货店",
  "long": "这是长安的一家皮货店，专卖各式各样的皮货。据说老孙自开店以来很少卖出什么真正的皮货，倒是传闻他总是零星地高价出售一些五颜六色的祖传猴毛。店内正堂挂有一满是尘土的细字长匾(bian)。",
  "details": {
   "bian": "皮货量少质次，暂停消售。现售祖传猴毛：赤色猴毛：可变斧类武器橙色猴毛：可变刀类武器黄色猴毛：可变叉类武器绿色猴毛：可变锤类武器棕色猴毛：可变剑类武器蓝色猴毛：可变棍类武器靛色猴毛：可变锏类武器粉色猴毛：可变枪类武器紫色猴毛：可变鞭类武器绛色猴毛：可变冠帽类绯色猴毛：可变项链类琥色猴毛：可变衣物类栗色猴毛：可变鞋靴类黑色猴毛：可变食物白色猴毛：可变饮料",
   "长匾": "皮货量少质次，暂停消售。现售祖传猴毛：赤色猴毛：可变斧类武器橙色猴毛：可变刀类武器黄色猴毛：可变叉类武器绿色猴毛：可变锤类武器棕色猴毛：可变剑类武器蓝色猴毛：可变棍类武器靛色猴毛：可变锏类武器粉色猴毛：可变枪类武器紫色猴毛：可变鞭类武器绛色猴毛：可变冠帽类绯色猴毛：可变项链类琥色猴毛：可变衣物类栗色猴毛：可变鞋靴类黑色猴毛：可变食物白色猴毛：可变饮料"
  },
  "exits": {
   "东": "x/city/zhuque-s3"
  },
  "spawn": {
   "x/city/npc/laosun": 1,
   "x/obj/misc/tables#0": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1
  },
  "area": "xyj"
 },
 "x/city/minju1": {
  "name": "民居",
  "long": "这是一户长安城里普普通通的民宅，小夫妇俩朴实勤劳，因此，家境虽然说不上富裕，但也丰衣足食。屋中并没有什么好的摆设，木桌上的玻璃瓶中插了几朵野花。",
  "exits": {
   "西": "x/city/beiyin1"
  },
  "spawn": {
   "x/city/npc/dog": 1,
   "x/city/npc/girl": 1,
   "x/city/npc/liyu": 1
  },
  "area": "xyj"
 },
 "x/city/minju2": {
  "name": "民居",
  "long": "这户民宅从结构上看还是相当不错的，显示出这户人家先前似乎曾经阔过。不知从哪一辈起家道开始衰落了，这座房子也随之年久失修。现在这户人家的两个儿子更是整日里游手好闲，不务正业。",
  "exits": {
   "东": "x/city/beiyin3"
  },
  "spawn": {
   "x/city/npc/xiaopizi": 2
  },
  "area": "xyj"
 },
 "x/city/minju3": {
  "name": "民居",
  "long": "这栋房子里象是很久没有人居住了，墙脚屋檐下到处都是灰。还经常可以看到肥肥的老鼠跑来跑去。院中杂草从生，还可听到几声蛐蛐叫。",
  "exits": {
   "北": "x/city/beiyin3"
  },
  "spawn": {
   "x/city/npc/rat": 3,
   "x/qujing/wudidong/npc/bianfu": 1
  },
  "area": "xyj"
 },
 "x/city/minju4": {
  "name": "民居",
  "long": "这户人家在长安城里也算比较富裕的了。男主人常年经商在外，妻子在家主持家务。如同长安城大多数人家一样，屋里供着南海观音和关王爷的神像。",
  "exits": {
   "北": "x/city/beiyin5"
  },
  "spawn": {
   "x/city/npc/woman": 1,
   "x/city/npc/boy": 1,
   "x/obj/weapon/blade/caidao": 1
  },
  "area": "xyj"
 },
 "x/city/muqi": {
  "name": "木器铺",
  "long": "这是一家专售木器的小店，店面不大，却很整洁。所卖木器不过是些木刀，木枪之类，鲁老板也整日闲逛，无所事事。但私下听说他有门祖传手艺，确谁也没见过。",
  "exits": {
   "西": "x/city/xuanwu-n1"
  },
  "spawn": {
   "x/city/npc/lu": 1
  },
  "area": "xyj"
 },
 "x/city/qinglong-e1": {
  "name": "青龙大街",
  "long": "你走在一条宽阔的石板大街上，西面就快到城中心了，可以看到钟楼耸立于前。北面是一家杂货行，时不是有马车出入送货。南边是一家兵器铺子，是城内的振远镖局开的，专卖一些兵器。",
  "exits": {
   "南": "x/city/bingqipu",
   "北": "x/city/zahuohang",
   "西": "x/city/center",
   "东": "x/city/qinglong-e2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/qinglong-e2": {
  "name": "青龙大街",
  "long": "你走在一条宽阔的石板大街上，西面就快到城中心了，可以看到钟楼耸立于前。南北皆是规模不小的宅院，北面的院门的牌匾上写着斗大的“振远镖局”四字，南面的一所宅院是当朝将军秦叔宝的宅第。",
  "exits": {
   "北": "x/city/biaoju",
   "西": "x/city/qinglong-e1",
   "东": "x/city/qinglong-e3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/qinglong-e3": {
  "name": "青龙大街",
  "long": "你走在一条宽阔的石板大街上，西面就快到城中心了，可以看到钟楼耸立于前。北面有家铁匠铺，传出钉钉铛铛的声音。南面是城中的清虚观，有些道士模样的人出入。",
  "exits": {
   "南": "x/city/qingxuguan",
   "北": "x/city/tiejiangpu",
   "西": "x/city/qinglong-e2",
   "东": "x/city/qinglong-e4"
  },
  "spawn": {
   "x/city/npc/youxia": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/qinglong-e4": {
  "name": "青龙大街",
  "long": "你走在一条宽阔的石板大街上，东边就快要出了城门，远远看到一些兵卒来回巡逻。西边直通到城中心。北边是城内一个大兵营，里面守备森严，一般人是不许入内的。",
  "exits": {
   "西": "x/city/qinglong-e3",
   "东": "x/city/dongmen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/qingxuguan": {
  "name": "清虚观",
  "long": "清虚观是长安城里着名的一座道观。由于唐朝的皇帝和道教宗祖老子同姓，因此道教被奉为唐朝的国教。但由于佛教的传入，道教的状况已大大不如以前。道观中已没有几个人了，但观内原有的气势还没有变。香案上供着元始天尊、太上老君和灵官道君的神像。",
  "exits": {
   "北": "x/city/qinglong-e3"
  },
  "spawn": {
   "x/city/npc/daozhang": 1,
   "x/lingtai/npc/xiao": 2
  },
  "area": "xyj"
 },
 "x/city/sanhua": {
  "name": "三花堂",
  "long": "三花堂是城中名声恶劣的一个帮会，堂中的人大多是些亡命之徒，烧杀抢劫，欺压百姓，无恶不做。而官府却很难抓到把柄而将其除之。正中有三座虎皮大椅，是三位堂主坐的，旁边立了几个面目凶恶的打手。",
  "exits": {
   "东": "x/city/beiyin2"
  },
  "spawn": {
   "x/city/npc/tangzhu1": 1,
   "x/city/npc/fei1": 2,
   "x/city/npc/fei2": 2
  },
  "area": "xyj"
 },
 "x/city/sleep": {
  "name": "客店睡房",
  "long": "客栈的一间睡房，房间干干净净，一排大床，供客人们休息睡觉。",
  "exits": {
   "西": "x/city/kezhan"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/city/tianjiantai": {
  "name": "天监台",
  "long": "这里便是长安城钦天监台，朝廷每年的祭天仪式都在这里举行。中央广场上画着八卦图形，周围还摆这一些施法时用的器具．天监台的总管是正先生袁天罡，总可在这里看到他的身影。",
  "exits": {
   "西": "x/city/xuanwu-n4"
  },
  "spawn": {
   "x/city/npc/yuantiangang": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/tiejiangpu": {
  "name": "铁匠铺",
  "long": "这里是一间打铁铺子，从火炉中冒出的火光将墙壁映得通红，屋子的角落里堆满了象斧子、铁锤、长剑等各式铁器，叮叮当当的声音敲得满屋子响。",
  "exits": {
   "南": "x/city/qinglong-e3"
  },
  "spawn": {
   "x/city/npc/tiejiang": 1
  },
  "area": "xyj"
 },
 "x/city/wailiu1": {
  "name": "歪柳巷",
  "long": "巷子两边是成行的柳树，而柳树皆成扭曲状，故名歪柳巷。巷中有青石铺成的大路供人行走，两旁是青砖瓦房，来往人物恭而有礼，与城内的繁华热闹相比却多出几分闲情安逸。东边是长安城的鼓楼。",
  "exits": {
   "南": "x/city/baihu-w4",
   "北": "x/city/wailiu2",
   "西": "x/city/baozipu",
   "东": "x/city/gulou"
  },
  "spawn": {
   "x/city/npc/yiren2": 1,
   "x/4world/npc/kid": 1,
   "x/4world/npc/kid1": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/wailiu2": {
  "name": "歪柳巷",
  "long": "巷子两边是成行的柳树，而柳树皆成扭曲状，故名歪柳巷。巷中有青石铺成的大路供人行走，两旁是青砖瓦房，来往人物恭而有礼，与城内的繁华热闹相比却多出几分闲情安逸。北面就是城隍庙，前来赶庙会上香的人很多。",
  "exits": {
   "南": "x/city/wailiu1",
   "北": "x/city/chenghuang",
   "西": "x/city/caotang",
   "东北": "x/city/wailiu3",
   "东": "x/city/gudongdian"
  },
  "spawn": {
   "x/city/npc/yiren1": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/wailiu3": {
  "name": "歪柳巷",
  "long": "巷子两边是成行的柳树，而柳树皆成扭曲状，故名歪柳巷。巷中有青石铺成的大路供人行走，两旁是青砖瓦房，来往人物恭而有礼，与城内的繁华热闹相比却多出几分闲情安逸。东边有一个老磨房，北边是个画室。",
  "exits": {
   "西南": "x/city/wailiu2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/wuguan": {
  "name": "长安武馆",
  "long": "你现在正站在一个长安武馆的教练场中，地上铺着黄色的细砂，一群二十来岁的年轻人正在这里努力地操练着, 还有一个中年汉子在不停的喊着号子，让人振奋。",
  "exits": {
   "西": "x/city/xuanwu-n2",
   "东": "x/city/wuguanzhong"
  },
  "spawn": {
   "x/city/npc/dizi": 4,
   "x/city/npc/jiaotou": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/wuguanzhong": {
  "name": "长安武馆",
  "long": "长安武馆的内堂，一切都安安静静，屋里没有点烛，什么也看不清楚。隐约看到两排长椅，正面墙上挂一大旗(qi)。",
  "details": {
   "qi": "＊＊＊＊＊＊＊＊＊＊拳盖三省＊＊＊＊无人能敌＊＊＊＊＊＊＊＊＊＊",
   "大旗": "＊＊＊＊＊＊＊＊＊＊拳盖三省＊＊＊＊无人能敌＊＊＊＊＊＊＊＊＊＊"
  },
  "exits": {
   "西": "x/city/wuguan"
  },
  "spawn": {
   "x/city/npc/fan": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1
  },
  "area": "xyj"
 },
 "x/city/xiemao": {
  "name": "鞋帽店",
  "long": "这里的东西都相当不错，城里的太太小姐多来这里买衣服。逢年过节来光顾的人就更多了。屋中横放一张七尺多长的柜台，柜台后的架子上是一匹匹的布料和成衣。",
  "exits": {
   "西": "x/city/zhuque-s3"
  },
  "spawn": {
   "x/city/npc/xiaoliu": 1,
   "x/city/npc/eryi": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1,
   "x/obj/misc/chairs#4": 1
  },
  "area": "xyj"
 },
 "x/city/ximen": {
  "name": "长安城西门",
  "long": "这里是长安城的西门。东面就到了城中，远望人山人海，往来行人车流不绝。西面一条大路通向远方。城门下有一些执勤的兵士。时下虽已天下太平，但一干兵将还是英姿勃勃，警惕的盯着往来人士。",
  "exits": {
   "西": "x/westway/west1",
   "东": "x/city/baihu-w4"
  },
  "spawn": {
   "x/city/npc/wujiang@ximen": 1,
   "x/city/npc/bing@ximen": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/xuanwu-n1": {
  "name": "玄武大街",
  "long": "这里的路相当的宽，能容好几匹马车并行，长长的道路通向北方。远远的能看到皇宫的朝阳门。南边是城中心，游人相当的多。西边是城中有名的柳记布庄，专门经销各类服饰。东边是家木器铺。",
  "exits": {
   "南": "x/city/center",
   "北": "x/city/xuanwu-n2",
   "西": "x/city/buzhuang",
   "东": "x/city/muqi"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/xuanwu-n2": {
  "name": "玄武大街",
  "long": "这里的路相当的宽，能容好几匹马车并行，长长的道路通向北方。远远的能看到皇宫的朝阳门。西面传来阵阵丝竹声和欢笑声，那里就是天下闻名的“长安乐坊”。东边是城中的一座武馆。",
  "exits": {
   "南": "x/city/xuanwu-n1",
   "北": "x/city/xuanwu-n3",
   "东": "x/city/wuguan"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/xuanwu-n3": {
  "name": "玄武大街",
  "long": "这里的路相当的宽，能容好几匹马车并行，长长的道路通向北方。远远的能看到皇宫的朝阳门。东边传出朗朗读书声，那里是当朝的学府国子监。西边是一座富丽堂皇的大院子，那里是招待国宾和外国使节的宾馆。",
  "exits": {
   "南": "x/city/xuanwu-n2",
   "北": "x/city/xuanwu-n4",
   "东": "x/city/guozijian"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/xuanwu-n4": {
  "name": "玄武大街",
  "long": "这里的路相当的宽，能容好几匹马车并行，长长的道路通向北方。远远的能看到皇宫的朝阳门。东边是长安城的天监台，祭天求雨的仪式都会在那里举行。西边是座御林军营，保卫着皇宫的安全。",
  "exits": {
   "南": "x/city/xuanwu-n3",
   "西": "x/city/junying",
   "东": "x/city/tianjiantai"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/yaopu": {
  "name": "回春药铺",
  "long": "这是长安城一家老字号的药铺，相传原来的老板是皇宫中的御医，手段可知一二。药铺中的摆设也十分考究，桌椅被勤快的伙计擦的干干净净。墙上挂满了别人送来的谢匾。",
  "exits": {
   "西": "x/city/zhuque-s2"
  },
  "spawn": {
   "x/city/npc/yang": 1,
   "x/obj/misc/tables#5": 1,
   "x/obj/misc/chairs#1": 1,
   "x/obj/misc/chairs#2": 1
  },
  "area": "xyj"
 },
 "x/city/zahuohang": {
  "name": "杂货行",
  "long": "杂货行中并不是很大．里里外外堆的都是货物，看起来非常的拥挤。货行以为人送货为生财之路，所以信誉相当的好。里面有几个小伙计正忙着装卸货物，旁边一驾小车等着装货。",
  "exits": {
   "南": "x/city/qinglong-e1"
  },
  "spawn": {
   "x/city/npc/huoji": 3
  },
  "area": "xyj"
 },
 "x/city/zahuopu": {
  "name": "吉祥杂货铺",
  "long": "不知为什么西城虽大，却只有这一间杂货铺。所以每天人来人往，也挺热闹。这里无论是油盐酱醋，还是大米白面，样样齐全。屋里打扫的也十分干净，魏老板在和几位客人说说笑笑。",
  "exits": {
   "东": "x/city/beiyin5"
  },
  "spawn": {
   "x/city/npc/laotou": 1,
   "x/city/npc/laowei": 1,
   "x/xueshan/npc/xunshi-out": 1
  },
  "area": "xyj"
 },
 "x/city/zhongdu": {
  "name": "长安府",
  "long": "这是长安城的行政机关，负责城里的大小事件。无论是偷鸡摸狗的小贼，还是杀人放火的强盗，都会在这里受到应有的处罚。东边墙上贴的是一些告示(gaoshi)，写着近来审案的结果，北边是大堂。",
  "details": {
   "gaoshi": "**     官府通告      **",
   "告示": "**     官府通告      **"
  },
  "exits": {
   "南": "x/city/baihu-w2",
   "北": "x/city/datang"
  },
  "spawn": {
   "x/city/npc/yayi#3": 1,
   "x/city/npc/yayi#4": 1,
   "x/city/npc/yayi#5": 1,
   "x/city/npc/yayi#6": 1,
   "x/city/npc/yayi#7": 1,
   "x/city/npc/yayi#8": 1
  },
  "area": "xyj"
 },
 "x/city/zhongguan": {
  "name": "总管府第",
  "long": "这里是当朝总管殷开山的府第。大门两侧有两头高大的石狮子。院子里种满了花草。东边是一棵槐树，郁郁葱葱，遮盖了大半个院子。一条长廊走道通往后院。",
  "exits": {
   "北": "x/city/baihu-w2",
   "南": "x/city/zhongguan2"
  },
  "spawn": {
   "x/city/npc/guanjia": 1,
   "x/obj/misc/tables#0": 1,
   "x/obj/misc/chairs#0": 1,
   "x/obj/misc/chairs#1": 1,
   "x/obj/misc/chairs#2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/zhongguan2": {
  "name": "总管府大堂",
  "long": "相府的大厅，摆设虽说不是很豪华，却也别有一番气势。正中有一张楠木雕花椅，两边是几张红木的坐椅．总管平时在这里接见一些客人(qiuxue)，两边回廊通向内宅。",
  "exits": {
   "北": "x/city/zhongguan"
  },
  "spawn": {
   "x/city/npc/kaishan": 1,
   "x/obj/misc/tables#2": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1
  },
  "area": "xyj"
 },
 "x/city/zhubao": {
  "name": "珠宝行",
  "long": "珠宝行中珠光宝气四射，眩的人有些睁不开眼睛。精致的长柜中陈设着各类首饰珠宝玉器，几个老行家正陪着客人挑选所需珠宝。一个雕花木架上摆着颗三尺多高的玉树，珍贵之外又透着淡雅秀丽，曲折含蓄之气。东边出去是朱雀大街。",
  "exits": {
   "东": "x/city/zhuque-s2"
  },
  "spawn": {
   "x/city/npc/jin": 1,
   "x/obj/misc/tables#0": 1,
   "x/obj/misc/chairs#2": 1,
   "x/obj/misc/chairs#3": 1
  },
  "area": "xyj"
 },
 "x/city/zhuque-s1": {
  "name": "朱雀大街",
  "long": "朱雀大街上商家众多，大大小小的店铺比邻而立，看起来是相当的豪华富足。宽阔的石板路直通南北，向北通到皇宫的朝阳门，向南可遥望到青青的终南山。路东是家大的客栈，来往旅人不绝，西边是家当铺，出出入入的人有喜有忧。",
  "exits": {
   "北": "x/city/center",
   "南": "x/city/zhuque-s2",
   "西": "x/city/dangpu",
   "东": "x/city/kezhan"
  },
  "spawn": {
   "x/city/npc/jieding": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/zhuque-s2": {
  "name": "朱雀大街",
  "long": "朱雀大街上商家众多，大大小小的店铺比邻而立，看起来是相当的豪华富足。宽阔的石板路直通南北，向北通到皇宫的朝阳门，向南可遥望到青青的终南山。西边是家珠宝店，看起来珠光宝气，东边是家老字号的药铺。",
  "exits": {
   "南": "x/city/zhuque-s3",
   "北": "x/city/zhuque-s1",
   "西": "x/city/zhubao",
   "东": "x/city/yaopu"
  },
  "spawn": {
   "x/nanhai/npc/bonze": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/zhuque-s3": {
  "name": "朱雀大街",
  "long": "朱雀大街上商家众多，大大小小的店铺比邻而立，看起来是相当的豪华富足。宽阔的石板路直通南北，向北通到皇宫的朝阳门，向南可遥望到青青的终南山。西边是家毛货店，东边是个鞋帽店。",
  "exits": {
   "南": "x/city/zhuque-s4",
   "北": "x/city/zhuque-s2",
   "西": "x/city/maohuo",
   "东": "x/city/xiemao"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/zhuque-s4": {
  "name": "朱雀大街",
  "long": "朱雀大街上商家众多，大大小小的店铺比邻而立，看起来是相当的豪华富足。宽阔的石板路直通南北，向北通到皇宫的朝阳门，向南可遥望到青青的终南山。西边一条小路灰蒙蒙的，东边通向望南街。",
  "exits": {
   "北": "x/city/zhuque-s3",
   "西": "x/city/beiyin5"
  },
  "spawn": {
   "x/penglai/npc/laitou": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/city/ziyanglou": {
  "name": "喜福会",
  "long": "喜福会是长安城里最有名的一个饭馆了。这里不但常常有京城里的达官贵人的排场宴请，还每天接待着从各地慕名而来的游人。你刚一踏进门，店小二就殷勤地迎了上来。",
  "exits": {
   "南": "x/city/baihu-w3"
  },
  "spawn": {
   "x/city/npc/xiaoer1": 1,
   "x/obj/misc/tables#1": 1,
   "x/obj/misc/chairs#5": 1,
   "x/obj/misc/chairs#0": 1
  },
  "area": "xyj"
 },
 "x/qujing/baoxiang/bei1": {
  "name": "北城门",
  "long": "宝象国的北城门，因多次发生妖祸，城门外大道已被堵塞。向西北方向看去可以见到山峦，向南极目看去，远远能看见宝象国的王宫大门。",
  "exits": {
   "西北": "x/qujing/baoxiang/yedu",
   "南": "x/qujing/baoxiang/bei2"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/bing": 2,
   "x/qujing/baoxiang/npc/shanyao": 1,
   "x/qujing/baoxiang/npc/people#5": 1,
   "x/qujing/baoxiang/npc/people#6": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/bei2": {
  "name": "北街",
  "long": "北街上人来人往，或是渔夫担鱼或是樵夫担柴，城内家的家，户的户，只斗逍遥。熙熙攘攘，日子过得十分爽快。向北是城门，向南是王宫所在。",
  "exits": {
   "北": "x/qujing/baoxiang/bei1",
   "南": "x/qujing/baoxiang/bei3"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/people#6@bei2": 1,
   "x/qujing/baoxiang/npc/people#7": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/bei3": {
  "name": "北街",
  "long": "街上人很多，路两边不时传来异国情调的琴声。东面有一家小作坊，门口放着式样奇特的毯子木器之类手工制品向路人销售，南边通向王宫大门。",
  "exits": {
   "北": "x/qujing/baoxiang/bei2",
   "东": "x/qujing/baoxiang/zuofang",
   "南": "x/qujing/baoxiang/bei4"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/people#7@bei3": 1,
   "x/qujing/baoxiang/npc/people#0": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/bei4": {
  "name": "北街",
  "long": "这里离城市中心很近，路面宽敞，异国情调的人们走来走去，非常热闹。东面有一马栈，不时有人挑担或牵马进去休息歇脚。往南就是王宫的大门。",
  "exits": {
   "北": "x/qujing/baoxiang/bei3",
   "东": "x/qujing/baoxiang/mazhan",
   "南": "x/qujing/baoxiang/gongmen"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/people#0@bei4": 1,
   "x/qujing/baoxiang/npc/people#1": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/dong": {
  "name": "波月洞",
  "long": "洞内湿气环绕，阴森逼人。向外看，洞口苔藓斑斑；向里看，不知深浅，隐约可听见滴水之声。好一个倒木横担，枯藤挂峰，不知是妖境还是仙境。",
  "exits": {
   "西北": "x/qujing/baoxiang/dongwai"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/shanyao@dong": 6,
   "x/qujing/baoxiang/npc/huangpao": 1,
   "x/qujing/baoxiang/npc/baihua": 1
  },
  "area": "xyj"
 },
 "x/qujing/baoxiang/dongwai": {
  "name": "金塔",
  "long": "山崖边有一座宝塔，金顶放光，彩气腾腾。青青香草秀，艳艳野花开。远观如三岛天堂，近看似蓬莱仙境，果真是绝好去处。塔前有一白玉石板(shi ban)。",
  "details": {
   "shi ban": "碗子山波月洞"
  },
  "exits": {
   "西北": "x/qujing/baoxiang/songlin"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/gongmen": {
  "name": "王宫门",
  "long": "宫门呈双月拱形，由山里运来的玉石筑成，上面雕有细腻的金丝银线弧形花纹。向里面看去，宫殿林立阁宇重重，祥云笼罩，气象极度非凡。",
  "exits": {
   "西南": "x/qujing/baoxiang/xi4",
   "北": "x/qujing/baoxiang/bei4",
   "东": "x/qujing/baoxiang/zhendong",
   "南": "x/qujing/baoxiang/longfeng"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/bing@gongmen": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/longfeng": {
  "name": "龙凤阁",
  "long": "龙凤阁盘龙舞凤，阁内玉雕云绘层层叠叠富丽堂皇，多用金丝银线攀绕而成。阁中有琼瑶翡翠花座，四周镶嵌玛瑙涟漪纹。这里是宝象国礼待外宾的地方。",
  "exits": {
   "北": "x/qujing/baoxiang/gongmen",
   "南": "x/qujing/baoxiang/yujie1"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/dashi": 1,
   "x/qujing/baoxiang/npc/bing@longfeng": 2
  },
  "area": "xyj"
 },
 "x/qujing/baoxiang/mazhan": {
  "name": "马栈",
  "long": "这里是个简易的客栈，放着一排木板斜靠椅，对面是一排长长的床榻。客人们远道而来可以将车马托交给栈后老板，然后上榻休息一番。",
  "exits": {
   "西": "x/qujing/baoxiang/bei4"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/qiao1": {
  "name": "云头桥",
  "long": "一条河东西方向横在面前，两岸泥泞，沼泽连片。走进去怕是会陷在里面人马无归，河心更是急流滚滚。河面上有一串用船搭成的简易浮桥(qiao)。",
  "details": {
   "qiao": "几只船连成一座浮桥通向对岸。",
   "浮桥": "几只船连成一座浮桥通向对岸。"
  },
  "exits": {
   "东北": "x/qujing/baoxiang/shanwan3",
   "南": "x/qujing/baoxiang/qiao2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/qiao2": {
  "name": "云头桥",
  "long": "一条河东西方向横在面前，两岸泥泞，沼泽连片。走进去怕是会陷在里面人马无归，河心更是急流滚滚。河面上有一串用船搭成的简易浮桥(qiao)。",
  "details": {
   "qiao": "几只船连成一座浮桥通向对岸。",
   "浮桥": "几只船连成一座浮桥通向对岸。"
  },
  "exits": {
   "北": "x/qujing/baoxiang/qiao1",
   "东南": "x/qujing/baoxiang/xi1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shan2": {
  "name": "碗子山",
  "long": "山上黄土龟裂岩石层层，参差不奇地长着一些树林灌木。路从岩石周围绕道铺设盘山而行，迂回曲折。四处风吹草动，空谷回音。令人恍然不知所处。",
  "exits": {
   "南": "x/qujing/baoxiang/shanwan2",
   "东": "x/qujing/baoxiang/shanwan1",
   "东南": "x/qujing/baoxiang/shan3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shan3": {
  "name": "碗子山",
  "long": "山上黄土龟裂岩石层层，参差不奇地长着一些树林灌木。路从岩石周围绕道铺设盘山而行，迂回曲折。四处风吹草动，空谷回音。令人恍然不知所处。",
  "exits": {
   "西北": "x/qujing/baoxiang/shan2",
   "西南": "x/qujing/baoxiang/shan4",
   "东南": "x/qujing/baoxiang/shan5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shan4": {
  "name": "碗子山",
  "long": "山上黄土龟裂岩石层层，参差不奇地长着一些树林灌木。路从岩石周围绕道铺设盘山而行，迂回曲折。四处风吹草动，空谷回音。令人恍然不知所处。",
  "exits": {
   "北": "x/qujing/baoxiang/shanwan2",
   "东北": "x/qujing/baoxiang/shan3",
   "东南": "x/qujing/baoxiang/shan6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shan5": {
  "name": "碗子山",
  "long": "山上黄土龟裂岩石层层，参差不奇地长着一些树林灌木。路从岩石周围绕道铺设盘山而行，迂回曲折。四处风吹草动，空谷回音。令人恍然不知所处。",
  "exits": {
   "西北": "x/qujing/baoxiang/shan3",
   "南": "x/qujing/baoxiang/songlin"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shan6": {
  "name": "碗子山",
  "long": "山上黄土龟裂岩石层层，参差不奇地长着一些树林灌木。路从岩石周围绕道铺设盘山而行，迂回曲折。四处风吹草动，空谷回音。令人恍然不知所处。",
  "exits": {
   "西北": "x/qujing/baoxiang/shan4",
   "南": "x/qujing/baoxiang/shanwan3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shanwan1": {
  "name": "山湾",
  "long": "山湾地带有一些缓缓急急的水流，溪水哗哗作响。岸边是松松的沼泽地，堆着枯枝烂叶。四处见山峦，路在这里显得宽畅一些，地面较平坦。",
  "exits": {
   "西": "x/qujing/baoxiang/shan2",
   "东": "x/qujing/baoxiang/yelu4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shanwan2": {
  "name": "山湾",
  "long": "山湾地带有一些缓缓急急的水流，溪水哗哗作响。岸边是松松的沼泽地，堆着枯枝烂叶。四处见山峦，路在这里显得宽畅一些，地面较平坦。",
  "exits": {
   "西北": "x/qujing/baoxiang/yelu3",
   "北": "x/qujing/baoxiang/shan2",
   "南": "x/qujing/baoxiang/shan4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/shanwan3": {
  "name": "山湾",
  "long": "山湾地带有一些缓缓急急的水流，溪水哗哗作响。岸边是松松的沼泽地，堆着枯枝烂叶。四处见山峦，路在这里显得宽畅一些，地面较平坦。",
  "exits": {
   "北": "x/qujing/baoxiang/shan6",
   "西南": "x/qujing/baoxiang/qiao1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/songlin": {
  "name": "黑松林",
  "long": "山路崎岖，松林丛簇藤攀葛绕，边上是一带林丘，柏翠松青。林子内长满野草山花，幽幽暗暗，看起来这里草深路小，不知能通向何处。",
  "exits": {
   "北": "x/qujing/baoxiang/shan5",
   "东南": "x/qujing/baoxiang/dongwai"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/tiandi": {
  "name": "天地阁",
  "long": "天地阁祥云飞舞瑞霭环绕，阁内绘云万道金丝银线缭绕朦胧，阁中是金光闪闪的宝座。四周文官武弁目光炯炯肃然伫立，两边自有洁衣宫女手托金银果盘，内有百味异果香醪佳酿。",
  "exits": {
   "北": "x/qujing/baoxiang/yujie6"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl": 2,
   "x/qujing/baoxiang/npc/king": 1
  },
  "area": "xyj"
 },
 "x/qujing/baoxiang/xi1": {
  "name": "西城门",
  "long": "城楼高筑，旌旗飘扬。城门西北有条长河弯曲地流过，远远可以看见河上架了座浮桥。往东看是城里闹市区，许多路人正忙着进出城。西边一条小路通到山边。",
  "exits": {
   "西北": "x/qujing/baoxiang/qiao2",
   "东": "x/qujing/baoxiang/xi2"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/bing@xi1": 2,
   "x/qujing/baoxiang/npc/people#6@xi1": 1,
   "x/qujing/baoxiang/npc/people#7@xi1": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/xi2": {
  "name": "西街",
  "long": "西街上人流不息，城内家的家，户的户，只斗逍遥。大都是渔夫或樵夫，丰衣足食，日子十分爽快。向西是出城之路，向东可以抵达宝象国王宫。南边有家饭馆，飘出烤羊肉香。",
  "exits": {
   "西": "x/qujing/baoxiang/xi1",
   "东": "x/qujing/baoxiang/xi3",
   "南": "x/qujing/baoxiang/yangrou"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/people#7@xi2": 1,
   "x/qujing/baoxiang/npc/people#0@xi2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/xi3": {
  "name": "西街",
  "long": "街心由从山里运来的石板条筑成，看上去宽敞。路两边人不少，打扮装饰奇特。向东南方向望去可以见到许多高大的宫殿，那里便是王宫所在地。",
  "exits": {
   "西": "x/qujing/baoxiang/xi2",
   "东": "x/qujing/baoxiang/xi4"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/people#0@xi3": 1,
   "x/qujing/baoxiang/npc/people#1@xi3": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/xi4": {
  "name": "西街",
  "long": "这里差不多是市中心了，路面宽敞，人们走来走去，非常热闹。北面有一门面挂着各式各样的锡器，东南方向可以远远地看见王宫的群宫群殿。",
  "exits": {
   "西": "x/qujing/baoxiang/xi3",
   "北": "x/qujing/baoxiang/xiqi",
   "东北": "x/qujing/baoxiang/gongmen"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/people#1@xi4": 1,
   "x/qujing/baoxiang/npc/people#2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/xiqi": {
  "name": "锡器铺",
  "long": "锡器铺里挂着各式各样的器皿，有长嘴锡壶，大小锡碗锡盘锡盆。上面都打印着奇形怪状的花纹。可以听见屋后的一些小学徒正在乒乒乓乓地敲打着锡器。",
  "exits": {
   "南": "x/qujing/baoxiang/xi4"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/xijiang": 1
  },
  "area": "xyj"
 },
 "x/qujing/baoxiang/yangrou": {
  "name": "羊肉馆",
  "long": "一座沿街搭棚而建的羊肉馆，一群食客盘腿席地而坐，围着一圈陶盆陶盘聚在一起撕着羊肉进餐。从里面的厨房里不断地传出阵阵羊肉香味。",
  "exits": {
   "北": "x/qujing/baoxiang/xi2"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/laoban": 1
  },
  "area": "xyj"
 },
 "x/qujing/baoxiang/yedu": {
  "name": "野渡",
  "long": "这里是城外废弃不用的野渡口，渡口长满野生植物。遍地沼泽，笼罩着黑雾似的瘴气。散发着腥味的风一阵阵吹来，熏得人头重脚轻。",
  "exits": {
   "西北": "x/qujing/baoxiang/yelu5",
   "东南": "x/qujing/baoxiang/bei1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu1": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "东南": "x/qujing/baoxiang/yelu2",
   "西南": "x/qujing/pingding/shan11"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu2": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "西北": "x/qujing/baoxiang/yelu1",
   "东南": "x/qujing/baoxiang/yelu3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu3": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "西北": "x/qujing/baoxiang/yelu2",
   "东南": "x/qujing/baoxiang/shanwan2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu4": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "西": "x/qujing/baoxiang/shanwan1",
   "东": "x/qujing/baoxiang/yelu5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu5": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "东北": "x/qujing/baoxiang/yelu6",
   "西": "x/qujing/baoxiang/yelu4",
   "东南": "x/qujing/baoxiang/yedu"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu6": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "东北": "x/qujing/baoxiang/yelu7",
   "西南": "x/qujing/baoxiang/yelu5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu7": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "东北": "x/qujing/baoxiang/yelu8",
   "西南": "x/qujing/baoxiang/yelu6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yelu8": {
  "name": "野路",
  "long": "野路道路细长崎岖，起伏不停。四周远远都是大小山峦，低洼处是一片湿湿的沼泽地带，看不见人间烟火。走在山路上静悄悄，雾气浓郁，不由得让人小心加快步伐。",
  "exits": {
   "东": "x/westway/jiayu",
   "西南": "x/qujing/baoxiang/yelu7"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/nuzi": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yujie1": {
  "name": "白玉阶",
  "long": "由白玉铺成的台阶，级级缓缓向上铺去。每一级台阶都精工细雕而成，镶嵌有金丝银线。两边各通向一宫一殿，左为大明宫，右为太极殿。",
  "exits": {
   "北": "x/qujing/baoxiang/longfeng",
   "南": "x/qujing/baoxiang/yujie2"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl@yujie1": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yujie2": {
  "name": "白玉阶",
  "long": "由白玉铺成的台阶，级级缓缓向上铺去。每一级台阶都精工细雕而成，镶嵌有金丝银线。两边各通向一宫一殿，左为大明宫，右为太极殿。",
  "exits": {
   "北": "x/qujing/baoxiang/yujie1",
   "南": "x/qujing/baoxiang/yujie3"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl@yujie2": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yujie3": {
  "name": "白玉阶",
  "long": "由白玉铺成的台阶，级级缓缓向上铺去。每一级台阶都精工细雕而成，镶嵌有金丝银线。两边各通向一宫一殿，左为大明宫，右为太极殿。",
  "exits": {
   "北": "x/qujing/baoxiang/yujie2",
   "南": "x/qujing/baoxiang/yujie4"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl@yujie3": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yujie4": {
  "name": "白玉阶",
  "long": "由白玉铺成的台阶，级级缓缓向上铺去。每一级台阶都精工细雕而成，镶嵌有金丝银线。两边各通向一宫一殿，左为大明宫，右为太极殿。",
  "exits": {
   "北": "x/qujing/baoxiang/yujie3",
   "南": "x/qujing/baoxiang/yujie5"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl@yujie4": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yujie5": {
  "name": "白玉阶",
  "long": "由白玉铺成的台阶，级级缓缓向上铺去。每一级台阶都精工细雕而成，镶嵌有金丝银线。两边各通向一宫一殿，左为大明宫，右为太极殿。",
  "exits": {
   "北": "x/qujing/baoxiang/yujie4",
   "南": "x/qujing/baoxiang/yujie6"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl@yujie5": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/yujie6": {
  "name": "白玉阶",
  "long": "由白玉铺成的台阶，级级缓缓向上铺去。每一级台阶都精工细雕而成，镶嵌有金丝银线。两边各通向一宫一殿，左为大明宫，右为太极殿。",
  "exits": {
   "北": "x/qujing/baoxiang/yujie5",
   "南": "x/qujing/baoxiang/tiandi"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/girl@yujie6": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/zhendong": {
  "name": "镇东场",
  "long": "镇东场由石墙圈起，场角有一口大石井。场的东面驻有王家卫兵，西南方向更是高墙筑起，里面宫殿林立，阁宇重重，那里便是宝象国王宫。",
  "exits": {
   "西": "x/qujing/baoxiang/gongmen"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/bing@zhendong": 4
  },
  "outdoors": true,
  "water": true,
  "area": "xyj"
 },
 "x/qujing/baoxiang/zuofang": {
  "name": "小作坊",
  "long": "作坊的墙上挂满各式各样手工制品和织毯，一位中年男人脚踩木织机织着毯子。屋角堆满木头块和一些未完工的家俱。透过门帘，可以听见里间有人正在吱呀呀地纺线。",
  "exits": {
   "西": "x/qujing/baoxiang/bei3"
  },
  "spawn": {
   "x/qujing/baoxiang/npc/fangzhu": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/banlu1": {
  "name": "石板路",
  "long": "南城的小丘上整整齐齐地铺着一条石板路，路边种有两排矮树，间有奇花异草。矮树绿枝碧叶，清风徐徐，恰是十分宜人。",
  "exits": {
   "南": "x/qujing/chechi/banlu2",
   "北": "x/qujing/chechi/dianmen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/banlu2": {
  "name": "石板路",
  "long": "南城的小丘上整整齐齐地铺着一条石板路，路边种有两排矮树，间有奇花异草。矮树绿枝碧叶，清风徐徐，恰是十分宜人。",
  "exits": {
   "南": "x/qujing/chechi/qiang7d",
   "北": "x/qujing/chechi/banlu1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/beiyuan": {
  "name": "北院",
  "long": "北院里空荡荡，靠墙稀稀拉拉种了一些树，半死不活地长着。北边放有一见底的破水缸。再往北是间破门破窗的房子，往南是金刚殿。",
  "exits": {
   "北": "x/qujing/chechi/zhaifang",
   "南": "x/qujing/chechi/jingang"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/caichang": {
  "name": "西城菜场",
  "long": "菜场是车迟国平民购买日常瓜果蔬菜肉类的地方。西边是满地一片瓜皮菜叶，东边有一地的碎骨鸡毛。不远处，有几辆破旧的空大车停在路边。",
  "exits": {
   "北": "x/qujing/chechi/jieshi2",
   "东": "x/qujing/chechi/jieshi4",
   "西": "x/qujing/chechi/jiuguan",
   "南": "x/qujing/chechi/taiping"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/cangjing": {
  "name": "藏经楼",
  "long": "藏经楼里古色古香，门边有一落地铜炉，正在冒着袅袅香烟，门后墙头挂着一些铜铃，靠壁放有一排奇怪的檀香书柜。东南方面有长道通向后殿。",
  "exits": {
   "东南": "x/qujing/chechi/houdian"
  },
  "spawn": {
   "x/obj/book/daode": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/da": {
  "name": "大相府",
  "long": "大相府由青垣石砌成。府外灯笼高挂，府内宽敞明亮富丽堂皇。一看就知是朝廷官人的住宅，朝西有两扇包铜厚门紧闭，大概是通向相府的内院。",
  "exits": {
   "东": "x/qujing/chechi/jieshi3"
  },
  "spawn": {
   "x/qujing/chechi/npc/daguan": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/damo": {
  "name": "达摩殿",
  "long": "达摩殿里空空如也，几张供桌零乱地堆在屋角。墙面龟裂，门窗无存。地上胡乱地铺着干草，上面放着一些破旧蒲团。西北方向有一通道。",
  "exits": {
   "西北": "x/qujing/chechi/jingang"
  },
  "spawn": {
   "x/qujing/chechi/npc/heshang#0": 1,
   "x/qujing/chechi/npc/heshang#1": 1,
   "x/qujing/chechi/npc/heshang#2": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/dianmen": {
  "name": "殿门",
  "long": "这里是三清观的殿门，殿门红木青檐翻修一新，门口织锦裹柱且绣有二十二个大字：“雨顺风调，愿祝天尊无量法；河清海晏，祈求万岁有余年。”",
  "details": {},
  "exits": {
   "南": "x/qujing/chechi/banlu1",
   "西": "x/qujing/chechi/zhai",
   "东": "x/qujing/chechi/wugu",
   "北": "x/qujing/chechi/sanqing"
  },
  "spawn": {
   "x/qujing/chechi/npc/daozhang": 1
  },
  "doors": {
   "东": {
    "name": "小门",
    "closed": true
   }
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/dong": {
  "name": "东场",
  "long": "东场在皇宫的东南边，由大块石头东西向三排铺成。往西是相邻的中场，向北伸首可以见到高大的殿阁。这里路人不多且行色匆匆，不敢随便久留。",
  "exits": {
   "东": "x/qujing/chechi/jieshi7",
   "西": "x/qujing/chechi/zhong"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/dongmen": {
  "name": "东城门",
  "long": "东城门大开，城楼高耸，车迟国旌旗迎风簌簌飘扬。楼两角筑有石墙箭楼，站有两列弓箭手。楼下护墙借备森严，内有一排穿甲戴盔的刀斧手严阵以待。",
  "exits": {
   "东": "x/qujing/chechi/shatan1",
   "南": "x/qujing/chechi/qiang5g",
   "北": "x/qujing/chechi/qiang3g",
   "西": "x/qujing/chechi/ruizhao"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/fang": {
  "name": "方丈楼",
  "long": "方丈楼里简朴干净，只有一方木桌，上面有几本佛经，几个木鱼和木鱼锤。边上有一张长长的木床，叠有几方棉布薄被。南边是木梯，往下通向后殿。",
  "exits": {
   "南": "x/qujing/chechi/hou"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/chechi/feng": {
  "name": "凤阁",
  "long": "凤阁里挤满了小姐少奶奶，阁檐上绘有两个银羽飞凤，展翅欲飞。阁内一排花莲长椅，配有紫花茶几。一些无事小姐少奶奶们饭后在此叽叽喳喳，品茶消食。",
  "exits": {
   "西": "x/qujing/chechi/jieshi10"
  },
  "spawn": {
   "x/qujing/chechi/npc/feng#7": 1,
   "x/qujing/chechi/npc/feng#8": 1,
   "x/qujing/chechi/npc/feng#9": 1,
   "x/qujing/chechi/npc/feng#10": 1,
   "x/qujing/chechi/npc/feng#0": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/fengyun": {
  "name": "风云殿",
  "long": "殿里云霞缭绕，烟雾层叠，仙气十足。殿壁上绘满各种风神云神的画像，神态各异。殿心有一八角香桌，上面燃着九柱麝香，香气扑鼻。",
  "exits": {
   "南": "x/qujing/chechi/jishui",
   "东": "x/qujing/chechi/jinluan"
  },
  "spawn": {
   "x/qujing/chechi/npc/taijian": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/gong1a": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "东": "x/qujing/chechi/gong1b",
   "南": "x/qujing/chechi/gong2a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong1b": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "东": "x/qujing/chechi/gong1c",
   "西": "x/qujing/chechi/gong1a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong1c": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "东": "x/qujing/chechi/gong1d",
   "西": "x/qujing/chechi/gong1b"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong1d": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "东": "x/qujing/chechi/gong1e",
   "西": "x/qujing/chechi/gong1c"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong1e": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong2e",
   "西": "x/qujing/chechi/gong1d"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong2a": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong3a",
   "北": "x/qujing/chechi/gong1a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong2e": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong3e",
   "北": "x/qujing/chechi/gong1e"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong3a": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong4a",
   "北": "x/qujing/chechi/gong2a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong3e": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong4e",
   "北": "x/qujing/chechi/gong2e"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong4a": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong5a",
   "北": "x/qujing/chechi/gong3a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong4e": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "南": "x/qujing/chechi/gong5e",
   "北": "x/qujing/chechi/gong3e"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong5a": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "北": "x/qujing/chechi/gong4a",
   "东": "x/qujing/chechi/gong5b"
  },
  "spawn": {
   "x/qujing/chechi/npc/weishi": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong5b": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "西": "x/qujing/chechi/gong5a",
   "东": "x/qujing/chechi/gongmen"
  },
  "spawn": {
   "x/qujing/chechi/npc/weishi@gong5b": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong5d": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "西": "x/qujing/chechi/gongmen",
   "东": "x/qujing/chechi/gong5e"
  },
  "spawn": {
   "x/qujing/chechi/npc/weishi@gong5d": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gong5e": {
  "name": "宫墙",
  "long": "宫墙雄伟，用大石块堆砌而成，顶端飘着皇家旌旗。每隔一丈就设有一个哨楼，上面有哨兵持矛巡逻。墙下是一条石路，沿墙伸向远方。",
  "exits": {
   "西": "x/qujing/chechi/gong5d",
   "北": "x/qujing/chechi/gong4e"
  },
  "spawn": {
   "x/qujing/chechi/npc/weishi@gong5e": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/gongmen": {
  "name": "宫门",
  "long": "车迟国宫门南开，门边镶有赤金钉，门上嵌着白玉檐。庄严肃穆。门洞里可供皇家马车双行，门楼上雕砌玉麒麟金龙朱雀，祥云缥缈霞光万道。",
  "exits": {
   "西": "x/qujing/chechi/gong5b",
   "东": "x/qujing/chechi/gong5d",
   "南": "x/qujing/chechi/zhong",
   "北": "x/qujing/chechi/zhaomen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/hou": {
  "name": "后殿",
  "long": "后殿里气氛宁静，灵台高筑，依次摆列着八菩萨的佛象。这里香火也是不断，地上铺着一些旧蒲团。西边殿门通向正殿，往北向上通往方丈楼。",
  "exits": {
   "北": "x/qujing/chechi/fang",
   "西": "x/qujing/chechi/zheng"
  },
  "spawn": {
   "x/qujing/chechi/npc/heshang#5": 1,
   "x/qujing/chechi/npc/heshang#0@hou": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/houdian": {
  "name": "后殿",
  "long": "后殿里香烟缭绕，笙竽声不绝，殿内设有一台，上放有铜壶玉简若干。此刻烛光闪闪，灯火通明。向南是三清殿，西北方向是藏经楼。",
  "exits": {
   "南": "x/qujing/chechi/sanqing",
   "西北": "x/qujing/chechi/cangjing"
  },
  "spawn": {
   "x/qujing/chechi/npc/daotong": 2
  },
  "area": "xyj"
 },
 "x/qujing/chechi/hougong1": {
  "name": "后宫",
  "long": "后宫里四面宝镜高悬，宫殿的地面由赤铜一字铺开，华贵之极。宫内供着仙果仙花，案上的宝烛辉煌，馥郁真香，真是令人心旷神怡。",
  "exits": {
   "东": "x/qujing/chechi/hougong2"
  },
  "spawn": {
   "x/qujing/chechi/npc/girl": 2
  },
  "area": "xyj"
 },
 "x/qujing/chechi/hougong2": {
  "name": "后宫",
  "long": "后宫里四面宝镜高悬，宫殿的地面由赤铜一字铺开，华贵之极。宫内供着仙果仙花，案上的宝烛辉煌，馥郁真香，真是令人心旷神怡。",
  "exits": {
   "西": "x/qujing/chechi/hougong1",
   "东": "x/qujing/chechi/hougong3",
   "南": "x/qujing/chechi/jinluan"
  },
  "spawn": {
   "x/qujing/chechi/npc/girl@hougong2": 3
  },
  "area": "xyj"
 },
 "x/qujing/chechi/hougong3": {
  "name": "后宫",
  "long": "后宫里四面宝镜高悬，宫殿的地面由赤铜一字铺开，华贵之极。宫内供着仙果仙花，案上的宝烛辉煌，馥郁真香，真是令人心旷神怡。",
  "exits": {
   "西": "x/qujing/chechi/hougong2"
  },
  "spawn": {
   "x/qujing/chechi/npc/girl@hougong3": 2
  },
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi1": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/xiao",
   "南": "x/qujing/chechi/jieshi3"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#4": 1,
   "x/qujing/chechi/npc/people#5": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi10": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "北": "x/qujing/chechi/jieshi9",
   "东": "x/qujing/chechi/feng"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#4@jieshi10": 1,
   "x/qujing/chechi/npc/people#5@jieshi10": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi2": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/tangchi",
   "南": "x/qujing/chechi/caichang"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#5@jieshi2": 1,
   "x/qujing/chechi/npc/people#6": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi3": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "北": "x/qujing/chechi/jieshi1",
   "西": "x/qujing/chechi/da",
   "南": "x/qujing/chechi/xinshi"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#6@jieshi3": 1,
   "x/qujing/chechi/npc/people#7": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi4": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/caichang",
   "东": "x/qujing/chechi/jieshi5"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#7@jieshi4": 1,
   "x/qujing/chechi/npc/people#0": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi5": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/jieshi4",
   "东": "x/qujing/chechi/xinshi"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#0@jieshi5": 1,
   "x/qujing/chechi/npc/people#1": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi6": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/shutang",
   "东": "x/qujing/chechi/xi",
   "北": "x/qujing/chechi/taiping",
   "南": "x/qujing/chechi/jieshi8"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#1@jieshi6": 1,
   "x/qujing/chechi/npc/people#2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi7": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/dong",
   "北": "x/qujing/chechi/ruizhao",
   "南": "x/qujing/chechi/jieshi9"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#2@jieshi7": 1,
   "x/qujing/chechi/npc/people#3": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi8": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "西": "x/qujing/chechi/xitai",
   "南": "x/qujing/chechi/yanhua",
   "北": "x/qujing/chechi/jieshi6"
  },
  "spawn": {
   "x/qujing/chechi/npc/people#3@jieshi8": 1,
   "x/qujing/chechi/npc/people#4@jieshi8": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jieshi9": {
  "name": "街市",
  "long": "拥挤的车迟国街市，由碎砖石铺成。人声鼎沸，街景秀丽，令人目不暇己。两边有不少行人来回匆匆走过。偶尔有些小贩沿途边走叫边卖着什么。",
  "exits": {
   "北": "x/qujing/chechi/jieshi7",
   "东": "x/qujing/chechi/long",
   "南": "x/qujing/chechi/jieshi10"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jingang": {
  "name": "金刚殿",
  "long": "金刚殿里残破不堪，光线十分阴暗。几个泥胎已经因为年久失修颜色早就脱落了，台上放着旧香鼎，有气无力地燃着佛香。往东是正殿，东南方向有一通道。",
  "exits": {
   "西": "x/qujing/chechi/simen",
   "东": "x/qujing/chechi/zheng",
   "北": "x/qujing/chechi/beiyuan",
   "东南": "x/qujing/chechi/damo"
  },
  "area": "xyj"
 },
 "x/qujing/chechi/jinluan": {
  "name": "金銮殿",
  "long": "大殿里灯火通明，金莲御座高高在上。御座前后各有一对玉麒麟守候，两边是缀珠紫红绒帘，华贵之极。殿顶龙飞凤舞，碎玉堆金，紫气浩荡。",
  "exits": {
   "北": "x/qujing/chechi/hougong2",
   "南": "x/qujing/chechi/wufeng",
   "西": "x/qujing/chechi/fengyun",
   "东": "x/qujing/chechi/leiyu"
  },
  "spawn": {
   "x/qujing/chechi/npc/taijian@jinluan": 1,
   "x/qujing/chechi/npc/king": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/jishui": {
  "name": "祭水场",
  "long": "场上供有一玳瑁镶边的石井，泉水自井中潺潺流出，井边翠竹密生。旱季时这里也是祭水的场所，仙香奇异无比。东边的五色拱门直通坛场。",
  "exits": {
   "北": "x/qujing/chechi/fengyun",
   "东": "x/qujing/chechi/tan"
  },
  "spawn": {
   "x/qujing/chechi/npc/jz1": 1,
   "x/qujing/chechi/obj/chantai": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/jiuguan": {
  "name": "酒馆",
  "long": "小酒馆里边酒柜齐胸高。后面可以看见三个大酒缸。墙上挂着一些酒葫芦酒袋，案桌上放着大块的熟牛肉。酒保一边招待客人，一边切着熟牛肉。",
  "exits": {
   "东": "x/qujing/chechi/caichang"
  },
  "spawn": {
   "x/qujing/chechi/npc/jiubao": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/leiyu": {
  "name": "雷雨殿",
  "long": "殿里供着石像，分别为雷雨之神。殿心有一张嵌玉桌，上面插有祈牌祈签。桌边放置有四个绣花软面蒲团，以供王室贵族祈祷时使用。",
  "exits": {
   "南": "x/qujing/chechi/qiyu",
   "西": "x/qujing/chechi/jinluan"
  },
  "spawn": {
   "x/qujing/chechi/npc/taijian@leiyu": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/long": {
  "name": "龙楼",
  "long": "龙楼是车迟国公子哥们聚合的场所，楼外门柱上雕有金鳞盘龙一对，楼内摆满八仙桌。这里常有衣着考究的公子王孙整日在此逍遥混日，花天酒地谈东道西。",
  "exits": {
   "西": "x/qujing/chechi/jieshi9"
  },
  "spawn": {
   "x/qujing/chechi/npc/long#9": 1,
   "x/qujing/chechi/npc/long#10": 1,
   "x/qujing/chechi/npc/long#11": 1,
   "x/qujing/chechi/npc/long#12": 1,
   "x/qujing/chechi/npc/long#0": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/miyuan": {
  "name": "秘院",
  "long": "这里是一座秘密的四方庭院，四周是高墙。院内阴气习习，罂粟盛开。南边是藏经楼的后墙，墙下有一暗通道。",
  "exits": {
   "南": "x/qujing/chechi/cangjing"
  },
  "spawn": {
   "x/qujing/chechi/npc/langli": 1,
   "x/qujing/chechi/npc/chaili": 1,
   "x/qujing/chechi/npc/beili": 1,
   "x/qujing/chechi/npc/mali": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1a": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "南": "x/qujing/chechi/qiang2a",
   "东": "x/qujing/chechi/qiang1b"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1b": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang1a",
   "东": "x/qujing/chechi/qiang1c"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1c": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang1b",
   "东": "x/qujing/chechi/qiang1d"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1d": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang1c",
   "东": "x/qujing/chechi/qiang1e",
   "南": "x/qujing/chechi/shanlu1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1e": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang1d",
   "东": "x/qujing/chechi/qiang1f"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1f": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang1e",
   "东": "x/qujing/chechi/qiang1g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang1g": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang1f",
   "南": "x/qujing/chechi/qiang2g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang2a": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang1a",
   "南": "x/qujing/chechi/qiang3a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang2g": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang1g",
   "南": "x/qujing/chechi/qiang3g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang3a": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang2a",
   "南": "x/qujing/chechi/ximen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang3g": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "南": "x/qujing/chechi/dongmen",
   "北": "x/qujing/chechi/qiang2g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang5a": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/ximen",
   "南": "x/qujing/chechi/qiang6a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang5g": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/dongmen",
   "南": "x/qujing/chechi/qiang6g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang6a": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang5a",
   "南": "x/qujing/chechi/qiang7a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang6g": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang5g",
   "南": "x/qujing/chechi/qiang7g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7a": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang6a",
   "东": "x/qujing/chechi/qiang7b"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7b": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang7a",
   "东": "x/qujing/chechi/qiang7c"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7c": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang7b",
   "东": "x/qujing/chechi/qiang7d"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7d": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang7c",
   "东": "x/qujing/chechi/qiang7e",
   "北": "x/qujing/chechi/banlu2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7e": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang7d",
   "东": "x/qujing/chechi/qiang7f"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7f": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "西": "x/qujing/chechi/qiang7e",
   "东": "x/qujing/chechi/qiang7g"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiang7g": {
  "name": "城墙",
  "long": "高大的城墙，有三丈多高，由灰岩夹黄土筑成。城墙上斑斑驳驳，看起来已经有些年代了，沿着长长的墙铺有一条结实的土石路，可以行人走车。",
  "exits": {
   "北": "x/qujing/chechi/qiang6g",
   "西": "x/qujing/chechi/qiang7f"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/qiyu": {
  "name": "祈雨场",
  "long": "场上有一玉池，水波微荡，金莲朵朵在池里争艳。这里是旱季祈祷龙王降雨的场所，周围彩墙绘有雾峰云海。西边有一五色拱门通向坛场。",
  "exits": {
   "北": "x/qujing/chechi/leiyu",
   "西": "x/qujing/chechi/tan"
  },
  "spawn": {
   "x/qujing/chechi/npc/jz3": 1,
   "x/qujing/chechi/obj/youguo": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/ruizhao": {
  "name": "瑞兆场",
  "long": "一个以细砖铺就的小广场，场周围种了一圈苦椹树，由于缺水树木已经有些干枯了。这里是车迟国的闹市区之一，行人来来往往络绎不绝。",
  "exits": {
   "东": "x/qujing/chechi/dongmen",
   "南": "x/qujing/chechi/jieshi7"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/sanqing": {
  "name": "三清殿",
  "long": "殿内左有大鼓右有铜钟，中间是一石案，上面是五色花瓶和青石烛台，供有不少丰盛斋宴。四壁功德悬挂，殿心分别是元始天尊，灵宝道君和太上老君。",
  "exits": {
   "南": "x/qujing/chechi/dianmen",
   "北": "x/qujing/chechi/houdian",
   "东北": "x/qujing/chechi/xiang1"
  },
  "spawn": {
   "x/qujing/chechi/npc/yuanshi": 1,
   "x/qujing/chechi/npc/lingbao": 1,
   "x/qujing/chechi/npc/taishang": 1,
   "x/qujing/chechi/obj/zhengsu": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/shanlu1": {
  "name": "山路",
  "long": "城内的小山坡上斜斜地筑了一条土小路，弯弯曲曲盘旋而上。因年久失修的缘故，路面坎坷凸凹不平。路边早已是乱草丛生，杂石竖横。",
  "exits": {
   "北": "x/qujing/chechi/qiang1d",
   "东": "x/qujing/chechi/shanlu2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shanlu2": {
  "name": "山路",
  "long": "城内的小山坡上斜斜地筑了一条土小路，弯弯曲曲盘旋而上。因年久失修的缘故，路面坎坷凸凹不平。路边早已是乱草丛生，杂石竖横。",
  "exits": {
   "西": "x/qujing/chechi/shanlu1",
   "西南": "x/qujing/chechi/shanlu3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shanlu3": {
  "name": "山路",
  "long": "城内的小山坡上斜斜地筑了一条土小路，弯弯曲曲盘旋而上。因年久失修的缘故，路面坎坷凸凹不平。路边早已是乱草丛生，杂石竖横。",
  "exits": {
   "东北": "x/qujing/chechi/shanlu2",
   "南": "x/qujing/chechi/shanlu4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shanlu4": {
  "name": "山路",
  "long": "城内的小山坡上斜斜地筑了一条土小路，弯弯曲曲盘旋而上。因年久失修的缘故，路面坎坷凸凹不平。路边早已是乱草丛生，杂石竖横。",
  "exits": {
   "北": "x/qujing/chechi/shanlu3",
   "东南": "x/qujing/chechi/simen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shatan1": {
  "name": "沙滩",
  "long": "这里气候干燥，土地龟裂。中间是一片沙滩，被人踩出一条大路，路上压有几条大车轱辘碾出的深深痕迹，路边零星散有一些残破的砖石木料。这里气候干燥，土地龟裂。",
  "exits": {
   "东南": "x/qujing/chechi/shatan2",
   "西": "x/qujing/chechi/dongmen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shatan2": {
  "name": "沙滩",
  "long": "这里气候干燥，土地龟裂。中间是一片沙滩，被人踩出一条大路，路上压有几条大车轱辘碾出的深深痕迹，路边零星散有一些残破的砖石木料。这里气候干燥，土地龟裂。",
  "exits": {
   "西北": "x/qujing/chechi/shatan1",
   "南": "x/qujing/chechi/shatan3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shatan3": {
  "name": "沙滩",
  "long": "这里气候干燥，土地龟裂。中间是一片沙滩，被人踩出一条大路，路上压有几条大车轱辘碾出的深深痕迹，路边零星散有一些残破的砖石木料。这里气候干燥，土地龟裂。",
  "exits": {
   "东南": "x/qujing/wuji/shandao5",
   "北": "x/qujing/chechi/shatan2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shatan4": {
  "name": "沙滩",
  "long": "这里气候干燥，土地龟裂。中间是一片沙滩，被人踩出一条大路，路上压有几条大车轱辘碾出的深深痕迹，路边零星散有一些残破的砖石木料。这里气候干燥，土地龟裂。",
  "exits": {
   "东": "x/qujing/chechi/ximen",
   "西南": "x/qujing/chechi/shatan5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shatan5": {
  "name": "沙滩",
  "long": "这里气候干燥，土地龟裂。中间是一片沙滩，被人踩出一条大路，路上压有几条大车轱辘碾出的深深痕迹，路边零星散有一些残破的砖石木料。这里气候干燥，土地龟裂。",
  "exits": {
   "东北": "x/qujing/chechi/shatan4",
   "西南": "x/qujing/tongtian/xiaolu3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/shutang": {
  "name": "书堂",
  "long": "书堂中间有一方桌，上有两卷摊开的绢书。墙上贴有几幅长长的字画，灯龛里烛光闪闪。四周放满了布面毡底圆蒲团，供客人们闲座。地上隔不远就置一个矮脚几，放有铜壶陶碗。",
  "exits": {
   "东": "x/qujing/chechi/jieshi6"
  },
  "spawn": {
   "x/qujing/chechi/npc/shulao": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/simen": {
  "name": "寺门",
  "long": "山前有一座破旧的寺庙，已经退色的门半掩半开，落满了蛛网灰尘。似乎这里很久已经没有什么香客光临了。门上的大匾隐隐约约可见“智渊寺”几个金字。",
  "exits": {
   "西北": "x/qujing/chechi/shanlu4",
   "东": "x/qujing/chechi/jingang"
  },
  "spawn": {
   "x/qujing/chechi/npc/heshang#3": 1,
   "x/qujing/chechi/npc/heshang#4": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/taiping": {
  "name": "太平场",
  "long": "太平场以碎砖铺成，场子不太大。场心有破旧的泥土祭坛，上面稀稀拉拉地长了一些枯草。这里算是车迟国的比较热闹的地段，穿着朴素的行人在场上走过。",
  "exits": {
   "西": "x/qujing/chechi/ximen",
   "北": "x/qujing/chechi/caichang",
   "南": "x/qujing/chechi/jieshi6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/tan": {
  "name": "坛场",
  "long": "无数玉坛一线排开，中间有一黄铜大鼎。风摇青树，瑞草齐生，生气勃然。左右各有一五色拱门相通，西边是祭水场，东边是祈雨场。",
  "exits": {
   "南": "x/qujing/chechi/zhaomen",
   "北": "x/qujing/chechi/wufeng",
   "东": "x/qujing/chechi/qiyu",
   "西": "x/qujing/chechi/jishui"
  },
  "spawn": {
   "x/qujing/chechi/npc/jz2": 1,
   "x/qujing/chechi/obj/guizi": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/tangchi": {
  "name": "汤池",
  "long": "屋子里散着热腾腾的蒸气，夹杂有柴烟的味道。四周的石墙已被熏得有点发黑，墙角架有一排大铁锅，锅边有木架子供人上下进出，上面搭着一些毛边干浴巾。",
  "exits": {
   "东": "x/qujing/chechi/jieshi2"
  },
  "spawn": {
   "x/qujing/chechi/obj/yujin": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/wufeng": {
  "name": "五凤楼",
  "long": "楼里设有五凤，各为赤橙青绿紫色。神态栩栩如生，欲飞欲留。楼上传来丝竹之声，香云缭绕，气氛极为祥和无比。北面通往金銮殿，南面通向坛场。",
  "exits": {
   "北": "x/qujing/chechi/jinluan",
   "南": "x/qujing/chechi/tan"
  },
  "spawn": {
   "x/qujing/chechi/npc/girl@wufeng": 5
  },
  "area": "xyj"
 },
 "x/qujing/chechi/wugu": {
  "name": "五谷轮回",
  "long": "屋子里光线阴暗，墙壁潮湿，里面似乎什么也看不清。门口有几大柱粗香冒着浓烟，边上有一小凳，上面放有一叠一叠的粗糙草纸。",
  "details": {},
  "exits": {
   "西": "x/qujing/chechi/dianmen"
  },
  "doors": {
   "西": {
    "name": "小门",
    "closed": true
   }
  },
  "area": "xyj"
 },
 "x/qujing/chechi/xi": {
  "name": "西场",
  "long": "西场用大块石头东西向三排铺成，位于车迟皇宫的西南边，往西是比较热闹的城区，往东则是中场，从这里往北看，可以见到皇宫的殿阁。",
  "exits": {
   "西": "x/qujing/chechi/jieshi6",
   "东": "x/qujing/chechi/zhong"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/xiang1": {
  "name": "厢廊",
  "long": "长长的厢廊，两边是镶花气窗，廊檐上挂有串串铜铃，随风叮当。地上铺有一条素色布毯，厢廊的西南方向是三清殿，东边通往厢房。",
  "exits": {
   "西南": "x/qujing/chechi/sanqing",
   "东": "x/qujing/chechi/xiang2"
  },
  "spawn": {
   "x/qujing/chechi/npc/daoshi": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/xiang2": {
  "name": "厢房",
  "long": "厢房里整整齐齐，南北各有一红砖大炕，铺着锦花棉被。炕上有硬木炕桌，放有茶锺瓷碗。墙上有一些字画，写着：“一诚达上，寸敬虔归。”",
  "exits": {
   "西": "x/qujing/chechi/xiang1",
   "东": "x/qujing/chechi/xiang3"
  },
  "spawn": {
   "x/qujing/chechi/npc/daoshi@xiang2": 2
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/chechi/xiang3": {
  "name": "厢房",
  "long": "厢房里整整齐齐，南北各有一红砖大炕，铺着锦花棉被。炕上有硬木炕桌，放有茶锺瓷碗。墙上有一些字画，写着：“罗天大醮，彻夜看经。”",
  "exits": {
   "西": "x/qujing/chechi/xiang2"
  },
  "spawn": {
   "x/qujing/chechi/npc/daoshi@xiang3": 2
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/chechi/xiao": {
  "name": "小相府",
  "long": "小相府门口放着一紫檀木武器架，朝南开有一排莲花窗，朝西靠墙设有仙桌仙椅，上面供有时鲜水果。北面是一排白底彩染绸缎面屏风，将堂屋隔开。",
  "exits": {
   "东": "x/qujing/chechi/jieshi1"
  },
  "spawn": {
   "x/qujing/chechi/npc/xiaoguan": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/ximen": {
  "name": "西城门",
  "long": "西城门紧闭，城楼高耸，车迟国旌旗迎风簌簌飘扬。楼两角筑有石墙箭楼，站有两列弓箭手。楼下护墙借备森严，内有一排穿甲戴盔的刀斧手严阵以待。",
  "exits": {
   "北": "x/qujing/chechi/qiang3a",
   "东": "x/qujing/chechi/taiping",
   "西": "x/qujing/chechi/shatan4",
   "南": "x/qujing/chechi/qiang5a"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/xinshi": {
  "name": "新市口",
  "long": "新市口向北通往富贵人家的住宅区。街口宽敞，路面用石砖铺就，这里相对比较安静干净。路上行人略少一点，有时可以见到一两辆遮棚马车驶过。",
  "exits": {
   "西": "x/qujing/chechi/jieshi5",
   "北": "x/qujing/chechi/jieshi3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/xitai": {
  "name": "戏台",
  "long": "这里屋深幽暗，屋子西端搭有一座精巧但已有点退色的戏台。戏台两边挂有数盏明亮的灯笼。前几排有些矮凳，后面是一些红油茶桌和宽背扶手椅。",
  "exits": {
   "东": "x/qujing/chechi/jieshi8"
  },
  "spawn": {
   "x/qujing/chechi/npc/xizi": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/yanhua": {
  "name": "烟花院",
  "long": "烟花院已有些年头了，院门漆成大彩红色，里面香气扑鼻，各种摆设琳琅满目，桌上放有丝琴竹箫。从关闭的里屋门后隐隐传来女人笑唱的声音。",
  "exits": {
   "北": "x/qujing/chechi/jieshi8"
  },
  "spawn": {
   "x/qujing/chechi/npc/jinchai": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/zhai": {
  "name": "斋房",
  "long": "三清观的斋房设在殿前，斋房宽大，设有一大红木斋桌。房内无灶无锅。因车迟国内文武官员爱道成风，大小男女前来拜请奉斋络绎不觉，这里善斋不断。",
  "exits": {
   "东": "x/qujing/chechi/dianmen"
  },
  "spawn": {
   "x/qujing/chechi/obj/gongguo": 1,
   "x/qujing/chechi/obj/guo": 2
  },
  "area": "xyj"
 },
 "x/qujing/chechi/zhaifang": {
  "name": "斋房",
  "long": "斋房里砌了一大泥灶，上面支着一口大铁锅，灶边是两个水桶和一些干柴。木台上放着一些粗瓷碗，还有几只木凳。南边有一门通向院子。",
  "exits": {
   "南": "x/qujing/chechi/beiyuan"
  },
  "spawn": {
   "x/qujing/chechi/obj/rice": 1,
   "x/qujing/chechi/obj/kang": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/zhaomen": {
  "name": "朝门",
  "long": "朝门祥光笼罩，东边设有一只金钟，西边设有一面银鼓，门下百种奇花异草怒放。门上是透亮琉璃瓦，门道由黛色罗纹细密石条一路铺平。",
  "exits": {
   "南": "x/qujing/chechi/gongmen",
   "北": "x/qujing/chechi/tan"
  },
  "spawn": {
   "x/qujing/chechi/npc/weishi@zhaomen": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/chechi/zheng": {
  "name": "正殿",
  "long": "正殿雕梁画栋，佛祖在中间的宝座上高供，两边是无数阿罗，揭谛。香炉青烟袅袅，殿堂虽是旧了些，倒也打扫一净。往东便是后殿，西边通向金刚殿。",
  "exits": {
   "西": "x/qujing/chechi/jingang",
   "东": "x/qujing/chechi/hou"
  },
  "spawn": {
   "x/qujing/chechi/npc/heshang#3@zheng": 1,
   "x/qujing/chechi/npc/heshang#4@zheng": 1
  },
  "area": "xyj"
 },
 "x/qujing/chechi/zhong": {
  "name": "中场",
  "long": "中场在皇宫的南面，用大块石头铺成，向北是皇宫的入口，飘着车迟国的旌旗。每天钟鸣时分，有士兵出场演武操练。东面是东场，西面是西场。",
  "exits": {
   "西": "x/qujing/chechi/xi",
   "北": "x/qujing/chechi/gongmen",
   "东": "x/qujing/chechi/dong"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/beidong": {
  "name": "北洞",
  "long": "北洞里面靠墙的地方垒着几块大石头，石头已被熏得漆黑，上面吊着一口大铁锅，石头边放着山柴，干草等。西南方有一出口通向洞门。",
  "exits": {
   "西南": "x/qujing/pingding/dongmen"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao1": 3,
   "x/qujing/pingding/npc/yinjiao": 1
  },
  "area": "xyj"
 },
 "x/qujing/pingding/dating": {
  "name": "大厅",
  "long": "环顾四周，可见大厅颇具规模，里面放着木桌木椅之类，大厅的北面悬挂着一口铜钟，由蔓藤牵动着。西边有通道引向莲花洞的前厅。",
  "exits": {
   "西": "x/qujing/pingding/qianting"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao1@dating": 2
  },
  "area": "xyj"
 },
 "x/qujing/pingding/dongmen": {
  "name": "洞门",
  "long": "洞门里有山涧流过，山涧之上有一石栏曲桥，一头通向洞外，另一头在洞里连向高处。高处有几个大小不同的通道，分别导向洞的纵深地带。",
  "exits": {
   "西北": "x/qujing/pingding/dongwai",
   "东北": "x/qujing/pingding/beidong",
   "南": "x/qujing/pingding/nandong",
   "东": "x/qujing/pingding/qianting"
  },
  "spawn": {
   "x/qujing/pingding/npc/hu": 1,
   "x/qujing/pingding/npc/long": 1
  },
  "area": "xyj"
 },
 "x/qujing/pingding/dongwai": {
  "name": "洞外",
  "long": "一道山涧从脚下流过，发出潺潺的流水声。山涧的去处有一片绿色林木，林木的后面有一山洞，洞的上沿有一凿平的石壁，上面刻着：平顶山莲花洞。",
  "exits": {
   "西北": "x/qujing/pingding/ping3",
   "东南": "x/qujing/pingding/dongmen"
  },
  "spawn": {
   "x/qujing/pingding/npc/chong": 1,
   "x/qujing/pingding/npc/gui": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/nandong": {
  "name": "南洞",
  "long": "南洞里几块大石上晾着兽皮之类的东西，洞穴里鬼旋风打转，发出呜呜的声响。洞顶低垂，从上挂下钟乳石，洞的北面通向洞的出口。",
  "exits": {
   "北": "x/qujing/pingding/dongmen"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao1@nandong": 2,
   "x/qujing/pingding/npc/jinjiao": 1
  },
  "area": "xyj"
 },
 "x/qujing/pingding/neidian": {
  "name": "内殿",
  "long": "石洞在这里宽敞起来，形成一个殿厅。殿里有半人高的石块，上面搭着长木板，边上有石鼓和石桩子。殿的东边是卧室，东北边通向石廊。",
  "exits": {
   "东北": "x/qujing/pingding/shilang2",
   "东": "x/qujing/pingding/wofang1",
   "西南": "x/qujing/pingding/wofang2"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao2": 3
  },
  "area": "xyj"
 },
 "x/qujing/pingding/ping1": {
  "name": "平顶山",
  "long": "山岭巍峨起伏，峰顶气势缓平，天边泛起一层彩霞，云雾之中遍野林海更加郁郁苍苍。在这里道路平坦，路边有小灌木一丛一丛，古树萧萧。",
  "exits": {
   "东南": "x/qujing/pingding/ping3",
   "西南": "x/qujing/pingding/ping2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/ping2": {
  "name": "平顶山",
  "long": "山岭巍峨起伏，峰顶气势缓平，天边泛起一层彩霞，云雾之中遍野林海更加郁郁苍苍。在这里道路平坦，路边有小灌木一丛一丛，古树萧萧。",
  "exits": {
   "东南": "x/qujing/pingding/ping4",
   "西南": "x/qujing/pingding/shan2",
   "南": "x/qujing/pingding/shan3",
   "东北": "x/qujing/pingding/ping1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/ping3": {
  "name": "平顶山",
  "long": "山岭巍峨起伏，峰顶气势缓平，天边泛起一层彩霞，云雾之中遍野林海更加郁郁苍苍。在这里道路平坦，路边有小灌木一丛一丛，古树萧萧。",
  "exits": {
   "东南": "x/qujing/pingding/dongwai",
   "西北": "x/qujing/pingding/ping1",
   "南": "x/qujing/pingding/ping4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/ping4": {
  "name": "平顶山",
  "long": "山岭巍峨起伏，峰顶气势缓平，天边泛起一层彩霞，云雾之中遍野林海更加郁郁苍苍。在这里道路平坦，路边有小灌木一丛一丛，古树萧萧。",
  "exits": {
   "北": "x/qujing/pingding/ping3",
   "西北": "x/qujing/pingding/ping2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/qianting": {
  "name": "前厅",
  "long": "前厅的四周是狰狞的石壁，石壁上渗出一滴滴的水珠，长着青青的苔藓。厅的西边有一个出口，通向洞门，往东是一石门洞，里面燃着篝火。",
  "exits": {
   "西": "x/qujing/pingding/dongmen",
   "东": "x/qujing/pingding/dating"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao1@qianting": 2
  },
  "area": "xyj"
 },
 "x/qujing/pingding/shan1": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东": "x/qujing/pingding/shan2",
   "西南": "x/qujing/pingding/shan4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan10": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东南": "x/qujing/pingding/shan13",
   "西": "x/qujing/pingding/shan9"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan11": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "西南": "x/qujing/pingding/shan13",
   "东北": "x/qujing/baoxiang/yelu1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan12": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东北": "x/qujing/pingding/shan8",
   "南": "x/qujing/pingding/wulin1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan13": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "西北": "x/qujing/pingding/shan10",
   "东北": "x/qujing/pingding/shan11"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan14": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东北": "x/qujing/pingding/wulin2",
   "西南": "x/qujing/pingding/yalong1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan2": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "西": "x/qujing/pingding/shan1",
   "东北": "x/qujing/pingding/ping2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan3": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东南": "x/qujing/pingding/shan5",
   "北": "x/qujing/pingding/ping2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan4": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东北": "x/qujing/pingding/shan1",
   "西南": "x/qujing/wuji/shandao1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan5": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "西北": "x/qujing/pingding/shan3",
   "西南": "x/qujing/pingding/shan6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan6": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东北": "x/qujing/pingding/shan5",
   "东南": "x/qujing/pingding/shan7"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan7": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "西北": "x/qujing/pingding/shan6",
   "南": "x/qujing/pingding/shan8"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan8": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "北": "x/qujing/pingding/shan7",
   "东": "x/qujing/pingding/shan9",
   "西南": "x/qujing/pingding/shan12"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shan9": {
  "name": "山道",
  "long": "崎岖的山道在山坡上蜿蜒，四处是荒山野岭，云雾蒙蒙一片，远看林海郁郁苍苍。路边有不尽的古树和藤葛，西风阵阵，吹得满天的风沙。",
  "exits": {
   "东": "x/qujing/pingding/shan10",
   "西": "x/qujing/pingding/shan8"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/shilang1": {
  "name": "石廊",
  "long": "洞在这里略显狭窄，左右都是粗糙的石壁，有滴水缓缓流下，落在地上发出叮咚的声音。东北方有光线从洞外斜照进来，南边仍然有另一个石壁。",
  "exits": {
   "西北": "x/qujing/pingding/shimen",
   "南": "x/qujing/pingding/shilang2"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao2@shilang1": 3
  },
  "area": "xyj"
 },
 "x/qujing/pingding/shilang2": {
  "name": "石廊",
  "long": "石廊在此有一点回转，两边的石壁上长着褐色的地衣，布满整个壁面。地上坑坑洼洼，积着几汪泥水。石廊的西南通向莲花洞的内殿。",
  "exits": {
   "北": "x/qujing/pingding/shilang1",
   "西南": "x/qujing/pingding/neidian"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao2@shilang2": 4
  },
  "area": "xyj"
 },
 "x/qujing/pingding/shimen": {
  "name": "石门",
  "long": "山岩的下面，有一突出的巨石，宛若门檐一般。石门的一侧竖着刻有一列文字，上面写着：压龙山压龙洞。石门的东南方有一入口通向洞里面。",
  "exits": {
   "东北": "x/qujing/pingding/yalong2",
   "东南": "x/qujing/pingding/shilang1"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao2@shimen": 2
  },
  "area": "xyj"
 },
 "x/qujing/pingding/wofang1": {
  "name": "卧房",
  "long": "卧房的地上铺着野草干花，南边的石壁前有一红木桌，上面点着一盏青玉灯，北边的石壁上有一石龛。卧房的西边有一走廊通往内殿。",
  "exits": {
   "西": "x/qujing/pingding/neidian"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao2@wofang1": 2,
   "x/qujing/pingding/npc/laonai": 1,
   "x/qujing/pingding/obj/food#0": 1,
   "x/qujing/pingding/obj/food#1": 1,
   "x/qujing/pingding/obj/food#2": 1
  },
  "area": "xyj"
 },
 "x/qujing/pingding/wofang2": {
  "name": "卧房",
  "long": "一个石卧房，地上铺着各种兽皮，石壁上也挂满了兽皮兽头兽角。靠墙边是一张黛色石桌，一张大木椅。东北方向有一石门通往内殿。",
  "exits": {
   "东北": "x/qujing/pingding/neidian"
  },
  "spawn": {
   "x/qujing/pingding/npc/yao2@wofang2": 2,
   "x/qujing/pingding/npc/huaqi": 1,
   "x/qujing/pingding/obj/shoupi": 2
  },
  "area": "xyj"
 },
 "x/qujing/pingding/wulin1": {
  "name": "乌林子",
  "long": "黑压压远远一片林子，树木茂密，杂草有齐胸高。乱石丛中有一条弯曲的小路，路上碎石高高低低地铺开。风吹草动，仿佛四周有眼睛在暗处盯着你。",
  "exits": {
   "北": "x/qujing/pingding/shan12",
   "东南": "x/qujing/pingding/wulin2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/wulin2": {
  "name": "乌林子",
  "long": "黑压压远远一片林子，树木茂密，杂草有齐胸高。乱石丛中有一条弯曲的小路，路上碎石高高低低地铺开。风吹草动，仿佛四周有眼睛在暗处盯着你。",
  "exits": {
   "西北": "x/qujing/pingding/wulin1",
   "西南": "x/qujing/pingding/shan14"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/yalong1": {
  "name": "压龙山",
  "long": "山脊起伏，云雾缥缈一片，在此可见四处森林茂密，一些山岩奇峰从树木中耸立出来，长着青苔地衣，色彩如斑如锈。小路从山脊上蜿蜒地穿过。",
  "exits": {
   "东北": "x/qujing/pingding/shan14",
   "南": "x/qujing/pingding/yalong2",
   "东南": "x/qujing/pingding/yalong3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/yalong2": {
  "name": "压龙山",
  "long": "山脊起伏，云雾缥缈一片，在此可见四处森林茂密，一些山岩奇峰从树木中耸立出来，长着青苔地衣，色彩如斑如锈。小路从山脊上蜿蜒地穿过。",
  "exits": {
   "北": "x/qujing/pingding/yalong1",
   "东": "x/qujing/pingding/yalong3",
   "西南": "x/qujing/pingding/shimen"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/pingding/yalong3": {
  "name": "压龙山",
  "long": "山脊起伏，云雾缥缈一片，在此可见四处森林茂密，一些山岩奇峰从树木中耸立出来，长着青苔地衣，色彩如斑如锈。小路从山脊上蜿蜒地穿过。",
  "exits": {
   "西北": "x/qujing/pingding/yalong1",
   "西": "x/qujing/pingding/yalong2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/bing1": {
  "name": "冰道",
  "long": "河面冻得结结实实，厚厚的一层冰已经被人走出一条长长的冰道，也有大冰撬滑过留下的痕迹。风呼呼地打在脸上，刺骨地寒冷。",
  "exits": {
   "西": "x/qujing/tongtian/hexi3",
   "东": "x/qujing/tongtian/bing2",
   "南": "x/qujing/tongtian/bing3"
  },
  "spawn": {
   "x/qujing/tongtian/npc/people#16": 1,
   "x/qujing/tongtian/npc/people#17": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/bing2": {
  "name": "冰道",
  "long": "河面冻得结结实实，厚厚的一层冰已经被人走出一条长长的冰道，也有大冰撬滑过留下的痕迹。风呼呼地打在脸上，刺骨地寒冷。",
  "exits": {
   "西": "x/qujing/tongtian/bing1",
   "东": "x/qujing/tongtian/hedong2",
   "南": "x/qujing/tongtian/bing4"
  },
  "spawn": {
   "x/qujing/tongtian/npc/people#17@bing2": 1,
   "x/qujing/tongtian/npc/people#18": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/bing3": {
  "name": "冰道",
  "long": "河面冻得结结实实，厚厚的一层冰已经被人走出一条长长的冰道，也有大冰撬滑过留下的痕迹。风呼呼地打在脸上，刺骨地寒冷。",
  "exits": {
   "西": "x/qujing/tongtian/hexi4",
   "东": "x/qujing/tongtian/bing4",
   "北": "x/qujing/tongtian/bing1"
  },
  "spawn": {
   "x/qujing/tongtian/npc/people#18@bing3": 1,
   "x/qujing/tongtian/npc/people#19": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/bing4": {
  "name": "冰道",
  "long": "河面冻得结结实实，厚厚的一层冰已经被人走出一条长长的冰道，也有大冰撬滑过留下的痕迹。风呼呼地打在脸上，刺骨地寒冷。",
  "exits": {
   "西": "x/qujing/tongtian/bing3",
   "东": "x/qujing/tongtian/hedong3",
   "北": "x/qujing/tongtian/bing2"
  },
  "spawn": {
   "x/qujing/tongtian/npc/people#19@bing4": 1,
   "x/qujing/tongtian/npc/people#20": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/chen1": {
  "name": "陈家庄",
  "long": "陈家庄里住着大大小小的人家，多姓陈故为陈家庄。庄子里不时可听见热闹的声音，夹杂着鸡鸣狗叫。一些人家的烟囱里冒出淡淡的烟，空气中散发着柴烟香。",
  "exits": {
   "北": "x/qujing/tongtian/minju1",
   "西": "x/qujing/tongtian/minju4",
   "东": "x/qujing/tongtian/chen2",
   "南": "x/qujing/tongtian/chen3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/chen2": {
  "name": "陈家庄",
  "long": "陈家庄里住着大大小小的人家，多姓陈故为陈家庄。庄子里不时可听见热闹的声音，夹杂着鸡鸣狗叫。一些人家的烟囱里冒出淡淡的烟，空气中散发着柴烟香。",
  "exits": {
   "东北": "x/qujing/tongtian/minju3",
   "西北": "x/qujing/tongtian/minju2",
   "西": "x/qujing/tongtian/chen1",
   "东南": "x/qujing/tongtian/xiaolu3"
  },
  "spawn": {
   "x/qujing/tongtian/npc/vendor": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/chen3": {
  "name": "陈家庄",
  "long": "陈家庄里住着大大小小的人家，多姓陈故为陈家庄。庄子里不时可听见热闹的声音，夹杂着鸡鸣狗叫。一些人家的烟囱里冒出淡淡的烟，空气中散发着柴烟香。",
  "exits": {
   "北": "x/qujing/tongtian/chen1",
   "西": "x/qujing/tongtian/xiaolu2",
   "东": "x/qujing/tongtian/minju5",
   "东南": "x/qujing/tongtian/minju6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedi": {
  "name": "河底",
  "long": "……冰冷的河底……",
  "exits": {
   "上": "x/qujing/tongtian/bing2"
  },
  "spawn": {
   "x/qujing/tongtian/npc/jinyu": 1,
   "x/qujing/tongtian/npc/yao#3": 1,
   "x/qujing/tongtian/npc/yao#4": 1,
   "x/qujing/tongtian/npc/yao#5": 1,
   "x/qujing/tongtian/npc/yao#6": 1,
   "x/qujing/tongtian/npc/yao#7": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedong1": {
  "name": "河东",
  "long": "一条很宽的大河横在面前，一眼望去，远远可以见到隐约的对岸。河堤的背面就是陈家庄，河面已结了厚厚的一层冰，偶然见到一些人行走在冰上。",
  "exits": {
   "南": "x/qujing/tongtian/hedong2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedong2": {
  "name": "河东",
  "long": "一条很宽的大河横在面前，一眼望去，远远可以见到隐约的对岸。河堤的背面就是陈家庄，河面已结了厚厚的一层冰，偶然见到一些人行走在冰上。",
  "exits": {
   "北": "x/qujing/tongtian/hedong1",
   "西": "x/qujing/tongtian/bing2",
   "南": "x/qujing/tongtian/hedong3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedong3": {
  "name": "河东",
  "long": "一条很宽的大河横在面前，一眼望去，远远可以见到隐约的对岸。河堤的背面就是陈家庄，河面已结了厚厚的一层冰，偶然见到一些人行走在冰上。",
  "exits": {
   "北": "x/qujing/tongtian/hedong2",
   "西": "x/qujing/tongtian/bing4",
   "南": "x/qujing/tongtian/hedong4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedong4": {
  "name": "河东",
  "long": "一条很宽的大河横在面前，一眼望去，远远可以见到隐约的对岸。河堤的背面就是陈家庄，河面已结了厚厚的一层冰，偶然见到一些人行走在冰上。",
  "exits": {
   "北": "x/qujing/tongtian/hedong3",
   "东": "x/qujing/tongtian/xiaolu4",
   "南": "x/qujing/tongtian/hedong5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedong5": {
  "name": "河东",
  "long": "一条很宽的大河横在面前，一眼望去，远远可以见到隐约的对岸。河堤的背面就是陈家庄，河面已结了厚厚的一层冰，偶然见到一些人行走在冰上。",
  "exits": {
   "北": "x/qujing/tongtian/hedong4",
   "南": "x/qujing/tongtian/hedong6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hedong6": {
  "name": "河东",
  "long": "一条很宽的大河横在面前，一眼望去，远远可以见到隐约的对岸。河堤的背面就是陈家庄，河面已结了厚厚的一层冰，偶然见到一些人行走在冰上。",
  "exits": {
   "北": "x/qujing/tongtian/hedong5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hexi1": {
  "name": "河西",
  "long": "一条大河水面很宽，一眼望去，远远可以见到隐约的对岸。西边是岸上的树林，东面是河面，已结了厚厚的冰层，冷风呼呼地吹着，冰上偶然可见有人或车行走。",
  "exits": {
   "南": "x/qujing/tongtian/hexi2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hexi2": {
  "name": "河西",
  "long": "一条大河水面很宽，一眼望去，远远可以见到隐约的对岸。西边是岸上的树林，东面是河面，已结了厚厚的冰层，冷风呼呼地吹着，冰上偶然可见有人或车行走。",
  "exits": {
   "北": "x/qujing/tongtian/hexi1",
   "南": "x/qujing/tongtian/hexi3",
   "西北": "x/qujing/tongtian/xiaolu1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hexi3": {
  "name": "河西",
  "long": "一条大河水面很宽，一眼望去，远远可以见到隐约的对岸。西边是岸上的树林，东面是河面，已结了厚厚的冰层，冷风呼呼地吹着，冰上偶然可见有人或车行走。",
  "exits": {
   "北": "x/qujing/tongtian/hexi2",
   "东": "x/qujing/tongtian/bing1",
   "南": "x/qujing/tongtian/hexi4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hexi4": {
  "name": "河西",
  "long": "一条大河水面很宽，一眼望去，远远可以见到隐约的对岸。西边是岸上的树林，东面是河面，已结了厚厚的冰层，冷风呼呼地吹着，冰上偶然可见有人或车行走。",
  "exits": {
   "北": "x/qujing/tongtian/hexi3",
   "东": "x/qujing/tongtian/bing3",
   "南": "x/qujing/tongtian/hexi5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hexi5": {
  "name": "河西",
  "long": "一条大河水面很宽，一眼望去，远远可以见到隐约的对岸。西边是岸上的树林，东面是河面，已结了厚厚的冰层，冷风呼呼地吹着，冰上偶然可见有人或车行走。",
  "exits": {
   "北": "x/qujing/tongtian/hexi4",
   "南": "x/qujing/tongtian/hexi6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/hexi6": {
  "name": "河西",
  "long": "一条大河水面很宽，一眼望去，远远可以见到隐约的对岸。西边是岸上的树林，东面是河面，已结了厚厚的冰层，冷风呼呼地吹着，冰上偶然可见有人或车行走。",
  "exits": {
   "北": "x/qujing/tongtian/hexi5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/minju1": {
  "name": "民居",
  "long": "这是一户陈姓人家，屋子里摆设简单，设有一木桌两木椅，里面是一张床，上面的被褥叠得整整齐齐。北面有一个木窗子，窗外传来鸡叫。",
  "exits": {
   "出去": "x/qujing/tongtian/chen1"
  },
  "spawn": {
   "x/qujing/tongtian/npc/kid": 1,
   "x/qujing/tongtian/npc/people#3": 1
  },
  "area": "xyj"
 },
 "x/qujing/tongtian/minju2": {
  "name": "民居",
  "long": "此户人家也是陈姓，堂屋里光线明亮，摆设颇为讲究，堂心有一八仙桌，上面放着净亮的铜茶具，屋边有几把宽背椅，中间有一小茶几。",
  "exits": {
   "出去": "x/qujing/tongtian/chen2"
  },
  "spawn": {
   "x/qujing/tongtian/npc/kid@minju2": 1,
   "x/qujing/tongtian/npc/people#4": 1
  },
  "area": "xyj"
 },
 "x/qujing/tongtian/minju3": {
  "name": "民居",
  "long": "这也是一户陈姓人家，房子里面布置得非常舒适。屋子东边有一灶台，正烧着火，不知在做什么，散发出一股清香味。南边的门通向屋外。",
  "exits": {
   "出去": "x/qujing/tongtian/chen2"
  },
  "spawn": {
   "x/qujing/tongtian/npc/kid@minju3": 1,
   "x/qujing/tongtian/npc/ji": 1,
   "x/qujing/tongtian/npc/people#5": 1
  },
  "area": "xyj"
 },
 "x/qujing/tongtian/minju4": {
  "name": "民居",
  "long": "这家陈姓人家屋子里面空空的，一张木长条凳上放着一个空陶盆，长条凳边有几只小木凳。墙角放着一堆柴禾，边上是一个空的水缸。",
  "exits": {
   "出去": "x/qujing/tongtian/chen1"
  },
  "spawn": {
   "x/qujing/tongtian/npc/kid@minju4": 1
  },
  "area": "xyj"
 },
 "x/qujing/tongtian/minju5": {
  "name": "民居",
  "long": "民居里十分热闹，两张大木桌子拼在一起，周围放着椅子凳子，几个近邻凑在一起，围桌而坐，不知在谈什么。屋角的灶上烧着热水发出吱吱的水响。",
  "exits": {
   "出去": "x/qujing/tongtian/chen3"
  },
  "spawn": {
   "x/qujing/tongtian/npc/people#7": 1,
   "x/qujing/tongtian/npc/people#8": 1,
   "x/qujing/tongtian/npc/people#9": 1,
   "x/qujing/tongtian/npc/people#10": 1
  },
  "area": "xyj"
 },
 "x/qujing/tongtian/minju6": {
  "name": "民居",
  "long": "这家人家也是陈姓，屋子里放着大小陶盆瓷罐，里面种着花草之类的东西。南边的两扇窗子大开，从外面飘来一股花草的清香味。",
  "exits": {
   "出去": "x/qujing/tongtian/chen3"
  },
  "spawn": {
   "x/qujing/tongtian/npc/kid@minju6": 1,
   "x/qujing/tongtian/npc/people#8@minju6": 1
  },
  "area": "xyj"
 },
 "x/qujing/tongtian/xiaolu1": {
  "name": "小路",
  "long": "小路长长弯弯，路上铺着碎石，已被过往的车轮压出两道槽印，路边有一棵棵青树，结着各种青果红果不记其数，路的两边是农田种着庄稼。",
  "exits": {
   "东南": "x/qujing/tongtian/hexi2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/xiaolu2": {
  "name": "小路",
  "long": "小路长长弯弯，路上铺着碎石，已被过往的车轮压出两道槽印，路边有一棵棵青树，结着各种青果红果不记其数，路的两边是农田种着庄稼。",
  "exits": {
   "西南": "x/qujing/tongtian/xiaolu4",
   "东": "x/qujing/tongtian/chen3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/xiaolu3": {
  "name": "小路",
  "long": "小路长长弯弯，路上铺着碎石，已被过往的车轮压出两道槽印，路边有一棵棵青树，结着各种青果红果不记其数，路的两边是农田种着庄稼。",
  "exits": {
   "西北": "x/qujing/tongtian/chen2",
   "东北": "x/qujing/chechi/shatan5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/tongtian/xiaolu4": {
  "name": "小路",
  "long": "小路长长弯弯，路上铺着碎石，已被过往的车轮压出两道槽印，路边有一棵棵青树，结着各种青果红果不记其数，路的两边是农田种着庄稼。",
  "exits": {
   "东北": "x/qujing/tongtian/xiaolu2",
   "西": "x/qujing/tongtian/hedong4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/backyard": {
  "name": "后院",
  "long": "后院方方正正，院子里开了一块菜园子，种着各种蔬菜瓜果，绿油油一片。有一个藤架子，一些说不出名字的蔓藤爬在上面，开着黄色的小花。",
  "exits": {
   "南": "x/qujing/wuji/eastroom"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/bedroom": {
  "name": "寝宫",
  "long": "这里光线柔和，屋里装饰精美细腻。靠窗放有一长条桌，陈列着一些玉器瓷器。另一面是床，整齐地铺着锦罗花被。往北通向露天的小院子。",
  "exits": {
   "北": "x/qujing/wuji/garden"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/wuji/eastgate": {
  "name": "东门",
  "long": "这是乌鸡国的东门城楼，青石筑成两层楼台坚固异常，巍峨宽阔的拱行城门上方镂着「乌鸡国」三个红漆大字。",
  "exits": {
   "东": "x/qujing/wuji/street2",
   "西": "x/qujing/wuji/estreet"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/eastroom": {
  "name": "东厢房",
  "long": "这是宝林寺的禅房，以供游方僧人借宿一宿，房内陈设简陋，靠墙设有几张木床。",
  "exits": {
   "北": "x/qujing/wuji/backyard",
   "西": "x/qujing/wuji/zheng"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/wuji/estreet": {
  "name": "坤元街",
  "long": "坤元街是乌鸡国最繁华的一条街。人来人往，好不热闹。北边是一家茶馆，南边是一家水果店。",
  "exits": {
   "西": "x/qujing/wuji/estreet2",
   "南": "x/qujing/wuji/fruit",
   "东": "x/qujing/wuji/eastgate"
  },
  "spawn": {
   "x/qujing/wuji/npc/people#2": 1,
   "x/qujing/wuji/npc/people#3": 1,
   "x/qujing/wuji/npc/people#4": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/estreet2": {
  "name": "坤元街",
  "long": "这里是坤元街中段，路两旁挤满了做生意的小贩。北边有一家裁衣店，南边是一家客店。",
  "exits": {
   "西": "x/qujing/wuji/square",
   "南": "x/qujing/wuji/kezhan",
   "东": "x/qujing/wuji/estreet"
  },
  "spawn": {
   "x/qujing/wuji/npc/people#4@estreet2": 1,
   "x/qujing/wuji/npc/people#5": 1,
   "x/qujing/wuji/npc/people#0": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/fruit": {
  "name": "四季水果店",
  "long": "这家水果店店面虽然不大，但各色瓜果齐全，而且时令瓜果每日由城外运来，尤其新鲜。各色水果鲜红翠绿，十分诱人。",
  "exits": {
   "北": "x/qujing/wuji/estreet"
  },
  "spawn": {
   "x/qujing/wuji/npc/vender": 1
  },
  "area": "xyj"
 },
 "x/qujing/wuji/garden": {
  "name": "后院",
  "long": "后院中心有一个小池塘，养了几只鹤。四围房前种了不少松柏，郁郁葱葱。",
  "exits": {
   "西": "x/qujing/wuji/house",
   "南": "x/qujing/wuji/bedroom",
   "东": "x/qujing/wuji/stable",
   "北": "x/qujing/wuji/shufang"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/hilltop": {
  "name": "山顶",
  "long": "山顶山磐石耸立，旁边有一片稀稀拉拉的树林。南边是陡峭的悬崖直壁，无路可行。此处山高风冷，空谷回音。",
  "exits": {
   "北": "x/qujing/wuji/road5"
  },
  "spawn": {
   "x/qujing/wuji/npc/prince": 1,
   "x/qujing/wuji/npc/siwei": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/house": {
  "name": "太子府",
  "long": "此处乃是太子的行宫。三年前，国王认为太子已经成人，故为其另造宫殿，习文练武，没有诏令，不得私自进宫，以免分心。",
  "exits": {
   "西": "x/qujing/wuji/nstreet2",
   "东北": "x/qujing/wuji/shufang",
   "东": "x/qujing/wuji/garden"
  },
  "spawn": {
   "x/qujing/wuji/npc/siwei@house": 2
  },
  "area": "xyj"
 },
 "x/qujing/wuji/huilang": {
  "name": "白玉回廊",
  "long": "回廊两侧皆由白云石雕成，花鸟虫鱼，莫不维妙维肖。回廊之外花开似锦，春意盎然。往西通往锦香亭，往北则是祈雨坛。",
  "exits": {
   "西": "x/qujing/wuji/jxt",
   "南": "x/qujing/wuji/palace",
   "北": "x/qujing/wuji/huilang2"
  },
  "spawn": {
   "x/qujing/wuji/npc/girl": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/huilang2": {
  "name": "白玉回廊",
  "long": "廊两侧皆由白云石雕成，花鸟虫鱼，莫不维妙维肖。回廊之外花开似锦，春意盎然。往北是废弃的御花园。三年前国王与祈雨的道人在御花园玩赏时，道人化风而去，国王思慕那道人，再无心玩赏，遂命人将花园关闭。往西是王后的寝宫。",
  "exits": {
   "进去": "x/qujing/wuji/yuhua",
   "南": "x/qujing/wuji/huilang",
   "西": "x/qujing/wuji/ziyun"
  },
  "spawn": {
   "x/qujing/wuji/npc/girl@huilang2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/hzm": {
  "name": "后宰门",
  "long": "这里是王宫的偏门，看上去冷冷清清的，只有几个老太监无所事事地在那儿打瞌睡。",
  "exits": {
   "东": "x/qujing/wuji/jxt",
   "南": "x/qujing/wuji/wall"
  },
  "spawn": {
   "x/qujing/wuji/npc/taijian": 2
  },
  "area": "xyj"
 },
 "x/qujing/wuji/jxt": {
  "name": "锦香亭",
  "long": "亭畔种着一簇牡丹，红艳欲滴。牡丹原产东土洛阳，乌鸡国王知道皇后爱花，而牡丹又为花中之王，是以不惜代价差人移植到此，真可谓名花倾国两相欢，常得君王带笑看了。",
  "exits": {
   "西": "x/qujing/wuji/hzm",
   "北": "x/qujing/wuji/qiyutan",
   "东": "x/qujing/wuji/huilang"
  },
  "spawn": {
   "x/qujing/wuji/npc/queen": 1,
   "x/qujing/wuji/npc/girl@jxt": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/kezhan": {
  "name": "坤元客栈",
  "long": "这家客栈位与乌鸡国最繁华的坤元街中段，所以生意非常兴隆。南来北往的客人多在此歇脚。几个跑堂的小二来来回回招待着四方来客。楼上是客房。",
  "exits": {
   "上": "x/qujing/wuji/up",
   "北": "x/qujing/wuji/estreet2"
  },
  "spawn": {
   "x/qujing/wuji/npc/xiaoer": 1
  },
  "noFight": true,
  "noMagic": true,
  "water": true,
  "area": "xyj"
 },
 "x/qujing/wuji/nstreet": {
  "name": "乾元街",
  "long": "乾元街两边多为官宅民房。向北走可直达皇宫。路两旁时有卫兵巡逻。",
  "exits": {
   "南": "x/qujing/wuji/square",
   "北": "x/qujing/wuji/nstreet2"
  },
  "spawn": {
   "x/qujing/wuji/npc/people#5@nstreet": 1,
   "x/qujing/wuji/npc/people#0@nstreet": 1,
   "x/qujing/wuji/npc/people#1": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/nstreet2": {
  "name": "乾元街",
  "long": "乾元街北段多为国内官员的府邸。东边是太子府，西边是天师府。再往北就是乌鸡国的皇宫了。",
  "exits": {
   "南": "x/qujing/wuji/nstreet",
   "东": "x/qujing/wuji/house",
   "北": "x/qujing/wuji/zym"
  },
  "spawn": {
   "x/qujing/wuji/npc/people#1@nstreet2": 1,
   "x/qujing/wuji/npc/people#2@nstreet2": 1,
   "x/qujing/wuji/npc/people#3@nstreet2": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/palace": {
  "name": "昭泽殿",
  "long": "这里是乌鸡国王召见臣子，研讨国家大事的地方。四壁琉璃焕彩，流金滴玉。阶下臣子侍卫屏息作声，等候国王的旨意。",
  "exits": {
   "北": "x/qujing/wuji/huilang",
   "南": "x/qujing/wuji/zym"
  },
  "spawn": {
   "x/qujing/wuji/npc/taijian@palace": 2,
   "x/qujing/wuji/npc/chen": 3,
   "x/qujing/wuji/npc/kingfake": 1
  },
  "area": "xyj"
 },
 "x/qujing/wuji/piandian": {
  "name": "前殿",
  "long": "只见两边红漆栏杆里面高坐这一对金刚，装塑的威依恶丑：一个铁面钢髯，一个燥眉圆眼，金甲连环光灿烂，明盔绣带映飘风。",
  "exits": {
   "出去": "x/qujing/wuji/temple",
   "北": "x/qujing/wuji/zheng"
  },
  "area": "xyj"
 },
 "x/qujing/wuji/qiyutan": {
  "name": "祈雨坛",
  "long": "此处乃国王祈雨的祭坛。祭坛四角各放着一鼎香炉，中央立着一鼎巨大的石碑，写着一些蝌蚪形的文字。乌鸡国六年前曾招大旱，国王曾在此昼夜焚香祷告，终于感动了圣明，请到一位会呼风唤雨的道士，解除了旱情。",
  "exits": {
   "南": "x/qujing/wuji/jxt"
  },
  "spawn": {
   "x/qujing/wuji/npc/taijian@qiyutan": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road1": {
  "name": "山路",
  "long": "山顶嵯峨摩斗柄，树梢仿佛接云霄。青烟堆里，时闻得谷口啼猿；乱翠荫中，每听得松间鹤唳。",
  "exits": {
   "西": "x/qujing/wuji/road2"
  },
  "spawn": {
   "x/qujing/wuji/npc/shanji": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road2": {
  "name": "山路",
  "long": "只见此山八面巍峨，四围险峻，古怪乔松盘翠盖，枯摧老树挂藤箩。",
  "exits": {
   "东": "x/qujing/wuji/road1",
   "西": "x/qujing/wuji/road3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road3": {
  "name": "山路",
  "long": "高峰入云，清流见底，青林翠竹，四时俱备。猿鸟乱鸣，沉鳞竞跃，实是欲界之仙都。",
  "exits": {
   "西北": "x/qujing/wuji/road4",
   "东": "x/qujing/wuji/road2"
  },
  "spawn": {
   "x/qujing/wuji/npc/shanji@road3": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road4": {
  "name": "山路",
  "long": "路两边千株老柏，带雨半空青冉冉；万节修篁，含烟一壑色苍苍。林中隐隐有钟声传来，好象是一座寺庙。",
  "exits": {
   "东南": "x/qujing/wuji/road3",
   "西北": "x/qujing/wuji/temple",
   "西": "x/qujing/wuji/road5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road5": {
  "name": "山路",
  "long": "路两边千株老柏，带雨半空青冉冉；万节修篁，含烟一壑色苍苍。北边林中隐隐有钟声传来，好象是一座寺庙。",
  "exits": {
   "南": "x/qujing/wuji/hilltop",
   "东": "x/qujing/wuji/road4",
   "北": "x/qujing/wuji/temple",
   "西": "x/qujing/wuji/road6"
  },
  "spawn": {
   "x/qujing/wuji/npc/shanji@road5": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road6": {
  "name": "山路",
  "long": "只见此山八面巍峨，四围险峻，古怪乔松盘翠盖，枯摧老树挂藤箩。",
  "exits": {
   "西北": "x/qujing/wuji/road7",
   "东": "x/qujing/wuji/road5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/road7": {
  "name": "山路",
  "long": "山顶嵯峨摩斗柄，树梢仿佛接云霄。青烟堆里，时闻得谷口啼猿；乱翠荫中，每听得松间鹤唳。远远的可以看见山下楼台叠叠，殿阁重重。",
  "exits": {
   "东南": "x/qujing/wuji/road6",
   "西": "x/qujing/wuji/street1"
  },
  "spawn": {
   "x/qujing/wuji/npc/shanji@road7": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/shandao1": {
  "name": "山道",
  "long": "山道崎岖不平，沿着山势上下左右盘绕，地形十分险恶。群峦环绕，难辨东西南北。大风吹来，有点令人寒颤。",
  "exits": {
   "东北": "x/qujing/pingding/shan4",
   "西南": "x/qujing/wuji/shandao2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/shandao2": {
  "name": "山道",
  "long": "山道崎岖不平，沿着山势上下左右盘绕，地形十分险恶。群峦环绕，难辨东西南北。大风吹来，有点令人寒颤。",
  "exits": {
   "东北": "x/qujing/wuji/shandao1",
   "西南": "x/qujing/wuji/street1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/shandao3": {
  "name": "山道",
  "long": "山道崎岖不平，沿着山势上下左右盘绕，地形十分险恶。群峦环绕，难辨东西南北。大风吹来，有点令人寒颤。",
  "exits": {
   "西": "x/qujing/wuji/shandao4",
   "东北": "x/qujing/wuji/street1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/shandao4": {
  "name": "山道",
  "long": "山道崎岖不平，沿着山势上下左右盘绕，地形十分险恶。群峦环绕，难辨东西南北。大风吹来，有点令人寒颤。",
  "exits": {
   "东": "x/qujing/wuji/shandao3",
   "西南": "x/qujing/wuji/shandao5"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/shandao5": {
  "name": "山道",
  "long": "山道崎岖不平，沿着山势上下左右盘绕，地形十分险恶。群峦环绕，难辨东西南北。大风吹来，有点令人寒颤。",
  "exits": {
   "西北": "x/qujing/chechi/shatan3",
   "东北": "x/qujing/wuji/shandao4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/shufang": {
  "name": "书房",
  "long": "房间三面都是书架，上面摆满了书，大多都是军事与哲学方面的书。房中央有一张红木的书桌，桌后的太师椅上挂着一张白虎皮，一丝杂毛也没有。这张虎皮是太子去年打猎而得，太子为此甚为自豪。",
  "exits": {
   "南": "x/qujing/wuji/garden",
   "西南": "x/qujing/wuji/house"
  },
  "area": "xyj"
 },
 "x/qujing/wuji/shuijing": {
  "name": "水晶宫",
  "long": "黑暗深处一片光明，一座牌楼在水下恍然隐现，你正行走在水晶宫里，四周如明镜一般，方向难辨。",
  "exits": {
   "上": "x/qujing/wuji/well",
   "东": "x/qujing/wuji/shuijing",
   "西": "x/qujing/wuji/shuijing",
   "南": "x/qujing/wuji/shuijing",
   "北": "x/qujing/wuji/shuijing"
  },
  "area": "xyj"
 },
 "x/qujing/wuji/square": {
  "name": "乾坤广场",
  "long": "这里是城中心了，路两旁挤满了小贩向你兜售当地的土产。向北可以到达乌鸡国的皇宫。向南则是一片民宅。东西两边的大路上有不少商店，甚是繁华。近几年来乌鸡国风调雨顺，老百性安居乐业，一片欣向荣的景象。",
  "exits": {
   "东": "x/qujing/wuji/estreet2",
   "北": "x/qujing/wuji/nstreet"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/stable": {
  "name": "马槽",
  "long": "此间的马都是太子精心挑选的大宛宝马。其中以那匹名为＂绝尘＂的马最为名贵。",
  "exits": {
   "西": "x/qujing/wuji/garden"
  },
  "area": "xyj"
 },
 "x/qujing/wuji/street1": {
  "name": "山脚",
  "long": "两旁林木茂盛，遮天蔽日。满径落叶，柔软稀松。虫鸟啾啾。凉风习习。",
  "exits": {
   "东北": "x/qujing/wuji/shandao2",
   "西": "x/qujing/wuji/street2",
   "东": "x/qujing/wuji/road7",
   "西南": "x/qujing/wuji/shandao3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/street2": {
  "name": "官道",
  "long": "平西望去有一座城池，隐隐被一层黑云罩着。两边的草虫里时有小动物窜出来。东边是一座山，山势巍峨挺拔。",
  "exits": {
   "东": "x/qujing/wuji/street1",
   "西": "x/qujing/wuji/eastgate"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/temple": {
  "name": "宝林寺",
  "long": "只见八字砖墙泥红粉，两边门上钉金钉，叠叠楼台藏岭畔，城城宫阙隐山中。果然是一座好寺院。正门上红底烫金的写着三个字：＂宝林寺＂。",
  "exits": {
   "东南": "x/qujing/wuji/road4",
   "进去": "x/qujing/wuji/piandian",
   "南": "x/qujing/wuji/road5"
  },
  "spawn": {
   "x/qujing/wuji/npc/monk2": 2,
   "x/qujing/wuji/npc/monk1#2": 1
  },
  "area": "xyj"
 },
 "x/qujing/wuji/up": {
  "name": "二楼客房",
  "long": "客房里整齐大方，四周放着床铺和雕木小几。临街是一排窗子，挂着薄窗帘，是个歇脚休息的好地方。",
  "exits": {
   "下": "x/qujing/wuji/kezhan"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/wuji/wall": {
  "name": "宫墙外围",
  "long": "这里是王宫的宫墙外围，高大的墙壁乃是青石垒成，十分结实整齐。宫墙上方有一个哨亭角楼。",
  "exits": {
   "北": "x/qujing/wuji/hzm",
   "东": "x/qujing/wuji/wall2"
  },
  "spawn": {
   "x/qujing/wuji/npc/weishi": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/wall2": {
  "name": "宫墙外围",
  "long": "这里是王宫的宫墙外围，高大的墙壁乃是青石垒成，十分结实整齐。宫墙上方有一个哨亭角楼。",
  "exits": {
   "西": "x/qujing/wuji/wall",
   "东": "x/qujing/wuji/wall3"
  },
  "spawn": {
   "x/qujing/wuji/npc/weishi@wall2": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/wall3": {
  "name": "宫墙外围",
  "long": "这里是王宫的宫墙外围，高大的墙壁乃是青石垒成，十分结实整齐。宫墙上方有一个哨亭角楼。",
  "exits": {
   "西": "x/qujing/wuji/wall2",
   "东": "x/qujing/wuji/zym"
  },
  "spawn": {
   "x/qujing/wuji/npc/weishi@wall3": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/well": {
  "name": "井底",
  "long": "这是一口深深的井，沿着井壁上下长满了青苔。井里阴森森，光线极其黑暗，下面……",
  "exits": {
   "上": "x/qujing/wuji/yuhua",
   "下": "x/qujing/wuji/shuijing"
  },
  "area": "xyj"
 },
 "x/qujing/wuji/westroom": {
  "name": "西厢房",
  "long": "此间乃寺中主持的禅房，但因近来夜间闹鬼，主持已搬去别处。屋中陈设甚是典雅。两边书架上摆满了经书，朝南的案上有一鼎香炉却好象好久没人上香了。",
  "exits": {
   "东": "x/qujing/wuji/zheng"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/wuji/yuhua": {
  "name": "御花园",
  "long": "御花园已经被封多年，园中池塘已经干枯，雕栏红漆尽褪。往日的奇花异草久不经修理，已被乱草埋没，惟有墙角的一棵芭蕉树长的茂盛(bajiao)，比众花木不同。",
  "details": {
   "bajiao": "一种灵苗秀，天生体性空。翠缕千条细，丹心一点红。青隐遮秀户，碧影上廉栊。愧无桃李色，冷落粉墙东。",
   "茂盛": "一种灵苗秀，天生体性空。翠缕千条细，丹心一点红。青隐遮秀户，碧影上廉栊。愧无桃李色，冷落粉墙东。"
  },
  "exits": {
   "出去": "x/qujing/wuji/huilang2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuji/zheng": {
  "name": "大雄宝殿",
  "long": "大雄殿正中供着的乃是观音普度南海之相，其态度安详宁静，维妙维肖。两边是其他的一些佛祖塑像，分排站立，神态各异。殿里香烟缭绕，气氛静谧。",
  "exits": {
   "东": "x/qujing/wuji/eastroom",
   "南": "x/qujing/wuji/piandian",
   "西": "x/qujing/wuji/westroom"
  },
  "spawn": {
   "x/qujing/wuji/npc/monk1#0": 1
  },
  "area": "xyj"
 },
 "x/qujing/wuji/ziyun": {
  "name": "紫云宫",
  "long": "此乃王后的寝宫。国王王后曾经非常恩爱，所以国王经常在此留宿。这三年来国王不知什么原因慢慢冷落了王后。宫中虽然陈设华丽，但冷冷清清的，一个人也没有。",
  "exits": {
   "东": "x/qujing/wuji/huilang2"
  },
  "area": "xyj"
 },
 "x/qujing/wuji/zym": {
  "name": "正阳门",
  "long": "这里是进入皇宫的正门，雕龙塑凤，一眼看去富丽堂皇。门前侍卫盔甲鲜明，威风凛凛，守卫森严。门内琼阁林立，层层叠叠，瑞气纷飘。",
  "exits": {
   "南": "x/qujing/wuji/nstreet2",
   "北": "x/qujing/wuji/palace",
   "西": "x/qujing/wuji/wall3"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/anshi": {
  "name": "亭底暗室",
  "long": "这是牡丹亭底下的一间暗室。黑咕窿咚的什么也看不清。你试着到处摸了摸(mo)。",
  "exits": {
   "上": "x/qujing/wuzhuang/mudanting"
  },
  "doors": {
   "上": {
    "name": "桌底暗门",
    "closed": true
   }
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/baicaidi": {
  "name": "白菜地",
  "long": "五庄观做事的多，吃饭的也不少，所以观内雇了附近的一些农家来种蔬菜瓜果。这里是白菜地。",
  "exits": {
   "南": "x/qujing/wuzhuang/qiezidi",
   "西北": "x/qujing/wuzhuang/xiguadi"
  },
  "spawn": {
   "x/obj/food/dbc": 2,
   "x/obj/food/xbc": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/chengyun": {
  "name": "乘云阁",
  "long": "乘云阁居观中的最高处，阁上画栋雕梁，丹楹刻柱，显是下了很大的功夫、周围朱栏曲槛，凭栏四望，远处景致俱在眼前。山下村房楼舍，山上奇石怪松历历在目。",
  "exits": {
   "下": "x/qujing/wuzhuang/yanzhen"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/zhenyuan": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/eastway1": {
  "name": "东小廊",
  "long": "这是大殿东厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。南面有一座高台。",
  "exits": {
   "南": "x/qujing/wuzhuang/xunzhen",
   "北": "x/qujing/wuzhuang/eastway2",
   "西": "x/qujing/wuzhuang/guangchang"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/eastway2": {
  "name": "东小廊",
  "long": "这是大殿东厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。西边一道木门通到东偏殿。",
  "exits": {
   "南": "x/qujing/wuzhuang/eastway1",
   "北": "x/qujing/wuzhuang/eastway3",
   "西": "x/qujing/wuzhuang/epiandian"
  },
  "doors": {
   "西": {
    "name": "雕花木门",
    "closed": true
   }
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/eastway3": {
  "name": "东小廊",
  "long": "这是大殿东厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。东面有一座四方小阁。",
  "exits": {
   "南": "x/qujing/wuzhuang/eastway2",
   "北": "x/qujing/wuzhuang/eastway4",
   "东": "x/qujing/wuzhuang/zongge"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/eastway4": {
  "name": "东小廊",
  "long": "这是大殿东厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。东面的松林中发出阵阵松涛。",
  "exits": {
   "南": "x/qujing/wuzhuang/eastway3",
   "北": "x/qujing/wuzhuang/eastway5"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/eastway5": {
  "name": "东小廊",
  "long": "这是大殿东厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。西面是观中的斋房。",
  "exits": {
   "南": "x/qujing/wuzhuang/eastway4",
   "北": "x/qujing/wuzhuang/eastway6",
   "西": "x/qujing/wuzhuang/zaifang"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/eastway6": {
  "name": "东小廊",
  "long": "这是大殿东厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。西面通到后殿。",
  "exits": {
   "南": "x/qujing/wuzhuang/eastway5",
   "西": "x/qujing/wuzhuang/houdian"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/epiandian": {
  "name": "东偏殿",
  "long": "东偏殿主要是待客奉茶之用。殿内摆着几对檀木椅。木壁之上挂了几幅字画。中有一幅大书：“清虚人事少，寂静道心生”，写得是灵妙非常，落款袁天罡。",
  "exits": {
   "东": "x/qujing/wuzhuang/eastway2",
   "西": "x/qujing/wuzhuang/zhengdian",
   "北": "x/qujing/wuzhuang/shuofa"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/mingyue": 1
  },
  "doors": {
   "东": {
    "name": "雕花木门",
    "closed": true
   }
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/gate": {
  "name": "观门",
  "long": "松坡冷淡，竹径清幽。几重转折间忽然现出了一道山门。山门以苔石垒成，青藤缠绕中可以看到一块通碑(bei)。山门之后有楼阁数层。",
  "details": {
   "bei": "石碑上大书：万寿山福地，五庄观洞天。",
   "通碑": "石碑上大书：万寿山福地，五庄观洞天。"
  },
  "exits": {
   "南": "x/qujing/wuzhuang/linyin2",
   "北": "x/qujing/wuzhuang/shaoxiang"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/guangchang": {
  "name": "殿前广场",
  "long": "这里是宝殿之前的一个广场。从此纵看宝殿，气象雄浑，威势不俗。檐上有各种明兽祥云的浮雕，向南的窗户乃是太极之形，中部镂空镶以五彩琉璃。场上铺的均是四方青石，向南可看到山门前的往来，东西有小廊通往后殿。",
  "exits": {
   "南": "x/qujing/wuzhuang/linkway",
   "进去": "x/qujing/wuzhuang/zhengdian",
   "东": "x/qujing/wuzhuang/eastway1",
   "西": "x/qujing/wuzhuang/westway1"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/tieguaili": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/guge": {
  "name": "鼓阁",
  "long": "鼓阁内成四方，木架上摆着面大鼓，几乎占满了室内的空间，仅周围有尺许空隙人可通过。西面有小门通到竹林之中。室内四壁洁白，纤尘不染。",
  "exits": {
   "东": "x/qujing/wuzhuang/westway3"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/houdian": {
  "name": "后殿",
  "long": "后殿亦是宽敞素雅，只是空空荡荡地没放什么东西。再往北就是五庄观的后院了。东西各有一条小廊通向正殿。北面门外，隐闻花香鸟语，大概是个花园。",
  "exits": {
   "北": "x/qujing/wuzhuang/houyuan",
   "东": "x/qujing/wuzhuang/eastway6",
   "西": "x/qujing/wuzhuang/westway6"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/houyuan": {
  "name": "后院",
  "long": "来到后院，不觉心情为之一松。好一派鸟语花香。院子虽不大，看得出有一番精心布置。北面一道小门以梨树枝结成，而雪白的梨花居然依旧盛开。",
  "exits": {
   "北": "x/qujing/wuzhuang/juyuan",
   "南": "x/qujing/wuzhuang/houdian"
  },
  "doors": {
   "北": {
    "name": "梨花门",
    "closed": true
   }
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/huangguadi": {
  "name": "黄瓜地",
  "long": "五庄观做事的多，吃饭的也不少，所以观内雇了附近的一些农家来种蔬菜瓜果。这里是黄瓜地。",
  "exits": {
   "南": "x/qujing/wuzhuang/northpool",
   "东北": "x/qujing/wuzhuang/qiezidi",
   "西北": "x/qujing/wuzhuang/luobodi"
  },
  "spawn": {
   "x/obj/food/dhg": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/huludi": {
  "name": "葫芦地",
  "long": "五庄观做事的多，吃饭的也不少，所以观内雇了附近的一些农家来种蔬菜瓜果。这里是葫芦地。",
  "exits": {
   "东北": "x/qujing/wuzhuang/xiguadi",
   "南": "x/qujing/wuzhuang/luobodi"
  },
  "spawn": {
   "x/obj/food/hulu": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/inpool": {
  "name": "荷塘中",
  "long": "塘中碧莲相结，荷香扑面而来。你拼命地伸长脖子，想把脑袋从荷叶底下钻出来。",
  "exits": {
   "上": "x/qujing/wuzhuang/southpool"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/jiangjing": {
  "name": "讲经堂",
  "long": "经堂是平时镇元大仙与观中道士讲经时而用，堂上有一宝座，座前放有三四十个锦面软垫。此外堂中没有其它摆设，是镇元大仙为妨分神特意而为。",
  "exits": {
   "南": "x/qujing/wuzhuang/wpiandian",
   "东": "x/qujing/wuzhuang/yanzhen"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/juyuan": {
  "name": "菊园",
  "long": "梨花门外却不是梨园。这里各种各色的菊花争奇斗艳。你不由得放轻了脚步，唯恐一个不小心，惊落了娇艳欲滴的花瓣。东北一亭俏立，隐约可见“牡丹亭”几字。",
  "exits": {
   "东北": "x/qujing/wuzhuang/mudanting",
   "西北": "x/qujing/wuzhuang/shuoyaopu",
   "南": "x/qujing/wuzhuang/houyuan"
  },
  "doors": {
   "南": {
    "name": "梨花门",
    "closed": true
   }
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/linkway": {
  "name": "青砖道",
  "long": "细长的青砖道从山门连向宝殿。道上俱是一色青砖，摆法中似有太极之意，八卦之象。道左是竹林一片，密密匝匝看之不透，右是松海一片，但闻松涛阵阵不绝。",
  "exits": {
   "南": "x/qujing/wuzhuang/secondgate",
   "北": "x/qujing/wuzhuang/guangchang"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/linyin1": {
  "name": "林荫小道",
  "long": "这里树高影长，果熟送香。虽然只是短短的一条林荫道，行来亦是让人清心脱俗。而东面树丛中水光掩映，想来是一片池塘。",
  "exits": {
   "东南": "x/qujing/wuzhuang/shanlu2",
   "北": "x/qujing/wuzhuang/linyin2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/linyin2": {
  "name": "林荫小道",
  "long": "这里树高影长，果熟送香。虽然只是短短的一条林荫道，行来亦是让人清心脱俗。而东面树丛中水光掩映，想来是一片池塘。",
  "exits": {
   "南": "x/qujing/wuzhuang/linyin1",
   "北": "x/qujing/wuzhuang/gate"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/luobodi": {
  "name": "萝卜地",
  "long": "五庄观做事的多，吃饭的也不少，所以观内雇了附近的一些农家来种蔬菜瓜果。这里是萝卜地。",
  "exits": {
   "北": "x/qujing/wuzhuang/huludi",
   "东南": "x/qujing/wuzhuang/huangguadi"
  },
  "spawn": {
   "x/obj/food/carrot": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/mudanting": {
  "name": "牡丹亭",
  "long": "果然是饮酒赏园的绝妙去处！北面桃林中甜香阵阵，大红蜜桃似乎伸手可及。南面的菊园中蜂飞鸟唱，时有几片金黄的菊瓣随风飘来。",
  "exits": {
   "西南": "x/qujing/wuzhuang/juyuan",
   "北": "x/qujing/wuzhuang/southpool",
   "下": "x/qujing/wuzhuang/anshi"
  },
  "spawn": {
   "x/obj/misc/table": 1,
   "x/qujing/wuzhuang/npc/hanzhongli": 1
  },
  "doors": {
   "下": {
    "name": "桌底暗门",
    "closed": true
   }
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/northpool": {
  "name": "荷塘边",
  "long": "荷塘北边。塘中碧莲相结，荷香扑面而来。塘面纵横交错架了好几座小木桥，不知哪一座是通往对岸的。",
  "exits": {
   "南": "x/qujing/wuzhuang/wzgmaze5",
   "北": "x/qujing/wuzhuang/huangguadi"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/qiezidi": {
  "name": "茄子地",
  "long": "五庄观做事的多，吃饭的也不少，所以观内雇了附近的一些农家来种蔬菜瓜果。这里是茄子地。",
  "exits": {
   "西南": "x/qujing/wuzhuang/huangguadi",
   "北": "x/qujing/wuzhuang/baicaidi"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/renshenguo-yuan": {
  "name": "人参果园",
  "long": "好大的一遍人参果园！巨大的果树上吊着一枚枚令人垂涎欲滴的人参果。只是不知道怎样才能弄将下来。据说这人参果娇贵无比，要是乱摘一气什么都吃不上。",
  "exits": {},
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/secondgate": {
  "name": "二山门",
  "long": "二山门远看极是高大，牌楼上隐有祥云绕绕。左右石柱上刻口一对春联，乃是“长生不老神仙府，与天同寿道人家”十四个龙飞凤舞的大字。",
  "exits": {
   "南": "x/qujing/wuzhuang/shaoxiang",
   "北": "x/qujing/wuzhuang/linkway"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/shanlu1": {
  "name": "山路",
  "long": "山路蜿转不定，缓势延往山上。遥望山颠隐见祥云片片，东边闻水声阵阵，乃是一个深涧。前方树林外见一道观，想来定是好人家。",
  "exits": {
   "北": "x/qujing/wuzhuang/shanlu2",
   "南": "x/westway/yunti"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/shanlu2": {
  "name": "山路",
  "long": "山路蜿转不定，缓势延往山上。遥望山颠隐见祥云片片，东边闻水声阵阵，乃是一个深涧。前方树林外见一道观，想来定是好人家。",
  "exits": {
   "西北": "x/qujing/wuzhuang/linyin1",
   "南": "x/qujing/wuzhuang/shanlu1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/shaoxiang": {
  "name": "烧香坊",
  "long": "烧香坊尚在万寿山五庄观之外，一般的香客到此上香，磕头求愿后就要回转了。正前有一黑漆香案，上有香烛淡淡而燃。左右是净斋坊和俗客坊，供香客休息进斋。",
  "exits": {
   "南": "x/qujing/wuzhuang/gate",
   "北": "x/qujing/wuzhuang/secondgate"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/shuofa": {
  "name": "说法堂",
  "long": "说法堂乃是镇元大仙为了门下弟子说法论道而设。比讲经堂略大。中有一四方台，台上两把黑漆椅相对而立，台下软垫环绕。四面墙上挂有些山水字画，乃是经之妙义，法门玄机。",
  "exits": {
   "南": "x/qujing/wuzhuang/epiandian",
   "西": "x/qujing/wuzhuang/yanzhen"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/shuoyaopu": {
  "name": "芍药圃",
  "long": "圃浅花盛，宛如在地上铺开了一张火红的地毯。几位提着花蓝的少女在此打闹嬉戏，清风拂过，袖带飘香，你不由得醉醉地吸了一口气。",
  "exits": {
   "东南": "x/qujing/wuzhuang/juyuan",
   "北": "x/qujing/wuzhuang/southpool"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/hexiangu": 1,
   "x/qujing/wuzhuang/npc/girl": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/sleep": {
  "name": "睡房",
  "long": "睡房中整齐的摆着二三十个软榻，上面铺着玄色的被子。室中非常的安静，偶尔从外面的竹林中传来一两声鸟叫。",
  "exits": {
   "西": "x/qujing/wuzhuang/westway5"
  },
  "sleep": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/southpool": {
  "name": "荷塘边",
  "long": "荷塘南边。塘中碧莲相结，荷香扑面而来。塘面纵横交错架了好几座小木桥，不知哪一座是通往对岸的。",
  "exits": {
   "西南": "x/qujing/wuzhuang/shuoyaopu",
   "东南": "x/qujing/wuzhuang/mudanting",
   "北": "x/qujing/wuzhuang/wzgmaze1"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wangxian": {
  "name": "望仙台",
  "long": "望仙台上乃是青红板石铺就，布局巧妙，隐有太极之意。台中放一尺高铜炉，炉上小口中淡吐紫烟。台周有尺高护栏，皆雕龙刻凤。远望山下，但见山若伏兽，水若游龙，宛尔有出世之意。",
  "exits": {
   "北": "x/qujing/wuzhuang/westway1"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/lancaihe": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/westway1": {
  "name": "西小廊",
  "long": "这是大殿西厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。南面有一座高台。",
  "exits": {
   "南": "x/qujing/wuzhuang/wangxian",
   "北": "x/qujing/wuzhuang/westway2",
   "东": "x/qujing/wuzhuang/guangchang"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/westway2": {
  "name": "西小廊",
  "long": "这是大殿西厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。东面有一道小门通向西偏店。",
  "exits": {
   "南": "x/qujing/wuzhuang/westway1",
   "北": "x/qujing/wuzhuang/westway3",
   "东": "x/qujing/wuzhuang/wpiandian"
  },
  "doors": {
   "东": {
    "name": "雕花木门",
    "closed": true
   }
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/westway3": {
  "name": "西小廊",
  "long": "这是大殿西厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。西面有座四方小阁。",
  "exits": {
   "南": "x/qujing/wuzhuang/westway2",
   "北": "x/qujing/wuzhuang/westway4",
   "西": "x/qujing/wuzhuang/guge"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/westway4": {
  "name": "西小廊",
  "long": "这是大殿西厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。",
  "exits": {
   "南": "x/qujing/wuzhuang/westway3",
   "北": "x/qujing/wuzhuang/westway5"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/westway5": {
  "name": "西小廊",
  "long": "这是大殿西厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。东面是观中弟子的睡房。",
  "exits": {
   "南": "x/qujing/wuzhuang/westway4",
   "北": "x/qujing/wuzhuang/westway6",
   "东": "x/qujing/wuzhuang/sleep"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/westway6": {
  "name": "西小廊",
  "long": "这是大殿西厢的一条长廊，向北连到后院。小廊上是木板铺地，打扫的极为干净，走在上面发出吱吱的响声。走廊两面的木格内雕着一些山水人物。东面通到后殿。",
  "exits": {
   "南": "x/qujing/wuzhuang/westway5",
   "东": "x/qujing/wuzhuang/houdian"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wpiandian": {
  "name": "西偏殿",
  "long": "西偏殿主要用来堆放一些布道上香的常用物品。殿北楠木桌上有一对青铜的烛台，上有红烛轻燃。隔着西边的雕花木门是西廊，隐约可听到竹林中的风声。东边就回到宝殿。",
  "exits": {
   "北": "x/qujing/wuzhuang/jiangjing",
   "东": "x/qujing/wuzhuang/zhengdian",
   "西": "x/qujing/wuzhuang/westway2"
  },
  "doors": {
   "西": {
    "name": "雕花木门",
    "closed": true
   }
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze1": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     --　--\n     --　--\n     --　--\n",
  "exits": {
   "北": "x/qujing/wuzhuang/wzgmaze5",
   "东北": "x/qujing/wuzhuang/wzgmaze2",
   "西北": "x/qujing/wuzhuang/wzgmaze8"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze2": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     --　--\n     --　--\n     ------\n",
  "exits": {
   "西南": "x/qujing/wuzhuang/wzgmaze1",
   "东北": "x/qujing/wuzhuang/wzgmaze3",
   "西北": "x/qujing/wuzhuang/wzgmaze6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze3": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     --　--\n     ------\n     --　--\n",
  "exits": {
   "西": "x/qujing/wuzhuang/wzgmaze7",
   "西南": "x/qujing/wuzhuang/wzgmaze2",
   "西北": "x/qujing/wuzhuang/wzgmaze4"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze4": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     ------\n     --　--\n     --　--\n",
  "exits": {
   "西北": "x/qujing/wuzhuang/wzgmaze5",
   "东南": "x/qujing/wuzhuang/wzgmaze3",
   "西南": "x/qujing/wuzhuang/wzgmaze8"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze5": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     ------\n     ------\n     ------\n",
  "exits": {
   "南": "x/qujing/wuzhuang/wzgmaze1",
   "东南": "x/qujing/wuzhuang/wzgmaze4",
   "西南": "x/qujing/wuzhuang/wzgmaze6"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze6": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     ------\n     ------\n     --　--\n",
  "exits": {
   "东南": "x/qujing/wuzhuang/wzgmaze2",
   "东北": "x/qujing/wuzhuang/wzgmaze5",
   "西南": "x/qujing/wuzhuang/wzgmaze7"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze7": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     ------\n     --　--\n     ------\n",
  "exits": {
   "东": "x/qujing/wuzhuang/wzgmaze3",
   "东北": "x/qujing/wuzhuang/wzgmaze6",
   "东南": "x/qujing/wuzhuang/wzgmaze8"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/wzgmaze8": {
  "name": "八卦桥",
  "long": "几座木桥架在静悄悄的荷塘上面，纵横交错，显得甚是精巧。桥到此处，可见桥面上刻了一个大字：\n     --　--\n     ------\n     ------\n",
  "exits": {
   "东南": "x/qujing/wuzhuang/wzgmaze1",
   "东北": "x/qujing/wuzhuang/wzgmaze4",
   "西北": "x/qujing/wuzhuang/wzgmaze7"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/xiguadi": {
  "name": "西瓜地",
  "long": "五庄观做事的多，吃饭的也不少，所以观内雇了附近的一些农家来种蔬菜瓜果。这里是西瓜地。往北是有一道荆棘结成的篱笆，篱笆上开了一道简陋的杏木门，门上挂着一把黄铜锁。",
  "exits": {
   "东南": "x/qujing/wuzhuang/baicaidi",
   "西南": "x/qujing/wuzhuang/huludi"
  },
  "spawn": {
   "x/obj/food/watermellon": 3
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/xunzhen": {
  "name": "寻真台",
  "long": "寻真台上乃是青红板石铺就，布局巧妙，隐有太极之意。台中放一尺高铜炉，炉上小口中淡吐紫烟。台周有尺高护栏，皆雕龙刻凤。远望山下，但见山若伏兽，水若游龙，宛尔有出世之意。",
  "exits": {
   "北": "x/qujing/wuzhuang/eastway1"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/hanxiangzi": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/qujing/wuzhuang/yanzhen": {
  "name": "延真楼",
  "long": "延真楼上乃是镇元大仙的私居。中有一供台，上有一玄色七彩丝的剑鞘。台后挂着幅中堂，上书一个“道”字。小楼三面俱是雕花扇窗，于周围景致看的清清楚楚。",
  "exits": {
   "东": "x/qujing/wuzhuang/shuofa",
   "上": "x/qujing/wuzhuang/chengyun",
   "西": "x/qujing/wuzhuang/jiangjing"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/zaifang": {
  "name": "斋房",
  "long": "斋房分为两半，北边有斋厨，炉上的大锅里热气腾腾。南边摆了一张木桌，几条木凳，几位道长正在进斋。靠墙的架子上放着各类瓜果，都是观中自己种的。",
  "exits": {
   "东": "x/qujing/wuzhuang/eastway5"
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/zhengdian": {
  "name": "正殿",
  "long": "这是五庄观的正殿，宽敞素雅。四周有几扇木窗，都是上明下暗的雕花格子。北面正中靠壁挂着五彩装成的“天地”二字，下设一张朱红雕漆的香几，几上有一副黄金炉瓶，炉边摆着几束香。正殿东西各有一座偏殿。",
  "exits": {
   "出去": "x/qujing/wuzhuang/guangchang",
   "东": "x/qujing/wuzhuang/epiandian",
   "西": "x/qujing/wuzhuang/wpiandian"
  },
  "spawn": {
   "x/qujing/wuzhuang/npc/qingfeng": 1,
   "x/qujing/wuzhuang/npc/caoguojiu": 1
  },
  "area": "xyj"
 },
 "x/qujing/wuzhuang/zongge": {
  "name": "钟阁",
  "long": "钟阁乃是一四方小室，内悬一口巨种，几乎占满了室内的空间，仅周围有尺许空隙人可通过。东边有小门通到松林中。室内四壁洁白，纤尘不染。",
  "exits": {
   "西": "x/qujing/wuzhuang/eastway3"
  },
  "area": "xyj"
 },
 "x/westway/dadao": {
  "name": "大道",
  "long": "这是一条长长的大道，在远远的山脚下绕过。大地苍茫，西北风呼呼地吹着，卷起路上扬起的风沙。这里的行人明显地少了，都在匆匆忙忙地赶着路，往东是金城郡，往西面再赶一赶路就可以到达永靖了。",
  "exits": {
   "东": "x/westway/jincheng",
   "西": "x/westway/yongjing"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/jiayu": {
  "name": "嘉峪关",
  "long": "一座雄伟的关口坐落在群山之中，嘉峪关是长城最西的关口，镇守大唐国的西域大门。关外向西便是通向西域各国的艰难道路，只见西面一片茫茫大雾如海一般恍恍惚惚什么也看不见。关内向东通向大唐国各地，南边有一个小小出口与蜂火台相连。",
  "exits": {
   "东": "x/westway/shizhan",
   "西": "x/qujing/baoxiang/yelu8"
  },
  "spawn": {
   "x/westway/npc/wujiang": 2
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/jincheng": {
  "name": "金城郡南",
  "long": "金城郡是西北地区的重要城镇。向西看去，茫茫一片远处隐隐约约有一群山脉。北边是金城郡南门，城门紧闭，城门洞里摆着一小食摊在卖着什么。往东有一条大官道可以通达大唐国都长安城。",
  "exits": {
   "西": "x/westway/dadao",
   "东南": "x/westway/west3"
  },
  "spawn": {
   "x/westway/npc/tanfan": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/jiuquan": {
  "name": "酒泉郊外",
  "long": "酒泉郊外是长途车马队歇脚的另一个重要地点。这里比较热闹，尤其以产酒而闻名，“葡萄美酒夜光杯”由此而来。东面是一条马道，西面是一条石栈道，北部是座神秘的小山丘。",
  "exits": {
   "东": "x/westway/madao",
   "西": "x/westway/shizhan",
   "北": "x/westway/yunti"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/lu1": {
  "name": "山洞内",
  "long": "山洞里黑乎乎的。南边的洞门口堆着好些杂草，大概从外边是看不来的。北边山洞弯弯地通向深处。",
  "exits": {
   "南": "x/westway/shizhan"
  },
  "spawn": {
   "x/westway/obj/tielong": 1
  },
  "area": "xyj"
 },
 "x/westway/madao": {
  "name": "马道",
  "long": "一条车马专用的长道，路上行人匆匆忙忙地赶路，西边快到酒泉了。东南方向有一片林地，路向林地的深处伸去，那便是经常出危险的饮马峪。",
  "exits": {
   "东南": "x/westway/yinma",
   "西": "x/westway/jiuquan"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/pingyang": {
  "name": "平阳道",
  "long": "蜿蜒的平阳道细细长长，通进山里。这里安安静静，抬头向西看去，大道的一端在山谷里消失。向东北看去，一队马车正急急地向永靖方向赶去。大道边有一棵巨大的枯树(tree)。",
  "details": {
   "tree": "树上刻着：近闻峪中有马盗出没杀人越货务请结队而行切记。",
   "枯树": "树上刻着：近闻峪中有马盗出没杀人越货务请结队而行切记。"
  },
  "exits": {
   "东北": "x/westway/yongjing",
   "西": "x/westway/yinma"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/shandong": {
  "name": "山洞里",
  "long": "山洞里有点昏暗，从洞外顶上垂下一些藤条。洞内壁上长了一层层的绿苔，洞的左角地上铺了一些干草。草上盘腿坐着一位老人，似乎并没有察觉你的到来。",
  "exits": {
   "出去": "x/westway/yunti"
  },
  "spawn": {
   "x/westway/npc/laoren": 1
  },
  "noFight": true,
  "noMagic": true,
  "area": "xyj"
 },
 "x/westway/shizhan": {
  "name": "石栈道",
  "long": "这是一条极长的用大石块铺成的栈道，远处栈道伸进石坡，不得不在有的地方凿石辟路架路。据说西面再远一点就是著名的嘉峪关了，往东是去酒泉的方向。",
  "exits": {
   "东": "x/westway/jiuquan",
   "西": "x/westway/jiayu"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/tielong": {
  "name": "铁笼中",
  "long": "铁笼是由手指粗的钢条圈成，看起来十分的坚固。一般人看来是休想逃出去的，不过你也可以去试试扳开(break)它。",
  "exits": {},
  "area": "xyj"
 },
 "x/westway/west1": {
  "name": "大官道",
  "long": "这是一条宽阔笔直的大官道，足可容得下十马并驰。往西通向金城郡，相当于今天的兰州一带，往东则直达大唐国都长安城。",
  "exits": {
   "东": "x/city/ximen",
   "西": "x/westway/west2"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/west2": {
  "name": "大官道",
  "long": "这是一条宽阔笔直的大官道，足可容得下十马并驰。往西通向金城郡，相当于今天的兰州一带，往东则直达大唐国都长安城。",
  "exits": {
   "东": "x/westway/west1",
   "西": "x/westway/west3"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/west3": {
  "name": "大官道",
  "long": "这是一条宽阔笔直的大官道，足可容得下十马并驰。往西通向金城郡，西北地区的重要城镇，往东则直达大唐国都长安城。",
  "exits": {
   "东": "x/westway/west2",
   "西北": "x/westway/jincheng"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/yinma": {
  "name": "饮马峪",
  "long": "走进饮马峪，光线一下子暗了起来。你隐隐约约看见这是一个两端小中间大的葫芦峪，峪谷底传来潺潺的流水声。西北边出了峪口就能去酒泉，东边的峪口外通向平阳道。风乎乎地吹着你，呜呜作响，你又仿佛觉得听见身后总有点什么动静。",
  "exits": {
   "东": "x/westway/pingyang",
   "西北": "x/westway/madao"
  },
  "spawn": {
   "x/westway/npc/madao": 1
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/yongjing": {
  "name": "永靖",
  "long": "永靖到了。这里是西北的一个不小的镇子，人口比较密集一些。许多去西方取经或去西域长途贩货的车队马队在这里歇脚，东面是一条大道，西南面是绕进山区的平阳道。",
  "exits": {
   "东": "x/westway/dadao",
   "西南": "x/westway/pingyang"
  },
  "outdoors": true,
  "area": "xyj"
 },
 "x/westway/yunti": {
  "name": "云梯冈",
  "long": "云梯冈位于酒泉的北部，山冈不是很高。南边一条石头小路将山下和山上连接起来，前面山壁上有一个山洞，洞口全是碎石头。往北山路蜿转不定，遥遥可见山势清奇，不知通往何处。",
  "exits": {
   "进去": "x/westway/shandong",
   "南": "x/westway/jiuquan",
   "北": "x/qujing/wuzhuang/shanlu1"
  },
  "outdoors": true,
  "area": "xyj"
 }
}
export const NPCS = {
 "x/city/npc/tiesuanpan": {
  "name": "铁算盘",
  "ids": [
   "tie suanpan",
   "tie",
   "zhanggui"
  ],
  "title": "钱庄掌柜",
  "gender": "男性",
  "age": 54,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "skills": {
   "unarmed": 60,
   "parry": 60,
   "dodge": 60
  },
  "max": {
   "kee": 800,
   "sen": 200,
   "gin": 180
  },
  "chatChance": 10,
  "coin": 10000,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/jia": {
  "name": "贾二",
  "ids": [
   "jia er",
   "jia"
  ],
  "gender": "男性",
  "age": 32,
  "long": "包子铺的老板，笑眯眯的看着你。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "skills": {
   "unarmed": 20,
   "dodge": 60,
   "parry": 20
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "forceFactor": 5,
  "sells": {
   "x/obj/food/bao1": 99,
   "x/obj/food/bao2": 99,
   "x/obj/food/bao3": 99
  },
  "coin": 300,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/thief": {
  "name": "瘦老头",
  "ids": [
   "lao tou",
   "lao",
   "tou"
  ],
  "gender": "男性",
  "age": 59,
  "long": "看起来又干又瘦，贼眉鼠眼。他也正在上下打量着你。",
  "kind": [
   "fighter"
  ],
  "exp": 8499,
  "level": 12,
  "attrs": {
   "per": 10
  },
  "skills": {
   "stealing": 80,
   "unarmed": 20,
   "parry": 20,
   "dodge": 40
  },
  "max": {
   "kee": 700,
   "sen": 180,
   "gin": 180
  },
  "chatChance": 10,
  "chatChanceCombat": 40,
  "chatMsg": [
   "老头笑嘻嘻地，不怀好意地打量着你。",
   {
    "fn": "random_move"
   }
  ],
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/liumang": {
  "name": "小流氓",
  "ids": [
   "xiao liumang",
   "liumang",
   "punk"
  ],
  "gender": "男性",
  "age": 22,
  "long": "这是长安城里一个游手好闲的小流氓，一双眼睛贼溜溜的。",
  "kind": [
   "fighter"
  ],
  "exp": 3500,
  "level": 7,
  "attrs": {
   "per": 15
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "chatChance": 10,
  "chatMsg": [
   "小流氓嘴里不干不净地嘟囔着。",
   "小流氓笑嘻嘻地，不怀好意地打量着你。",
   {
    "fn": "random_move"
   }
  ],
  "coin": 84,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiaoshen": {
  "name": "萧升",
  "ids": [
   "xiao sheng",
   "xiao"
  ],
  "title": "振远镖局总镖头",
  "gender": "男性",
  "age": 35,
  "long": "他就是振远镖局现在的当家－－萧升。他不但武艺高强，而且为人豪侠仗义。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "str": 25
  },
  "skills": {
   "sword": 70,
   "unarmed": 70,
   "dodge": 70,
   "parry": 70,
   "fonxansword": 50,
   "yanxing-steps": 50
  },
  "map": {
   "sword": "fonxansword",
   "parry": "fonxansword",
   "dodge": "yanxing-steps"
  },
  "max": {
   "kee": 700,
   "sen": 180,
   "gin": 180
  },
  "force": 300,
  "maxForce": 300,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/magua",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/city/npc/biaotou": {
  "name": "镖头",
  "ids": [
   "biao tou",
   "biao",
   "tou"
  ],
  "gender": "男性",
  "age": 29,
  "long": "镖局中的镖头，长的膀大腰圆，看起来很有力气的样子。",
  "kind": [
   "fighter"
  ],
  "exp": 35000,
  "level": 25,
  "attrs": {
   "str": 30,
   "con": 30
  },
  "skills": {
   "unarmed": 50,
   "parry": 50,
   "dodge": 50,
   "force": 50
  },
  "max": {
   "kee": 500,
   "sen": 175,
   "gin": 175
  },
  "force": 100,
  "maxForce": 100,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiaoxiao": {
  "name": "萧萧",
  "ids": [
   "xiao xiao",
   "xiao"
  ],
  "title": "恶娘子",
  "gender": "女性",
  "age": 25,
  "long": "老英雄萧振远的小女儿，兵器铺女老板。由于凶蛮狠毒，江湖人称＂恶娘子＂。",
  "kind": [
   "fighter"
  ],
  "exp": 70000,
  "level": 36,
  "skills": {
   "fonxansword": 30,
   "sword": 50,
   "unarmed": 50,
   "dodge": 50,
   "parry": 50,
   "moondance": 50
  },
  "map": {
   "dodge": "moondance",
   "sword": "fonxansword",
   "parry": "fonxansword"
  },
  "max": {
   "kee": 155,
   "sen": 155,
   "gin": 155
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "sells": {
   "x/obj/armor/niupi": 99,
   "x/obj/weapon/sword/changjian": 99,
   "x/obj/weapon/blade/blade": 99,
   "x/obj/weapon/spear/tieqiang": 99,
   "x/obj/weapon/staff/chanzhang": 99,
   "x/obj/weapon/hammer/tongchui": 99
  },
  "carry": [
   [
    "x/obj/cloth/pink_cloth",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/city/npc/bookseller": {
  "name": "孔方兄",
  "ids": [
   "kong fang",
   "kongfang",
   "kong",
   "fang",
   "bookseller",
   "seller",
   "vendor"
  ],
  "title": "书店老板",
  "gender": "男性",
  "age": 37,
  "long": "孔秀才入京赶考落第，盘缠用尽，无法还乡，不得已在长安开一家书店。传说他曾遇异人，学得一些防身之术。",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "per": 25
  },
  "skills": {
   "dodge": 50,
   "parry": 50,
   "unarmed": 50,
   "literate": 70
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/obj/book/san": 99,
   "x/obj/book/basic_blade": 99,
   "x/obj/book/basic_unarmed": 99
  },
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/liu": {
  "name": "柳云天",
  "ids": [
   "liu yuntian",
   "liu"
  ],
  "title": "柳记布庄东家",
  "gender": "男性",
  "age": 22,
  "long": "柳记布庄的少东家，也是年少有为，一副得意洋洋地样子。",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "skills": {
   "unarmed": 50,
   "dodge": 60,
   "parry": 60
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "force": 400,
  "maxForce": 400,
  "forceFactor": 10,
  "sells": {
   "x/obj/cloth/huazheboots": 99,
   "x/obj/cloth/wulingjin": 99,
   "x/obj/cloth/bullboots": 99,
   "x/obj/cloth/choupao": 99
  },
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/shouchen": {
  "name": "袁守诚",
  "ids": [
   "yuan shoucheng",
   "yuan"
  ],
  "title": "算命先生",
  "gender": "男性",
  "age": 55,
  "long": "能知天地理，善晓鬼神情．长安城里没有不认识他的。",
  "kind": [
   "fighter"
  ],
  "exp": 8000,
  "level": 12,
  "attrs": {
   "per": 15
  },
  "skills": {
   "unarmed": 10,
   "dodge": 20,
   "parry": 20,
   "literate": 50,
   "spells": 50
  },
  "max": {
   "kee": 350,
   "sen": 300,
   "gin": 300
  },
  "mana": 200,
  "maxMana": 200,
  "manaFactor": 5,
  "chatChance": 10,
  "chatMsg": [
   "袁守诚晃了晃手上的桂花酒袋笑道：我这人没别的毛病，就是好点这个。",
   "袁守诚上上下下打量了你几眼。",
   "袁守诚皱了皱眉，一副欲言又止的样子。",
   "袁守诚神秘兮兮地四面张望了一下，在你耳边悄声道：客官最近没觉得哪儿不得劲？",
   {
    "fn": "random_move"
   }
  ],
  "inquiry": {
   "name": "小道姓袁名守诚．．．嘿嘿，在这长安一带还算小有薄名。",
   "here": "你没来过长安？这地方可是天下第一繁华所在。",
   "算命": "你等会再来吧。我的酒瘾又犯了，得先去喝一杯。",
   "算卦": "你等会再来吧。我的酒瘾又犯了，得先去喝一杯。"
  },
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ],
   [
    "x/obj/book/nowords",
    "carry"
   ]
  ]
 },
 "x/city/npc/xiushi": {
  "name": "白衣秀士",
  "ids": [
   "xiu shi",
   "xiushi",
   "xiu",
   "shi"
  ],
  "gender": "男性",
  "age": 25,
  "long": "一位风流书生．不过他面色看起来怪怪的，好像有满腹心事。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 30,
   "dodge": 30,
   "parry": 30,
   "literate": 30,
   "force": 30
  },
  "max": {
   "kee": 500,
   "sen": 300,
   "gin": 155
  },
  "force": 150,
  "maxForce": 300,
  "chatChance": 20,
  "inquiry": {
   "name": "关你屁事！",
   "here": "长着眼睛你不会看啊。",
   "袁守诚": "江湖骗子。只有你们这帮傻瓜才信他。",
   "算命先生": "江湖骗子。只有你们这帮傻瓜才信他。"
  },
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/libai": {
  "name": "李白",
  "ids": [
   "li bai",
   "li"
  ],
  "title": "诗仙",
  "gender": "男性",
  "age": 37,
  "long": "大诗人李白，清高飘逸，剑术通神。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "str": 25,
   "int": 35,
   "con": 30,
   "per": 30
  },
  "skills": {
   "dodge": 80,
   "force": 80,
   "parry": 80,
   "unarmed": 80,
   "sword": 120,
   "literate": 120
  },
  "max": {
   "kee": 700,
   "sen": 500,
   "gin": 400
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 10,
  "chatChance": 20,
  "chatMsg": [
   "李白低声长吟道：危楼高百尺，手可摘星辰。",
   "李白低吟道：而来四万八千岁，不与秦汉通人烟。",
   "李白鼓腹而歌：挥手自兹去，萧萧班马鸣。",
   "李白击节而歌：赵客缦湖缨，吴钩霜雪明。银鞍照白马，飒沓如流星。",
   {
    "fn": "do_drink"
   },
   "李白低吟道：夫天地者，万物之逆旅。光阴者，百代之过客。",
   "李白击节而歌：脚着谢公屐，身登青云梯。半壁见海日，空中闻天鸡。",
   "李白吟道：孤帆远影碧空尽，唯见长江天际流。",
   "李白朗声吟道：蜀道之难，难于上青天，侧身西望长咨嗟。",
   {
    "fn": "do_drink"
   },
   "李白低声长吟：红颜弃轩冕，白首卧松云。",
   "李白醉态毕露，朗声长吟：醉看风落帽，舞爱月流人。",
   "李白长吟道：音尘绝，西风残照，汉家陵阙。",
   {
    "fn": "random_move"
   }
  ],
  "coin": 4000,
  "carry": [
   [
    "x/obj/cloth",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ],
   [
    "x/obj/book/poem",
    "carry"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/zhangguolao": {
  "name": "张果老",
  "ids": [
   "zhang guolao",
   "zhang",
   "guolao"
  ],
  "gender": "男性",
  "age": 50,
  "long": "一位笑嘻嘻的滑稽老头。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 70,
   "parry": 80,
   "hammer": 90,
   "kaishan-chui": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 50,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "hammer": "kaishan-chui",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 180
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "chatChance": 10,
  "chatMsg": [
   "张果老嘻嘻嘻地笑了几声。",
   "张果老拿起酒葫芦又灌了一口，满意地咂了咂嘴。",
   "张果老打了个响指：哈哈，我的小毛驴就是听话。",
   {
    "fn": "random_move"
   }
  ],
  "inquiry": {
   "name": "呵呵！张果老是也。",
   "here": "今儿个醉了，还真被你问倒了。"
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ],
   [
    "x/obj/cloth/pobuxie",
    "wear"
   ],
   [
    "x/obj/weapon/hammer/jiuhulu",
    "wield"
   ]
  ]
 },
 "x/city/npc/keeper": {
  "name": "庙祝",
  "ids": [
   "keeper"
  ],
  "gender": "男性",
  "age": 74,
  "long": "这个老人看起来七十多岁了，年级是大了，但精神却很好。",
  "kind": [
   "fighter"
  ],
  "exp": 1,
  "level": 1,
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  }
 },
 "x/city/npc/pablo": {
  "name": "董朴升",
  "ids": [
   "dong pusheng",
   "dong",
   "boss"
  ],
  "title": "当铺掌柜",
  "gender": "男性",
  "age": 47,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "skills": {
   "parry": 60,
   "unarmed": 60,
   "dodge": 60
  },
  "max": {
   "kee": 500,
   "sen": 200,
   "gin": 180
  },
  "chatChance": 10,
  "coin": 1000,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ],
   [
    "x/city/obj/jiezhi",
    "wear"
   ]
  ]
 },
 "x/city/npc/wujiang": {
  "name": "守城武将",
  "ids": [
   "wu jiang",
   "wu",
   "jiang"
  ],
  "gender": "男性",
  "age": 34,
  "long": "他威风凛凛，杀气腾腾，虽然只是个守城门的小官，当年也是打过大仗的。",
  "kind": [
   "fighter"
  ],
  "exp": 80000,
  "level": 39,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 70,
   "force": 70,
   "sword": 70,
   "dodge": 70,
   "parry": 70
  },
  "max": {
   "kee": 700,
   "sen": 600,
   "gin": 180
  },
  "force": 400,
  "maxForce": 400,
  "mana": 100,
  "maxMana": 100,
  "forceFactor": 15,
  "manaFactor": 5,
  "carry": [
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ],
   [
    "x/obj/armor/tiejia",
    "wear"
   ]
  ]
 },
 "x/city/npc/bing": {
  "name": "小兵",
  "ids": [
   "xiao bing",
   "bing"
  ],
  "gender": "男性",
  "age": 22,
  "long": "这些兵士都是秦叔宝，程咬金等从部下中挑出来的精锐。",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "attrs": {
   "str": 20
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "blade": 40,
   "force": 40
  },
  "max": {
   "kee": 400,
   "sen": 400,
   "gin": 140
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/weapon/blade/blade",
    "wield"
   ],
   [
    "x/obj/cloth/bingfu",
    "wear"
   ]
  ]
 },
 "x/city/npc/faming": {
  "name": "法明长老",
  "ids": [
   "faming zhanglao",
   "monk",
   "faming",
   "zhanglao"
  ],
  "title": "主持",
  "gender": "男性",
  "age": 55,
  "long": "法明长老是化生寺的主持，神色庄重，举止间自有一番威仪。听说他有一身武艺，也能呼风唤雨，却不传授于寺里的和尚。",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 23
  },
  "skills": {
   "force": 90,
   "unarmed": 90,
   "dodge": 90,
   "jienan-zhi": 90,
   "parry": 90,
   "spells": 90,
   "buddhism": 90
  },
  "map": {
   "unarmed": "jienan-zhi",
   "spells": "buddhism"
  },
  "max": {
   "kee": 900,
   "sen": 600,
   "gin": 180
  },
  "force": 500,
  "maxForce": 500,
  "mana": 900,
  "maxMana": 500,
  "forceFactor": 40,
  "manaFactor": 30,
  "chatChanceCombat": 30,
  "carry": [
   [
    "x/obj/cloth/monkcloth",
    "wear"
   ]
  ]
 },
 "x/city/npc/lin": {
  "name": "林冠雨",
  "ids": [
   "lin guanyu",
   "lin"
  ],
  "title": "古董店老板",
  "gender": "男性",
  "age": 42,
  "long": "古董店的老板，笑眯眯的看着你。但笑容的后面好象又有一丝．．．",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "skills": {
   "unarmed": 40,
   "changquan": 40,
   "sword": 50,
   "fonxansword": 60,
   "dodge": 60,
   "parry": 40
  },
  "map": {
   "unarmed": "changquan",
   "sword": "fonxansword",
   "parry": "fonxansword"
  },
  "max": {
   "sen": 300,
   "kee": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 10,
  "chatChanceCombat": 40,
  "carry": [
   [
    "x/obj/weapon/sword/changjian",
    "carry"
   ],
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiucai4": {
  "name": "贺知章",
  "ids": [
   "he zhizhang",
   "he",
   "zhizhang"
  ],
  "title": "国子监大学士",
  "gender": "男性",
  "age": 55,
  "long": "贺知章是国子监大学士，统管全国文人考试及升级。",
  "kind": [
   "fighter"
  ],
  "exp": 30000,
  "level": 24,
  "attrs": {
   "str": 25,
   "int": 30
  },
  "skills": {
   "unarmed": 50,
   "dodge": 50,
   "literate": 100,
   "parry": 50
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 500,
  "maxForce": 500,
  "inquiry": {
   "name": "薄名何足挂齿...老夫贺知章蒙皇上恩赏国子监大学士，实是愧不敢当。",
   "here": "这里便是国子监。",
   "读书识字": "对了，你是来对地方了！",
   "学习": "只要总管府认定，我们就收！",
   "功名": {
    "fn": "apply_gongming"
   }
  },
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiucai1": {
  "name": "高秀才",
  "ids": [
   "xiucai"
  ],
  "gender": "男性",
  "age": 22,
  "long": "国子监里的学生，正在吟诗作赋。",
  "kind": [
   "fighter"
  ],
  "exp": 8000,
  "level": 12,
  "attrs": {
   "per": 22
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "changquan": 20
  },
  "map": {
   "unarmed": "changquan"
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 3,
  "chatChance": 4,
  "chatMsg": [
   "高秀才低声吟道：一二三四五，上山打老虎，好诗，好诗呀！",
   "高秀才长叹一声：天生我才必有用，可惜不到有用时！"
  ],
  "carry": [
   [
    "x/gao/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiucai2": {
  "name": "胖秀才",
  "ids": [
   "xiucai"
  ],
  "gender": "男性",
  "age": 22,
  "long": "国子监里的学生，正在吟诗作赋。",
  "kind": [
   "fighter"
  ],
  "exp": 4000,
  "level": 8,
  "attrs": {
   "per": 22
  },
  "skills": {
   "unarmed": 30,
   "dodge": 10
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "chatChance": 4,
  "chatMsg": [
   "胖秀才哈哈大笑，不知想到了什么．",
   "胖秀才愁眉苦脸的．"
  ],
  "carry": [
   [
    "x/gao/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/city/npc/sengren1": {
  "name": "大和尚",
  "ids": [
   "monk"
  ],
  "gender": "男性",
  "age": 34,
  "long": "一位大和尚，看起来慈善的很，口里还不停的咏经。",
  "kind": [
   "fighter"
  ],
  "exp": 15000,
  "level": 16,
  "attrs": {
   "per": 25
  },
  "skills": {
   "force": 29,
   "unarmed": 29,
   "dodge": 29,
   "parry": 39
  },
  "max": {
   "kee": 380,
   "gin": 300,
   "sen": 180
  },
  "force": 250,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/city/npc/sengren": {
  "name": "游方僧人",
  "ids": [
   "seng ren",
   "seng"
  ],
  "gender": "男性",
  "age": 39,
  "long": "一位游方和尚，骨瘦如柴，身上的袈裟打满了补丁。",
  "kind": [
   "fighter"
  ],
  "exp": 24999,
  "level": 21,
  "attrs": {
   "str": 20,
   "int": 30,
   "con": 25
  },
  "skills": {
   "force": 49,
   "unarmed": 49,
   "dodge": 49,
   "parry": 49
  },
  "max": {
   "kee": 380,
   "gin": 300,
   "sen": 180
  },
  "chatChance": 40,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiaowang": {
  "name": "王小二",
  "ids": [
   "xiao er",
   "xiaoer",
   "xiao",
   "waiter",
   "wang"
  ],
  "gender": "男性",
  "age": 26,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 3000,
  "level": 7,
  "attrs": {
   "per": 14
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "sells": {
   "x/obj/food/baijiu": 99,
   "x/ourhome/obj/jitui": 99,
   "x/ourhome/obj/huasheng": 99
  },
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/kuli": {
  "name": "苦力",
  "ids": [
   "kuli"
  ],
  "gender": "男性",
  "age": 22,
  "long": "一个衣衫破旧的苦力人。",
  "kind": [
   "fighter"
  ],
  "exp": 5499,
  "level": 9,
  "skills": {
   "unarmed": 10,
   "dodge": 10,
   "parry": 10,
   "blade": 10
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/yulinjun": {
  "name": "校尉",
  "ids": [
   "xiao wei",
   "wei",
   "guard"
  ],
  "title": "御林军",
  "gender": "男性",
  "age": 25,
  "long": "这是位守护皇城的金甲武士，身披铜甲，手执金瓜。他双目精光炯炯，警惕地巡视着四周的情形。",
  "kind": [
   "fighter"
  ],
  "exp": 220000,
  "level": 65,
  "attrs": {
   "str": 25
  },
  "skills": {
   "hammer": 80,
   "unarmed": 80,
   "parry": 80,
   "dodge": 80,
   "force": 80
  },
  "max": {
   "kee": 850,
   "sen": 600,
   "gin": 155
  },
  "force": 400,
  "maxForce": 400,
  "forceFactor": 20,
  "carry": [
   [
    "x/obj/weapon/hammer/jingua",
    "wield"
   ],
   [
    "x/obj/armor/tongjia",
    "wear"
   ]
  ]
 },
 "x/city/npc/xiaoer": {
  "name": "店小二",
  "ids": [
   "xiao er",
   "xiaoer",
   "xiao",
   "waiter",
   "er"
  ],
  "gender": "男性",
  "age": 26,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 14
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "sells": {
   "x/moon/obj/jiudai": 99,
   "x/ourhome/obj/gourou": 99,
   "x/ourhome/obj/jitui": 99,
   "x/ourhome/obj/huasheng": 99,
   "x/obj/misc/xiaqi-zhinan": 99
  },
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/ourhome/npc/bigeye": {
  "name": "千里眼",
  "ids": [
   "bigeye",
   "youchai",
   "chai"
  ],
  "title": "邮差",
  "gender": "男性",
  "age": 30,
  "long": "前玉皇大帝亲信。因为偷看玉女出浴而被罚为邮差。他本来是和顺风耳一起呆在花果山仙石处的，后因嫌不够热闹跑到长安来了。",
  "kind": [
   "fighter"
  ],
  "exp": 8000,
  "level": 12,
  "attrs": {
   "str": 40,
   "per": 15
  },
  "skills": {
   "literate": 70,
   "dodge": 50,
   "unarmed": 40
  },
  "max": {
   "kee": 500,
   "sen": 300,
   "gin": 100
  },
  "force": 150,
  "maxForce": 300,
  "inquiry": {
   "name": "连我你都不认识？大名鼎鼎的千里眼就是我。",
   "here": "鬼知道这是什么地方！我只负责收信发信。",
   "玉女": "嘿嘿．．．不错。就算砍头我也划算了。",
   "玉皇大帝": "你别提他！一提我就有气．．．只许州官放火，不许百姓点灯。",
   "发信": {
    "fn": "send_mail"
   },
   "收信": {
    "fn": "receive_mail"
   },
   "信件": {
    "fn": "receive_mail"
   },
   "信": {
    "fn": "receive_mail"
   },
   "mail": {
    "fn": "receive_mail"
   },
   "mailbox": {
    "fn": "receive_mail"
   }
  },
  "coin": 70,
  "carry": [
   [
    "x/ourhome/obj/linen",
    "wear"
   ],
   [
    "x/wiz/npc/caishen",
    "carry"
   ]
  ]
 },
 "x/wiz/npc/caishen": {
  "name": "赵公明",
  "ids": [
   "zhao gongming",
   "zhao",
   "caishenye",
   "caishen"
  ],
  "title": "财神爷",
  "age": 41,
  "long": "财神爷赵公明，天下人无不想见的大名人。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "str": 30,
   "per": 17
  },
  "skills": {
   "parry": 50,
   "dodge": 40,
   "unarmed": 50,
   "changquan": 50
  },
  "map": {
   "unarmed": "changquan"
  },
  "max": {
   "kee": 500,
   "sen": 300,
   "gin": 200
  },
  "maxForce": 300,
  "carry": [
   [
    "x/obj/cloth/xianpao",
    "wear"
   ]
  ]
 },
 "x/city/npc/haoke1": {
  "name": "酒客",
  "ids": [
   "jiu ke"
  ],
  "gender": "男性",
  "age": 32,
  "long": "一个精精瘦瘦的小个子，越喝还越有精神。",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 50
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/piyi",
    "wear"
   ]
  ]
 },
 "x/city/npc/haoke2": {
  "name": "大胖子",
  "ids": [
   "pang zi"
  ],
  "gender": "男性",
  "age": 42,
  "long": "一个大胖子，喝了几杯，快醉了。",
  "kind": [
   "fighter"
  ],
  "exp": 19000,
  "level": 19,
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 30
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/magua",
    "wear"
   ]
  ]
 },
 "x/city/npc/feng": {
  "name": "丰永贵",
  "ids": [
   "feng yonggui",
   "feng",
   "boss"
  ],
  "title": "粮店掌柜",
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "skills": {
   "unarmed": 40,
   "dodge": 40
  },
  "max": {
   "kee": 350,
   "sen": 200,
   "gin": 180
  },
  "chatChance": 10,
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/laosun": {
  "name": "老孙",
  "ids": [
   "lao sun",
   "sun"
  ],
  "title": "皮货店老板",
  "gender": "男性",
  "age": 58,
  "long": "一位长得瘦猴似的老头。",
  "kind": [
   "fighter"
  ],
  "exp": 15000,
  "level": 16,
  "skills": {
   "dodge": 30
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/obj/magic/hwhite": 99,
   "x/obj/magic/hblack": 99,
   "x/obj/magic/hmaroon": 99,
   "x/obj/magic/hamber": 99,
   "x/obj/magic/hscarlet": 99,
   "x/obj/magic/hmagenta": 99,
   "x/obj/magic/hviolet": 99,
   "x/obj/magic/hpink": 99,
   "x/obj/magic/hindigo": 99,
   "x/obj/magic/hblue": 99,
   "x/obj/magic/hbrown": 99,
   "x/obj/magic/hgreen": 99,
   "x/obj/magic/hyellow": 99,
   "x/obj/magic/horange": 99,
   "x/obj/magic/hred": 99
  },
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/dog": {
  "name": "黑狗",
  "ids": [
   "dog"
  ],
  "age": 3,
  "long": "一只长得很精神的黑狗。",
  "kind": [
   "fighter"
  ],
  "exp": 0,
  "level": 1,
  "attrs": {
   "str": 32
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "chatChance": 6,
  "chatMsg": [
   "黑狗用鼻子闻了闻你的脚。",
   "黑狗在你的脚边挨挨擦擦的，想讨东西吃。",
   "黑狗对着你摇了摇尾巴。",
   "黑狗用后腿抓了抓自己的耳朵。"
  ]
 },
 "x/city/npc/girl": {
  "name": "女孩",
  "ids": [
   "girl"
  ],
  "gender": "女性",
  "age": 12,
  "long": "这是个长安城的典型少女，虽然只有十三、四岁，但是已经打扮入时。",
  "kind": [
   "fighter"
  ],
  "exp": 70,
  "level": 1,
  "attrs": {
   "str": 14,
   "int": 15,
   "con": 16,
   "per": 25
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "coin": 50,
  "carry": [
   [
    "x/obj/cloth/pink_cloth",
    "wear"
   ]
  ]
 },
 "x/city/npc/liyu": {
  "name": "李玉娘",
  "ids": [
   "li yuniang",
   "li"
  ],
  "gender": "女性",
  "age": 28,
  "long": "李玉娘是袁天罡的老婆，正在洗菜做饭。",
  "kind": [
   "fighter"
  ],
  "exp": 4000,
  "level": 8,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 20,
   "parry": 20,
   "dodge": 40
  },
  "max": {
   "kee": 170,
   "sen": 170,
   "gin": 170
  },
  "inquiry": {
   "袁天罡": "气死人了，这么晚了也不回家吃饭！也找不到个人把饭送去！",
   "送饭": {
    "fn": "fan_me"
   }
  },
  "carry": [
   [
    "x/obj/cloth/pink_cloth",
    "wear"
   ],
   [
    "x/city/obj/fanhe",
    "carry"
   ]
  ]
 },
 "x/city/npc/xiaopizi": {
  "name": "小痞子",
  "ids": [
   "xiao pizi",
   "pizi",
   "punk"
  ],
  "gender": "男性",
  "age": 19,
  "long": "这是一个整日里游手好闲的小痞子。",
  "kind": [
   "fighter"
  ],
  "exp": 1649,
  "level": 5,
  "attrs": {
   "str": 15,
   "int": 15,
   "con": 18
  },
  "max": {
   "kee": 125,
   "sen": 125,
   "gin": 125
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/rat": {
  "name": "大老鼠",
  "ids": [
   "rat"
  ],
  "age": 5,
  "long": "一只肥肥的大老鼠。",
  "kind": [
   "fighter"
  ],
  "exp": 20,
  "level": 1,
  "skills": {
   "dodge": 40
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  }
 },
 "x/qujing/wudidong/npc/bianfu": {
  "name": "穷汉",
  "ids": [
   "qiong han",
   "qiong",
   "han",
   "poor man",
   "man"
  ],
  "title": "普通百姓",
  "gender": "男性",
  "age": 39,
  "long": "他看起来一付穷困潦倒的样子，浑身没一件象样的衣服，瘦骨嶙峋的，就象三年没吃过一顿饱饭似的。虽说长安城里这样的人比比皆是，但你看他就是觉得不顺眼。仔细端详一番，你发现原来他全身长着一层淡淡的茸毛。",
  "kind": [
   "fighter"
  ],
  "exp": 3000,
  "level": 7,
  "attrs": {
   "str": 20,
   "cor": 100,
   "int": 20,
   "spi": 30,
   "cps": 100,
   "con": 40,
   "per": 10,
   "kar": 20
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "stealing": 50,
   "spells": 80,
   "sword": 80,
   "qixiu-jian": 30,
   "yinfeng-zhua": 30,
   "lingfu-steps": 80,
   "force": 80,
   "yaofa": 30,
   "huntian-qigong": 30
  },
  "max": {
   "kee": 400,
   "sen": 400,
   "gin": 180
  },
  "force": 350,
  "maxForce": 350,
  "mana": 350,
  "maxMana": 300,
  "family": {
   "name": "陷空山无底洞",
   "gen": 2,
   "title": "弟子"
  },
  "inquiry": {
   "name": "这个……我这穷汉的名字对你又有什么用了？",
   "here": "这里？你问我我问谁去？",
   "rumors": "听说最近附近有些老鼠精在长安城出没。唉。",
   "老鼠精": "我听说他们是个什么什么山什么什么洞的，也不知咋回事。",
   "陷空山": {
    "fn": "ask_me"
   },
   "无底洞": {
    "fn": "ask_me"
   }
  },
  "carry": [
   [
    "x/obj/cloth/pobuyi",
    "wear"
   ]
  ]
 },
 "x/city/npc/woman": {
  "name": "妇人",
  "ids": [
   "woman"
  ],
  "gender": "女性",
  "age": 30,
  "long": "一个寻常的村里妇人.",
  "kind": [
   "fighter"
  ],
  "exp": 4000,
  "level": 8,
  "skills": {
   "dodge": 10,
   "parry": 10,
   "unarmed": 10,
   "blade": 10
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "chatChance": 3,
  "chatChanceCombat": 100,
  "chatMsg": [
   "妇人打开锅盖闻了一下.",
   "妇人喃喃说道: 怎么还不回来?",
   "妇人又抬头望向门外."
  ],
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/boy": {
  "name": "男孩",
  "ids": [
   "boy"
  ],
  "gender": "男性",
  "age": 13,
  "long": "这是个典型的城里少年，年纪不大，长得很机灵。",
  "kind": [
   "fighter"
  ],
  "exp": 100,
  "level": 1,
  "attrs": {
   "str": 17,
   "int": 17,
   "con": 15
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "coin": 40,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/lu": {
  "name": "鲁可丘",
  "ids": [
   "lu keqiu",
   "lu",
   "keqiu"
  ],
  "title": "木器铺老板",
  "gender": "男性",
  "age": 42,
  "long": "鲁老板是南方人，看起来挺精明的。",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "attrs": {
   "str": 30,
   "spi": 30,
   "con": 30
  },
  "skills": {
   "force": 50,
   "unarmed": 50,
   "dodge": 50,
   "parry": 50
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "sells": {
   "x/city/obj/mudao": 99,
   "x/city/obj/mujian": 99,
   "x/city/obj/mugun": 99,
   "x/city/obj/muzhang": 99,
   "x/city/obj/muqiang": 99
  },
  "coin": 2000,
  "carry": [
   [
    "x/gao/obj/magua",
    "wear"
   ]
  ]
 },
 "x/city/npc/youxia": {
  "name": "游侠儿",
  "ids": [
   "youxia er",
   "er",
   "xia",
   "man"
  ],
  "gender": "男性",
  "age": 25,
  "long": "时下游侠之风甚重，连长安街头也可看到华装佩剑少年。",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "attrs": {
   "str": 23,
   "per": 22
  },
  "skills": {
   "sword": 50,
   "xiaofeng-sword": 40,
   "unarmed": 50,
   "parry": 50,
   "dodge": 50
  },
  "map": {
   "sword": "xiaofeng-sword",
   "parry": "xiaofeng-sword"
  },
  "max": {
   "kee": 650,
   "gin": 400,
   "sen": 155
  },
  "force": 350,
  "maxForce": 350,
  "forceFactor": 15,
  "chatChance": 10,
  "chatMsg": [
   "游侠儿哈哈地笑了笑。",
   "游侠儿上上下下打量了你几眼，眼中甚是不屑。",
   {
    "fn": "random_move"
   }
  ],
  "coin": 1500,
  "carry": [
   [
    "x/obj/weapon/sword/xijian",
    "wield"
   ],
   [
    "x/obj/cloth/bai",
    "wear"
   ]
  ]
 },
 "x/city/npc/daozhang": {
  "name": "雾渊道长",
  "ids": [
   "wuyuan daozhang",
   "wuyuan",
   "daozhang",
   "taoist"
  ],
  "gender": "男性",
  "age": 62,
  "long": "清虚观的主持，看起来仙风道骨．",
  "kind": [
   "fighter"
  ],
  "exp": 180000,
  "level": 59,
  "skills": {
   "unarmed": 90,
   "dodge": 90,
   "parry": 90,
   "whip": 90,
   "force": 90,
   "spells": 80,
   "dao": 80
  },
  "map": {
   "spells": "dao"
  },
  "max": {
   "kee": 800,
   "sen": 700,
   "gin": 180
  },
  "force": 400,
  "maxForce": 400,
  "mana": 1000,
  "maxMana": 600,
  "forceFactor": 10,
  "manaFactor": 30,
  "chatChance": 1,
  "chatChanceCombat": 30,
  "chatMsg": [
   "雾渊真人叹到：难难难，道最玄，莫把金丹作等闲．"
  ],
  "carry": [
   [
    "x/obj/weapon/whip/fuchen",
    "wield"
   ],
   [
    "x/lingtai/obj/cloth",
    "wear"
   ]
  ]
 },
 "x/lingtai/npc/xiao": {
  "name": "小道士",
  "ids": [
   "xiao dao",
   "dao"
  ],
  "gender": "男性",
  "age": 13,
  "long": "一个小道士，正跟着师父练武．",
  "kind": [
   "fighter"
  ],
  "exp": 30,
  "level": 1,
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  }
 },
 "x/city/npc/tangzhu1": {
  "name": "花忍",
  "ids": [
   "hua ren",
   "hua"
  ],
  "title": "二堂主",
  "gender": "男性",
  "age": 27,
  "long": "脸上一道长长的刀疤，可怕之极。",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "skills": {
   "unarmed": 40,
   "changquan": 40,
   "dodge": 60,
   "parry": 60
  },
  "map": {
   "unarmed": "changquan"
  },
  "max": {
   "kee": 165,
   "sen": 165,
   "gin": 165
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "coin": 1000,
  "carry": [
   [
    "x/obj/cloth/piyi",
    "wear"
   ]
  ]
 },
 "x/city/npc/fei1": {
  "name": "打手",
  "ids": [
   "da shou",
   "shou"
  ],
  "gender": "男性",
  "age": 22,
  "long": "虽然武功不怎么样，但心黑手辣，也不好惹。",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "skills": {
   "unarmed": 20,
   "dodge": 20,
   "parry": 20,
   "blade": 20
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "chatChanceCombat": 10,
  "carry": [
   [
    "x/obj/weapon/blade/blade",
    "wield"
   ],
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/fei2": {
  "name": "打手",
  "ids": [
   "da shou",
   "shou"
  ],
  "gender": "男性",
  "age": 22,
  "long": "虽然武功不怎么样，但心黑手辣，也不好惹。",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "skills": {
   "unarmed": 30,
   "dodge": 30,
   "parry": 20,
   "dagger": 25
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "chatChanceCombat": 10,
  "carry": [
   [
    "x/obj/weapon/dagger/dagger",
    "wield"
   ],
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/yuantiangang": {
  "name": "袁天罡",
  "ids": [
   "yuan tiangang",
   "yuan"
  ],
  "title": "天监台正先生",
  "gender": "男性",
  "age": 33,
  "long": "袁天罡是天监台总管，听说他法术高深。他为人正直仗义，脸上总是一股忧国忧民的神情。",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "attrs": {
   "int": 30,
   "per": 25
  },
  "skills": {
   "unarmed": 60,
   "dodge": 50,
   "parry": 50,
   "spells": 100,
   "baguazhou": 100,
   "literate": 50,
   "sword": 60,
   "changquan": 50
  },
  "map": {
   "spells": "baguazhou",
   "unarmed": "changquan"
  },
  "max": {
   "kee": 400,
   "sen": 400,
   "gin": 400
  },
  "force": 450,
  "maxForce": 300,
  "mana": 450,
  "maxMana": 300,
  "forceFactor": 10,
  "manaFactor": 5,
  "coin": 500,
  "carry": [
   [
    "x/obj/cloth/baguapao",
    "wear"
   ],
   [
    "x/obj/weapon/sword/taomujian",
    "wield"
   ]
  ]
 },
 "x/city/npc/tiejiang": {
  "name": "周铁匠",
  "ids": [
   "zhou tiejiang",
   "zhou",
   "tiejiang",
   "smith"
  ],
  "title": "铁匠",
  "gender": "男性",
  "age": 42,
  "long": "周铁匠四十多岁，长得虎背熊腰。。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "skills": {
   "dodge": 40,
   "unarmed": 40,
   "literate": 40
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 180
  },
  "sells": {
   "x/obj/weapon/dagger/dagger": 99,
   "x/obj/weapon/axe/tiefu": 99,
   "x/obj/weapon/hammer/hammer": 99,
   "x/obj/weapon/fork/fork": 99,
   "x/obj/weapon/stick/bintiegun": 99,
   "x/obj/weapon/whip/tielian": 99
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ],
   [
    "x/obj/weapon/hammer/hammer",
    "wield"
   ]
  ]
 },
 "x/city/npc/yiren2": {
  "name": "卖糖人的",
  "ids": [
   "seller"
  ],
  "gender": "男性",
  "age": 42,
  "long": "一个卖糖人的，正拿着糖人逗小孩。",
  "kind": [
   "fighter"
  ],
  "exp": 2000,
  "level": 5,
  "skills": {
   "dodge": 20,
   "parry": 20
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "chatChance": 5,
  "chatMsg": [
   "卖糖人的喊道：香喷喷的糖人，快来买呀！",
   "卖糖人的喊道：香喷喷的糖人，五文一个！",
   {
    "fn": "random_move"
   }
  ],
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/4world/npc/kid": {
  "name": "小女孩",
  "ids": [
   "kid"
  ],
  "gender": "女性",
  "age": 8,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100,
  "level": 1,
  "attrs": {
   "str": 10,
   "per": 19
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "chatChance": 10,
  "chatMsg": [
   "小女孩对你嘻嘻地傻笑了几声。",
   {
    "fn": "random_move"
   }
  ],
  "coin": 34
 },
 "x/4world/npc/kid1": {
  "name": "小男孩",
  "ids": [
   "kid"
  ],
  "gender": "男性",
  "age": 8,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100,
  "level": 1,
  "attrs": {
   "str": 10,
   "per": 19
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "chatChance": 10,
  "chatMsg": [
   "小男孩对你嘻嘻地傻笑了几声。",
   {
    "fn": "random_move"
   }
  ],
  "coin": 34
 },
 "x/city/npc/yiren1": {
  "name": "江湖艺人",
  "ids": [
   "yi ren"
  ],
  "gender": "男性",
  "age": 22,
  "long": "一个打把式卖艺的，正在场中练功夫。",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "blade": 40,
   "force": 40
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "chatChance": 5,
  "chatMsg": [
   "艺人喊道：各位父老乡亲，在下初来贵宝地，多多指教！",
   "艺人拿铜锣敲了敲，喊到：各位有钱的捧个钱场，没钱的捧个人场！",
   "艺人舞了个刀花道：我这趟刀，叫五虎断门刀！"
  ],
  "coin": 64,
  "carry": [
   [
    "x/obj/weapon/blade/blade",
    "wield"
   ],
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/dizi": {
  "name": "武馆弟子",
  "ids": [
   "wuguan dizi",
   "dizi",
   "trainee"
  ],
  "gender": "男性",
  "age": 22,
  "long": "你看到一位身材高大的汉子，正在辛苦地操练着。",
  "kind": [
   "fighter"
  ],
  "exp": 4000,
  "level": 8,
  "skills": {
   "dodge": 10,
   "unarmed": 10
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/jiaotou": {
  "name": "范芦平",
  "ids": [
   "fan luping",
   "fan"
  ],
  "title": "武馆教头",
  "gender": "男性",
  "age": 32,
  "long": "一个精精瘦瘦的小个子，在练一套拳．",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "skills": {
   "unarmed": 30,
   "dodge": 30,
   "force": 30,
   "parry": 30
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/fan": {
  "name": "范青屏",
  "ids": [
   "fan qingping",
   "fan"
  ],
  "title": "拳盖三省",
  "gender": "男性",
  "age": 72,
  "long": "范老拳师壮年时也是响当当的英雄，现在虽老了，手脚利落却不输当年．",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "skills": {
   "unarmed": 100,
   "changquan": 100,
   "dodge": 100,
   "parry": 100
  },
  "map": {
   "unarmed": "changquan"
  },
  "max": {
   "kee": 800,
   "sen": 700,
   "gin": 180
  },
  "force": 300,
  "maxForce": 300,
  "forceFactor": 15,
  "chatChance": 1,
  "chatMsg": [
   "范青屏叹道：腿脚不利落了，也没人去给我提笼小二的包子来。"
  ],
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ],
   [
    "x/obj/book/quanjing",
    "carry"
   ]
  ]
 },
 "x/city/npc/xiaoliu": {
  "name": "姚富贵",
  "ids": [
   "yao fugui",
   "yao"
  ],
  "title": "布店老板",
  "gender": "男性",
  "age": 36,
  "long": "姚老板是高家集人，后来挣了钱，开了家布店。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "skills": {
   "unarmed": 35,
   "dodge": 30,
   "parry": 35
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/gao/obj/hat": 99,
   "x/gao/obj/shoes": 99,
   "x/gao/obj/magua": 99,
   "x/gao/obj/piyi": 99
  },
  "coin": 500,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/eryi": {
  "name": "二姨太",
  "ids": [
   "er yitai",
   "yitai"
  ],
  "gender": "女性",
  "age": 22,
  "long": "金家的二姨太太，见你看她，对你抛了个媚眼．",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 22
  },
  "skills": {
   "unarmed": 10,
   "dodge": 40
  },
  "max": {
   "kee": 140,
   "sen": 140,
   "gin": 140
  },
  "carry": [
   [
    "x/obj/cloth/nichang",
    "wear"
   ],
   [
    "x/obj/cloth/yuanxiang",
    "wear"
   ]
  ]
 },
 "x/city/npc/yang": {
  "name": "杨中顺",
  "ids": [
   "yang zhongshun",
   "yang",
   "boss"
  ],
  "title": "药铺掌柜",
  "gender": "男性",
  "age": 37,
  "long": "杨老板是长安城里祖传的名医。虽然年轻，却早已名声在外。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "skills": {
   "literate": 70,
   "unarmed": 60,
   "dodge": 60
  },
  "max": {
   "kee": 300,
   "sen": 200,
   "gin": 180
  },
  "inquiry": {
   "治伤": {
    "fn": "heal_me"
   },
   "疗伤": {
    "fn": "heal_me"
   },
   "开药": {
    "fn": "heal_me"
   }
  },
  "sells": {
   "x/obj/drug/fake-tao": 99,
   "x/obj/drug/jinchuang": 99,
   "x/obj/drug/hunyuandan": 99
  },
  "coin": 10000,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/huoji": {
  "name": "伙计",
  "ids": [
   "huoji"
  ],
  "gender": "男性",
  "age": 25,
  "long": "一个能干的伙计。",
  "kind": [
   "fighter"
  ],
  "exp": 8000,
  "level": 12,
  "skills": {
   "unarmed": 20,
   "dodge": 20,
   "parry": 20
  },
  "max": {
   "kee": 155,
   "sen": 155,
   "gin": 155
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/city/npc/laotou": {
  "name": "老头",
  "ids": [
   "lao tou",
   "tou"
  ],
  "gender": "男性",
  "age": 65,
  "long": "一个老头，手里还拿着一个油瓶子。",
  "kind": [
   "fighter"
  ],
  "exp": 200,
  "level": 1,
  "attrs": {
   "spi": 30,
   "con": 30
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "coin": 30,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ],
   [
    "x/city/obj/youping",
    "wield"
   ]
  ]
 },
 "x/city/npc/laowei": {
  "name": "魏录齐",
  "ids": [
   "wei luqi",
   "wei"
  ],
  "title": "杂货铺老板",
  "gender": "男性",
  "age": 42,
  "long": "杂货铺的老板，笑眯眯的看着你。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "skills": {
   "unarmed": 30,
   "dodge": 40,
   "parry": 30
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "sells": {
   "x/obj/food/cutan": 99,
   "x/obj/misc/bag": 99,
   "x/obj/paper_seal": 99
  },
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/xueshan/npc/xunshi-out": {
  "name": "冰谷巡使",
  "ids": [
   "xunshi",
   "shi"
  ],
  "gender": "男性",
  "age": 33,
  "long": "这位巡使来自遥远的大雪山。他身披白袍，腰跨弯刀。白袍当胸绣着一只飞扬欲脱的大鹏鸟。弯刀看起来晶莹透明，好像是以寒冰制成。",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "attrs": {
   "per": 19
  },
  "skills": {
   "unarmed": 40,
   "yingzhaogong": 40,
   "dodge": 40,
   "parry": 40,
   "blade": 40,
   "bingpo-blade": 50,
   "xiaoyaoyou": 50,
   "spells": 40,
   "dengxian-dafa": 40,
   "force": 40,
   "ningxie-force": 40
  },
  "map": {
   "spells": "dengxian-dafa",
   "force": "ningxie-force",
   "blade": "bingpo-blade",
   "dodge": "xiaoyaoyou",
   "unarmed": "yingzhaogong"
  },
  "max": {
   "kee": 400,
   "sen": 400,
   "gin": 180
  },
  "force": 350,
  "maxForce": 300,
  "mana": 400,
  "maxMana": 350,
  "forceFactor": 30,
  "manaFactor": 17,
  "family": {
   "name": "大雪山",
   "gen": 4,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/xueshan-pao",
    "wear"
   ],
   [
    "x/obj/weapon/blade/iceblade",
    "wield"
   ]
  ]
 },
 "x/city/npc/yayi#3": {
  "name": "李财俊",
  "ids": [
   "yayi"
  ],
  "title": "衙役",
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 40,
   "stick": 40
  },
  "max": {
   "kee": 500,
   "sen": 400,
   "gin": 150
  },
  "force": 200,
  "maxForce": 200,
  "mana": 30,
  "maxMana": 30,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/yayifu",
    "wear"
   ],
   [
    "x/obj/weapon/stick/shawei",
    "wield"
   ]
  ]
 },
 "x/city/npc/yayi#4": {
  "name": "周俊彦",
  "ids": [
   "yayi"
  ],
  "title": "衙役",
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 40,
   "stick": 40
  },
  "max": {
   "kee": 500,
   "sen": 400,
   "gin": 150
  },
  "force": 200,
  "maxForce": 200,
  "mana": 30,
  "maxMana": 30,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/yayifu",
    "wear"
   ],
   [
    "x/obj/weapon/stick/shawei",
    "wield"
   ]
  ]
 },
 "x/city/npc/yayi#5": {
  "name": "吴彦良",
  "ids": [
   "yayi"
  ],
  "title": "衙役",
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 40,
   "stick": 40
  },
  "max": {
   "kee": 500,
   "sen": 400,
   "gin": 150
  },
  "force": 200,
  "maxForce": 200,
  "mana": 30,
  "maxMana": 30,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/yayifu",
    "wear"
   ],
   [
    "x/obj/weapon/stick/shawei",
    "wield"
   ]
  ]
 },
 "x/city/npc/yayi#6": {
  "name": "郑良志",
  "ids": [
   "yayi"
  ],
  "title": "衙役",
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 40,
   "stick": 40
  },
  "max": {
   "kee": 500,
   "sen": 400,
   "gin": 150
  },
  "force": 200,
  "maxForce": 200,
  "mana": 30,
  "maxMana": 30,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/yayifu",
    "wear"
   ],
   [
    "x/obj/weapon/stick/shawei",
    "wield"
   ]
  ]
 },
 "x/city/npc/yayi#7": {
  "name": "王志忠",
  "ids": [
   "yayi"
  ],
  "title": "衙役",
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 40,
   "stick": 40
  },
  "max": {
   "kee": 500,
   "sen": 400,
   "gin": 150
  },
  "force": 200,
  "maxForce": 200,
  "mana": 30,
  "maxMana": 30,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/yayifu",
    "wear"
   ],
   [
    "x/obj/weapon/stick/shawei",
    "wield"
   ]
  ]
 },
 "x/city/npc/yayi#8": {
  "name": "张忠孝",
  "ids": [
   "yayi"
  ],
  "title": "衙役",
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 40000,
  "level": 27,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 50,
   "parry": 40,
   "stick": 40
  },
  "max": {
   "kee": 500,
   "sen": 400,
   "gin": 150
  },
  "force": 200,
  "maxForce": 200,
  "mana": 30,
  "maxMana": 30,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/yayifu",
    "wear"
   ],
   [
    "x/obj/weapon/stick/shawei",
    "wield"
   ]
  ]
 },
 "x/city/npc/guanjia": {
  "name": "李丁",
  "ids": [
   "li ding",
   "li",
   "guanjia"
  ],
  "title": "大管家",
  "gender": "男性",
  "age": 65,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 12500,
  "level": 15,
  "skills": {
   "unarmed": 30,
   "dodge": 40,
   "parry": 30
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 5,
  "coin": 1000,
  "carry": [
   [
    "x/gao/obj/magua",
    "wear"
   ]
  ]
 },
 "x/city/npc/kaishan": {
  "name": "殷开山",
  "ids": [
   "yin kaishan",
   "yin",
   "kaishan"
  ],
  "title": "大总管",
  "gender": "男性",
  "age": 70,
  "long": "他就是当朝大总管殷开山，举手投足之间，不怒自威。",
  "kind": [
   "fighter"
  ],
  "exp": 80000,
  "level": 39,
  "attrs": {
   "str": 20
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80
  },
  "max": {
   "kee": 700,
   "sen": 700,
   "gin": 180
  },
  "force": 500,
  "maxForce": 500,
  "forceFactor": 10,
  "coin": 2000,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/jin": {
  "name": "金不换",
  "ids": [
   "jin buhuan",
   "jin",
   "buhuan"
  ],
  "title": "珠宝行老板",
  "gender": "男性",
  "age": 26,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 14
  },
  "skills": {
   "dodge": 30,
   "parry": 30,
   "unarmed": 30
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "sells": {
   "x/qujing/biqiu/obj/ring": 99,
   "x/qujing/biqiu/obj/wrists": 99,
   "x/qujing/biqiu/obj/neck": 99,
   "x/obj/misc/pai": 99
  },
  "coin": 300,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/city/npc/jieding": {
  "name": "疥顶小僧",
  "ids": [
   "jieding xiaoseng",
   "xiaoseng",
   "seng"
  ],
  "gender": "男性",
  "age": 15,
  "long": "一位小和尚，头上全是疥疤。",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "attrs": {
   "str": 20,
   "int": 30,
   "con": 20,
   "per": 18
  },
  "skills": {
   "force": 50,
   "unarmed": 50,
   "dodge": 79,
   "parry": 79,
   "staff": 50,
   "lotusforce": 50,
   "lunhui-zhang": 79,
   "jienan-zhi": 50,
   "lotusmove": 79
  },
  "map": {
   "dodge": "lotusmove",
   "unarmed": "jienan-zhi",
   "staff": "lunhui-zhang",
   "parry": "lunhui-zhang",
   "force": "lotusforce"
  },
  "max": {
   "kee": 400,
   "sen": 400,
   "gin": 105
  },
  "force": 300,
  "maxForce": 300,
  "mana": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "manaFactor": 10,
  "chatChance": 5,
  "chatMsg": [
   "疥顶小僧叹道：长安虽好却是凡尘，若欲求正果金身须去西天取经也！",
   {
    "fn": "random_move"
   }
  ],
  "inquiry": {
   "西天": {
    "fn": "give_book"
   },
   "取经": {
    "fn": "give_book"
   }
  },
  "coin": 500,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ],
   [
    "x/obj/cloth/sengxie",
    "wear"
   ],
   [
    "x/obj/books-nonskill/book-qujing",
    "carry"
   ]
  ]
 },
 "x/nanhai/npc/bonze": {
  "name": "和尚",
  "ids": [
   "heshang",
   "bonze"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "skills": {
   "literate": 50,
   "spells": 60,
   "buddhism": 50,
   "unarmed": 30,
   "jienan-zhi": 30,
   "dodge": 40,
   "lotusmove": 40,
   "parry": 50,
   "force": 50,
   "lotusforce": 50,
   "staff": 30,
   "lunhui-zhang": 30,
   "spear": 30,
   "huoyun-qiang": 30
  },
  "map": {
   "spells": "buddhism",
   "unarmed": "jienan-zhi",
   "dodge": "lotusmove",
   "force": "lotusforce",
   "parry": "lunhui-zhang",
   "staff": "lunhui-zhang",
   "spear": "huoyun-qiang"
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "force": 300,
  "maxForce": 300,
  "mana": 300,
  "maxMana": 300,
  "forceFactor": 20,
  "manaFactor": 20,
  "family": {
   "name": "南海普陀山",
   "gen": 3,
   "title": "弟子"
  },
  "chatChance": 5,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "carry": [
   [
    "x/obj/money/gold",
    "carry"
   ],
   [
    "x/nanhai/obj/sengpao",
    "wear"
   ]
  ]
 },
 "x/penglai/npc/laitou": {
  "name": "癞头和尚",
  "ids": [
   "laitou heshang",
   "heshang"
  ],
  "gender": "男性",
  "age": 30,
  "long": "一位游方和尚，头上布满大大小小的伤疤。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "str": 25,
   "int": 30,
   "con": 25,
   "per": 15
  },
  "skills": {
   "force": 50,
   "unarmed": 50,
   "dodge": 79,
   "parry": 79,
   "staff": 50,
   "lotusforce": 50,
   "lunhui-zhang": 79,
   "jienan-zhi": 50,
   "lotusmove": 79
  },
  "map": {
   "dodge": "lotusmove",
   "unarmed": "jienan-zhi",
   "staff": "lunhui-zhang",
   "parry": "lunhui-zhang",
   "force": "lotusforce"
  },
  "max": {
   "kee": 800,
   "sen": 800,
   "gin": 180
  },
  "force": 500,
  "maxForce": 500,
  "mana": 400,
  "maxMana": 400,
  "forceFactor": 20,
  "manaFactor": 20,
  "chatChance": 5,
  "chatMsg": [
   "癞头和尚不屑的说道：长安也不过如此景色吗，那里比得上仙境！",
   {
    "fn": "random_move"
   }
  ],
  "inquiry": {
   "仙境": "海中有蓬莱，方丈，瀛洲三座仙岛，果是不凡！",
   "蓬莱": "我，我干吗要告诉你！",
   "方丈": "我，我干吗要告诉你！",
   "瀛洲": "我，我干吗要告诉你！"
  },
  "coin": 1500,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ],
   [
    "x/penglai/npc/obj/sengxie",
    "wear"
   ],
   [
    "x/obj/weapon/staff/chanzhang",
    "wield"
   ]
  ]
 },
 "x/city/npc/xiaoer1": {
  "name": "店小二",
  "ids": [
   "xiao er",
   "xiaoer",
   "xiao",
   "waiter",
   "er"
  ],
  "gender": "男性",
  "age": 26,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 14
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#0": {
  "name": "渔夫",
  "ids": [
   "yu fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#1": {
  "name": "樵夫",
  "ids": [
   "qiao fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#2": {
  "name": "妇女",
  "ids": [
   "fu nu"
  ],
  "gender": "女性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#5": {
  "name": "乞丐",
  "ids": [
   "qi gai"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#6": {
  "name": "艺人",
  "ids": [
   "yi ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#7": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/bing": {
  "name": "宫兵",
  "ids": [
   "gong bing",
   "bing"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 209999,
  "level": 64,
  "attrs": {
   "str": 30
  },
  "skills": {
   "unarmed": 80,
   "parry": 80,
   "dodge": 80,
   "blade": 80
  },
  "max": {
   "kee": 600,
   "gin": 600,
   "sen": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 49,
  "carry": [
   [
    "x/qujing/baoxiang/obj/wandao#2",
    "wield"
   ],
   [
    "x/qujing/baoxiang/obj/zhanpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/shanyao": {
  "name": "山妖",
  "ids": [
   "shan yao",
   "yao"
  ],
  "gender": "男性",
  "age": 100,
  "long": "一个凶相毕露的山妖。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 50,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50,
   "fork": 50,
   "mace": 50,
   "spear": 50,
   "sword": 50,
   "whip": 50,
   "axe": 50,
   "hammer": 50,
   "rake": 50,
   "stick": 50,
   "staff": 50,
   "dagger": 50
  },
  "max": {
   "sen": 500,
   "gin": 500,
   "kee": 180
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 50,
  "carry": [
   [
    "x/qujing/baoxiang/obj/spqun",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/huangpao": {
  "name": "黄袍怪",
  "ids": [
   "huangpao guai",
   "guai"
  ],
  "title": "奎木狼",
  "gender": "男性",
  "age": 120,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 560000,
  "level": 105,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 90,
   "dodge": 90,
   "parry": 90,
   "spells": 90,
   "force": 90,
   "gouhunshu": 90,
   "tonsillit": 90,
   "ghost-steps": 90,
   "jinghun-zhang": 90
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "dodge": "ghost-steps",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 1300,
   "sen": 1300,
   "gin": 1300
  },
  "force": 800,
  "maxForce": 800,
  "mana": 800,
  "maxMana": 800,
  "forceFactor": 90,
  "manaFactor": 40,
  "inquiry": {
   "丹": {
    "fn": "give_dan"
   },
   "内丹": {
    "fn": "give_dan"
   },
   "舍利子": {
    "fn": "give_dan"
   },
   "舍利子内丹": {
    "fn": "give_dan"
   }
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/sppifeng",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/baihua": {
  "name": "百花羞",
  "ids": [
   "baihua xiu",
   "baihua"
  ],
  "title": "三公主",
  "gender": "女性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 250000,
  "level": 70,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 60,
   "dodge": 60,
   "parry": 60,
   "spells": 60,
   "force": 60
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "force": 700,
  "maxForce": 700,
  "mana": 700,
  "maxMana": 700,
  "forceFactor": 50,
  "manaFactor": 40,
  "inquiry": {
   "信": {
    "fn": "execute_ask"
   },
   "国王": {
    "fn": "execute_ask"
   },
   "letter": {
    "fn": "execute_ask"
   },
   "king": {
    "fn": "execute_ask"
   }
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/spqun",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/dashi": {
  "name": "大使",
  "ids": [
   "da shi",
   "shi"
  ],
  "title": "阁门",
  "gender": "男性",
  "age": 65,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 309999,
  "level": 78,
  "attrs": {
   "str": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 80,
   "parry": 80,
   "dodge": 80
  },
  "max": {
   "kee": 600,
   "gin": 600,
   "sen": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 34,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/king": {
  "name": "国王",
  "ids": [
   "guo wang",
   "king"
  ],
  "title": "宝象国",
  "gender": "男性",
  "age": 80,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 220000,
  "level": 65,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 50,
   "dodge": 50,
   "parry": 50,
   "spells": 50,
   "force": 50,
   "seashentong": 50,
   "dragonforce": 50,
   "dragonstep": 50,
   "dragonfight": 50
  },
  "map": {
   "unarmed": "dragonfight",
   "dodge": "dragonstep",
   "force": "dragonforce",
   "spells": "seashentong"
  },
  "max": {
   "kee": 700,
   "sen": 700,
   "gin": 700
  },
  "force": 800,
  "maxForce": 800,
  "mana": 800,
  "maxMana": 800,
  "forceFactor": 50,
  "manaFactor": 40,
  "carry": [
   [
    "x/obj/cloth/mangpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/xijiang": {
  "name": "锡匠",
  "ids": [
   "xi jiang",
   "jiang"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 34
  },
  "skills": {
   "unarmed": 100
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/qujing/baoxiang/obj/xihu": 99,
   "x/qujing/baoxiang/obj/xiwan": 99,
   "x/qujing/baoxiang/obj/xipen": 99
  },
  "coin": 1500,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/laoban": {
  "name": "老板",
  "ids": [
   "laoban"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 500,
  "level": 2,
  "attrs": {
   "per": 34
  },
  "skills": {
   "unarmed": 100
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/qujing/baoxiang/obj/yangtou": 99,
   "x/qujing/baoxiang/obj/paomo": 99,
   "x/qujing/baoxiang/obj/zasui": 99
  },
  "coin": 1000,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/nuzi": {
  "name": "女子",
  "ids": [
   "nu zi",
   "nu",
   "zi"
  ],
  "gender": "女性",
  "age": 18,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 400000,
  "level": 88,
  "attrs": {
   "cor": 20,
   "int": 20,
   "con": 20,
   "per": 30
  },
  "skills": {
   "dodge": 50,
   "parry": 50,
   "force": 50,
   "spells": 50,
   "unarmed": 50,
   "gouhunshu": 50,
   "tonsillit": 50,
   "ghost-steps": 50,
   "jinghun-zhang": 50
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 700,
   "sen": 700,
   "gin": 700
  },
  "force": 800,
  "maxForce": 800,
  "mana": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "manaFactor": 60,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ],
   [
    "x/qujing/baoxiang/obj/mifan",
    "carry"
   ],
   [
    "x/qujing/baoxiang/obj/mianjin",
    "carry"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/fangzhu": {
  "name": "坊主",
  "ids": [
   "fang zhu",
   "zhu"
  ],
  "gender": "男性",
  "age": 46,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 14
  },
  "skills": {
   "unarmed": 100
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/qujing/baoxiang/obj/cspitan": 99,
   "x/qujing/baoxiang/obj/bpitan": 99,
   "x/qujing/baoxiang/obj/yizi": 99,
   "x/qujing/baoxiang/obj/zhuozi": 99
  },
  "coin": 500,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/daguan": {
  "name": "管家",
  "ids": [
   "guan jia",
   "jia"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 9500,
  "level": 13,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 50,
   "dodge": 50,
   "parry": 50
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "coin": 74,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#0": {
  "name": "知书和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#1": {
  "name": "尚礼和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#2": {
  "name": "俗家和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#3": {
  "name": "大和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#4": {
  "name": "穷和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#5": {
  "name": "瘦和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/daozhang": {
  "name": "五福道长",
  "ids": [
   "dao zhang",
   "dao"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 94,
   "dodge": 94,
   "parry": 94,
   "force": 94
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/feng#0": {
  "name": "大姑奶",
  "ids": [
   "da gunai"
  ],
  "gender": "女性",
  "age": 22,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 5499,
  "level": 9,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "maxForce": 200,
  "maxMana": 200,
  "forceFactor": 1,
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/feng#7": {
  "name": "大小姐",
  "ids": [
   "da xiaojie"
  ],
  "gender": "女性",
  "age": 22,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 5499,
  "level": 9,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "maxForce": 200,
  "maxMana": 200,
  "forceFactor": 1,
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/feng#8": {
  "name": "二小姐",
  "ids": [
   "er xiaojie"
  ],
  "gender": "女性",
  "age": 22,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 5499,
  "level": 9,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "maxForce": 200,
  "maxMana": 200,
  "forceFactor": 1,
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/feng#9": {
  "name": "花姐儿",
  "ids": [
   "hua jieer"
  ],
  "gender": "女性",
  "age": 22,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 5499,
  "level": 9,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "maxForce": 200,
  "maxMana": 200,
  "forceFactor": 1,
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/feng#10": {
  "name": "小姐",
  "ids": [
   "xiaojie"
  ],
  "gender": "女性",
  "age": 22,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 5499,
  "level": 9,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "maxForce": 200,
  "maxMana": 200,
  "forceFactor": 1,
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/taijian": {
  "name": "太监",
  "ids": [
   "tai jian",
   "jian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/qujing/chechi/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/weishi": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/daotong": {
  "name": "道童",
  "ids": [
   "dao tong",
   "dao",
   "tong"
  ],
  "gender": "男性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 74,
   "dodge": 74,
   "parry": 74,
   "force": 74
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 3,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/girl": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/chechi/obj/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#0": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#1": {
  "name": "小贩",
  "ids": [
   "xiao fan"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#2": {
  "name": "女佣",
  "ids": [
   "nu yong"
  ],
  "gender": "女性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#3": {
  "name": "商人",
  "ids": [
   "shang ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#4": {
  "name": "读书人",
  "ids": [
   "dushu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#5": {
  "name": "官客",
  "ids": [
   "guan ke"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#6": {
  "name": "僧侣",
  "ids": [
   "seng lu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#7": {
  "name": "道人",
  "ids": [
   "dao ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/king": {
  "name": "国王",
  "ids": [
   "guo wang",
   "king"
  ],
  "title": "车迟国",
  "gender": "男性",
  "age": 80,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 260000,
  "level": 71,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 50,
   "dodge": 50,
   "parry": 50,
   "spells": 50,
   "force": 50,
   "seashentong": 50,
   "dragonforce": 50,
   "dragonstep": 50,
   "dragonfight": 50
  },
  "map": {
   "unarmed": "dragonfight",
   "dodge": "dragonstep",
   "force": "dragonforce",
   "spells": "seashentong"
  },
  "max": {
   "kee": 700,
   "sen": 700,
   "gin": 700
  },
  "force": 800,
  "maxForce": 800,
  "mana": 800,
  "maxMana": 800,
  "forceFactor": 50,
  "manaFactor": 40,
  "carry": [
   [
    "x/obj/cloth/mangpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/jz1": {
  "name": "监斩官",
  "ids": [
   "jianzhan guan",
   "guan"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 90,
   "dodge": 90,
   "parry": 90,
   "force": 90,
   "spells": 90
  },
  "max": {
   "kee": 1000,
   "sen": 1000,
   "gin": 1000
  },
  "maxForce": 1200,
  "maxMana": 1200,
  "forceFactor": 100,
  "carry": [
   [
    "x/qujing/chechi/obj/gongpao",
    "wear"
   ],
   [
    "x/qujing/chechi/obj/dao",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/jiubao": {
  "name": "酒保",
  "ids": [
   "jiu bao",
   "bao"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 500,
  "level": 2,
  "attrs": {
   "per": 34
  },
  "skills": {
   "unarmed": 100
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/qujing/chechi/obj/roujia": 99,
   "x/qujing/chechi/obj/niurou": 99,
   "x/qujing/chechi/obj/baiye": 99,
   "x/qujing/chechi/obj/jiuhu": 99
  },
  "coin": 1000,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/long#0": {
  "name": "大少爷",
  "ids": [
   "da shaoye"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 12499,
  "level": 15,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/long#9": {
  "name": "花公子",
  "ids": [
   "hua gongzi"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 12499,
  "level": 15,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/long#10": {
  "name": "浪公子",
  "ids": [
   "lang gongzi"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 12499,
  "level": 15,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/long#11": {
  "name": "公子",
  "ids": [
   "gongzi"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 12499,
  "level": 15,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/long#12": {
  "name": "王孙",
  "ids": [
   "wang sun"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 12499,
  "level": 15,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/langli": {
  "name": "狼力大仙",
  "ids": [
   "langli daxian",
   "daxian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1424999,
  "level": 168,
  "attrs": {
   "cor": 10,
   "int": 10,
   "spi": 10,
   "cps": 10,
   "con": 10,
   "per": 10
  },
  "skills": {
   "dodge": 170,
   "parry": 170,
   "force": 170,
   "spells": 160,
   "unarmed": 160,
   "gouhunshu": 120,
   "tonsillit": 120,
   "ghost-steps": 140,
   "jienan-zhi": 140
  },
  "map": {
   "dodge": "ghost-steps",
   "unarmed": "jienan-zhi",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 1200,
   "sen": 1200,
   "gin": 1200
  },
  "force": 1200,
  "maxForce": 1200,
  "mana": 1200,
  "maxMana": 1200,
  "forceFactor": 25,
  "manaFactor": 80,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/chaili": {
  "name": "豺力大仙",
  "ids": [
   "chaili daxian",
   "daxian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1224999,
  "level": 156,
  "attrs": {
   "cor": 10,
   "int": 10,
   "spi": 10,
   "cps": 10,
   "con": 10,
   "per": 10
  },
  "skills": {
   "dodge": 160,
   "parry": 160,
   "force": 160,
   "spells": 160,
   "unarmed": 160,
   "gouhunshu": 140,
   "tonsillit": 140,
   "ghost-steps": 140,
   "jienan-zhi": 140
  },
  "map": {
   "dodge": "ghost-steps",
   "unarmed": "jienan-zhi",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 1200,
   "sen": 1200,
   "gin": 1200
  },
  "force": 1200,
  "maxForce": 1200,
  "mana": 1200,
  "maxMana": 1200,
  "forceFactor": 25,
  "manaFactor": 80,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/beili": {
  "name": "狈力大仙",
  "ids": [
   "beili daxian",
   "daxian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1100000,
  "level": 147,
  "attrs": {
   "cor": 10,
   "int": 10,
   "spi": 10,
   "cps": 10,
   "con": 10,
   "per": 10
  },
  "skills": {
   "dodge": 160,
   "parry": 160,
   "force": 160,
   "spells": 160,
   "unarmed": 160,
   "gouhunshu": 140,
   "tonsillit": 140,
   "ghost-steps": 140,
   "jienan-zhi": 140
  },
  "map": {
   "dodge": "ghost-steps",
   "unarmed": "jienan-zhi",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 1200,
   "sen": 1200,
   "gin": 1200
  },
  "force": 1200,
  "maxForce": 1200,
  "mana": 1200,
  "maxMana": 1200,
  "forceFactor": 25,
  "manaFactor": 80,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/mali": {
  "name": "犸力大仙",
  "ids": [
   "mali daxian",
   "daxian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1324999,
  "level": 162,
  "attrs": {
   "cor": 10,
   "int": 10,
   "spi": 10,
   "cps": 10,
   "con": 10,
   "per": 10
  },
  "skills": {
   "dodge": 170,
   "parry": 170,
   "force": 170,
   "spells": 170,
   "unarmed": 170,
   "gouhunshu": 150,
   "tonsillit": 150,
   "ghost-steps": 140,
   "jienan-zhi": 140
  },
  "map": {
   "dodge": "ghost-steps",
   "unarmed": "jienan-zhi",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 1200,
   "sen": 1200,
   "gin": 1200
  },
  "force": 1200,
  "maxForce": 1200,
  "mana": 1200,
  "maxMana": 1200,
  "forceFactor": 25,
  "manaFactor": 80,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/jz3": {
  "name": "监斩官",
  "ids": [
   "jianzhan guan",
   "guan"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 90,
   "dodge": 90,
   "parry": 90,
   "force": 90,
   "spells": 90
  },
  "max": {
   "kee": 1000,
   "sen": 1000,
   "gin": 1000
  },
  "maxForce": 1200,
  "maxMana": 1200,
  "forceFactor": 100,
  "carry": [
   [
    "x/qujing/chechi/obj/gongpao",
    "wear"
   ],
   [
    "x/qujing/chechi/obj/dao",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/yuanshi": {
  "name": "元始天尊",
  "ids": [
   "yuanshi tianzun",
   "yuanshi",
   "tianzun"
  ],
  "title": "圣象",
  "age": 100,
  "long": "一尊丈许高的元始天尊的泥塑圣象，在殿台上正颜端坐。",
  "kind": [
   "fighter"
  ],
  "exp": 0,
  "level": 1,
  "max": {
   "kee": 10,
   "sen": 10,
   "gin": 10
  }
 },
 "x/qujing/chechi/npc/lingbao": {
  "name": "灵宝道君",
  "ids": [
   "lingbao daojun",
   "lingbao",
   "daojun"
  ],
  "title": "圣象",
  "age": 100,
  "long": "一尊丈许高的灵宝道君的泥塑圣象，在殿台上正颜端坐。",
  "kind": [
   "fighter"
  ],
  "exp": 0,
  "level": 1,
  "max": {
   "kee": 10,
   "sen": 10,
   "gin": 10
  }
 },
 "x/qujing/chechi/npc/taishang": {
  "name": "太上老君",
  "ids": [
   "taishang laojun",
   "taishang",
   "laojun"
  ],
  "title": "圣象",
  "age": 100,
  "long": "一尊丈许高的太上老君的泥塑圣象，在殿台上正颜端坐。",
  "kind": [
   "fighter"
  ],
  "exp": 0,
  "level": 1,
  "max": {
   "kee": 10,
   "sen": 10,
   "gin": 10
  }
 },
 "x/qujing/chechi/npc/shulao": {
  "name": "说书老",
  "ids": [
   "shuoshu lao",
   "lao"
  ],
  "gender": "男性",
  "age": 55,
  "long": "一位口若悬河的老人，正在敲木说书。",
  "kind": [
   "fighter"
  ],
  "exp": 5500,
  "level": 10,
  "attrs": {
   "str": 25
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/jz2": {
  "name": "监斩官",
  "ids": [
   "jianzhan guan",
   "guan"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 90,
   "dodge": 90,
   "parry": 90,
   "force": 90,
   "spells": 90
  },
  "max": {
   "kee": 1000,
   "sen": 1000,
   "gin": 1000
  },
  "maxForce": 1200,
  "maxMana": 1200,
  "forceFactor": 100,
  "carry": [
   [
    "x/qujing/chechi/obj/gongpao",
    "wear"
   ],
   [
    "x/qujing/chechi/obj/dao",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/daoshi": {
  "name": "道士",
  "ids": [
   "dao shi",
   "dao",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 84,
   "dodge": 84,
   "parry": 84,
   "force": 84
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/xiaoguan": {
  "name": "小管家",
  "ids": [
   "guan jia",
   "jia"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 9500,
  "level": 13,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 5,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ],
   [
    "x/qujing/chechi/obj/guo",
    "carry"
   ],
   [
    "x/qujing/chechi/obj/guo",
    "carry"
   ]
  ]
 },
 "x/qujing/chechi/npc/xizi": {
  "name": "戏子",
  "ids": [
   "xi zi",
   "zi"
  ],
  "gender": "男性",
  "age": 35,
  "long": "一位装扮极为奇特的车迟国戏子。",
  "kind": [
   "fighter"
  ],
  "exp": 6500,
  "level": 10,
  "attrs": {
   "str": 25
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/jinchai": {
  "name": "金钗女",
  "ids": [
   "jinchai nu",
   "nu",
   "girl"
  ],
  "gender": "女性",
  "age": 20,
  "long": "一位柳眉粉面含笑，蛾裙领露酥胸的美女。",
  "kind": [
   "fighter"
  ],
  "exp": 2500,
  "level": 6,
  "attrs": {
   "str": 15
  },
  "max": {
   "kee": 130,
   "sen": 130,
   "gin": 130
  },
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao1": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 50,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50,
   "fork": 50,
   "mace": 50,
   "spear": 50,
   "sword": 50,
   "whip": 50,
   "axe": 50,
   "hammer": 50,
   "rake": 50,
   "stick": 50,
   "staff": 50,
   "dagger": 50
  },
  "max": {
   "sen": 500,
   "gin": 500,
   "kee": 130
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#1",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yinjiao": {
  "name": "银角大王",
  "ids": [
   "yinjiao dawang",
   "yinjiao",
   "dawang",
   "wang"
  ],
  "title": "莲花洞",
  "gender": "男性",
  "age": 54,
  "long": "一位神态傲然的莲花洞妖王。",
  "kind": [
   "fighter"
  ],
  "exp": 950000,
  "level": 137,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 90,
   "dao": 90,
   "unarmed": 95,
   "puti-zhi": 95,
   "dodge": 80,
   "jindouyun": 80,
   "parry": 95,
   "force": 90,
   "wuxiangforce": 90
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 1800,
   "sen": 1800,
   "gin": 1800
  },
  "force": 1200,
  "maxForce": 1200,
  "mana": 1200,
  "maxMana": 1200,
  "forceFactor": 80,
  "manaFactor": 80,
  "carry": [
   [
    "x/obj/cloth/shoupipifeng",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/pingfake",
    "carry"
   ],
   [
    "x/qujing/pingding/obj/pingreal",
    "carry"
   ]
  ]
 },
 "x/qujing/pingding/npc/hu": {
  "name": "巴山虎",
  "ids": [
   "bashan hu",
   "bashan",
   "hu"
  ],
  "gender": "男性",
  "age": 34,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 500000,
  "level": 99,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 50,
   "dao": 50,
   "unarmed": 50,
   "puti-zhi": 50,
   "dodge": 50,
   "jindouyun": 50,
   "parry": 50,
   "force": 50,
   "wuxiangforce": 50
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "force": 600,
  "maxForce": 600,
  "mana": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "manaFactor": 30,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/long": {
  "name": "倚海龙",
  "ids": [
   "yihai long",
   "yihai",
   "long"
  ],
  "gender": "男性",
  "age": 34,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 500000,
  "level": 99,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 50,
   "dao": 50,
   "unarmed": 50,
   "puti-zhi": 50,
   "dodge": 50,
   "jindouyun": 50,
   "parry": 50,
   "force": 50,
   "wuxiangforce": 50
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "force": 600,
  "maxForce": 600,
  "mana": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "manaFactor": 30,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/chong": {
  "name": "伶俐虫",
  "ids": [
   "lingli chong",
   "lingli",
   "chong"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 400000,
  "level": 88,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 40,
   "dao": 40,
   "unarmed": 40,
   "puti-zhi": 40,
   "dodge": 40,
   "jindouyun": 40,
   "parry": 40,
   "force": 40,
   "wuxiangforce": 40
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "force": 500,
  "maxForce": 500,
  "mana": 500,
  "maxMana": 500,
  "forceFactor": 20,
  "manaFactor": 20,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/gui": {
  "name": "精细鬼",
  "ids": [
   "jingxi gui",
   "jingxi gui",
   "gui"
  ],
  "gender": "男性",
  "age": 24,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 400000,
  "level": 88,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 40,
   "dao": 40,
   "unarmed": 40,
   "puti-zhi": 40,
   "dodge": 40,
   "jindouyun": 40,
   "parry": 40,
   "force": 40,
   "wuxiangforce": 40
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "force": 500,
  "maxForce": 500,
  "mana": 500,
  "maxMana": 500,
  "forceFactor": 20,
  "manaFactor": 20,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/jinjiao": {
  "name": "金角大王",
  "ids": [
   "jinjiao dawang",
   "jinjiao",
   "dawang",
   "wang"
  ],
  "title": "莲花洞",
  "gender": "男性",
  "age": 56,
  "long": "一位神态傲然的莲花洞妖王。",
  "kind": [
   "fighter"
  ],
  "exp": 950000,
  "level": 137,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 90,
   "dao": 90,
   "unarmed": 95,
   "puti-zhi": 95,
   "dodge": 80,
   "jindouyun": 80,
   "parry": 95,
   "force": 90,
   "wuxiangforce": 90
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 1800,
   "sen": 1800,
   "gin": 1800
  },
  "force": 1200,
  "maxForce": 1200,
  "mana": 1200,
  "maxMana": 1200,
  "forceFactor": 80,
  "manaFactor": 80,
  "carry": [
   [
    "x/obj/cloth/shoupipifeng",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/hulufake",
    "carry"
   ],
   [
    "x/qujing/pingding/obj/hulureal",
    "carry"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao2": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "一个凶相毕露的小妖。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 150000,
  "level": 54,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 80,
   "unarmed": 80,
   "dodge": 80,
   "blade": 80,
   "fork": 80,
   "mace": 80,
   "spear": 80,
   "sword": 80,
   "whip": 80,
   "axe": 80,
   "hammer": 80,
   "rake": 80,
   "stick": 80,
   "staff": 80,
   "dagger": 80
  },
  "max": {
   "sen": 400,
   "gin": 400,
   "kee": 130
  },
  "force": 400,
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/laonai": {
  "name": "老奶奶",
  "ids": [
   "lao nainai",
   "lao",
   "nainai",
   "queen"
  ],
  "title": "压龙洞",
  "gender": "女性",
  "age": 86,
  "long": "一位扭腰摆臀的压龙洞妖后，身上隐隐地发出狐臭。",
  "kind": [
   "fighter"
  ],
  "exp": 750000,
  "level": 121,
  "attrs": {
   "per": 12
  },
  "skills": {
   "spells": 50,
   "dao": 50,
   "unarmed": 55,
   "puti-zhi": 55,
   "dodge": 50,
   "jindouyun": 50,
   "parry": 55,
   "force": 50,
   "wuxiangforce": 50
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 800,
   "sen": 800,
   "gin": 800
  },
  "force": 700,
  "maxForce": 700,
  "mana": 700,
  "maxMana": 700,
  "forceFactor": 40,
  "manaFactor": 40,
  "carry": [
   [
    "x/obj/cloth/shoupipifeng",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/huaqi": {
  "name": "狐阿七大王",
  "ids": [
   "huaqi dawang",
   "huaqi",
   "dawang",
   "wang"
  ],
  "title": "压龙洞",
  "gender": "男性",
  "age": 64,
  "long": "一位扭腰摆臀的压龙洞妖王，身上隐隐地发出狐臭。",
  "kind": [
   "fighter"
  ],
  "exp": 650000,
  "level": 113,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 70,
   "dao": 70,
   "unarmed": 75,
   "puti-zhi": 75,
   "dodge": 60,
   "jindouyun": 60,
   "parry": 65,
   "force": 60,
   "wuxiangforce": 60
  },
  "map": {
   "spells": "dao",
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce"
  },
  "max": {
   "kee": 1400,
   "sen": 1400,
   "gin": 1400
  },
  "force": 1000,
  "maxForce": 1000,
  "mana": 1000,
  "maxMana": 1000,
  "forceFactor": 60,
  "manaFactor": 60,
  "carry": [
   [
    "x/obj/cloth/shoupipifeng",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/shengfake",
    "carry"
   ],
   [
    "x/qujing/pingding/obj/shengreal",
    "carry"
   ]
  ]
 },
 "x/qujing/tongtian/npc/people#3": {
  "name": "陈鸠",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#4": {
  "name": "陈蜀",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#5": {
  "name": "陈焘",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#7": {
  "name": "陈笮",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#8": {
  "name": "陈子虬",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#9": {
  "name": "陈龙大",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#10": {
  "name": "陈大头",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#16": {
  "name": "陈大伯",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#17": {
  "name": "陈大叔",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#18": {
  "name": "陈大舅",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#19": {
  "name": "陈大哥",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#20": {
  "name": "陈大爷",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/vendor": {
  "name": "陈三鲜",
  "ids": [
   "chen sanxian",
   "chen"
  ],
  "title": "水鲜贩子",
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 500,
  "level": 2,
  "attrs": {
   "per": 34
  },
  "skills": {
   "unarmed": 100
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/qujing/tongtian/obj/zhengxie": 99,
   "x/qujing/tongtian/obj/shaoxia": 99,
   "x/qujing/tongtian/obj/xunyu": 99,
   "x/qujing/tongtian/obj/zuiluo": 99
  },
  "coin": 500,
  "carry": [
   [
    "x/obj/cloth/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/yao#3": {
  "name": "鲇鱼精",
  "ids": [
   "yao jing",
   "jing"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 10
  },
  "skills": {
   "parry": 60,
   "unarmed": 60,
   "dodge": 150,
   "blade": 60,
   "fork": 60,
   "mace": 60,
   "spear": 60,
   "sword": 60,
   "whip": 60,
   "axe": 60,
   "hammer": 60,
   "rake": 60,
   "stick": 60,
   "staff": 60,
   "dagger": 60
  },
  "max": {
   "sen": 600,
   "gin": 600,
   "kee": 180
  },
  "force": 600,
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "carry": [
   [
    "x/qujing/tongtian/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/yao#4": {
  "name": "水螺精",
  "ids": [
   "yao jing",
   "jing"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 10
  },
  "skills": {
   "parry": 60,
   "unarmed": 60,
   "dodge": 150,
   "blade": 60,
   "fork": 60,
   "mace": 60,
   "spear": 60,
   "sword": 60,
   "whip": 60,
   "axe": 60,
   "hammer": 60,
   "rake": 60,
   "stick": 60,
   "staff": 60,
   "dagger": 60
  },
  "max": {
   "sen": 600,
   "gin": 600,
   "kee": 180
  },
  "force": 600,
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "carry": [
   [
    "x/qujing/tongtian/obj/armor#3",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/yao#5": {
  "name": "蚌壳精",
  "ids": [
   "yao jing",
   "jing"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 10
  },
  "skills": {
   "parry": 60,
   "unarmed": 60,
   "dodge": 150,
   "blade": 60,
   "fork": 60,
   "mace": 60,
   "spear": 60,
   "sword": 60,
   "whip": 60,
   "axe": 60,
   "hammer": 60,
   "rake": 60,
   "stick": 60,
   "staff": 60,
   "dagger": 60
  },
  "max": {
   "sen": 600,
   "gin": 600,
   "kee": 180
  },
  "force": 600,
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "carry": [
   [
    "x/qujing/tongtian/obj/armor#0",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/yao#6": {
  "name": "鳌精",
  "ids": [
   "yao jing",
   "jing"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 10
  },
  "skills": {
   "parry": 60,
   "unarmed": 60,
   "dodge": 150,
   "blade": 60,
   "fork": 60,
   "mace": 60,
   "spear": 60,
   "sword": 60,
   "whip": 60,
   "axe": 60,
   "hammer": 60,
   "rake": 60,
   "stick": 60,
   "staff": 60,
   "dagger": 60
  },
  "max": {
   "sen": 600,
   "gin": 600,
   "kee": 180
  },
  "force": 600,
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "carry": [
   [
    "x/qujing/tongtian/obj/armor#1",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/yao#7": {
  "name": "水鲑精",
  "ids": [
   "yao jing",
   "jing"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 10
  },
  "skills": {
   "parry": 60,
   "unarmed": 60,
   "dodge": 150,
   "blade": 60,
   "fork": 60,
   "mace": 60,
   "spear": 60,
   "sword": 60,
   "whip": 60,
   "axe": 60,
   "hammer": 60,
   "rake": 60,
   "stick": 60,
   "staff": 60,
   "dagger": 60
  },
  "max": {
   "sen": 600,
   "gin": 600,
   "kee": 180
  },
  "force": 600,
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 30,
  "carry": [
   [
    "x/qujing/tongtian/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/jinyu": {
  "name": "金鳞怪",
  "ids": [
   "jinlin guai",
   "jinglin",
   "guai"
  ],
  "title": "通天河",
  "gender": "男性",
  "age": 76,
  "long": "一位身着金甲的妖怪。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 1500000,
  "level": 172,
  "attrs": {
   "per": 30
  },
  "skills": {
   "spells": 30,
   "dao": 30,
   "unarmed": 85,
   "hammer": 85,
   "dragonfight": 85,
   "dodge": 80,
   "dragonstep": 70,
   "parry": 85,
   "force": 70,
   "dragonforce": 120
  },
  "map": {
   "spells": "dao",
   "unarmed": "dragon-step",
   "dodge": "dragonstep",
   "force": "dragonforce"
  },
  "max": {
   "kee": 1700,
   "sen": 1700,
   "gin": 1700
  },
  "force": 1700,
  "maxForce": 1700,
  "mana": 600,
  "maxMana": 600,
  "forceFactor": 100,
  "manaFactor": 20,
  "carry": [
   [
    "x/obj/armor/jinjia",
    "wear"
   ],
   [
    "x/obj/weapon/hammer/bahammer",
    "wield"
   ]
  ]
 },
 "x/qujing/tongtian/npc/kid": {
  "name": "小童",
  "ids": [
   "kid"
  ],
  "gender": "男性",
  "age": 5,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 499,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/ji": {
  "name": "公鸡",
  "ids": [
   "gong ji",
   "ji"
  ],
  "gender": "雄性",
  "age": 2,
  "long": "一只雄赳赳的大公鸡。",
  "kind": [
   "fighter"
  ],
  "exp": 0,
  "level": 1,
  "skills": {
   "unarmed": 2,
   "dodge": 10,
   "parry": 10
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  }
 },
 "x/qujing/wuji/npc/people#0": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#1": {
  "name": "小贩",
  "ids": [
   "xiao fan"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#2": {
  "name": "商人",
  "ids": [
   "shang ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#3": {
  "name": "官客",
  "ids": [
   "guan ke"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#4": {
  "name": "僧侣",
  "ids": [
   "seng lu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#5": {
  "name": "道人",
  "ids": [
   "dao ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/vender": {
  "name": "叶大嫂",
  "ids": [
   "ye dasao",
   "ye",
   "dasao",
   "fruit vendor"
  ],
  "gender": "女性",
  "age": 26,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "sells": {
   "x/obj/food/grape": 99,
   "x/obj/food/xueli": 99,
   "x/obj/food/strawberry": 99,
   "x/obj/food/apple": 99,
   "x/obj/food/mellon": 99
  },
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/prince": {
  "name": "太子",
  "ids": [
   "tai zi",
   "zi",
   "prince"
  ],
  "title": "乌鸡国",
  "gender": "男性",
  "age": 20,
  "long": "乌鸡国的王太子，成人之后不再常进宫，常以狩猎为乐。",
  "kind": [
   "fighter"
  ],
  "exp": 300000,
  "level": 76,
  "skills": {
   "blade": 90,
   "dodge": 90,
   "parry": 90,
   "unarmed": 90,
   "force": 90,
   "changquan": 90,
   "wuhu-blade": 90,
   "lengquan-force": 90,
   "yanxing-steps": 90
  },
  "map": {
   "blade": "wuhu-blade",
   "unarmed": "changquan",
   "dodge": "yanxing-steps",
   "parry": "wuhu-blade"
  },
  "max": {
   "kee": 700,
   "sen": 400,
   "gin": 130
  },
  "force": 1000,
  "maxForce": 800,
  "forceFactor": 45,
  "carry": [
   [
    "x/obj/weapon/blade/jindao",
    "wield"
   ],
   [
    "x/obj/armor/jinjia",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/siwei": {
  "name": "伺卫官",
  "ids": [
   "siwei guan",
   "guan"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ],
   [
    "x/obj/weapon/blade/blade",
    "wield"
   ]
  ]
 },
 "x/qujing/wuji/npc/girl": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/obj/cloth/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/taijian": {
  "name": "太监",
  "ids": [
   "tai jian",
   "jian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/queen": {
  "name": "王后",
  "ids": [
   "wang hou",
   "hou",
   "queen"
  ],
  "title": "乌鸡国",
  "gender": "女性",
  "age": 40,
  "long": "乌鸡国的王后，终日愁眉苦脸，心思重重。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "skills": {
   "blade": 20,
   "dodge": 20,
   "parry": 20,
   "unarmed": 20,
   "force": 20
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 180
  },
  "force": 100,
  "maxForce": 500,
  "forceFactor": 4,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/xiaoer": {
  "name": "店小二",
  "ids": [
   "xiao er",
   "xiaoer",
   "xiao",
   "waiter",
   "er"
  ],
  "gender": "男性",
  "age": 26,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 14
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "sells": {
   "x/moon/obj/jiudai": 99
  },
  "coin": 100,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/chen": {
  "name": "臣子",
  "ids": [
   "chen zi",
   "chen"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/kingfake": {
  "name": "国王",
  "ids": [
   "guo wang",
   "wang",
   "king"
  ],
  "title": "乌鸡国",
  "gender": "男性",
  "age": 46,
  "long": "头戴一顶冲天冠，腰束一条碧玉带，身穿一领飞龙舞凤赭黄袍。",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 70,
   "dodge": 70,
   "force": 70,
   "parry": 70,
   "fork": 70,
   "spells": 70,
   "seashentong": 70,
   "dragonfight": 70,
   "dragonforce": 70,
   "fengbo-cha": 70,
   "dragonstep": 70
  },
  "map": {
   "spells": "seashentong",
   "unarmed": "dragonfight",
   "force": "dragonforce",
   "fork": "fengbo-cha",
   "parry": "fengbo-cha",
   "dodge": "dragonstep"
  },
  "max": {
   "kee": 1000,
   "sen": 800,
   "gin": 800
  },
  "force": 1000,
  "maxForce": 1000,
  "mana": 1200,
  "maxMana": 800,
  "forceFactor": 10,
  "manaFactor": 30,
  "carry": [
   [
    "x/obj/cloth/longpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/shanji": {
  "name": "山姬",
  "ids": [
   "shan ji",
   "ji"
  ],
  "gender": "女性",
  "age": 20,
  "long": "一位娇艳迷人的野女子。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 100,
   "dodge": 100,
   "parry": 100,
   "force": 100,
   "spells": 100
  },
  "max": {
   "kee": 750,
   "sen": 750,
   "gin": 750
  },
  "maxForce": 700,
  "maxMana": 800,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/monk2": {
  "name": "守寺僧",
  "ids": [
   "shousi seng",
   "seng"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 74,
   "dodge": 74,
   "parry": 74
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 6,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/monk1#0": {
  "name": "大和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/monk1#2": {
  "name": "笑和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/weishi": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/spear/tieqiang",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/zhenyuan": {
  "name": "镇元大仙",
  "ids": [
   "zhenyuan daxian",
   "zhenyuan",
   "daxian"
  ],
  "title": "五庄观观主",
  "gender": "男性",
  "age": 65,
  "long": "交游遍三界，桃李漫五行。好一位地仙之祖！",
  "kind": [
   "fighter"
  ],
  "exp": 2800000,
  "level": 236,
  "attrs": {
   "str": 30,
   "per": 24
  },
  "skills": {
   "unarmed": 180,
   "wuxing-quan": 200,
   "dodge": 150,
   "baguazhen": 160,
   "parry": 180,
   "sword": 160,
   "sanqing-jian": 190,
   "staff": 160,
   "fumo-zhang": 190,
   "hammer": 160,
   "kaishan-chui": 190,
   "blade": 160,
   "yange-blade": 190,
   "force": 180,
   "zhenyuan-force": 180,
   "literate": 180,
   "spells": 200,
   "taiyi": 200
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "sword": "sanqing-jian",
   "dodge": "baguazhen",
   "staff": "fumo-zhang",
   "blade": "yange-blade",
   "hammer": "kaishan-chui"
  },
  "max": {
   "kee": 4500,
   "sen": 4500,
   "gin": 180
  },
  "force": 5000,
  "maxForce": 2500,
  "mana": 7000,
  "maxMana": 3500,
  "forceFactor": 100,
  "manaFactor": 150,
  "family": {
   "name": "五庄观",
   "gen": 1,
   "title": "祖师"
  },
  "chatChanceCombat": 60,
  "inquiry": {
   "leave": {
    "fn": "expell_me"
   },
   "离开": {
    "fn": "expell_me"
   },
   "袖里乾坤": {
    "fn": "keyword"
   },
   "秘诀": {
    "fn": "keyword"
   },
   "name": "老夫镇元。",
   "here": "这里是五庄观，不过住的可不是道士。",
   "人参果": {
    "fn": "asked_guo"
   }
  },
  "carry": [
   [
    "x/obj/cloth/xianpao",
    "wear"
   ],
   [
    "x/obj/weapon/sword/ruler",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/mingyue": {
  "name": "明月",
  "ids": [
   "ming yue",
   "mingyue"
  ],
  "title": "小仙童",
  "gender": "男性",
  "age": 16,
  "long": "一个讨人喜欢的小仙童。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40
  },
  "max": {
   "kee": 200,
   "sen": 110,
   "gin": 110
  },
  "carry": [
   [
    "x/obj/cloth/xianpao",
    "wear"
   ],
   [
    "x/obj/food/xiangcha",
    "carry"
   ],
   [
    "x/obj/food/xiangcha",
    "carry"
   ],
   [
    "x/obj/food/chahu",
    "carry"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/tieguaili": {
  "name": "铁拐李",
  "ids": [
   "tieguai li",
   "tieguai",
   "li"
  ],
  "gender": "男性",
  "age": 42,
  "long": "他脚登一双烂草鞋，身着一件早就没了本来面目的脏袍，嘴里哼着走调小曲，一副悠闲神态。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 12
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 80,
   "parry": 80,
   "staff": 90,
   "fumo-zhang": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 20,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "staff": "fumo-zhang",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 180
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/pobuyi",
    "wear"
   ],
   [
    "x/obj/cloth/lancaoxie",
    "wear"
   ],
   [
    "x/obj/weapon/staff/tieguai",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/hanzhongli": {
  "name": "汉钟离",
  "ids": [
   "han zhongli",
   "han",
   "zhongli"
  ],
  "gender": "男性",
  "age": 50,
  "long": "一位大腹便便的胖老头。大概总是觉得太热，时不时地要扇几扇。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 70,
   "parry": 80,
   "blade": 90,
   "yange-blade": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 80,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "blade": "yange-blade",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 180
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/xianpao",
    "wear"
   ],
   [
    "x/obj/weapon/blade/bajiaoshan",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/hexiangu": {
  "name": "何仙姑",
  "ids": [
   "he xiangu",
   "he",
   "xiangu"
  ],
  "gender": "女性",
  "age": 25,
  "long": "何仙姑深得镇元大仙喜爱，各位同门大多跟她交好。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 80,
   "parry": 80,
   "sword": 90,
   "sanqing-jian": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 50,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "sword": "sanqing-jian",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 155
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ],
   [
    "x/obj/cloth/shoes",
    "wear"
   ],
   [
    "x/obj/weapon/sword/snow_sword",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/girl": {
  "name": "农家女",
  "ids": [
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "五观庄附近的农家女。平时帮帮种菜养花，闲了常找观内的女弟子玩。",
  "kind": [
   "fighter"
  ],
  "exp": 20,
  "level": 1,
  "attrs": {
   "per": 25
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ],
   [
    "x/obj/cloth/shoes",
    "wear"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/lancaihe": {
  "name": "蓝采和",
  "ids": [
   "lan caihe",
   "lan",
   "caihe"
  ],
  "gender": "男性",
  "age": 18,
  "long": "一位面腆和善的少年。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 80,
   "parry": 80,
   "blade": 90,
   "yange-blade": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 80,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "blade": "yange-blade",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 120
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ],
   [
    "x/obj/weapon/blade/yanblade",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/hanxiangzi": {
  "name": "韩湘子",
  "ids": [
   "han xiangzi",
   "han",
   "xiangzi"
  ],
  "gender": "男性",
  "age": 22,
  "long": "好一位俊雅潇洒的相公。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 80,
   "parry": 80,
   "sword": 90,
   "xiaofeng-sword": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 120,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "sword": "xiaofeng-sword",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 140
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ],
   [
    "x/obj/weapon/sword/yudi",
    "wield"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/qingfeng": {
  "name": "清风",
  "ids": [
   "qing feng",
   "qingfeng"
  ],
  "title": "小仙童",
  "gender": "男性",
  "age": 16,
  "long": "一个机灵的小仙童，在五庄观上下很是吃得开。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40
  },
  "max": {
   "kee": 200,
   "sen": 110,
   "gin": 110
  },
  "carry": [
   [
    "x/obj/cloth/xianpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuzhuang/npc/caoguojiu": {
  "name": "曹国舅",
  "ids": [
   "cao guojiu",
   "cao",
   "guojiu"
  ],
  "gender": "男性",
  "age": 40,
  "long": "一位神情严肃的中年人。",
  "kind": [
   "fighter"
  ],
  "exp": 120000,
  "level": 48,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 60,
   "wuxing-quan": 60,
   "dodge": 80,
   "baguazhen": 70,
   "parry": 80,
   "hammer": 90,
   "kaishan-chui": 100,
   "force": 70,
   "zhenyuan-force": 70,
   "literate": 60,
   "spells": 80,
   "taiyi": 80
  },
  "map": {
   "spells": "taiyi",
   "force": "zhenyuan-force",
   "unarmed": "wuxing-quan",
   "hammer": "kaishan-chui",
   "dodge": "baguazhen"
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 180
  },
  "force": 1000,
  "maxForce": 800,
  "mana": 1600,
  "maxMana": 800,
  "forceFactor": 40,
  "manaFactor": 40,
  "family": {
   "name": "五庄观",
   "gen": 3,
   "title": "弟子"
  },
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ],
   [
    "x/obj/weapon/hammer/baiyuban",
    "wield"
   ]
  ]
 },
 "x/westway/npc/wujiang": {
  "name": "边关守将",
  "ids": [
   "wu jiang",
   "wu",
   "jiang"
  ],
  "gender": "男性",
  "age": 39,
  "long": "他威风凛凛，杀气腾腾，虽然只是个守城门的小官，当年也是打过大仗的。",
  "kind": [
   "fighter"
  ],
  "exp": 214999,
  "level": 65,
  "attrs": {
   "str": 30
  },
  "skills": {
   "unarmed": 110,
   "force": 110,
   "spear": 110,
   "dodge": 110,
   "parry": 110
  },
  "max": {
   "kee": 800,
   "sen": 800,
   "gin": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 30,
  "carry": [
   [
    "x/obj/weapon/spear/tieqiang",
    "wield"
   ],
   [
    "x/obj/armor/tiejia",
    "wear"
   ]
  ]
 },
 "x/westway/npc/tanfan": {
  "name": "摊贩",
  "ids": [
   "tan fan",
   "fan"
  ],
  "gender": "男性",
  "age": 45,
  "long": "一位懒洋洋的摊贩。",
  "kind": [
   "fighter"
  ],
  "exp": 1000,
  "level": 4,
  "attrs": {
   "per": 15
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "sells": {
   "x/obj/food/roubing": 99,
   "x/obj/food/egg": 99,
   "x/obj/food/jiunang": 99
  },
  "coin": 500
 },
 "x/westway/npc/laoren": {
  "name": "青髯老人",
  "ids": [
   "lao ren",
   "lao"
  ],
  "gender": "男性",
  "age": 81,
  "long": "一位面目慈祥的青髯老人。",
  "kind": [
   "fighter"
  ],
  "exp": 12499,
  "level": 15,
  "attrs": {
   "str": 35,
   "per": 45
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80
  },
  "max": {
   "kee": 180,
   "sen": 180,
   "gin": 180
  },
  "inquiry": {
   "book": {
    "fn": "give_it"
   },
   "guide": {
    "fn": "give_it"
   },
   "story": {
    "fn": "give_it"
   },
   "书": {
    "fn": "give_it"
   },
   "传说": {
    "fn": "give_it"
   }
  }
 },
 "x/westway/npc/madao": {
  "name": "马盗",
  "ids": [
   "ma dao",
   "madao",
   "ma",
   "dao"
  ],
  "gender": "男性",
  "age": 26,
  "long": "一个蛮横凶狠的马盗，专门袭击过路马车。",
  "kind": [
   "fighter"
  ],
  "exp": 15000,
  "level": 16,
  "attrs": {
   "str": 25,
   "per": 14
  },
  "skills": {
   "unarmed": 50,
   "dodge": 50,
   "parry": 50,
   "stick": 30
  },
  "max": {
   "kee": 160,
   "sen": 160,
   "gin": 160
  },
  "coin": 200
 },
 "x/qujing/baoxiang/npc/furen": {
  "name": "老妇人",
  "ids": [
   "fu ren",
   "fu",
   "ren"
  ],
  "gender": "女性",
  "age": 80,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 400000,
  "level": 88,
  "attrs": {
   "cor": 20,
   "int": 20,
   "con": 20,
   "per": 30
  },
  "skills": {
   "dodge": 50,
   "parry": 50,
   "force": 50,
   "spells": 50,
   "unarmed": 50,
   "gouhunshu": 50,
   "tonsillit": 50,
   "ghost-steps": 50,
   "jinghun-zhang": 50
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 700,
   "sen": 700,
   "gin": 700
  },
  "force": 800,
  "maxForce": 800,
  "mana": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "manaFactor": 60,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ],
   [
    "x/qujing/baoxiang/obj/zhuzhang",
    "carry"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/gonggong": {
  "name": "老公公",
  "ids": [
   "gong gong",
   "gong"
  ],
  "gender": "男性",
  "age": 80,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 400000,
  "level": 88,
  "attrs": {
   "cor": 20,
   "int": 20,
   "con": 20,
   "per": 30
  },
  "skills": {
   "dodge": 50,
   "parry": 50,
   "force": 50,
   "spells": 50,
   "unarmed": 50,
   "gouhunshu": 50,
   "tonsillit": 50,
   "ghost-steps": 50,
   "jinghun-zhang": 50
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 700,
   "sen": 700,
   "gin": 700
  },
  "force": 800,
  "maxForce": 800,
  "mana": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "manaFactor": 60,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ],
   [
    "x/qujing/baoxiang/obj/longtou",
    "carry"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/lanpao": {
  "name": "蓝袍怪",
  "ids": [
   "lanpao guai",
   "guai"
  ],
  "title": "天狈星",
  "gender": "男性",
  "age": 60,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1500000,
  "level": 172,
  "attrs": {
   "str": 30,
   "cor": 30,
   "int": 10,
   "cps": 10,
   "con": 20,
   "per": 20
  },
  "skills": {
   "dodge": 180,
   "force": 180,
   "spells": 180,
   "unarmed": 180,
   "gouhunshu": 180,
   "tonsillit": 180,
   "ghost-steps": 180,
   "jinghun-zhang": 180
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 2500,
   "sen": 2500,
   "gin": 2500
  },
  "force": 2500,
  "maxForce": 2500,
  "mana": 2500,
  "maxMana": 2500,
  "forceFactor": 30,
  "manaFactor": 80,
  "inquiry": {
   "兄弟": {
    "fn": "allow_split"
   },
   "brother": {
    "fn": "allow_split"
   },
   "brothers": {
    "fn": "allow_split"
   }
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/sppifeng",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/lupao": {
  "name": "绿袍怪",
  "ids": [
   "lupao guai",
   "guai"
  ],
  "title": "天狐星",
  "gender": "男性",
  "age": 60,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1500000,
  "level": 172,
  "attrs": {
   "str": 30,
   "cor": 30,
   "int": 10,
   "cps": 10,
   "con": 20,
   "per": 20
  },
  "skills": {
   "dodge": 180,
   "force": 180,
   "spells": 180,
   "unarmed": 180,
   "gouhunshu": 180,
   "tonsillit": 180,
   "ghost-steps": 180,
   "jinghun-zhang": 180
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 2500,
   "sen": 2500,
   "gin": 2500
  },
  "force": 2500,
  "maxForce": 2500,
  "mana": 2500,
  "maxMana": 2500,
  "forceFactor": 30,
  "manaFactor": 80,
  "inquiry": {
   "兄弟": {
    "fn": "allow_split"
   },
   "brother": {
    "fn": "allow_split"
   },
   "brothers": {
    "fn": "allow_split"
   }
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/sppifeng",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/qingpao": {
  "name": "青袍怪",
  "ids": [
   "qingpao guai",
   "guai"
  ],
  "title": "天狗星",
  "gender": "男性",
  "age": 60,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1500000,
  "level": 172,
  "attrs": {
   "str": 30,
   "cor": 30,
   "int": 10,
   "cps": 10,
   "con": 20,
   "per": 20
  },
  "skills": {
   "dodge": 180,
   "force": 180,
   "spells": 180,
   "unarmed": 180,
   "gouhunshu": 180,
   "tonsillit": 180,
   "ghost-steps": 180,
   "jinghun-zhang": 180
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 2500,
   "sen": 2500,
   "gin": 2500
  },
  "force": 2500,
  "maxForce": 2500,
  "mana": 2500,
  "maxMana": 2500,
  "forceFactor": 30,
  "manaFactor": 80,
  "inquiry": {
   "兄弟": {
    "fn": "allow_split"
   },
   "brother": {
    "fn": "allow_split"
   },
   "brothers": {
    "fn": "allow_split"
   }
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/sppifeng",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/zipao": {
  "name": "紫袍怪",
  "ids": [
   "zipao guai",
   "guai"
  ],
  "title": "天豺星",
  "gender": "男性",
  "age": 60,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1500000,
  "level": 172,
  "attrs": {
   "str": 30,
   "cor": 30,
   "int": 10,
   "cps": 10,
   "con": 20,
   "per": 20
  },
  "skills": {
   "dodge": 180,
   "force": 180,
   "spells": 180,
   "unarmed": 180,
   "gouhunshu": 180,
   "tonsillit": 180,
   "ghost-steps": 180,
   "jinghun-zhang": 180
  },
  "map": {
   "unarmed": "jinghun-zhang",
   "force": "tonsillit",
   "spells": "gouhunshu"
  },
  "max": {
   "kee": 2500,
   "sen": 2500,
   "gin": 2500
  },
  "force": 2500,
  "maxForce": 2500,
  "mana": 2500,
  "maxMana": 2500,
  "forceFactor": 30,
  "manaFactor": 80,
  "inquiry": {
   "兄弟": {
    "fn": "allow_split"
   },
   "brother": {
    "fn": "allow_split"
   },
   "brothers": {
    "fn": "allow_split"
   }
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/sppifeng",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/chen": {
  "name": "陈长老",
  "ids": [
   "chen zhanglao",
   "chen",
   "zhanglao"
  ],
  "gender": "男性",
  "age": 70,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 50000,
  "level": 31,
  "attrs": {
   "per": 35
  },
  "skills": {
   "dodge": 30,
   "force": 30,
   "parry": 30
  },
  "max": {
   "sen": 600,
   "gin": 600,
   "kee": 180
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/choupao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/king": {
  "name": "国王",
  "ids": [
   "ghost guo wang",
   "guo wang",
   "wang",
   "king"
  ],
  "title": "乌鸡国",
  "gender": "男性",
  "age": 46,
  "long": "头戴一顶冲天冠，腰束一条碧玉带，身穿一领飞龙舞凤赭黄袍。",
  "kind": [
   "fighter"
  ],
  "exp": 1,
  "level": 1,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 1,
   "dodge": 1,
   "parry": 1
  },
  "max": {
   "kee": 1,
   "sen": 1,
   "gin": 1
  },
  "inquiry": {
   "name": "老夫乃是乌鸡国国王，三年前被一道人所害，推下御花园琉璃井。",
   "here": "此乃宝林寺也",
   "妖道": "三年前那妖道将朕推下了井，自己变做朕的模样，霸占了朕的江山。",
   "报仇": {
    "fn": "give_jade"
   }
  },
  "carry": [
   [
    "x/obj/cloth/longpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/kingreal": {
  "name": "国王",
  "ids": [
   "guo wang",
   "wang",
   "king"
  ],
  "title": "乌鸡国",
  "gender": "男性",
  "age": 46,
  "long": "头戴一顶冲天冠，腰束一条碧玉带，身穿一领飞龙舞凤赭黄袍。",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 100,
   "dodge": 100,
   "parry": 100
  },
  "max": {
   "kee": 800,
   "sen": 800,
   "gin": 800
  },
  "maxForce": 1000,
  "maxMana": 1000,
  "forceFactor": 120,
  "carry": [
   [
    "x/obj/cloth/longpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/longwang": {
  "name": "井龙王",
  "ids": [
   "jing longwang",
   "longwang",
   "wang"
  ],
  "gender": "男性",
  "age": 55,
  "long": "井里的龙王，掌管着井底的世界。",
  "kind": [
   "fighter"
  ],
  "exp": 550000,
  "level": 104,
  "attrs": {
   "str": 30,
   "per": 24
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "force": 80,
   "parry": 80,
   "fork": 80,
   "spells": 80,
   "seashentong": 80,
   "dragonfight": 80,
   "dragonforce": 80,
   "fengbo-cha": 80,
   "dragonstep": 80
  },
  "map": {
   "spells": "seashentong",
   "unarmed": "dragonfight",
   "force": "dragonforce",
   "fork": "fengbo-cha",
   "parry": "fengbo-cha",
   "dodge": "dragonstep"
  },
  "max": {
   "kee": 1000,
   "sen": 800,
   "gin": 800
  },
  "force": 1000,
  "maxForce": 1000,
  "mana": 1200,
  "maxMana": 800,
  "forceFactor": 90,
  "manaFactor": 40,
  "inquiry": {
   "宝贝": {
    "fn": "show_king"
   },
   "国王": {
    "fn": "show_king"
   },
   "king": {
    "fn": "show_king"
   }
  },
  "carry": [
   [
    "x/obj/cloth/longpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/ji": {
  "name": "山鸡",
  "ids": [
   "shan ji",
   "ji"
  ],
  "age": 20,
  "long": "一只成精的母花山鸡。",
  "kind": [
   "fighter"
  ],
  "exp": 0,
  "level": 1,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 100,
   "dodge": 100,
   "parry": 100
  },
  "max": {
   "kee": 130,
   "sen": 130,
   "gin": 130
  }
 },
 "x/qujing/chechi/npc/huli": {
  "name": "虎力大仙",
  "ids": [
   "huli daxian",
   "huli",
   "daxian"
  ],
  "title": "国师",
  "gender": "男性",
  "age": 40,
  "long": "车迟国的三大道士之一，善于求水祈雨，被尊为国师。",
  "kind": [
   "fighter"
  ],
  "exp": 900000,
  "level": 133,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 75,
   "dodge": 75,
   "parry": 75,
   "spells": 75,
   "force": 75,
   "wuxiangforce": 75,
   "dao": 75,
   "jindouyun": 75,
   "puti-zhi": 75
  },
  "map": {
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce",
   "spells": "dao"
  },
  "max": {
   "kee": 1300,
   "sen": 1300,
   "gin": 1300
  },
  "force": 1300,
  "maxForce": 1300,
  "mana": 1300,
  "maxMana": 1300,
  "forceFactor": 80,
  "manaFactor": 40,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/luli": {
  "name": "鹿力大仙",
  "ids": [
   "luli daxian",
   "luli",
   "daxian"
  ],
  "title": "国师",
  "gender": "男性",
  "age": 40,
  "long": "车迟国的三大道士之一，善于求水祈雨，被尊为国师。",
  "kind": [
   "fighter"
  ],
  "exp": 900000,
  "level": 133,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 75,
   "dodge": 75,
   "parry": 75,
   "spells": 75,
   "force": 75,
   "wuxiangforce": 75,
   "dao": 75,
   "jindouyun": 75,
   "puti-zhi": 75
  },
  "map": {
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce",
   "spells": "dao"
  },
  "max": {
   "kee": 1300,
   "sen": 1300,
   "gin": 1300
  },
  "force": 1300,
  "maxForce": 1300,
  "mana": 1300,
  "maxMana": 1300,
  "forceFactor": 80,
  "manaFactor": 40,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/yangli": {
  "name": "羊力大仙",
  "ids": [
   "yangli daxian",
   "yangli",
   "daxian"
  ],
  "title": "国师",
  "gender": "男性",
  "age": 40,
  "long": "车迟国的三大道士之一，善于求水祈雨，被尊为国师。",
  "kind": [
   "fighter"
  ],
  "exp": 900000,
  "level": 133,
  "attrs": {
   "int": 30,
   "per": 30
  },
  "skills": {
   "unarmed": 75,
   "dodge": 75,
   "parry": 75,
   "spells": 75,
   "force": 75,
   "wuxiangforce": 75,
   "dao": 75,
   "jindouyun": 75,
   "puti-zhi": 75
  },
  "map": {
   "unarmed": "puti-zhi",
   "dodge": "jindouyun",
   "force": "wuxiangforce",
   "spells": "dao"
  },
  "max": {
   "kee": 1300,
   "sen": 1300,
   "gin": 1300
  },
  "force": 1300,
  "maxForce": 1300,
  "mana": 1300,
  "maxMana": 1300,
  "forceFactor": 80,
  "manaFactor": 40,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/city/npc/wujiang@ximen": {
  "name": "守城武将",
  "ids": [
   "wu jiang",
   "wu",
   "jiang"
  ],
  "gender": "男性",
  "age": 34,
  "long": "他威风凛凛，杀气腾腾，虽然只是个守城门的小官，当年也是打过大仗的。",
  "kind": [
   "fighter"
  ],
  "exp": 80000,
  "level": 39,
  "attrs": {
   "str": 25
  },
  "skills": {
   "unarmed": 70,
   "force": 70,
   "sword": 70,
   "dodge": 70,
   "parry": 70
  },
  "max": {
   "kee": 700,
   "sen": 600,
   "gin": 180
  },
  "force": 400,
  "maxForce": 400,
  "mana": 100,
  "maxMana": 100,
  "forceFactor": 15,
  "manaFactor": 5,
  "carry": [
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ],
   [
    "x/obj/armor/tiejia",
    "wear"
   ]
  ]
 },
 "x/city/npc/bing@ximen": {
  "name": "小兵",
  "ids": [
   "xiao bing",
   "bing"
  ],
  "gender": "男性",
  "age": 22,
  "long": "这些兵士都是秦叔宝，程咬金等从部下中挑出来的精锐。",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "attrs": {
   "str": 20
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "blade": 40,
   "force": 40
  },
  "max": {
   "kee": 400,
   "sen": 400,
   "gin": 140
  },
  "force": 200,
  "maxForce": 200,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/weapon/blade/blade",
    "wield"
   ],
   [
    "x/obj/cloth/bingfu",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#6@bei2": {
  "name": "艺人",
  "ids": [
   "yi ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#7@bei3": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#0@bei4": {
  "name": "渔夫",
  "ids": [
   "yu fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/shanyao@dong": {
  "name": "山妖",
  "ids": [
   "shan yao",
   "yao"
  ],
  "gender": "男性",
  "age": 100,
  "long": "一个凶相毕露的山妖。",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 50,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50,
   "fork": 50,
   "mace": 50,
   "spear": 50,
   "sword": 50,
   "whip": 50,
   "axe": 50,
   "hammer": 50,
   "rake": 50,
   "stick": 50,
   "staff": 50,
   "dagger": 50
  },
  "max": {
   "sen": 500,
   "gin": 500,
   "kee": 180
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 50,
  "carry": [
   [
    "x/qujing/baoxiang/obj/spqun",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/bing@gongmen": {
  "name": "宫兵",
  "ids": [
   "gong bing",
   "bing"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 209999,
  "level": 64,
  "attrs": {
   "str": 30
  },
  "skills": {
   "unarmed": 80,
   "parry": 80,
   "dodge": 80,
   "blade": 80
  },
  "max": {
   "kee": 600,
   "gin": 600,
   "sen": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 49,
  "carry": [
   [
    "x/qujing/baoxiang/obj/wandao#2",
    "wield"
   ],
   [
    "x/qujing/baoxiang/obj/zhanpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/bing@longfeng": {
  "name": "宫兵",
  "ids": [
   "gong bing",
   "bing"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 209999,
  "level": 64,
  "attrs": {
   "str": 30
  },
  "skills": {
   "unarmed": 80,
   "parry": 80,
   "dodge": 80,
   "blade": 80
  },
  "max": {
   "kee": 600,
   "gin": 600,
   "sen": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 49,
  "carry": [
   [
    "x/qujing/baoxiang/obj/wandao#2",
    "wield"
   ],
   [
    "x/qujing/baoxiang/obj/zhanpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/bing@xi1": {
  "name": "宫兵",
  "ids": [
   "gong bing",
   "bing"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 209999,
  "level": 64,
  "attrs": {
   "str": 30
  },
  "skills": {
   "unarmed": 80,
   "parry": 80,
   "dodge": 80,
   "blade": 80
  },
  "max": {
   "kee": 600,
   "gin": 600,
   "sen": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 49,
  "carry": [
   [
    "x/qujing/baoxiang/obj/wandao#2",
    "wield"
   ],
   [
    "x/qujing/baoxiang/obj/zhanpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#6@xi1": {
  "name": "艺人",
  "ids": [
   "yi ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#7@xi1": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#7@xi2": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#0@xi2": {
  "name": "渔夫",
  "ids": [
   "yu fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#0@xi3": {
  "name": "渔夫",
  "ids": [
   "yu fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#1@xi3": {
  "name": "樵夫",
  "ids": [
   "qiao fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/people#1@xi4": {
  "name": "樵夫",
  "ids": [
   "qiao fu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 599,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 175,
   "sen": 175,
   "gin": 175
  },
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/baoxiang/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl@yujie1": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl@yujie2": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl@yujie3": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl@yujie4": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl@yujie5": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/girl@yujie6": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/baoxiang/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/baoxiang/npc/bing@zhendong": {
  "name": "宫兵",
  "ids": [
   "gong bing",
   "bing"
  ],
  "gender": "男性",
  "age": 35,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 209999,
  "level": 64,
  "attrs": {
   "str": 30
  },
  "skills": {
   "unarmed": 80,
   "parry": 80,
   "dodge": 80,
   "blade": 80
  },
  "max": {
   "kee": 600,
   "gin": 600,
   "sen": 180
  },
  "force": 600,
  "maxForce": 600,
  "forceFactor": 49,
  "carry": [
   [
    "x/qujing/baoxiang/obj/wandao#2",
    "wield"
   ],
   [
    "x/qujing/baoxiang/obj/zhanpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/weishi@gong5b": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/weishi@gong5d": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/weishi@gong5e": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#0@hou": {
  "name": "知书和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/girl@hougong2": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/chechi/obj/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/girl@hougong3": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/chechi/obj/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#4@jieshi10": {
  "name": "读书人",
  "ids": [
   "dushu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#5@jieshi10": {
  "name": "官客",
  "ids": [
   "guan ke"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#5@jieshi2": {
  "name": "官客",
  "ids": [
   "guan ke"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#6@jieshi3": {
  "name": "僧侣",
  "ids": [
   "seng lu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#7@jieshi4": {
  "name": "道人",
  "ids": [
   "dao ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#0@jieshi5": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#1@jieshi6": {
  "name": "小贩",
  "ids": [
   "xiao fan"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#2@jieshi7": {
  "name": "女佣",
  "ids": [
   "nu yong"
  ],
  "gender": "女性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#3@jieshi8": {
  "name": "商人",
  "ids": [
   "shang ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/people#4@jieshi8": {
  "name": "读书人",
  "ids": [
   "dushu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 8,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/qujing/chechi/obj/changpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/taijian@jinluan": {
  "name": "太监",
  "ids": [
   "tai jian",
   "jian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/qujing/chechi/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/taijian@leiyu": {
  "name": "太监",
  "ids": [
   "tai jian",
   "jian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/qujing/chechi/obj/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/girl@wufeng": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/qujing/chechi/obj/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/daoshi@xiang2": {
  "name": "道士",
  "ids": [
   "dao shi",
   "dao",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 84,
   "dodge": 84,
   "parry": 84,
   "force": 84
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/daoshi@xiang3": {
  "name": "道士",
  "ids": [
   "dao shi",
   "dao",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 20000,
  "level": 19,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 84,
   "dodge": 84,
   "parry": 84,
   "force": 84
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 5,
  "carry": [
   [
    "x/obj/cloth/daopao",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/weishi@zhaomen": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/sword/changjian",
    "wield"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#3@zheng": {
  "name": "大和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/chechi/npc/heshang#4@zheng": {
  "name": "穷和尚",
  "ids": [
   "he shang"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 25999,
  "level": 22,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 300,
   "sen": 300,
   "gin": 300
  },
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/sengyi",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao1@dating": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 50,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50,
   "fork": 50,
   "mace": 50,
   "spear": 50,
   "sword": 50,
   "whip": 50,
   "axe": 50,
   "hammer": 50,
   "rake": 50,
   "stick": 50,
   "staff": 50,
   "dagger": 50
  },
  "max": {
   "sen": 500,
   "gin": 500,
   "kee": 130
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#1",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao1@nandong": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 50,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50,
   "fork": 50,
   "mace": 50,
   "spear": 50,
   "sword": 50,
   "whip": 50,
   "axe": 50,
   "hammer": 50,
   "rake": 50,
   "stick": 50,
   "staff": 50,
   "dagger": 50
  },
  "max": {
   "sen": 500,
   "gin": 500,
   "kee": 130
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#1",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao1@qianting": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 50,
   "unarmed": 50,
   "dodge": 50,
   "blade": 50,
   "fork": 50,
   "mace": 50,
   "spear": 50,
   "sword": 50,
   "whip": 50,
   "axe": 50,
   "hammer": 50,
   "rake": 50,
   "stick": 50,
   "staff": 50,
   "dagger": 50
  },
  "max": {
   "sen": 500,
   "gin": 500,
   "kee": 130
  },
  "force": 500,
  "maxForce": 500,
  "maxMana": 500,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#1",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao2@shilang1": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "一个凶相毕露的小妖。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 150000,
  "level": 54,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 80,
   "unarmed": 80,
   "dodge": 80,
   "blade": 80,
   "fork": 80,
   "mace": 80,
   "spear": 80,
   "sword": 80,
   "whip": 80,
   "axe": 80,
   "hammer": 80,
   "rake": 80,
   "stick": 80,
   "staff": 80,
   "dagger": 80
  },
  "max": {
   "sen": 400,
   "gin": 400,
   "kee": 130
  },
  "force": 400,
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao2@shilang2": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "一个凶相毕露的小妖。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 150000,
  "level": 54,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 80,
   "unarmed": 80,
   "dodge": 80,
   "blade": 80,
   "fork": 80,
   "mace": 80,
   "spear": 80,
   "sword": 80,
   "whip": 80,
   "axe": 80,
   "hammer": 80,
   "rake": 80,
   "stick": 80,
   "staff": 80,
   "dagger": 80
  },
  "max": {
   "sen": 400,
   "gin": 400,
   "kee": 130
  },
  "force": 400,
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao2@shimen": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "一个凶相毕露的小妖。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 150000,
  "level": 54,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 80,
   "unarmed": 80,
   "dodge": 80,
   "blade": 80,
   "fork": 80,
   "mace": 80,
   "spear": 80,
   "sword": 80,
   "whip": 80,
   "axe": 80,
   "hammer": 80,
   "rake": 80,
   "stick": 80,
   "staff": 80,
   "dagger": 80
  },
  "max": {
   "sen": 400,
   "gin": 400,
   "kee": 130
  },
  "force": 400,
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao2@wofang1": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "一个凶相毕露的小妖。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 150000,
  "level": 54,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 80,
   "unarmed": 80,
   "dodge": 80,
   "blade": 80,
   "fork": 80,
   "mace": 80,
   "spear": 80,
   "sword": 80,
   "whip": 80,
   "axe": 80,
   "hammer": 80,
   "rake": 80,
   "stick": 80,
   "staff": 80,
   "dagger": 80
  },
  "max": {
   "sen": 400,
   "gin": 400,
   "kee": 130
  },
  "force": 400,
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/pingding/npc/yao2@wofang2": {
  "name": "小妖",
  "ids": [
   "xiao yao",
   "yao"
  ],
  "gender": "男性",
  "age": 20,
  "long": "一个凶相毕露的小妖。",
  "kind": [
   "bandit"
  ],
  "aggressive": true,
  "exp": 150000,
  "level": 54,
  "attrs": {
   "per": 15
  },
  "skills": {
   "parry": 80,
   "unarmed": 80,
   "dodge": 80,
   "blade": 80,
   "fork": 80,
   "mace": 80,
   "spear": 80,
   "sword": 80,
   "whip": 80,
   "axe": 80,
   "hammer": 80,
   "rake": 80,
   "stick": 80,
   "staff": 80,
   "dagger": 80
  },
  "max": {
   "sen": 400,
   "gin": 400,
   "kee": 130
  },
  "force": 400,
  "maxForce": 400,
  "maxMana": 400,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/shoupiqun",
    "wear"
   ],
   [
    "x/qujing/pingding/obj/armor#2",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/people#17@bing2": {
  "name": "陈大叔",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#18@bing3": {
  "name": "陈大舅",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/people#19@bing4": {
  "name": "陈大哥",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/tongtian/npc/kid@minju2": {
  "name": "小童",
  "ids": [
   "kid"
  ],
  "gender": "男性",
  "age": 5,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 499,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/kid@minju3": {
  "name": "小童",
  "ids": [
   "kid"
  ],
  "gender": "男性",
  "age": 5,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 499,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/kid@minju4": {
  "name": "小童",
  "ids": [
   "kid"
  ],
  "gender": "男性",
  "age": 5,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 499,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/kid@minju6": {
  "name": "小童",
  "ids": [
   "kid"
  ],
  "gender": "男性",
  "age": 5,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 499,
  "level": 2,
  "attrs": {
   "per": 23
  },
  "max": {
   "kee": 100,
   "sen": 100,
   "gin": 100
  },
  "forceFactor": 2,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/tongtian/npc/people#8@minju6": {
  "name": "陈子虬",
  "ids": [
   "chen"
  ],
  "gender": "男性",
  "age": 49,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10999,
  "level": 14,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2
 },
 "x/qujing/wuji/npc/people#4@estreet2": {
  "name": "僧侣",
  "ids": [
   "seng lu"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/siwei@house": {
  "name": "伺卫官",
  "ids": [
   "siwei guan",
   "guan"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ],
   [
    "x/obj/weapon/blade/blade",
    "wield"
   ]
  ]
 },
 "x/qujing/wuji/npc/girl@huilang2": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/obj/cloth/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/girl@jxt": {
  "name": "宫妃",
  "ids": [
   "gong fei",
   "girl"
  ],
  "gender": "女性",
  "age": 15,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 30
  },
  "skills": {
   "unarmed": 10
  },
  "max": {
   "kee": 105,
   "sen": 105,
   "gin": 105
  },
  "carry": [
   [
    "x/obj/cloth/gongqun",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#5@nstreet": {
  "name": "道人",
  "ids": [
   "dao ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#0@nstreet": {
  "name": "路人",
  "ids": [
   "lu ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#1@nstreet2": {
  "name": "小贩",
  "ids": [
   "xiao fan"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#2@nstreet2": {
  "name": "商人",
  "ids": [
   "shang ren"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/people#3@nstreet2": {
  "name": "官客",
  "ids": [
   "guan ke"
  ],
  "gender": "男性",
  "age": 29,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 1499,
  "level": 4,
  "attrs": {
   "per": 23
  },
  "skills": {
   "unarmed": 54,
   "dodge": 54,
   "parry": 54
  },
  "max": {
   "kee": 200,
   "sen": 200,
   "gin": 200
  },
  "maxForce": 300,
  "maxMana": 300,
  "forceFactor": 2,
  "chatChance": 9,
  "chatMsg": [
   {
    "fn": "random_move"
   }
  ],
  "coin": 200,
  "carry": [
   [
    "x/obj/cloth/linen",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/taijian@palace": {
  "name": "太监",
  "ids": [
   "tai jian",
   "jian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/taijian@qiyutan": {
  "name": "太监",
  "ids": [
   "tai jian",
   "jian"
  ],
  "gender": "男性",
  "age": 40,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 100000,
  "level": 44,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 40,
   "dodge": 40,
   "parry": 40,
   "force": 40,
   "spells": 40
  },
  "max": {
   "kee": 500,
   "sen": 500,
   "gin": 500
  },
  "maxForce": 600,
  "maxMana": 600,
  "forceFactor": 10,
  "carry": [
   [
    "x/obj/cloth/gongpao",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/shanji@road3": {
  "name": "山姬",
  "ids": [
   "shan ji",
   "ji"
  ],
  "gender": "女性",
  "age": 20,
  "long": "一位娇艳迷人的野女子。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 100,
   "dodge": 100,
   "parry": 100,
   "force": 100,
   "spells": 100
  },
  "max": {
   "kee": 750,
   "sen": 750,
   "gin": 750
  },
  "maxForce": 700,
  "maxMana": 800,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/shanji@road5": {
  "name": "山姬",
  "ids": [
   "shan ji",
   "ji"
  ],
  "gender": "女性",
  "age": 20,
  "long": "一位娇艳迷人的野女子。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 100,
   "dodge": 100,
   "parry": 100,
   "force": 100,
   "spells": 100
  },
  "max": {
   "kee": 750,
   "sen": 750,
   "gin": 750
  },
  "maxForce": 700,
  "maxMana": 800,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/shanji@road7": {
  "name": "山姬",
  "ids": [
   "shan ji",
   "ji"
  ],
  "gender": "女性",
  "age": 20,
  "long": "一位娇艳迷人的野女子。",
  "kind": [
   "fighter"
  ],
  "exp": 10000,
  "level": 13,
  "attrs": {
   "per": 20
  },
  "skills": {
   "unarmed": 100,
   "dodge": 100,
   "parry": 100,
   "force": 100,
   "spells": 100
  },
  "max": {
   "kee": 750,
   "sen": 750,
   "gin": 750
  },
  "maxForce": 700,
  "maxMana": 800,
  "forceFactor": 50,
  "carry": [
   [
    "x/obj/cloth/skirt",
    "wear"
   ]
  ]
 },
 "x/qujing/wuji/npc/weishi@wall2": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/spear/tieqiang",
    "wield"
   ]
  ]
 },
 "x/qujing/wuji/npc/weishi@wall3": {
  "name": "护宫卫士",
  "ids": [
   "wei shi",
   "shi"
  ],
  "gender": "男性",
  "age": 30,
  "long": "",
  "kind": [
   "fighter"
  ],
  "exp": 200000,
  "level": 62,
  "attrs": {
   "per": 25
  },
  "skills": {
   "unarmed": 80,
   "dodge": 80,
   "parry": 80,
   "force": 80,
   "spells": 80
  },
  "max": {
   "kee": 600,
   "sen": 600,
   "gin": 600
  },
  "maxForce": 800,
  "maxMana": 800,
  "forceFactor": 60,
  "carry": [
   [
    "x/obj/armor/tongjia",
    "wear"
   ],
   [
    "x/obj/weapon/spear/tieqiang",
    "wield"
   ]
  ]
 }
}
export const ITEMS = {
 "x/obj/cloth/choupao": {
  "name": "绸袍",
  "ids": [
   "choupao",
   "cloth"
  ],
  "unit": "件",
  "value": 600,
  "long": "一件丝绸长袍，质的和裁剪都不错．",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "personality": 1
  }
 },
 "x/obj/cloth/linen": {
  "name": "粗布衣",
  "ids": [
   "linen"
  ],
  "unit": "件",
  "value": 0,
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/food/bao1": {
  "name": "猪肉馅包子",
  "ids": [
   "zhurou bao",
   "bao"
  ],
  "unit": "个",
  "value": 25,
  "long": "一个香喷喷、热腾腾的猪肉馅灌汤包子。",
  "weight": 80,
  "foodStuff": 40,
  "bites": 2
 },
 "x/obj/food/bao2": {
  "name": "海鲜味包子",
  "ids": [
   "haixian bao",
   "bao"
  ],
  "unit": "个",
  "value": 25,
  "long": "一个香喷喷、热腾腾的海鲜味灌汤包子。",
  "weight": 80,
  "foodStuff": 40,
  "bites": 2
 },
 "x/obj/food/bao3": {
  "name": "素菜馅包子",
  "ids": [
   "sucai bao",
   "bao"
  ],
  "unit": "个",
  "value": 25,
  "long": "一个香喷喷、热腾腾的素菜馅灌汤包子。",
  "weight": 80,
  "foodStuff": 40,
  "bites": 2
 },
 "x/obj/cloth/magua": {
  "name": "马褂",
  "ids": [
   "magua"
  ],
  "unit": "件",
  "value": 500,
  "long": "一件淡青色的马褂．",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/sword/changjian": {
  "name": "长剑",
  "ids": [
   "sword",
   "changjian",
   "jian",
   "sword"
  ],
  "unit": "柄",
  "value": 500,
  "long": "这是一柄长长的精钢剑，剑口锋利。",
  "weight": 5000,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/misc/tables#0": {
  "name": "大仙桌",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/tables#1": {
  "name": "小镶玉案",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/tables#2": {
  "name": "黑兽脚桌",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/tables#3": {
  "name": "方木案",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/tables#4": {
  "name": "圆仙桌",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/tables#5": {
  "name": "白漆镶玉案",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/tables#7": {
  "name": "紫漆木案",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "long": "这是一张桌子。",
  "weight": 30000
 },
 "x/obj/misc/chairs#0": {
  "name": "锦面大长椅",
  "ids": [
   "chair"
  ],
  "unit": "把",
  "value": 2000,
  "long": "这是一把椅子。",
  "weight": 28000
 },
 "x/obj/misc/chairs#1": {
  "name": "缎面扶手躺椅",
  "ids": [
   "chair"
  ],
  "unit": "把",
  "value": 2000,
  "long": "这是一把椅子。",
  "weight": 28000
 },
 "x/obj/misc/chairs#2": {
  "name": "鹅绒靠背长椅",
  "ids": [
   "chair"
  ],
  "unit": "把",
  "value": 2000,
  "long": "这是一把椅子。",
  "weight": 28000
 },
 "x/obj/misc/chairs#3": {
  "name": "丝绣折叠躺椅",
  "ids": [
   "chair"
  ],
  "unit": "把",
  "value": 2000,
  "long": "这是一把椅子。",
  "weight": 28000
 },
 "x/obj/misc/chairs#4": {
  "name": "锦面安乐长椅",
  "ids": [
   "chair"
  ],
  "unit": "把",
  "value": 2000,
  "long": "这是一把椅子。",
  "weight": 28000
 },
 "x/obj/misc/chairs#5": {
  "name": "缎面躺椅",
  "ids": [
   "chair"
  ],
  "unit": "把",
  "value": 2000,
  "long": "这是一把椅子。",
  "weight": 28000
 },
 "x/obj/cloth/pink_cloth": {
  "name": "粉红绸衫",
  "ids": [
   "pink cloth",
   "cloth"
  ],
  "unit": "件",
  "value": 0,
  "long": "这件粉红色的绸衫上面绣着几只黄鹊，闻起来还有一股淡香。",
  "weight": 1000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "personality": 3
  }
 },
 "x/obj/armor/niupi": {
  "name": "牛皮盾",
  "ids": [
   "leather shield",
   "shield",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 1000,
  "weight": 6000,
  "wearAs": "shield",
  "apply": {
   "armor": 2
  }
 },
 "x/obj/weapon/blade/blade": {
  "name": "钢刀",
  "ids": [
   "blade",
   "gangdao",
   "dao"
  ],
  "unit": "柄",
  "value": 500,
  "long": "这是一寻常的单刀，份量大约六、七斤重。",
  "weight": 4000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/spear/tieqiang": {
  "name": "长枪",
  "ids": [
   "spear",
   "qiang"
  ],
  "unit": "把",
  "value": 500,
  "long": "这是一把长枪，枪尖略显银光．",
  "weight": 4000,
  "wieldAs": "spear",
  "weapon": {
   "spear": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/staff/chanzhang": {
  "name": "禅杖",
  "ids": [
   "staff",
   "zhang"
  ],
  "unit": "把",
  "value": 500,
  "long": "这是一把禅杖，上面几个铁环叮当作响．",
  "weight": 4000,
  "wieldAs": "staff",
  "weapon": {
   "staff": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/hammer/tongchui": {
  "name": "铜锤",
  "ids": [
   "hammer"
  ],
  "unit": "把",
  "value": 500,
  "long": "这是一把沉重的铜锤，打造的相当坚实。",
  "weight": 8000,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/book/san": {
  "name": "〖三字经〗",
  "ids": [
   "book"
  ],
  "unit": "本",
  "value": 1000,
  "weight": 600
 },
 "x/obj/book/basic_blade": {
  "name": "〖刀法入门〗",
  "ids": [
   "blade book",
   "book"
  ],
  "unit": "本",
  "value": 1000,
  "weight": 600
 },
 "x/obj/book/basic_unarmed": {
  "name": "〖拳法入门〗",
  "ids": [
   "unarmed book",
   "book"
  ],
  "unit": "本",
  "value": 1000,
  "long": "〖拳法入门〗",
  "weight": 600
 },
 "x/obj/cloth/huazheboots": {
  "name": "花褶靴",
  "ids": [
   "flower boots",
   "boots"
  ],
  "unit": "双",
  "value": 800,
  "long": "一双皮靴，上等牛皮制成。做功考究，裁剪精致，看上去气派不凡。",
  "weight": 1700,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1,
   "personality": 1
  }
 },
 "x/obj/cloth/wulingjin": {
  "name": "乌绫巾",
  "ids": [
   "wuling jin",
   "jin"
  ],
  "unit": "顶",
  "value": 300,
  "long": "一顶黑缎子制成的丝带，用来束发。",
  "weight": 700,
  "wearAs": "head_eq",
  "apply": {
   "armor": 1,
   "personality": 1
  }
 },
 "x/obj/cloth/bullboots": {
  "name": "牛皮靴",
  "ids": [
   "leather boots",
   "boots"
  ],
  "unit": "双",
  "value": 400,
  "long": "一双皮靴，上等牛皮制成。",
  "weight": 700,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/book/nowords": {
  "name": "〖无字天书〗",
  "ids": [
   "book",
   "nowords",
   "shu"
  ],
  "unit": "本",
  "value": 100,
  "long": "一本脏兮兮的小册子。上面划着一些象是蚯蚓爬出来的图案。",
  "weight": 1000
 },
 "x/obj/cloth": {
  "name": "布衣",
  "ids": [
   "cloth"
  ],
  "unit": "件",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/book/poem": {
  "name": "〖太白自选集〗",
  "ids": [
   "poem",
   "book",
   "shu"
  ],
  "unit": "本",
  "value": 500,
  "long": "这本书大概有两三百页，蓝底白字的封面上龙飞凤舞地写着“太白自选集”。",
  "weight": 1000
 },
 "x/obj/cloth/pobuxie": {
  "name": "破布鞋",
  "ids": [
   "po buxie",
   "buxie",
   "shoes"
  ],
  "unit": "双",
  "weight": 800,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/hammer/jiuhulu": {
  "name": "酒葫芦",
  "ids": [
   "jiu hulu",
   "jiuhulu",
   "hulu"
  ],
  "unit": "个",
  "value": 30,
  "long": "一个装酒的葫芦。",
  "weight": 350,
  "water": 5,
  "liquid": "米酒",
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    5,
    0,
    0
   ]
  }
 },
 "x/city/obj/jiezhi": {
  "name": "金戒指",
  "ids": [
   "jin jiezhi",
   "jiezhi",
   "ring"
  ],
  "unit": "个",
  "value": 2000,
  "wearAs": "finger",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/armor/tiejia": {
  "name": "铁甲",
  "ids": [
   "iron armor",
   "tiejia",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 3000,
  "long": "一件沉甸甸的铁甲。",
  "weight": 40000,
  "wearAs": "armor",
  "apply": {
   "armor": 4,
   "dodge": -10
  }
 },
 "x/obj/cloth/bingfu": {
  "name": "兵服",
  "ids": [
   "cloth",
   "bingfu"
  ],
  "unit": "件",
  "value": 300,
  "long": "一件兵服，前后有铜镜护心，中绣大唐二字．",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/cloth/monkcloth": {
  "name": "护法袈裟",
  "ids": [
   "jia sha",
   "cloth"
  ],
  "unit": "件",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/gao/obj/changpao": {
  "name": "长袍",
  "ids": [
   "changpao"
  ],
  "unit": "件",
  "value": 200,
  "long": "一件青色长袍，象是有学问的人穿的．",
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/cloth/sengyi": {
  "name": "僧衣",
  "ids": [
   "sengyi",
   "cloth"
  ],
  "unit": "件",
  "weight": 1000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/food/baijiu": {
  "name": "粗磁酒瓶",
  "ids": [
   "jiuping",
   "skin"
  ],
  "unit": "个",
  "value": 100,
  "long": "一个用来装酒的粗磁酒瓶，能装两，三斤白酒。",
  "weight": 800,
  "water": 15,
  "liquid": "老白干"
 },
 "x/ourhome/obj/jitui": {
  "name": "炸鸡腿",
  "ids": [
   "jitui",
   "tui"
  ],
  "unit": "根",
  "value": 80,
  "long": "一枝炸得香喷喷的鸡腿。",
  "weight": 350,
  "foodStuff": 15,
  "bites": 4,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    1,
    0,
    0
   ]
  }
 },
 "x/ourhome/obj/huasheng": {
  "name": "花生豆",
  "ids": [
   "huasheng",
   "dou"
  ],
  "unit": "碟",
  "value": 20,
  "long": "一碟花生豆．",
  "weight": 300,
  "foodStuff": 10,
  "bites": 4
 },
 "x/obj/weapon/hammer/jingua": {
  "name": "金瓜",
  "ids": [
   "golden hammer",
   "gua",
   "hammer"
  ],
  "unit": "把",
  "value": 1200,
  "long": "这是一把沉重的金瓜，是皇城卫士的专用武器。",
  "weight": 8500,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/armor/tongjia": {
  "name": "熟铜甲",
  "ids": [
   "bronze armor",
   "tongjia",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 5000,
  "long": "一件金灿灿的熟铜甲。",
  "weight": 50000,
  "wearAs": "armor",
  "apply": {
   "armor": 4,
   "dodge": -15
  }
 },
 "x/moon/obj/jiudai": {
  "name": "桂花酒袋",
  "ids": [
   "jiudai",
   "guihua",
   "skin"
  ],
  "unit": "个",
  "value": 100,
  "long": "一个用来装桂花酒的大酒袋，大概装得八、九升的酒。",
  "weight": 700,
  "water": 15,
  "liquid": "桂花酒"
 },
 "x/ourhome/obj/gourou": {
  "name": "红烧狗肉",
  "ids": [
   "gou rou",
   "gou",
   "gourou"
  ],
  "unit": "碗",
  "value": 100,
  "long": "一碗香喷喷的红烧狗肉",
  "weight": 300,
  "foodStuff": 100,
  "bites": 2
 },
 "x/obj/misc/xiaqi-zhinan": {
  "name": "下棋指南",
  "ids": [
   "xiaqi zhinan",
   "xiaqi",
   "zhinan"
  ],
  "unit": "本",
  "value": 100,
  "noGet": 1,
  "long": "请用 read zhinan 阅读怎样在品棋亭下棋。",
  "weight": 5
 },
 "x/ourhome/obj/linen": {
  "name": "粗布衣",
  "ids": [
   "linen"
  ],
  "unit": "件",
  "value": 0,
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/cloth/xianpao": {
  "name": "仙袍",
  "ids": [
   "xian pao",
   "pao",
   "cloth"
  ],
  "unit": "件",
  "value": 2000,
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "dodge": 5,
   "spells": 5
  }
 },
 "x/obj/cloth/piyi": {
  "name": "皮袍",
  "ids": [
   "pipao"
  ],
  "unit": "件",
  "value": 800,
  "weight": 4000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/magic/hwhite": {
  "name": "白色毫毛",
  "ids": [
   "white hair",
   "whitehair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把纯白色的毫毛，可以用来变成饮料（transform）。",
  "weight": 100,
  "water": 5
 },
 "x/obj/magic/hblack": {
  "name": "黑色毫毛",
  "ids": [
   "black hair",
   "blackhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把深黑色的毫毛，可以用来变成食物（transform）。",
  "weight": 100,
  "foodStuff": 10,
  "bites": 1
 },
 "x/obj/magic/hmaroon": {
  "name": "栗色毫毛",
  "ids": [
   "maroon hair",
   "maroonhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把茶栗色的毫毛，可以用来变成鞋子（transform）。",
  "weight": 100,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/magic/hamber": {
  "name": "琥色毫毛",
  "ids": [
   "amber hair",
   "amberhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把琥珀色的毫毛，可以用来变成衣服（transform）。",
  "weight": 100,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/magic/hscarlet": {
  "name": "绯色毫毛",
  "ids": [
   "scarlet hair",
   "scarlethair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把绯红色的毫毛，可以用来变成项链（transform）。",
  "weight": 100,
  "wearAs": "neck",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/magic/hmagenta": {
  "name": "绛色毫毛",
  "ids": [
   "magenta hair",
   "magentahair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把绛红色的毫毛，可以用来变成帽子（transform）。",
  "weight": 100,
  "wearAs": "head_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/magic/hviolet": {
  "name": "紫色毫毛",
  "ids": [
   "violet hair",
   "violethair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把深紫色的毫毛，可以用来变成鞭类武器（transform）。",
  "weight": 100,
  "wieldAs": "whip",
  "weapon": {
   "whip": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hpink": {
  "name": "粉色毫毛",
  "ids": [
   "pink hair",
   "pinkhair",
   "hair"
  ],
  "unit": "支",
  "value": 10000,
  "noGet": 1,
  "long": "一把粉红色的毫毛，可以用来变成枪类武器（transform）。",
  "weight": 100,
  "wieldAs": "spear",
  "weapon": {
   "spear": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hindigo": {
  "name": "靛色毫毛",
  "ids": [
   "indigo hair",
   "indigohair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把蓝靛色的毫毛，可以用来变成锏类武器（transform）。",
  "weight": 100,
  "wieldAs": "mace",
  "weapon": {
   "mace": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hblue": {
  "name": "蓝色毫毛",
  "ids": [
   "blue hair",
   "bluehair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把深蓝色的毫毛，可以用来变成棍类武器（transform）。",
  "weight": 100,
  "wieldAs": "stick",
  "weapon": {
   "stick": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hbrown": {
  "name": "棕色毫毛",
  "ids": [
   "brown hair",
   "brownhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把深棕色的毫毛，可以用来变成剑类武器（transform）。",
  "weight": 100,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hgreen": {
  "name": "绿色毫毛",
  "ids": [
   "green hair",
   "greenhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把油绿色的毫毛，可以用来变成锤类武器（transform）。",
  "weight": 100,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hyellow": {
  "name": "黄色毫毛",
  "ids": [
   "yellow hair",
   "yellowhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把金黄色的毫毛，可以用来变成叉类武器（transform）。",
  "weight": 100,
  "wieldAs": "fork",
  "weapon": {
   "fork": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/horange": {
  "name": "橙色毫毛",
  "ids": [
   "orange hair",
   "orangehair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把橙黄色的毫毛，可以用来变成刀类武器（transform）。",
  "weight": 100,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/obj/magic/hred": {
  "name": "赤色毫毛",
  "ids": [
   "red hair",
   "redhair",
   "hair"
  ],
  "unit": "把",
  "value": 10000,
  "noGet": 1,
  "long": "一把赤红色的毫毛，可以用来变成斧类武器（transform）。",
  "weight": 100,
  "wieldAs": "axe",
  "weapon": {
   "axe": [
    1,
    19,
    0,
    0
   ]
  }
 },
 "x/city/obj/fanhe": {
  "name": "饭盒",
  "ids": [
   "fan he",
   "fan"
  ],
  "unit": "个",
  "long": "一个小巧的饭盒，摸着还热腾腾的．",
  "weight": 800,
  "foodStuff": 200,
  "bites": 1
 },
 "x/obj/cloth/pobuyi": {
  "name": "破布衣",
  "ids": [
   "po buyi",
   "buyi",
   "cloth"
  ],
  "unit": "件",
  "value": 0,
  "long": "这是一件破烂不堪的布衣，也不知多少年没洗过了，上面满是窟窿。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/blade/caidao": {
  "name": "菜刀",
  "ids": [
   "cai dao",
   "dao",
   "knife"
  ],
  "unit": "柄",
  "value": 100,
  "long": "这是一寻常的菜刀，份量大约六、七斤重。",
  "weight": 1000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    10,
    0,
    0
   ]
  }
 },
 "x/gao/obj/magua": {
  "name": "马褂",
  "ids": [
   "magua"
  ],
  "unit": "件",
  "value": 500,
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/city/obj/mudao": {
  "name": "木刀",
  "ids": [
   "mu dao",
   "dao",
   "blade"
  ],
  "unit": "柄",
  "value": 100,
  "long": "这是一木制的单刀，是练武时用的．",
  "weight": 1000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/city/obj/mujian": {
  "name": "木剑",
  "ids": [
   "mu jian",
   "jian",
   "sword"
  ],
  "unit": "柄",
  "value": 100,
  "long": "这是一木制的长剑，是练武时用的．",
  "weight": 1000,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/city/obj/mugun": {
  "name": "木棍",
  "ids": [
   "mu gun"
  ],
  "unit": "根",
  "value": 100,
  "weight": 1400,
  "wieldAs": "stick",
  "weapon": {
   "stick": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/city/obj/muzhang": {
  "name": "木杖",
  "ids": [
   "mu zhang",
   "zhang",
   "staff"
  ],
  "unit": "把",
  "value": 100,
  "long": "这是一木制的木杖，是练武时用的．",
  "weight": 1000,
  "wieldAs": "staff",
  "weapon": {
   "staff": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/city/obj/muqiang": {
  "name": "木枪",
  "ids": [
   "mu qiang",
   "qiang",
   "spear"
  ],
  "unit": "把",
  "value": 100,
  "long": "这是一木制的长枪，是练武时用的．",
  "weight": 1000,
  "wieldAs": "spear",
  "weapon": {
   "spear": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/sword/xijian": {
  "name": "细剑",
  "ids": [
   "xi jian",
   "jian",
   "sword"
  ],
  "unit": "把",
  "value": 700,
  "long": "这是一把又细又长的剑，轻飘飘的像是女孩子家的玩意。",
  "weight": 1400,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    16,
    0,
    0
   ]
  }
 },
 "x/obj/cloth/bai": {
  "name": "白袍",
  "ids": [
   "white cloth",
   "cloth"
  ],
  "unit": "件",
  "value": 200,
  "long": "一件雪白的布袍，一丝杂色也没有．",
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/whip/fuchen": {
  "name": "拂尘",
  "ids": [
   "fuchen"
  ],
  "unit": "柄",
  "value": 300,
  "long": "这是一柄拂尘，做工精细，本来只是抹灰驱蝇的工具后来成立道士手里的道具，就渐渐失去原来的作用了。",
  "weight": 300,
  "wieldAs": "whip",
  "weapon": {
   "whip": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/lingtai/obj/cloth": {
  "name": "太极道袍",
  "ids": [
   "cloth",
   "pao"
  ],
  "unit": "件",
  "value": 500,
  "weight": 1000,
  "apply": {
   "armor": 1,
   "spells": 2
  }
 },
 "x/obj/weapon/dagger/dagger": {
  "name": "匕首",
  "ids": [
   "bi shou",
   "bishou",
   "dagger"
  ],
  "unit": "把",
  "value": 50,
  "long": "这是一把看起相当普通的匕首。",
  "weight": 1000,
  "wieldAs": "dagger",
  "weapon": {
   "dagger": [
    1,
    4,
    0,
    0
   ]
  }
 },
 "x/obj/cloth/baguapao": {
  "name": "八卦道袍",
  "ids": [
   "bagua pao",
   "pao",
   "cloth"
  ],
  "unit": "件",
  "value": 200,
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "spells": 5
  }
 },
 "x/obj/weapon/sword/taomujian": {
  "name": "桃木剑",
  "ids": [
   "taomu jian",
   "sword",
   "jian"
  ],
  "unit": "把",
  "value": 200,
  "long": "一把桃木制成的长剑，一般是用来写咒画符的．",
  "weight": 1000,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/hammer/hammer": {
  "name": "铁锤",
  "ids": [
   "hammer"
  ],
  "unit": "把",
  "value": 300,
  "long": "这是一把沉重的铁锤，打造的相当坚实。",
  "weight": 8000,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/axe/tiefu": {
  "name": "铁斧",
  "ids": [
   "lumber axe",
   "axe"
  ],
  "unit": "把",
  "value": 300,
  "long": "这是一把沈重的铁斧，用来砍柴。",
  "weight": 22000,
  "wieldAs": "axe",
  "weapon": {
   "axe": [
    1,
    11,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/fork/fork": {
  "name": "钢叉",
  "ids": [
   "gang cha",
   "cha",
   "fork"
  ],
  "unit": "柄",
  "value": 1000,
  "long": "一柄锋利的钢叉。",
  "weight": 8000,
  "wieldAs": "fork",
  "weapon": {
   "fork": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/stick/bintiegun": {
  "name": "镔铁棍",
  "ids": [
   "bintiegun",
   "tiegun",
   "gun",
   "bang"
  ],
  "unit": "根",
  "value": 2000,
  "long": "一根沉甸甸黑黝黝的镔铁棍。",
  "weight": 10000,
  "wieldAs": "stick",
  "weapon": {
   "stick": [
    1,
    35,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/whip/tielian": {
  "name": "铁链",
  "ids": [
   "tie lian",
   "lian",
   "whip"
  ],
  "unit": "条",
  "value": 500,
  "long": "一条长长的铁链，上面沾满了血．",
  "weight": 2000,
  "wieldAs": "whip",
  "weapon": {
   "whip": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/obj/book/quanjing": {
  "name": "〖拳经〗",
  "ids": [
   "quan jing",
   "jing",
   "book"
  ],
  "unit": "本",
  "value": 600,
  "long": "一本薄薄的的小册子，画了些手法。旁注小字：范青平惠存",
  "weight": 400
 },
 "x/gao/obj/hat": {
  "name": "毡帽",
  "ids": [
   "hat"
  ],
  "unit": "顶",
  "value": 100,
  "weight": 800,
  "wearAs": "head_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/gao/obj/shoes": {
  "name": "圆口布鞋",
  "ids": [
   "shoes"
  ],
  "unit": "双",
  "value": 100,
  "weight": 800,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/gao/obj/piyi": {
  "name": "皮袍",
  "ids": [
   "pipao"
  ],
  "unit": "件",
  "value": 1000,
  "weight": 4000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/cloth/nichang": {
  "name": "碧水霓裳",
  "ids": [
   "nichang",
   "cloth"
  ],
  "unit": "条",
  "value": 8000,
  "long": "一条薄如蝉翼，幽香沁人的碧色长裙，轻颤颤地不知由什么布料做成。",
  "weight": 1000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "personality": 5
  }
 },
 "x/obj/cloth/yuanxiang": {
  "name": "软香鞋",
  "ids": [
   "shoes",
   "yuanxiang",
   "xie",
   "yuanxiangxie"
  ],
  "unit": "双",
  "value": 2000,
  "long": "一双小巧温软的绣花鞋。",
  "weight": 900,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1,
   "personality": 3
  }
 },
 "x/obj/drug/fake-tao": {
  "name": "猕猴桃干",
  "ids": [
   "mihou taogan",
   "mihoutaogan",
   "tao",
   "gan",
   "taogan"
  ],
  "unit": "颗",
  "value": 3000,
  "noGet": "你手里一松",
  "long": "黄橙橙的一颗猕猴桃干。据说是由傲来国花国山真正的猕猴桃制成，有强身健体延年益寿的功效。",
  "weight": 20
 },
 "x/obj/drug/jinchuang": {
  "name": "金创药",
  "ids": [
   "jinchuang yao",
   "yao",
   "jinchuang"
  ],
  "unit": "包",
  "value": 2000,
  "long": "这是一包治伤的金创药。"
 },
 "x/obj/drug/hunyuandan": {
  "name": "混元丹",
  "ids": [
   "hunyuan dan",
   "dan"
  ],
  "unit": "颗",
  "value": 2000,
  "long": "一颗略带香气的药丸．"
 },
 "x/city/obj/youping": {
  "name": "油瓶",
  "ids": [
   "youping"
  ],
  "unit": "个",
  "value": 30,
  "long": "一个装油的瓶子．",
  "weight": 350,
  "water": 5,
  "liquid": "菜油",
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    1,
    0,
    0
   ]
  }
 },
 "x/obj/food/cutan": {
  "name": "醋坛子",
  "ids": [
   "tanzi"
  ],
  "unit": "个",
  "value": 50,
  "long": "一个装醋的大坛子．",
  "weight": 2000,
  "water": 5,
  "liquid": "香醋",
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    5,
    0,
    0
   ]
  }
 },
 "x/obj/misc/bag": {
  "name": "布袋",
  "ids": [
   "bag"
  ],
  "unit": "口",
  "value": 50,
  "long": "这是一口寻常的布袋，可以用来装一些杂物。",
  "weight": 500
 },
 "x/obj/paper_seal": {
  "name": "桃符纸",
  "ids": [
   "paper seal",
   "seal",
   "paper"
  ],
  "unit": "叠",
  "value": 10,
  "long": "这是张用来画符的符纸，具有封存法力的功用。",
  "weight": 100
 },
 "x/obj/cloth/xueshan-pao": {
  "name": "雪山白袍",
  "ids": [
   "baipao",
   "pao",
   "cloth"
  ],
  "unit": "件",
  "value": 600,
  "long": "一件丝制白袍，当胸绣着一只飞扬欲脱的大鹏鸟。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "personality": 1
  }
 },
 "x/obj/weapon/blade/iceblade": {
  "name": "冰刀",
  "ids": [
   "ice blade",
   "blade",
   "dao"
  ],
  "unit": "把",
  "value": 8,
  "long": "一把晶莹透明的弯刀，以大雪山中千年不化的寒冰制成。",
  "weight": 5000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    20,
    0,
    0
   ]
  }
 },
 "x/obj/cloth/yayifu": {
  "name": "衙役服",
  "ids": [
   "yayi cloth",
   "cloth"
  ],
  "unit": "件",
  "value": 500,
  "long": "一件青色短装，嵌以红边，是上堂的衙役穿的．",
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/stick/shawei": {
  "name": "杀威大棒",
  "ids": [
   "shawei bang",
   "bang"
  ],
  "unit": "把",
  "value": 200,
  "weight": 3000,
  "wieldAs": "stick",
  "weapon": {
   "stick": [
    1,
    20,
    0,
    0
   ]
  }
 },
 "x/qujing/biqiu/obj/ring": {
  "name": "紫金戒指",
  "ids": [
   "zijin jiezhi",
   "jiezhi",
   "ring"
  ],
  "unit": "个",
  "value": 1000,
  "wearAs": "finger",
  "apply": {
   "armor": 1
  }
 },
 "x/qujing/biqiu/obj/wrists": {
  "name": "鎏金腕链",
  "ids": [
   "liujin wanlian",
   "wanlian",
   "wrists"
  ],
  "unit": "个",
  "value": 5000,
  "wearAs": "wrists",
  "apply": {
   "armor": 1
  }
 },
 "x/qujing/biqiu/obj/neck": {
  "name": "白金项圈",
  "ids": [
   "baijin xiangquan",
   "xiangquan",
   "neck"
  ],
  "unit": "个",
  "value": 3500,
  "wearAs": "neck",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/misc/pai": {
  "name": "描龙玉佩",
  "ids": [
   "yu pei",
   "pei"
  ],
  "unit": "枚",
  "value": 5000,
  "long": "一枚玉佩，上面还雕着花，写着字。",
  "weight": 100
 },
 "x/obj/cloth/sengxie": {
  "name": "僧鞋",
  "ids": [
   "seng xie",
   "xie"
  ],
  "unit": "双",
  "value": 100,
  "long": "一双圆口青布僧鞋。",
  "weight": 1000,
  "wearAs": "feet_eq",
  "apply": {
   "dodge": 3
  }
 },
 "x/obj/books-nonskill/book-qujing": {
  "name": "《西游记西行求取真经指南》",
  "ids": [
   "xyj qujing",
   "xyj",
   "qujing",
   "book"
  ],
  "unit": "本",
  "value": 100,
  "long": "《西游记西行求取真经指南》 请用 read 阅读。",
  "weight": 200
 },
 "x/obj/money/gold": {
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
  "long": "黄澄澄的金子，人见人爱的金子，啊～～金子！"
 },
 "x/nanhai/obj/sengpao": {
  "name": "僧袍",
  "ids": [
   "seng pao",
   "pao",
   "cloth"
  ],
  "unit": "件",
  "long": "这是一件寻常的僧袍，是和尚们的普通装束。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2,
   "spells": 10,
   "dodge": 5
  }
 },
 "x/penglai/npc/obj/sengxie": {
  "name": "僧鞋",
  "ids": [
   "seng xie",
   "xie"
  ],
  "unit": "双",
  "value": 100,
  "long": "一双圆口青布僧鞋，但看起来鞋底比一般僧鞋厚了许多，还有些针线缝补的痕迹。",
  "weight": 1000,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1,
   "dodge": 3
  }
 },
 "x/qujing/baoxiang/obj/changpao": {
  "name": "长袍",
  "ids": [
   "chang pao",
   "cloth"
  ],
  "unit": "件",
  "value": 300,
  "long": "一件长袍。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/baoxiang/obj/wandao#2": {
  "name": "月牙弯刀",
  "ids": [
   "yueya wan dao",
   "wan dao",
   "blade"
  ],
  "unit": "把",
  "value": 400,
  "long": "一把弯弯的战刀．",
  "weight": 2000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    25,
    0,
    0
   ]
  }
 },
 "x/qujing/baoxiang/obj/zhanpao": {
  "name": "战袍",
  "ids": [
   "zhan pao",
   "cloth"
  ],
  "unit": "件",
  "value": 600,
  "long": "一件战袍。",
  "weight": 4000,
  "wearAs": "cloth",
  "apply": {
   "armor": 3
  }
 },
 "x/qujing/baoxiang/obj/spqun": {
  "name": "兽皮裙",
  "ids": [
   "shoupi qun",
   "cloth"
  ],
  "unit": "条",
  "value": 300,
  "long": "一条兽皮裙。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/baoxiang/obj/sppifeng": {
  "name": "兽皮披风",
  "ids": [
   "shoupi pifeng",
   "pifeng",
   "cloth"
  ],
  "unit": "件",
  "value": 700,
  "long": "一件兽皮披风。",
  "weight": 4500,
  "wearAs": "surcoat",
  "apply": {
   "armor": 4
  }
 },
 "x/qujing/baoxiang/obj/gongpao": {
  "name": "宫袍",
  "ids": [
   "gong pao",
   "cloth"
  ],
  "unit": "件",
  "value": 300,
  "long": "一件宫袍。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/obj/cloth/mangpao": {
  "name": "大红蟒袍",
  "ids": [
   "mangpao",
   "cloth"
  ],
  "unit": "件",
  "value": 7000,
  "long": "一件大红色的长袍，上绣一条青龙，还有日月山河的图形．",
  "weight": 6000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/baoxiang/obj/xihu": {
  "name": "锡壶",
  "ids": [
   "xi hu",
   "xihu",
   "hu"
  ],
  "unit": "把",
  "value": 1000,
  "long": "一把细嘴锡壶．",
  "weight": 900,
  "water": 10,
  "liquid": "清水"
 },
 "x/qujing/baoxiang/obj/xiwan": {
  "name": "锡碗",
  "ids": [
   "xi wan",
   "xiwan",
   "wan"
  ],
  "unit": "只",
  "value": 800,
  "long": "一只镶边锡碗．",
  "weight": 900,
  "water": 5,
  "liquid": "清水"
 },
 "x/qujing/baoxiang/obj/xipen": {
  "name": "锡盆",
  "ids": [
   "xi pen",
   "xipen",
   "pen"
  ],
  "unit": "只",
  "value": 2000,
  "long": "一只印花大锡盆．",
  "weight": 1100
 },
 "x/qujing/baoxiang/obj/yangtou": {
  "name": "熏羊头",
  "ids": [
   "yang tou",
   "yangtou",
   "tou"
  ],
  "unit": "只",
  "value": 200,
  "long": "一只熏得红透了的羊头。",
  "weight": 1000,
  "foodStuff": 40,
  "bites": 5,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    1,
    0,
    0
   ]
  }
 },
 "x/qujing/baoxiang/obj/paomo": {
  "name": "羊肉泡馍",
  "ids": [
   "pao mo",
   "paomo"
  ],
  "unit": "碗",
  "value": 100,
  "long": "一碗热乎乎的羊肉泡馍。",
  "weight": 1000,
  "foodStuff": 50,
  "bites": 4
 },
 "x/qujing/baoxiang/obj/zasui": {
  "name": "羊肉杂碎",
  "ids": [
   "za sui",
   "zasui"
  ],
  "unit": "碗",
  "value": 100,
  "long": "一碗热乎乎的羊肉杂碎。",
  "weight": 1000,
  "foodStuff": 50,
  "bites": 4
 },
 "x/obj/cloth/skirt": {
  "name": "轻纱长裙",
  "ids": [
   "skirt",
   "cloth"
  ],
  "unit": "条",
  "value": 0,
  "long": "一条朦朦胧胧的纱裙，闻起来还有一股淡香。",
  "weight": 1000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "personality": 3
  }
 },
 "x/qujing/baoxiang/obj/mifan": {
  "name": "米饭",
  "ids": [
   "mi fan",
   "fan",
   "rice"
  ],
  "unit": "青砂罐",
  "value": 90,
  "long": "一青砂罐香米饭。",
  "weight": 100,
  "foodStuff": 35,
  "bites": 5
 },
 "x/qujing/baoxiang/obj/mianjin": {
  "name": "面筋",
  "ids": [
   "mian jin",
   "mian",
   "jin"
  ],
  "unit": "绿磁瓶",
  "value": 90,
  "long": "一绿磁瓶炒面筋。",
  "weight": 100,
  "foodStuff": 30,
  "bites": 4
 },
 "x/qujing/baoxiang/obj/cspitan": {
  "name": "彩色披毯",
  "ids": [
   "caise pitan",
   "caisepitan",
   "pitan"
  ],
  "unit": "件",
  "value": 400,
  "long": "一件彩色披毯。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/baoxiang/obj/bpitan": {
  "name": "白披毯",
  "ids": [
   "bai pitan",
   "baipitan",
   "pitan"
  ],
  "unit": "件",
  "value": 400,
  "long": "一件白色披毯。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/baoxiang/obj/yizi": {
  "name": "雕木斜靠椅",
  "ids": [
   "yi zi",
   "yizi",
   "seat"
  ],
  "unit": "把",
  "value": 900,
  "long": "一把雕木斜靠椅。",
  "weight": 7000
 },
 "x/qujing/baoxiang/obj/zhuozi": {
  "name": "镂空木桌",
  "ids": [
   "zhuo zi",
   "zhuozi",
   "table"
  ],
  "unit": "张",
  "value": 1200,
  "long": "一张镂空木桌。",
  "weight": 9000
 },
 "x/obj/book/daode": {
  "name": "〖道德经〗",
  "ids": [
   "daodejing",
   "book"
  ],
  "unit": "本",
  "value": 100,
  "long": "道家经典－－道德经",
  "weight": 1000
 },
 "x/qujing/chechi/obj/changpao": {
  "name": "长袍",
  "ids": [
   "chang pao",
   "cloth"
  ],
  "unit": "件",
  "value": 300,
  "long": "一件长袍。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/obj/cloth/daopao": {
  "name": "灰色道袍",
  "ids": [
   "dao pao",
   "pao",
   "cloth"
  ],
  "unit": "件",
  "long": "一件普普通通的灰布道袍。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/qujing/chechi/obj/gongpao": {
  "name": "宫袍",
  "ids": [
   "gong pao",
   "pao"
  ],
  "unit": "件",
  "value": 1000,
  "long": "一件长袍．",
  "weight": 2700,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "dodge": 10
  }
 },
 "x/qujing/chechi/obj/gongqun": {
  "name": "宫裙",
  "ids": [
   "gong qun",
   "skirt"
  ],
  "unit": "袭",
  "value": 1000,
  "long": "一袭长长宫裙．",
  "weight": 2700,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "dodge": 10
  }
 },
 "x/qujing/chechi/obj/dao": {
  "name": "斩头刀",
  "ids": [
   "zhantou dao",
   "dao",
   "blade"
  ],
  "unit": "柄",
  "value": 500,
  "long": "这是一柄大头厚刃的斩头刀。",
  "weight": 4000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    35,
    0,
    0
   ]
  }
 },
 "x/qujing/chechi/obj/chantai": {
  "name": "云禅台",
  "ids": [
   "yun chantai",
   "chantai"
  ],
  "unit": "只",
  "value": 50000,
  "long": "一座由五十张桌子级级垒成的禅台，高耸入云。",
  "weight": 6000000
 },
 "x/qujing/chechi/obj/roujia": {
  "name": "肉夹馍",
  "ids": [
   "roujia mo",
   "roujiamo",
   "mo"
  ],
  "unit": "只",
  "value": 200,
  "long": "一只热乎乎的肉夹馍。",
  "weight": 1000,
  "foodStuff": 35,
  "bites": 6
 },
 "x/qujing/chechi/obj/niurou": {
  "name": "酱牛肉",
  "ids": [
   "jiang niurou",
   "jiangniurou",
   "niurou"
  ],
  "unit": "大盘",
  "value": 250,
  "long": "一大盘切得薄薄的酱牛肉片。",
  "weight": 1000,
  "foodStuff": 50,
  "bites": 6
 },
 "x/qujing/chechi/obj/baiye": {
  "name": "牛百叶",
  "ids": [
   "niu baiye",
   "niubaiye",
   "baiye"
  ],
  "unit": "大盘",
  "value": 240,
  "long": "一大盘淋着辣油的牛百叶丝。",
  "weight": 1000,
  "foodStuff": 30,
  "bites": 5
 },
 "x/qujing/chechi/obj/jiuhu": {
  "name": "酒壶",
  "ids": [
   "jiuhu",
   "hu"
  ],
  "unit": "个",
  "value": 250,
  "long": "一个装有白烧酒的酒壶。",
  "weight": 100,
  "water": 12,
  "liquid": "白烧酒"
 },
 "x/obj/cloth/shoupiqun": {
  "name": "兽皮裙",
  "ids": [
   "shoupi qun",
   "cloth"
  ],
  "unit": "条",
  "value": 300,
  "long": "一条兽皮裙。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/chechi/obj/youguo": {
  "name": "大油锅",
  "ids": [
   "da youguo",
   "youguo"
  ],
  "unit": "口",
  "value": 50000,
  "long": "一口巨大的油锅，里面热油滚滚。",
  "weight": 6000000
 },
 "x/qujing/chechi/obj/zhengsu": {
  "name": "蒸酥",
  "ids": [
   "zheng su",
   "su"
  ],
  "unit": "块",
  "value": 140,
  "long": "一块供给三清的新鲜蒸酥。",
  "weight": 1500
 },
 "x/qujing/chechi/obj/guizi": {
  "name": "朱红柜子",
  "ids": [
   "zhuhong guizi",
   "guizi"
  ],
  "unit": "箱",
  "value": 50000,
  "long": "一箱朱红漆嵌玉金锁大柜子。",
  "weight": 6000000
 },
 "x/qujing/chechi/obj/yujin": {
  "name": "浴巾",
  "ids": [
   "yu jin",
   "yujin",
   "jin"
  ],
  "unit": "条",
  "value": 110,
  "long": "一条长长的粗布宽浴巾。",
  "weight": 3000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/qujing/chechi/obj/guo": {
  "name": "小供果",
  "ids": [
   "gong guo",
   "gong",
   "guo"
  ],
  "unit": "只",
  "value": 20,
  "long": "一只小供果。",
  "weight": 400,
  "foodStuff": 5,
  "bites": 3
 },
 "x/qujing/chechi/obj/gongguo": {
  "name": "供果",
  "ids": [
   "gong guo",
   "gong",
   "guo"
  ],
  "unit": "小竹蓝子",
  "value": 340,
  "long": "一小竹蓝子香客送来的供果。",
  "weight": 2400,
  "foodStuff": 20,
  "bites": 10
 },
 "x/qujing/chechi/obj/rice": {
  "name": "糙米饭",
  "ids": [
   "caomi fan",
   "rice",
   "fan"
  ],
  "unit": "碗",
  "value": 40,
  "long": "一碗煮得干干的糙米饭。",
  "weight": 1000,
  "foodStuff": 20,
  "bites": 3
 },
 "x/qujing/chechi/obj/kang": {
  "name": "菜糠团子",
  "ids": [
   "caikang tuanzi",
   "caikang",
   "tuanzi"
  ],
  "unit": "只",
  "value": 40,
  "long": "一只充饥用的菜糠团子。",
  "weight": 1000,
  "foodStuff": 20,
  "bites": 3
 },
 "x/qujing/pingding/obj/armor#1": {
  "name": "白铜甲",
  "ids": [
   "armor",
   "jia"
  ],
  "unit": "件",
  "value": 200,
  "weight": 20000,
  "wearAs": "armor",
  "apply": {
   "armor": 2,
   "dodge": -5
  }
 },
 "x/qujing/pingding/obj/armor#2": {
  "name": "灰铁甲",
  "ids": [
   "armor",
   "jia"
  ],
  "unit": "件",
  "value": 200,
  "weight": 20000,
  "wearAs": "armor",
  "apply": {
   "armor": 2,
   "dodge": -5
  }
 },
 "x/obj/cloth/shoupipifeng": {
  "name": "兽皮披风",
  "ids": [
   "shoupi pifeng",
   "pifeng",
   "cloth"
  ],
  "unit": "件",
  "value": 700,
  "long": "一件兽皮披风。",
  "weight": 4500,
  "wearAs": "surcoat",
  "apply": {
   "armor": 4
  }
 },
 "x/qujing/pingding/obj/pingfake": {
  "name": "羊脂玉净瓶",
  "ids": [
   "jing ping",
   "jing",
   "ping",
   "fabao"
  ],
  "unit": "只",
  "value": 100000,
  "long": "一只几乎透明的羊脂玉净瓶。",
  "weight": 5000
 },
 "x/qujing/pingding/obj/pingreal": {
  "name": "羊脂玉净瓶",
  "ids": [
   "jing ping",
   "jing",
   "ping",
   "fabao"
  ],
  "unit": "只",
  "value": 100000,
  "long": "一只几乎透明的羊脂玉净瓶。",
  "weight": 5000
 },
 "x/qujing/pingding/obj/hulufake": {
  "name": "紫金红葫芦",
  "ids": [
   "hu lu",
   "hu",
   "lu",
   "fabao"
  ],
  "unit": "只",
  "value": 100000,
  "long": "一只红里透紫的金葫芦。",
  "weight": 5000
 },
 "x/qujing/pingding/obj/hulureal": {
  "name": "紫金红葫芦",
  "ids": [
   "hu lu",
   "hu",
   "lu",
   "fabao"
  ],
  "unit": "只",
  "value": 100000,
  "long": "一只红里透紫的金葫芦。",
  "weight": 5000
 },
 "x/qujing/pingding/obj/food#0": {
  "name": "油焖山笋尖",
  "ids": [
   "food"
  ],
  "unit": "些",
  "value": 120,
  "weight": 1000,
  "foodStuff": 35,
  "bites": 6
 },
 "x/qujing/pingding/obj/food#1": {
  "name": "清烧地龙衣",
  "ids": [
   "food"
  ],
  "unit": "些",
  "value": 120,
  "weight": 1000,
  "foodStuff": 35,
  "bites": 6
 },
 "x/qujing/pingding/obj/food#2": {
  "name": "炖汤蘑菇",
  "ids": [
   "food"
  ],
  "unit": "些",
  "value": 120,
  "weight": 1000,
  "foodStuff": 35,
  "bites": 6
 },
 "x/qujing/pingding/obj/shengfake": {
  "name": "幌金绳",
  "ids": [
   "huangjin sheng",
   "sheng",
   "fabao"
  ],
  "unit": "根",
  "value": 100000,
  "long": "一根可长可短的幌金绳。",
  "weight": 5000
 },
 "x/qujing/pingding/obj/shengreal": {
  "name": "幌金绳",
  "ids": [
   "huangjin sheng",
   "sheng",
   "fabao"
  ],
  "unit": "根",
  "value": 100000,
  "long": "一根可长可短的幌金绳。",
  "weight": 5000
 },
 "x/qujing/pingding/obj/shoupi": {
  "name": "兽皮",
  "ids": [
   "shou pi",
   "pi"
  ],
  "unit": "件",
  "value": 600,
  "long": "一件硝好的花兽皮。",
  "weight": 7000
 },
 "x/obj/cloth/changpao": {
  "name": "长袍",
  "ids": [
   "changpao"
  ],
  "unit": "件",
  "value": 200,
  "long": "一件青色长袍，象是有学问的人穿的．",
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 1
  }
 },
 "x/qujing/tongtian/obj/zhengxie": {
  "name": "蒸螃蟹",
  "ids": [
   "zheng pangxie",
   "zhengpangxie",
   "pangxie",
   "crab"
  ],
  "unit": "只",
  "value": 650,
  "long": "一只蒸得通红的大河蟹。",
  "weight": 1000,
  "foodStuff": 50,
  "bites": 9
 },
 "x/qujing/tongtian/obj/shaoxia": {
  "name": "烧龙虾",
  "ids": [
   "shao longxia",
   "shaolongxia",
   "longxia",
   "lobster"
  ],
  "unit": "只",
  "value": 750,
  "long": "一只烧得通红的大龙虾。",
  "weight": 1000,
  "foodStuff": 45,
  "bites": 8
 },
 "x/qujing/tongtian/obj/xunyu": {
  "name": "熏鱼",
  "ids": [
   "xun yu",
   "xunyu",
   "yu",
   "fish"
  ],
  "unit": "条",
  "value": 250,
  "long": "一条两面熏得酥香金黄的鱼。",
  "weight": 1000,
  "foodStuff": 40,
  "bites": 5
 },
 "x/qujing/tongtian/obj/zuiluo": {
  "name": "醉泥螺",
  "ids": [
   "zui niluo",
   "zuiniluo",
   "zuiluo",
   "luo"
  ],
  "unit": "包",
  "value": 125,
  "long": "一包醉泥螺，用荷叶包着。",
  "weight": 100,
  "foodStuff": 2,
  "bites": 15
 },
 "x/qujing/tongtian/obj/armor#0": {
  "name": "乌龟甲",
  "ids": [
   "wugui jia",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 300,
  "weight": 20000,
  "wearAs": "armor",
  "apply": {
   "armor": 2,
   "dodge": -5
  }
 },
 "x/qujing/tongtian/obj/armor#1": {
  "name": "王八甲",
  "ids": [
   "wangba jia",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 300,
  "weight": 20000,
  "wearAs": "armor",
  "apply": {
   "armor": 2,
   "dodge": -5
  }
 },
 "x/qujing/tongtian/obj/armor#2": {
  "name": "千鳞甲",
  "ids": [
   "qianling jia",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 300,
  "weight": 20000,
  "wearAs": "armor",
  "apply": {
   "armor": 2,
   "dodge": -5
  }
 },
 "x/qujing/tongtian/obj/armor#3": {
  "name": "巨蟹壳",
  "ids": [
   "juxie ke",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 300,
  "weight": 20000,
  "wearAs": "armor",
  "apply": {
   "armor": 2,
   "dodge": -5
  }
 },
 "x/obj/armor/jinjia": {
  "name": "金环锁子甲",
  "ids": [
   "golden armor",
   "jinjia",
   "jia",
   "armor"
  ],
  "unit": "件",
  "value": 20000,
  "long": "一件金线织就的宝甲．",
  "weight": 30000,
  "wearAs": "armor",
  "apply": {
   "armor": 6,
   "dodge": -5
  }
 },
 "x/obj/weapon/hammer/bahammer": {
  "name": "八宝铜锤",
  "ids": [
   "hammer"
  ],
  "unit": "把",
  "value": 1200,
  "long": "这是一把沉重的铜锤，打造的相当坚实。没有千斤力气是拿不起的。",
  "weight": 10000,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    35,
    0,
    0
   ]
  }
 },
 "x/obj/food/grape": {
  "name": "水晶葡萄",
  "ids": [
   "pu tao",
   "grape",
   "putao"
  ],
  "unit": "把",
  "value": 80,
  "long": "水灵灵的葡萄象一颗颗紫色的水晶球。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/food/xueli": {
  "name": "雪梨",
  "ids": [
   "xue li",
   "xueli",
   "li"
  ],
  "unit": "颗",
  "value": 80,
  "long": "这种雪梨只生长于雪山极寒之地。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/food/strawberry": {
  "name": "草莓",
  "ids": [
   "cao mei",
   "strawberry",
   "caomei"
  ],
  "unit": "把",
  "value": 120,
  "long": "鲜红的草莓。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/food/apple": {
  "name": "苹果",
  "ids": [
   "ping guo",
   "apple",
   "pingguo"
  ],
  "unit": "颗",
  "value": 50,
  "long": "又大又脆的青苹果。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/food/mellon": {
  "name": "哈密瓜",
  "ids": [
   "hami gua",
   "mellon",
   "gua"
  ],
  "unit": "颗",
  "value": 100,
  "long": "又香又甜的哈密瓜。�n",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/weapon/blade/jindao": {
  "name": "金刀",
  "ids": [
   "jin dao",
   "dao"
  ],
  "unit": "把",
  "value": 2500,
  "long": "一把金光闪闪的圆头长刀，刀把上镶嵌有白玉。",
  "weight": 8000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    50,
    0,
    0
   ]
  }
 },
 "x/obj/cloth/gongpao": {
  "name": "宫袍",
  "ids": [
   "gong pao",
   "pao",
   "cloth"
  ],
  "unit": "件",
  "value": 1000,
  "long": "一件长袍．",
  "weight": 2700,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "dodge": 10
  }
 },
 "x/obj/cloth/gongqun": {
  "name": "宫裙",
  "ids": [
   "gong qun",
   "skirt"
  ],
  "unit": "袭",
  "value": 1000,
  "long": "一袭长长宫裙．",
  "weight": 2700,
  "wearAs": "cloth",
  "apply": {
   "armor": 1,
   "dodge": 10
  }
 },
 "x/obj/cloth/longpao": {
  "name": "蟒龙袍",
  "ids": [
   "long pao",
   "cloth",
   "longpao",
   "pao"
  ],
  "unit": "件",
  "value": 15000,
  "long": "这是一件华贵无比的蟒龙袍。你不由得想穿上它过过皇帝瘾。",
  "weight": 2000,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/obj/food/dbc": {
  "name": "大白菜",
  "ids": [
   "dbc",
   "dabaicai"
  ],
  "unit": "颗",
  "value": 80,
  "long": "一颗新鲜可人的大白菜。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/food/xbc": {
  "name": "小白菜",
  "ids": [
   "xbc",
   "xiaobaicai"
  ],
  "unit": "颗",
  "value": 80,
  "long": "一颗新鲜可人的小白菜。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/weapon/sword/ruler": {
  "name": "戒尺",
  "ids": [
   "ruler"
  ],
  "unit": "把",
  "value": 80,
  "long": "一把黑黝黝的戒尺．",
  "weight": 700,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    10,
    0,
    0
   ]
  }
 },
 "x/obj/food/xiangcha": {
  "name": "楠木茶盅",
  "ids": [
   "cha zhong",
   "chazhong",
   "cha",
   "teapot",
   "tea"
  ],
  "unit": "只",
  "long": "一只楠木茶盅。",
  "weight": 50,
  "water": 2,
  "liquid": "云雾山香茶"
 },
 "x/obj/food/chahu": {
  "name": "大茶壶",
  "ids": [
   "teapot"
  ],
  "unit": "个",
  "value": 50,
  "long": "一个大茶壶。",
  "weight": 2000,
  "water": 7,
  "liquid": "西湖龙井茶",
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    1,
    0,
    0
   ]
  }
 },
 "x/obj/cloth/lancaoxie": {
  "name": "烂草鞋",
  "ids": [
   "lan caoxie",
   "caoxie",
   "shoes"
  ],
  "unit": "双",
  "weight": 800,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/staff/tieguai": {
  "name": "铁拐",
  "ids": [
   "tie guai",
   "tieguai",
   "guai"
  ],
  "unit": "根",
  "value": 1000,
  "long": "一条铁拐，看起来黑黝黝的，分量肯定不轻。",
  "weight": 8000,
  "wieldAs": "staff",
  "weapon": {
   "staff": [
    1,
    20,
    0,
    0
   ]
  }
 },
 "x/obj/food/dhg": {
  "name": "大黄瓜",
  "ids": [
   "dhg",
   "dahuanggua"
  ],
  "unit": "条",
  "value": 80,
  "long": "一条新鲜嫩绿的大黄瓜。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/food/hulu": {
  "name": "葫芦",
  "ids": [
   "hulu",
   "hu"
  ],
  "unit": "个",
  "value": 100,
  "long": "一个用葫芦制成的水壶。",
  "weight": 700,
  "water": 10,
  "liquid": "清水"
 },
 "x/obj/food/carrot": {
  "name": "胡萝卜",
  "ids": [
   "carrot",
   "huluobo"
  ],
  "unit": "颗",
  "value": 80,
  "long": "一颗新鲜可人的胡萝卜。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/misc/table": {
  "name": "石桌",
  "ids": [
   "table"
  ],
  "unit": "张",
  "value": 2000,
  "noGet": 1,
  "long": "这是张大理石制的桌子。",
  "weight": 200000
 },
 "x/obj/weapon/blade/bajiaoshan": {
  "name": "芭蕉扇",
  "ids": [
   "baojiao shan",
   "shan"
  ],
  "unit": "把",
  "value": 200,
  "long": "一把芭蕉做成的扇子。",
  "weight": 1000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    10,
    0,
    0
   ]
  }
 },
 "x/obj/cloth/shoes": {
  "name": "绣花小鞋",
  "ids": [
   "shoes"
  ],
  "unit": "双",
  "long": "一双小巧精致的绣花鞋。",
  "weight": 900,
  "wearAs": "feet_eq",
  "apply": {
   "armor": 1
  }
 },
 "x/obj/weapon/sword/snow_sword": {
  "name": "风回雪舞剑",
  "ids": [
   "snowsword",
   "xue jian",
   "sword"
  ],
  "unit": "把",
  "value": 700,
  "long": "这是一把用来练舞的剑，剑身细长，轻巧尤锋利。",
  "weight": 400,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    40,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/blade/yanblade": {
  "name": "雁云刀",
  "ids": [
   "yanyun blade",
   "blade"
  ],
  "unit": "把",
  "value": 1500,
  "long": "一把白灿灿的挽手胡刀，发着阴渗渗的杀气．",
  "weight": 8000,
  "wieldAs": "blade",
  "weapon": {
   "blade": [
    1,
    40,
    0,
    0
   ]
  }
 },
 "x/obj/food/watermellon": {
  "name": "西瓜",
  "ids": [
   "watermellon",
   "xigua"
  ],
  "unit": "颗",
  "value": 80,
  "long": "一颗新鲜的西瓜。",
  "weight": 40,
  "foodStuff": 30,
  "bites": 4
 },
 "x/obj/weapon/sword/yudi": {
  "name": "碧玉笛",
  "ids": [
   "biyu di",
   "yudi",
   "biyudi",
   "di"
  ],
  "unit": "根",
  "value": 20000,
  "long": "一根碧玉制就的笛子，绿莹莹地甚是精致。",
  "weight": 1000,
  "wieldAs": "sword",
  "weapon": {
   "sword": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/obj/weapon/hammer/baiyuban": {
  "name": "白玉板",
  "ids": [
   "baiyu ban",
   "baiyuban",
   "yuban",
   "ban"
  ],
  "unit": "块",
  "value": 10000,
  "long": "一块白玉制就的板子，沉甸甸地甚是压手。",
  "weight": 1000,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    15,
    0,
    0
   ]
  }
 },
 "x/obj/food/roubing": {
  "name": "羊肉饼",
  "ids": [
   "roubing",
   "yang",
   "bing"
  ],
  "unit": "块",
  "value": 60,
  "long": "一块烤得很香的羊肉肉饼。",
  "weight": 120,
  "foodStuff": 120,
  "bites": 3
 },
 "x/obj/food/egg": {
  "name": "水煮蛋",
  "ids": [
   "egg",
   "dan"
  ],
  "unit": "只",
  "value": 50,
  "long": "一只煮熟的鸡蛋。",
  "weight": 60,
  "foodStuff": 60,
  "bites": 1
 },
 "x/obj/food/jiunang": {
  "name": "羊皮大酒囊",
  "ids": [
   "jiunang",
   "wineskin",
   "skin"
  ],
  "unit": "个",
  "value": 100,
  "long": "一个用来装羊奶酒的大酒囊，大概装得十来升的酒。",
  "weight": 800,
  "water": 20,
  "liquid": "羊奶酒"
 },
 "x/westway/obj/tielong": {
  "name": "破铁笼",
  "ids": [
   "tie long",
   "long"
  ],
  "unit": "把",
  "value": 2000,
  "noGet": 1,
  "long": "一个破铁笼。",
  "weight": 2800000
 },
 "x/qujing/wuzhuang/obj/huangtong-key": {
  "name": "黄铜钥匙",
  "ids": [
   "huangtong key",
   "key"
  ],
  "unit": "把",
  "long": "一把黄铜钥匙。",
  "weight": 100
 },
 "x/obj/drug/renshen-guo": {
  "name": "人参果",
  "ids": [
   "renshen guo",
   "renshenguo",
   "guo"
  ],
  "unit": "枚",
  "value": 500000,
  "long": "白白胖胖的一枚人参果。三千年一开花，三千年一结果，再三千年才得熟，实是天地间的灵宝。",
  "weight": 100
 },
 "x/qujing/baoxiang/obj/letter": {
  "name": "秘信",
  "ids": [
   "mi xin",
   "letter"
  ],
  "unit": "封",
  "long": "一封秘信，上书“平安”二字．",
  "weight": 100
 },
 "x/qujing/baoxiang/obj/ling": {
  "name": "军令牌",
  "ids": [
   "junling pai",
   "pai"
  ],
  "unit": "支",
  "value": 200000,
  "noGet": 1,
  "long": "／＼｜    ｜｜ 军 ｜｜    ｜｜ 令 ｜｜    ｜｜ 牌 ｜｜    ｜｜    ｜－－－",
  "weight": 1100
 },
 "x/qujing/baoxiang/obj/zhuzhang": {
  "name": "竹杖",
  "ids": [
   "zhu zhang",
   "zhang",
   "staff"
  ],
  "unit": "根",
  "value": 100,
  "long": "一根长长的竹杖。",
  "weight": 800,
  "wieldAs": "staff",
  "weapon": {
   "staff": [
    1,
    10,
    0,
    0
   ]
  }
 },
 "x/qujing/baoxiang/obj/longtou": {
  "name": "龙头拐",
  "ids": [
   "long tou guai",
   "long tou",
   "guai",
   "staff"
  ],
  "unit": "根",
  "value": 100,
  "long": "一根长长的龙头拐杖。",
  "weight": 800,
  "wieldAs": "staff",
  "weapon": {
   "staff": [
    1,
    10,
    0,
    0
   ]
  }
 },
 "x/obj/magic/bishuizhou": {
  "name": "避水咒",
  "ids": [
   "bishui zhou",
   "zhou"
  ],
  "unit": "张",
  "long": "一张小纸片。上面写着“避水咒”三个字，不知道有什么用没有。",
  "weight": 100
 },
 "x/qujing/wuji/obj/jade": {
  "name": "金厢白玉圭",
  "ids": [
   "yu gui",
   "yu",
   "jade"
  ],
  "unit": "柄",
  "value": 100000,
  "long": "一柄金厢白玉圭，乃乌鸡国之国宝。",
  "weight": 100
 },
 "x/qujing/wuji/obj/jing": {
  "name": "乌鸡精",
  "ids": [
   "wuji jing",
   "jing"
  ],
  "unit": "小瓶",
  "long": "一小瓶乌鸡精，据说服用(drink)可以提神，施用他人(apply)可以还魂。",
  "weight": 100
 },
 "x/qujing/wuji/obj/kingbody": {
  "name": "国王遗体",
  "ids": [
   "guo wang",
   "wang",
   "king"
  ],
  "unit": "具",
  "long": "国王的遗体，容貌依旧，似生时未改分毫。",
  "weight": 175000
 },
 "x/qujing/chechi/obj/yuanshi": {
  "name": "元始天尊",
  "ids": [
   "yuanshi tianzun",
   "yuanshi",
   "tianzun"
  ],
  "unit": "尊",
  "value": 10000,
  "noGet": "这圣象如此之重，不用力去搬恐怕分寸难移也。",
  "long": "一尊丈许高的元始天尊的泥塑圣象，在殿台上正颜端坐。",
  "weight": 75000
 },
 "x/qujing/chechi/obj/lingbao": {
  "name": "灵宝道君",
  "ids": [
   "lingbao daojun",
   "lingbao",
   "daojun"
  ],
  "unit": "尊",
  "value": 10000,
  "noGet": "这圣象如此之重，不用力去搬恐怕分寸难移也。",
  "long": "一尊丈许高的灵宝道君的泥塑圣象，在殿台上正颜端坐。",
  "weight": 75000
 },
 "x/qujing/chechi/obj/taishang": {
  "name": "太上老君",
  "ids": [
   "taishang laojun",
   "taishang",
   "laojun"
  ],
  "unit": "尊",
  "value": 10000,
  "noGet": "这圣象如此之重，不用力去搬恐怕分寸难移也。",
  "long": "一尊丈许高的太上老君的泥塑圣象，在殿台上正颜端坐。",
  "weight": 75000
 },
 "x/qujing/chechi/obj/hupi": {
  "name": "黄虎皮",
  "ids": [
   "huang hupi",
   "hupi"
  ],
  "unit": "张",
  "value": 1000,
  "long": "一张黄色虎皮。",
  "weight": 4500,
  "wearAs": "cloth",
  "apply": {
   "armor": 2
  }
 },
 "x/qujing/chechi/obj/lutou": {
  "name": "白鹿头",
  "ids": [
   "bai lutou",
   "lutou"
  ],
  "unit": "只",
  "value": 1000,
  "long": "一只白色鹿头。",
  "weight": 1000,
  "foodStuff": 40,
  "bites": 6,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    1,
    0,
    0
   ]
  }
 },
 "x/qujing/chechi/obj/yangjiao": {
  "name": "灰羊角",
  "ids": [
   "hui yangjiao",
   "yangjiao"
  ],
  "unit": "根",
  "value": 1000,
  "long": "一根灰色羊角。",
  "weight": 1000,
  "wieldAs": "hammer",
  "weapon": {
   "hammer": [
    1,
    1,
    0,
    0
   ]
  }
 },
 "x/obj/misc/bone": {
  "name": "兽骨",
  "ids": [
   "bone"
  ],
  "unit": "副",
  "long": "这是一副正在风化的兽骨。",
  "weight": 8000
 }
}
