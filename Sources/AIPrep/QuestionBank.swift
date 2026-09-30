import Foundation

// MARK: - QuestionBank

/// Loads `questions.json` from the app bundle (or repo `Resources/` during
/// development via `ResourceLocator`) and exposes filtered slices to SwiftUI.
///
/// JSON keys are expected in `snake_case`; `JSONDecoder.convertFromSnakeCase`
/// maps them to the camelCase Swift model properties automatically.
@MainActor
final class QuestionBank: ObservableObject {

    // MARK: Published state

    @Published private(set) var pack: QuestionPack?
    @Published private(set) var loadError: String?

    // MARK: Derived convenience

    var categories: [QuestionCategory] { pack?.categories ?? [] }
    var questions: [Question]          { pack?.questions   ?? [] }
    var isLoaded: Bool                 { pack != nil }

    // MARK: - Init

    init() { reload() }

    // MARK: - Load

    func reload() {
        guard let url = ResourceLocator.url("questions", "json") else {
            loadError = "questions.json not found. "
                      + "Place it in Resources/ (dev) or bundle it with the app."
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            pack      = try decoder.decode(QuestionPack.self, from: data)
            loadError = nil
        } catch {
            loadError = "Failed to decode questions.json: \(error.localizedDescription)"
            pack = nil
        }
    }

    // MARK: - Point queries

    func question(id: String) -> Question? {
        questions.first { $0.id == id }
    }

    func category(id: String) -> QuestionCategory? {
        categories.first { $0.id == id }
    }

    // MARK: - Filtered slices

    func questions(inCategory categoryID: String) -> [Question] {
        questions.filter { $0.category == categoryID }
    }

    func questions(matching filter: QuestionFilter) -> [Question] {
        filter.isEmpty ? questions : questions.filter { filter.matches($0) }
    }

    /// All unique tags across the loaded question set, sorted.
    var allTags: [String] {
        Array(Set(questions.flatMap(\.tags))).sorted()
    }
}

// MARK: - QuestionFilter

/// Value-type predicate; compose and pass to `QuestionBank.questions(matching:)`.
struct QuestionFilter: Equatable {
    var categories:   Set<String>          = []
    var difficulties: Set<Difficulty>      = []
    var formats:      Set<QuestionFormat>  = []
    var tags:         Set<String>          = []
    var searchText:   String               = ""

    var isEmpty: Bool {
        categories.isEmpty
            && difficulties.isEmpty
            && formats.isEmpty
            && tags.isEmpty
            && searchText.trimmingCharacters(in: .whitespaces).isEmpty
    }

    func matches(_ q: Question) -> Bool {
        if !categories.isEmpty,   !categories.contains(q.category)     { return false }
        if !difficulties.isEmpty, !difficulties.contains(q.difficulty)  { return false }
        if !formats.isEmpty,      !formats.contains(q.format)           { return false }
        if !tags.isEmpty,          tags.isDisjoint(with: Set(q.tags))   { return false }
        if !searchText.trimmingCharacters(in: .whitespaces).isEmpty {
            let needle   = searchText.lowercased()
            let haystack = (q.title + " " + q.prompt + " "
                          + q.tags.joined(separator: " ")).lowercased()
            if !haystack.contains(needle) { return false }
        }
        return true
    }
}
