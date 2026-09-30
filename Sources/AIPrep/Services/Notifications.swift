import Foundation
import UserNotifications

// MARK: - NotificationScheduler

/// Manages daily practice-reminder notifications via `UNUserNotificationCenter`.
///
/// Usage:
/// ```swift
/// let scheduler = NotificationScheduler()
/// await scheduler.requestAuthorization()
/// scheduler.scheduleDailyReminder(hour: 9, minute: 0)
/// ```
///
/// All public methods are safe to call from any concurrency context.
@MainActor
final class NotificationScheduler: ObservableObject {

    // MARK: - Published state

    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var isReminderEnabled: Bool = false

    // MARK: - Constants

    private static let reminderIdentifier = "com.aiprep.dailyReminder"
    private static let hourKey  = "AIPrep.reminderHour"
    private static let minuteKey = "AIPrep.reminderMinute"
    private static let enabledKey = "AIPrep.reminderEnabled"

    private let center = UNUserNotificationCenter.current()

    // MARK: - Init

    init() {
        isReminderEnabled = UserDefaults.standard.bool(forKey: Self.enabledKey)
        Task { await refreshAuthorizationStatus() }
    }

    // MARK: - Authorization

    /// Requests UNUserNotification authorization (alert + badge + sound).
    /// Returns `true` if granted.
    @discardableResult
    func requestAuthorization() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(
                options: [.alert, .badge, .sound])
            await refreshAuthorizationStatus()
            return granted
        } catch {
            print("[NotificationScheduler] ⚠️ Authorization request failed: \(error)")
            return false
        }
    }

    // MARK: - Scheduling

    /// Schedules (or re-schedules) a daily repeating reminder.
    ///
    /// - Parameters:
    ///   - hour:   24-hour clock hour (0–23). Defaults to 9 (9 AM).
    ///   - minute: Minute component (0–59). Defaults to 0.
    func scheduleDailyReminder(hour: Int = 9, minute: Int = 0) {
        guard authorizationStatus == .authorized || authorizationStatus == .provisional else {
            print("[NotificationScheduler] ⚠️ Not authorized; skipping schedule.")
            return
        }

        // Persist the chosen time
        UserDefaults.standard.set(hour,   forKey: Self.hourKey)
        UserDefaults.standard.set(minute, forKey: Self.minuteKey)
        UserDefaults.standard.set(true,   forKey: Self.enabledKey)
        isReminderEnabled = true

        let content = UNMutableNotificationContent()
        content.title = "Time to practice 🧠"
        content.body  = "Your daily AI engineering questions are ready. Keep the streak going!"
        content.sound = .default
        content.categoryIdentifier = "AIPrep.dailyReminder"

        var dateComponents = DateComponents()
        dateComponents.hour   = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(
            dateMatching: dateComponents,
            repeats: true)

        let request = UNNotificationRequest(
            identifier: Self.reminderIdentifier,
            content: content,
            trigger: trigger)

        // Remove existing before re-adding (idempotent)
        center.removePendingNotificationRequests(
            withIdentifiers: [Self.reminderIdentifier])

        center.add(request) { error in
            if let error {
                print("[NotificationScheduler] ⚠️ Failed to add request: \(error)")
            } else {
                print("[NotificationScheduler] ✅ Daily reminder scheduled at \(hour):\(String(format: "%02d", minute))")
            }
        }
    }

    /// Cancels the daily reminder and clears the stored preference.
    func cancelDailyReminder() {
        center.removePendingNotificationRequests(
            withIdentifiers: [Self.reminderIdentifier])
        UserDefaults.standard.set(false, forKey: Self.enabledKey)
        isReminderEnabled = false
        print("[NotificationScheduler] Daily reminder cancelled.")
    }

    /// Restores a previously scheduled reminder from `UserDefaults` (call on app launch).
    func restoreScheduledReminder() {
        guard UserDefaults.standard.bool(forKey: Self.enabledKey) else { return }
        let hour   = UserDefaults.standard.integer(forKey: Self.hourKey)
        let minute = UserDefaults.standard.integer(forKey: Self.minuteKey)
        // Use stored values; defaults of 0 are acceptable (midnight) but typical save is 9:00
        scheduleDailyReminder(hour: hour == 0 ? 9 : hour, minute: minute)
    }

    // MARK: - Status query

    /// Returns the scheduled fire time for the daily reminder, if any.
    func pendingFireDate() async -> Date? {
        let requests = await center.pendingNotificationRequests()
        guard let request = requests.first(where: {
            $0.identifier == Self.reminderIdentifier
        }) else { return nil }

        guard let trigger = request.trigger as? UNCalendarNotificationTrigger,
              let next = trigger.nextTriggerDate()
        else { return nil }

        return next
    }

    // MARK: - Private helpers

    private func refreshAuthorizationStatus() async {
        let settings = await center.notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }
}

// MARK: - Notification Category Registration

extension NotificationScheduler {
    /// Registers UNNotificationCategory actions. Call once at app launch.
    static func registerCategories() {
        let openAction = UNNotificationAction(
            identifier: "AIPrep.openApp",
            title: "Start Session",
            options: [.foreground])

        let dismissAction = UNNotificationAction(
            identifier: "AIPrep.dismiss",
            title: "Later",
            options: [.destructive])

        let category = UNNotificationCategory(
            identifier: "AIPrep.dailyReminder",
            actions: [openAction, dismissAction],
            intentIdentifiers: [],
            hiddenPreviewsBodyPlaceholder: "Practice reminder",
            options: [])

        UNUserNotificationCenter.current()
            .setNotificationCategories([category])
    }
}
