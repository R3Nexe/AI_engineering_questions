import SwiftUI

@main
struct AIPrepApp: App {

    @StateObject private var bank  = QuestionBank()
    @StateObject private var store = Store()

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environmentObject(bank)
                .environmentObject(store)
                .frame(minWidth: 900, minHeight: 600)
        }
        .windowToolbarStyle(.unified(showsTitle: false))
        .defaultSize(width: 1280, height: 800)
        .commands {
            // Remove File ▶ New Window (single-session app)
            CommandGroup(replacing: .newItem) { }

            CommandMenu("Practice") {
                Button("Start Daily Session") {
                    NotificationCenter.default.post(
                        name: .navigateSidebar, object: SidebarItem.daily)
                }
                .keyboardShortcut("1", modifiers: [.command, .shift])

                Button("Due Now") {
                    NotificationCenter.default.post(
                        name: .navigateSidebar, object: SidebarItem.due)
                }
                .keyboardShortcut("2", modifiers: [.command, .shift])

                Button("All Questions") {
                    NotificationCenter.default.post(
                        name: .navigateSidebar, object: SidebarItem.all)
                }
                .keyboardShortcut("3", modifiers: [.command, .shift])
            }
        }
    }
}

// MARK: - Navigation notification

extension Notification.Name {
    static let navigateSidebar = Notification.Name("AIPrep.navigateSidebar")
}
