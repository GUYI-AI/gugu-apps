// The App's one page of its own: in a message (`ctx.widget`) the fleet card, anywhere else the board. A widget lives on a
// tab, and every tab that opens no file is an item of a task's「+」: one tab for both keeps that menu to one 协作看板.
const ctx = await window.gugu.getContext()
await import(ctx.widget ? './fleet.js' : './board.js')
