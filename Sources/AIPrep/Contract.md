// MARK: - Contract for subagents
// UI_Scaffolding, ImplementInterviewWorkspace, etc.

// 1. Storage/Bank Interface
// QuestionBank: @MainActor, @Published var pack: QuestionPack?, reload()
// Store: @MainActor, saveDraft(Draft), recordAttempt(AttemptRecord), status(for: String) -> QuestionStatus

// 2. Obsidian Vault Path (macOS specific)
// Detect via: ~/Library/Application Support/obsidian/obsidian.json

// 3. Interview Interface (Speech + Whiteboard)
// SpeechRecognizer: @Published var transcript: String, start(), stop(), appendAndRestart()
// WhiteboardView: NSViewRepresentable, binds to $scene (Binding<String?>), loadScene(String?)

// 4. Integrated Speech-to-Text flow
// InterviewView uses @StateObject var speech = SpeechRecognizer()
// InterviewView uses Button(action: speech.isRecording ? speech.stop() : speech.start())
// InterviewView binding: .onChange(of: speech.transcript) { new in answer = new }
