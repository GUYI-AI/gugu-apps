// The page's language can change while a calculation or a dialog's program call is running. Each switch
// starts a new turn; work keeps what it got only if it ends in the turn it started in, because its program
// calls were worded in whichever language was current when each was sent.
export function languageTurns() {
  let turn = 0
  return {
    switched() { turn++ },
    // Call when work starts; the returned check says whether no switch has happened since.
    start() { const at = turn; return () => at === turn },
  }
}

// What a finished calculation leaves behind. Across a switch its results are in more than one language and a
// carried-over report is never diagnosed again, so it saves nothing and the next calculation starts empty.
export const afterRun = (inTurn, done, entries) => inTurn ? { save: done, again: false, entries } : { save: false, again: true, entries: [] }
