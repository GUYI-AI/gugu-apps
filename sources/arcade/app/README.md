# 联机小游戏

群里一起玩的实时小游戏：五子棋、多人贪吃蛇、坦克大战、炸弹人。

What people read about this App in the market is in `store/`. This README and `CHANGELOG.md` are for the repository and are never shown in gugu.

Every game is one module on one shared piece, `net.js`: the group's file (`联机小游戏.games.json`) keeps what lasts, presence carries what moves. Each page moves its own player, judges hits on itself and draws the others smoothed; nobody hosts the game for everyone.
