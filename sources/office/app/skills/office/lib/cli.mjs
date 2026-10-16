// The command line every script of this skill shares (scripts/pptx.mjs, scripts/xlsx.mjs): `<command> <args…>`, options
// `-o <file>` and `--<name> <value>`; what the command returns is printed as one JSON on stdout; a refusal (OoxmlError,
// e.g. a shape changed since it was read) is one sentence on stderr and exit code 1 — so is anything else, with its stack.
// And what every script does with its files: the file read (said when it cannot be), the edits read as JSON, the
// changed file written whole or not at all.
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { OoxmlError } from './ooxml-read.js'

/** A file's bytes; `what` names it when it cannot be read, `usage` is said when none was given. */
export function readInput(file, what, usage) {
  if (!file) throw new OoxmlError(usage)
  let buffer
  try {
    buffer = readFileSync(file)
  } catch (error) {
    throw new OoxmlError(`cannot read ${what} ${file}: ${error.message}`)
  }
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

/** The edits file, as JSON. */
export function readEdits(file, usage) {
  const bytes = readInput(file, 'the edits', usage)
  try {
    return JSON.parse(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf8'))
  } catch (error) {
    throw new OoxmlError(`${file} is not JSON: ${error.message}`)
  }
}

/** `bytes` written to `out` whole or not at all: beside it first, then renamed over it. */
export function writeWhole(out, bytes) {
  const temp = `${out}.${process.pid}.tmp`
  try {
    writeFileSync(temp, bytes)
    renameSync(temp, out)
  } catch (error) {
    rmSync(temp, { force: true })
    throw new OoxmlError(`cannot write ${out}: ${error.message}`)
  }
}

/**
 * The Node the scripts need: node:zlib's crc32 (ooxml-zip.mjs) is 22.2+; gugu-node, gugu's own Node, is newer. Called
 * before the modules that need it are imported (a static import would fail first, with a message about crc32).
 */
export function needNode() {
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < 22 || (major === 22 && minor < 2)) {
    process.stderr.write(`this script needs Node 22.2 or later (this is ${process.versions.node}): run it with gugu-node\n`)
    process.exit(1)
  }
}

export function parseArgs(argv) {
  const positional = []
  const options = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const name = arg === '-o' ? 'o' : arg.startsWith('--') ? arg.slice(2) : null
    if (name === null) {
      positional.push(arg)
      continue
    }
    if (i + 1 >= argv.length) throw new OoxmlError(`${arg} needs a value`)
    options[name] = argv[(i += 1)]
  }
  return { positional, options }
}

/** Run the command argv names. `commands`: name → async (args, options) => answer. `usage`: said when none is named. */
export async function main(commands, usage, argv = process.argv.slice(2)) {
  try {
    const { positional, options } = parseArgs(argv)
    const [name, ...args] = positional
    const command = Object.hasOwn(commands, name ?? '') ? commands[name] : null
    if (!command) throw new OoxmlError(name ? `no command "${name}". ${usage}` : usage)
    process.stdout.write(`${JSON.stringify(await command(args, options), null, 1)}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof OoxmlError ? error.message : error instanceof Error ? error.stack : String(error)}\n`)
    process.exitCode = 1
  }
}
