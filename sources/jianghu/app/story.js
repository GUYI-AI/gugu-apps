// What 雪亭镇's people and rooms do beyond the general rules: each hook is the LPC of the file it names, in d/snow/,
// carried over line by line where it can be (see SOURCE.md). The stories in them are ES2's own:
// - 阿宝 is hungry up in the banyan; fed, she gives a comb that is 瞎眼老太婆's, and the old woman makes a thief of
//   whoever brings it back and calls her 「祖奶奶」 (npc/child.c, npc/gammer.c).
// - In the ruined mansion's weeds, at noon, lies a hairpin; the woman in white who lives behind the fallen beams
//   kills intruders but gives a 英雄帖 for it, and the 英雄帖 is what the men at the bridge to 雪吟山庄 ask for
//   (ruin1.c, npc/girl.c, npc/guard.c).
// - The warehouse pays 25 coins a crate loaded on the wagon (store.c, npc/foreman.c, npc/obj/wagon.c).
// - 王怀芝 teaches 三字经 to whoever sits in his school, and makes a scholar of a promising pupil (npc/teacher.c).
// - 陈维侠 takes an apprentice into the 龙图丹派 (npc/alchemist.c).
// - 鱼天 sells a hand-drawn map of the town for whatever you give him (npc/yu.c).
import {
  HOOKS, ROOMS, ch, isNpc, npcData, awake, nameOf, who, thingName, itemOf, attr, skillLv, playersIn, npcsIn,
  thingsAt, makeThing, moveThing, destroy, vision, tell, npcSay, emote, consume, spawnNpc,
} from './world.js'
import { EMOTES, gameTime, cn } from './text.js'
import { brawl, improve, flee } from './fight.js'
import { move, setDoor } from './game.js'

const N = HOOKS.npc
const R = HOOKS.room
const pick = (x, list) => list[Math.floor(x.rand() * list.length)]
const flags = (x, id) => (ch(x.w, id).flags ??= {})
const temp = (x, id) => (x.w.players[id].temp ??= {})
const here = (x, id) => x.w.players[x.me]?.room === ch(x.w, id)?.room
const said = (x, id, text) => npcSay(x, id, text)
const line = (x, id, text) => vision(x, ch(x.w, id).room, text, id)
const meRoom = (x) => x.w.players[x.me].room

// ── rooms: what one can climb, enter, search ─────────────────────────────────────────────────────────────────────

/** A room action that moves you, with how the two rooms see it (add_action climb/enter in each room file). */
function passage(words, to, leave, arrive) {
  return (x, arg) => {
    if (!words.some((w) => arg.includes(w))) return false
    move(x, x.me, '', to, { how: { leave, arrive } })
    return true
  }
}

R.square = { climb: passage(['榕树', '树'], 'tree', '$N攀着榕树的树干爬了上去。', '$N从树下爬了上来。') }
R.inn_kitchen = {
  enter: passage(['大灶', '灶'], 'fireplace', '$N一矮身，从大灶的灶口钻了进去。', '$N从外面钻了进来，跟你挤成一团。'),
  climb: passage(['大灶', '灶'], 'fireplace', '$N一矮身，从大灶的灶口钻了进去。', '$N从外面钻了进来，跟你挤成一团。'),
}
R.epath = { climb: passage(['围墙', '墙'], 'kitchen', '$N用手攀上围墙，蹬了几下翻了过去。', '$N从围墙的另一头爬了过来。') }
R.kitchen = { climb: passage(['围墙', '墙'], 'epath', '$N用手攀上围墙，蹬了几下翻了过去。', '$N从围墙的另一头爬了出来。') }
R.lane2 = { enter: passage(['磨坊'], 'mill', '$N推开磨坊的门，走了进去。', '$N推开门从外面走了进来。') }
R.ruin2 = { climb: passage(['梁柱', '樑柱', '柱'], 'ruin1', '$N爬过倒塌的梁柱，往大宅的前院离去。', '$N从倒塌梁柱的另一头爬了出来。') }
R.ruin1 = {
  climb: passage(['梁柱', '樑柱', '柱'], 'ruin2', '$N小心翼翼地爬过坍塌的梁柱进入大厅。', '$N从坍塌梁柱的另一头爬了过来。'),
  // The hairpin is found only from 11:00 to 14:00 of the game's day, once a reset.
  search(x, arg) {
    if (!arg.includes('杂草') && !arg.includes('草')) return false
    const { hour } = gameTime(x.now)
    const r = (x.w.rooms.ruin1 ??= {})
    if (r.found || hour < 10 || hour > 13) {
      vision(x, 'ruin1', '$N在杂草丛里找来找去，但是什么也没有找到。', x.me)
      return true
    }
    r.found = true
    makeThing(x, 'hairpin', x.me)
    vision(x, 'ruin1', '$N在草丛里找来找去，结果发现了一支发簪！', x.me)
    return true
  },
}
R.river1 = {
  // ES2 marks the river as water but no command drinks from it; here it does.
  drink(x, arg) {
    if (arg && !/水|溪|河/.test(arg)) return false
    const c = x.w.players[x.me]
    if (c.water.cur >= c.water.max) { x.out.push('你已经涨得喝不下一滴水了。'); return true }
    c.water.cur = Math.min(c.water.max, c.water.cur + Math.floor(c.water.max / 3))
    vision(x, 'river1', '$N捧起溪水喝了几口。', x.me)
    return true
  },
}
R.school = {
  sit(x) {
    const p = x.w.players[x.me]
    if (skillLv(x.w, x.me, 'literate', true) > 29) { x.out.push('你的读书识字根基不错，不需要再听三字经了。'); return true }
    if (temp(x, x.me).sitting) { x.out.push('你已经坐着专心听讲了。'); return true }
    temp(x, x.me).sitting = true
    vision(x, p.room, '$N找了一个空位坐了下来，开始跟着王老师念书。', x.me)
    return true
  },
}
R.post_office = {
  request(x) {
    // The mail of ES2 is the server's (MAILBOX_OB): not carried over. People here talk in the chat.
    x.out.push('驿站的官员摇摇头：「近来驿路不通，信札暂且不收发了。」')
    return true
  },
}
R.store = {
  /** npc/obj/wagon.c load: 「装车 <东西>」 or 「load <东西> into wagon」: 5 气 a load, the crate's wage owed. */
  load(x, arg) {
    const w = x.w
    const what = arg.replace(/^wagon with\s*/, '').replace(/\s*(into wagon|上车)$/, '').trim()
    const wagon = thingsAt(w, 'store').find((t) => w.things[t].id === 'wagon')
    if (!wagon) { x.out.push('驴车已经送货去了，等下一辆吧。'); return true }
    if (!what) { x.out.push('你可试试：装车 <东西>'); return true }
    const tid = thingsAt(w, x.me).find((t) => [thingName(w, t), ...(itemOf(w, t)?.ids ?? [])].some((n) => n === what || n.includes(what)))
    if (!tid) { x.out.push('你身上没有这件东西，怎么运上车？'); return true }
    vision(x, 'store', `$N把${thingName(w, tid)}装上运货驴车。`, x.me)
    moveThing(x, tid, wagon)
    x.out.push('呼  呼.. 好累喔。')
    consume(w.players[x.me], 'kee', 5)
    const p = w.players[x.me]
    temp(x, x.me).wage = (p.temp.wage ?? 0) + (itemOf(w, tid)?.wage ?? 0)
    if (thingsAt(w, wagon).length >= 20) {
      vision(x, 'store', '赶驴车的车夫鞭子一扬，赶着驴车送货去了。')
      destroy(x, wagon)
    }
    return true
  },
}

// ── things ───────────────────────────────────────────────────────────────────────────────────────────────────────

HOOKS.item.crate = {
  /** npc/obj/crate.c: lifting one takes 10 气. */
  get(x, tid) {
    if (x.w.players[x.me].kee.cur < 10) { x.out.push('你的力气不够了，休息一下再说吧。'); return true }
    moveThing(x, tid, x.me)
    vision(x, meRoom(x), `$N弯下腰将地上的${thingName(x.w, tid)}扛了起来。`, x.me)
    return true
  },
}

// ── the clock: the inn's hours (npc/innkeeper.c schedule) ───────────────────────────────────────────────────────

function openInn(x) {
  const id = 'n:innkeeper'
  const c = ch(x.w, id)
  if (!c || c.dead) return
  c.room = 'inn_hall'
  setDoor(x, 'inn_hall', '东', false)
  vision(x, 'inn_hall', '$N打了个呵欠，说道：睡的真好，开店做生意吧。', id)
}
function closeInn(x) {
  const id = 'n:innkeeper'
  const c = ch(x.w, id)
  if (!c || c.dead || c.room !== 'inn_hall') return
  said(x, id, '嗯.. 二更了，打烊吧，各位客倌明日请早。')
  for (const o of [...playersIn(x.w, 'inn_hall'), ...npcsIn(x.w, 'inn_hall')]) {
    if (o === id || o === 'n:waiter') continue
    vision(x, 'inn_hall', '$N将$n送出客栈。', id, o)
    ch(x.w, o).room = 'square_w'
  }
  setDoor(x, 'inn_hall', '东', true)
  c.room = 'inn_staff_room'
}
HOOKS.schedule = [[700, openInn], [2200, closeInn]]

// The App's rule, not ES2's: no fighting at 土地公庙, where ghosts come back to life.
ROOMS.small_temple.noFight = true

HOOKS.reset = (x) => {
  const { hour } = gameTime(x.now)
  const inn = hour >= 7 && hour < 22
  if (ch(x.w, 'n:innkeeper')) ch(x.w, 'n:innkeeper').room = inn ? 'inn_hall' : 'inn_staff_room'
  setDoor(x, 'inn_hall', '东', !inn)
}

/** Each beat: the woman in white strikes intruders after 5 s; 王怀芝's question lapses after 20 s. */
HOOKS.beat = (x) => {
  const girl = 'n:girl'
  const g = ch(x.w, girl)
  if (g && !g.dead && awake(x.w, girl, x.now)) {
    for (const [pid, at] of Object.entries(g.flags?.intruders ?? {})) {
      if (x.now - at < 5000) continue
      delete g.flags.intruders[pid]
      const p = x.w.players[pid]
      if (!p || p.room !== g.room || p.ghost) continue
      brawl(x, girl, pid, 'kill', [['$N说道：你真是不要命了！', girl]])
    }
  }
  for (const [pid, p] of Object.entries(x.w.players)) {
    if (p.temp?.picked && x.now - p.temp.picked > 20_000) {
      delete p.temp.picked
      const t = 'n:teacher'
      if (ch(x.w, t)?.room === p.room) { emote(x, t, EMOTES.pat, pid); said(x, t, '也罢，人各有志。') }
    }
  }
}

// ── the people ───────────────────────────────────────────────────────────────────────────────────────────────────

/** npc/waiter.c: refuses a fight; serves what is bought from the kitchen. */
N.waiter = {
  fight(x, id) { line(x, id, '店小二扮了个鬼脸，说道：客倌要打架的话，小的我可不是对手。'); return false },
  sold(x, id, buyer, tid) {
    const name = thingName(x.w, tid)
    said(x, id, `${name}是吧？马上来！`)
    line(x, id, `店小二对着厨房喊道：${name}一份！`)
    said(x, id, `客倌，您的${name}来啦！`)
    vision(x, ch(x.w, id).room, `$N把刚从厨房端出来的${name}送到$n面前。`, id, buyer)
  },
}

/** npc/innkeeper.c */
N.innkeeper = {
  init(x, id, pid) { if (!isNpc(pid)) said(x, id, '欢迎！欢迎！请里面坐！') },
  fight(x, id) { said(x, id, '这位朋友真爱开玩笑，小老儿还要做生意呢。'); return false },
}

/** npc/child.c, 阿宝 up in the banyan. */
N.child = {
  init(x, id, pid) {
    if (isNpc(pid) || !awake(x.w, id, x.now)) return
    const f = flags(x, id)
    if (!f.fed) said(x, id, '喂 ... 我肚子好饿，有没有吃的？')
    else if (x.w.players[pid].cls === 'thief') { line(x, id, '阿宝望着你，忽然说道：咦？你不是上次给我东西吃的那位 ...'); line(x, id, '阿宝微笑说道：又在这里遇到你，真巧。') }
    else said(x, id, '嘘 ... 别让婆婆知道我在这里 ...')
  },
  accept(x, id, tid) {
    const f = flags(x, id)
    if (f.fed || !itemOf(x.w, tid)?.foodStuff) { said(x, id, '给我这个干嘛？'); return false }
    f.fed = true
    emote(x, id, EMOTES.smile)
    said(x, id, '啊 .. 太好了！真谢谢你！ ...')
    vision(x, ch(x.w, id).room, `$N吃下一${itemOf(x.w, tid).baseUnit ?? '个'}${thingName(x.w, tid)}。`, id)
    destroy(x, tid)
    said(x, id, '对了 ... 不该白吃你的东西，这个送给你吧！')
    const comb = makeThing(x, 'comb', x.me)
    vision(x, ch(x.w, id).room, `$N拿出一把${thingName(x.w, comb)}交给$n。`, id, x.me)
    return true
  },
}

/** npc/gammer.c, the blind old woman by the water vat. */
N.gammer = {
  init(x, id) {
    // She does not leave town: from its edge she walks back to the vat.
    if (ROOMS[ch(x.w, id).room].edge) {
      said(x, id, '口渴了, 来喝口水...')
      line(x, id, '瞎眼老太婆缓缓走回大水缸边。')
      ch(x.w, id).room = 'square'
    }
  },
  say(x, id, pid, text) {
    if (isNpc(pid)) return
    const t = temp(x, pid)
    if (text === '祖奶奶' && t.thiefQualified) {
      emote(x, id, EMOTES.giggle)
      emote(x, id, EMOTES.pat, pid)
      const p = x.w.players[pid]
      if (p.cls !== 'commoner') return
      p.cls = 'thief'
      delete t.thiefQualified
      tell(x, pid, '你正式成为一名盗贼了。')
      improve(x, pid, 'sneak', 20)
      improve(x, pid, 'stealing', 20)
      line(x, id, '瞎眼老太婆说道：对了，这个给你。')
      const coin = makeThing(x, 'coin', pid)
      vision(x, ch(x.w, id).room, `$N把一枚${thingName(x.w, coin)}塞给$n。`, id, pid)
      line(x, id, '瞎眼老太婆说道：如果你想学本事，拿这东西给对方看。')
      return
    }
    if (text.includes('阿宝')) return said(x, id, '阿宝？你说阿宝在哪里？')
    // ES2's switch has no breaks: 0 shakes, wonders and steals; 1 wonders and steals; 2 only steals.
    const r = Math.floor(x.rand() * 10)
    if (r === 0) emote(x, id, EMOTES.shake)
    if (r <= 1) emote(x, id, EMOTES['?'])
    if (r <= 2) {
      const coin = thingsAt(x.w, pid).find((o) => x.w.things[o].id === 'stock/coin')
      if (coin) moveThing(x, coin, id, 1)
    }
  },
  fight(x, id) { emote(x, id, EMOTES['?']); x.out.push('瞎眼老太婆对你视若无睹 ...。'); return null },
  accept(x, id, tid) {
    if (x.w.things[tid].id !== 'comb') return false
    said(x, id, '咦？这 ... 这是 ... 我的梳子！')
    const p = x.w.players[x.me]
    if (p.cls !== 'commoner') said(x, id, '唉 ... 人老了，连随身的梳子都常常丢掉。')
    else {
      vision(x, p.room, '$N在$n的耳边悄声说了些什么。', id, x.me)
      tell(x, x.me, '瞎眼老太婆在你的耳边悄声说道：好家伙，竟然给你偷去了？想成为小偷是不是？叫声「祖奶奶」我就让你入这行 ...')
      temp(x, x.me).thiefQualified = true
    }
    return true
  },
}

/** npc/child1.c, child2.c: happy to spar; npc/child3.c, child4.c: busy with their books. Hurt, they cry and run. */
const kid = (yes, cry) => ({
  fight(x, id) {
    line(x, id, yes ? '小孩兴奋地跳着：好呀！来比武！叱！' : '小孩摇了摇头，说道：我没空打架，我在用功念书，将来要考状元的。')
    return yes
  },
  notify(x, id, from, say) { say(`$N「哇」地一声哭了起来：「你打我！${cry}」`, id); return flee(x, id, say) },
})
N.child1 = kid(true, '妈妈！妈妈！')
N.child2 = kid(true, '你是坏人！')
N.child3 = kid(false, '妈妈！妈妈！')
N.child4 = kid(false, '妈妈！妈妈！')

/** npc/foreman.c: wages for loaded crates, and new crates as the work comes in. */
N.foreman = {
  fight(x, id) { line(x, id, '工头说道：比武？你疯了吗？我才没那种闲功夫。'); return false },
  say(x, id, pid, text) {
    if (!text.includes('工钱')) return
    const owed = x.w.players[pid].temp?.wage
    if (!owed) return line(x, id, '工头说道：搬一个箱子二十五文钱，损坏的赔三倍。')
    said(x, id, `好，好 ... 总共是${cn(owed)}文钱，哪，给你。`)
    delete x.w.players[pid].temp.wage
    makeThing(x, 'stock/coin', pid, owed)
    vision(x, ch(x.w, id).room, `$N给$n${cn(owed)}文钱。`, id, pid)
  },
}
HOOKS.chat.new_crate = (x, id) => {
  const room = ch(x.w, id).room
  if (thingsAt(x.w, room).length >= 15) return
  makeThing(x, 'crate', room)
  line(x, id, '工头说道：喂！那边卸货的小心一点，别给摔坏了！')
}

/** npc/garrison.c, lieutenant.c: no one under level 10 goes north to 野羊山. */
const soldier = {
  go(x, id, dir) {
    if (dir !== '北' || x.w.players[x.me].level >= 10) return false
    x.out.push(`${nameOf(x.w, id)}将你拦了下来。`)
    said(x, id, '野羊山最近有盗匪出没，你们走别条路吧。')
    return true
  },
  fight(x, id) { line(x, id, `${nameOf(x.w, id)}瞪了瞪眼，说道：滚开滚开！少在这里啰唆！`); return false },
}
N.garrison = soldier
N.lieutenant = soldier

/** npc/guard.c: only fighters, or guests with a 英雄帖, cross the bridge to 雪吟山庄. */
N.guard = {
  go(x, id, dir) {
    if (dir !== '东' || x.w.players[x.me].cls === 'fighter') return false
    said(x, id, '对不起，庄主有令，只有持英雄帖的贵客才能入内。')
    x.out.push(`${nameOf(x.w, id)}拦住了你的去路。`)
    return true
  },
  accept(x, id, tid) {
    if (x.w.things[tid].id !== 'invitation') return false
    said(x, id, '小人失敬！敝庄主已经恭候多时了。')
    destroy(x, tid)
    vision(x, ch(x.w, id).room, '$N引领$n过了桥，往雪吟庄走去。', id, x.me)
    // 雪吟山庄 (/d/snowkeep) is not in the ES2 that is published: the road ends at the bridge.
    vision(x, ch(x.w, id).room, '……然而桥那头的山庄不在 ES2 公开的源码里，$n只好又回到了桥头。', id, x.me)
    return true
  },
}

/** npc/girl.c, the woman in white in the ruined hall. */
N.girl = {
  init(x, id, pid) {
    if (isNpc(pid) || x.w.players[pid].ghost) return
    said(x, id, '你是谁？滚！滚出去！不然我杀了你！')
    const f = flags(x, id)
    f.intruders = { ...(f.intruders ?? {}), [pid]: x.now }
  },
  accept(x, id, tid) {
    if (x.w.things[tid].id !== 'hairpin') { said(x, id, '这是什么破铜烂铁？拿开！'); return false }
    said(x, id, '这 ... 这是我的发簪！还给我！')
    const f = flags(x, id)
    if (f.intruders) delete f.intruders[x.me]
    if (ch(x.w, id).hate) delete ch(x.w, id).hate[x.me]
    emote(x, id, EMOTES.hmm)
    said(x, id, '你想要什么？说吧。')
    f.requester = x.me
    return true
  },
  say(x, id, pid, text) {
    const f = flags(x, id)
    if (pid !== f.requester) return said(x, id, '这里没有你说话的余地，给我闭嘴！')
    if (text !== '英雄帖') return said(x, id, '这种东西我没有，换一种！')
    said(x, id, '哼！我道是什么？拿了快滚吧！')
    makeThing(x, 'invitation', ch(x.w, id).room)
    line(x, id, '白衣女子丢下一张英雄帖。')
    delete f.requester
  },
}

/** npc/junkman.c: picks up what lies about, runs at the first blow. */
N.junkman = {
  fight(x, id) { line(x, id, '拾荒老头露出害怕的神情，说道：这 ... 咳 ... 饶了小人吧 ...'); return false },
}

/** npc/oldman.c (F_BANDIT): beaten in a fight, laughs it off — and picks your pocket. */
N.oldman = {
  notify(x, id, from, say, killing) {
    if (killing) { say('$N说道：...', id); return flee(x, id, say) }
    say('$N哈哈大笑，说道：年轻人，你的武艺不错，小老儿服了你啦！', id)
    const loot = thingsAt(x.w, from).filter((t) => !x.w.things[t].eq)
    if (loot.length) moveThing(x, pick(x, loot), id)
    return { over: true }
  },
}

/** npc/teacher.c, 王怀芝 and his 三字经. */
const TEXT = ['人之初', '性本善', '性相近', '习相远', '苟不教', '性乃迁', '教之道', '贵以专', '昔孟母', '择邻处', '子不学', '断机杼',
  '窦燕山', '有义方', '教五子', '名俱扬', '养不教', '父之过', '教不严', '师之惰', '为人子', '方少时', '亲师友', '习礼仪']
HOOKS.chat.teach_literate = (x, id) => {
  const f = flags(x, id)
  if ((f.text ?? 0) >= TEXT.length) { said(x, id, '嗯 ... 一次教太多你们也记不住，好吧，我们再从头复习一次。'); f.text = 0 }
  const txt = TEXT[f.text ?? 0]
  f.text = (f.text ?? 0) + 1
  said(x, id, `大家跟着我念：${txt}。`)
  const room = ch(x.w, id).room
  for (const kid of npcsIn(x.w, room).filter((n) => n.startsWith('n:child3'))) vision(x, room, `$N跟着念道：${txt}。`, kid)
  for (const pid of playersIn(x.w, room)) {
    const p = x.w.players[pid]
    if (!p.temp?.sitting || !awake(x.w, pid, x.now) || skillLv(x.w, pid, 'literate', true) >= 30) continue
    improve(x, pid, 'literate', Math.floor(x.rand() * (attr(x.w, pid, 'int') + 1)))
    vision(x, room, `$N跟着念道：${txt}。`, pid)
    if (x.rand() * 10 > 7 && p.cls === 'commoner' && skillLv(x.w, pid, 'literate', true) >= 5 && attr(x.w, pid, 'int') > x.rand() * 20 && !p.temp.picked) {
      said(x, id, `${p.name}，你在我这儿念书有一段时间了。`)
      said(x, id, '我看你对读书颇有兴趣，天份也不错。')
      said(x, id, '想不想和老师一样，当一个书生？')
      p.temp.picked = x.now
    }
  }
}
N.teacher = {
  fight(x, id) { line(x, id, '王怀芝说道：这 ...武功我可是半点不会，这位朋友不如去找我们家王教头切磋切磋？'); return false },
  acquire(x, id, what) {
    if (!/literate|读书|识字/.test(what)) return false
    said(x, id, '想读书识字吗？在这里坐着(sit)听吧。')
    emote(x, id, EMOTES.smile)
    said(x, id, '读书可不容易，不过学了多少一辈子都是你的。')
    return true
  },
  say(x, id, pid, text) {
    const p = x.w.players[pid]
    if (!p?.temp?.picked || !['想', '是', '好'].includes(text[0])) return
    delete p.temp.picked
    p.cls = 'scholar'
    emote(x, id, EMOTES.smile)
    tell(x, pid, '( 你成为一位书生 )')
  },
}

/** npc/alchemist.c, 陈维侠: asked twice, he takes a commoner into the 龙图丹派. */
N.alchemist = {
  apprentice(x, id) {
    const p = x.w.players[x.me]
    const t = temp(x, x.me)
    if (t.alchemist) {
      vision(x, p.room, '$N跪下来恭恭敬敬地向$n磕了四个响头，叫道：师父！', x.me, id)
      if (p.cls !== 'commoner') { said(x, id, '你既已入别派，岂有余力再习我丹术?'); line(x, id, '陈维侠挥挥手，说道：去吧.....。'); return true }
      delete t.alchemist
      p.cls = 'alchemist'
      p.title = '龙图丹派弟子'
      p.master = id
      line(x, id, '陈维侠点了点头，说道：你虽然入我门下，但是得先烧火采药十年。')
      line(x, id, '陈维侠说道：十年之后，如果为师看你还堪造就，这才传你丹术。')
      line(x, id, '陈维侠摆了摆手，说道：好了，你先下去吧。')
      return true
    }
    if (p.title) { line(x, id, '陈维侠道: 年轻人, 有空多多烧火采药, 别这般四处闲耍。'); return false }
    said(x, id, '拜我为师？呵呵 ... 我可不是什么武林高手呀。')
    line(x, id, '陈维侠望着屋外出了会神，说道：我只是个喜欢炼丹采药、打抱不平的老头儿。')
    line(x, id, '陈维侠忽然笑了起来，说道：「炼丹采药、打抱不平」... 哈哈哈...。')
    line(x, id, '陈维侠说道：我看你这年轻人倒还顺眼，如果你不怕做些烧火采药的粗活 ...')
    line(x, id, '陈维侠说道：老夫门徒不下千人，便多你一个也不妨。')
    if (p.cls === 'commoner' && !p.title) t.alchemist = true
    return false
  },
}

/** npc/yu.c, 鱼天 of 鱼记小铺: a map of the town for a little money. */
N.yu = {
  init(x, id, pid) {
    if (isNpc(pid)) return
    line(x, id, '鱼天笑开了大嘴道: 这位朋友添些衣服穿吧!')
    line(x, id, '鱼天向你介绍道: 要存息放款, 我鱼记也是安全又实在喔!')
    if (x.w.players[pid].level <= 5) tell(x, pid, '鱼天在你的耳边悄声说道: 前几天我捡到了个好东西喔, 给我点钱就送你, 够意思吧!')
  },
  fight(x, id) { line(x, id, '鱼天道: 唉! 不练些防身技能, 干爹那儿可是远水救不了近火!'); return true },
  accept(x, id, tid) {
    const key = x.w.things[tid].id
    const money = ['stock/coin', 'stock/silver', 'stock/gold'].includes(key)
    if (!money) {
      line(x, id, '鱼天说道: 这.. 虽然不是银两, 不过也说不定有人想买, 真是谢谢你啦.')
      line(x, id, `鱼天转身将${thingName(x.w, tid)}收入了柜台之后.`)
      return true
    }
    if (x.w.players[x.me].level > 5 && key === 'stock/coin') {
      line(x, id, '这位客官也知道我的新收藏品? 看来这玩意挺值几个钱的, 好, 出价银两就成!')
      return true
    }
    line(x, id, '鱼天说道: 好, 这位客官够意思, 这玩意儿就送给你啦!')
    makeThing(x, 'note', x.me)
    vision(x, ch(x.w, id).room, '$N将一张皮革交给了$n。', id, x.me)
    return true
  },
}

/** npc/smith.c */
N.smith = { fight(x, id) { line(x, id, '铁匠瞪了瞪眼，说道：走开，我正忙着。'); return false } }
/** npc/herbalist.c, npc/miller.c, npc/woman.c, obj/area/man.c: the general villager. */

