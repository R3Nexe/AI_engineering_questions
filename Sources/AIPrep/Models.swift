import Foundation

enum QuestionFormat: String, Codable, CaseIterable, Identifiable {
    case short, concept, design
    var id: String { rawValue }
    var label: String {
        switch self {
        case .short: "Quick answer"
        case .concept: "Concept deep-dive"
        case .design: "System design"
        }
    }
    var symbol: String {
        switch self {
        case .short: "bolt"
        case .concept: "brain"
        case .design: "square.3.layers.3d"
        }
    }
}

enum Difficulty: String, Codable, CaseIterable, Identifiable {
    case easy, medium, hard
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

struct QuestionCategory: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    /// SF Symbol name.
    let symbol: String
    let summary: String
}

struct Question: Codable, Identifiable, Hashable {
    let id: String
    let category: String
    let title: String
    /// Markdown. What the interviewer asks.
    let prompt: String
    let format: QuestionFormat
    let difficulty: Difficulty
    let tags: [String]
    /// Markdown. The reference answer revealed after submitting.
    let expectedAnswer: String
    let keyPoints: [String]
    let followUps: [String]
    let sources: [String]
    let timeLimitMinutes: Int
}

struct QuestionPack: Codable {
    let version: Int
    let updated: String
    let categories: [QuestionCategory]
    let questions: [Question]
}

/// In-progress work on a question; autosaved, cleared after a submitted attempt is recorded.
struct Draft: Codable, Equatable {
    var questionID: String
    var answer: String = ""
    var scratchpad: String = ""
    var notes: String = ""
    /// Excalidraw scene JSON (as produced by `serializeAsJSON`).
    var whiteboardScene: String?
    var elapsedSeconds: Int = 0
    var submitted: Bool = false
    var keyPointsHit: [String] = []
}

enum SelfGrade: Int, Codable, CaseIterable, Identifiable {
    case again = 0, hard, good, easy
    var id: Int { rawValue }
    var label: String {
        switch self {
        case .again: "Missed it"
        case .hard: "Shaky"
        case .good: "Solid"
        case .easy: "Nailed it"
        }
    }
}

struct AttemptRecord: Codable, Identifiable, Hashable {
    var id = UUID()
    var questionID: String
    var date: Date
    var grade: SelfGrade
    var durationSeconds: Int
    var vaultNotePath: String?
}

struct QuestionProgress: Codable, Hashable {
    var attempts: [AttemptRecord] = []
    var intervalDays: Double = 0
    var dueDate: Date?
}

enum QuestionStatus: Equatable {
    case new
    case due
    case scheduled(Date)
}

enum SidebarItem: Hashable {
    case daily, due, all, practiced
    case category(String)
}

enum ResourceLocator {
    /// Finds a bundled resource in the .app (Contents/Resources) or, when run via `swift run`, in the repo's Resources/ folder.
    static func url(_ name: String, _ ext: String) -> URL? {
        if let url = Bundle.main.url(forResource: name, withExtension: ext) { return url }
        let repo = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let candidate = repo.appendingPathComponent("Resources/\(name).\(ext)")
        return FileManager.default.fileExists(atPath: candidate.path) ? candidate : nil
    }
}
