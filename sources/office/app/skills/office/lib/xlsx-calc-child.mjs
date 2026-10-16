// The process xlsx-calc.mjs recalculate() starts: the edited workbook in (IPC), calculate, the answer out, gone — and
// with it all the memory IronCalc took. A file of its own: what the process runs (its watch and the one message it
// answers) is not what the script imports.
//
// It ends itself at its deadline (`argv[2]`, ms), or as soon as the script that started it is gone: the script holds
// the other end of this process's stdin, which the system closes when the script ends, however it ends — a crash, a
// kill. (On Windows node ends the processes it started with it besides: macOS and Windows, measured 10-13.) No pid
// is looked at: one is used again. A thread of its own keeps watch — the main thread is in IronCalc's calculation
// seconds at a time, and runs no timer meanwhile.
import { Worker } from 'node:worker_threads'
import { calculate } from './xlsx-calc.mjs'

const watch = `
  const end = () => process.kill(process.pid, 'SIGKILL')
  setTimeout(end, ${Number(process.argv[2])})
  const script = new (require('node:net').Socket)({ fd: 0, readable: true, writable: false })
  script.on('close', end)
  script.resume()
`
new Worker(watch, { eval: true }).unref()

process.once('message', async (job) => {
  process.send(await calculate(job), () => process.exit(0))
})
