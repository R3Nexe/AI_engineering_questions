import SwiftUI


// MARK: - Environment key for vault URL

private struct ObsidianVaultKey: EnvironmentKey {
    static let defaultValue: URL? = nil
}

extension EnvironmentValues {
    /// The resolved Obsidian vault root, or `nil` when no vault was detected.
    var obsidianVaultURL: URL? {
        get { self[ObsidianVaultKey.self] }
        set { self[ObsidianVaultKey.self] = newValue }
    }
}

// MARK: - View-layer display extensions

extension Difficulty {
    var color: Color {
        switch self {
        case .easy:   .green
        case .medium: .orange
        case .hard:   .red
        }
    }
}

extension QuestionStatus {
    var symbol: String {
        switch self {
        case .new:       "sparkle"
        case .due:       "exclamationmark.circle.fill"
        case .scheduled: "clock"
        }
    }
    var tint: Color {
        switch self {
        case .new:       .blue
        case .due:       .orange
        case .scheduled: Color(.tertiaryLabelColor)
        }
    }
}

// MARK: - LibraryView

struct LibraryView: View {
    @EnvironmentObject private var bank:  QuestionBank
    @EnvironmentObject private var store: Store

    @State private var sidebarSelection: SidebarItem? = .daily
    @State private var selectedQuestion: Question?
    @State private var searchText       = ""
    @State private var vaultURL:   URL?

    var body: some View {
        NavigationSplitView {
            SidebarView(selection: $sidebarSelection)
                .navigationSplitViewColumnWidth(min: 200, ideal: 220)
        } content: {
            QuestionListView(
                sidebarItem:      sidebarSelection,
                selectedQuestion: $selectedQuestion,
                searchText:       $searchText
            )
            .navigationTitle(contentTitle)
            .navigationSplitViewColumnWidth(min: 260, ideal: 300)
        } detail: {
            if let q = selectedQuestion {
                InterviewView(question: q)
                    .id(q.id)
            } else {
                EmptySelectionView()
            }
        }
        .navigationSplitViewStyle(.balanced)
        .environment(\.obsidianVaultURL, vaultURL)
        .task {
            vaultURL = ObsidianVaultDetector.detectVaultURL()
        }
        // Respond to menu commands (Practice menu shortcuts)
        .onReceive(NotificationCenter.default.publisher(for: .navigateSidebar)) { note in
            if let item = note.object as? SidebarItem {
                sidebarSelection = item
                selectedQuestion = nil
            }
        }
        // Reset detail pane when the topic changes
        .onChange(of: sidebarSelection) { _, _ in
            selectedQuestion = nil
        }
    }

    private var contentTitle: String {
        switch sidebarSelection {
        case .daily:            "Daily Practice"
        case .due:              "Due Now"
        case .all:              "All Questions"
        case .practiced:        "Practiced"
        case .category(let id): bank.category(id: id)?.name ?? id
        case nil:               "Questions"
        }
    }
}

// MARK: - SidebarView

private struct SidebarView: View {
    @EnvironmentObject private var bank:  QuestionBank
    @EnvironmentObject private var store: Store

    @Binding var selection: SidebarItem?

    var body: some View {
        List(selection: $selection) {
            Section("Practice") {
                sidebarRow(.daily,     "Daily Practice",  "sun.max.fill",                    dailyBadge)
                sidebarRow(.due,       "Due Now",         "clock.badge.exclamationmark.fill", dueBadge)
                sidebarRow(.all,       "All Questions",   "books.vertical.fill",              nil)
                sidebarRow(.practiced, "Practiced",       "checkmark.circle.fill",            nil)
            }

            if !bank.categories.isEmpty {
                Section("Topics") {
                    ForEach(bank.categories) { cat in
                        Label(cat.name, systemImage: cat.symbol)
                            .tag(SidebarItem.category(cat.id))
                    }
                }
            }

            if !bank.isLoaded {
                Section {
                    if let err = bank.loadError {
                        Label(err, systemImage: "exclamationmark.triangle")
                            .font(.caption)
                            .foregroundStyle(.red)
                    } else {
                        Label("Loading…", systemImage: "arrow.trianglehead.2.clockwise")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("AIPrep")
    }

    @ViewBuilder
    private func sidebarRow(
        _ item:   SidebarItem,
        _ label:  String,
        _ icon:   String,
        _ badge:  Int?
    ) -> some View {
        HStack {
            Label(label, systemImage: icon)
            Spacer()
            if let n = badge, n > 0 {
                Text("\(n)")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.red, in: Capsule())
            }
        }
        .tag(item)
    }

    private var dailyBadge: Int? {
        let n = dailyCount
        return n > 0 ? n : nil
    }

    private var dueBadge: Int? {
        let n = store.overdueIDs.count
        return n > 0 ? n : nil
    }

    /// How many questions are in today's session.
    private var dailyCount: Int {
        let overdue = bank.questions.filter { store.overdueIDs.contains($0.id) }
        let new     = bank.questions.filter { store.progress(for: $0.id).attempts.isEmpty }
        return min(10, overdue.count + min(max(0, 10 - overdue.count), new.count))
    }
}

// MARK: - QuestionListView

private struct QuestionListView: View {
    @EnvironmentObject private var bank:  QuestionBank
    @EnvironmentObject private var store: Store

    let sidebarItem: SidebarItem?
    @Binding var selectedQuestion: Question?
    @Binding var searchText: String

    var body: some View {
        Group {
            if filtered.isEmpty && !bank.isLoaded {
                ProgressView("Loading questions…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filtered.isEmpty {
                ContentUnavailableView.search(text: searchText)
            } else {
                List(filtered, id: \.id, selection: $selectedQuestion) { q in
                    QuestionRowView(question: q)
                        .tag(q)
                }
                .listStyle(.inset)
            }
        }
        .searchable(text: $searchText, prompt: "Search questions")
    }

    // MARK: Filtering

    private var filtered: [Question] {
        let base = questionsForSidebar()
        guard !searchText.isEmpty else { return base }
        let filter = QuestionFilter(searchText: searchText)
        return base.filter { filter.matches($0) }
    }

    private func questionsForSidebar() -> [Question] {
        switch sidebarItem {
        case .daily:
            let overdue = bank.questions.filter { store.overdueIDs.contains($0.id) }
            let new     = bank.questions.filter { store.progress(for: $0.id).attempts.isEmpty }
            var session = store.sortedByUrgency(overdue)
            let gap     = max(0, 10 - session.count)
            session    += new.prefix(gap)
            return Array(session.prefix(10))

        case .due:
            return store.sortedByUrgency(
                bank.questions.filter { store.overdueIDs.contains($0.id) })

        case .practiced:
            return bank.questions.filter {
                !store.progress(for: $0.id).attempts.isEmpty
            }

        case .category(let id):
            return bank.questions(inCategory: id)

        case .all, nil:
            return bank.questions
        }
    }
}

// MARK: - QuestionRowView

private struct QuestionRowView: View {
    @EnvironmentObject private var store: Store

    let question: Question

    private var status: QuestionStatus { store.status(for: question.id) }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            // Title + status icon
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(question.title)
                    .font(.body.weight(.medium))
                    .lineLimit(2)
                Spacer(minLength: 6)
                Image(systemName: status.symbol)
                    .font(.caption)
                    .foregroundStyle(status.tint)
            }

            // Metadata strip
            HStack(spacing: 0) {
                difficultyPip
                Text(question.difficulty.label)
                    .foregroundStyle(question.difficulty.color)

                separator

                Image(systemName: question.format.symbol)
                Text(question.format.label)
                    .foregroundStyle(.secondary)

                Spacer(minLength: 4)

                Image(systemName: "clock")
                Text("\(question.timeLimitMinutes) min")
                    .monospacedDigit()
                    .foregroundStyle(Color(.tertiaryLabelColor))
            }
            .font(.caption)
            .imageScale(.small)
        }
        .padding(.vertical, 3)
    }

    private var difficultyPip: some View {
        Circle()
            .fill(question.difficulty.color)
            .frame(width: 6, height: 6)
            .padding(.trailing, 4)
    }

    private var separator: some View {
        Text("·")
            .foregroundStyle(Color(.quaternaryLabelColor))
            .padding(.horizontal, 5)
    }
}

// MARK: - Empty / Placeholder views

private struct EmptySelectionView: View {
    var body: some View {
        ContentUnavailableView(
            "Select a Question",
            systemImage: "doc.text.magnifyingglass",
            description: Text("Pick a question from the list to start practicing.")
        )
    }
}

