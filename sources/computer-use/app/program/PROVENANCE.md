# Computer Use native implementation

Migrated from OpenDCAI/gugu commit `1f8cd5f3a81df091d25a81f6838f186c33504a95`:

- `apps/desktop/electron/device-actions/native/cua-client.ts`: native daemon and per-agent channels, environment filtering, time budgets, cancellation, idle exit, crash recovery.
- `native/cua-daemon-lease.ts`: native owner lease and cancellation acknowledgement.
- `native/cua-observation.ts`, `cua-window-cursor.ts`, `cua-image-sample.ts`: bounded observation and cursor mapping. Image decoding is an App adapter; no Electron dependency is retained.
- `apps/desktop/electron/device-actions/computer-control.ts`: target-specific pause and cancellation.
- `apps/desktop/electron/device-actions/families/computer.ts`: allowed tools and rules for protected host windows, window-only input, foreground consent and batch validation.
- `apps/desktop/native/cua-driver/`: maintained macOS source patch, provenance, MIT license and third-party notices.
- `scripts/build-cua-driver-patched-macos.mjs`: reproducible maintained-driver build procedure.

The driver remains cua-driver 0.36.0, with macOS maintained revision 0.36.0-gugu.1. Windows retains the original 0.36.0 release. Do not silently substitute an unpatched macOS driver or enable native telemetry/updates.

This layer does not activate a market release or change the existing App manifest. Shared human-request, projection/input and program-revocation integration follows in separate layers. The old native-host implementation is removed from the client once the App is connected; it is not a fallback for the migrated App.

Permission attribution must be observed through the actual App launch chain and operating-system UI. The former direct-child comments are historical evidence, not proof of the App's independent TCC identity.
