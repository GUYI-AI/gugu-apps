import AppKit

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let window = NSWindow(contentRect: NSRect(x: 160, y: 180, width: 640, height: 360), styleMask: [.titled, .closable], backing: .buffered, defer: false)
window.title = "Computer Use permission verification"
window.isReleasedWhenClosed = false
let label = NSTextField(labelWithString: "Computer Use native capture\nOwned test window — no account or person data")
label.frame = NSRect(x: 32, y: 130, width: 580, height: 100)
label.font = .systemFont(ofSize: 22)
label.maximumNumberOfLines = 3
window.contentView?.addSubview(label)
window.orderFront(nil)
print("ready")
fflush(stdout)
DispatchQueue.global().async {
  while readLine() != nil {}
  DispatchQueue.main.async { app.terminate(nil) }
}
app.run()
