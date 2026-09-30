import Foundation

// MARK: - Store

/// Manages all user-mutable state: in-flight answer drafts and attempt history.
///
/// Persistence layout – ~/Library/Application Support/AIPrep/
///   progress.json  — [String: QuestionProgress]  (keyed by question ID)
///   drafts.json    — [String: Draft]              (keyed by question ID)
///
/// All mutations are on @MainActor; disk writes are atomic.
/// Draft saves are debounced (500 ms) so rapid keystrokes coalesce.
@MainActor
final class Store: ObservableObject {

    // MARK: - Published state

    /// Attempt history + spaced-repetition schedule, keyed by question ID.
    @Published private(set) var progress: [String: QuestionProgress] = [:]
    /// Live answer drafts, keyed by question ID.
    @Published private(set) var drafts: [String: Draft] = [:]

    // MARK: - Private

    private let progressURL: URL
    private let draftsURL:   URL
    private let encoder:     JSONEncoder
    private let decoder:     JSONDecoder
    private var draftSaveTask: Task<Void, Never>?

    // MARK: - Init

    init() {
        let base = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("AIPrep", isDirectory: true)

        progressURL = base.appendingPathComponent("progress.json")
        draftsURL   = base.appendingPathComponent("drafts.json")

        encoder = JSONEncoder()
        encoder.dateEncodingStrategy  = .iso8601
        encoder.outputFormatting      = [.prettyPrinted, .sortedKeys]

        decoder = JSONDecoder()
        decoder.dateDecodingStrategy  = .iso8601

        try? FileManager.default.createDirectory(
            at: base, withIntermediateDirectories: true)

        progress = (try? Self.load(from: progressURL, using: decoder)) ?? [:]
        drafts   = (try? Self.load(from: draftsURL,   using: decoder)) ?? [:]
    }

    // MARK: - Progress queries

    func progress(for questionID: String) -> QuestionProgress {
        progress[questionID] ?? QuestionProgress()
    }

    func status(for questionID: String) -> QuestionStatus {
        let p = progress(for: questionID)
        guard let due = p.dueDate else {
            return p.attempts.isEmpty ? .new : .due
        }
        return due <= Date() ? .due : .scheduled(due)
    }

    /// IDs of questions whose `dueDate` is in the past (or unset but attempted).
    var overdueIDs: Set<String> {
        Set(progress.compactMap { id, p in
            guard let due = p.dueDate else {
                return p.attempts.isEmpty ? nil : id   // unscheduled but seen
            }
            return due <= Date() ? id : nil
        })
    }

    /// Questions sorted by review urgency: overdue/new first, then soonest due.
    func sortedByUrgency(_ questions: [Question]) -> [Question] {
        questions.sorted { urgencyScore($0.id) < urgencyScore($1.id) }
    }

    // MARK: - Draft API

    func draft(for questionID: String) -> Draft {
        drafts[questionID] ?? Draft(questionID: questionID)
    }

    /// Call on every keystroke; debounced flush to disk.
    func saveDraft(_ draft: Draft) {
        drafts[draft.questionID] = draft
        enqueueDraftFlush()
    }

    func clearDraft(for questionID: String) {
        drafts.removeValue(forKey: questionID)
        enqueueDraftFlush()
    }

    // MARK: - Attempt recording

    /// Commits a finished attempt, advances the SM-2 schedule, and clears the
    /// in-flight draft. Returns the persisted `AttemptRecord`.
    @discardableResult
    func recordAttempt(
        questionID:      String,
        grade:           SelfGrade,
        durationSeconds: Int,
        vaultNotePath:   String? = nil
    ) -> AttemptRecord {
        let record = AttemptRecord(
            questionID:      questionID,
            date:            Date(),
            grade:           grade,
            durationSeconds: durationSeconds,
            vaultNotePath:   vaultNotePath
        )

        var p = progress(for: questionID)
        p.attempts.append(record)
        p = advance(p, grade: grade)
        progress[questionID] = p

        // Discard in-flight draft immediately
        draftSaveTask?.cancel()
        drafts.removeValue(forKey: questionID)

        flushProgress()
        flushDrafts()

        return record
    }

    // MARK: - Bulk helpers

    /// Reset all progress and drafts (destructive — for testing / onboarding reset).
    func resetAll() {
        progress = [:]
        drafts   = [:]
        flushProgress()
        flushDrafts()
    }

    // MARK: - SM-2 Scheduling
    //
    // Simplified SM-2: interval in fractional days, capped at 365.
    // grade.again → reset to 1 day
    // grade.hard  → ×1.2 (minimum 1 day)
    // grade.good  → ×2.5 (first review: 3 days)
    // grade.easy  → ×4.0 (first review: 7 days)

    private func advance(_ p: QuestionProgress, grade: SelfGrade) -> QuestionProgress {
        var p  = p
        let iv = p.intervalDays

        switch grade {
        case .again: p.intervalDays = 1
        case .hard:  p.intervalDays = max(1, iv * 1.2)
        case .good:  p.intervalDays = iv < 1 ? 3  : iv * 2.5
        case .easy:  p.intervalDays = iv < 1 ? 7  : iv * 4.0
        }

        p.intervalDays = min(p.intervalDays, 365)
        p.dueDate = Date().addingTimeInterval(p.intervalDays * 86_400)
        return p
    }

    // MARK: - Sorting helpers

    /// Lower = more urgent. Negative = overdue (more negative = more overdue).
    private func urgencyScore(_ id: String) -> Double {
        let p = progress(for: id)
        guard !p.attempts.isEmpty else { return -.infinity }          // new = always first
        guard let due = p.dueDate  else { return 0 }                  // seen, unscheduled
        return due.timeIntervalSinceNow                                // negative if past
    }

    // MARK: - Persistence internals

    private static func load<T: Decodable>(from url: URL, using decoder: JSONDecoder) throws -> T {
        let data = try Data(contentsOf: url)
        return try decoder.decode(T.self, from: data)
    }

    private func flush<T: Encodable>(_ value: T, to url: URL) {
        do {
            let data = try encoder.encode(value)
            try data.write(to: url, options: .atomicWrite)
        } catch {
            print("[Store] ⚠️ Failed to write \(url.lastPathComponent): \(error)")
        }
    }

    private func flushProgress() { flush(progress, to: progressURL) }
    private func flushDrafts()   { flush(drafts,   to: draftsURL)   }

    private func enqueueDraftFlush() {
        draftSaveTask?.cancel()
        draftSaveTask = Task { @MainActor [weak self] in
            try? await Task.sleep(for: .milliseconds(500))
            guard !Task.isCancelled else { return }
            self?.flushDrafts()
        }
    }
}
