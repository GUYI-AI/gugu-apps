# Maintained native driver

Computer Use App 0.5.1 pins macOS maintenance revision **0.36.0-gugu.2** from [GUYI-AI/cua](https://github.com/GUYI-AI/cua), based on trycua/cua 0.36.0 plus the previous gugu.1 fixes. Windows and Linux retain upstream 0.36.0. Licensing is unchanged (MIT); see LICENSE.md and THIRD_PARTY_NOTICES.md.

Background Chromium Cmd+L, subsequent type_text and Return use native accessibility selection, value insertion and the associated suggestion action. Neither synthetic keyboard input nor a key-window switch is used for that chain. The real process bundle identity chooses this route. Other applications, explicit foreground delivery and bring_to_front keep their existing behavior. Native identity/window checks remain in place.

## Distribution boundary

The App JavaScript bundle contains `runtime/driver-resources.mjs` pins and licenses, **not** the driver executable. On the first native call, `prepareDriver` downloads the immutable universal archive, checks its SHA-256, executable architecture, macOS signature and `cua-driver 0.36.0` version, then prepares `<App data>/native/<archive SHA>/cua-driver`. The maintenance revision and source commit identify the patch independently of the upstream executable version. A new SHA uses a new cache directory; existing binaries/processes are not overwritten.

The proposed native asset is `cua-driver-rs-0.36.0-gugu.2-darwin-universal-binary.tar.gz` at tag `cua-driver-rs-v0.36.0-gugu.2` in GUYI-AI/cua. That upload must precede publishing App 0.5.1. This draft does neither operation and adds no market version row. No client rebuild is required for the API 36 App path. The client's separate native runtime is outside this change.

## Reproduction

`patched-macos.json` records the exact upstream and maintenance commits, combined patch, every changed source checksum, compiler identity and accepted local candidate hashes. `patches/0.36.0-gugu.2.patch` includes gugu.1 plus this fix. Existing gugu.1 bytes remain immutable.

1. Check out the recorded upstream commit in an isolated checkout and prepare Rust nightly-2026-06-25 (rustc 1.98.0-nightly/f28ac764c), macOS SDK and Apple arm64/x86_64 targets.
2. Run `node native/build-patched-driver.mjs --source <checkout> --out <output>/cua-driver-arm64 --arch arm64`, and repeat with `--arch x64`. It verifies the complete diff and source checksums before a locked release build.
3. Combine the slices with lipo, ad-hoc sign the candidate, verify both architectures and version, then archive the root `cua-driver` member. A future release uses a new immutable asset name; never overwrite an existing revision.

Real-window acceptance covers official Chrome stable 157.0.8103.79 on Apple Silicon with two windows in one process and a real Chinese Pinyin composition in the user window. Cross-compilation does not prove Intel GUI behavior. Edge/Arc were not installed and remain untested. Accessibility tree differences in other Chromium versions need their own acceptance.
