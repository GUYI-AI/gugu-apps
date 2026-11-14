Background Chrome navigation now completes Cmd+L, text entry and Return without taking focus from the user window or interrupting Chinese Pinyin composition. The macOS runtime uses maintained driver 0.36.0-gugu.2. Explicit foreground actions and other applications keep their existing behavior.

Known untested configurations: Microsoft Edge, Arc and Intel Mac GUI behavior. Real-window acceptance covered Google Chrome stable 157.0.8103.79 on Apple Silicon, including two windows in one browser process.

Rollback: finish active Computer Use tasks, open Gugu Settings → Apps → Computer Use → Version history, and choose 0.5.0. Selecting this older version turns off automatic updates for this App until you enable them again. App data is preserved and 0.5.0 uses its previously pinned 0.36.0-gugu.1 driver. Do not manually replace a cached driver. Withdrawing a version does not automatically downgrade existing installations.
