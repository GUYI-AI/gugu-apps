// Fixed settings navigation retained from OpenDCAI/gugu@1f8cd5f3a81df091d25a81f6838f186c33504a95
// apps/desktop/native/mac-helper/Sources/GuguMacHelper/Permissions.swift.
// No calendar, contacts, location, clipboard or host-native registry is included.
import AppKit
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
if args.count == 2, args[0] == "open", let pane = panes[args[1]], let url = URL(string: pane) {
    let accepted = NSWorkspace.shared.open(url)
    emit(["ok": accepted, "launchServicesAccepted": accepted, "permission": args[1], "permissionGrantedByThisCall": false], code: accepted ? 0 : 1)
}
emit(["ok": false, "code": "invalid_action"], code: 64)
