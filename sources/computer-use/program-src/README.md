# Computer Use program adapter

This layer provides a normal stdio MCP program. It does not activate the current market manifest, register a native host, or implement another projection/input channel. Manifest activation, the approved task-page interface and removal of the old client implementation follow with the shared host capabilities.

The private host-owned transport stamps `gugu/agent` and `gugu/sessionId`. The adapter rejects missing identities and never accepts them as tool arguments. These are trust assertions from Gugu's gateway, not signatures that a standalone pipe can independently authenticate. Each task retains its native owner. Native image blocks remain MCP image blocks; results are not JSON-encoded into text.

Single-call SDK cancellation reaches native preparation and execution. Preparation subscriptions remain independent. Program EOF, stdin close/error, stdout errors (including EPIPE), and SIGTERM/SIGINT dispose the native runtime and abort pending work. A late completed preparation cannot resurrect the runtime. The host's separate upgrade-drain versus immediate-revocation integration is still required and is not claimed by this App-only layer.

The protected host is read from actual process ancestry, including the main process above its runtime worker. Missing or changed ancestry fails closed. The POSIX process query explicitly uses UTF-8 so Chinese package paths survive an empty inherited environment. macOS package names and bundle IDs are read from the enclosing App; Windows uses a fixed non-interactive process query. Only fixture coverage is available for Windows at this stage; native Windows execution remains acceptance work.

Two App-only tools read driver permission state without prompts and open one of the two fixed settings panes. Model callers cannot invoke them. An agent working a page may read state but cannot open settings as the person. Opening settings does not grant permission. There is no status/grant helper API or extra human-wait interface. Consent blockers return immediately for the agent to discuss through its existing conversation or AskUserQuestion.

Tool discovery reads a committed schema snapshot from the pinned, verified driver; discovery never downloads or starts a daemon. `native/update-tool-specs.mjs` reproduces the snapshot without operating a window. The snapshot was inspected on macOS; platform execution checks remain necessary before activation. The actual binary is prepared only on first native use and has telemetry/self-updates disabled.

`node program-src/build.mjs` packages the adapter, pinned MCP SDK and PNG decoder into the App. It derives all bundled package dependencies from esbuild's metafile, requires their complete license texts and emits `THIRD-PARTY-NOTICES.txt`, including transitives. `--check` compares committed bytes. The PNG sampler compares actual pixels, independent of compression metadata. `npm test` exercises the actual SDK stdio transport as well as caller separation, cancellation, native cleanup, protected ancestry and image sampling. `npm run test:mutations` removes those boundaries in temporary copies and requires failures.

Confirmation is asserted by the agent with `confirmed:true` after deciding that it has approval. It is not a host-issued capability bound to the exact operation arguments.

`native/check-program.mjs` is an opt-in real Mac CLI/stdio probe. It uses synthetic host-shaped metadata, creates its own native window, reads the actual driver status, captures only that exact window and closes its owned processes. `GUGU_TEST_HOST_SDK_ROOT` can select the installed host SDK for compatibility checks. This is not an installed-Gugu gateway, permission-grant/revocation, independent TCC, remote transport, or final task-page acceptance test.
