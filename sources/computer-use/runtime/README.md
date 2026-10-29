# Computer Use App native layer

This module owns the native implementation. It is not another Gugu native host.

- `prepareDriver` prepares a pinned platform-specific driver only inside a supplied App data directory. Archive hashes are verified before bounded extraction; link/path overrides are refused. Cached executables are compared with their verified archive, executable bits are restored, architecture and macOS signature are checked, and the pinned driver version is probed. No default host-native directory is searched.
- `createCuaClient` preserves the maintained daemon protocol, per-owner channels, environment allowlist, native cancellation and bounded observation. Image sampling accepts the App's decoder adapter; it never imports Electron.
- `createComputerTools` accepts native documentation and trusted caller context from the App's program adapter. Arguments cannot select another machine/owner or grant consent. Protected host identity and macOS permission checks fail closed. Internal human-consent outcomes are normalized by the shared-host adapter; they are not a claim about an existing public API's result shape.
- `createPermissionClient` runs only the bundled, verified helper. `status` is read-only; `requestFromPage` belongs to an explicit page action and checks both permissions. Opening a fixed settings pane does not grant permission. The bundled helper has an ad-hoc signature, not Developer ID/notarization or an independently verified TCC identity.
- `createComputerControl` preserves target-specific pause and now aborts in-flight operations on disposal and rejects subsequent work. Program-wide revocation must dispose the App's runtime; cancelling one call supplies only that call's signal.

Build the JavaScript with `npm run build:runtime`. Build permission resources on macOS with `npm run build:permissions`; it requires the normal Xcode command-line toolchain and emits both architectures into one ad-hoc-signed helper. `npm test` checks the committed JavaScript, provenance, helper source hash, bounded resource preparation, policy and lease behavior. `npm run test:mutations` independently removes revocation, bound-task identity and checksum enforcement in temporary source copies, and requires the positive checks to fail.

`native/check-driver.mjs` requires an explicitly isolated `GUGU_EXTENSION_DATA_DIR`; it verifies/downloads the native driver and inspects version/documentation without starting its daemon or manipulating windows. This is not a real input, capture, system-permission grant/revoke or remote transport acceptance test.

This layer leaves the current market manifest unchanged. Program entry/host API integration, the approved page and transport, real-window acceptance, old-manifest compatibility and removal of Computer Use-specific Gugu implementation follow in separate reviewed layers. There is no host-native fallback in this runtime.
