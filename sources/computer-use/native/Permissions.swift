// AX/CG primitives retained from OpenDCAI/gugu@1f8cd5f3a81df091d25a81f6838f186c33504a95
// apps/desktop/native/mac-helper/Sources/GuguMacHelper/Permissions.swift.
// No calendar, contacts, location, clipboard or host-native registry is included.
import AppKit
import ApplicationServices
import CoreGraphics
import Darwin
import Foundation

let panes = [
    "accessibility": "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
    "screen": "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
]
let args = Array(CommandLine.arguments.dropFirst())
func emit(_ value: [String: Any], code: Int32 = 0) -> Never {
    let bytes = try! JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    FileHandle.standardOutput.write(bytes)
    FileHandle.standardOutput.write(Data([10]))
    exit(code)
}
func status(prompted: Bool) -> [String: Any] {
    let ax = AXIsProcessTrusted()
    let screen = CGPreflightScreenCaptureAccess()
    var missing: [String] = []
    if !ax { missing.append("accessibility") }
    if !screen { missing.append("screen") }
    return [
        "ok": true, "permissions": ["accessibility": ax, "screen": screen], "missing": missing,
        "promptRequested": prompted,
        "observer": ["pid": Int(getpid()), "parentPid": Int(getppid()), "executable": CommandLine.arguments[0], "bundleIdentifier": Bundle.main.bundleIdentifier as Any? ?? NSNull()],
        "authorizationScope": "Current launch/responsible-process chain; not proof of an independent App TCC identity.",
    ]
}
if args == ["status"] { emit(status(prompted: false)) }
if args == ["request"] {
    // Only the App's explicit permission button invokes this mode. Both checks run;
    // the result never assumes that opening a prompt granted access.
    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
    _ = AXIsProcessTrustedWithOptions(options)
    _ = CGPreflightScreenCaptureAccess() || CGRequestScreenCaptureAccess()
    emit(status(prompted: true))
}
if args.count == 2, args[0] == "open", let pane = panes[args[1]], let url = URL(string: pane) {
    let accepted = NSWorkspace.shared.open(url)
    emit(["ok": accepted, "launchServicesAccepted": accepted, "permission": args[1], "permissionGrantedByThisCall": false], code: accepted ? 0 : 1)
}
emit(["ok": false, "code": "invalid_action"], code: 64)
