import SwiftUI

// MARK: - Workspace tab

private enum WorkspaceTab: String, Hashable, CaseIterable {
    case scratchpad = "Scratchpad"
    case notes      = "Notes"

    var symbol: String {
        switch self {
        case .scratchpad: "scribble"
        case .notes:      "note.text"
        }
    }
}

// MARK: - InterviewView

/// 2-column workspace: Left = answer editor + tabs, Right = whiteboard.
struct InterviewView: View {

    @EnvironmentObject private var store: Store
    @Environment(\.obsidianVaultURL) private var vaultURL

    let question: Question

    // MARK: Timer
    @State private var elapsedSeconds: Int  = 0
    @State private var timerRunning: Bool   = false
    @State private var timerTask: Task<Void, Never>?

    // MARK: Workspace text
    @State private var answer:     String = ""
    @State private var scratchpad: String = ""
    @State private var notes:      String = ""
    @State private var activeTab:  WorkspaceTab = .scratchpad

    // MARK: Whiteboard
    @State private var whiteboardScene: String?

    // MARK: Speech
    @StateObject private var speech = SpeechRecognizer()
    /// Answer text captured at the moment dictation begins; transcript is appended to it.
    @State private var dictationBase: String = ""

    // MARK: Submit / review
    @State private var submitted:    Bool         = false
    @State private var keyPointsHit: Set<String>  = []
    @State private var graded:       Bool         = false
    @State private var lastGrade:    SelfGrade?

    // MARK: Body

    var body: some View {
        HSplitView {
            leftPanel
                .frame(minWidth: 340, idealWidth: 520)
            rightPanel
                .frame(minWidth: 280)
        }
        .onAppear(perform: loadDraft)
        .onDisappear { pauseTimer(); speech.stop() }
        .onChange(of: answer)          { _, _ in autosave() }
        .onChange(of: scratchpad)      { _, _ in autosave() }
        .onChange(of: notes)           { _, _ in autosave() }
        .onChange(of: whiteboardScene) { _, _ in autosave() }
        .onChange(of: keyPointsHit)    { _, _ in autosave() }
        .task { await speech.requestAuthorization() }
        .onChange(of: speech.transcript) { _, newTranscript in
            guard speech.isRecording else { return }
            let sep: String = dictationBase.isEmpty || dictationBase.last == "\n" ? "" : " "
            answer = dictationBase + sep + newTranscript
        }
    }

    // MARK: - Left panel

    private var leftPanel: some View {
        VStack(spacing: 0) {
            headerBar
            Divider()
            VSplitView {
                answerScrollView
                    .frame(minHeight: 200)
                bottomTabs
                    .frame(minHeight: 110, idealHeight: 200)
            }
        }
    }

    // MARK: Header bar

    private var headerBar: some View {
        HStack(spacing: 12) {

            // Question identity
            VStack(alignment: .leading, spacing: 3) {
                Text(question.title)
                    .font(.headline)
                    .lineLimit(1)
                metaBadges
            }

            Spacer(minLength: 8)

            timerWidget

            if !submitted {
                submitButton
            } else if graded, let grade = lastGrade {
                gradeBadge(grade)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.bar)
    }

    private var metaBadges: some View {
        HStack(spacing: 6) {
            badge(question.difficulty.label, color: question.difficulty.color)
            badge(question.format.label,     color: .secondary)
            badge("\(question.timeLimitMinutes) min", color: .secondary)
        }
    }

    // MARK: Timer widget

    private var timerWidget: some View {
        HStack(spacing: 6) {
            Text(formattedTime)
                .font(.system(.body, design: .monospaced).weight(.medium))
                .foregroundStyle(timerForeground)
                .frame(minWidth: 52, alignment: .trailing)
                .animation(.none, value: elapsedSeconds)

            Button {
                toggleTimer()
            } label: {
                Image(systemName: timerRunning ? "pause.fill" : "play.fill")
                    .frame(width: 12, height: 12)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.secondary)
            .disabled(submitted)
            .help(timerRunning ? "Pause timer" : "Resume timer")
        }
    }

    private var formattedTime: String {
        let m = elapsedSeconds / 60
        let s = elapsedSeconds % 60
        return String(format: "%02d:%02d", m, s)
    }

    private var timerForeground: Color {
        if submitted { return .secondary }
        let limit = question.timeLimitMinutes * 60
        if elapsedSeconds >= limit                       { return .red }
        if elapsedSeconds >= Int(Double(limit) * 0.80)  { return .orange }
        return .primary
    }

    // MARK: Submit button

    private var submitButton: some View {
        Button("Submit") {
            submitAnswer()
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.regular)
        .disabled(answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .help("Stop the timer and reveal the expected answer")
    }

    // MARK: - Answer scroll view

    private var answerScrollView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {

                promptCard

                // Your answer label + dictation controls + editor
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Label("Your Answer", systemImage: "pencil")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)

                        // Live recording indicator
                        if speech.isRecording {
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(.red)
                                    .frame(width: 7, height: 7)
                                Text("Active")
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(.red)
                            }
                        }

                        Spacer()

                        // Dictate toggle button
                        Button { toggleDictation() } label: {
                            Label(
                                speech.isRecording ? "Stop" : "Dictate",
                                systemImage: speech.isRecording ? "mic.slash.fill" : "mic"
                            )
                            .font(.subheadline)
                        }
                        .buttonStyle(.bordered)
                        .tint(speech.isRecording ? .red : .accentColor)
                        .disabled(submitted
                            || speech.authStatus == .denied
                            || speech.authStatus == .restricted)
                        .help(speech.isRecording
                            ? "Stop dictation"
                            : "Dictate your answer (speech-to-text)")
                    }

                    ZStack(alignment: .topLeading) {
                        TextEditor(text: $answer)
                            .font(.body)
                            .frame(minHeight: 180)
                            .scrollContentBackground(.hidden)
                            .padding(8)
                            .background(
                                .quaternary.opacity(0.5),
                                in: RoundedRectangle(cornerRadius: 8)
                            )
                            .disabled(submitted)

                        if answer.isEmpty && !submitted {
                            Text("Write your answer here…")
                                .font(.body)
                                .foregroundStyle(.tertiary)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 14)
                                .allowsHitTesting(false)
                        }
                    }
                }

                // Post-submit review panel
                if submitted {
                    reviewSection
                }
            }
            .padding(16)
        }
    }

    // MARK: Prompt card

    private var promptCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Prompt", systemImage: "text.quote")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(question.prompt)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Review section (post-submit)

    @ViewBuilder
    private var reviewSection: some View {
        Divider()

        // Expected answer
        VStack(alignment: .leading, spacing: 8) {
            Label("Expected Answer", systemImage: "checkmark.seal.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.green)
            Text(question.expectedAnswer)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.green.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.green.opacity(0.20), lineWidth: 1)
        )

        // Key-points checklist
        if !question.keyPoints.isEmpty {
            keyPointsChecklist
        }

        // Follow-up questions
        if !question.followUps.isEmpty {
            followUpsSection
        }

        // Self-grade (only if not yet graded)
        if !graded {
            gradeSection
        }

        // Sources
        if !question.sources.isEmpty {
            sourcesSection
        }
    }

    // MARK: Key-points checklist

    private var keyPointsChecklist: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Key Points", systemImage: "list.bullet.clipboard")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                let hit   = keyPointsHit.intersection(Set(question.keyPoints)).count
                let total = question.keyPoints.count
                Text("\(hit) / \(total)")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(hit == total ? .green : .secondary)
                    .monospacedDigit()
            }

            VStack(alignment: .leading, spacing: 5) {
                ForEach(question.keyPoints, id: \.self) { point in
                    KeyPointRow(
                        point:     point,
                        isChecked: keyPointsHit.contains(point)
                    ) {
                        toggleKeyPoint(point)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 10))
    }

    // MARK: Follow-ups

    private var followUpsSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Follow-up Questions", systemImage: "arrow.turn.up.right")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            ForEach(question.followUps, id: \.self) { q in
                Text("• \(q)")
                    .font(.callout)
                    .foregroundStyle(.primary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Self-grade

    private var gradeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Rate Your Answer", systemImage: "star.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            HStack(spacing: 8) {
                ForEach(SelfGrade.allCases) { grade in
                    Button {
                        commitGrade(grade)
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: gradeSymbol(grade))
                                .font(.title3)
                            Text(grade.label)
                                .font(.caption.weight(.medium))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.bordered)
                    .tint(gradeColor(grade))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 10))
    }

    // MARK: Sources

    private var sourcesSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Sources", systemImage: "book.closed")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            ForEach(question.sources, id: \.self) { source in
                if let url = URL(string: source), url.scheme?.hasPrefix("http") == true {
                    Link(source, destination: url)
                        .font(.caption)
                        .lineLimit(1)
                } else {
                    Text(source)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Bottom tabs (Scratchpad / Notes)

    private var bottomTabs: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: 0) {
                ForEach(WorkspaceTab.allCases, id: \.self) { tab in
                    tabButton(tab)
                }
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.top, 4)
            .background(.bar)

            Divider()

            Group {
                switch activeTab {
                case .scratchpad:
                    editorPane(text: $scratchpad, placeholder: "Quick notes, pseudocode, rough ideas…")
                case .notes:
                    editorPane(text: $notes, placeholder: "Permanent notes for review…")
                }
            }
            .transition(.opacity)
            .animation(.easeInOut(duration: 0.15), value: activeTab)
        }
    }

    private func tabButton(_ tab: WorkspaceTab) -> some View {
        Button {
            activeTab = tab
        } label: {
            Label(tab.rawValue, systemImage: tab.symbol)
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    activeTab == tab
                        ? Color.accentColor.opacity(0.12)
                        : .clear,
                    in: RoundedRectangle(cornerRadius: 6)
                )
                .foregroundStyle(activeTab == tab ? Color.accentColor : .secondary)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func editorPane(text: Binding<String>, placeholder: String) -> some View {
        ZStack(alignment: .topLeading) {
            TextEditor(text: text)
                .font(.body)
                .scrollContentBackground(.hidden)
                .padding(8)

            if text.wrappedValue.isEmpty {
                Text(placeholder)
                    .font(.body)
                    .foregroundStyle(.tertiary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 14)
                    .allowsHitTesting(false)
            }
        }
    }

    // MARK: - Right panel (Whiteboard)

    private var rightPanel: some View {
        GeometryReader { geo in
            ZStack(alignment: .topTrailing) {
                WhiteboardView(scene: $whiteboardScene)
                    .frame(width: geo.size.width, height: geo.size.height)
                Label("Whiteboard", systemImage: "pencil.and.outline")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .padding(8)
                    .allowsHitTesting(false)
            }
        }
    }

    // MARK: - Grade result badge (header)

    private func gradeBadge(_ grade: SelfGrade) -> some View {
        HStack(spacing: 4) {
            Image(systemName: gradeSymbol(grade))
                .foregroundStyle(gradeColor(grade))
            Text(grade.label)
                .font(.callout.weight(.medium))
                .foregroundStyle(gradeColor(grade))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(gradeColor(grade).opacity(0.10), in: Capsule())
    }

    // MARK: - Actions

    private func loadDraft() {
        let d       = store.draft(for: question.id)
        answer      = d.answer
        scratchpad  = d.scratchpad
        notes       = d.notes
        elapsedSeconds  = d.elapsedSeconds
        whiteboardScene = d.whiteboardScene
        submitted   = d.submitted
        keyPointsHit = Set(d.keyPointsHit)

        if !submitted {
            startTimer()
        }
    }

    /// Snapshot all mutable state into the Store's draft (debounced disk write).
    private func autosave() {
        var d = store.draft(for: question.id)
        d.answer         = answer
        d.scratchpad     = scratchpad
        d.notes          = notes
        d.elapsedSeconds = elapsedSeconds
        d.whiteboardScene = whiteboardScene
        d.submitted      = submitted
        d.keyPointsHit   = Array(keyPointsHit)
        store.saveDraft(d)
    }

    private func toggleTimer() {
        if timerRunning { pauseTimer() } else { startTimer() }
    }

    private func startTimer() {
        guard !timerRunning, !submitted else { return }
        timerRunning = true
        timerTask?.cancel()
        timerTask = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled else { break }
                elapsedSeconds += 1
                autosave()
            }
        }
    }

    private func pauseTimer() {
        timerRunning = false
        timerTask?.cancel()
        timerTask = nil
    }

    private func submitAnswer() {
        pauseTimer()
        submitted = true
        autosave()
    }

    private func toggleKeyPoint(_ point: String) {
        if keyPointsHit.contains(point) {
            keyPointsHit.remove(point)
        } else {
            keyPointsHit.insert(point)
        }
    }

    private func commitGrade(_ grade: SelfGrade) {
        autosave()                      // flush key-points state before clearing draft
        lastGrade = grade
        graded    = true
        store.recordAttempt(
            questionID:      question.id,
            grade:           grade,
            durationSeconds: elapsedSeconds,
            vaultNotePath:   nil
        )
    }

    // MARK: - Display helpers

    private func badge(_ text: String, color: Color) -> some View {
        Text(text)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.12), in: Capsule())
            .foregroundStyle(color)
    }

    private func gradeColor(_ grade: SelfGrade) -> Color {
        switch grade {
        case .again: .red
        case .hard:  .orange
        case .good:  .blue
        case .easy:  .green
        }
    }

    private func gradeSymbol(_ grade: SelfGrade) -> String {
        switch grade {
        case .again: "xmark.circle"
        case .hard:  "minus.circle"
        case .good:  "checkmark.circle"
        case .easy:  "star.circle.fill"
        }
    }
}

// MARK: - KeyPointRow

private struct KeyPointRow: View {
    let point:     String
    let isChecked: Bool
    let onToggle:  () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isChecked ? .green : .secondary)
                    .font(.body)
                    .frame(width: 18)
                Text(point)
                    .font(.callout)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
    }
}

// MARK: - Actions (dictation)

extension InterviewView {
    private func toggleDictation() {
        if speech.isRecording {
            speech.stop()
        } else {
            dictationBase = answer
            do {
                try speech.start()
            } catch {
                // Microphone unavailable or recognizer offline — silently ignore
            }
        }
    }
}
