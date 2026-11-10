# Changelog

## 0.7.0

The road west goes on to its fourth, fifth and sixth obstacles, as XYJ tells them, and stops at 通天河. 乌鸡国: the
ghost king of the 宝林寺's west room by night, his 金厢白玉圭 shown to the queen and the prince, the 芭蕉 felled down
to the 水晶宫, 井龙王 raised, the king revived with the 乌鸡精 and led back past the guards to beat 青毛狮子. 车迟国:
the 三清 statues thrown out and their offerings eaten in their shape, the three 大仙, the king's judgement, the three
contests before the 监斩官 (the 禅台, the cabinet, the 油锅). 通天河: 袁守诚's 无字天书 for a 桂花酒袋, its 避水咒,
the ice that gives way under a 小童, and 金鳞怪 at the bottom. 变化 (「变 <谁>」) is XYJ's, its gates scaled as the
road's are; XYJ's timed events are kept in the world file, so they run on while nobody plays. The monsters' numbers
are set so that one past 平顶山 with a teammate gets through. Carrying is now XYJ's (膂力 × 5000 and 扑击 × 200), and
a command this game knows but that has nothing to act on here answers XYJ's 「什么？」.
取经路往西推到通天河：新增乌鸡国、车迟国、通天河三难，剧情照原版；新增「变」（变化）；定时的事件存进存档，没人在线也照常发生。

## 0.6.1

The first world is gone: 西游记 is the whole game. A new world is 长安 and the road west only, a newcomer arrives at
长安's inn, a ghost comes back to life in 长安's 城隍庙, the status is XYJ's (气血, 精神, 内力, 法力, 道行) for the
page and the agents alike, and money changes at 长安's 钱庄. Its commands and the old body kept beside XYJ's are gone
with it. The world file is now `西游.jianghu.json`, the App's own name: before, an agent that installed the App into
a chat with data named after the App made a second file beside the old `文字江湖.jianghu.json`, and a window that
opened that one played a world of its own. Old worlds are not carried over: a chat starts a new world, and the old
file stays in the chat folder untouched.
只剩《西游记》：新世界只有长安和取经路，鬼魂去长安城隍庙还阳，状态一律是气血、精神、内力、法力、道行；存档改名为 `西游.jianghu.json`，agent 装进群时不会再另开一份存档；旧存档不迁移，群里重新开始。

## 0.6.0

A pixel look, drawn by hand (nothing taken from any game's files). The status is a HUD over the controls: ten hearts
for 气血 and ten bolts for 精神 on the left, ten drumsticks for food and ten drops for water from the right, in halves;
内力 and 法力 (雪亭镇's 精 and 体) as thin bars once begun. Buttons are square blocks with a bevel; titles, buttons and
the HUD are set in 精品点阵体 9×9 (OFL, `px-OFL.txt`), cut to the page's own words, the world's names and GB2312's
first level; the story keeps its book face. The compass is a fixed three by three around 看, the ways with no exit
disabled; 上, 下, 进去 and 出去 are typed. A new character opens on one title screen (西游 over 长安 at dusk, two lines,
「入长安」 or a tap anywhere), then stands in 长安. A new icon, the 金箍棒 across a 筋斗云. 「N 人同行」 in the header.
像素风界面：红心、闪电、鸡腿、水滴各十格显示气血、精神、食物和水，内力法力是细条；方块按钮，标题按钮用像素字体，故事保留书宋；方向键固定九格，走不通的灰掉，上下进出靠打字；新角色一屏开场后落在长安；新图标。

## 0.5.0

The road west goes on to its second and third obstacles, as XYJ tells them: 宝象国 (白骨精's three shapes on the 野路,
the slab of the 金塔 broken with 内力 and 法力, 黄袍怪 and his 山妖, 百花羞's letter over a pontoon bridge that comes and
goes, the king's 军令牌, the princess led home) and 平顶山 (金角, 银角, 狐阿七大王 and 老奶奶, whose gourd, vase and rope
take a fighter out for half a minute). The monsters' numbers are set to this game's fights, so that one back from
五庄观 beats 宝象国 best with a friend, and a newcomer will do as that friend; 平顶山 wants two. A deed counts for the
whole team in the room. A newcomer now starts in 长安 (雪亭镇 is a 「东归」 away), and the 「下一步」 line and the
newcomer's card are gone. The status bars name an icon each. Checked against the original mudlib run side by side,
more of XYJ's rules are in: the 腥风 of 碗子山 and the 野渡, the robes of its mire, the cage under the 石栈, 黄袍怪
turning on his wife, noon drawing off 法力, the inn's room for paying guests, the 衙役 and the 马盗 of 饮马峪 (money
or your life), 「进去」 into 五庄观's main hall, 镇元大仙's sleeve taking up who accepted, the pond forgetting the
bridges, the orchard gate that cannot be shut, and XYJ's food and water limits. See `SOURCE.md`.
西行路第二、三关：宝象国（白骨精三变、撞开金塔石板、黄袍怪、百花羞的信、浮桥、军令牌、领公主回宫）和平顶山（金角、银角、狐阿七、老奶奶和他们的法宝），剧情照原版；数值按本游戏重标，过了五庄观的人带一个新人组队就能过宝象国；功劳全队一起算。新角色直接出生在长安，「下一步」和新手卡去掉。

## 0.4.0

A second world beside 雪亭镇, which stays the place to begin: 西游记 4.5's 长安城, the road west and 五庄观 (141
rooms, 87 people), with XYJ's 气血, 精神, 内力, 法力, 道行, 潜能 and masters, and the first obstacle of the road west,
五庄观's 人参果: the key under 牡丹亭, the 八卦桥, the orchard gate and 镇元大仙's meeting. 「西游」 goes there,
「东归」 comes back. Played through, then made to keep moving: the meeting gives its fruit after a minute (XYJ: six),
「睡觉」 in an inn's bedroom restores 精神 at once, the masters no longer wander off mid-lesson, a board at the 八卦桥
tells its rule and each bridge says how many are crossed, 「去 <地点>」 walks to a place in one go (never over the
八卦桥 or through a shut door), and 镇元大仙 stays to send whoever ate a fruit back to 长安 (「回去」). The status bars
and the 「下一步」 line follow the world one is in. See `SOURCE.md`.
第二个世界：《西游记》4.5 的长安、西行路和五庄观，人参果一关可以玩通；雪亭镇留作新手村。品尝大会一分钟、睡觉回精神、师父不乱走、八卦桥有木牌说明规矩、「去 <地点>」一次走到（不代走八卦桥）；状态条和「下一步」随世界变。

## 0.3.0

A new screen. On a phone: the room and the time of day on top, the six stats (精气神, body, food, water) as one row
of small bars, the story in a book face, who and what is here as buttons, and at the bottom a small compass, the
everyday commands and the line to type. On a wide window the compass, who and what is here (each with what one can
do with them) and the people of the town sit in a column on the right. A newcomer gets a card on how to play and a
「下一步」 line that walks them through earning their first wages and their first meal (and nothing further). The room's
name is no longer repeated in the story, and townspeople show without their English ids.
新界面：手机单列加罗盘，桌面右侧栏；精气神等六项常驻小条；出口做成方向键；新手引导卡和「下一步」提示（只带入门：打工、领工钱、吃饭）；日志用书宋体。

## 0.2.1

The world file no longer grows with each sale: what is paid at a shop leaves the world, and coins given to townspeople
are gathered at the town reset. A heap not on you (on the ground, in a box) is taken whole, and a thief steals a whole
heap of money, so two people taking from one heap at once no longer make money. Worlds carry on.
买东西付的钱不再堆在掌柜身上让世界文件越来越大；地上、容器里的一堆东西只能整堆拿，偷钱也是整堆偷，两人同时拿不会再多出钱来。

## 0.2.0

The whole of ES2's 雪亭镇 (43 rooms, 24 townspeople, their things, chat and stories) with ES2's rules: stats,
skills and learning, combat (spar and kill), death and ghosts, money and shops, the game clock. The invented errand
is gone. Teams. Sources and the changes to ES2 are in `SOURCE.md`. A 0.1.0 world file starts over.
整座雪亭镇和《东方故事2》的规矩；去掉了自编的送酒差事；可以组队；旧版的小镇会从头开始。

## 0.1.0

First version: eight rooms of 雪亭镇 (from ES2, MIT), seven townspeople and the errand 「给李先生送酒」; people play
in the page, agents with `look` / `act` by the same text commands.
